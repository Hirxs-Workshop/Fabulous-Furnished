import { ItemStack } from "@minecraft/server";

export function consumeEquipped(equippable, item) {
  if (!equippable || !item) return;
  if (item.amount > 1) {
    item.amount--;
    equippable.setEquipment("Mainhand", item);
  } else {
    equippable.setEquipment("Mainhand", undefined);
  }
}

export function consumeFromMainhand(player) {
  try {
    const eq = player.getComponent("minecraft:equippable");
    const item = eq?.getEquipment("Mainhand");
    if (!item) return;
    consumeEquipped(eq, item);
  } catch {}
}

export function giveOrDrop(player, itemStack, fallbackLocation) {
  try {
    const inv = player.getComponent("minecraft:inventory")?.container;
    const leftover = inv?.addItem(itemStack);
    if (leftover) {
      const dim = player.dimension ?? fallbackLocation?.dimension;
      const loc = fallbackLocation?.location ?? player.location;
      dim?.spawnItem(leftover, { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 });
    }
  } catch {}
}

export { ItemStack };
