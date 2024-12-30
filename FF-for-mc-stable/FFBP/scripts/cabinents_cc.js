import {
    world,
    BlockPermutation,
    ItemStack
  } from '@minecraft/server'

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:container_function', {
        onPlace: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.runCommandAsync(`summon ef:inventory ${x} ${y} ${z}`);
        },
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const openCabinent = block.permutation.withState("ff:cabinent_type", 2);
            player.playSound("block.barrel.open");
            block.setPermutation(openCabinent);
        },
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const closeCabinet = block.permutation.withState("ff:cabinent_type", 1);
            if (block.permutation.getState("ff:cabinent_type") === 2) {
                block.dimension.runCommandAsync(`playsound block.barrel.open @p`);
                block.setPermutation(closeCabinet);
                return;
              }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:gift_container', {
        onPlace: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const changeCabinent = block.permutation.withState("ff:cabinent_type", 1);
            block.setPermutation(changeCabinent);
            if (block.permutation.getState("minecraft:cardinal_direction") === "north") {
                block.dimension.runCommandAsync(`summon sd:gift_box_bow ${x} ${y} ${z} 180 0`);
            }
            if (block.permutation.getState("minecraft:cardinal_direction") === "east") {
                block.dimension.runCommandAsync(`summon sd:gift_box_bow ${x} ${y} ${z} -90 0`);
            }
            if (block.permutation.getState("minecraft:cardinal_direction") === "south") {
                block.dimension.runCommandAsync(`summon sd:gift_box_bow ${x} ${y} ${z} 0 0`);
            }
            if (block.permutation.getState("minecraft:cardinal_direction") === "west") {
                block.dimension.runCommandAsync(`summon sd:gift_box_bow ${x} ${y} ${z} 90 0`);
            }
        },
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const openCabinent = block.permutation.withState("ff:cabinent_type", 2);
            player.playSound("block.barrel.open");
            block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:open_box`);
            block.setPermutation(openCabinent);
        },
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const closeCabinet = block.permutation.withState("ff:cabinent_type", 1);
            if (block.permutation.getState("ff:cabinent_type") === 2) {
                block.dimension.runCommandAsync(`playsound block.barrel.open @p`);
                block.dimension.runCommandAsync(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:closed_box`);
                block.setPermutation(closeCabinet);
                return;
              }
        }
    });
});