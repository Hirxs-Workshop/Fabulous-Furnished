import { rightBlockLocation, leftBlockLocation } from '../../classes/blinds_dir';

export class fabulousBlindsBlock {
    onPlace(e) {
        const { block } = e;
        
        // Handle blinds
        if (block.permutation.getState("ff:open_blinds") !== undefined) {
            ff_blinds_update_place(block);

            const prefix = getBlindsPrefix(block.typeId);
            [ block.offset({ x: 0, y: -1, z: 0 }), block.offset({ x: 0, y: 1, z: 0 }) ]
                .forEach(adj => {
                    if (
                        adj.permutation.getState("ff:open_blinds") !== undefined &&
                        adj.typeId.startsWith(prefix) &&
                        adj.getTags()[0] === block.getTags()[0]
                    ) {
                        ff_blinds_update_place(adj);
                    }
                });
        }
    }

    onPlayerDestroy(e) {
        const { block, destroyedBlockPermutation } = e;
        const destroyedTypeId = destroyedBlockPermutation.typeId || destroyedBlockPermutation.type.id;
        
        // Handle blinds
        if (destroyedBlockPermutation.getState("ff:open_blinds") !== undefined) {
            const prefix = getBlindsPrefix(destroyedTypeId);

            [ block.offset({ x: 0, y: -1, z: 0 }), block.offset({ x: 0, y: 1, z: 0 }) ]
                .forEach(adj => {
                    if (
                        adj.permutation.getState("ff:open_blinds") !== undefined &&
                        adj.typeId.startsWith(prefix) &&
                        adj.getTags()[0] === destroyedBlockPermutation.getTags()[0]
                    ) {
                        ff_blinds_update_place(adj);
                    }
                });
        }
    }

    onPlayerInteract(e) {
        const { block, dimension } = e;
        
        // Handle blinds
        if (block.permutation.getState("ff:open_blinds") !== undefined) {
            ff_blinds_update(block, block.location.x, block.location.y, block.location.z);
            dimension.playSound("step.wood", block.center());
        }
        
        // Handle lights
        if (isLightBlock(block.typeId)) {
            ff_light_toggle(block, dimension);
        }
    }
}

function isLightBlock(typeId) {
    const lightBlocks = [
        'fb:light_off',
        'ff:light_on',
        'fb:office_light_off',
        'ff:office_light',
        'fb:light_roof_off',
        'ff:light_roof_on'
    ];
    return lightBlocks.includes(typeId);
}

function getLightToggleMapping(typeId) {
    const lightMappings = {
        'fb:light_off': 'ff:light_on',
        'ff:light_on': 'fb:light_off',
        'fb:office_light_off': 'ff:office_light',
        'ff:office_light': 'fb:office_light_off',
        'fb:light_roof_off': 'ff:light_roof_on',
        'ff:light_roof_on': 'fb:light_roof_off'
    };
    return lightMappings[typeId];
}

function ff_light_toggle(block, dimension) {
    const newTypeId = getLightToggleMapping(block.typeId);
    if (newTypeId) {
        const newBlockType = dimension.getBlock(newTypeId);
        if (newBlockType) {
            block.setType(newBlockType);
            
            const isTurningOn = newTypeId.includes('_on') || newTypeId.includes('office_light');
            const soundName = isTurningOn ? 'lamp_on' : 'lamp_off';
            dimension.playSound(soundName, block.center());
        }
    }
}

function ff_blinds_update(block, originX, originY, originZ) {
    const prefix = getBlindsPrefix(block.typeId);
    const { x, y, z } = block.location;
    if (
        Math.abs(x - originX) > 8 ||
        Math.abs(y - originY) > 8 ||
        Math.abs(z - originZ) > 8
    ) return;

    const stack = [block];
    const visited = new Set();

    while (stack.length) {
        const current = stack.pop();
        const dir = current.permutation.getState("minecraft:cardinal_direction");
        const isClosed = current.permutation.getState("ff:close_blinds");
        const { x: cx, y: cy, z: cz } = current.location;
        const key = `${cx},${cy},${cz}`;
        if (visited.has(key)) continue;
        visited.add(key);

        current.setPermutation(
            current.permutation.withState("ff:close_blinds", !isClosed)
        );

        const neighbors = [
            current.offset(rightBlockLocation[dir]),
            current.offset(leftBlockLocation[dir]),
            current.offset({ x: 0, y: 1, z: 0 }),
            current.offset({ x: 0, y: -1, z: 0 }),
        ];

        for (const nb of neighbors) {
            try {
                if (
                    nb &&
                    nb.typeId.startsWith(prefix) &&
                    nb.permutation.getState("minecraft:cardinal_direction") === dir &&
                    nb.permutation.getState("ff:close_blinds") === isClosed
                ) {
                    const { x: nx, y: ny, z: nz } = nb.location;
                    if (
                        Math.abs(nx - originX) <= 10 &&
                        Math.abs(ny - originY) <= 10 &&
                        Math.abs(nz - originZ) <= 10
                    ) {
                        stack.push(nb);
                    }
                }
            } catch {
            }
        }
    }
}

function ff_blinds_update_place(block) {
    if (block.permutation.getState("ff:open_blinds") === undefined) return;

    const prefix = getBlindsPrefix(block.typeId);
    const above = block.offset({ x: 0, y: 1, z: 0 });

    const shouldOpen =
        above.permutation.getState("ff:open_blinds") !== undefined &&
        above.typeId.startsWith(prefix) &&
        above.getTags()[0] === block.getTags()[0];

    block.setPermutation(
        block.permutation.withState("ff:open_blinds", shouldOpen)
    );
}

function getBlindsPrefix(typeId) {
    const [ns, path] = typeId.split(':');
    if (!path) return typeId + '_';
    const parts = path.split('_');
    if (parts.length >= 2) {
        return `${ns}:${parts[0]}_${parts[1]}_`;
    }
    return typeId + '_';
}
