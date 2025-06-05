export function registerToiletFunction(registry) {
  registry.registerCustomComponent('ff:toilet_function', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const toilet_open = block.permutation.withState("ff:bathroom_vars", 1);
      const toilet_function = block.permutation.withState("ff:bathroom_vars", 2);
      const toilet_close = block.permutation.withState("ff:bathroom_vars", 0);
      if (player.isSneaking && block.permutation.getState("ff:bathroom_vars") === 0) {
        block.setPermutation(toilet_open);
        return;
      }
      if (player.isSneaking && block.permutation.getState("ff:bathroom_vars") === 1) {
        block.setPermutation(toilet_function);
        player.playSound("ff:toilet");
        return;
      }
      if (player.isSneaking && block.permutation.getState("ff:bathroom_vars") === 2) {
        block.setPermutation(toilet_close);
        return;
      }
    }
  });
} 