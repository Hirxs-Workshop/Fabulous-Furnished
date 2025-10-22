import * as server from "@minecraft/server";
import { updateBlock as setBlockState, getStates } from "../../utils/block";
import { consumeFromMainhand, giveOrDrop, ItemStack } from "../../utils/item";

// Simple localization helper (pattern from blender_cc.js)
const JarMsg = {
  msg(player, parts) {
    try { player.sendMessage({ rawtext: parts }); }
    catch (e) {
      const text = parts.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("");
      if (text) player.sendMessage(text);
    }
  },
  tr(player, key, withParts = []) {
    try { player.sendMessage({ rawtext: [{ translate: key, with: withParts }] }); }
    catch (e) { player.sendMessage(key); }
  }
};

server.world.beforeEvents.worldInitialize.subscribe((ev) => {
  ev.blockComponentRegistry.registerCustomComponent("ff:glass_jar_cc", {
    onPlayerInteract(event) {
      const { block, player } = event;
      if (!player || !block?.isValid?.()) return;

      const dim = block.dimension;
      const state = getStates(block);
      const eq = player.getComponent("minecraft:equippable");
      const held = eq?.getEquipment("Mainhand");
      const heldId = held?.typeId ?? "";

      const hasCookies = Number(state["ff:has_cookies"]) || 0;
      const jamType = state["ff:has_jam"] || "none";
      const jamLevel = Number(state["ff:fully"]) || 0;

      if (player.isSneaking && !heldId) {
        if (hasCookies > 0 || jamType !== "none") {
          if (hasCookies > 0) {
            try {
              giveOrDrop(player, new ItemStack("minecraft:cookie", hasCookies), block);
            } catch {}
          }
          setBlockState(block, { "ff:has_cookies": 0, "ff:has_jam": "none", "ff:fully": 0 });
          try { dim.playSound("random.pop", block.location); } catch {}
          return;
        }
        return;
      }

      if (!heldId) return;

      const cookiesActive = hasCookies > 0;
      const jamActive = jamType !== "none";

      if (heldId === "ff:glass_jar") {
        if (!jamActive || jamLevel <= 0) {
          JarMsg.tr(player, "ff.jar.no_jam");
          return;
        }
        let jamItemId = null;
        if (jamType === "sweet_berries") jamItemId = "ff:sweet_berries_jam";
        else if (jamType === "glow_berries") jamItemId = "ff:glow_berries_jam";
        if (!jamItemId) return;
        try { giveOrDrop(player, new ItemStack(jamItemId, 1), block); } catch {}
        consumeFromMainhand(player);

        const newLevel = Math.max(0, jamLevel - 1);
        if (newLevel === 0) {
          setBlockState(block, { "ff:fully": 0, "ff:has_jam": "none" });
        } else {
          setBlockState(block, { "ff:fully": newLevel });
        }
        try {
          block.dimension.playSound("step.honey_block", block.location);
        } catch {}
        return;
      }

      if (heldId === "minecraft:cookie") {
        if (jamActive) {
          JarMsg.tr(player, "ff.jar.has_other_inside_hint");
          return;
        }
        if (hasCookies >= 4) {
          JarMsg.tr(player, "ff.jar.max_cookies");
          return;
        }
        setBlockState(block, { "ff:has_cookies": hasCookies + 1 });
        consumeFromMainhand(player);
        try { dim.playSound("fall.cloth", block.location); } catch {}
        return;
      }

      const isSweet = heldId === "ff:sweet_berries_jam";
      const isGlow = heldId === "ff:glow_berries_jam";
      if (isSweet || isGlow) {
        if (cookiesActive) {
          JarMsg.tr(player, "ff.jar.has_cookies_empty_first");
          return;
        }
        const wantedType = isSweet ? "sweet_berries" : "glow_berries";
        if (!jamActive) {
          setBlockState(block, { "ff:has_jam": wantedType, "ff:fully": 1 });
          consumeFromMainhand(player);
          try { dim.playSound("step.honey_block", block.location); } catch {}
          return;
        }
        if (jamType !== wantedType) {
          JarMsg.tr(player, "ff.jar.has_other_inside_hint");
          return;
        }
        if (jamLevel >= 3) {
          JarMsg.tr(player, "ff.jar.max_jam");
          return;
        }
        setBlockState(block, { "ff:fully": jamLevel + 1 });
        consumeFromMainhand(player);
        try { dim.playSound("step.honey_block", block.location); } catch {}
        return;
      }

    },
  });
});
