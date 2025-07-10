import { world, system, BlockPermutation, ItemStack, GameMode, EnchantmentType } from '@minecraft/server'

// Utility functions to reduce code duplication
const Utils = {
    getPlayerEquipment(player) {
        return player.getComponent('equippable');
    },
    
    getSelectedItem(player) {
        const equip = this.getPlayerEquipment(player);
        return equip ? equip.getEquipment('Mainhand') : null;
    },
    
    consumeItem(player, item) {
        if (player.getGameMode() === GameMode.creative) return;
        
        if (item.amount > 1) {
            item.amount -= 1;
            this.getPlayerEquipment(player).setEquipment('Mainhand', item);
        } else {
            this.getPlayerEquipment(player).setEquipment('Mainhand', undefined);
        }
    },
    
    spawnItemAtBlock(dimension, item, block, offsetY = 1) {
        const { x, y, z } = block.location;
        dimension.spawnItem(item, { x: x + 0.5, y: y + offsetY, z: z + 0.5 });
    },
    
    playSoundForPlayer(player, sound) {
        player.playSound(sound);
    },
    
    getBlockState(block, stateName) {
        return block.permutation.getState(stateName);
    },
    
    setBlockState(block, stateName, value) {
        block.setPermutation(block.permutation.withState(stateName, value));
    }
};

// Constants to avoid repeated array creation
const WOOD_TYPES = [
    'jungle','birch','crimson','warped',
    'cherry','mangrove','oak','dark_oak',
    'acacia','pale','spruce','cinder','spicewood'
];

const DIRECTIONS = ['north','south','east','west'];

// Component registration helpers
const ComponentRegistry = {
    registerCushionComponent(registry, type, isStool = false) {
        const componentId = isStool ? `ff:stool_${type}_add_couch` : `ff:${type}_add_couch`;
        registry.registerCustomComponent(componentId, {
            onPlayerInteract: e => CouchSystem.addCushion(e.player, e.block, type, isStool)
        });
    },

    registerRemoveCushionComponent(registry, type, isStool = false) {
        const componentId = isStool ? `ff:stool_${type}_remove_couch` : `ff:${type}_remove_couch`;
        registry.registerCustomComponent(componentId, {
            onPlayerInteract: e => CouchSystem.removeCushion(e.player, e.block, type, isStool),
            onPlayerDestroy: e => {
                const player = e.player;
                if (!player || player.getGameMode() === GameMode.creative) return;

                const destroyedPerm = e.destroyedBlockPermutation;
                if (!destroyedPerm) return;

                const oldId = destroyedPerm.type.id;
                const baseId = oldId.endsWith("_with_wool") ? oldId.replace("_with_wool", "") : oldId;

                const loc = {
                    x: e.block.location.x + 0.5,
                    y: e.block.location.y + 0.5,
                    z: e.block.location.z + 0.5
                };

                e.dimension.spawnItem(new ItemStack(baseId, 1), loc);
                e.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), loc);
            }
        });
    },

    registerItemInteractionComponent(registry, componentId, config) {
        registry.registerCustomComponent(componentId, {
            onPlayerInteract: e => {
                const { player, block } = e;
                const selectedItem = Utils.getSelectedItem(player);
                const currentState = Utils.getBlockState(block, config.stateName);
                
                if (!player.isSneaking && selectedItem && selectedItem.typeId === config.requiredItem) {
                    if (config.addStates && config.addStates[currentState] !== undefined) {
                        Utils.setBlockState(block, config.stateName, config.addStates[currentState]);
                        Utils.playSoundForPlayer(player, config.addSound);
                        Utils.consumeItem(player, selectedItem);
                    }
                } else if (!player.isSneaking && config.removeState !== undefined && currentState === config.removeState) {
                    Utils.setBlockState(block, config.stateName, config.resetState || 0);
                    Utils.playSoundForPlayer(player, config.removeSound);
                    if (config.spawnItems) {
                        config.spawnItems.forEach(itemType => {
                            Utils.spawnItemAtBlock(block.dimension, new ItemStack(itemType), block);
                        });
                    }
                }
            }
        });
    }
};


