import { world, system } from "@minecraft/server";

world.beforeEvents.worldInitialize.subscribe(ffh => {
  const registry = ffh.blockComponentRegistry;

  registry.registerCustomComponent('ff:stair_placement', {
    onPlace: updateStair,
    onTick: updateStair
  });

  function updateStair(e) {
    const { block } = e;
    const neighbors = {
      north: block.north(), south: block.south(),
      east:  block.east(),  west:  block.west()
    };

    const half  = block.permutation.getState('minecraft:vertical_half');
    const shape = block.permutation.getState('ff:shape');
    const dir   = block.permutation.getState('minecraft:cardinal_direction');
    block.setPermutation(block.permutation.withState('ff:placed_bit', true));

    const edgeTag = `ff_stairs_${half === 'bottom' ? 'up' : 'down'}`;

    const layout = {
      north: {
        inner_right: ['south', 'east'], inner_left: ['south', 'west'],
        outer_right: ['north', 'west'], outer_left: ['north', 'east']
      },
      south: {
        inner_left: ['north', 'west'], inner_right: ['north', 'east'],
        outer_right: ['south', 'west'], outer_left: ['south', 'east']
      },
      west: {
        inner_left: ['east', 'south'], inner_right: ['east', 'north'],
        outer_right: ['west', 'north'], outer_left: ['west', 'south']
      },
      east: {
        inner_right: ['west',  'south'], inner_left: ['west',  'north'],
        outer_right: ['east',  'south'], outer_left: ['east',  'north']
      }
    };

    const rules = layout[dir] || {};
    for (const [shapeKey, [nbr, side]] of Object.entries(rules)) {
      const nb = neighbors[nbr];
      const sideTag = `ff_stairs_${side}`;
      const hasEdge = nb.hasTag(edgeTag) && nb.hasTag(sideTag);

      if (shape === 'straight' && hasEdge) {
        block.setPermutation(block.permutation.withState('ff:shape', shapeKey));
        return;
      }
      if (shape === shapeKey && !hasEdge) {
        block.setPermutation(block.permutation.withState('ff:shape', 'straight'));
        return;
      }
    }
  }
});
