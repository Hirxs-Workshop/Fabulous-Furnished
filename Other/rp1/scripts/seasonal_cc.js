import {
  world,
  BlockPermutation,
  ItemStack,
  system
} from '@minecraft/server'

const ANGLES = {
  'north': 180,
  'south': 0,
  'west': 90,
  'east': 270
};

const PUMPKIN_CONFIG = [
  { base: 1, off: 5, on: 6, offEvent: 'sd:pumpkin_var_1_off', onEvent: 'sd:pumpkin_var_1_on' },
  { base: 2, off: 7, on: 8, offEvent: 'sd:pumpkin_var_2_off', onEvent: 'sd:pumpkin_var_2_on' },
  { base: 3, off: 9, on: 10, offEvent: 'sd:pumpkin_var_3_off', onEvent: 'sd:pumpkin_var_3_on' },
  { base: 4, off: 11, on: 12, offEvent: 'sd:pumpkin_var_4_off', onEvent: 'sd:pumpkin_var_4_on' }
];




function updateEquipment(equipment, selectedItem) {
  if (selectedItem.amount > 1) {
    selectedItem.amount--;
    equipment.setEquipment('Mainhand', selectedItem);
  } else {
    equipment.setEquipment('Mainhand', undefined);
  }
}

  world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('sd:leaves_wall_decors_change', {
      onPlayerInteract: e => {
        const { player, block } = e;
        const { x, y, z } = block.location;
        const equipment = player.getComponent('equippable');
        const selectedItem = equipment.getEquipment('Mainhand');
        const decorItem = new ItemStack("sd:leaves_wall_decor");
        const small = block.permutation.withState("sd:size", 1);
        const medium = block.permutation.withState("sd:size", 2);
        const large = block.permutation.withState("sd:size", 3);
        const size = block.permutation.getState("sd:size");
        if (selectedItem && selectedItem.typeId === 'sd:leaves_wall_decor') {
          if (size === 1) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
            player.playSound("random.pop");
            block.setPermutation(medium);
            if (player.getGameMode() !== 'creative') {
              updateEquipment(equipment, selectedItem);
            }
            return;
          }
          if (size === 2) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:large`);
            player.playSound("random.pop");
            block.setPermutation(large);
            if (player.getGameMode() !== 'creative') {
              updateEquipment(equipment, selectedItem);
            }
            return;
          }
        }
        if (player.isSneaking) {
          if (size === 3) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
            player.playSound("random.pop2");
            block.setPermutation(medium);
            block.dimension.spawnItem(decorItem, { x: x + 0.5, y: y + 1, z: z + 0.5 });
            return;
          }
          if (size === 2) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:small`);
            player.playSound("random.pop2");
            block.setPermutation(small);
            block.dimension.spawnItem(decorItem, { x: x + 0.5, y: y + 1, z: z + 0.5 });
            return;
          }
        }
      }
    });

    registerParticleComponent('sd:orange_autumn_leaves_particles', 'onRandomTick', 'sd:orange_autumn_leaves', { x: 0.5, y: -0.1, z: 0.5 });
registerParticleComponent('sd:orange_autumn_leaves_particles_step', 'onStepOn', 'sd:orange_autumn_leaves_step', { x: 0.5, y: -0.1, z: 0.5 });
registerParticleComponent('sd:red_autumn_leaves_particles', 'onRandomTick', 'sd:red_autumn_leaves', { x: 0.5, y: -0.1, z: 0.5 });
registerParticleComponent('sd:red_autumn_leaves_particles_step', 'onStepOn', 'sd:red_autumn_leaves_step', { x: 0.5, y: -0.1, z: 0.5 });
registerParticleComponent('sd:yellow_autumn_leaves_particles', 'onRandomTick', 'sd:yellow_autumn_leaves', { x: 0.5, y: -0.1, z: 0.5 });
registerParticleComponent('sd:yellow_autumn_leaves_particles_step', 'onStepOn', 'sd:yellow_autumn_leaves_step', { x: 0.5, y: -0.1, z: 0.5 });
registerParticleComponent('sd:spicewood_leaves_particles', 'onRandomTick', 'ff:spicewood_leaves', { x: 0.5, y: -0.5, z: 0.5 });
registerParticleComponent('sd:spicewood_leaves_particles_step', 'onStepOn', 'sd:spicewood_leaves_step', { x: 0.5, y: -0.5, z: 0.5 });
    function registerParticleComponent(componentName, eventType, particleName, offset) {
    ffh.blockComponentRegistry.registerCustomComponent(componentName, {
      [eventType]: e => {
        const { block } = e;
        const { x, y, z } = block.location;
        block.dimension.spawnParticle(particleName, {
          x: x + offset.x,
          y: y + offset.y,
          z: z + offset.z
        });
      }
    });
  }

      
