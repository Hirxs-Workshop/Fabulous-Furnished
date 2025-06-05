export function registerSwitch(registry) {
  registry.registerCustomComponent("ff:switch", {
    onPlayerInteract: e => {
      const { player, block } = e;
      if (player.isSneaking) {
        e.cancel = true;
        return;
      }
      const inventory = player.getComponent("minecraft:inventory").container;
      const slot = player.selectedSlotIndex;
      const item = (typeof slot === "number" && slot >= 0 && slot < inventory.size)
        ? inventory.getItem(slot)
        : null;
      if (item && item.typeId === "minecraft:breeze_rod") {
        player.playSound("random.pop2");
        return;
      }
      player.playSound("random.click");
      const enable = block.permutation.withState("ff:switch_type", true);
      const disable = block.permutation.withState("ff:switch_type", false);
      if (block.permutation.getState("ff:switch_type") === false) {
        block.setPermutation(enable);
        return;
      }
      if (block.permutation.getState("ff:switch_type") === true) {
        block.setPermutation(disable);
        return;
      }
    }
  });
} 