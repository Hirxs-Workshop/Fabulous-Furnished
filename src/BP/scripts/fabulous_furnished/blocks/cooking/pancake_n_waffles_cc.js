import * as server from "@minecraft/server";
import { updateBlock as setBlockState } from "../../utils/block";
import { consumeFromMainhand } from "../../utils/item";

const PancakeMsg = {
  msg(player, parts) {
    try {
      player.sendMessage({ rawtext: parts });
    } catch (e) {
      const text = parts.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("");
      if (text) player.sendMessage(text);
    }
  },
  tr(player, key, withParts = []) {
    try {
      player.sendMessage({ rawtext: [{ translate: key, with: withParts }] });
    } catch (e) {
      player.sendMessage(key);
    }
  },
};

function giveSaturation(player, amplifier = 1) {
  try {
    player.addEffect("saturation", 1, { amplifier, showParticles: false });
  } catch {}
}

server.world.beforeEvents.worldInitialize.subscribe((ev) => {
  ev.blockComponentRegistry.registerCustomComponent("ff:pancake_pile", {
    onPlayerInteract(event) {
      const { block, player } = event;
      if (!player || !block?.isValid?.()) return;

      const state = block.permutation.getAllStates();
      const eq = player.getComponent("minecraft:equippable");
      const held = eq?.getEquipment("Mainhand");
      const heldId = held?.typeId ?? "";

      if (!player.isSneaking && !heldId) {
        PancakeMsg.msg(player, [
          { translate: "ff.pancake.need_item_prefix" },
          { translate: "item.ff:fork.name" },
          { translate: "ff.pancake.need_item_suffix" }
        ]);
        return;
      }

      if (heldId === "ff:maple_syrup") {
        const hasMaple = Boolean(state["ff:has_maple"]);
        if (!hasMaple) {
          setBlockState(block, { "ff:has_maple": true });
          consumeFromMainhand(player);
          try {
            const inv = player.getComponent("minecraft:inventory")?.container;
            const bottle = new server.ItemStack("minecraft:glass_bottle", 1);
            let leftover;
            if (inv) {
              leftover = inv.addItem(bottle);
            } else {
              leftover = bottle;
            }
            if (leftover) {
              block.dimension.spawnItem(leftover, {
                x: block.location.x + 0.5,
                y: block.location.y + 0.5,
                z: block.location.z + 0.5,
              });
            }
          } catch {}
          block.dimension.playSound("land.honey_block", block.location);
          const { x, y, z } = block.location;
          block.dimension.spawnParticle("ff:maple_syrup_effect", {
            x: x + 0.5,
            y: y + 0,
            z: z + 0.5
          });

        }
        return;
      }

      if (heldId === "ff:pancake") {
        if (block.typeId !== "ff:pancake" && block.typeId !== "ff:pancake_dish") return;
        const stack = Number(state["ff:stack"]) || 1;
        if (stack < 3) {
          setBlockState(block, { "ff:stack": stack + 1 });
          consumeFromMainhand(player);
          block.dimension.playSound("fall.cloth", block.location);
          const { x, y, z } = block.location;
          block.dimension.spawnParticle("ff:stack_pan", {
            x: x + 0.5,
            y: y + 0,
            z: z + 0.5
          });
        } else {
          PancakeMsg.tr(player, "ff.pancake.stack_max");
        }
        return;
      }

      if (heldId === "ff:waffle") {
        if (block.typeId !== "ff:waffle" && block.typeId !== "ff:waffle_dish") return;
        const stack = Number(state["ff:stack"]) || 1;
        if (stack < 3) {
          setBlockState(block, { "ff:stack": stack + 1 });
          consumeFromMainhand(player);
          block.dimension.playSound("fall.cloth", block.location);
          const { x, y, z } = block.location;
          block.dimension.spawnParticle("ff:stack_pan", {
            x: x + 0.5,
            y: y + 0,
            z: z + 0.5
          });
        } else {
          PancakeMsg.tr(player, "ff.pancake.stack_max");
        }
        return;
      }

      if (heldId === "ff:fork") {
        const stack = Number(state["ff:stack"]) || 1;
        let slices = Number(state["ff:slices"]) ?? 3;

        if (slices > 0) {
          slices -= 1;
          setBlockState(block, { "ff:slices": slices });
          giveSaturation(player, 1);
          block.dimension.playSound("random.burp", block.location);
          return;
        } 

        if (stack > 1) {
          const newStack = stack - 1;
          setBlockState(block, { "ff:stack": newStack, "ff:slices": 3 });
          giveSaturation(player, 1);
          block.dimension.playSound("random.burp", block.location);
          return;
        }

        giveSaturation(player, 1);
        block.dimension.playSound("fall.cloth", block.location);

        if (block.typeId == "ff:waffle") {
          try {
            block.setPermutation(server.BlockPermutation.resolve("minecraft:air"));
          } catch (e) {
            console.warn("pancake remove error:", e);
          }
          return;
        }

        if (block.typeId == "ff:waffle_dish") {
          try {
            block.setPermutation(server.BlockPermutation.resolve("ff:empty_dish"));
          } catch (e) {
            console.warn("pancake remove error:", e);
          }
          return;
        }

        if (block.typeId == "ff:pancake") {
          try {
            block.setPermutation(server.BlockPermutation.resolve("minecraft:air"));
          } catch (e) {
            console.warn("pancake remove error:", e);
          }
          return;
        }

        if (block.typeId == "ff:pancake_dish") {
          try {
            block.setPermutation(server.BlockPermutation.resolve("ff:empty_dish"));
          } catch (e) {
            console.warn("pancake remove error:", e);
          }
          return;
        }
      }
    },
  });
});
