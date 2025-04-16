import {
    world,
    BlockPermutation,
    ItemStack, system
  } from '@minecraft/server'

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:container_function', {
        onPlace: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.runCommand(`summon ef:inventory ${x} ${y} ${z}`);
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
                block.dimension.runCommand(`playsound block.barrel.open @p`);
                block.setPermutation(closeCabinet);
                return;
              }
        }
    });
});

system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('sd:gift_container', {
        onPlace: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const changeCabinent = block.permutation.withState("ff:cabinent_type", 1);
            block.setPermutation(changeCabinent);
            if (block.permutation.getState("minecraft:cardinal_direction") === "north") {
                block.dimension.runCommand(`summon sd:gift_box_bow ${x} ${y} ${z} 180 0`);
            }
            if (block.permutation.getState("minecraft:cardinal_direction") === "east") {
                block.dimension.runCommand(`summon sd:gift_box_bow ${x} ${y} ${z} -90 0`);
            }
            if (block.permutation.getState("minecraft:cardinal_direction") === "south") {
                block.dimension.runCommand(`summon sd:gift_box_bow ${x} ${y} ${z} 0 0`);
            }
            if (block.permutation.getState("minecraft:cardinal_direction") === "west") {
                block.dimension.runCommand(`summon sd:gift_box_bow ${x} ${y} ${z} 90 0`);
            }
        },
        onPlayerDestroy: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] destroy`);
        },
        onDestroy: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] destroy`);
        },
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const openCabinent = block.permutation.withState("ff:cabinent_type", 2);
            player.playSound("block.barrel.open");
            block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:open_box`);
            block.setPermutation(openCabinent);
        },
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const closeCabinet = block.permutation.withState("ff:cabinent_type", 1);
            if (block.permutation.getState("ff:cabinent_type") === 2) {
                block.dimension.runCommand(`playsound block.barrel.open @p`);
                block.dimension.runCommand(`execute positioned ${x} ${y} ${z} run event entity @e[r=0.5] sd:closed_box`);
                block.setPermutation(closeCabinet);
                return;
              }
        }
    });
});