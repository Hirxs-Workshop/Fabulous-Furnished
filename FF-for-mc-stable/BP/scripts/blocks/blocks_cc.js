import { world, system, BlockPermutation, ItemStack, GameMode } from '@minecraft/server'

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("ff:switch", {
        onPlayerInteract: e => {
            const { player, block } = e;

            if (player.isSneaking) {
                e.cancel = true;
                return;
            }

            const inventory = player.getComponent("minecraft:inventory").container;
            const slot = player.selectedSlotIndex;
            const item = (typeof slot === "number" && slot >= 0 && slot < inventory.size)
                ? inventory.getItem(slot)
                : null;

            if (item && item.typeId === "minecraft:breeze_rod") {
                player.playSound("random.pop2");
                return;
            }

            player.playSound("random.click");
            const enable = block.permutation.withState("ff:switch_type", true);
            const disable = block.permutation.withState("ff:switch_type", false);

            if (block.permutation.getState("ff:switch_type") === false) {
                block.setPermutation(enable);
                return;
            }
            if (block.permutation.getState("ff:switch_type") === true) {
                block.setPermutation(disable);
                return;
            }
        }
    });

    blockComponentRegistry.registerCustomComponent("ff:single_interactive", {
    onPlayerInteract: e => {
        const { player, block } = e;
        player.playSound("random.click");
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:toilet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const toilet_open = block.permutation.withState("ff:bathroom_vars", 1);
            const toilet_function = block.permutation.withState("ff:bathroom_vars", 2);
            const toilet_close = block.permutation.withState("ff:bathroom_vars", 0);
            if (player.isSneaking && block.permutation.getState("ff:bathroom_vars") === 0) {
                block.setPermutation(toilet_open);
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:bathroom_vars") === 1) {
                block.setPermutation(toilet_function);
                player.playSound("ff:toilet");
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:bathroom_vars") === 2) {
                block.setPermutation(toilet_close);
                return;
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:on_player_place', {
        beforeOnPlayerPlace: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            if (block.typeId.includes("water") || block.typeId.includes("lava")) {
                e.cancel = true;
            }
            else {
                return;
            }
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(ffh => {
    const registry = ffh.blockComponentRegistry;

    registry.registerCustomComponent("ff:summoning_light", {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;

            const name = block.typeId.split(":")[1];
            const isFan = name.includes("fan");
            const entityType = isFan
                ? "ff:ff_ceiling_fan"
                : "ff:ff_ceiling_light";

            const cx = x + 0.5;
            const cy = isFan ? y - 0 : y;
            const cz = z + 0.5;

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
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:paper_fill', {
      onPlayerInteract: e => {
        const { player, block } = e;
        const loc = block.location;
        const dim = block.dimension;
        const equip = player.getComponent('equippable');
        const main = equip.getEquipment('Mainhand');
        const state = block.permutation.getState('ff:paper');
  
        const spawn = (item) => dim.spawnItem(item, { x: loc.x + 0.5, y: loc.y + 1, z: loc.z + 0.5 });
        const paper = new ItemStack('minecraft:paper');
        const tpItem = new ItemStack('ff:toilet_paper_item');
  
        if (main?.typeId === 'ff:toilet_paper_item' && state === 0) {
          block.setPermutation(block.permutation.withState('ff:paper', 9));
          if (main.amount > 1) {
            main.amount -= 1;
            equip.setEquipment('Mainhand', main);
          } else {
            equip.setEquipment('Mainhand', undefined);
          }
          return;
        }
  
        if (state > 0) {
          if (player.isSneaking) {
            block.setPermutation(block.permutation.withState('ff:paper', 0));
            spawn(tpItem);
          } else {
            block.setPermutation(block.permutation.withState('ff:paper', state - 1));
            if (state > 1) spawn(paper);
          }
        }
      }
    });

        ffh.blockComponentRegistry.registerCustomComponent('ff:add_new_stacked_book', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const stacked_book = e.block.permutation.getState("book:state");
            const book_s = block.permutation.withState("book:state", stacked_book + 1);
            const book_remove = block.permutation.withState("book:vertical_stacked", + 1);
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && (selectedItem.typeId === 'ff:stacked_books') && block.permutation.getState("book:state") < 3) {
                player.playSound("use.candle");
                block.setPermutation(book_s);
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                return;
            }
            if (player.isSneaking && block.permutation.getState("book:state") === 3) {
                player.playSound("fall.wood");
                block.setPermutation(book_remove);
                return;

            }
        }
    });
        ffh.blockComponentRegistry.registerCustomComponent('ff:sink_open_close', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const sink_open = block.permutation.withState("ff:sink_vars", 1);
            const sink_close = block.permutation.withState("ff:sink_vars", 0);
            if (block.permutation.getState("ff:sink_vars") === 0) {
                block.setPermutation(sink_open);
                player.playSound("mob.axolotl.splash");
                return;
            }
            if (block.permutation.getState("ff:sink_vars") === 1) {
                block.setPermutation(sink_close);
                return;
            }
        },
    });

        ffh.blockComponentRegistry.registerCustomComponent('ff:trash_items', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');

            if (!player.isSneaking && selectedItem) {
                player.playSound("random.pop2");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                return;
            }
        }
    });
  });
  



