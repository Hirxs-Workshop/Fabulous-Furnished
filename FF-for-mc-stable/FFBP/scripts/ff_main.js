import { world, ItemStack } from "@minecraft/server";

console.warn("§6Fabulous Furnished §f| §eLoaded!")

import { fabulousBlindsBlock } from 'blinds_cc';
world.beforeEvents.worldInitialize.subscribe((e) => {
	e.blockComponentRegistry.registerCustomComponent("ff:blinds", new fabulousBlindsBlock());
});
// Stable
import 'blocks_cc'
import 'trampoline_connect'
import 'fences_cc'
import 'cooking_cc'
import 'colors_change/lamp_colors'
import 'colors_change/empty_paint_bucket'
import 'colors_change/large_lamp_colors'


// Experimental
import 'tables_connect'
import 'wooden_chair_test'
import 'test_brush'
import 'test_rain'

// Unestable Experimental
import 'couch_connect'
import 'cabinents_cc'
import 'trampoline_cc'
import 'door_ff'

// Seasonal Decors
import 'pumpkin_functions'
import 'autumn_leaves'

// import 'block_data_view' // by Kaoiga (just for debug)
