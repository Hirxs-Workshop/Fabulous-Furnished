export function registerOnPlayerPlace(registry) {
  registry.registerCustomComponent('ff:on_player_place', {
    beforeOnPlayerPlace: e => {
      const { block } = e;
      const { x, y, z } = block.location;
      if (block.typeId.includes("water") || block.typeId.includes("lava")) {
        e.cancel = true;
      } else {
        return;
      }
    }
  });
} 