// New dynamic weather system - thanks to Reda karimi for the help!
world.beforeEvents.weatherChange.subscribe(({ newWeather }) => {
    system.run(() => {
        world.setDynamicProperty("ff:dynamic_weather_system", newWeather);
    });
});

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry: registry }) => {

    registry.registerCustomComponent("ff:tv_weather_channel", {
        onTick({ block }) {
            const current = block.permutation.getState("ff:channels");
            const perms = {
                clear:   block.permutation.withState("ff:channels", 1),
                rain:    block.permutation.withState("ff:channels", 2),
                thunder: block.permutation.withState("ff:channels", 3),
                snow:    block.permutation.withState("ff:channels", 4),
            };
            const weather = world.getDynamicProperty("ff:dynamic_weather_system");

            if (weather === "Rain"    && (current === 1 || current === 3)) block.setPermutation(perms.rain);
            else if (weather === "Thunder" && (current === 1 || current === 2)) block.setPermutation(perms.thunder);
            else if (weather === "Snow"    &&  current === 1)                      block.setPermutation(perms.snow);
            else if (weather === "Clear"   && (current >= 2 && current <= 4))      block.setPermutation(perms.clear);
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
    const woodTypes = [
        'jungle','birch','crimson','warped',
        'cherry','mangrove','oak','dark_oak',
        'acacia','pale','spruce','cinder','spicewood', 'maple'
    ];
    const directions = ['north','south','east','west'];

    woodTypes.forEach(type => {
        ffh.blockComponentRegistry.registerCustomComponent(
            `ff:${type}_add_couch`,
            {
                onPlayerInteract: e => {
                    const { player, block } = e;
                    const { x, y, z } = block.location;
                    const equip = player.getComponent('equippable');
                    const item = equip.getEquipment('Mainhand');

                    if (player.isSneaking || !item || item.typeId !== 'ff:white_cushion') return;

                    player.playSound('hit.cloth');
                    block.dimension.spawnParticle('ff:cushion_effect', {
                        x: x + 0.5,
                        y: y + 0.5,
                        z: z + 0.5
                    });

                    if (player.getGameMode() !== GameMode.creative) {
                        if (item.amount > 1) {
                            item.amount -= 1;
                            equip.setEquipment('Mainhand', item);
                        } else {
                            equip.setEquipment('Mainhand', undefined);
                        }
                    }

                    directions.forEach(dir => {
                        block.dimension.runCommand(
                            `fill ${x} ${y} ${z} ${x} ${y} ${z}` +
                            ` ff:wooden_${type}_chair_with_wool` +
                            `["minecraft:cardinal_direction"="${dir}"]` +
                            ` replace ff:wooden_${type}_chair` +
                            `["minecraft:cardinal_direction"="${dir}"]`
                        );
                    });
                }
            }
        );
    });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
    const woodTypes  = [
        'jungle','birch','crimson','warped',
        'cherry','mangrove','oak','dark_oak',
        'acacia','pale','spruce','cinder','spicewood', 'maple'
    ];
    const directions = ['north','south','east','west','up'];

    woodTypes.forEach(type => {
        ffh.blockComponentRegistry.registerCustomComponent(
            `ff:stool_${type}_add_couch`,
            {
                onPlayerInteract(e) {
                    const { player, block } = e;
                    if (player.isSneaking) return;

                    const equip = player.getComponent('equippable');
                    const item  = equip.getEquipment('Mainhand');
                    if (!item || item.typeId !== 'ff:white_cushion') return;

                    player.playSound('hit.cloth');
                    block.dimension.spawnParticle('ff:cushion_effect', {
                        x: block.location.x + 0.5,
                        y: block.location.y + 0.5,
                        z: block.location.z + 0.5
                    });

                    // Only consume cushion in Survival
                    if (player.getGameMode() !== GameMode.creative) {
                        if (item.amount > 1) {
                            item.amount--;
                            equip.setEquipment('Mainhand', item);
                        } else {
                            equip.setEquipment('Mainhand', undefined);
                        }
                    }

                    const placement = block.permutation.getState('minecraft:cardinal_direction');
                    const { x, y, z } = block.location;

                    directions.forEach(dir => {
                        block.dimension.runCommand(
                            `fill ${x} ${y} ${z} ${x} ${y} ${z}` +
                            ` ff:wooden_${type}_stool_with_wool[` +
                                `"minecraft:cardinal_direction"="${dir}"` +
                            `] replace ff:wooden_${type}_stool[` +
                                `"minecraft:cardinal_direction"="${dir}"` +
                            `]`
                        );
                    });
                }
            }
        );
    });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
    const woodTypes = [
      'jungle','birch','crimson','warped',
      'cherry','mangrove','oak','dark_oak',
      'acacia','pale','spruce','cinder','spicewood', 'maple'
    ];
  
    function registerRemoveCouch(componentId, getReplaceCommand) {
      ffh.blockComponentRegistry.registerCustomComponent(componentId, {
        onPlayerInteract(e) {
          const player = e.player;
          const block  = e.block;
          if (!player.isSneaking) return;
  
          if (player.gameMode !== GameMode.creative) {
            block.dimension.spawnItem(
              new ItemStack("ff:white_cushion", 1),
              { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 }
            );
          }
  
          const { x, y, z } = block.location;
          const face = block.permutation.getState("minecraft:cardinal_direction");
          
          const newBlockType = block.typeId.replace("_with_wool", "");
          
          const baseCommand = `fill ${x} ${y} ${z} ${x} ${y} ${z} ${newBlockType} replace ${block.typeId}`;
          block.dimension.runCommand(baseCommand);
          
          const newBlock = block.dimension.getBlock({ x, y, z });
          if (!newBlock) return;
          
          try {
            if (face !== undefined) {
              newBlock.setPermutation(newBlock.permutation.withState("minecraft:cardinal_direction", face));
            }
          } catch (error) {
            console.warn(`Error al aplicar estados: ${error}`);
          }
        },
  
        onPlayerDestroy(e) {
          const player = e.player;
          if (!player || player.getGameMode() === GameMode.creative) return;
  
          const destroyedPerm = e.destroyedBlockPermutation;
          if (!destroyedPerm) return;
  
          const oldId = destroyedPerm.type.id;
          const baseId = oldId.endsWith("_with_wool")
            ? oldId.replace("_with_wool", "")
            : oldId;
  
          const loc = {
            x: e.block.location.x + 0.5,
            y: e.block.location.y + 0.5,
            z: e.block.location.z + 0.5
          };
  
          e.dimension.spawnItem(new ItemStack(baseId, 1), loc);
          e.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), loc);
        }
      });
    }
  
  
    // Stools
    for (const type of woodTypes) {
      registerRemoveCouch(
        `ff:stool_${type}_remove_couch`,
        block => {
          const color = block.permutation.getState("ef:colors");
          const face     = block.permutation.getState("minecraft:cardinal_direction");
          const { x, y, z } = block.location;W
          return `fill ${x} ${y} ${z} ${x} ${y} ${z}` +
                 ` ff:wooden_${type}_stool["minecraft:cardinal_direction"="${face}"]` +
                 ` replace ff:wooden_${type}_stool_with_wool["minecraft:cardinal_direction"="${face}"]`;
        }
      );
    }
  });


