import { system, world, BlockPermutation, ItemStack } from "@minecraft/server";
system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:couch_function', {
        onPlace: (e) => {
            let block = e.block;
            let direction = block.permutation.getState('minecraft:cardinal_direction');
            if (direction === 'north' || direction === 'south') {
                couchEx(block, 'east', 'west', direction, 'couch');
            } else {
                couchEx(block, 'north', 'south', direction, 'couch');
            };
        },
        onPlayerDestroy: (e) => {
            let block = e.block;
            let previousBlock = e.destroyedBlockPermutation;
            ['west', 'east', 'north', 'south'].forEach(facingDirection => {
                if (block[facingDirection]().typeId === previousBlock.type.id) {
                    let direction = previousBlock.getState('minecraft:cardinal_direction');
                    if (direction === 'north' || direction === 'south') {
                        couchEx(block.east(), 'east', 'west', direction, 'couch');
                        couchEx(block.west(), 'east', 'west', direction, 'couch');
                    } else {
                        couchEx(block.north(), 'north', 'south', direction, 'couch');
                        couchEx(block.south(), 'north', 'south', direction, 'couch');
                    };
                }
            });
        }
    });
});
function normalizeDirection(direction) {
    if (direction === 'south') return 'north';
    if (direction === 'west') return 'east';
    return direction;
}
function modifycouchFunction(block, start, end, settingType) {
    if (start.x === end.x && start.z === end.z) {
        let height = block.below().isAir ? 2 : 1;
        block.setPermutation(BlockPermutation.resolve(block.typeId, { 'ff:d_state': 'both', 'ff:height': height, 'minecraft:cardinal_direction': normalizeDirection(block.permutation.getState('minecraft:cardinal_direction')) }));
        return
    };
    [start, end] = (start.x > end.x || (start.x === end.x && start.z > end.z)) ? [end, start] : [start, end];
    const [xStart, yNorm, zStart] = [start.x, start.y, start.z];
    const [xEnd, zEnd] = [end.x, end.z];
    let finalDirection = normalizeDirection(block.permutation.getState('minecraft:cardinal_direction'));
    if (settingType === 'normal') {
        if (xStart !== xEnd) {
            for (let xLoop = Math.min(xStart, xEnd) + 1; xLoop < Math.max(xStart, xEnd); xLoop++) {
                block.dimension.getBlock({ x: xLoop, y: yNorm, z: zStart }).setPermutation(modifyPermutation(block, 'ff:height', 1));
            }
        } else {
            for (let zLoop = Math.min(zStart, zEnd) + 1; zLoop < Math.max(zStart, zEnd); zLoop++) {
                block.dimension.getBlock({ x: xStart, y: yNorm, z: zLoop }).setPermutation(modifyPermutation(block, 'ff:height', 1));
            }
        };
        block.dimension.getBlock(start).below().isAir ? block.dimension.getBlock(start).setPermutation(BlockPermutation.resolve(block.typeId, { 'ff:d_state': 'open_left', 'ff:height': 2, 'minecraft:cardinal_direction': finalDirection })) : undefined;
        block.dimension.getBlock(end).below().isAir ? block.dimension.getBlock(end).setPermutation(BlockPermutation.resolve(block.typeId, { 'ff:d_state': 'open_right', 'ff:height': 2, 'minecraft:cardinal_direction': finalDirection })) : undefined;
    } else if (settingType === 'closed') {
        if (xStart !== xEnd) {
            for (let xLoop = Math.min(xStart, xEnd); xLoop <= Math.max(xStart, xEnd); xLoop++) {
                let selectedBlock = block.dimension.getBlock({ x: xLoop, y: yNorm, z: zStart });
                let height = selectedBlock.below().isAir ? 2 : 1;
                selectedBlock.setPermutation(BlockPermutation.resolve(block.typeId, { 'ff:d_state': 'none', 'ff:is_closed': true, 'ff:height': height, 'minecraft:cardinal_direction': finalDirection }));
            }
        } else {
            for (let zLoop = Math.min(zStart, zEnd); zLoop <= Math.max(zStart, zEnd); zLoop++) {
                let selectedBlock = block.dimension.getBlock({ x: xStart, y: yNorm, z: zLoop });
                let height = selectedBlock.below().isAir ? 2 : 1;
                selectedBlock.setPermutation(BlockPermutation.resolve(block.typeId, { 'ff:d_state': 'none', 'ff:is_closed': true, 'ff:height': height, 'minecraft:cardinal_direction': finalDirection }));
            }
        };
    }
}
function modifycouch(block, start, end) {
    if (start.x === end.x && start.z === end.z) {
        block.setPermutation(modifyPermutation(block, 'ff:couch_state_sides', 'both'));
        return
    };
    [start, end] = (start.x > end.x || (start.x === end.x && start.z > end.z)) ? [end, start] : [start, end];
    const [xStart, yNorm, zStart] = [start.x, start.y, start.z];
    const [xEnd, zEnd] = [end.x, end.z];
    try {
        if (xStart !== xEnd) {
            for (let xLoop = Math.min(xStart, xEnd) + 1; xLoop < Math.max(xStart, xEnd); xLoop++) {
                block.dimension.getBlock({ x: xLoop, y: yNorm, z: zStart }).setPermutation(modifyPermutation(block, 'ff:couch_state_sides', 'none'));
            }
        } else {
            for (let zLoop = Math.min(zStart, zEnd) + 1; zLoop < Math.max(zStart, zEnd); zLoop++) {
                block.dimension.getBlock({ x: xStart, y: yNorm, z: zLoop }).setPermutation(modifyPermutation(block, 'ff:couch_state_sides', 'none'));
            }
        };
        let couchDirection = block.permutation.getState('minecraft:cardinal_direction');
        let startDirection = (couchDirection === 'north' || couchDirection === 'east') ? 'left' : 'right';
        let endDirection = startDirection === 'left' ? 'right' : 'left';
        block.dimension.getBlock(start).setPermutation(modifyPermutation(block, 'ff:couch_state_sides', startDirection));
        block.dimension.getBlock(end).setPermutation(modifyPermutation(block, 'ff:couch_state_sides', endDirection));
    } catch (error) {
        return;
    };
}
function couchEx(block, direction1, direction2, settingType, option) {
    let start = block.location;
    let end = block.location;
    let blockDirection = (settingType === "normal" || settingType === "closed") ? normalizeDirection(block.permutation.getState('minecraft:cardinal_direction')) : block.permutation.getState('minecraft:cardinal_direction');
    let current = block;
    let strict = option === 'curtain' ? false : true;
    while (isMatchingBlock(current[direction1](), block.typeId, blockDirection, strict)) {
        end = current[direction1]().location;
        current = current[direction1]();
    }
    current = block;
    while (isMatchingBlock(current[direction2](), block.typeId, blockDirection, strict)) {
        start = current[direction2]().location;
        current = current[direction2]();
    }
    option === 'curtain' ? modifycouchFunction(block, start, end, settingType) : modifycouch(block, start, end);
}
function isMatchingBlock(block, typeId, direction, restrict) {
    if (block?.typeId !== typeId) return false;
    let blockDirection = restrict ? block.permutation.getState('minecraft:cardinal_direction') : normalizeDirection(block.permutation.getState('minecraft:cardinal_direction'));
    return blockDirection === direction;
}
function modifyPermutation(block, permutationName, state) {
    return block.permutation.withState(permutationName, state);
};
world.afterEvents.playerPlaceBlock.subscribe((e) => {
    let block = e.block;
    if (block.above().typeId.endsWith('_curtain')) {
        block.dimension.getBlock(block.above().location).setPermutation(modifyPermutation(block.above(), 'ff:height', 1));
    };
    if (block.typeId.startsWith('ff:') && block.below().typeId === 'ff:furniture_design') {
        block.dimension.playSound('ff.saw', block.location)
        let blockTrait = traitList.find(trait => block.typeId.includes(trait)) + '_' || '';
        let bareName = block.typeId.replace('ff:', '').replace(blockTrait, '');
        let decomposed = decomposedMaterial[bareName];
        for (let key in decomposed) {
            if (decomposed.hasOwnProperty(key)) {
                if (key.startsWith('$')) {
                    block.dimension.spawnItem(new ItemStack('minecraft:' + blockTrait + key.replace('$', ''), decomposed[key]), block.center());
                } else {
                    block.dimension.spawnItem(new ItemStack('minecraft:' + key, decomposed[key]), block.center());
                }
            }
        };
    }
});
function normalizeAndRotate(d) {
    return ['north', 'west', 'south', 'east'][(['north', 'west', 'south', 'east'].indexOf(d) + 1) % 4];
}
world.beforeEvents.playerPlaceBlock.subscribe((e) => {
    let blockPerm = e.permutationBeingPlaced;
    let blockId = blockPerm.type.id;
    let face = e.face;
    if (blockId.endsWith('_lamp') || blockId === 'ff:wind_bell' || blockId === 'ff:item_sign') {
        if (face !== 'Up' && face !== 'Down') {
            let faceToSet = blockId === 'ff:item_sign' ? normalizeAndRotate(face.toLowerCase()) : face.toLowerCase();
            system.run(() => {
                e.block.setPermutation(BlockPermutation.resolve(blockId, { 'ff:wall_bit': true, 'minecraft:cardinal_direction': faceToSet }));
            });
        };
    };
});
world.afterEvents.playerBreakBlock.subscribe((e) => {
    let block = e.block;
    if (block.above().typeId.endsWith('_curtain')) {
        block.dimension.getBlock(block.above().location).setPermutation(modifyPermutation(block.above(), 'ff:height', 2));
    };
});
function removeOneChest(block) {
    block.dimension.getEntities({ type: 'minecraft:item', name: 'Chest', location: block.location }).forEach((item) => {
        let currentItemStack = item.getComponent("item").itemStack;
        if (currentItemStack.amount > 1) { currentItemStack.amount = currentItemStack.amount - 1 } else { item.remove() };
        return;
    });
}