world.beforeEvents.worldInitialize.subscribe(ffh => {
    ffh.blockComponentRegistry.registerCustomComponent('ff:fridge_dual', {
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
                    `summon ff:fridge_inventory ${x + 0.5} ${y + 1.5} ${z + 0.5} 0 0 spawn_adult_melee "${displayName}"`
                );
                                block.dimension.runCommand(
                    `summon ff:fridge_inventory_freezer ${x + 0.5} ${y + 0.5} ${z + 0.5} 0 0 spawn_adult_melee "freezer_gui"`
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
                                `execute at @e[type=ff:fridge_inventory_freezer] positioned ${x} ${y} ${z} run replaceitem entity @e[type=ff:fridge_inventory_freezer,r=1] slot.inventory ${slot} ${freezeMap[item.typeId]} ${item.amount}`
                            );
                        }
                    }
                }
            }
        }
    });
    ffh.blockComponentRegistry.registerCustomComponent("ff:add_item", {
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

            if (!item && entity) {
                const itemTag = entity.getTags().find(t => t.startsWith("item:"));
                if (itemTag) {
                    try {
                        const itemData = JSON.parse(itemTag.slice(5));
                        const restored = new ItemStack(itemData.typeId, itemData.amount);
                        if (itemData.nameTag) restored.nameTag = itemData.nameTag;
                        if (itemData.lore) restored.setLore(itemData.lore);
                        if (itemData.enchantments) {
                            const enchComp = restored.getComponent("minecraft:enchantable");
                            if (enchComp) {
                                for (const ench of itemData.enchantments) {
                                    enchComp.addEnchantment({ type: new EnchantmentType(ench.id), level: ench.level });
                                }
                            }
                        }
                        inv.addItem(restored);
                    } catch (e) {
                        const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                        if (fallbackId) inv.addItem(new ItemStack(fallbackId, 1));
                    }
                } else {
                    const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                    if (fallbackId) inv.addItem(new ItemStack(fallbackId, 1));
                }
                entity.runCommand(`event entity @s ff:kill`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:kill`
                );
                entity.runCommand(`event entity @s ff:despawn`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
                return;
            }

            if (item && !entity) {
                entity = dim.spawnEntity("ff:pan_bottom_left", {
                    x: center.x, y: center.y - 0.5, z: center.z
                });
                const enchComp = item.getComponent("minecraft:enchantable");
                const enchantments = enchComp ? enchComp.getEnchantments().map(e => ({ id: e.type.id, level: e.level })) : undefined;
                const itemData = {
                    typeId: item.typeId,
                    amount: 1,
                    nameTag: item.nameTag,
                    lore: item.getLore ? item.getLore() : undefined,
                    enchantments: enchantments && enchantments.length > 0 ? enchantments : undefined
                };
                entity.addTag(item.typeId);
                entity.addTag("item:" + JSON.stringify(itemData));
                entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1`);
                const slot = player.selectedSlotIndex;
                if (item.amount > 1) {
                    item.amount--;
                    inv.setItem(slot, item);
                } else {
                    inv.setItem(slot, undefined);
                }
                return;
            }
        },
        onPlayerDestroy: result => {
            const { block } = result;
            const dim = block.dimension;
            const center = block.center();
            let entity = dim.getEntitiesAtBlockLocation(center)
                            .find(e => e.typeId === "ff:pan_bottom_left");
            if (entity) {
                const itemTag = entity.getTags().find(t => t.startsWith("item:"));
                if (itemTag) {
                    try {
                        const itemData = JSON.parse(itemTag.slice(5));
                        const restored = new ItemStack(itemData.typeId, itemData.amount);
                        if (itemData.nameTag) restored.nameTag = itemData.nameTag;
                        if (itemData.lore) restored.setLore(itemData.lore);
                        if (itemData.enchantments) {
                            const enchComp = restored.getComponent("minecraft:enchantable");
                            if (enchComp) {
                                for (const ench of itemData.enchantments) {
                                    enchComp.addEnchantment({ type: new EnchantmentType(ench.id), level: ench.level });
                                }
                            }
                        }
                        dim.spawnItem(restored, {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    } catch (e) {
                        const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                        if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    }
                } else {
                    const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                    if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                        x: block.location.x + 0.5,
                        y: block.location.y + 1,
                        z: block.location.z + 0.5
                    });
                }
                entity.runCommand(`event entity @s ff:kill`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:kill`
                );
                entity.runCommand(`event entity @s ff:despawn`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
            }
        },
        onDestroy: result => {
            const { block } = result;
            const dim = block.dimension;
            const center = block.center();
            let entity = dim.getEntitiesAtBlockLocation(center)
                            .find(e => e.typeId === "ff:pan_bottom_left");
            if (entity) {
                const itemTag = entity.getTags().find(t => t.startsWith("item:"));
                if (itemTag) {
                    try {
                        const itemData = JSON.parse(itemTag.slice(5));
                        const restored = new ItemStack(itemData.typeId, itemData.amount);
                        if (itemData.nameTag) restored.nameTag = itemData.nameTag;
                        if (itemData.lore) restored.setLore(itemData.lore);
                        if (itemData.enchantments) {
                            const enchComp = restored.getComponent("minecraft:enchantable");
                            if (enchComp) {
                                for (const ench of itemData.enchantments) {
                                    enchComp.addEnchantment({ type: new EnchantmentType(ench.id), level: ench.level });
                                }
                            }
                        }
                        dim.spawnItem(restored, {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    } catch (e) {
                        const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                        if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    }
                } else {
                    const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                    if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                        x: block.location.x + 0.5,
                        y: block.location.y + 1,
                        z: block.location.z + 0.5
                    });
                }
                entity.runCommand(`event entity @s ff:kill`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:kill`
                );
                entity.runCommand(`event entity @s ff:despawn`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
            }
        }
    });

    const woodTypes = [
        'jungle','birch','crimson','warped',
        'cherry','mangrove','oak','dark_oak',
        'acacia','pale','spruce','cinder','spicewood'
    ];

    woodTypes.forEach(type => {
        ffh.blockComponentRegistry.registerCustomComponent(`ff:curtain_${type}`, {
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

    ffh.blockComponentRegistry.registerCustomComponent("ff:laptop_on_table", {
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


    ffh.blockComponentRegistry.registerCustomComponent("ff:feldspar_ore_xp_reward", {
        onPlayerDestroy({ block, dimension, player }) {
            const xpAmount = randomInt(0, 3);

            for (let i = 0; i < xpAmount; i++) {
                dimension.spawnEntity("minecraft:xp_orb", block.location);
            }
        },
    });
    // Switch component
    ffh.blockComponentRegistry.registerCustomComponent("ff:switch", {
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

            if (item && item.typeId === "ff:wrench") {
                Utils.playSoundForPlayer(player, "random.click");
                e.cancel = true;
                return;
            }

            if (item && item.typeId === "minecraft:breeze_rod") {
                Utils.playSoundForPlayer(player, "random.pop2");
                return;
            }

            Utils.playSoundForPlayer(player, "random.click");
            const enable = block.permutation.withState("ff:switch_type", true);
            const disable = block.permutation.withState("ff:switch_type", false);

            if (Utils.getBlockState(block, "ff:switch_type") === false) {
                block.setPermutation(enable);
                return;
            }
            if (Utils.getBlockState(block, "ff:switch_type") === true) {
                block.setPermutation(disable);
                return;
            }
        }
    });

    // Single interactive component
    ffh.blockComponentRegistry.registerCustomComponent("ff:single_interactive", {
        onPlayerInteract: e => {
            const { player } = e;
            Utils.playSoundForPlayer(player, "random.clickss");
        }
    });

    // Toilet function component
    ffh.blockComponentRegistry.registerCustomComponent('ff:toilet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const toilet_open = block.permutation.withState("ff:bathroom_vars", 1);
            const toilet_function = block.permutation.withState("ff:bathroom_vars", 2);
            const toilet_close = block.permutation.withState("ff:bathroom_vars", 0);
            
            if (player.isSneaking) {
                const currentState = Utils.getBlockState(block, "ff:bathroom_vars");
                if (currentState === 0) {
                    block.setPermutation(toilet_open);
                } else if (currentState === 1) {
                    block.setPermutation(toilet_function);
                    Utils.playSoundForPlayer(player, "ff:toilet");
                } else if (currentState === 2) {
                    block.setPermutation(toilet_close);
                }
            }
        }
    });

    // Water/lava placement prevention
    ffh.blockComponentRegistry.registerCustomComponent('ff:on_player_place', {
        beforeOnPlayerPlace: e => {
            const { block } = e;
            if (block.typeId.includes("water") || block.typeId.includes("lava")) {
                e.cancel = true;
            }
        }
    });

    // Summoning light component
    ffh.blockComponentRegistry.registerCustomComponent("ff:summoning_light", {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;

            const name = block.typeId.split(":")[1];
            const isFan = name.includes("fan");
            const entityType = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";

            const cx = x + 0.5;
            const cy = isFan ? y - 0 : y;
            const cz = z + 0.5;

            if (!isFan && Utils.getBlockState(block, "ff:lamp_state")) {
                block.dimension.runCommand(`particle ff:ff_light_ray ${x} ${y + 0.8} ${z}`);
            }

            if (isFan && Utils.getBlockState(block, "ff:lamp_state")) {
                block.dimension.runCommand(`particle ff:ff_light_ray ${x} ${y + 0} ${z}`);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:tv_weather_channel', {
        onTick({ block }) {
            WeatherSystem.updateTVChannel(block);
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_cinder_on_player_destroy', {
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
    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_cinder_on_interact', {
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
    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_spicewood_on_player_destroy', {
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
    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_spicewood_on_interact', {
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

    ffh.blockComponentRegistry.registerCustomComponent('ff:cinder_trapdoor_on_interact', {
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

    ffh.blockComponentRegistry.registerCustomComponent('ff:spicewood_trapdoor_on_interact', {
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

    ffh.blockComponentRegistry.registerCustomComponent("ff:christmas_stocking_vars", {
        onPlace: (onPlaceEvent => {
          onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
        })
      })
  
      ffh.blockComponentRegistry.registerCustomComponent("ff:gravestone_vars", {
          onPlace: (onPlaceEvent => {
            onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
          })
        });

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
    
    ffh.blockComponentRegistry.registerCustomComponent('ff:water_particle', {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1) {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.5, y: block.location.y + 1.2, z: block.location.z + 0.5 });
            }

        },
    });

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

    ffh.blockComponentRegistry.registerCustomComponent('ff:outlet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const selectedItem = Utils.getSelectedItem(player);
            const currentState = Utils.getBlockState(block, "ff:outlet_function");

            if (!player.isSneaking && selectedItem && selectedItem.typeId === 'ff:fork' && currentState === 0) {
                Utils.setBlockState(block, "ff:outlet_function", 1);
                Utils.playSoundForPlayer(player, "random.pop2");
                Utils.consumeItem(player, selectedItem);
            } else if (!player.isSneaking && currentState === 1) {
                Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:fork"), block);
                Utils.setBlockState(block, "ff:outlet_function", 0);
                Utils.playSoundForPlayer(player, "random.pop");
            } else if (!player.isSneaking && currentState === 2) {
                block.dimension.runCommand(`title @p actionbar §6 It's too late...`);
            }
        },
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            const currentState = Utils.getBlockState(block, "ff:outlet_function");

            if (currentState === 1) {
                block.dimension.spawnParticle("ff:smoke_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                Utils.setBlockState(block, "ff:outlet_function", 2);
            } else if (currentState === 2) {
                block.dimension.spawnParticle("ff:elec_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                block.dimension.spawnParticle("ff:smoke_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                Utils.setBlockState(block, "ff:outlet_function", 3);
            } else if (currentState === 3) {
                block.dimension.runCommand(`summon ender_crystal ${x} ${y} ${z} 0 0 minecraft:crystal_explode`);
                block.dimension.runCommand(`setblock ${x} ${y} ${z} air`);
                block.dimension.spawnParticle("ff:elec_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                block.dimension.spawnParticle("ff:smoke_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
            }
        }
    });

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
    ffh.blockComponentRegistry.registerCustomComponent('ff:add_breads', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const selectedItem = Utils.getSelectedItem(player);
            const currentState = Utils.getBlockState(block, "ff:toaster_with_breads");
            
            if (!player.isSneaking && selectedItem && selectedItem.typeId === 'ff:bread_slice') {
                if (currentState === 0) {
                    Utils.setBlockState(block, "ff:toaster_with_breads", 1);
                    Utils.playSoundForPlayer(player, "random.pop");
                    Utils.consumeItem(player, selectedItem);
                } else if (currentState === 1) {
                    Utils.setBlockState(block, "ff:toaster_with_breads", 2);
                    Utils.playSoundForPlayer(player, "random.pop");
                    Utils.consumeItem(player, selectedItem);
                }
            } else if (!player.isSneaking && currentState === 2) {
                Utils.setBlockState(block, "ff:toaster_with_breads", 0);
                Utils.playSoundForPlayer(player, "random.pop2");
                Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:bread_slice"), block);
                Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:bread_slice"), block);
            }
        },
    });

    WOOD_TYPES.forEach(type => {
        ComponentRegistry.registerCushionComponent(ffh.blockComponentRegistry, type, false);
        ComponentRegistry.registerCushionComponent(ffh.blockComponentRegistry, type, true);
        ComponentRegistry.registerRemoveCushionComponent(ffh.blockComponentRegistry, type, true);
    });

    ComponentRegistry.registerItemInteractionComponent(ffh.blockComponentRegistry, 'ff:paper_fill', {
        stateName: 'ff:paper',
        requiredItem: 'ff:toilet_paper_item',
        addStates: { 0: 9 },
        addSound: 'random.pop',
        removeState: 2,
        resetState: 0,
        removeSound: 'random.pop2',
        spawnItems: ['ff:bread_slice', 'ff:bread_slice']
    });

    ComponentRegistry.registerItemInteractionComponent(ffh.blockComponentRegistry, 'ff:add_breads', {
        stateName: 'ff:toaster_with_breads',
        requiredItem: 'ff:bread_slice',
        addStates: { 0: 1, 1: 2 },
        addSound: 'random.pop',
        removeState: 2,
        resetState: 0,
        removeSound: 'random.pop2',
        spawnItems: ['ff:bread_slice', 'ff:bread_slice']
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:add_new_stacked_book', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const stacked_book = Utils.getBlockState(block, "book:state");
            const book_s = block.permutation.withState("book:state", stacked_book + 1);
            const book_remove = block.permutation.withState("book:vertical_stacked", + 1);
            const selectedItem = Utils.getSelectedItem(player);
            
            if (selectedItem && selectedItem.typeId === 'ff:stacked_books' && Utils.getBlockState(block, "book:state") < 3) {
                Utils.playSoundForPlayer(player, "use.candle");
                block.setPermutation(book_s);
                Utils.consumeItem(player, selectedItem);
                return;
            }
            
            if (player.isSneaking && Utils.getBlockState(block, "book:state") === 3) {
                Utils.playSoundForPlayer(player, "fall.wood");
                block.setPermutation(book_remove);
                return;
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:sink_open_close', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const currentState = Utils.getBlockState(block, "ff:sink_vars");
            
            if (currentState === 0) {
                Utils.setBlockState(block, "ff:sink_vars", 1);
                Utils.playSoundForPlayer(player, "mob.axolotl.splash");
            } else if (currentState === 1) {
                Utils.setBlockState(block, "ff:sink_vars", 0);
            }
        },
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:trash_items', {
        onPlayerInteract: e => {
            const { player } = e;
            const selectedItem = Utils.getSelectedItem(player);

            if (!player.isSneaking && selectedItem) {
                Utils.playSoundForPlayer(player, "random.pop2");
                Utils.consumeItem(player, selectedItem);
            }
        }
    });
});

const WeatherSystem = {
    currentWeather: "Clear",
    weatherPermutations: new Map(),
    
    init() {
        world.beforeEvents.weatherChange.subscribe(({ newWeather }) => {
            this.currentWeather = newWeather;
            world.setDynamicProperty("ff:dynamic_weather_system", newWeather);
        });
    },
    
    getWeatherPermutation(block, channel) {
        const key = `${block.typeId}_${channel}`;
        if (!this.weatherPermutations.has(key)) {
            this.weatherPermutations.set(key, block.permutation.withState("ff:channels", channel));
        }
        return this.weatherPermutations.get(key);
    },
    
    updateTVChannel(block) {
        const current = Utils.getBlockState(block, "ff:channels");
        const weather = this.currentWeather;
        
        let newChannel = current;
        if (weather === "Rain" && (current === 1 || current === 3)) newChannel = 2;
        else if (weather === "Thunder" && (current === 1 || current === 2)) newChannel = 3;
        else if (weather === "Snow" && current === 1) newChannel = 4;
        else if (weather === "Clear" && (current >= 2 && current <= 4)) newChannel = 1;
        
        if (newChannel !== current) {
            block.setPermutation(this.getWeatherPermutation(block, newChannel));
        }
    }
};

// Initialize weather system
WeatherSystem.init();
// Couch system for managing chair transformations
const CouchSystem = {
    addCushion(player, block, woodType, isStool = false) {
        const item = Utils.getSelectedItem(player);
        if (player.isSneaking || !item || item.typeId !== 'ff:white_cushion') return;

        Utils.playSoundForPlayer(player, 'hit.cloth');
        block.dimension.spawnParticle('ff:cushion_effect', {
            x: block.location.x + 0.5,
            y: block.location.y + 0.5,
            z: block.location.z + 0.5
        });

        Utils.consumeItem(player, item);

        const directions = isStool ? [...DIRECTIONS, 'up'] : DIRECTIONS;
        const { x, y, z } = block.location;
        const baseType = isStool ? `ff:wooden_${woodType}_stool` : `ff:wooden_${woodType}_chair`;
        const targetType = `${baseType}_with_wool`;

        directions.forEach(dir => {
            block.dimension.runCommand(
                `fill ${x} ${y} ${z} ${x} ${y} ${z} ` +
                `${targetType}["minecraft:cardinal_direction"="${dir}"] ` +
                `replace ${baseType}["minecraft:cardinal_direction"="${dir}"]`
            );
        });
    },

    removeCushion(player, block, woodType, isStool = false) {
        if (!player.isSneaking) return;

        if (player.getGameMode() !== GameMode.creative) {
            Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:white_cushion", 1), block);
        }

        const { x, y, z } = block.location;
        const baseType = isStool ? `ff:wooden_${woodType}_stool` : `ff:wooden_${woodType}_chair`;
        const currentType = block.typeId;
        
        block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ${baseType} replace ${currentType}`);
        
        const newBlock = block.dimension.getBlock({ x, y, z });
        if (newBlock) {
            try {
                const face = block.permutation.getState("minecraft:cardinal_direction");
                if (face !== undefined) {
                    newBlock.setPermutation(newBlock.permutation.withState("minecraft:cardinal_direction", face));
                }
            } catch (error) {
                console.warn(`Error applying states: ${error}`);
            }
        }
    }
};




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


/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


let lastInteraction = { player: null, block: null, time: 0 };

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player } = event;
    const blockType = block.typeId;
    
    if (!['ff:cinder_log', 'ff:cinder_wood', 'ff:spicewood_log', 'ff:spicewood_wood'].includes(blockType)) return;
    
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
        'acacia','pale','spruce','cinder','spicewood'
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
        block.dimension.spawnParticle("ff:curtain_open_dust", {
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


world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("ff:spicewood_sapling", {
        onPlayerInteract: e => {
            const { player, block } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            
            if (selectedItem && selectedItem.typeId === 'minecraft:bone_meal') {
                const { x, y, z } = block.location;
                
                const saplingPositions = [
                    { x: x, y: y, z: z },
                    { x: x + 1, y: y, z: z },
                    { x: x, y: y, z: z + 1 },
                    { x: x + 1, y: y, z: z + 1 }
                ];
                
                let hasAllSaplings = true;
                let missingSaplings = [];
                for (const pos of saplingPositions) {
                    const checkBlock = block.dimension.getBlock(pos);
                    if (!checkBlock || checkBlock.typeId !== 'ff:spicewood_sapling') {
                        hasAllSaplings = false;
                        missingSaplings.push(`${pos.x},${pos.y},${pos.z}: ${checkBlock ? checkBlock.typeId : 'null'}`);
                    }
                }
   
                if (!hasAllSaplings) {
                }
                
                if (hasAllSaplings && Math.random() < 0.3) {
                    for (const pos of saplingPositions) {
                        block.dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air`);
                    }
                    
                    block.dimension.runCommand(`structure load spicewood_tree_large ${x - 5} ${y} ${z - 5}`);
                    
                    for (let i = 0; i < 3; i++) {
                        const randomX = x + Math.random();
                        const randomY = y + 0.5 + Math.random() * 0.8;
                        const randomZ = z + Math.random();
                        block.dimension.spawnParticle("minecraft:villager_happy", { x: randomX, y: randomY, z: randomZ });
                    }
                    
                    player.playSound("block.grass.place");
                    
                    if (player.getGameMode() !== GameMode.creative) {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                } else if (!hasAllSaplings && Math.random() < 0.3) {
                    const smallTreeType = Math.random() < 0.5 ? 'spicewood_tree_small_2' : 'spicewood_tree_small_3';
                    
                    block.dimension.runCommand(`setblock ${x} ${y} ${z} air`);
                    block.dimension.runCommand(`structure load ${smallTreeType} ${x - 1} ${y} ${z - 1}`);
                    
                    for (let i = 0; i < 3; i++) {
                        const randomX = x + Math.random();
                        const randomY = y + 0.5 + Math.random() * 0.8;
                        const randomZ = z + Math.random();
                        block.dimension.spawnParticle("minecraft:villager_happy", { x: randomX, y: randomY, z: randomZ });
                    }
                    
                    player.playSound("block.grass.place");
                    
                    if (player.getGameMode() !== GameMode.creative) {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                } else {
                    
                    for (let i = 0; i < 3; i++) {
                        const randomX = x + Math.random();
                        const randomY = y + 0.5 + Math.random() * 0.8;
                        const randomZ = z + Math.random();
                        block.dimension.spawnParticle("minecraft:villager_happy", { x: randomX, y: randomY, z: randomZ });
                    }
                    
                    player.playSound("block.grass.break");
                    
                    if (player.getGameMode() !== GameMode.creative) {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        },
        
        onRandomTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            
            const lightBlock = block.dimension.getBlock({ x, y: y + 1, z });
            const lightLevel = lightBlock ? lightBlock.light : 0;
            
            if (lightLevel < 9) {
                return;
            }
            
            const saplingPositions = [
                { x: x, y: y, z: z },
                { x: x + 1, y: y, z: z },
                { x: x, y: y, z: z + 1 },
                { x: x + 1, y: y, z: z + 1 }
            ];
            
            let hasAllSaplings = true;
            let missingSaplings = [];
            for (const pos of saplingPositions) {
                const checkBlock = block.dimension.getBlock(pos);
                if (!checkBlock || checkBlock.typeId !== 'ff:spicewood_sapling') {
                    hasAllSaplings = false;
                    missingSaplings.push(`${pos.x},${pos.y},${pos.z}: ${checkBlock ? checkBlock.typeId : 'null'}`);
                }
            }
            
            if (!hasAllSaplings) {
                return;
            }
            
            let hasSpace = true;
            let blockingBlocks = [];
            for (let dx = -2; dx <= 3 && hasSpace; dx++) {
                for (let dz = -2; dz <= 3 && hasSpace; dz++) {
                    for (let dy = 1; dy <= 7 && hasSpace; dy++) {
                        const checkBlock = block.dimension.getBlock({ 
                            x: x + dx, 
                            y: y + dy, 
                            z: z + dz 
                        });
                        if (checkBlock && checkBlock.typeId !== 'minecraft:air') {
                            hasSpace = false;
                            blockingBlocks.push(`${x + dx},${y + dy},${z + dz}: ${checkBlock.typeId}`);
                        }
                    }
                }
            }
            
            if (!hasSpace) {
                
                return;
            }
            
            const randomChance = Math.random();
            if (randomChance < 10) {
                for (const pos of saplingPositions) {
                    block.dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air`);
                }
                
                block.dimension.runCommand(`structure load spicewood_tree_large ${x - 5} ${y} ${z - 5}`);
                
                block.dimension.runCommand(`playsound block.grass.place @a ~ ~ ~`);
            }
        }
    });
});