world.beforeEvents.worldInitialize.subscribe((ffh) => {
    const playerJumpCounts = new Map();
    
    ffh.blockComponentRegistry.registerCustomComponent(
      "ff:fan_elevador",
      {
        onStepOn: (event) => {
          const { block, entity } = event;
          
          if (!entity.isValid() || entity.typeId !== 'minecraft:player') {
            entity.applyImpulse({
              x: 0,
              y: 0.5,
              z: 0
            });
            return;
          }
          
          const currentCount = playerJumpCounts.get(entity.id) || 0;
          
          let impulseY = 0.5;
          if (currentCount > 0) {
            impulseY = Math.min(0.5 + (currentCount * 0.2), 3);
          }
          
          entity.applyImpulse({
            x: 0,
            y: impulseY,
            z: 0
          });
          
          playerJumpCounts.set(entity.id, currentCount + 1);
          
          system.runTimeout(() => {
            const currentCount = playerJumpCounts.get(entity.id);
            if (currentCount) {
              playerJumpCounts.set(entity.id, 0);
            }
          }, 50);
        },
      }
    );
  });

world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:add_breads', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const add_bread = block.permutation.withState("ff:toaster_with_breads", 1);
            const add_bread_2 = block.permutation.withState("ff:toaster_with_breads", 2);
            const remove_bread = block.permutation.withState("ff:toaster_with_breads", 0);
            const breadGive = new ItemStack("ff:bread_slice");
            const breadGive2 = new ItemStack("ff:bread_slice");
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:bread_slice') && block.permutation.getState("ff:toaster_with_breads") === 0) {
                block.setPermutation(add_bread);
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                return;
            }
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:bread_slice') && block.permutation.getState("ff:toaster_with_breads") === 1) {
                block.setPermutation(add_bread_2);
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:toaster_with_breads") === 2) {
                block.setPermutation(remove_bread);
                player.playSound("random.pop2");
                block.dimension.spawnItem(breadGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                block.dimension.spawnItem(breadGive2, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:outlet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const add_folk = block.permutation.withState("ff:outlet_function", 1);
            const remove_folk = block.permutation.withState("ff:outlet_function", 0);
            const givefolk = new ItemStack("ff:folk");
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:folk') && block.permutation.getState("ff:outlet_function") === 0) {
                block.setPermutation(add_folk);
                player.playSound("random.pop2");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:outlet_function") === 1) {
                block.dimension.spawnItem(givefolk, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                block.setPermutation(remove_folk);
                player.playSound("random.pop");

                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:outlet_function") === 2) {
                block.dimension.runCommand(`title @p actionbar §6 It's too late...`);
                return;
            }
        },
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const folk_explode = block.permutation.withState("ff:outlet_function", 2);
            const folk_explode2 = block.permutation.withState("ff:outlet_function", 3);
            if (block.permutation.getState("ff:outlet_function") === 1) {
                block.dimension.spawnParticle("ff:smoke_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                block.setPermutation(folk_explode);
                return;
            }
            if (block.permutation.getState("ff:outlet_function") === 2) {
                block.dimension.spawnParticle("ff:elec_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                block.dimension.spawnParticle("ff:smoke_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                block.setPermutation(folk_explode2);
                return;
            }
            if (block.permutation.getState("ff:outlet_function") === 3) {
                block.dimension.runCommand(`summon ender_crystal ${x} ${y} ${z} 0 0 minecraft:crystal_explode`);
                block.dimension.runCommand(`setblock ${x} ${y} ${z} air`)
                block.dimension.spawnParticle("ff:elec_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                block.dimension.spawnParticle("ff:smoke_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                return;
            }
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:give_breads', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const execute_toaster1 = block.permutation.withState("ff:toaster_with_breads", 3);
            const execute_toaster2 = block.permutation.withState("ff:toaster_with_breads", 4);
            if (player.isSneaking && block.permutation.getState("ff:toaster_with_breads") === 1) {
                block.setPermutation(execute_toaster1);
                player.playSound("hit.netherite");
            }
            if (player.isSneaking && block.permutation.getState("ff:toaster_with_breads") === 2) {
                block.setPermutation(execute_toaster2);
                player.playSound("hit.netherite");
            }
        },
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const breadtoastedGive = new ItemStack("ff:bread_slice_toasted");
            const breadtoastedGive2 = new ItemStack("ff:bread_slice_toasted");
            const finish_execute_toaster1 = block.permutation.withState("ff:toaster_with_breads", 0);
            const finish_execute_toaster2 = block.permutation.withState("ff:toaster_with_breads", 0);
            if (block.permutation.getState("ff:toaster_with_breads") === 3) {
                block.setPermutation(finish_execute_toaster1);

                block.dimension.runCommand(`playsound ff:toast_finish @p`);
                block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
            if (block.permutation.getState("ff:toaster_with_breads") === 4) {
                block.setPermutation(finish_execute_toaster2);
                block.dimension.runCommand(`playsound ff:toast_finish @p`);
                block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                block.dimension.spawnItem(breadtoastedGive2, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
            if (Math.random() < 0.09 && block.permutation.getState("ff:toaster_with_breads") === 3) {
                block.dimension.runCommand(
                  `particle ff:pan_smoke ${x} ${y + 0.1} ${z}`
                );
            }
            if (Math.random() < 0.09 && block.permutation.getState("ff:toaster_with_breads") === 4) {
                block.dimension.runCommand(
                  `particle ff:pan_smoke ${x} ${y + 0.1} ${z}`
                );
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:smoke_toaster', {
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            if (block.permutation.getState("ff:toaster_with_breads") === 3) {
                block.dimension.spawnParticle("ff:toast_smoke", { x: block.location.x + 0.55, y: block.location.y + 0.5, z: block.location.z + 0.50 });
            }
            if (block.permutation.getState("ff:toaster_with_breads") === 4) {
                block.dimension.spawnParticle("ff:toast_smoke", { x: block.location.x + 0.55, y: block.location.y + 0.5, z: block.location.z + 0.50 });

            }


        },
    });
});


world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:water_particle', {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1) {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.5, y: block.location.y + 1.2, z: block.location.z + 0.5 });
            }

        },
    });
});

