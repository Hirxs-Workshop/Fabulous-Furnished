export function registerWaterParticle(registry) {
  registry.registerCustomComponent('ff:water_particle', {
    onTick: e => {
      const { block } = e;
      if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1) {
        block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.5, y: block.location.y + 1.2, z: block.location.z + 0.5 });
      }
    },
  });
} 