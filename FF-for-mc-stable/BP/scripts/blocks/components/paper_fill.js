export function registerPaperFill(registry) {
  registry.registerCustomComponent('ff:paper_fill', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const loc = block.location;
      const dim = block.dimension;
      const equip = player.getComponent('equippable');
      const main = equip.getEquipment('Mainhand');
      const state = block.permutation.getState('ff:paper');
      const spawn = (item) => dim.spawnItem(item, { x: loc.x + 0.5, y: loc.y + 1, z: loc.z + 0.5 });
      const paper = new ItemStack('minecraft:paper');
      const tpItem = new ItemStack('ff:toilet_paper_item');
      if (main?.typeId === 'ff:toilet_paper_item' && state === 0) {
        block.setPermutation(block.permutation.withState('ff:paper', 9));
        if (main.amount > 1) {
          main.amount -= 1;
          equip.setEquipment('Mainhand', main);
        } else {
          equip.setEquipment('Mainhand', undefined);
        }
        return;
      }
      if (state > 0) {
        if (player.isSneaking) {
          block.setPermutation(block.permutation.withState('ff:paper', 0));
          spawn(tpItem);
        } else {
          block.setPermutation(block.permutation.withState('ff:paper', state - 1));
          if (state > 1) spawn(paper);
        }
      }
    }
  });
} 