const wooden_support_verticalTag = 'ff:wooden_support_vertical';
class wooden_support_vertical_Manager {
    static updatewooden_support_verticalsAround(block) {
        let aboveBlock = undefined;
        try {
            aboveBlock = block.above(1);
        } catch { }
        let belowBlock = undefined;
        try {
            belowBlock = block.below(1);
        } catch { }
        const blocks = [
            aboveBlock,
            belowBlock,
            block
        ];
        for (const wooden_support_vertical of blocks) {
            if (wooden_support_vertical != undefined && wooden_support_vertical.hasTag(wooden_support_verticalTag)) this.updatewooden_support_vertical(wooden_support_vertical);
        }
    }
    static updatewooden_support_vertical(block) {
        let aboveBlock = undefined;
        try {
            aboveBlock = block.above(1);
        } catch { }
        let belowBlock = undefined;
        try {
            belowBlock = block.below(1);
        } catch { }
        if (aboveBlock != undefined) {
            if (aboveBlock.hasTag(wooden_support_verticalTag)) {
                block.setPermutation(block.permutation.withState("ff:top_bit", true));
            } else block.setPermutation(block.permutation.withState("ff:top_bit", false));
        } else block.setPermutation(block.permutation.withState("ff:top_bit", false));
        if (belowBlock != undefined) {
            if (belowBlock.hasTag(wooden_support_verticalTag)) {
                block.setPermutation(block.permutation.withState("ff:bottom_bit", true));
            } else block.setPermutation(block.permutation.withState("ff:bottom_bit", false));
        } else block.setPermutation(block.permutation.withState("ff:bottom_bit", false));
    }
}
world.afterEvents.playerBreakBlock.subscribe((data) => {
    wooden_support_vertical_Manager.updatewooden_support_verticalsAround(data.block);
});
world.afterEvents.playerPlaceBlock.subscribe((data) => {
    wooden_support_vertical_Manager.updatewooden_support_verticalsAround(data.block);
});


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:slab_cinder_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block, player } = e;
            if (!player || !player.getComponent('equippable')) {
                return;
            }
            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            const isPickaxe = selectedItem && selectedItem.hasTag('minecraft:is_axe');
            if (isPickaxe) {
                const slabItem = new ItemStack('ff:cinder_slab', 1);
                e.dimension.spawnItem(slabItem, block.location);
            }
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:slab_cinder_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            console.warn(`Interacted face: ${face}`);
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem?.typeId === 'ff:cinder_slab' && !block.permutation.getState('ff:double')) {
                const verticalHalf = block.permutation.getState('minecraft:vertical_half');
                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';
                if (isBottomUp || isTopDown) {
                    if (player.getGameMode() !== "creative") {
                        selectedItem.amount -= 1;
                        if (selectedItem.amount === 0) {
                            equipment.setEquipment('Mainhand', undefined);
                        } else {
                            equipment.setEquipment('Mainhand', selectedItem);
                        }
                    }
                    block.setPermutation(block.permutation.withState('ff:double', true));
                    block.setWaterlogged(false);
                    player.playSound('use.wood');
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:slab_spicewood_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block, player } = e;
            if (!player || !player.getComponent('equippable')) {
                return;
            }
            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            const isPickaxe = selectedItem && selectedItem.hasTag('minecraft:is_axe');
            if (isPickaxe) {
                const slabItem = new ItemStack('ff:spicewood_slab', 1);
                e.dimension.spawnItem(slabItem, block.location);
            }
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:slab_spicewood_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            console.warn(`Interacted face: ${face}`);
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem?.typeId === 'ff:spicewood_slab' && !block.permutation.getState('ff:double')) {
                const verticalHalf = block.permutation.getState('minecraft:vertical_half');
                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';
                if (isBottomUp || isTopDown) {
                    if (player.getGameMode() !== "creative") {
                        selectedItem.amount -= 1;
                        if (selectedItem.amount === 0) {
                            equipment.setEquipment('Mainhand', undefined);
                        } else {
                            equipment.setEquipment('Mainhand', selectedItem);
                        }
                    }
                    block.setPermutation(block.permutation.withState('ff:double', true));
                    block.setWaterlogged(false);
                    player.playSound('use.wood');
                }
            }
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cinder_trapdoor_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const currentState = block.permutation.getState('ff:open');
            const newOpenState = !currentState;
            const newPermutation = BlockPermutation.resolve(block.typeId, {
                ...block.permutation.getAllStates(),
                'ff:open': newOpenState
            });
            block.setPermutation(newPermutation);
            const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
            player.playSound(sound);
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:spicewood_trapdoor_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const currentState = block.permutation.getState('ff:open');
            const newOpenState = !currentState;
            const newPermutation = BlockPermutation.resolve(block.typeId, {
                ...block.permutation.getAllStates(),
                'ff:open': newOpenState
            });
            block.setPermutation(newPermutation);
            const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
            player.playSound(sound);
        }
    });
});

