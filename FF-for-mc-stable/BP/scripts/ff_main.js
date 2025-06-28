import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";

console.warn("§6Fabulous Furnished §f| §eLoaded!")

import { fabulousBlindsBlock } from 'blinds_cc';
world.beforeEvents.worldInitialize.subscribe((e) => {
	e.blockComponentRegistry.registerCustomComponent("ff:blinds", new fabulousBlindsBlock());
});
// Stable
import 'blocks/blocks_cc'
import 'blocks/trampoline_connect'
import 'blocks/fences_cc'
import 'blocks/cooking_cc'
import 'colors_change/lamp_colors'
import 'colors_change/empty_paint_bucket'

// Experimental
import 'blocks/tables_connect'
import 'blocks/wooden_chair_test'
import 'test_brush'

// Unestable Experimental
import 'blocks/couch_connect'
import 'blocks/cabinents_cc'
import 'blocks/door_ff'
import 'blocks/ff_stairs'

// Seasonal Decors
import 'pumpkin_functions'
import 'autumn_leaves'

// import 'electric_system/main_system'

// import 'electric_system/device_system'
import 'FF-Link-system'
// import 'badges'

import 'block_data_view' // by Kaoiga (just for debug)
