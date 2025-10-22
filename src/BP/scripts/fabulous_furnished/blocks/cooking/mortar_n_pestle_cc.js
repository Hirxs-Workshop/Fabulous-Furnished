import { world, ItemStack, BlockPermutation, EquipmentSlot, system } from "@minecraft/server";

const mortarData = new Map();

const MortarUtils = {
    getKey(block) {
        return `${block.location.x},${block.location.y},${block.location.z}`;
    },

    getGrindableItems() {
        return {
            "minecraft:wheat": "ff:flour",
            "minecraft:sugar_cane": "minecraft:sugar"
        };
    },

    addIngredient(block, ingredient) {
        const key = this.getKey(block);
        mortarData.set(key, ingredient);
    },

    getIngredient(block) {
        const key = this.getKey(block);
        return mortarData.get(key);
    },

    clearIngredient(block) {
        const key = this.getKey(block);
        mortarData.delete(key);
    },

    updateBlockState(block, newState) {
        const currentState = block.permutation.getAllStates();
        const updatedState = { ...currentState, ...newState };
        block.setPermutation(BlockPermutation.resolve(block.typeId, updatedState));
    },

    spawnPanEntity(block, itemTypeId, amount = 1) {
        const dim = block.dimension;
        const center = block.center();
        const spawnPos = { x: center.x, y: center.y - 0.2, z: center.z };

        this.cleanupPanEntity(block);

        try {
            const e = dim.spawnEntity("ff:pan_bottom_left", spawnPos);
            if (e) {
                e.addTag(`input:${itemTypeId}`);
                e.addTag(`amount:${amount}`);
                e.addTag(itemTypeId);

                system.runTimeout(() => {
                    try {
                        const eq = e.getComponent("minecraft:equippable");
                        if (eq) {
                            eq.setEquipment(EquipmentSlot.Mainhand, new ItemStack(itemTypeId, amount));
                        }
                    } catch {}
                    try {
                        e.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${itemTypeId} ${amount}`);
                    } catch {}
                    try {
                        dim.runCommand(`execute positioned ${spawnPos.x} ${spawnPos.y} ${spawnPos.z} run replaceitem entity @e[type=ff:pan_bottom_left,r=0.8] slot.weapon.mainhand 0 ${itemTypeId} ${amount}`);
                    } catch {}
                }, 1);
                system.runTimeout(() => {
                    try {
                        dim.runCommand(`execute positioned ${spawnPos.x} ${spawnPos.y} ${spawnPos.z} run replaceitem entity @e[type=ff:pan_bottom_left,r=0.8] slot.weapon.mainhand 0 ${itemTypeId} ${amount}`);
                    } catch {}
                }, 4);
            }
        } catch (_) {
        // nothing :)
        }
    },

    cleanupPanEntity(block) {
        const dim = block.dimension;
        const center = block.center();
        const entities = dim.getEntitiesAtBlockLocation(center) || [];
        for (const e of entities) {
            if (e.typeId === "ff:pan_bottom_left") {
                try { e.runCommand(`event entity @s ff:kill`); } catch {}
                try { e.runCommand(`event entity @s ff:despawn`); } catch {}
            }
        }
    }
};

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent("ff:mortar_interaction", {
        onPlayerInteract(e) {
            const { block, player, dimension: dim } = e;
            const inv = player.getComponent("minecraft:inventory").container;
            const equippable = player.getComponent("minecraft:equippable");
            const item = equippable.getEquipment(EquipmentSlot.Mainhand);
            const state = block.permutation.getAllStates();

            if (!item) {
                if (state["ff:with_pestle"]) {
                    inv.addItem(new ItemStack("ff:pestle", 1));
                    MortarUtils.updateBlockState(block, { "ff:with_pestle": false });
                    dim.playSound("dig.stone", block.location);
                }
                return;
            }

            const grindableItems = MortarUtils.getGrindableItems();

            if (item.typeId === "ff:pestle") {
                const ingredient = MortarUtils.getIngredient(block);
                if (ingredient && grindableItems[ingredient]) {
                    const outputItem = grindableItems[ingredient];
                    inv.addItem(new ItemStack(outputItem, 1));
                    MortarUtils.cleanupPanEntity(block);
                    MortarUtils.clearIngredient(block);
                    dim.playSound("block.grindstone.use", block.location);
                    try {
                        const p = block.center();
                        dim.spawnParticle("ff:mortar_smoke", p);
                    } catch {
                        try {
                            const p = block.center();
                            dim.runCommand(`execute positioned ${p.x} ${p.y} ${p.z} run particle ff:mortar_smoke ~~~`);
                        } catch {}
                    }
                    
                    const itemName = ingredient === "minecraft:wheat" ? "flour" : "sugar";
                } else {
                    if (item.amount > 1) {
                        item.amount--;
                        equippable.setEquipment(EquipmentSlot.Mainhand, item);
                    } else {
                        equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
                    }
                    
                    MortarUtils.updateBlockState(block, { "ff:with_pestle": true });
                    dim.playSound("dig.stone", block.location);
                }
                return;
            }

            if (grindableItems[item.typeId]) {
                const currentIngredient = MortarUtils.getIngredient(block);
                if (currentIngredient) {
                    player.sendMessage("§6(!) Mortar already contains an ingredient");
                    return;
                }

                MortarUtils.addIngredient(block, item.typeId);
                MortarUtils.spawnPanEntity(block, item.typeId, 1);
                
                if (item.amount > 1) {
                    item.amount--;
                    equippable.setEquipment(EquipmentSlot.Mainhand, item);
                } else {
                    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
                }

                dim.playSound("dig.gravel", block.location);
                player.sendMessage("§qIngredient added!\n§7- Use pestle to grind");
                return;
            }

            if (item.typeId === "minecraft:bucket" && item.typeId.includes("bucket")) {
                MortarUtils.clearIngredient(block);
                dim.playSound("cauldron.fillwater", block.location);
                return;
            }
        }
    });

    eventData.blockComponentRegistry.registerCustomComponent("ff:mortar_pestle_placement", {
        onPlace(e) {
            const { block } = e;
            MortarUtils.updateBlockState(block, { "ff:with_pestle": true });
        }
    });

    eventData.blockComponentRegistry.registerCustomComponent("ff:mortar_cleanup", {
        onPlayerDestroy(e) {
            const { block } = e;
            MortarUtils.clearIngredient(block);
        }
    });
});