function getPreciseRotation(playerYRotation) {
    if (playerYRotation < 0) playerYRotation += 360;
    const rotation = Math.round(playerYRotation / 22.5);
  
    return rotation !== 16 ? rotation : 0;
  }

world.beforeEvents.worldInitialize.subscribe(({
    blockComponentRegistry
  }) => {
    blockComponentRegistry.registerCustomComponent("ff:adv_rot", {
      beforeOnPlayerPlace(event) {
        const {
          player
        } = event;
        if (!player) return;
  
        const blockFace = event.permutationToPlace.getState("minecraft:block_face");
        if (blockFace !== "up") return;
  
        const playerYRotation = player.getRotation().y;
        const rotation = getPreciseRotation(playerYRotation);
  
        event.permutationToPlace = event.permutationToPlace.withState("ff:block_rotation", rotation);
      }
    });
  });

world.beforeEvents.worldInitialize.subscribe(event => {
    event.blockComponentRegistry.registerCustomComponent("ff:christmas_stocking_vars", {
      onPlace: (onPlaceEvent => {
        onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
      })
    })
  });

  world.beforeEvents.worldInitialize.subscribe(event => {
    event.blockComponentRegistry.registerCustomComponent("ff:gravestone_vars", {
      onPlace: (onPlaceEvent => {
        onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
      })
    })
  });

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("ff:feldspar_ore_xp_reward", {
        onPlayerDestroy({ block, dimension, player }) {
            const xpAmount = randomInt(0, 3);

            for (let i = 0; i < xpAmount; i++) {
                dimension.spawnEntity("minecraft:xp_orb", block.location);
            }
        },
    });
});

let lastInteraction = { player: null, block: null, time: 0 };

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player } = event;
    const blockType = block.typeId;
    
    if (!['ff:cinder_log', 'ff:cinder_wood', 'ff:spicewood_log', 'ff:spicewood_wood', 'ff:maple_wood', 'ff:maple_log'].includes(blockType)) return;
    
    lastInteraction = {
        player,
        block: {
            x: block.location.x,
            y: block.location.y,
            z: block.location.z,
            face: event.face,
            blockState: block.permutation.getState("minecraft:block_face"),
            type: blockType
        },
        time: Date.now()
    };
});

