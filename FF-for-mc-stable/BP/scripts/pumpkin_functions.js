import {
    world,
    BlockPermutation,
    ItemStack, system
  } from '@minecraft/server'
  
  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:place_entity', {
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
        block.setPermutation(block.permutation.withState("sd:types", Math.round(Math.random(1 , 4) * 4)))
        if (block.permutation.getState("fb:rotation") === 0) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 180 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 1) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 200 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 2) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 225 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 3) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 250 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 4) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 270 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 5) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 290 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 6) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 315 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 7) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 335 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 8) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 0 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 9) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 25 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 10) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 45 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 11) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 70 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 12) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 90 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 13) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 115 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 14) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 135 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 15) {
            block.dimension.runCommand(`summon sd:small_pumpkin ${x} ${y} ${z} 160 0`);
            return;
          }
      },
    });
  });
  
  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:change_type', {
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
        const pumpkin_var_1_off = block.permutation.withState("sd:types", 5);
        const pumpkin_var_1_on = block.permutation.withState("sd:types", 6);
        const pumpkin_var_2_off = block.permutation.withState("sd:types", 7);
        const pumpkin_var_2_on = block.permutation.withState("sd:types", 8);
        const pumpkin_var_3_off = block.permutation.withState("sd:types", 9);
        const pumpkin_var_3_on = block.permutation.withState("sd:types", 10);
        const pumpkin_var_4_off = block.permutation.withState("sd:types", 11);
        const pumpkin_var_4_on = block.permutation.withState("sd:types", 12);
        if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 1) {
            player.playSound("mob.sheep.shear")
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_1_off`);
            block.setPermutation(pumpkin_var_1_off);
            return;
          }
          /// with faces
        if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 5) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_1_on`);
          player.playSound("fire.ignite")
          block.setPermutation(pumpkin_var_1_on);
          return;
        }
        if (block.permutation.getState("sd:types") === 6) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_1_off`);
          player.playSound("extinguish.candle")
          block.setPermutation(pumpkin_var_1_off);
          return;
        }
        if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 2) {
          player.playSound("mob.sheep.shear")
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_2_off`);
          block.setPermutation(pumpkin_var_2_off);
          return;
        }
        /// with faces
      if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 7) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_2_on`);
        player.playSound("fire.ignite")
        block.setPermutation(pumpkin_var_2_on);
        return;
      }
      if (block.permutation.getState("sd:types") === 8) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_2_off`);
        player.playSound("extinguish.candle")
        block.setPermutation(pumpkin_var_2_off);
        return;
      }
      if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 3) {
        player.playSound("mob.sheep.shear")
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_3_off`);
        block.setPermutation(pumpkin_var_3_off);
        return;
      }
      /// with faces
    if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 9) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_3_on`);
      player.playSound("fire.ignite")
      block.setPermutation(pumpkin_var_3_on);
      return;
    }
    if (block.permutation.getState("sd:types") === 10) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_3_off`);
      player.playSound("extinguish.candle")
      block.setPermutation(pumpkin_var_3_off);
      return;
      }
      if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 4) {
        player.playSound("mob.sheep.shear")
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_4_off`);
        block.setPermutation(pumpkin_var_4_off);
        return;
      }
      /// with faces
    if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 11) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_4_on`);
      player.playSound("fire.ignite")
      block.setPermutation(pumpkin_var_4_on);
      return;
    }
    if (block.permutation.getState("sd:types") === 12) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_4_off`);
      player.playSound("extinguish.candle")
      block.setPermutation(pumpkin_var_4_off);
      return;
    }
      }
    });
  });

  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:place_entity_2', {
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
        block.setPermutation(block.permutation.withState("sd:types", Math.round(Math.random(1 , 4) * 4)))
        if (block.permutation.getState("fb:rotation") === 0) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 180 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 1) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 200 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 2) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 225 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 3) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 250 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 4) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 270 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 5) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 290 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 6) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 315 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 7) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 335 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 8) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 0 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 9) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 25 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 10) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 45 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 11) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 70 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 12) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 90 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 13) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 115 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 14) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 135 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 15) {
            block.dimension.runCommand(`summon sd:tall_pumpkin ${x} ${y} ${z} 160 0`);
            return;
          }
      },
    });
  });
  

  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:change_type_2', {
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
        const pumpkin_var_1_off = block.permutation.withState("sd:types", 5);
        const pumpkin_var_1_on = block.permutation.withState("sd:types", 6);
        const pumpkin_var_2_off = block.permutation.withState("sd:types", 7);
        const pumpkin_var_2_on = block.permutation.withState("sd:types", 8);
        const pumpkin_var_3_off = block.permutation.withState("sd:types", 9);
        const pumpkin_var_3_on = block.permutation.withState("sd:types", 10);
        const pumpkin_var_4_off = block.permutation.withState("sd:types", 11);
        const pumpkin_var_4_on = block.permutation.withState("sd:types", 12);
        if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 1) {
            player.playSound("mob.sheep.shear")
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_1_off`);
            block.setPermutation(pumpkin_var_1_off);
            return;
          }
          /// with faces
        if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 5) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_1_on`);
          player.playSound("fire.ignite")
          block.setPermutation(pumpkin_var_1_on);
          return;
        }
        if (block.permutation.getState("sd:types") === 6) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_1_off`);
          player.playSound("extinguish.candle")
          block.setPermutation(pumpkin_var_1_off);
          return;
        }
        if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 2) {
          player.playSound("mob.sheep.shear")
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_2_off`);
          block.setPermutation(pumpkin_var_2_off);
          return;
        }
        /// with faces
      if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 7) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_2_on`);
        player.playSound("fire.ignite")
        block.setPermutation(pumpkin_var_2_on);
        return;
      }
      if (block.permutation.getState("sd:types") === 8) {
          block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_2_off`);
        player.playSound("extinguish.candle")
        block.setPermutation(pumpkin_var_2_off);
        return;
      }
      if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 3) {
        player.playSound("mob.sheep.shear")
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_3_off`);
        block.setPermutation(pumpkin_var_3_off);
        return;
      }
      /// with faces
    if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 9) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_3_on`);
      player.playSound("fire.ignite")
      block.setPermutation(pumpkin_var_3_on);
      return;
    }
    if (block.permutation.getState("sd:types") === 10) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_3_off`);
      player.playSound("extinguish.candle")
      block.setPermutation(pumpkin_var_3_off);
      return;
      }
      if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 4) {
        player.playSound("mob.sheep.shear")
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_4_off`);
        block.setPermutation(pumpkin_var_4_off);
        return;
      }
      /// with faces
    if (selectedItem && (selectedItem.typeId === 'minecraft:flint_and_steel') && block.permutation.getState("sd:types") === 11) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_4_on`);
      player.playSound("fire.ignite")
      block.setPermutation(pumpkin_var_4_on);
      return;
    }
    if (block.permutation.getState("sd:types") === 12) {
        block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:pumpkin_var_4_off`);
      player.playSound("extinguish.candle")
      block.setPermutation(pumpkin_var_4_off);
      return;
    }
      }
    });
  });


  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:place_entity_3', {
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
        block.setPermutation(block.permutation.withState("sd:types", Math.round(Math.random(1 , 4) * 4)))
        if (block.permutation.getState("fb:rotation") === 0) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 180 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 1) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 200 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 2) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 225 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 3) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 250 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 4) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 270 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 5) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 290 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 6) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 315 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 7) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 335 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 8) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 0 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 9) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 25 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 10) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 45 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 11) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 70 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 12) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 90 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 13) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 115 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 14) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 135 0`);
            return;
          }
          if (block.permutation.getState("fb:rotation") === 15) {
            block.dimension.runCommand(`summon sd:white_small_pumpkin ${x} ${y} ${z} 160 0`);
            return;
          }
      },
    });
  });
  

  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:change_type_3', {
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
        const pumpkin_var_1_off = block.permutation.withState("sd:types", 1);
        const pumpkin_var_1_on = block.permutation.withState("sd:types", 2);
        if (selectedItem && (selectedItem.typeId === 'minecraft:shears') && block.permutation.getState("sd:types") === 0) {
            player.playSound("mob.sheep.shear")
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:carved_pumpkin_off`);
            block.setPermutation(pumpkin_var_1_off);
            return;
          }
          /// with faces
        if (selectedItem && (selectedItem.typeId === 'minecraft:soul_torch') && block.permutation.getState("sd:types") === 1) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:carved_pumpkin_on`);
          player.playSound("fire.ignite")
          block.setPermutation(pumpkin_var_1_on);
          return;
        }
        if (block.permutation.getState("sd:types") === 2) {
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:carved_pumpkin_off`);
          player.playSound("extinguish.candle")
          block.setPermutation(pumpkin_var_1_off);
          return;
        }
      }
    });
  });
  
  system.beforeEvents.startup.subscribe(({
    blockComponentRegistry
  }) => {
    blockComponentRegistry.registerCustomComponent("fd:advanced_rotation_v1", {
      beforeOnPlayerPlace(event) {
        const {
          player
        } = event;
        if (!player) return;
  
        const blockFace = event.permutationToPlace.getState("minecraft:block_face");
        if (blockFace !== "up") return;
  
        const playerYRotation = player.getRotation().y;
        const rotation = getPreciseRotation(playerYRotation);
  
        event.permutationToPlace = event.permutationToPlace.withState("fb:rotation", rotation);
      }
    });
  });

  function getPreciseRotation(playerYRotation) {
    if (playerYRotation < 0) playerYRotation += 360;
    const rotation = Math.round(playerYRotation / 22.5);
  
    return rotation !== 16 ? rotation : 0;
  }