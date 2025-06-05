export function registerSmokeToaster(registry) {
  registry.registerCustomComponent('ff:smoke_toaster', {
    onTick: e => {
      const { player, block } = e;
      if (block.permutation.getState("ff:toaster_with_breads") === 3) {
        block.dimension.spawnParticle("ff:toast_smoke", { x: block.location.x + 0.55, y: block.location.y + 0.5, z: block.location.z + 0.50 });
      }
      if (block.permutation.getState("ff:toaster_with_breads") === 4) {
        block.dimension.spawnParticle("ff:toast_smoke", { x: block.location.x + 0.55, y: block.location.y + 0.5, z: block.location.z + 0.50 });
      }
    },
  });
} 