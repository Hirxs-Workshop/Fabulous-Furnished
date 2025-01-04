import { world, system, BlockPermutation, ItemStack } from '@minecraft/server'

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:on_player_place', {
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

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:toilet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const toilet_open = block.permutation.withState("ff:bathroom_vars", 1);
            const toilet_function = block.permutation.withState("ff:bathroom_vars", 2);
            const toilet_close = block.permutation.withState("ff:bathroom_vars", 3);
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
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:interactive_block', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const updates = e.block.permutation.getState("ff:lamp_state");
            const update = block.permutation.withState("ff:lamp_state", updates + 1);
            block.setPermutation(update);
            player.playSound("random.click");
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:paper_fill', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const paper_remain = e.block.permutation.getState("ff:paper");
            const remove_paper_items = block.permutation.withState("ff:paper", paper_remain - 1);
            const remove_paper_items_fully = block.permutation.withState("ff:paper", 0);
            const paper_fill = block.permutation.withState("ff:paper", 9)
            const paperObtain = new ItemStack("minecraft:paper");
            const paperObtainItem = new ItemStack("ff:toilet_paper_item");
            if (selectedItem && (selectedItem.typeId === 'ff:toilet_paper_item') && block.permutation.getState("ff:paper") === 0) {
                block.setPermutation(paper_fill);
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 9) {
                block.setPermutation(remove_paper_items);

                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 8) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 7) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 6) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 5) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 4) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 3) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 2) {
                block.setPermutation(remove_paper_items);
                block.dimension.spawnItem(paperObtain, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (!player.isSneaking && block.permutation.getState("ff:paper") === 1) {
                block.setPermutation(remove_paper_items);
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 9) {
                block.setPermutation(remove_paper_items_fully);

                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 8) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 7) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 6) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 5) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 4) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 3) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }
            if (player.isSneaking && block.permutation.getState("ff:paper") === 2) {
                block.setPermutation(remove_paper_items_fully);
                block.dimension.spawnItem(paperObtainItem, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                return;
            }

        }
    });
});


world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:add_new_stacked_book', {
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
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:test_cushion', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem.typeId === 'ff:white_cushion' && block.permutation.getState("minecraft:cardinal_direction") === "north") {
                block.dimension.runCommandAsync(`setblock ${x} ${y} ${z} ff:wooden_oak_chair_with_wool["minecraft:cardinal_direction"="north","ef:colors"=0]`);
                e.source.playSound("block.lantern.break");

            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:paint_fence', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            if (selectedItem.typeId === 'ef:brush_with_paint_white') {
                block.dimension.runCommandAsync(`setblock ${x} ${y} ${z} ff:garden_paintable_fence_oak`);
                block.dimension.spawnParticle("ff:paint_drip_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                player.playSound("mob.axolotl.splash");
                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:sink_open_close', {
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
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:trash_items', {
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

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:jungle_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_jungle_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_jungle_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_jungle_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_jungle_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_jungle_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_jungle_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_jungle_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_jungle_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:birch_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_birch_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_birch_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_birch_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_birch_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_birch_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_birch_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_birch_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_birch_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:crimson_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_crimson_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_crimson_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_crimson_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_crimson_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_crimson_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_crimson_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_crimson_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_crimson_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:warped_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_warped_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_warped_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_warped_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_warped_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_warped_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_warped_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_warped_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_warped_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:cherry_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cherry_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_cherry_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cherry_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_cherry_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cherry_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_cherry_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cherry_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_cherry_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:mangrove_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_mangrove_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_mangrove_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_mangrove_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_mangrove_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_mangrove_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_mangrove_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_mangrove_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_mangrove_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:oak_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_oak_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_oak_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_oak_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_oak_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_oak_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_oak_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_oak_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_oak_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:dark_oak_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_dark_oak_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_dark_oak_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_dark_oak_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_dark_oak_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_dark_oak_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_dark_oak_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_dark_oak_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_dark_oak_chair["minecraft:cardinal_direction"="west"]`);
                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:acacia_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_acacia_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_acacia_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_acacia_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_acacia_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_acacia_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_acacia_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_acacia_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_acacia_chair["minecraft:cardinal_direction"="west"]`);

                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:pale_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_pale_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_pale_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_pale_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_pale_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_pale_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_pale_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_pale_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_pale_chair["minecraft:cardinal_direction"="west"]`);

                return;
            }
        },
    });
});


world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:spruce_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_spruce_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_spruce_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_spruce_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_spruce_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_spruce_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_spruce_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_spruce_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_spruce_chair["minecraft:cardinal_direction"="west"]`);

                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:cinder_add_couch', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:white_cushion')) {
                player.playSound("random.pop");
                if (selectedItem.amount > 1) {
                    selectedItem.amount -= 1;
                    equipment.setEquipment('Mainhand', selectedItem);
                } else {
                    equipment.setEquipment('Mainhand', undefined);
                }
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cinder_chair_with_wool["minecraft:cardinal_direction"="north"] replace ff:wooden_cinder_chair["minecraft:cardinal_direction"="north"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cinder_chair_with_wool["minecraft:cardinal_direction"="south"] replace ff:wooden_cinder_chair["minecraft:cardinal_direction"="south"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cinder_chair_with_wool["minecraft:cardinal_direction"="east"] replace ff:wooden_cinder_chair["minecraft:cardinal_direction"="east"]`);
                block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ff:wooden_cinder_chair_with_wool["minecraft:cardinal_direction"="west"] replace ff:wooden_cinder_chair["minecraft:cardinal_direction"="west"]`);

                return;
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:add_breads', {
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

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:outlet_function', {
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

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:tv_change_channel', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const turn_on = block.permutation.withState("ff:channels", 1);
            const turn_off_clear = block.permutation.withState("ff:channels", 0);
            const turn_off_rain = block.permutation.withState("ff:channels", 0);
            player.playSound("random.click");
            if (block.permutation.getState("ff:channels") === 0) {
                block.setPermutation(turn_on);
                return;
            }
            if (block.permutation.getState("ff:channels") === 1) {
                block.setPermutation(turn_off_clear);
                return;
            }
            if (block.permutation.getState("ff:channels") === 2) {
                block.setPermutation(turn_off_rain);
                return;
            }
            if (block.permutation.getState("ff:channels") === 3) {
                block.setPermutation(turn_off_rain);
                return;
            }
            if (block.permutation.getState("ff:channels") === 4) {
                block.setPermutation(turn_off_rain);
                return;
            }

        }
    });
});

