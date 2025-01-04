import { world } from "@minecraft/server";

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:stair_placement', {
        onPlace: e => {
            const { block } = e;
            const northBlock = block.north();
            const southBlock = block.south();
            const eastBlock = block.east();
            const westBlock = block.west();
            const vertical_half = block.permutation.getState('minecraft:vertical_half');
            const shape = block.permutation.getState('ff:shape');
            const cardinal_direction = block.permutation.getState('minecraft:cardinal_direction');

            if (vertical_half == 'bottom') {
                block.setPermutation(block.permutation.withState('ff:placed_bit', true));
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right'));
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_south') && shape == 'inner_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_north') && shape == 'inner_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_north') && shape == 'inner_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_south') && shape == 'inner_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_north') && shape == 'outer_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_south') && shape == 'outer_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_south') && shape == 'outer_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_north') && shape == 'outer_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
            }
            if (vertical_half == 'top') {
                block.setPermutation(block.permutation.withState('ff:placed_bit', true));
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right'));
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_south') && shape == 'inner_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_north') && shape == 'inner_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_north') && shape == 'inner_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_south') && shape == 'inner_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_north') && shape == 'outer_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_south') && shape == 'outer_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_south') && shape == 'outer_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_north') && shape == 'outer_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
            }
        },
        onTick: e => {
            const { block } = e;
            const northBlock = e.block.north();
            const southBlock = e.block.south();
            const eastBlock = e.block.east();
            const westBlock = e.block.west();
            const vertical_half = block.permutation.getState('minecraft:vertical_half');
            const shape = block.permutation.getState('ff:shape');
            const cardinal_direction = block.permutation.getState('minecraft:cardinal_direction');

            if (vertical_half == 'bottom') {
                block.setPermutation(block.permutation.withState('ff:placed_bit', true));
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right'));
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_south') && shape == 'inner_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_north') && shape == 'inner_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_north') && shape == 'inner_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_south') && shape == 'inner_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_up') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_up') && !northBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_up') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_up') && !southBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_north') && shape == 'outer_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_up') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_up') && !westBlock.hasTag('ff_stairs_south') && shape == 'outer_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_south') && shape == 'outer_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_up') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_up') && !eastBlock.hasTag('ff_stairs_north') && shape == 'outer_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
            }
            if (vertical_half == 'top') {
                block.setPermutation(block.permutation.withState('ff:placed_bit', true));
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right'));
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_west') && shape == 'inner_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_east') && shape == 'inner_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_south') && shape == 'inner_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_north') && shape == 'inner_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_north') && shape == 'inner_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'inner_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_south') && shape == 'inner_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(northBlock.hasTag('ff_stairs_down') && northBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!northBlock.hasTag('ff_stairs_down') && !northBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'north') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_west') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_west') && shape == 'outer_right' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(southBlock.hasTag('ff_stairs_down') && southBlock.hasTag('ff_stairs_east') && shape == 'straight' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!southBlock.hasTag('ff_stairs_down') && !southBlock.hasTag('ff_stairs_east') && shape == 'outer_left' && cardinal_direction == 'south') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_north') && shape == 'outer_right' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(westBlock.hasTag('ff_stairs_down') && westBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!westBlock.hasTag('ff_stairs_down') && !westBlock.hasTag('ff_stairs_south') && shape == 'outer_left' && cardinal_direction == 'west') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_south') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_right' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_south') && shape == 'outer_right' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
                if(eastBlock.hasTag('ff_stairs_down') && eastBlock.hasTag('ff_stairs_north') && shape == 'straight' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'outer_left' ))
                }
                if(!eastBlock.hasTag('ff_stairs_down') && !eastBlock.hasTag('ff_stairs_north') && shape == 'outer_left' && cardinal_direction == 'east') {
                    block.setPermutation(block.permutation.withState('ff:shape', 'straight' ))
                }
            }
        }
    });
});