import { world, ItemStack, GameMode } from "@minecraft/server";

const OAK_VARIATIONS = [
  "minecraft:oak_planks",
  "ff:wooden_big_planks_oak",
  "ff:wooden_chiseled_planks_oak",
  "ff:wooden_smooth_planks_oak",
  "ff:wooden_smooth_planks_zigzag_oak",
  "ff:wooden_tiled_planks_oak",
  "ff:wooden_double_big_planks_oak",
  "ff:smooth_wood_oak"
];

const BIRCH_VARIATIONS = [
  "minecraft:birch_planks",
  "ff:wooden_big_planks_birch",
  "ff:wooden_chiseled_planks_birch",
  "ff:wooden_smooth_planks_birch",
  "ff:wooden_smooth_planks_zigzag_birch",
  "ff:wooden_tiled_planks_birch",
  "ff:wooden_double_big_planks_birch",
  "ff:smooth_wood_birch"
];

const SPRUCE_VARIATIONS = [
  "minecraft:spruce_planks",
  "ff:wooden_big_planks_spruce",
  "ff:wooden_chiseled_planks_spruce",
  "ff:wooden_smooth_planks_spruce",
  "ff:wooden_smooth_planks_zigzag_spruce",
  "ff:wooden_tiled_planks_spruce",
  "ff:wooden_double_big_planks_spruce",
  "ff:smooth_wood_spruce"
];

const JUNGLE_VARIATIONS = [
  "minecraft:jungle_planks",
  "ff:wooden_big_planks_jungle",
  "ff:wooden_chiseled_planks_jungle",
  "ff:wooden_smooth_planks_jungle",
  "ff:wooden_smooth_planks_zigzag_jungle",
  "ff:wooden_tiled_planks_jungle",
  "ff:wooden_double_big_planks_jungle",
  "ff:smooth_wood_jungle"
];

const ACACIA_VARIATIONS = [
  "minecraft:acacia_planks",
  "ff:wooden_big_planks_acacia",
  "ff:wooden_chiseled_planks_acacia",
  "ff:wooden_smooth_planks_acacia",
  "ff:wooden_smooth_planks_zigzag_acacia",
  "ff:wooden_tiled_planks_acacia",
  "ff:wooden_double_big_planks_acacia",
  "ff:smooth_wood_acacia"
];

const DARK_OAK_VARIATIONS = [
  "minecraft:dark_oak_planks",
  "ff:wooden_big_planks_dark_oak",
  "ff:wooden_chiseled_planks_dark_oak",
  "ff:wooden_smooth_planks_dark_oak",
  "ff:wooden_smooth_planks_zigzag_dark_oak",
  "ff:wooden_tiled_planks_dark_oak",
  "ff:wooden_double_big_planks_dark_oak",
  "ff:smooth_wood_dark_oak"
];

const CHERRY_VARIATIONS = [
  "minecraft:cherry_planks",
  "ff:wooden_big_planks_cherry",
  "ff:wooden_chiseled_planks_cherry",
  "ff:wooden_smooth_planks_cherry",
  "ff:wooden_smooth_planks_zigzag_cherry",
  "ff:wooden_tiled_planks_cherry",
  "ff:wooden_double_big_planks_cherry",
  "ff:smooth_wood_cherry"
];

const MANGROVE_VARIATIONS = [
  "minecraft:mangrove_planks",
  "ff:wooden_big_planks_mangrove",
  "ff:wooden_chiseled_planks_mangrove",
  "ff:wooden_smooth_planks_mangrove",
  "ff:wooden_smooth_planks_zigzag_mangrove",
  "ff:wooden_tiled_planks_mangrove",
  "ff:wooden_double_big_planks_mangrove",
  "ff:smooth_wood_mangrove"
];

const CRIMSON_VARIATIONS = [
  "minecraft:crimson_planks",
  "ff:wooden_big_planks_crimson",
  "ff:wooden_chiseled_planks_crimson",
  "ff:wooden_smooth_planks_crimson",
  "ff:wooden_smooth_planks_zigzag_crimson",
  "ff:wooden_tiled_planks_crimson",
  "ff:wooden_double_big_planks_crimson",
  "ff:smooth_wood_crimson"
];

