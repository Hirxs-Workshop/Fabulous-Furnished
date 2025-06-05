export function registerAddNewStackedBook(registry) {
  registry.registerCustomComponent('ff:add_new_stacked_book', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const stacked_book = e.block.permutation.getState("book:state");
      const book_s = block.permutation.withState("book:state", stacked_book + 1);
      const book_remove = block.permutation.withState("book:vertical_stacked", + 1);
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      if (selectedItem && (selectedItem.typeId === 'ff:stacked_books') && block.permutation.getState("book:state") < 3) {
        player.playSound("use.candle");
        block.setPermutation(book_s);
        if (selectedItem.amount > 1) {
          selectedItem.amount -= 1;
          equipment.setEquipment('Mainhand', selectedItem);
        } else {
          equipment.setEquipment('Mainhand', undefined);
        }
        return;
      }
      if (player.isSneaking && block.permutation.getState("book:state") === 3) {
        player.playSound("fall.wood");
        block.setPermutation(book_remove);
        return;
      }
    }
  });
} 