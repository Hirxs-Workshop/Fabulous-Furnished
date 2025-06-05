export function registerFridgeDual(registry) {
  registry.registerCustomComponent('ff:fridge_dual', {
    beforeOnPlayerPlace(e) {
      const { dimension, permutationToPlace } = e;
      const loc = e.block && e.block.location ? e.block.location : (e.location || {});
      const x = loc.x, y = loc.y, z = loc.z;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        e.cancel = true;
        return;
      }
      const blockAbove = dimension.getBlock({ x, y: y + 1, z });
      if (!blockAbove || blockAbove.typeId !== 'minecraft:air') {
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
    },
    onPlace(e) {
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
      }
    },
    onPlayerInteract(e) {
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
      const { block } = e;
      const { x, y, z } = block.location;
      const entities = block.dimension.getEntities({
        type: 'ff:fridge_inventory_freezer',
        location: { x: x + 0.5, y: y + 0.5, z: z + 0.5 },
        maxDistance: 2
      });
      const freezeMap = {
        'minecraft:beef': 'ff:frozen_beef_raw',
        'minecraft:porkchop': 'ff:frozen_porkchop_raw',
        'minecraft:rabbit': 'ff:frozen_rabbit_raw',
        'minecraft:chicken': 'ff:frozen_chicken_raw',
        'minecraft:mutton': 'ff:frozen_mutton_raw',
        'minecraft:salmon': 'ff:frozen_fish_salmon_raw',
        'minecraft:cod': 'ff:frozen_fish_raw',
        'minecraft:tropical_fish': 'ff:frozen_fish_clownfish_raw',
        'minecraft:ice': 'minecraft:packed_ice',
        'minecraft:water_bucket': 'minecraft:ice',
        'minecraft:lava_bucket': 'minecraft:obsidian',
      };
      for (const entity of entities) {
        let found = false;
        for (let dx = -1; dx <= 1 && !found; dx++) {
          for (let dy = -1; dy <= 1 && !found; dy++) {
            for (let dz = -1; dz <= 1 && !found; dz++) {
              const bx = Math.floor(entity.location.x) + dx;
              const by = Math.floor(entity.location.y) + dy;
              const bz = Math.floor(entity.location.z) + dz;
              const nearBlock = block.dimension.getBlock({ x: bx, y: by, z: bz });
              if (
                nearBlock &&
                nearBlock.typeId.startsWith('ff:fridge_') &&
                nearBlock.permutation &&
                nearBlock.permutation.getState &&
                nearBlock.permutation.getState('ff:fridge_bottom')
              ) {
                found = true;
              }
            }
          }
        }
        if (!found) continue;
        const inv = entity.getComponent && entity.getComponent("inventory");
        if (inv && inv.container) {
          for (let slot = 0; slot < 5; slot++) {
            const item = inv.container.getItem(slot);
            if (item && freezeMap[item.typeId]) {
              block.dimension.runCommand(
                `execute at @e[type=ff:fridge_inventory_freezer] positioned ${x} ${y} ${z} run replaceitem entity @e[type=ff:fridge_inventory_freezer,r=1] slot.inventory ${slot} ${freezeMap[item.typeId]}`
              );
            }
          }
        }
      }
    }
  });
} 