const WARPED_VARIATIONS = [
  "minecraft:warped_planks",
  "ff:wooden_big_planks_warped",
  "ff:wooden_chiseled_planks_warped",
  "ff:wooden_smooth_planks_warped",
  "ff:wooden_smooth_planks_zigzag_warped",
  "ff:wooden_tiled_planks_warped",
  "ff:wooden_double_big_planks_warped",
  "ff:smooth_wood_warped"
];

const CINDER_VARIATIONS = [
  "ff:cinder_planks",
  "ff:wooden_big_planks_cinder",
  "ff:wooden_chiseled_planks_cinder",
  "ff:wooden_smooth_planks_cinder",
  "ff:wooden_smooth_planks_zigzag_cinder",
  "ff:wooden_tiled_planks_cinder",
  "ff:wooden_double_big_planks_cinder",
  "ff:smooth_wood_cinder"
];

const SPICEWOOD_VARIATIONS = [
  "ff:spicewood_planks",
  "ff:wooden_big_planks_spicewood",
  "ff:wooden_chiseled_planks_spicewood",
  "ff:wooden_smooth_planks_spicewood",
  "ff:wooden_smooth_planks_zigzag_spicewood",
  "ff:wooden_tiled_planks_spicewood",
  "ff:wooden_double_big_planks_spicewood",
  "ff:smooth_wood_spicewood"
];

const PALE_VARIATIONS = [
  "minecraft:pale_oak_planks",
  "ff:wooden_big_planks_pale",
  "ff:wooden_chiseled_planks_pale",
  "ff:wooden_smooth_planks_pale",
  "ff:wooden_smooth_planks_zigzag_pale",
  "ff:wooden_tiled_planks_pale",
  "ff:wooden_double_big_planks_pale",
  "ff:smooth_wood_pale"
];

const MAPLE_VARIATIONS = [
  "ff:maple_planks",
  "ff:wooden_big_planks_maple",
  "ff:wooden_chiseled_planks_maple",
  "ff:wooden_smooth_planks_maple",
  "ff:wooden_smooth_planks_zigzag_maple",
  "ff:wooden_tiled_planks_maple",
  "ff:wooden_double_big_planks_maple",
  "ff:smooth_wood_maple"
];

const MARBLE_VARIATIONS = [
  "ff:marble_tiles",
  "ff:marble_small_tiles",
  "ff:marble_pillar",
  "ff:chiseled_marble"
];

const BLACK_MARBLE_VARIATIONS = [
  "ff:black_marble_tiles",
  "ff:black_marble_small_tiles",
  "ff:black_marble_pillar",
  "ff:chiseled_black_marble"
];

