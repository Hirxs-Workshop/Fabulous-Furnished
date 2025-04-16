import { world, system, ItemStack } from "@minecraft/server";

function processBrushEvent(e, mode, newState, particleEffect, colorName) {
  const block = e.block;
  const source = e.source;
  const equipment = source.getComponent("equippable");
  const selectedItem = equipment.getEquipment("Mainhand");
  const durability = selectedItem.getComponent("durability");

  if (block.permutation.getState("cauldron_liquid") === "water") {
    const currentLevel = block.permutation.getState("fill_level");
    if (currentLevel > 0) {
      const newLevel = currentLevel - 1;
      block.setPermutation(block.permutation.withState("fill_level", newLevel));
      source.playSound("mob.axolotl.splash");
      if (newLevel === 0) {
        block.setPermutation(block.permutation.withState("cauldron_liquid", "empty"));
      }
      equipment.setEquipment("Mainhand", new ItemStack("ef:brush_empty", 1));
      return;
    }
  }

  const currentColor = block.permutation.getState("ef:colors");
  if (typeof currentColor === "undefined") return;

  if (mode === "remove") {
    if (currentColor === 0) {
      source.playSound("note.bass");
      source.runCommand("title @s actionbar §6 Ops! this block already has no paint assigned");
      return;
    } else {
      block.setPermutation(block.permutation.withState("ef:colors", 0));
      block.dimension.spawnParticle(particleEffect, {
        x: block.location.x + 0.5,
        y: block.location.y + 0.5,
        z: block.location.z + 0.5
      });
      source.playSound("mob.axolotl.splash");
      if (durability && !source.isCreative) {
        if (durability.damage < durability.maxDurability) {
          durability.damage++;
          equipment.setEquipment("Mainhand", selectedItem);
        } else {
          equipment.setEquipment("Mainhand", new ItemStack("ef:brush_empty", 1));
        }
      }
      return;
    }
  } else if (mode === "apply") {
    if (currentColor === 0) {
      block.setPermutation(block.permutation.withState("ef:colors", newState));
      block.dimension.spawnParticle(particleEffect, {
        x: block.location.x + 0.5,
        y: block.location.y + 0.5,
        z: block.location.z + 0.5
      });
      source.playSound("mob.axolotl.splash");
      if (durability && !source.isCreative) {
        if (durability.damage < durability.maxDurability) {
          durability.damage++;
          equipment.setEquipment("Mainhand", selectedItem);
        } else {
          equipment.setEquipment("Mainhand", new ItemStack("ef:brush_empty", 1));
        }
      }
      return;
    } else if (currentColor === newState) {
      source.playSound("note.bass");
      source.runCommand(`title @s actionbar §6 Uh? It seems that this block already has a ${colorName} paint`);
      return;
    } else {
      source.playSound("note.bass");
      source.runCommand("title @s actionbar §6 Ops! this block already has a paint assigned");
      return;
    }
  }
}

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.itemComponentRegistry.registerCustomComponent("ff:brush_paint_white", {
    onUseOn: e => {
      processBrushEvent(e, "remove", 0, "ff:paint_white", "");
    }
  });
});

const brushesConfig = [
  { id: "ff:brush_paint_orange", newState: 1, particle: "ff:paint_orange", colorName: "orange" },
  { id: "ff:brush_paint_magenta", newState: 2, particle: "ff:paint_magenta", colorName: "magenta" },
  { id: "ff:brush_paint_light_blue", newState: 3, particle: "ff:paint_light_blue", colorName: "light blue" },
  { id: "ff:brush_paint_yellow", newState: 4, particle: "ff:paint_yellow", colorName: "yellow" },
  { id: "ff:brush_paint_lime", newState: 5, particle: "ff:paint_lime", colorName: "lime" },
  { id: "ff:brush_paint_pink", newState: 6, particle: "ff:paint_pink", colorName: "pink" },
  { id: "ff:brush_paint_gray", newState: 7, particle: "ff:paint_gray", colorName: "gray" },
  { id: "ff:brush_paint_light_gray", newState: 8, particle: "ff:paint_light_gray", colorName: "light gray" },
  { id: "ff:brush_paint_cyan", newState: 9, particle: "ff:paint_cyan", colorName: "cyan" },
  { id: "ff:brush_paint_purple", newState: 10, particle: "ff:paint_purple", colorName: "purple" },
  { id: "ff:brush_paint_blue", newState: 11, particle: "ff:paint_blue", colorName: "blue" },
  { id: "ff:brush_paint_brown", newState: 12, particle: "ff:paint_brown", colorName: "brown" },
  { id: "ff:brush_paint_green", newState: 13, particle: "ff:paint_green", colorName: "green" },
  { id: "ff:brush_paint_red", newState: 14, particle: "ff:paint_red", colorName: "red" },
  { id: "ff:brush_paint_black", newState: 15, particle: "ff:paint_black", colorName: "black" }
];

brushesConfig.forEach(brush => {
  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.itemComponentRegistry.registerCustomComponent(brush.id, {
      onUseOn: e => {
        processBrushEvent(e, "apply", brush.newState, brush.particle, brush.colorName);
      }
    });
  });
});

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.itemComponentRegistry.registerCustomComponent("ff:hammer_chisel", {
    onUseOn: e => {
      const block = e.block;
      const updates = block.permutation.getState("p:changer");
      block.setPermutation(block.permutation.withState("p:changer", updates + 1));
      e.source.playSound("mob.zombie.wood");
    }
  });
});
