import * as server from "@minecraft/server"

server.world.afterEvents.playerPlaceBlock.subscribe(result => {
    if (result.block.typeId == "ff:pan") {
        result.block.dimension.spawnEntity("ff:pan_bottom_left", { x: result.block.x + 0.40, y: result.block.y, z: result.block.z + 0.60 })
        result.block.dimension.spawnEntity("ff:pan_bottom_right", { x: result.block.x + 0.60, y: result.block.y, z: result.block.z + 0.60 })
        result.block.dimension.spawnEntity("ff:pan_top_left", { x: result.block.x + 0.40, y: result.block.y, z: result.block.z + 0.40 })
        result.block.dimension.spawnEntity("ff:pan_top_right", { x: result.block.x + 0.60, y: result.block.y, z: result.block.z + 0.40 })
    }
})


server.system.beforeEvents.startup.subscribe(result => {
    result.blockComponentRegistry.registerCustomComponent("ff:rotation", {
        beforeOnPlayerPlace: result => {
            let direction = 0
            try {
                let rotationAngle = result.player.getRotation().y
                direction = rotationAngle >= -45 && rotationAngle < 45 ? 3 :
                    rotationAngle >= 45 && rotationAngle < 135 ? 4 :
                        rotationAngle >= -135 && rotationAngle < -45 ? 5 : 2;
            } catch (e) {
            }
            let state = result.block.permutation.getAllStates()
            state["block:rotation"] = direction
            result.permutationToPlace = server.BlockPermutation.resolve(result.permutationToPlace.type.id, state)
        }
    })
    result.blockComponentRegistry.registerCustomComponent("ff:pan", {
        onTick: result => {

            let state = result.block.permutation.getAllStates()
            if (result.block.below(1).hasTag("stove_on")) state["block:stove_below"] = true
            else if (result.block.below(1).hasTag("stove_off")) state["block:stove_below"] = false

            const permutation = server.BlockPermutation.resolve(result.block.typeId, state)
            result.block.setPermutation(permutation)

            if (Math.random() < 0.09 && state["block:stove_below"] == true) {
                result.block.dimension.runCommand(`particle ff:pan_smoke ${result.block.location.x} ${result.block.location.y + 0.1} ${result.block.location.z}`)
            }
            if (Math.random() < 0.2 && state["block:stove_below"] == true) {
                result.block.dimension.runCommand(`particle ff:pan_oil ${result.block.location.x} ${result.block.location.y + 0.1} ${result.block.location.z}`)
            }
            result.block.setPermutation(server.BlockPermutation.resolve(result.block.typeId, state))
        },
        onPlayerInteract: result => {
            if (result.player.isSneaking || result.face != "Up") return;
            let selectedQuadrant
            let x = (result.faceLocation.x % 1 + 1) % 1;
            let z = (result.faceLocation.z % 1 + 1) % 1;

            if (x > 0 && x < 0.5 && z > 0.5 && z < 1) {
                selectedQuadrant = "bottom_left"
            }
            if (x > 0.5 && x < 1 && z > 0.5 && z < 1) {
                selectedQuadrant = "bottom_right"
            }
            if (x > 0 && x < 0.5 && z > 0 && z < 0.5) {
                selectedQuadrant = "top_left"
            }
            if (x > 0.5 && x < 1 && z > 0 && z < 0.5) {
                selectedQuadrant = "top_right"
            }
            let item = result.player.getComponent("minecraft:equippable").getEquipment("Mainhand")

            let entities = result.block.dimension.getEntitiesAtBlockLocation(result.block.center()).filter(entity => entity.typeId !== "minecraft:player");

            let interactEntity = entities[0]

            const typeQuadrantMap = {
                "ff:pan_bottom_left": "bottom_left",
                "ff:pan_bottom_right": "bottom_right",
                "ff:pan_top_left": "top_left",
                "ff:pan_top_right": "top_right"
            };

            entities.forEach(entity => {
                if (typeQuadrantMap[entity.typeId] === selectedQuadrant) {
                    interactEntity = entity;
                }
            });

            if (!result.player.getComponent("minecraft:equippable").getEquipment("Mainhand")) {

                if (interactEntity.getTags().length > 0) {
                    interactEntity.getTags().forEach(tag => {
                        result.player.getComponent(server.EntityInventoryComponent.componentId).container.addItem(new server.ItemStack(tag, 1))
                        interactEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 air`)
                        interactEntity.removeTag(tag)
                    })
                }
            }
            else {
                let stop = false
                interactEntity.getTags().forEach(tag => {

                    if (item.typeId == tag) {
                        result.player.getComponent(server.EntityInventoryComponent.componentId).container.addItem(new server.ItemStack(item.typeId, 1))
                        interactEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 air`)
                        stop = true
                    }
                    else {
                        result.player.getComponent(server.EntityInventoryComponent.componentId).container.addItem(new server.ItemStack(tag, 1))
                    }

                    interactEntity.removeTag(tag)
                })

                if (stop) return;

                interactEntity.setRotation({ x: result.player.getRotation().x, y: result.player.getRotation().y - 160 })
                interactEntity.addTag(item.typeId)
                interactEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1`)

                if (interactEntity.getTags().length > 0) {
                    if (item.amount == 1)
                        result.player.getComponent(server.EntityInventoryComponent.componentId).container.setItem(result.player.selectedSlotIndex, undefined)
                    else {
                        item.amount--
                        result.player.getComponent(server.EntityInventoryComponent.componentId).container.setItem(result.player.selectedSlotIndex, item)
                    }
                }
                if (result.block.below(1).hasTag("stove_on")) {
                    interactEntity.runCommand(`event entity @s ff:cook_timer`)
                    interactEntity.dimension.playSound("add_food", interactEntity.location)
                    interactEntity.dimension.playSound("mob.zombie.remedy", interactEntity.location, { volume: 0.5 })
                    server.system.runTimeout(() => {
                        try {
                            interactEntity?.runCommand("function stove_cooking")
                            interactEntity?.triggerEvent("ff:kill")
                        } catch (e) {
                        }
                        server.system.runTimeout(() => {
                            result.player.runCommand(`execute positioned ${result.block.center().x} ${result.block.center().y} ${result.block.center().z} run tp @e[type=item,r=1.1] ${result.block.center().x} ${result.block.center().y} ${result.block.center().z}`)
                        }, 1)
                    }, 600)
                }
            }
        }
    })
    result.blockComponentRegistry.registerCustomComponent("ff:stove", {
        onPlayerInteract: result => {
            let state = result.block.permutation.getAllStates()
            let item = result.player.getComponent("minecraft:equippable").getEquipment("Mainhand")
            if (state["block:lit"] == true && item?.typeId == "minecraft:water_bucket") {
                state["block:lit"] = false
                result.player.getComponent("minecraft:equippable").setEquipment("Mainhand", new server.ItemStack("minecraft:bucket", 1))
                result.player.dimension.playSound("extinguish.candle", result.block.location)
            }
            else if (state["block:lit"] == false && item?.typeId == "minecraft:flint_and_steel") {
                state["block:lit"] = true
                if (item.getComponent("minecraft:durability").damage < item.getComponent("minecraft:durability").maxDurability) {
                    item.getComponent("minecraft:durability").damage++
                    result.player.getComponent("minecraft:equippable").setEquipment("Mainhand", item)
                }
                else {
                    result.player.getComponent("minecraft:equippable").setEquipment("Mainhand", undefined)
                    result.player.dimension.playSound("random.break", result.player.location)
                }
                result.player.dimension.playSound("fire.ignite", result.block.location)
            }
            result.block.setPermutation(server.BlockPermutation.resolve(result.block.typeId, state))
        }
    })
})