const BLOCK_VARIATIONS = {
  "minecraft:oak_planks": OAK_VARIATIONS,
  "minecraft:birch_planks": BIRCH_VARIATIONS,
  "minecraft:spruce_planks": SPRUCE_VARIATIONS,
  "minecraft:jungle_planks": JUNGLE_VARIATIONS,
  "minecraft:acacia_planks": ACACIA_VARIATIONS,
  "minecraft:dark_oak_planks": DARK_OAK_VARIATIONS,
  "minecraft:cherry_planks": CHERRY_VARIATIONS,
  "minecraft:mangrove_planks": MANGROVE_VARIATIONS,
  "minecraft:crimson_planks": CRIMSON_VARIATIONS,
  "minecraft:pale_oak_planks": PALE_VARIATIONS,
  "minecraft:warped_planks": WARPED_VARIATIONS,
  "ff:cinder_planks": CINDER_VARIATIONS,
  "ff:spicewood_planks": SPICEWOOD_VARIATIONS,
  "ff:maple_planks": MAPLE_VARIATIONS,

  "ff:wooden_big_planks_oak": OAK_VARIATIONS,
  "ff:wooden_chiseled_planks_oak": OAK_VARIATIONS,
  "ff:wooden_smooth_planks_oak": OAK_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_oak": OAK_VARIATIONS,
  "ff:wooden_tiled_planks_oak": OAK_VARIATIONS,
  "ff:wooden_double_big_planks_oak": OAK_VARIATIONS,
  "ff:smooth_wood_oak": OAK_VARIATIONS,

  "ff:wooden_big_planks_birch": BIRCH_VARIATIONS,
  "ff:wooden_chiseled_planks_birch": BIRCH_VARIATIONS,
  "ff:wooden_smooth_planks_birch": BIRCH_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_birch": BIRCH_VARIATIONS,
  "ff:wooden_tiled_planks_birch": BIRCH_VARIATIONS,
  "ff:wooden_double_big_planks_birch": BIRCH_VARIATIONS,
  "ff:smooth_wood_birch": BIRCH_VARIATIONS,

  "ff:wooden_big_planks_spruce": SPRUCE_VARIATIONS,
  "ff:wooden_chiseled_planks_spruce": SPRUCE_VARIATIONS,
  "ff:wooden_smooth_planks_spruce": SPRUCE_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_spruce": SPRUCE_VARIATIONS,
  "ff:wooden_tiled_planks_spruce": SPRUCE_VARIATIONS,
  "ff:wooden_double_big_planks_spruce": SPRUCE_VARIATIONS,
  "ff:smooth_wood_spruce": SPRUCE_VARIATIONS,

  // Jungle
  "ff:wooden_big_planks_jungle": JUNGLE_VARIATIONS,
  "ff:wooden_chiseled_planks_jungle": JUNGLE_VARIATIONS,
  "ff:wooden_smooth_planks_jungle": JUNGLE_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_jungle": JUNGLE_VARIATIONS,
  "ff:wooden_tiled_planks_jungle": JUNGLE_VARIATIONS,
  "ff:wooden_double_big_planks_jungle": JUNGLE_VARIATIONS,
  "ff:smooth_wood_jungle": JUNGLE_VARIATIONS,
  // Acacia
  "ff:wooden_big_planks_acacia": ACACIA_VARIATIONS,
  "ff:wooden_chiseled_planks_acacia": ACACIA_VARIATIONS,
  "ff:wooden_smooth_planks_acacia": ACACIA_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_acacia": ACACIA_VARIATIONS,
  "ff:wooden_tiled_planks_acacia": ACACIA_VARIATIONS,
  "ff:wooden_double_big_planks_acacia": ACACIA_VARIATIONS,
  "ff:smooth_wood_acacia": ACACIA_VARIATIONS,
  // Dark Oak
  "ff:wooden_big_planks_dark_oak": DARK_OAK_VARIATIONS,
  "ff:wooden_chiseled_planks_dark_oak": DARK_OAK_VARIATIONS,
  "ff:wooden_smooth_planks_dark_oak": DARK_OAK_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_dark_oak": DARK_OAK_VARIATIONS,
  "ff:wooden_tiled_planks_dark_oak": DARK_OAK_VARIATIONS,
  "ff:wooden_double_big_planks_dark_oak": DARK_OAK_VARIATIONS,
  "ff:smooth_wood_dark_oak": DARK_OAK_VARIATIONS,
  // Cherry
  "ff:wooden_big_planks_cherry": CHERRY_VARIATIONS,
  "ff:wooden_chiseled_planks_cherry": CHERRY_VARIATIONS,
  "ff:wooden_smooth_planks_cherry": CHERRY_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_cherry": CHERRY_VARIATIONS,
  "ff:wooden_tiled_planks_cherry": CHERRY_VARIATIONS,
  "ff:wooden_double_big_planks_cherry": CHERRY_VARIATIONS,
  "ff:smooth_wood_cherry": CHERRY_VARIATIONS,
  // Mangrove
  "ff:wooden_big_planks_mangrove": MANGROVE_VARIATIONS,
  "ff:wooden_chiseled_planks_mangrove": MANGROVE_VARIATIONS,
  "ff:wooden_smooth_planks_mangrove": MANGROVE_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_mangrove": MANGROVE_VARIATIONS,
  "ff:wooden_tiled_planks_mangrove": MANGROVE_VARIATIONS,
  "ff:wooden_double_big_planks_mangrove": MANGROVE_VARIATIONS,
  "ff:smooth_wood_mangrove": MANGROVE_VARIATIONS,
  // Crimson
  "ff:wooden_big_planks_crimson": CRIMSON_VARIATIONS,
  "ff:wooden_chiseled_planks_crimson": CRIMSON_VARIATIONS,
  "ff:wooden_smooth_planks_crimson": CRIMSON_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_crimson": CRIMSON_VARIATIONS,
  "ff:wooden_tiled_planks_crimson": CRIMSON_VARIATIONS,
  "ff:wooden_double_big_planks_crimson": CRIMSON_VARIATIONS,
  "ff:smooth_wood_crimson": CRIMSON_VARIATIONS,
  // Warped
  "ff:wooden_big_planks_warped": WARPED_VARIATIONS,
  "ff:wooden_chiseled_planks_warped": WARPED_VARIATIONS,
  "ff:wooden_smooth_planks_warped": WARPED_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_warped": WARPED_VARIATIONS,
  "ff:wooden_tiled_planks_warped": WARPED_VARIATIONS,
  "ff:wooden_double_big_planks_warped": WARPED_VARIATIONS,
  "ff:smooth_wood_warped": WARPED_VARIATIONS,
  // Cinder
  "ff:wooden_big_planks_cinder": CINDER_VARIATIONS,
  "ff:wooden_chiseled_planks_cinder": CINDER_VARIATIONS,
  "ff:wooden_smooth_planks_cinder": CINDER_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_cinder": CINDER_VARIATIONS,
  "ff:wooden_tiled_planks_cinder": CINDER_VARIATIONS,
  "ff:wooden_double_big_planks_cinder": CINDER_VARIATIONS,
  "ff:smooth_wood_cinder": CINDER_VARIATIONS,
  // Spicewood
  "ff:wooden_big_planks_spicewood": SPICEWOOD_VARIATIONS,
  "ff:wooden_chiseled_planks_spicewood": SPICEWOOD_VARIATIONS,
  "ff:wooden_smooth_planks_spicewood": SPICEWOOD_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_spicewood": SPICEWOOD_VARIATIONS,
  "ff:wooden_tiled_planks_spicewood": SPICEWOOD_VARIATIONS,
  "ff:wooden_double_big_planks_spicewood": SPICEWOOD_VARIATIONS,
  "ff:smooth_wood_spicewood": SPICEWOOD_VARIATIONS,
  // Pale
  "ff:wooden_big_planks_pale": PALE_VARIATIONS,
  "ff:wooden_chiseled_planks_pale": PALE_VARIATIONS,
  "ff:wooden_smooth_planks_pale": PALE_VARIATIONS,
  "ff:wooden_smooth_planks_zigzag_pale": PALE_VARIATIONS,
  "ff:wooden_tiled_planks_pale": PALE_VARIATIONS,
  "ff:wooden_double_big_planks_pale": PALE_VARIATIONS,
  "ff:smooth_wood_pale": PALE_VARIATIONS,
  // Maple
    "ff:wooden_big_planks_maple": MAPLE_VARIATIONS,
    "ff:wooden_chiseled_planks_maple": MAPLE_VARIATIONS,
    "ff:wooden_smooth_planks_maple": MAPLE_VARIATIONS,
    "ff:wooden_smooth_planks_zigzag_maple": MAPLE_VARIATIONS,
    "ff:wooden_tiled_planks_maple": MAPLE_VARIATIONS,
    "ff:wooden_double_big_planks_maple": MAPLE_VARIATIONS,
    "ff:smooth_wood_maple": MAPLE_VARIATIONS,

    // Marble
    "ff:marble_tiles": MARBLE_VARIATIONS,
    "ff:marble_small_tiles": MARBLE_VARIATIONS,
    "ff:marble_pillar": MARBLE_VARIATIONS,
    "ff:chiseled_marble": MARBLE_VARIATIONS,

    // Black Marble
    "ff:black_marble_tiles": BLACK_MARBLE_VARIATIONS,
    "ff:black_marble_small_tiles": BLACK_MARBLE_VARIATIONS,
    "ff:black_marble_pillar": BLACK_MARBLE_VARIATIONS,
    "ff:chiseled_black_marble": BLACK_MARBLE_VARIATIONS
};

