export const airBlocks = ["minecraft:air", "minecraft:fern", "minecraft:large_fern", "minecraft:short_grass", "minecraft:tall_grass", "minecraft:nether_sprouts", "minecraft:crimson_roots", "minecraft:warped_roots", "minecraft:snow_layer", "minecraft:vine"];
export const colors = ["black", "red", "green", "brown", "blue", "purple", "cyan", "light_gray", "gray", "pink", "lime", "yellow", "light_blue", "magenta", "orange", "white"];
export const solidBlocks = ["block", "_planks", "fence", "bamboo_mosaic", "glass", "bars", "brick", "blackstone", "deepslate", "stone", "copper", "quartz", "prismarine", "wool", "slime", "concrete", "clay", "terracotta", "mud", "table", "beehive", "furnace", "smoker", "respawn", "book", "composter", "barrel", "sea_lantern", "jukebox", "beacon", "dispenser", "dropper", "observer", "piston", "loom", "target", "shroomlight", "nylium", "netherrack", "basalt", "soul_sand", "soul_soil", "dirt", "ore", "gravel", "ancient_debris", "podzol", "mycelium", "granite", "diorite", "andesite", "sand", "log", "wood", "stem", "hyphae", "leaves", "pumpkin", "snow", "ice", "tuff", "froglight", "obsidian", "sponge", "bedrock"];
export const blockException = ["_stairs", "slab", "wall", "door", "grindstone", "enchanting_table", "stonecutter_block", "torch", "heavy_core", "button", "pressure_plate", "melon_stem", "pumpkin_stem", "layer", "pointed_dripstone", "spore_blossom", "light_block"];
export const rightBlockLocation = {
	"north": { x: 1, y: 0, z: 0 },
	"south": { x: -1, y: 0, z: 0 },
	"west": { x: 0, y: 0, z: -1 },
	"east": { x: 0, y: 0, z: 1 }
};
export const leftBlockLocation = {
	"north": { x: -1, y: 0, z: 0 },
	"south": { x: 1, y: 0, z: 0 },
	"west": { x: 0, y: 0, z: 1 },
	"east": { x: 0, y: 0, z: -1 }
};
export const frontBlockLocation = {
	"north": { x: 0, y: 0, z: 1 },
	"south": { x: 0, y: 0, z: -1 },
	"west": { x: 1, y: 0, z: 0 },
	"east": { x: -1, y: 0, z: 0 }
};
export const backBlockLocation = {
	"north": { x: 0, y: 0, z: -1 },
	"south": { x: 0, y: 0, z: 1 },
	"west": { x: -1, y: 0, z: 0 },
	"east": { x: 1, y: 0, z: 0 }
};
export const directions = {
	north: { x: 0, y: 0, z: -1, opposite: "south" },
	south: { x: 0, y: 0, z: 1, opposite: "north" },
	west: { x: -1, y: 0, z: 0, opposite: "east" },
	east: { x: 1, y: 0, z: 0, opposite: "west" }
};