system.runInterval(() => {
    if (!lastInteraction.player || !lastInteraction.block || Date.now() - lastInteraction.time > 100) return;

    const player = lastInteraction.player;
    const blockLoc = lastInteraction.block;
    const face = lastInteraction.block.face;
    const blockState = lastInteraction.block.blockState;
    const blockType = lastInteraction.block.type;
    
    const equipment = player.getComponent('equippable');
    const selectedItem = equipment.getEquipment('Mainhand');
    
    if (selectedItem?.hasTag('minecraft:is_axe')) {
        system.run(() => {
            let strippedType;
            switch(blockType) {
                case 'ff:cinder_log':
                    strippedType = 'ff:stripped_cinder_log';
                    break;
                case 'ff:cinder_wood':
                    strippedType = 'ff:stripped_cinder_wood';
                    break;
                case 'ff:spicewood_wood':
                    strippedType = 'ff:stripped_spicewood_wood';
                    break;
                case 'ff:spicewood_log':
                    strippedType = 'ff:stripped_spicewood_log';
                    break;
                case 'ff:maple_wood':
                    strippedType = 'ff:stripped_maple_wood';
                    break;
                case 'ff:maple_log':
                    strippedType = 'ff:stripped_maple_log';
                    break;
            }
            
            if (blockState) {
                player.dimension.runCommand(`setblock ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} ${strippedType} ["minecraft:block_face"="${blockState}"]`);
            } else {
                player.dimension.runCommand(`setblock ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} ${strippedType}`);
            }
            player.playSound('step.wood');
        });
    } else if (selectedItem && selectedItem.typeId !== blockType) {
        const allowedSuffixes = [
            '_log', '_wood', '_planks', '_leaves', '_sapling', '_slab', '_stairs', '_fence', '_door', '_trapdoor', '_button', '_pressure_plate', '_sign', '_wall', '_stripped'
        ];
        const isVanillaBlock = selectedItem.typeId.startsWith('minecraft:') && !selectedItem.typeId.includes('item');
        const isAllowed = allowedSuffixes.some(suf => selectedItem.typeId.endsWith(suf)) || isVanillaBlock;
        if (!isAllowed) return;

        let targetX = blockLoc.x, targetY = blockLoc.y, targetZ = blockLoc.z;

        switch (face) {
            case 'up': targetY++; break;
            case 'down': targetY--; break;
            case 'north': targetZ--; break;
            case 'south': targetZ++; break;
            case 'east': targetX++; break;
            case 'west': targetX--; break;
        }

        system.run(() => {
            const targetBlock = player.dimension.getBlock({ x: targetX, y: targetY, z });
            if (targetBlock && targetBlock.typeId === 'minecraft:air') {
                player.dimension.runCommand(`setblock ${targetX} ${targetY} ${targetZ} ${selectedItem.typeId.replace('minecraft:', '')}`);
                
                if (player.getGameMode() !== "creative") {
                    selectedItem.amount--;
                    if (selectedItem.amount <= 0) {
                        equipment.setEquipment('Mainhand', undefined);
                    } else {
                        equipment.setEquipment('Mainhand', selectedItem);
                    }
                }
                player.playSound('use.wood');
            }
        });
    }
    
    lastInteraction = { player: null, block: null, time: 0 };
}, 1);

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('ff:fridge_dual', {
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
});