const playerSelections = new Map();

function processChiselEvent(e) {
  try {
    const block = e.block;
    const player = e.source;
    const equipment = player.getComponent("equippable");
    const selectedItem = equipment.getEquipment("Mainhand");
    const durability = selectedItem.getComponent("durability");
    
    const isSneaking = player.isSneaking;
    
    const blockId = block.typeId;
    const variations = BLOCK_VARIATIONS[blockId];
    
    if (isSneaking) {
      if (variations) {
        const currentIndex = variations.indexOf(blockId);
        if (currentIndex !== -1) {
          playerSelections.set(player.id, {
            woodType: variations[0],
            selectedIndex: currentIndex
          });

          const lore = [`\n§r§nVariation selected: §f${getBlockDisplayName(blockId)}`];
          selectedItem.setLore(lore);
          equipment.setEquipment("Mainhand", selectedItem);

          player.playSound("block.note_block.pling");
          player.runCommand(`title @s actionbar §9 Selected: ${getBlockDisplayName(blockId)}`);
          return;
        }
      }
      
      player.playSound("note.bass");
      player.runCommand("title @s actionbar §6 This block cannot be chiseled!");
      return;
    }
    
    if (!variations) {
      player.playSound("note.bass");
      player.runCommand("title @s actionbar §6 This block cannot be chiseled!");
      return;
    }
    
    let targetIndex = 0;
    
    if (playerSelections.has(player.id)) {
      const selection = playerSelections.get(player.id);
      if (selection.woodType === variations[0]) {
        targetIndex = selection.selectedIndex;
      }
    } else {
      const currentIndex = variations.indexOf(blockId);
      targetIndex = (currentIndex + 1) % variations.length;
    }
    
    const newBlockId = variations[targetIndex];
    if (newBlockId !== blockId) {
      const x = Math.floor(block.location.x);
      const y = Math.floor(block.location.y);
      const z = Math.floor(block.location.z);
      player.runCommand(`setblock ${x} ${y} ${z} ${newBlockId}`);
      
      const center = block.center();
      block.dimension.playSound("use.wood", player.location, { volume: 6.0 });
      block.dimension.spawnParticle("minecraft:block", center, { blockType: newBlockId });
      
      if (durability && player.getGameMode() !== GameMode.creative) {
        if (durability.damage < durability.maxDurability) {
          durability.damage++;
          equipment.setEquipment("Mainhand", selectedItem);
        } else {
          equipment.setEquipment("Mainhand", new ItemStack("minecraft:air", 1));
          player.playSound("item.axe.break");
        }
      }
    } else {
      player.playSound("note.bass");
      player.runCommand("title @s actionbar §6 This is already the selected variation!");
    }
  } catch (error) {
  }
}

function getBlockDisplayName(blockId) {
  const parts = blockId.split(":");
  const name = parts[parts.length - 1];
  return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

world.beforeEvents.worldInitialize.subscribe(initEvent => {
  initEvent.itemComponentRegistry.registerCustomComponent("ff:wood_chisel", {
    onUseOn: processChiselEvent,
    onUse: (e) => {
      const player = e.source;
      const isSneaking = player.isSneaking;
      const equipment = player.getComponent("equippable");
      const selectedItem = equipment.getEquipment("Mainhand");
      
      if (isSneaking && playerSelections.has(player.id)) {
        playerSelections.delete(player.id);
        selectedItem.setLore([]);
        equipment.setEquipment("Mainhand", selectedItem);
        player.playSound("note.xylophone");
        player.runCommand("title @s actionbar §qSelection removed!");
      }
    }
  });
});