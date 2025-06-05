import { world } from '@minecraft/server';

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry: registry }) => {
  registry.registerCustomComponent('ff:fridge_dual', {
    beforeOnPlayerPlace(e) {
      console.warn('[DEBUG] fridge_dual: beforeOnPlayerPlace ejecutado');
      const { dimension, permutationToPlace } = e;
      const loc = e.block && e.block.location ? e.block.location : (e.location || {});
      const x = loc.x, y = loc.y, z = loc.z;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        console.warn('[DEBUG] fridge_dual: Coordenadas inválidas, cancelando');
        e.cancel = true;
        return;
      }
      const blockAbove = dimension.getBlock({ x, y: y + 1, z });
      if (!blockAbove || blockAbove.typeId !== 'minecraft:air') {
        console.warn('[DEBUG] fridge_dual: Hay un bloque arriba, cancelando');
        e.cancel = true;
        return;
      }
      const player = e.player;
      let cardinal = 'north';
      if (player) {
        const yRot = player.getRotation().y;
        const dirs = ['north', 'east', 'south', 'west'];
        let idx = Math.floor(((yRot % 360) + 360) % 360 / 90 + 0.5) % 4;
        cardinal = dirs[idx];
      }
      e.permutationToPlace = permutationToPlace
        .withState('minecraft:cardinal_direction', cardinal)
        .withState('ff:fridge_bottom', true)
        .withState('ff:fridge_upper', false)
        .withState('ff:fridge_door', false);
      console.warn(`[DEBUG] fridge_dual: Orientación asignada: ${cardinal}`);
    },
    onPlace(e) {
      console.warn('[DEBUG] fridge_dual: onPlace ejecutado');
      const { block } = e;
      const { x, y, z } = block.location;
      if (!block.permutation.getState('ff:fridge_bottom')) return;
      const cardinal = block.permutation.getState('minecraft:cardinal_direction');
      const upperType = block.typeId;
      let displayName = 'Refrigerador';
      if (upperType.includes('fridge_white')) displayName = '§8White fridge';
      else if (upperType.includes('fridge_black')) displayName = '§fBlack fridge';
      const blockAbove = block.dimension.getBlock({ x, y: y + 1, z });
      if (blockAbove && blockAbove.typeId === 'minecraft:air') {
        block.dimension.runCommand(
          `setblock ${x} ${y + 1} ${z} ${upperType} [` +
          `"minecraft:cardinal_direction"="${cardinal}",` +
          `"ff:fridge_bottom"=false,` +
          `"ff:fridge_upper"=true,` +
          `"ff:fridge_door"=false` +
          `]`
        );
        block.dimension.runCommand(
          `summon ff:fridge_inventory ${x + 0.5} ${y + 1.5} ${z + 0.5} 0 0 spawn_adult_melee \"${displayName}\"`
        );
        block.dimension.runCommand(
          `summon ff:fridge_inventory_freezer ${x + 0.5} ${y + 0.5} ${z + 0.5} 0 0 spawn_adult_melee \"freezer_gui\"`
        );
        console.warn('[DEBUG] fridge_dual: Bloque superior y entidades invocados');
      }
    },
    onPlayerInteract(e) {
      console.warn('[DEBUG] fridge_dual: onPlayerInteract ejecutado');
      const { block, player } = e;
      const current = block.permutation.getState('ff:fridge_door');
      block.setPermutation(block.permutation.withState('ff:fridge_door', !current));
      player.playSound(!current ? 'block.barrel.open' : 'block.barrel.close');
    },
    onTick(e) {
      const { block } = e;
      if (block.permutation.getState('ff:fridge_door')) {
        block.setPermutation(block.permutation.withState('ff:fridge_door', false));
      }
    },
    onPlayerDestroy(e) {
      console.warn('[DEBUG] fridge_dual: onPlayerDestroy ejecutado');
      const { block } = e;
      const { x, y, z } = block.location;
      const above = block.dimension.getBlock({ x, y: y + 1, z });
      if (above && above.permutation &&
        (above.permutation.getState('ff:fridge_upper') || above.permutation.getState('ff:fridge_bottom')) &&
        (above.typeId.includes('fridge_white') || above.typeId.includes('fridge_black'))) {
        above.dimension.runCommand(`setblock ${x} ${y + 1} ${z} air`);
      }
      const below = block.dimension.getBlock({ x, y: y - 1, z });
      if (below && below.permutation &&
        (below.permutation.getState('ff:fridge_upper') || below.permutation.getState('ff:fridge_bottom')) &&
        (below.typeId.includes('fridge_white') || below.typeId.includes('fridge_black'))) {
        below.dimension.runCommand(`setblock ${x} ${y - 1} ${z} air`);
      }
    },
    onRandomTick(e) {
      // Puedes agregar más debug aquí si lo necesitas
    }
  });
}); 