world.beforeEvents.worldInitialize.subscribe(result => {
    result.blockComponentRegistry.registerCustomComponent("ff:add_item", {
        onPlayerInteract: result => {
            const { block, player, face } = result;
            if (player.isSneaking || face !== "Up") return;

            const equippable = player.getComponent("minecraft:equippable");
            let item = equippable.getEquipment("Mainhand");
            const inv = player.getComponent("minecraft:inventory").container;
            const dim = block.dimension;
            const center = block.center();

            let entity = dim.getEntitiesAtBlockLocation(center)
                            .find(e => e.typeId === "ff:pan_bottom_left");

            if (!entity && item) {
                system.run(() => {
                    let checkEntity = dim.getEntitiesAtBlockLocation(center)
                                         .find(e => e.typeId === "ff:pan_bottom_left");
                    if (!checkEntity) {
                        let newEntity = dim.spawnEntity("ff:pan_bottom_left", {
                            x: center.x, y: center.y - 0.5, z: center.z
                        });
                        newEntity.addTag(item.typeId);
                        newEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1`);
                        const slot = player.selectedSlotIndex;
                        if (item.amount > 1) {
                            item.amount--;
                            inv.setItem(slot, item);
                        } else {
                            inv.setItem(slot, undefined);
                        }
                        player.playSound("random.pop");
                    }
                });
                return;
            }

            if (entity && !item) {
                const tags = entity.getTags();
                if (tags.length > 0) {
                    const itemId = tags[0];
                    inv.addItem(new ItemStack(itemId, 1));
                    entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 air`);
                    entity.removeTag(itemId);
                    player.playSound("random.pop2");
                }
                entity.triggerEvent("ff:despawn");
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
                return;
            }
        },
        onPlayerDestroy: result => {
            const { block } = result;
            const dim = block.dimension;
            const center = block.center();
            dim.runCommand(
                `execute at @e[type=ff:pan_bottom_left] positioned ${center.x} ${center.y} ${center.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
            );
        },
        onDestroy: result => {
            const { block } = result;
            const dim = block.dimension;
            const center = block.center();
            dim.runCommand(
                `execute at @e[type=ff:pan_bottom_left] positioned ${center.x} ${center.y} ${center.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
            );
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("ff:laptop_on_table", {
        onPlace(e) {
            const { block } = e;
            
            if (block.typeId === "ff:pan" || block.typeId === "ff:tablecloth_squares" || block.typeId === "ff:watering_can" || block.typeId === "ff:laptop" || block.typeId === "ff:stacked_books" || block.typeId === "ff:empty_dish" || block.typeId === "ff:blueprint") {
                const blockBelow = block.dimension.getBlock({ 
                    x: block.location.x, 
                    y: block.location.y - 1, 
                    z: block.location.z 
                });

                if (blockBelow && blockBelow.typeId.endsWith("_coffee_table")) {
                    block.setPermutation(block.permutation.withState("ff:on_table", true));
                } else {
                    block.setPermutation(block.permutation.withState("ff:on_table", false));
                }
            }
            
            if (block.typeId.endsWith("_coffee_table")) {
                const blockAbove = block.dimension.getBlock({ 
                    x: block.location.x, 
                    y: block.location.y + 1, 
                    z: block.location.z 
                });

                if (blockAbove && (blockAbove.typeId === "ff:tablecloth_squares" ||  blockAbove.typeId === "ff:watering_can" ||  blockAbove.typeId === "ff:pan" || blockAbove.typeId === "ff:laptop" || blockAbove.typeId === "ff:stacked_books" || blockAbove.typeId === "ff:empty_dish" || blockAbove.typeId === "ff:blueprint")) {
                    blockAbove.setPermutation(blockAbove.permutation.withState("ff:on_table", true));
                }
            }
        },

        onPlayerDestroy(e) {
            const { block } = e;
            const blockAbove = block.dimension.getBlock({ 
                x: block.location.x, 
                y: block.location.y + 1, 
                z: block.location.z 
            });

            if (blockAbove && (blockAbove.typeId === "ff:tablecloth_squares" ||  blockAbove.typeId === "ff:watering_can" ||  blockAbove.typeId === "ff:pan" || blockAbove.typeId === "ff:laptop" || blockAbove.typeId === "ff:stacked_books" || blockAbove.typeId === "ff:empty_dish" || blockAbove.typeId === "ff:blueprint")) {
                blockAbove.setPermutation(blockAbove.permutation.withState("ff:on_table", false));
            }
        },

        onDestroy(e) {
            const { block } = e;
            const blockAbove = block.dimension.getBlock({ 
                x: block.location.x, 
                y: block.location.y + 1, 
                z: block.location.z 
            });

            if (blockAbove && (blockAbove.typeId === "ff:tablecloth_squares" ||  blockAbove.typeId === "ff:watering_can" ||  blockAbove.typeId === "ff:pan" || blockAbove.typeId === "ff:laptop" || blockAbove.typeId === "ff:stacked_books" || blockAbove.typeId === "ff:empty_dish" || blockAbove.typeId === "ff:blueprint")) {
                blockAbove.setPermutation(blockAbove.permutation.withState("ff:on_table", false));
            }
        }
    });
});

function applyStates(permutation, states) {
    let newPerm = permutation;
    for (const [key, value] of Object.entries(states)) {
        if (newPerm.hasState && newPerm.hasState(key)) {
            newPerm = newPerm.withState(key, value);
        }
    }
    return newPerm;
}

function isCurtainBlock(block) {
    if (!block || !block.typeId) return false;
    const woodTypes = [
        'jungle','birch','crimson','warped',
        'cherry','mangrove','oak','dark_oak',
        'acacia','pale','spruce','cinder','spicewood', 'maple'
    ];
    return block.typeId.startsWith('ff:white_curtain_') && 
           woodTypes.some(type => block.typeId.endsWith(type));
}

const neighborOffsets = {
    north: { left: [-1, 0, 0], right: [1, 0, 0], above: [0, 1, 0], below: [0, -1, 0] },
    south: { left: [1, 0, 0], right: [-1, 0, 0], above: [0, 1, 0], below: [0, -1, 0] },
    east:  { left: [0, 0, -1], right: [0, 0, 1], above: [0, 1, 0], below: [0, -1, 0] },
    west:  { left: [0, 0, 1], right: [0, 0, -1], above: [0, 1, 0], below: [0, -1, 0] }
};

function getCurtainNeighbors(block) {
    const { x, y, z } = block.location;
    const dim = block.dimension;
    const dir = block.permutation.getState('minecraft:cardinal_direction');
    const offsets = neighborOffsets[dir] || neighborOffsets.north;
    return {
        left: dim.getBlock({ x: x + offsets.left[0], y: y + offsets.left[1], z: z + offsets.left[2] }),
        right: dim.getBlock({ x: x + offsets.right[0], y: y + offsets.right[1], z: z + offsets.right[2] }),
        above: dim.getBlock({ x: x + offsets.above[0], y: y + offsets.above[1], z: z + offsets.above[2] }),
        below: dim.getBlock({ x: x + offsets.below[0], y: y + offsets.below[1], z: z + offsets.below[2] })
    };
}

function updateCurtainConnections(block) {
    if (!block || !block.typeId || !block.typeId.startsWith('ff:white_curtain_')) return;
    const direction = block.permutation.getState('minecraft:cardinal_direction');
    const neighbors = getCurtainNeighbors(block);
    let newStates = { ...block.permutation.getAllStates() };
    for (const [dir, neighbor] of Object.entries(neighbors)) {
        if (isCurtainBlock(neighbor) && neighbor.permutation.getState('minecraft:cardinal_direction') === direction) {
            newStates[`ff:${dir}_connection`] = 1;
        } else {
            newStates[`ff:${dir}_connection`] = 0;
        }
    }
    const newPerm = BlockPermutation.resolve(block.typeId, newStates);

    if (JSON.stringify(newPerm.getAllStates()) !== JSON.stringify(block.permutation.getAllStates())) {
        const { x, y, z } = block.location;
        block.dimension.runCommand(`setblock ${x} ${y} ${z} air`);
        block.dimension.runCommand(`setblock ${x} ${y} ${z} ${block.typeId}`);

        const refreshedBlock = block.dimension.getBlock({ x, y, z });
        if (refreshedBlock) refreshedBlock.setPermutation(newPerm);
    }
}

function updateSelfAndNeighbors(block) {
    updateCurtainConnections(block);
    const direction = block.permutation.getState('minecraft:cardinal_direction');
    const neighbors = getCurtainNeighbors(block);
    for (const neighbor of Object.values(neighbors)) {
        if (isCurtainBlock(neighbor) && neighbor.permutation.getState('minecraft:cardinal_direction') === direction) {
            updateCurtainConnections(neighbor);
        }
    }
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    const woodTypes = [
        'jungle','birch','crimson','warped',
        'cherry','mangrove','oak','dark_oak',
        'acacia','pale','spruce','cinder','spicewood', 'maple'
    ];

    woodTypes.forEach(type => {
        blockComponentRegistry.registerCustomComponent(`ff:curtain_${type}`, {
            beforeOnPlayerPlace(e) {
                if (!e.permutationToPlace || !e.permutationToPlace.typeId || !e.permutationToPlace.typeId.startsWith('ff:white_curtain_')) return;
                let perm = e.permutationToPlace;
                perm = applyStates(perm, {
                    'ff:left_connection': 0,
                    'ff:right_connection': 0,
                    'ff:above_connection': 0,
                    'ff:below_connection': 0
                });
                e.permutationToPlace = perm;
            },
            onPlace(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                updateSelfAndNeighbors(e.block);
            },
            afterOnPlayerPlace(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                updateSelfAndNeighbors(e.block);
            },
            onPlayerInteract(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                const current = e.block.permutation.getState('ff:open') || 0;
                const next = current === 1 ? 0 : 1;
                propagateCurtainOpen(e.block, next);
                e.player.playSound(current === 1 ? 'block.wooden_trapdoor.close' : 'block.wooden_trapdoor.open');
            },
            onPlayerDestroy(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                const neighbors = getCurtainNeighbors(e.block);
                for (const neighbor of Object.values(neighbors)) {
                    if (isCurtainBlock(neighbor)) {
                        updateCurtainConnections(neighbor);
                    }
                }
            }
        });
    });
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const { x: px, y: py, z: pz } = player.location;
        const dim = player.dimension;
        const range = 8;
        for (let x = Math.floor(px) - range; x <= Math.floor(px) + range; x++) {
            for (let y = Math.max(0, Math.floor(py) - range); y <= Math.min(255, Math.floor(py) + range); y++) {
                for (let z = Math.floor(pz) - range; z <= Math.floor(pz) + range; z++) {
                    const block = dim.getBlock({ x, y, z });
                    if (block && block.typeId && block.typeId.startsWith('ff:white_curtain_')) {
                        updateCurtainConnections(block);
                    }
                }
            }
        }
    }
}, 10);

function propagateCurtainOpen(block, openValue, visited = new Set()) {
    if (!block || !block.typeId || !block.typeId.startsWith('ff:white_curtain_')) return;
    
    const key = `${block.location.x},${block.location.y},${block.location.z}`;
    if (visited.has(key)) return;
    visited.add(key);

    const newStates = { ...block.permutation.getAllStates(), "ff:open": openValue };
    const newPerm = BlockPermutation.resolve(block.typeId, newStates);
    block.setPermutation(newPerm);

    // Spawn particle effect
    const { x, y, z } = block.location;
    block.dimension.spawnParticle("ff:curtains_open_effect", {
        x: x + 0.5,
        y: y + 0.5,
        z: z + 0.5
    });

    const direction = block.permutation.getState('minecraft:cardinal_direction');
    const neighbors = getCurtainNeighbors(block);
    for (const neighbor of Object.values(neighbors)) {
        if (
            isCurtainBlock(neighbor) &&
            neighbor.permutation.getState('minecraft:cardinal_direction') === direction &&
            neighbor.permutation.getState('ff:open') !== openValue
        ) {
            propagateCurtainOpen(neighbor, openValue, visited);
        }
    }
}
