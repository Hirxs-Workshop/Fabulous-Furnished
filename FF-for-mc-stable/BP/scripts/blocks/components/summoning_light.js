export function registerSummoningLight(registry) {
  registry.registerCustomComponent("ff:summoning_light", {
    onTick: e => {
      const { block } = e;
      const { x, y, z } = block.location;
      const name = block.typeId.split(":")[1];
      const isFan = name.includes("fan");
      const entityType = isFan
        ? "ff:ff_ceiling_fan"
        : "ff:ff_ceiling_light";
      if (!isFan && block.permutation.getState("ff:lamp_state")) {
        block.dimension.runCommand(
          `particle ff:ff_light_ray ${x} ${y + 0.8} ${z}`
        );
      }
      if (isFan && block.permutation.getState("ff:lamp_state")) {
        block.dimension.runCommand(
          `particle ff:ff_light_ray ${x} ${y + 0} ${z}`
        );
      }
    }
  });
} 