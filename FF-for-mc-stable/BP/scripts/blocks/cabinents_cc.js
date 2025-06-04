import {
  world,
  ItemStack,
  system,
  EquipmentSlot,
  EnchantmentType
} from '@minecraft/server';
import FaceSelectionPlains from "../face_selection_plains.js";

world.beforeEvents.worldInitialize.subscribe(ffh => {
  const registry = ffh.blockComponentRegistry;

  function handleDestroy(block, playerName = "unknown") {
    const { x, y, z } = block.location;
    const dim = block.dimension;
    const ents = dim.getEntities({
      type: "sd:gift_box_bow",
      location: { x, y, z },
      maxDistance: 0.9
    });

    for (const ent of ents) {
      const giftId = ent.getDynamicProperty("giftId");
      const colorId = ent.getDynamicProperty("colorId") ?? 0;

      const inv = ent.getComponent("inventory").container;
      const items = [];
      for (let i = 0; i < inv.size; i++) {
        const it = inv.getItem(i);
        if (!it) continue;

        const itemData = {
          type: it.typeId,
          amount: it.amount
        };

        if (typeof it.getLore === 'function') {
          const loreLines = it.getLore();
          if (loreLines.length) itemData.lore = loreLines;
        }

        if (it.hasComponent("minecraft:enchantable")) {
          const eComp = it.getComponent("minecraft:enchantable");
          const enchants = eComp.getEnchantments().map(e => ({
            id: e.type.id,
            level: e.level
          }));
          if (enchants.length) itemData.enchantments = enchants;
        }

        items.push(itemData);
      }

      world.setDynamicProperty(
        `gift_box_data_${giftId}`,
        JSON.stringify(items)
      );

      const drop = new ItemStack("sd:gift_box_white", 1);
      drop.setLore([
        `\n§r§9 Gift ID: ${giftId}`,
        `§r§9 Color ID: ${colorId}`,
        `\n§6 Owned by: ${playerName}`
      ]);
      dim.spawnItem(drop, { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
      ent.remove();
    }
  }

  registry.registerCustomComponent("sd:gift_container", {
    beforeOnPlayerPlace: event => {
      const { player, block } = event;
      const main = player.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand);
      let giftId = 0;
      let colorId = 0;

      if (main?.getLore) {
        const lore = main.getLore();
        const idLine = lore.find(l => l.includes("Gift ID:"));
        if (idLine) giftId = parseInt(idLine.split("Gift ID: ")[1]);
        const cLine = lore.find(l => l.includes("Color ID:"));
        if (cLine) {
          const parsed = parseInt(cLine.split("Color ID: ")[1]);
          if (!isNaN(parsed)) colorId = parsed;
        }
      }

      if (!giftId) {
        giftId = world.getDynamicProperty("gift_box_counter") || 1;
        world.setDynamicProperty("gift_box_counter", giftId + 1);
      }

      event.permutationToPlace =
        event.permutationToPlace
          .withState("ff:cabinent_type", 1)
          .withState("ef:colors", colorId);

      const facing = event.permutationToPlace.getState("minecraft:cardinal_direction");
      let yaw = 0;
      if (facing === "north") yaw = 180;
      else if (facing === "east") yaw = -90;
      else if (facing === "west") yaw = 90;

      system.run(() => {
        const { x, y, z } = block.location;
        const dim = block.dimension;
        dim.runCommand(
          `summon sd:gift_box_bow ${x} ${y} ${z} ${yaw} 0 spawn_adult_melee \"§f§f§f§l§r\"`
        );
        const ents = dim.getEntities({
          type: "sd:gift_box_bow",
          location: { x, y, z },
          maxDistance: 1
        });
        if (ents.length) {
          const ent = ents[0];
          ent.setDynamicProperty("giftId", giftId);
          ent.setDynamicProperty("colorId", colorId);
          const stored = world.getDynamicProperty(`gift_box_data_${giftId}`);
          if (stored) {
            const items = JSON.parse(stored);
            const inv = ent.getComponent("inventory").container;
            for (const itData of items) {
              const stack = new ItemStack(itData.type, itData.amount);
              if (itData.lore) {
                stack.setLore(itData.lore);
              }
              if (itData.enchantments) {
                const eComp = stack.getComponent("minecraft:enchantable");
                if (eComp) {
                  for (const ench of itData.enchantments) {
                    eComp.addEnchantment({
                      type: new EnchantmentType(ench.id),
                      level: ench.level
                    });
                  }
                }
              }
              inv.addItem(stack);
            }
          }
        }
      });
    },

    onPlayerInteract: event => {
      const { player, block } = event;
      const { x, y, z } = block.location;
      block.setPermutation(
        block.permutation.withState("ff:cabinent_type", 2)
      );
      player.playSound("block.barrel.open");
      block.dimension.runCommand(
        `execute positioned ${x} ${y} ${z} run event entity @e[type=sd:gift_box_bow,r=0.5] sd:open_box`
      );
    },

    onTick: event => {
      const { block } = event;
      const { x, y, z } = block.location;
      const dim = block.dimension;

      const currentColor = block.permutation.getState("ef:colors") ?? 0;
      const ents = dim.getEntities({
        type: "sd:gift_box_bow",
        location: { x, y, z },
        maxDistance: 1
      });
      for (const ent of ents) {
        if (ent.getDynamicProperty("colorId") !== currentColor) {
          ent.setDynamicProperty("colorId", currentColor);
        }
      }

      if (block.permutation.getState("ff:cabinent_type") === 2) {
        block.setPermutation(
          block.permutation.withState("ff:cabinent_type", 1)
        );
        dim.runCommand(
          `execute positioned ${x} ${y} ${z} run event entity @e[type=sd:gift_box_bow,r=0.5] sd:closed_box`
        );
        dim.runCommand(`playsound block.barrel.close @p`);
      }
    },

    onPlayerDestroy: evt => handleDestroy(evt.block, evt.player.name),
    onDestroy:        evt => handleDestroy(evt.block)
  });
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
  const frontZones = new FaceSelectionPlains(
    { origin: [2, 4], size: [12, 5] },
    { origin: [2, 4], size: [12, 5] },
    { origin: [2, 4], size: [12, 5] },
    { origin: [2, 10], size: [12, 5] },
    { origin: [2, 10], size: [12, 5] },
    { origin: [2, 10], size: [12, 5] }
  );

  ffh.blockComponentRegistry.registerCustomComponent(
    "ff:container_function",
    {
      onPlace: e => {
        const { block } = e;
        const { x, y, z } = block.location;

        const blockId = block.permutation.type.id;
        const prefix = "ff:wooden_cabinet_";
        const wood = blockId.startsWith(prefix)
          ? blockId.substring(prefix.length)
          : "oak";

        const entityName = `${wood}_cabinet`;
        block.dimension.runCommand(
          `summon ef:inventory "${entityName}" ${x} ${y + 0.5} ${z}`
        );
        block.dimension.runCommand(
          `summon ef:inventory "${entityName}" ${x} ${y + 0.25} ${z}`
        );
      },

      onPlayerInteract: e => {
        const { player, block, face, faceLocation } = e;
        if (!player || !faceLocation) return;

        const facingState = (
          block.permutation.getState("minecraft:cardinal_direction") || "south"
        ).toLowerCase();
        if (face.toLowerCase() !== facingState) return;

        const rel = {
          x: faceLocation.x - block.location.x,
          y: faceLocation.y - block.location.y,
          z: faceLocation.z - block.location.z
        };

        const zone = frontZones.getSelected({ face, faceLocation: rel });
        if (zone === undefined) return;

        const isUpper = zone < 3;
        if (isUpper) {
          const newVal = !block.permutation.getState("ff:upper");
          block.setPermutation(block.permutation.withState("ff:upper", newVal));
          player.playSound(newVal ? "block.barrel.open" : "block.barrel.close");
        } else {
          const newVal = !block.permutation.getState("ff:bottom");
          block.setPermutation(block.permutation.withState("ff:bottom", newVal));
          player.playSound(newVal ? "block.barrel.open" : "block.barrel.close");
        }
      },

      onTick: e => {
        const { block } = e;
        if (block.permutation.getState("ff:upper")) {
          block.dimension.runCommand(`playsound block.barrel.close @p`);
          block.setPermutation(block.permutation.withState("ff:upper", false));
        }
        if (block.permutation.getState("ff:bottom")) {
          block.dimension.runCommand(`playsound block.barrel.close @p`);
          block.setPermutation(block.permutation.withState("ff:bottom", false));
        }
      }
    }
  );
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
  const frontZones = new FaceSelectionPlains(
    { origin: [2, 4], size: [12, 5] },
    { origin: [2, 4], size: [12, 5] },
    { origin: [2, 4], size: [12, 5] }
  );

  ffh.blockComponentRegistry.registerCustomComponent(
    "ff:container_function_table",
    {
      onPlace: e => {
        const { block } = e;
        const { x, y, z } = block.location;

        const blockId = block.permutation.type.id;
        const prefix = "ff:wooden_bedside_table_";
        const wood = blockId.startsWith(prefix)
          ? blockId.substring(prefix.length)
          : "oak";

        const entityName = `${wood}_cabinet`;
        block.dimension.runCommand(
          `summon ef:inventory "${entityName}" ${x} ${y + 0.5} ${z}`
        );
        block.dimension.runCommand(
          `summon ef:inventory "${entityName}" ${x} ${y + 0.25} ${z}`
        );
      },

      onPlayerInteract: e => {
        const { player, block, face, faceLocation } = e;
        if (!player || !faceLocation) return;

        const facingState = (
          block.permutation.getState("minecraft:cardinal_direction") || "south"
        ).toLowerCase();
        if (face.toLowerCase() !== facingState) return;

        const rel = {
          x: faceLocation.x - block.location.x,
          y: faceLocation.y - block.location.y,
          z: faceLocation.z - block.location.z
        };

        const zone = frontZones.getSelected({ face, faceLocation: rel });
        if (zone === undefined) return;

        const isUpper = zone < 3;
        if (isUpper) {
          const newVal = !block.permutation.getState("ff:upper");
          block.setPermutation(block.permutation.withState("ff:upper", newVal));
          player.playSound(newVal ? "block.barrel.open" : "block.barrel.close");
        }
      },

      onTick: e => {
        const { block } = e;
        if (block.permutation.getState("ff:upper")) {
          block.dimension.runCommand(`playsound block.barrel.close @p`);
          block.setPermutation(block.permutation.withState("ff:upper", false));
        }
      }
    }
  );
});

world.beforeEvents.worldInitialize.subscribe(ffh => {
  const wall_frontZones = new FaceSelectionPlains(
    { origin: [0, 0], size: [8, 16] },
    { origin: [0, 0], size: [8, 16] },
    { origin: [0, 0], size: [8, 16] },
    { origin: [8, 0], size: [8, 16] },
    { origin: [8, 0], size: [8, 16] },
    { origin: [8, 0], size: [8, 16] },
  );
  ffh.blockComponentRegistry.registerCustomComponent(
    "ff:wall_container_function",
    {
      onPlace: e => {
        const { block } = e;
        const { x, y, z } = block.location;

        const blockId = block.permutation.type.id;
        const prefix = "ff:wooden_wall_cabinet_";
        const wood = blockId.startsWith(prefix)
          ? blockId.substring(prefix.length)
          : "oak";
        const entityName = `${wood}_cabinet`;
        const dir = (block.permutation.getState("minecraft:cardinal_direction") || "south").toLowerCase();
        if (dir === "north" || dir === "south") {
          block.dimension.runCommand(
            `summon ef:wall_inventory "${entityName}" ${x + 0.7} ${y} ${z}`
          );
          block.dimension.runCommand(
            `summon ef:wall_inventory "${entityName}" ${x + 0.3} ${y} ${z}`
          );
        } else if (dir === "east" || dir === "west") {
          block.dimension.runCommand(
            `summon ef:wall_inventory "${entityName}" ${x} ${y} ${z + 0.7}`
          );
          block.dimension.runCommand(
            `summon ef:wall_inventory "${entityName}" ${x} ${y} ${z + 0.3}`
          );
        }
      },

      onPlayerInteract: e => {
        const { player, block, face, faceLocation } = e;
        if (!player || !faceLocation) return;

        const facingState = (
          block.permutation.getState("minecraft:cardinal_direction") || "south"
        ).toLowerCase();
        if (face.toLowerCase() !== facingState) return;

        const rel = {
          x: faceLocation.x - block.location.x,
          y: faceLocation.y - block.location.y,
          z: faceLocation.z - block.location.z
        };

        const zone = wall_frontZones.getSelected({ face, faceLocation: rel });
        if (zone === undefined) return;

        const isUpper = zone < 3;
        if (isUpper) {
          const newVal = !block.permutation.getState("ff:upper");
          block.setPermutation(block.permutation.withState("ff:upper", newVal));
          player.playSound(newVal ? "block.barrel.open" : "block.barrel.close");
        } else {
          const newVal = !block.permutation.getState("ff:bottom");
          block.setPermutation(block.permutation.withState("ff:bottom", newVal));
          player.playSound(newVal ? "block.barrel.open" : "block.barrel.close");
        }
      },

      onTick: e => {
        const { block } = e;
        if (block.permutation.getState("ff:upper")) {
          block.dimension.runCommand(`playsound block.barrel.close @p`);
          block.setPermutation(block.permutation.withState("ff:upper", false));
        }
        if (block.permutation.getState("ff:bottom")) {
          block.dimension.runCommand(`playsound block.barrel.close @p`);
          block.setPermutation(block.permutation.withState("ff:bottom", false));
        }
      }
    }
  );
});

world.afterEvents.playerInteractWithBlock.subscribe(e => {
  const block = e.block;
  const player = e.player;
  if (!block || !player) return;
  if (block.typeId !== "ff:wooden_cabinet_oak") return;

  const main = player.getComponent("equippable").getEquipment(EquipmentSlot.Mainhand);
  if (main && main.typeId === "minecraft:polished_andesite") {
    const current = block.permutation.getState("ff:counter_top") ?? 0;
    const next = current === 0 ? 1 : 0;
    block.setPermutation(block.permutation.withState("ff:counter_top", next));
    player.playSound("random.click");
  }
});