world.beforeEvents.worldInitialize.subscribe((data) => {
    data.blockComponentRegistry.registerCustomComponent("ff:tv_weather_channel", {
      onTick(data) {
        const { player, block } = data;
        const { x, y, z } = block.location;
        const weather_snow = block.permutation.withState("ff:channels", 4);
        const weather_thunder = block.permutation.withState("ff:channels", 3);
        const weather_rain = block.permutation.withState("ff:channels", 2);
        const weather_clear = block.permutation.withState("ff:channels", 1);
        const weather = data.dimension.getWeather()
        if (block.permutation.getState("ff:channels") === 1 && weather === 'Rain') {
            block.setPermutation(weather_rain);
        }
        if (block.permutation.getState("ff:channels") === 3 && weather === 'Rain') {
            block.setPermutation(weather_rain);
        }
        if (block.permutation.getState("ff:channels") === 2 && weather === 'Thunder') {
            block.setPermutation(weather_thunder);
        }
        if (block.permutation.getState("ff:channels") === 1 && weather === 'Thunder') {
            block.setPermutation(weather_thunder);
        }
        if (block.permutation.getState("ff:channels") === 1 && weather === 'Snow') {
            block.setPermutation(weather_snow);
        }
        if (block.permutation.getState("ff:channels") === 2 && weather === 'Clear') {
            block.setPermutation(weather_clear);
        }
        if (block.permutation.getState("ff:channels") === 3 && weather === 'Clear') {
            block.setPermutation(weather_clear);
        }
        if (block.permutation.getState("ff:channels") === 4 && weather === 'Clear') {
            block.setPermutation(weather_clear);
        }
      },
    });
  });
  


world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:give_breads', {
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
        onRandomTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const breadtoastedGive = new ItemStack("ff:bread_slice_toasted");
            const breadtoastedGive2 = new ItemStack("ff:bread_slice_toasted");
            const finish_execute_toaster1 = block.permutation.withState("ff:toaster_with_breads", 0);
            const finish_execute_toaster2 = block.permutation.withState("ff:toaster_with_breads", 0);
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:toaster_with_breads") === 3) {
                block.setPermutation(finish_execute_toaster1);

                block.dimension.runCommand(`playsound ff:toast_finish @p`);
                block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:toaster_with_breads") === 4) {
                block.setPermutation(finish_execute_toaster2);
                block.dimension.runCommand(`playsound ff:toast_finish @p`);
                block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                block.dimension.spawnItem(breadtoastedGive2, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:smoke_toaster', {
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


world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:water_particle', {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1 && block.permutation.getState("minecraft:cardinal_direction") === "north") {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.5, y: block.location.y + 0.975, z: block.location.z + 0.35 });
            }
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1 && block.permutation.getState("minecraft:cardinal_direction") === "south") {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.5, y: block.location.y + 0.975, z: block.location.z + 0.65 });
            }
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1 && block.permutation.getState("minecraft:cardinal_direction") === "west") {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.35, y: block.location.y + 0.975, z: block.location.z + 0.50 });
            }
            if (Math.floor(Math.random() * 20) && block.permutation.getState("ff:sink_vars") === 1 && block.permutation.getState("minecraft:cardinal_direction") === "east") {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.65, y: block.location.y + 0.975, z: block.location.z + 0.50 });
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

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cinder_log_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!selectedItem?.hasTag('minecraft:is_axe')) return;
            const blockState = block.permutation.getState("minecraft:block_face");
            if (blockState) {
                const strippedWood = BlockPermutation.resolve('ff:stripped_cinder_log', {"minecraft:block_face": blockState});
                block.setPermutation(strippedWood);
            }
            player.playSound('step.wood');
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('ff:cinder_wood_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (!selectedItem?.hasTag('minecraft:is_axe')) return;
            const strippedWood = BlockPermutation.resolve('ff:stripped_cinder_wood');
            block.setPermutation(strippedWood);
            player.playSound('step.wood');
        }
    });
});