import { world, system, BlockPermutation } from '@minecraft/server';

const allowedBlocksSet = new Set([
    'minecraft:oak_log',
    'minecraft:stripped_oak_log',
    'ff:maple_log',
    'ff:stripped_maple_log',
    'ff:stripped_spicewood_log',
    'ff:spicewood_log'
]);

const leafBlocksSet = new Set([
    'sd:yellow_autumn_leaves',
    'sd:orange_autumn_leaves',
    'sd:red_autumn_leaves',
    'ff:spicewood_leaves'
]);

function isWithinRadiusOfAllowedBlock(block, maxDistance) {
    const { x, y, z } = block.location;
    // 26 directions: faces, edges, corners
    const steps = [-1, 0, 1];
    const dirs = [];
    for (const dx of steps) {
        for (const dy of steps) {
            for (const dz of steps) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                dirs.push({ dx, dy, dz });
            }
        }
    }

    for (const d of dirs) {
        for (let step = 1; step <= maxDistance; step++) {
            const bx = x + d.dx * step;
            const by = y + d.dy * step;
            const bz = z + d.dz * step;
            const current = block.dimension.getBlock({ x: bx, y: by, z: bz });
            if (current && allowedBlocksSet.has(current.typeId)) return true;
        }
    }
    return false;
}

// Conservative fallback: small cubic scan with spherical cutoff
function isWithinRadiusOfAllowedBlockCube(block, maxDistance) {
    const { x: startX, y: startY, z: startZ } = block.location;
    const r2 = maxDistance * maxDistance;
    for (let x = startX - maxDistance; x <= startX + maxDistance; x++) {
        for (let y = startY - maxDistance; y <= startY + maxDistance; y++) {
            for (let z = startZ - maxDistance; z <= startZ + maxDistance; z++) {
                const dx = x - startX, dy = y - startY, dz = z - startZ;
                if ((dx*dx + dy*dy + dz*dz) > r2) continue;
                const current = block.dimension.getBlock({ x, y, z });
                if (current && allowedBlocksSet.has(current.typeId)) return true;
            }
        }
    }
    return false;
}

function recalculatePersistence(block) {
    if (!block) return;
    // Skip heavy work for player-placed leaves (they never decay)
    let placed = false;
    try { placed = block.permutation.getState('sd:placed') === true; } catch (_) {}
    if (placed) return;

    // Read previous persistence to avoid unnecessary writes
    let wasPersistent = false;
    try { wasPersistent = block.permutation.getState('sd:persistent_bit') === true; } catch (_) {}

    let persistent = isWithinRadiusOfAllowedBlock(block, 10);
    // Fallback once with a smaller cubic scan to avoid false negatives on freshly placed features
    if (!persistent) {
        persistent = isWithinRadiusOfAllowedBlockCube(block, 6);
    }

    // If state didn't change and it's persistent, skip setPermutation
    if (persistent === wasPersistent) {
        if (persistent) return; // already good
    }

    // Update only if changed
    try {
        const currentStates = block.permutation.getAllStates();
        const newStates = { ...currentStates, 'sd:persistent_bit': persistent };
        const newPermutation = BlockPermutation.resolve(block.typeId, newStates);
        block.setPermutation(newPermutation);
    } catch (_) {}

    // If still not persistent (and not placed), decay with one-tick grace after transition
    if (!persistent) {
        if (wasPersistent) {
            // Just transitioned to non-persistent: wait one tick cycle
            return;
        }
        const { x, y, z } = block.location;
        try {
            block.dimension.runCommand(`/setblock ${x} ${y} ${z} air destroy`);
        } catch (_) {}
    }
}

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('sd:on_random_tick', {
        onRandomTick(e) {
            const { block } = e;
            if (!leafBlocksSet.has(block.typeId)) return;
            // Always recalc so persistent leaves can turn non-persistent when troncos se quitan
            recalculatePersistence(block);
        }
    });
});

world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation }) => {
    const origin = block.location;
    const dim = block.dimension;
    const r = 2;
    for (let x = origin.x - r; x <= origin.x + r; x++) {
        for (let y = origin.y - r; y <= origin.y + r; y++) {
            for (let z = origin.z - r; z <= origin.z + r; z++) {
                const b = dim.getBlock({ x, y, z });
                if (b && leafBlocksSet.has(b.typeId)) recalculatePersistence(b);
            }
        }
    }
});
world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
    if (leafBlocksSet.has(block.typeId)) {
        try {
            const currentStates = block.permutation.getAllStates();
            const newStates = { ...currentStates, 'sd:placed': true };
            const newPermutation = BlockPermutation.resolve(block.typeId, newStates);
            block.setPermutation(newPermutation);
        } catch (_) {
        }
        recalculatePersistence(block);
    }
});