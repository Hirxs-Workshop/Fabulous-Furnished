import { ItemStack } from '@minecraft/server';

export function registerSlabSpicewoodOnPlayerDestroy(registry) {
  registry.registerCustomComponent('ff:slab_spicewood_on_player_destroy', {
    onPlayerDestroy(e) {
      const { block, player } = e;
      if (!player || !player.getComponent('equippable')) {
        return;
      }
      const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
      const isPickaxe = selectedItem && selectedItem.hasTag('minecraft:is_axe');
      if (isPickaxe) {
        const slabItem = new ItemStack('ff:spicewood_slab', 1);
        e.dimension.spawnItem(slabItem, block.location);
      }
    }
  });
}

export function registerSlabSpicewoodOnInteract(registry) {
  registry.registerCustomComponent('ff:slab_spicewood_on_interact', {
    onPlayerInteract(e) {
      const { block, player, face } = e;
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      if (selectedItem?.typeId === 'ff:spicewood_slab' && !block.permutation.getState('ff:double')) {
        const verticalHalf = block.permutation.getState('minecraft:vertical_half');
        const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
        const isTopDown = verticalHalf === 'top' && face === 'Down';
        if (isBottomUp || isTopDown) {
          if (player.getGameMode() !== "creative") {
            selectedItem.amount -= 1;
            if (selectedItem.amount === 0) {
              equipment.setEquipment('Mainhand', undefined);
            } else {
              equipment.setEquipment('Mainhand', selectedItem);
            }
          }
          block.setPermutation(block.permutation.withState('ff:double', true));
          block.setWaterlogged(false);
          player.playSound('use.wood');
        }
      }
    }
  });
} 