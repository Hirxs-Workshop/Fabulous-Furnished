import { world } from "@minecraft/server";

console.warn("§6Fabulous Furnished §f| §eLoaded!")

import { fabulousBlindsBlock } from './blocks/wooden/wooden_blinds_cc';
world.beforeEvents.worldInitialize.subscribe((e) => {
	e.blockComponentRegistry.registerCustomComponent("ff:blinds", new fabulousBlindsBlock());
});
// Items
import './items/paint_brushes_cc'
import './items/chisel_cc'
import './items/glass_cup_cc'
import './items/jam_placer_cc'
import './items/coffee_cup_cc'

//blocks
import './blocks/misc/blocks_features_cc'
import './blocks/wooden/wooden_fences_cc'
import './blocks/cooking/cooking_system_cc'
import './blocks/cooking/coffee_cc'
import './blocks/paint_features/lamp_colors'
import './blocks/paint_features/empty_paint_bucket'
import './blocks/wooden/wooden_tables_cc'
import './blocks/wooden/wooden_chairs_cc'
import './blocks/wooden/wooden_couch_cc'
import './blocks/wooden/wooden_cabinents_cc'
import './blocks/wooden/wooden_bench_cc'
import './blocks/wooden/wooden_doors_cc'
import './blocks/wooden/wooden_custom_stairs_cc'
import './blocks/wooden/wooden_stairs_cc'
import './blocks/cooking/blender_cc'
import './blocks/cooking/mortar_n_pestle_cc'
import './blocks/cooking/pancake_n_waffles_cc'
import './blocks/cooking/iron_pot'
import './blocks/energy_system'
import './blocks/misc/seasonal_cc'
import './blocks/misc/glass_jar_cc'
import './blocks/misc/saplings_cc'
import './blocks/misc/leaves_spreading_cc'

//import './block_data_view' // by Kaoiga (just for debug)

import './cinder_log_replace'
