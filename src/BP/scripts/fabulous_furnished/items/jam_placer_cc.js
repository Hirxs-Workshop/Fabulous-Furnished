import { world, BlockPermutation } from "@minecraft/server";
import { updateBlock } from "../utils/block";
import { consumeFromMainhand } from "../utils/item";

function getCardinalFromYaw(yaw) {
  try {
    if (yaw < 0) yaw += 360;
    const a = yaw % 360;
    if (a >= 45 && a < 135) return "east";
    if (a >= 135 && a < 225) return "south";
    if (a >= 225 && a < 315) return "west";
    return "north";
  } catch {
    return "south";
  }
}

function resolveJamType(typeId) {
  if (typeId === "ff:sweet_berries_jam") return "sweet_berries";
  if (typeId === "ff:glow_berries_jam") return "glow_berries";
  return null;
}

world.beforeEvents.worldInitialize.subscribe(initEvent => {
  initEvent.itemComponentRegistry.registerCustomComponent("ff:jam_placer", {
    onUseOn: e => {
      try {
        const player = e.source;
        const block = e.block;
        if (!player || !block) return;

        const eq = player.getComponent("equippable");
        const held = eq?.getEquipment("Mainhand");
        const jamType = resolveJamType(held?.typeId);
        if (!jamType) return;

        const dim = block.dimension;
        const { x, y, z } = block.location;

        const targetPos = { x, y: y + 1, z };
        const target = dim.getBlock(targetPos);
        if (!target || target.typeId !== "minecraft:air") {
          player.playSound("note.bass");
          player.runCommand("title @s actionbar §6(!) Need empty space above to place the jar.");
          return;
        }

        const facing = getCardinalFromYaw(player.getRotation().y);

        updateBlock(target, {
          "ff:has_jam": jamType,
          "ff:fully": 3,
          "minecraft:cardinal_direction": facing
        }, "ff:glass_jar");

        consumeFromMainhand(player);
        player.playSound("step.decorated_pot");
      } catch (err) {
      }
    }
  });
});
