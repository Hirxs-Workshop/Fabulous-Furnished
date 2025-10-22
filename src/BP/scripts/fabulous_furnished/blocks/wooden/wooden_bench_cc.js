import { world, BlockPermutation } from "@minecraft/server";

function applyStates(block, states) {
    const newStates = { ...states };
    const dirKey = 'minecraft:cardinal_direction';
    const currentDir = block.permutation.getState(dirKey);
    if (currentDir !== undefined && !(dirKey in newStates)) {
        newStates[dirKey] = currentDir;
    }
    return BlockPermutation.resolve(block.typeId, newStates);
}

function normalizeDirection(dir) {
    if (dir === 'south') return 'north';
    if (dir === 'west')  return 'east';
    return dir;
}

function isCouchBlock(block, direction, strict) {
    if (!block || !block.typeId.endsWith('_bench')) return false;
    const currentDir = block.permutation.getState('minecraft:cardinal_direction');
    const blockDir   = strict ? currentDir : normalizeDirection(currentDir);
    return blockDir === direction;
}

function setCouchSides(block, startLoc, endLoc) {
    const dim = block.dimension;
    const dir = block.permutation.getState('minecraft:cardinal_direction');

    if (startLoc.x === endLoc.x && startLoc.z === endLoc.z) {
        const target = dim.getBlock(startLoc);
        target.setPermutation(applyStates(target, { 'ff:bench_state_sides': 'both' }));
        return;
    }

    let startSide = (dir === 'north' || dir === 'east') ? 'left' : 'right';
    let endSide   = startSide === 'left' ? 'right' : 'left';

    if (dir === 'east' || dir === 'west') {
        [startSide, endSide] = [endSide, startSide];
    }

    const { x: xS, y, z: zS } = startLoc;
    const { x: xE,     z: zE } = endLoc;

    if (xS !== xE) {
        const [minX, maxX] = [Math.min(xS, xE), Math.max(xS, xE)];
        for (let x = minX + 1; x < maxX; x++) {
            const seg = dim.getBlock({ x, y, z: zS });
            seg.setPermutation(applyStates(seg, { 'ff:bench_state_sides': 'none' }));
        }
    } else {
        const [minZ, maxZ] = [Math.min(zS, zE), Math.max(zS, zE)];
        for (let z = minZ + 1; z < maxZ; z++) {
            const seg = dim.getBlock({ x: xS, y, z });
            seg.setPermutation(applyStates(seg, { 'ff:bench_state_sides': 'none' }));
        }
    }

    dim.getBlock(startLoc)
       .setPermutation(applyStates(dim.getBlock(startLoc), { 'ff:bench_state_sides': startSide }));
    dim.getBlock(endLoc)
       .setPermutation(applyStates(dim.getBlock(endLoc),   { 'ff:bench_state_sides': endSide }));
}


function couchEx(block, dir1, dir2) {
    const direction = block.permutation.getState('minecraft:cardinal_direction');
    let start = block.location;
    let end   = block.location;
    let curr  = block;

    while (isCouchBlock(curr[dir1](), direction, true)) {
        curr = curr[dir1]();
        end  = curr.location;
    }
    curr = block;
    while (isCouchBlock(curr[dir2](), direction, true)) {
        curr  = curr[dir2]();
        start = curr.location;
    }
    setCouchSides(block, start, end);
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('ff:bench_function', {
        onPlace: e => {
            const block = e.block;
            for (const face of ['north', 'south', 'east', 'west']) {
                const neigh = block[face]();
                if (neigh?.typeId.endsWith('_bench')) {
                    const neighDir = neigh.permutation.getState('minecraft:cardinal_direction');
                    block.setPermutation(applyStates(block, { 'minecraft:cardinal_direction': neighDir }));
                    break;
                }
            }
            const dir     = block.permutation.getState('minecraft:cardinal_direction');
            const [d1,d2] = (dir === 'north' || dir === 'south')
                            ? ['east', 'west']
                            : ['north','south'];
            couchEx(block, d1, d2);
        },
        onPlayerDestroy: e => {
            const block     = e.block;
            const destroyed = e.destroyedBlockPermutation;
            const dir       = destroyed.getState('minecraft:cardinal_direction');
            const [d1,d2]   = (dir === 'north' || dir === 'south')
                              ? ['east', 'west']
                              : ['north','south'];
            ['north','south','east','west'].forEach(face => {
                const neigh = block[face]();
                if (neigh?.typeId.endsWith('_bench')) couchEx(neigh, d1, d2);
            });
        }
    });
});
