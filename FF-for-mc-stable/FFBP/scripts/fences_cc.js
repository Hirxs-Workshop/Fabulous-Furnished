import { world, ItemStack, BlockTypes, BlockPermutation } from '@minecraft/server';
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:oak_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_oak_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:birch_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_birch_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:dark_oak_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_dark_oak_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:spruce_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_spruce_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:acacia_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_acacia_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:pale_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_pale_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cinder_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_cinder_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:jungle_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_jungle_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:mangrove_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_mangrove_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cherry_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_cherry_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:warped_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_warped_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:crimson_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block } = e;
            const aboveBlock = block.above();
            if (aboveBlock.typeId === 'ff:garden_fence_crimson_inventory') {
                aboveBlock.setType('minecraft:air')
            }
        }
    });
});



world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:birch_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_birch_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:dark_oak_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_dark_oak_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:acacia_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_acacia_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:pale_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_pale_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cinder_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_cinder_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:spruce_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_spruce_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:jungle_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_jungle_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:crimson_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_crimson_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:warped_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_warped_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cherry_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_cherry_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:mangrove_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
                const aboveBlock = block.above();
                if (aboveBlock.typeId === 'ff:garden_fence_mangrove_inventory') {
                    aboveBlock.setType(selectedItem.typeId);
                    if (player.getGameMode() !== "creative") {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:oak_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_oak')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_oak_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:birch_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_birch')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_birch_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:dark_oak_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_dark_oak')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_dark_oak_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:jungle_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_jungle')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_jungle_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:acacia_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_acacia')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_acacia_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cinder_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_cinder')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_cinder_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:pale_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_pale')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_pale_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cherry_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_cherry')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_cherry_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:mangrove_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_mangrove')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_mangrove_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:warped_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_warped')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_warped_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:crimson_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_crimson')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_crimson_inventory', { 'ff:post': 1 }))
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:spruce_on_player_placed', {
        onPlace(e) {
            const { block } = e;
            const aboveBlock = block.above();
            e.block.setType('ff:garden_fence_spruce')
            if (aboveBlock.typeId === 'minecraft:air') {
                aboveBlock.setPermutation(BlockPermutation.resolve('ff:garden_fence_spruce_inventory', { 'ff:post': 1 }))
            }
        }
    });
});