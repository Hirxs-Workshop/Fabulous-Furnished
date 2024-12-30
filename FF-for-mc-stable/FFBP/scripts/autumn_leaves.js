import {
    world,
    BlockPermutation,
    ItemStack
  } from '@minecraft/server'
  
  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:orange_autumn_leaves_particles', {
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.spawnParticle("sd:orange_autumn_leaves", { x: block.location.x + 0.5, y: block.location.y - 0.1, z: block.location.z + 0.5 });


        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:orange_autumn_leaves_particles_step', {
      onStepOn: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        block.dimension.spawnParticle("sd:orange_autumn_leaves_step", { x: block.location.x + 0.5, y: block.location.y - 0.1, z: block.location.z + 0.5 });
      }
    });
  });

  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:red_autumn_leaves_particles', {
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.spawnParticle("sd:red_autumn_leaves", { x: block.location.x + 0.5, y: block.location.y - 0.1, z: block.location.z + 0.5 });


        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:red_autumn_leaves_particles_step', {
      onStepOn: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        block.dimension.spawnParticle("sd:red_autumn_leaves_step", { x: block.location.x + 0.5, y: block.location.y - 0.1, z: block.location.z + 0.5 });
      }
    });
  });

  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:yellow_autumn_leaves_particles', {
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.spawnParticle("sd:yellow_autumn_leaves", { x: block.location.x + 0.5, y: block.location.y - 0.1, z: block.location.z + 0.5 });


        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:yellow_autumn_leaves_particles_step', {
      onStepOn: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        block.dimension.spawnParticle("sd:yellow_autumn_leaves_step", { x: block.location.x + 0.5, y: block.location.y - 0.1, z: block.location.z + 0.5 });
      }
    });
  });

  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:leaves_wall_decors_change', {
      onPlayerInteract: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        const equipment = player.getComponent('equippable');
        const selectedItem = equipment.getEquipment('Mainhand');
        const leaves_wall_decor_item = new ItemStack("sd:leaves_wall_decor");
        const small = block.permutation.withState("sd:size", 1);
        const medium = block.permutation.withState("sd:size", 2);
        const large = block.permutation.withState("sd:size", 3);
        if (selectedItem && (selectedItem.typeId === 'sd:leaves_wall_decor') && block.permutation.getState("sd:size") === 1) {
            block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
            player.playSound("random.pop")
            block.setPermutation(medium);
            if (selectedItem.amount > 1) {
              selectedItem.amount -= 1;
              equipment.setEquipment('Mainhand', selectedItem);
            } else {
              equipment.setEquipment('Mainhand', undefined);
            }
            return;
          }
        if (selectedItem && (selectedItem.typeId === 'sd:leaves_wall_decor') && block.permutation.getState("sd:size") === 2) {
          block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:large`);
          player.playSound("random.pop")
          block.setPermutation(large);
          if (selectedItem.amount > 1) {
            selectedItem.amount -= 1;
            equipment.setEquipment('Mainhand', selectedItem);
          } else {
            equipment.setEquipment('Mainhand', undefined);
          }
          return;
        }
        if (player.isSneaking && block.permutation.getState("sd:size") === 3) {
          block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
          player.playSound("random.pop2")
          block.setPermutation(medium);
          block.dimension.spawnItem(leaves_wall_decor_item, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
          return;
        }
      if (player.isSneaking && block.permutation.getState("sd:size") === 2) {
        block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:small`);
        player.playSound("random.pop2")
        block.setPermutation(small);
        block.dimension.spawnItem(leaves_wall_decor_item, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
        return;
      }
      }
    });
  });

  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:leaves_wall_decors_place', {
      onPlace: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        const small = block.permutation.withState("sd:size", 1);
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'south') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 0 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'north') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 180 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'west') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 90 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'east') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} -90 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0) {
            block.setPermutation(small);
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 180 0`);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 1) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 200 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 2) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 225 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 3) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 250 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 4) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 270 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 5) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 290 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 6) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 315 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 7) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 335 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 8) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 0 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 9) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 25 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 10) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 45 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 11) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 70 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 12) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 90 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 13) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 115 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 14) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 135 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 15) {
            block.dimension.runCommandAsync(`summon sd:leaves_wall_decor_entity ${x} ${y} ${z} 160 0`);
            block.setPermutation(small);
            return;
          }
      },
    });
  });

  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:wall_decors_change_light', {
      onPlayerInteract: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        const equipment = player.getComponent('equippable');
        const selectedItem = equipment.getEquipment('Mainhand');
        const wall_decor_item = new ItemStack("sd:christmas_lights_block");
        const small = block.permutation.withState("sd:size", 1);
        const medium = block.permutation.withState("sd:size", 2);
        const large = block.permutation.withState("sd:size", 3);
        if (selectedItem && (selectedItem.typeId === 'sd:christmas_lights_block') && block.permutation.getState("sd:size") === 1) {
            block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
            player.playSound("random.pop")
            block.setPermutation(medium);
            if (selectedItem.amount > 1) {
              selectedItem.amount -= 1;
              equipment.setEquipment('Mainhand', selectedItem);
            } else {
              equipment.setEquipment('Mainhand', undefined);
            }
            return;
          }
        if (selectedItem && (selectedItem.typeId === 'sd:christmas_lights_block') && block.permutation.getState("sd:size") === 2) {
          block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:large`);
          player.playSound("random.pop")
          block.setPermutation(large);
          if (selectedItem.amount > 1) {
            selectedItem.amount -= 1;
            equipment.setEquipment('Mainhand', selectedItem);
          } else {
            equipment.setEquipment('Mainhand', undefined);
          }
          return;
        }
        if (player.isSneaking && block.permutation.getState("sd:size") === 3) {
          block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:medium`);
          player.playSound("random.pop2")
          block.setPermutation(medium);
          block.dimension.spawnItem(wall_decor_item, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
          return;
        }
      if (player.isSneaking && block.permutation.getState("sd:size") === 2) {
        block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:small`);
        player.playSound("random.pop2")
        block.setPermutation(small);
        block.dimension.spawnItem(wall_decor_item, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
        return;
      }
      }
    });
  });

  world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:wall_decors_place_lights', {
      onPlace: e => {
        const {
          player,
          block,
          entity
        } = e;
        const {
          x,
          y,
          z
        } = block.location;
        const small = block.permutation.withState("sd:size", 1);
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'south') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 0 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'north') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 180 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'west') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 90 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0 && block.permutation.getState("minecraft:block_face") === 'east') {
          block.setPermutation(small);
          block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} -90 0`);
          return;
        }
        if (block.permutation.getState("sd:rotation") === 0) {
            block.setPermutation(small);
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 180 0`);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 1) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 200 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 2) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 225 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 3) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 250 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 4) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 270 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 5) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 290 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 6) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 315 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 7) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 335 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 8) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 0 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 9) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 25 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 10) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 45 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 11) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 70 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 12) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 90 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 13) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 115 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 14) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 135 0`);
            block.setPermutation(small);
            return;
          }
          if (block.permutation.getState("sd:rotation") === 15) {
            block.dimension.runCommandAsync(`summon sd:christmas_lights_entity ${x} ${y} ${z} 160 0`);
            block.setPermutation(small);
            return;
          }
      },
    });
  });

  world.beforeEvents.worldInitialize.subscribe(({
    blockComponentRegistry
  }) => {
    blockComponentRegistry.registerCustomComponent("sd:advanced_rot_down", {
      beforeOnPlayerPlace(event) {
        const {
          player
        } = event;
        if (!player) return;
  
        const blockFace = event.permutationToPlace.getState("minecraft:block_face");
        if (blockFace !== "down") return;

  
        const playerYRotation = player.getRotation().y;
        const rotation = getPreciseRotation(playerYRotation);
  
        event.permutationToPlace = event.permutationToPlace.withState("sd:rotation", rotation);
      }
    });
  });
  

  function getPreciseRotation(playerYRotation) {
    if (playerYRotation < 0) playerYRotation += 360;
    const rotation = Math.round(playerYRotation / 22.5);
  
    return rotation !== 16 ? rotation : 0;
  }