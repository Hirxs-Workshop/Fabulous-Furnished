export function registerTrashItems(registry) {
  registry.registerCustomComponent('ff:trash_items', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      if (!player.isSneaking && selectedItem) {
        player.playSound("random.pop2");
        if (selectedItem.amount > 1) {
          selectedItem.amount -= 1;
          equipment.setEquipment('Mainhand', selectedItem);
        } else {
          equipment.setEquipment('Mainhand', undefined);
        }
        return;
      }
    }
  });
} 