createPlaceComponent('sd:place_entity', 'sd:small_pumpkin');
createPlaceComponent('sd:place_entity_2', 'sd:tall_pumpkin');
createPlaceComponent('sd:place_entity_3', 'sd:white_small_pumpkin');
    function createPlaceComponent(name, entity) {
    ffh.blockComponentRegistry.registerCustomComponent(name, {
      onPlace: e => {
        const { block } = e;
        const { x, y, z } = block.location;
        block.setPermutation(block.permutation.withState('sd:types', Math.floor(Math.random() * 4) + 1));
        const rot = block.permutation.getState('minecraft:cardinal_direction');
        const angle = ANGLES[rot] ?? 0;
        block.dimension.runCommand(`summon ${entity} ${x} ${y} ${z} ${angle} 0`);
        }
      });
    }

    createPumpkinChangeComponent('sd:change_type');
    createPumpkinChangeComponent('sd:change_type_2');
        function createPumpkinChangeComponent(name) {
          ffh.blockComponentRegistry.registerCustomComponent(name, {
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
      }
      createCarvedComponent('sd:change_type_3');
      function createCarvedComponent(name) {
        ffh.blockComponentRegistry.registerCustomComponent(name, {
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
      }
  });



function handleLeavesWallDecorsPlace(e) {
  const { block } = e;
  const { x, y, z } = block.location;
  const small = block.permutation.withState("sd:size", 1);
  const blockFace = block.permutation.getState("minecraft:block_face");
  const rotState = block.permutation.getState("sd:rotation");
  let rotation;
  if (rotState === 0) {
    switch (blockFace) {
      case 'south': rotation = 0; break;
      case 'north': rotation = 180; break;
      case 'west': rotation = 90; break;
      case 'east': rotation = -90; break;
      default: rotation = 180;
    }
  } else {
    const mapping = { 1: 200, 2: 225, 3: 250, 4: 270, 5: 290, 6: 315, 7: 335, 8: 0, 9: 25, 10: 45, 11: 70, 12: 90, 13: 115, 14: 135, 15: 160 };
    rotation = mapping[rotState];
  }
  block.setPermutation(small);
  block.dimension.runCommand(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} ${rotation} 0`);
}

world.beforeEvents.worldInitialize.subscribe(ffh => {
  ffh.blockComponentRegistry.registerCustomComponent('sd:leaves_wall_decors_place', {
    onPlace: e => {
      handleLeavesWallDecorsPlace(e);
    }
  });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
  ffh.blockComponentRegistry.registerCustomComponent('sd:wall_decors_change_light', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      const lightsItem = new ItemStack("sd:christmas_lights_block");
      const small = block.permutation.withState("sd:size", 1);
      const medium = block.permutation.withState("sd:size", 2);
      const large = block.permutation.withState("sd:size", 3);
      const size = block.permutation.getState("sd:size");
      if (selectedItem && selectedItem.typeId === 'sd:christmas_lights_block') {
        if (size === 1) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
          player.playSound("random.pop");
          block.setPermutation(medium);
          if (player.getGameMode() !== 'creative') {
            updateEquipment(equipment, selectedItem);
          }
          return;
        }
        if (size === 2) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:large`);
          player.playSound("random.pop");
          block.setPermutation(large);
          if (player.getGameMode() !== 'creative') {
            updateEquipment(equipment, selectedItem);
          }
          return;
        }
      }
      if (player.isSneaking) {
        if (size === 3) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
          player.playSound("random.pop2");
          block.setPermutation(medium);
          block.dimension.spawnItem(lightsItem, { x: x + 0.5, y: y + 1, z: z + 0.5 });
          return;
        }
        if (size === 2) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:small`);
          player.playSound("random.pop2");
          block.setPermutation(small);
          block.dimension.spawnItem(lightsItem, { x: x + 0.5, y: y + 1, z: z + 0.5 });
          return;
        }
      }
    }
  });
});

function handleWallDecorsPlaceLights(e) {
  const { block } = e;
  const { x, y, z } = block.location;
  const small = block.permutation.withState("sd:size", 1);
  const blockFace = block.permutation.getState("minecraft:block_face");
  const rotState = block.permutation.getState("sd:rotation");
  let rotation;
  if (rotState === 0) {
    switch (blockFace) {
      case 'south': rotation = 0; break;
      case 'north': rotation = 180; break;
      case 'west': rotation = 90; break;
      case 'east': rotation = -90; break;
      default: rotation = 180;
    }
  } else {
    const mapping = { 1: 200, 2: 225, 3: 250, 4: 270, 5: 290, 6: 315, 7: 335, 8: 0, 9: 25, 10: 45, 11: 70, 12: 90, 13: 115, 14: 135, 15: 160 };
    rotation = mapping[rotState];
  }
  block.setPermutation(small);
  block.dimension.runCommand(`summon sd:christmas_lights_entity ${x} ${y} ${z} ${rotation} 0`);
}

world.beforeEvents.worldInitialize.subscribe(ffh => {
  ffh.blockComponentRegistry.registerCustomComponent('sd:wall_decors_place_lights', {
    onPlace: e => {
      handleWallDecorsPlaceLights(e);
    }
  });
});

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("sd:advanced_rot_down", {
    beforeOnPlayerPlace(event) {
      const { player } = event;
      if (!player) return;
      const blockFace = event.permutationToPlace.getState("minecraft:block_face");
      if (blockFace !== "down") return;
      const playerYRotation = player.getRotation().y;
      event.permutationToPlace = event.permutationToPlace.withState("sd:rotation", getPreciseRotation(playerYRotation));
    }
  });

  configs.forEach(({ componentName, blockId, stepParticle }) => {
    blockComponentRegistry.registerCustomComponent(componentName, {
onStepOn: (e) => {
  const player = e.entity;
  if (player?.typeId !== "minecraft:player") return;

  const pile       = e.block.permutation.getState("ff:leaves_pile");
  const isSneaking = player.isSneaking;
  const isSprinting= player.isSprinting;
  const isJumping  = player.isJumping;

  if (
    (pile < 6 && !isSprinting && !isJumping) ||
    (pile >= 6 && isSneaking)
  ) return;

  const { x, y, z } = e.block.location;
  const dim = e.dimension;
  dim.runCommandAsync(`setblock ${x} ${y} ${z} air replace`);
  e.entity.playSound("hit.azalea_leaves");

  let count = 1;
  if (pile >= 3 && pile <= 5) count = 2;
  else if (pile >= 6)           count = 3;

  for (let i = 0; i < count; i++) {
    dim.spawnParticle(stepParticle, {
      x: x + 0.5,
      y: y + 0.1,
      z: z + 0.5,
    });
  }
},


      onPlayerInteract: (e) => {
        const { player, block } = e;
        const { x, y, z } = e.block.location;
        const dim = e.dimension;
        const main = player.getComponent("equippable")?.getEquipment("Mainhand");
        if (!main || main.typeId !== blockId) return;
          dim.spawnParticle(stepParticle, {
            x: x + 0.5,
            y: y + 0.1,
            z: z + 0.5,
          });
          e.player.playSound("place.azalea_leaves");
        let pile = block.permutation.getState("ff:leaves_pile");
        if (pile < 7) {
          pile++;
          block.setPermutation(block.permutation.withState("ff:leaves_pile", pile));
        }
      },
    });
  });
});

function getPreciseRotation(playerYRotation) {
  if (playerYRotation < 0) playerYRotation += 360;
  const rotation = Math.round(playerYRotation / 22.5);
  return rotation !== 16 ? rotation : 0;
}


const configs = [
  {
    componentName: "sd:red_step",
    blockId: "sd:red_autumn_leaves_pile",
    stepParticle: "sd:red_autumn_leaves_onstep",
    color: "red",
  },
  {
    componentName: "sd:yellow_step",
    blockId: "sd:yellow_autumn_leaves_pile",
    stepParticle: "sd:yellow_autumn_leaves_onstep",
    color: "yellow",
  },
  {
    componentName: "sd:orange_step",
    blockId: "sd:orange_autumn_leaves_pile",
    stepParticle: "sd:orange_autumn_leaves_onstep",
    color: "orange",
  }
];