export function registerSinkOpenClose(registry) {
  registry.registerCustomComponent('ff:sink_open_close', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const sink_open = block.permutation.withState("ff:sink_vars", 1);
      const sink_close = block.permutation.withState("ff:sink_vars", 0);
      if (block.permutation.getState("ff:sink_vars") === 0) {
        block.setPermutation(sink_open);
        player.playSound("mob.axolotl.splash");
        return;
      }
      if (block.permutation.getState("ff:sink_vars") === 1) {
        block.setPermutation(sink_close);
        return;
      }
    },
  });
} 