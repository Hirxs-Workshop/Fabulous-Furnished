import { world, ItemStack, GameMode } from "@minecraft/server";

function msgTr(player, key, withParts = []) {
  const entry = withParts.length
    ? { translate: key, with: withParts }
    : { translate: key };
  player.sendMessage({ rawtext: [entry] });
}

function processBrushEvent(e, mode, newState, particleEffect, colorName) {
  const block = e.block;
  const player = e.source;
  const equipment = player.getComponent("equippable");
  const selectedItem = equipment.getEquipment("Mainhand");
  const durability = selectedItem.getComponent("durability");

  if (block.permutation.getState("cauldron_liquid") === "water") {
    const currentLevel = block.permutation.getState("fill_level");
    if (currentLevel > 0) {
      const newLevel = currentLevel - 1;
      block.setPermutation(block.permutation.withState("fill_level", newLevel));
      player.playSound("mob.axolotl.splash");
      if (newLevel === 0) {
        block.setPermutation(block.permutation.withState("cauldron_liquid", "empty"));
      }
      equipment.setEquipment("Mainhand", new ItemStack("ef:brush_empty", 1));
      return;
    }
  }

  const currentColor = block.permutation.getState("ef:colors");
  if (typeof currentColor === "undefined") return;

  const spawnPaint = (effect) => {
    const pos = {
      x: block.location.x + 0.5,
      y: block.location.y + 0.5,
      z: block.location.z + 0.5
    };
    block.dimension.spawnParticle(effect, pos);
    block.dimension.spawnParticle(effect.replace("paint_", "paint_drip_"), pos);
  };

  if (mode === "remove") {
    if (currentColor === 0) {
      player.playSound("note.bass");
      msgTr(player, "ff.paint_brush.already_none");
      return;
    }
    block.setPermutation(block.permutation.withState("ef:colors", 0));
    spawnPaint(particleEffect);
    player.playSound("mob.axolotl.splash");

    if (durability && player.getGameMode() !== GameMode.creative) {
      if (durability.damage < durability.maxDurability) {
        durability.damage++;
        equipment.setEquipment("Mainhand", selectedItem);
      } else {
        equipment.setEquipment("Mainhand", new ItemStack("ef:brush_empty", 1));
      }
    }
    return;
  }

  if (mode === "apply") {
    try {
      const woolState = block.permutation.getState("ff:has_wool");
      if (typeof woolState !== "undefined" && woolState !== 1) {
        player.playSound("note.bass");
        msgTr(player, "ff.paint_brush.need_cushion");
        return;
      }
    } catch {}

    if (currentColor === 0) {
      block.setPermutation(block.permutation.withState("ef:colors", newState));
      spawnPaint(particleEffect);
      player.playSound("mob.axolotl.splash");

      if (durability && player.getGameMode() !== GameMode.creative) {
        if (durability.damage < durability.maxDurability) {
          durability.damage++;
          equipment.setEquipment("Mainhand", selectedItem);
        } else {
          equipment.setEquipment("Mainhand", new ItemStack("ef:brush_empty", 1));
        }
      }
      return;
    }
    if (currentColor === newState) {
      player.playSound("note.bass");
      msgTr(player, "ff.paint_brush.already_same", [colorName]);
    } else {
      player.playSound("note.bass");
      msgTr(player, "ff.paint_brush.already_colored");
    }
  }
}

world.beforeEvents.worldInitialize.subscribe(initEvent => {
  initEvent.itemComponentRegistry.registerCustomComponent("ff:brush_paint_white", {
    onUseOn: e => processBrushEvent(e, "remove", 0, "ff:paint_white", "")
  });

  const brushes = [
    { id: "ff:brush_paint_orange",     state: 1,  particle: "ff:paint_orange",      name: "orange" },
    { id: "ff:brush_paint_magenta",    state: 2,  particle: "ff:paint_magenta",     name: "magenta" },
    { id: "ff:brush_paint_light_blue", state: 3,  particle: "ff:paint_light_blue", name: "light blue" },
    { id: "ff:brush_paint_yellow",     state: 4,  particle: "ff:paint_yellow",     name: "yellow" },
    { id: "ff:brush_paint_lime",       state: 5,  particle: "ff:paint_lime",       name: "lime" },
    { id: "ff:brush_paint_pink",       state: 6,  particle: "ff:paint_pink",       name: "pink" },
    { id: "ff:brush_paint_gray",       state: 7,  particle: "ff:paint_gray",       name: "gray" },
    { id: "ff:brush_paint_light_gray", state: 8,  particle: "ff:paint_light_gray", name: "light gray" },
    { id: "ff:brush_paint_cyan",       state: 9,  particle: "ff:paint_cyan",       name: "cyan" },
    { id: "ff:brush_paint_purple",     state: 10, particle: "ff:paint_purple",     name: "purple" },
    { id: "ff:brush_paint_blue",       state: 11, particle: "ff:paint_blue",       name: "blue" },
    { id: "ff:brush_paint_brown",      state: 12, particle: "ff:paint_brown",      name: "brown" },
    { id: "ff:brush_paint_green",      state: 13, particle: "ff:paint_green",      name: "green" },
    { id: "ff:brush_paint_red",        state: 14, particle: "ff:paint_red",        name: "red" },
    { id: "ff:brush_paint_black",      state: 15, particle: "ff:paint_black",      name: "black" }
  ];

  for (const b of brushes) {
    initEvent.itemComponentRegistry.registerCustomComponent(b.id, {
      onUseOn: e => processBrushEvent(e, "apply", b.state, b.particle, b.name)
    });
  }

  initEvent.itemComponentRegistry.registerCustomComponent("ff:hammer_chisel", {
    onUseOn: e => {
      const { block, player } = e;
        try {
          const currentState = Number(block.permutation.getState("p:changer")) || 0;
          const newState = currentState + 1;
          block.setPermutation(block.permutation.withState("p:changer", newState));
        } catch (err) {
          block.setPermutation(block.permutation.withState("p:changer", 0));
        }
        const center = block.center();
        block.dimension.playSound("block.lantern.break", center);
        block.dimension.spawnParticle("foxes:texture", center);
    }
  });
});

