import { world, BlockPermutation, EquipmentSlot, GameMode, system } from "@minecraft/server";

const DIRECTION_MAP = {
    north: "south",
    south: "north", 
    east: "west",
    west: "east"
};

const STAIR_CONFIG = {
    STAIR_TAG: "ff:is_stairs",
    HITBOX_BLOCK: "ff:extra_hitbox",
    COMPONENT_NAME: "ff:is_stairs",
    DIRECTION_STATE: "minecraft:cardinal_direction",
    TARGET_BLOCK: "ff:wooden_stairs_oak"
};

const getOppositeDirection = (direction) => {
    return DIRECTION_MAP[direction] || direction;
};

const placeHitboxAbove = (targetBlock, facing) => {
    const hitboxPermutation = BlockPermutation.resolve(STAIR_CONFIG.HITBOX_BLOCK);
    const configuredPermutation = hitboxPermutation.withState(
        STAIR_CONFIG.DIRECTION_STATE, 
        getOppositeDirection(facing)
    );
    targetBlock.above().setPermutation(configuredPermutation);
};

const getAdjacentBlock = (block, direction) => {
    const adjacentMethods = {
        north: () => block.south(),
        south: () => block.north(),
        east: () => block.west(),
        west: () => block.east()
    };
    return adjacentMethods[direction]?.() || null;
};

const handleAdjacentStairPlacement = (placeEvent, currentBlock, orientation) => {
    const adjacentBlock = getAdjacentBlock(currentBlock, orientation);
    
    if (adjacentBlock?.isAir) {
        const newPermutation = BlockPermutation.resolve(
            placeEvent.permutationToPlace.type.id,
            placeEvent.permutationToPlace.getAllStates()
        );
        adjacentBlock.setPermutation(newPermutation);
        
        if (currentBlock.above().isAir) {
            placeHitboxAbove(adjacentBlock, orientation);
        }
        
        placeEvent.cancel = true;
    } else {
        if (currentBlock.above().isAir) {
            placeHitboxAbove(currentBlock, orientation);
        }
    }
};

const consumePlayerItem = (player, itemStack) => {
    if (player.getGameMode() === GameMode.creative) return;
    
    const equipment = player.getComponent("equippable");
    if (itemStack.amount > 1) {
        itemStack.amount--;
    } else {
        itemStack = undefined;
    }
    equipment.setEquipment(EquipmentSlot.Mainhand, itemStack);
};

world.afterEvents.playerBreakBlock.subscribe((breakEvent) => {
    const brokenBlock = breakEvent.block;
    const blockBelow = brokenBlock.below();
    
    if (brokenBlock.typeId === STAIR_CONFIG.HITBOX_BLOCK) {
        if (blockBelow.hasTag(STAIR_CONFIG.STAIR_TAG)) {
            return;
        }
    }
    
    if (blockBelow.hasTag(STAIR_CONFIG.STAIR_TAG)) {
        const belowDirection = blockBelow.permutation.getState(STAIR_CONFIG.DIRECTION_STATE);
        placeHitboxAbove(blockBelow, belowDirection);
    }
});

world.beforeEvents.playerBreakBlock.subscribe((beforeBreakEvent) => {
    const blockToBreak = beforeBreakEvent.block;
    const blockAbove = blockToBreak.above();
    
    if (blockToBreak.hasTag(STAIR_CONFIG.STAIR_TAG) || blockToBreak.typeId === STAIR_CONFIG.TARGET_BLOCK) {
        if (blockAbove.typeId === STAIR_CONFIG.HITBOX_BLOCK) {
            system.runTimeout(() => {
                try {
                    if (blockAbove.typeId === STAIR_CONFIG.HITBOX_BLOCK) {
                        blockAbove.setType("minecraft:air");
                    }
                } catch (error) {
                }
            }, 1);
        }
    }
});

world.beforeEvents.worldInitialize.subscribe((initializationEvent) => {
    const componentRegistry = initializationEvent.blockComponentRegistry;
    
    componentRegistry.registerCustomComponent(STAIR_CONFIG.COMPONENT_NAME, {
        beforeOnPlayerPlace: (placementEvent) => {
            const { player, face, block, permutationToPlace } = placementEvent;
            const playerEquipment = player.getComponent("equippable");
            const heldItem = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
            
            const blockBelow = block.below();
            const currentOrientation = permutationToPlace.getState(STAIR_CONFIG.DIRECTION_STATE);
            const belowOrientation = blockBelow.permutation.getState(STAIR_CONFIG.DIRECTION_STATE);
            
            const isPlacingOnStair = (face === "Up" && blockBelow.hasTag(STAIR_CONFIG.STAIR_TAG));
            const isSameOrientation = (currentOrientation === belowOrientation);
            
            if (isPlacingOnStair && isSameOrientation) {
                handleAdjacentStairPlacement(placementEvent, block, currentOrientation);
                consumePlayerItem(player, heldItem);
            } else {
                if (block.above().isAir) {
                    placeHitboxAbove(block, currentOrientation);
                }
            }
        }
    });
});