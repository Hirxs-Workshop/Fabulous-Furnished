import { world, BlockPermutation, ItemStack, system } from '@minecraft/server';

const ANGLES = [180,200,225,250,270,290,315,335,0,25,45,70,90,115,135,160];

const PUMPKIN_CONFIG = [
  { base: 1, off: 5, on: 6, offEvent: 'sd:pumpkin_var_1_off', onEvent: 'sd:pumpkin_var_1_on' },
  { base: 2, off: 7, on: 8, offEvent: 'sd:pumpkin_var_2_off', onEvent: 'sd:pumpkin_var_2_on' },
  { base: 3, off: 9, on: 10, offEvent: 'sd:pumpkin_var_3_off', onEvent: 'sd:pumpkin_var_3_on' },
  { base: 4, off: 11, on: 12, offEvent: 'sd:pumpkin_var_4_off', onEvent: 'sd:pumpkin_var_4_on' }
];

function createPlaceComponent(name, entity) {
  world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(name, {
      onPlace: e => {
        const { block } = e;
        const { x, y, z } = block.location;
        block.setPermutation(block.permutation.withState('sd:types', Math.floor(Math.random() * 4) + 1));
        const rot = block.permutation.getState('fb:rotation');
        const angle = ANGLES[rot] ?? 0;
        block.dimension.runCommand(`summon ${entity} ${x} ${y} ${z} ${angle} 0`);
      }
    });
  });
}

function createPumpkinChangeComponent(name) {
  world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(name, {
      onPlayerInteract: e => {
        const { player, block } = e;
        const { x, y, z } = block.location;
        const item = player.getComponent('equippable').getEquipment('Mainhand');
        const state = block.permutation.getState('sd:types');
        const cfg = PUMPKIN_CONFIG.find(c => c.base === state || c.off === state || c.on === state);
        if (!cfg) return;
        if (item?.typeId === 'minecraft:shears' && state === cfg.base) {
          player.playSound('mob.sheep.shear');
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] ${cfg.offEvent}`);
          block.setPermutation(block.permutation.withState('sd:types', cfg.off));
        } else if (item?.typeId === 'minecraft:flint_and_steel' && state === cfg.off) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] ${cfg.onEvent}`);
          player.playSound('fire.ignite');
          block.setPermutation(block.permutation.withState('sd:types', cfg.on));
        } else if (state === cfg.on) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] ${cfg.offEvent}`);
          player.playSound('extinguish.candle');
          block.setPermutation(block.permutation.withState('sd:types', cfg.off));
        }
      }
    });
  });
}

function createCarvedComponent(name) {
  world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(name, {
      onPlayerInteract: e => {
        const { player, block } = e;
        const { x, y, z } = block.location;
        const item = player.getComponent('equippable').getEquipment('Mainhand');
        const state = block.permutation.getState('sd:types');
        if (item?.typeId === 'minecraft:shears' && state === 0) {
          player.playSound('mob.sheep.shear');
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:carved_pumpkin_off`);
          block.setPermutation(block.permutation.withState('sd:types', 1));
        } else if (item?.typeId === 'minecraft:soul_torch' && state === 1) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:carved_pumpkin_on`);
          player.playSound('fire.ignite');
          block.setPermutation(block.permutation.withState('sd:types', 2));
        } else if (state === 2) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:carved_pumpkin_off`);
          player.playSound('extinguish.candle');
          block.setPermutation(block.permutation.withState('sd:types', 1));
        }
      }
    });
  });
}

createPlaceComponent('sd:place_entity', 'sd:small_pumpkin');
createPlaceComponent('sd:place_entity_2', 'sd:tall_pumpkin');
createPlaceComponent('sd:place_entity_3', 'sd:white_small_pumpkin');
createPumpkinChangeComponent('sd:change_type');
createPumpkinChangeComponent('sd:change_type_2');
createCarvedComponent('sd:change_type_3');

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent('fd:advanced_rotation_v1', {
    beforeOnPlayerPlace(event) {
      const player = event.player;
      if (!player) return;
      if (event.permutationToPlace.getState('minecraft:block_face') !== 'up') return;
      let rot = player.getRotation().y;
      if (rot < 0) rot += 360;
      const rotation = Math.round(rot / 22.5) % 16;
      event.permutationToPlace = event.permutationToPlace.withState('fb:rotation', rotation);
    }
  });
});
