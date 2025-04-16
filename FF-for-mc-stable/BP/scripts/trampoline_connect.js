import { world, system } from '@minecraft/server';

system.beforeEvents.startup.subscribe(eventData => {

  eventData.blockComponentRegistry.registerCustomComponent('ff:trampoline_connect', {
    onTick(e) {
      const { block } = e;
      const north = block.north();
      const east = block.east();
      const south = block.south();
      const west = block.west();
      if (north?.typeId === block.typeId) block.setPermutation(block.permutation.withState('ff:south_block_connection', north ? 1 : 0));
      else block.setPermutation(block.permutation.withState('ff:south_block_connection', 0));

      if (south?.typeId === block.typeId) block.setPermutation(block.permutation.withState('ff:north_block_connection', south ? 1 : 0));
      else block.setPermutation(block.permutation.withState('ff:north_block_connection', 0));

      if (east?.typeId === block.typeId) block.setPermutation(block.permutation.withState('ff:west_block_connection', east ? 1 : 0));
      else block.setPermutation(block.permutation.withState('ff:west_block_connection', 0));

      if (west?.typeId === block.typeId) block.setPermutation(block.permutation.withState('ff:east_block_connection', west ? 1 : 0));
      else block.setPermutation(block.permutation.withState('ff:east_block_connection', 0));
    }
  });
});
