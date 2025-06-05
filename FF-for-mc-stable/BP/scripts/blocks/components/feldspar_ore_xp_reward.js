const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function registerFeldsparOreXpReward(registry) {
  registry.registerCustomComponent("ff:feldspar_ore_xp_reward", {
    onPlayerDestroy({ block, dimension, player }) {
      const xpAmount = randomInt(0, 3);
      for (let i = 0; i < xpAmount; i++) {
        dimension.spawnEntity("minecraft:xp_orb", block.location);
      }
    },
  });
} 