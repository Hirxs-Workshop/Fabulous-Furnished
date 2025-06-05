import { ItemStack } from '@minecraft/server';

export function registerAddBreads(registry) {
  registry.registerCustomComponent('ff:add_breads', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      const add_bread = block.permutation.withState("ff:toaster_with_breads", 1);
      const add_bread_2 = block.permutation.withState("ff:toaster_with_breads", 2);
      const remove_bread = block.permutation.withState("ff:toaster_with_breads", 0);
      const breadGive = new ItemStack("ff:bread_slice");
      const breadGive2 = new ItemStack("ff:bread_slice");
      if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:bread_slice') && block.permutation.getState("ff:toaster_with_breads") === 0) {
        block.setPermutation(add_bread);
        player.playSound("random.pop");
        if (selectedItem.amount > 1) {
          selectedItem.amount -= 1;
          equipment.setEquipment('Mainhand', selectedItem);
        } else {
          equipment.setEquipment('Mainhand', undefined);
        }
        return;
      }
      if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:bread_slice') && block.permutation.getState("ff:toaster_with_breads") === 1) {
        block.setPermutation(add_bread_2);
        player.playSound("random.pop");
        if (selectedItem.amount > 1) {
          selectedItem.amount -= 1;
          equipment.setEquipment('Mainhand', selectedItem);
        } else {
          equipment.setEquipment('Mainhand', undefined);
        }
        return;
      }
      if (!player.isSneaking && block.permutation.getState("ff:toaster_with_breads") === 2) {
        block.setPermutation(remove_bread);
        player.playSound("random.pop2");
        block.dimension.spawnItem(breadGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
        block.dimension.spawnItem(breadGive2, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
      }
    },
  });
} 