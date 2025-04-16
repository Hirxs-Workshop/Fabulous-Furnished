import { world, system, ItemStack } from "@minecraft/server"

// Paint function

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_white', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');

            if (block.permutation.getState("ef:colors") === 0) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Lol, you cannot assign the same color to the block")
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                const whitewhite = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitewhite);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                const whitemagenta = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitemagenta);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                const whitelight_blue = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitelight_blue);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                const whiteyellow = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whiteyellow);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                const whitelime = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitelime);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                const whitepink = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitepink);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                const whitegray = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitegray);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                const whitelight_gray = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitelight_gray);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                const whitecyan = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitecyan);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                const whitepurple = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitepurple);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                const whiteblue = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whiteblue);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                const whitebrown = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitebrown);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                const whitegreen = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitegreen);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                const whitered = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whitered);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                const whiteblack = e.block.permutation.withState("ef:colors", 0)

                block.setPermutation(whiteblack);
                block.dimension.spawnParticle("ff:paint_white", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }

        }
    });
})


// Colors

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_orange', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const orangewhite = e.block.permutation.withState("ef:colors", 1)

                block.setPermutation(orangewhite);
                block.dimension.spawnParticle("ff:paint_orange", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a orange paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_magenta', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const magentawhite = e.block.permutation.withState("ef:colors", 2)

                block.setPermutation(magentawhite);
                block.dimension.spawnParticle("ff:paint_magenta", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a magenta paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_light_blue', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const light_bluewhite = e.block.permutation.withState("ef:colors", 3)

                block.setPermutation(light_bluewhite);
                block.dimension.spawnParticle("ff:paint_light_blue", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a light blue paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_yellow', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const yellowwhite = e.block.permutation.withState("ef:colors", 4)

                block.setPermutation(yellowwhite);
                block.dimension.spawnParticle("ff:paint_yellow", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a yellow paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_lime', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const limewhite = e.block.permutation.withState("ef:colors", 5)

                block.setPermutation(limewhite);
                block.dimension.spawnParticle("ff:paint_lime", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a lime paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_pink', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const pinkwhite = e.block.permutation.withState("ef:colors", 6)

                block.setPermutation(pinkwhite);
                block.dimension.spawnParticle("ff:paint_pink", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a pink paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_gray', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const graywhite = e.block.permutation.withState("ef:colors", 7)

                block.setPermutation(graywhite);
                block.dimension.spawnParticle("ff:paint_gray", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a gray paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_light_gray', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const light_graywhite = e.block.permutation.withState("ef:colors", 8)

                block.setPermutation(light_graywhite);
                block.dimension.spawnParticle("ff:paint_light_gray", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a light gray paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_cyan', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const cyanwhite = e.block.permutation.withState("ef:colors", 9)

                block.setPermutation(cyanwhite);
                block.dimension.spawnParticle("ff:paint_cyan", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a cyan paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_purple', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const purplewhite = e.block.permutation.withState("ef:colors", 10)

                block.setPermutation(purplewhite);
                block.dimension.spawnParticle("ff:paint_purple", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a purple paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_blue', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const bluewhite = e.block.permutation.withState("ef:colors", 11)

                block.setPermutation(bluewhite);
                block.dimension.spawnParticle("ff:paint_blue", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a blue paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_brown', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const brownwhite = e.block.permutation.withState("ef:colors", 12)

                block.setPermutation(brownwhite);
                block.dimension.spawnParticle("ff:paint_brown", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a brown paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_green', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const greenwhite = e.block.permutation.withState("ef:colors", 13)

                block.setPermutation(greenwhite);
                block.dimension.spawnParticle("ff:paint_green", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a green paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_red', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const redwhite = e.block.permutation.withState("ef:colors", 14)

                block.setPermutation(redwhite);
                block.dimension.spawnParticle("ff:paint_red", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a red paint")
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                return;
            }

        }
    });
})

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:brush_paint_black', {
        onUseOn: e => {
            const { block, player } = e;

            const equipment = e.source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const durability = selectedItem.getComponent('durability');
            const warning = block.permutation.getState("ef:colors") && e.source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
            if (block.permutation.getState("ef:colors") === 0) {
                const blackwhite = e.block.permutation.withState("ef:colors", 15)

                block.setPermutation(blackwhite);
                block.dimension.spawnParticle("ff:paint_black", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
                e.source.playSound("mob.axolotl.splash");

                if (durability && durability.damage < durability.maxDurability) {
                    durability.damage++;
                    equipment.setEquipment('Mainhand', selectedItem);
                }
                if (durability && durability.damage >= durability.maxDurability) {
                    equipment.setEquipment('Mainhand', new ItemStack('ef:brush_empty', 1));
                }
                return;
            }
            if (block.permutation.getState("ef:colors") === 1) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 2) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 3) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 4) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 5) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 6) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 7) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 8) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 9) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 10) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 11) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 12) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 13) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 14) {
                e.source.playSound("note.bass");
                return;
            }
            if (block.permutation.getState("ef:colors") === 15) {
                e.source.playSound("note.bass");
                e.source.runCommand("title @s actionbar §6 Uh? It seems that this chair already has a black paint")
                return;
            }

        }
    });
})

// Hammer function

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent('ff:hammer_chisel', {
        onUseOn: e => {
            const { block, player } = e;
            const updates = e.block.permutation.getState("p:changer")
            block.setPermutation(block.permutation.withState("p:changer", updates + 1));
            e.source.playSound("mob.zombie.wood");
        }
    });
})

// cushion
