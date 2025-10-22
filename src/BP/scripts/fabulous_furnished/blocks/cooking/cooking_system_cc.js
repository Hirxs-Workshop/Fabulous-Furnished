import * as server from "@minecraft/server";
import { updateBlock } from "../../utils/block";

const PAN_CONVERSION = {
  "minecraft:kelp": "minecraft:dried_kelp",
  "minecraft:potato": "minecraft:baked_potato",
  "minecraft:beef": "minecraft:cooked_beef",
  "minecraft:rotten_flesh": "minecraft:leather",
  "minecraft:porkchop": "minecraft:cooked_porkchop",
  "minecraft:rabbit": "minecraft:cooked_rabbit",
  "minecraft:cod": "minecraft:cooked_cod",
  "minecraft:salmon": "minecraft:cooked_salmon",
  "minecraft:mutton": "minecraft:cooked_mutton",
  "minecraft:chicken": "minecraft:cooked_chicken",
  "minecraft:melon_slice": "minecraft:glistering_melon_slice",
  "minecraft:cooked_beef": "minecraft:coal",
  "minecraft:cooked_porkchop": "minecraft:coal",
  "minecraft:cooked_rabbit": "minecraft:coal",
  "minecraft:cooked_cod": "minecraft:coal",
  "minecraft:cooked_salmon": "minecraft:coal",
  "minecraft:cooked_mutton": "minecraft:coal",
  "minecraft:cooked_chicken": "minecraft:coal",
  'ff:frozen_beef_raw': 'minecraft:beef',
  'ff:frozen_porkchop_raw': 'minecraft:porkchop',
  'ff:frozen_rabbit_raw': 'minecraft:rabbit',
  'ff:frozen_chicken_raw': 'minecraft:chicken',
  'ff:frozen_mutton_raw': 'minecraft:mutton',
  'ff:frozen_fish_salmon_raw': 'minecraft:salmon',
  'ff:frozen_fish_raw': 'minecraft:cod',
  'ff:frozen_fish_clownfish_raw': 'minecraft:tropical_fish'
};

function setPanEntityTimerEvent(panEntity, stage) {
  if (!panEntity) return;
  for (let i = 0; i <= 9; i++) {
    panEntity.runCommand(`event entity @s remove:timer_${i}`);
  }
  const map = { 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 };
  const timer = map[stage] ?? 0;
  if (timer > 0) panEntity.runCommand(`event entity @s timer_${timer}`);
}

server.world.beforeEvents.worldInitialize.subscribe(result => {
  result.blockComponentRegistry.registerCustomComponent("ff:rotation", {
    beforeOnPlayerPlace: result => {
      let direction = 0;
      try {
        let rotationAngle = result.player.getRotation().y;
        direction = rotationAngle >= -45 && rotationAngle < 45 ? 3 :
                    rotationAngle >= 45 && rotationAngle < 135 ? 4 :
                    rotationAngle >= -135 && rotationAngle < -45 ? 5 : 2;
      } catch (e) { }
      let state = result.block.permutation.getAllStates();
      state["ff:rotation"] = direction;
      result.permutationToPlace = server.BlockPermutation.resolve(result.permutationToPlace.type.id, state);
    }
  });

  if (!globalThis.panCookTicks) globalThis.panCookTicks = new Map();

  result.blockComponentRegistry.registerCustomComponent("ff:pan", {
    onPlayerInteract: result => {
      const { block, player, face } = result;
      if (player.isSneaking || face !== "Up") return;
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const equippable = player.getComponent("minecraft:equippable");
      let item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();
      let state = block.permutation.getAllStates();
      let stage = state["ff:stage"] || 1;
      let panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
      
      if (!state["ff:stove_below"]) return;

      if (stage === 1 && (!item || item.typeId !== "ff:vegetable_oil")) {
        player.sendMessage(`§6(!) You need to add §eVegetable oil §6to cook!\n\n§7(?) To get the vegetable oil you need to do it from the §fIron pot §7block, place it on top of a §fStove (lit) §7and add water either with a §fWater bucket §7or §fWater bottles §7, after that add a §fFlower (any type)`);
        return;
      }
      if (stage === 1 && item && item.typeId === "ff:vegetable_oil") {
        state["ff:stage"] = 2;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        if (item.amount > 1) {
          item.amount--;
          equippable.setEquipment("Mainhand", item);
        } else {
          equippable.setEquipment("Mainhand", new server.ItemStack("minecraft:glass_bottle", 1));
        }
        dim.playSound("item.bottle.fill", block.location);
        return;
      }
      if (stage === 2 && item && PAN_CONVERSION[item.typeId] && !panEntity) {
        panEntity = dim.spawnEntity("ff:pan_bottom_left", {
          x: center.x, y: center.y - 0.5, z: center.z
        });
        panEntity.addTag(item.typeId);
        panEntity.addTag("amount:" + item.amount);
        panEntity.addTag("item:" + JSON.stringify({ typeId: item.typeId, amount: item.amount }));
        panEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} ${item.amount}`);
        state["ff:stage"] = 3;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        setPanEntityTimerEvent(panEntity, 3);
        const slot = player.selectedSlotIndex;
        inv.setItem(slot, undefined);
        dim.playSound("block.brewing_stand.brew", block.location);
        const posKey = `${block.location.x},${block.location.y},${block.location.z}`;
        globalThis.panCookTicks.set(posKey, 0);
        return;
      }
      if (stage === 5 && item && item.typeId === "ff:spatula" && panEntity) {
        state["ff:stage"] = 6;
        updateBlock(block, state);
        setPanEntityTimerEvent(panEntity, 6);

        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        block.dimension.runCommand(`execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run playanimation @e[r=0.8,type=ff:pan_bottom_left] animation.pan_indicador_and_item.flip`);
        dim.playSound("mob.irongolem.throw", block.location);
        return;
      }

      if (stage === 10 && panEntity) {
        const tags = panEntity.getTags();
        const amountTag = tags.find(t => t.startsWith("amount:"));
        let amount = 1;
        if (amountTag) amount = parseInt(amountTag.split(":")[1]);
        inv.addItem(new server.ItemStack("minecraft:coal", amount));
        setPanEntityTimerEvent(panEntity, 0);
        panEntity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
        );
        state["ff:stage"] = 2;
        updateBlock(block, state);
        dim.playSound("extinguish.candle", block.location);
        const posKey = `${block.location.x},${block.location.y},${block.location.z}`;
        globalThis.panCookTicks.delete(posKey);
        return;
      }
      if ((stage === 8 || stage === 9 || stage === 10) && !item && panEntity) {
        const tags = panEntity.getTags();
        const inputId = tags.find(t => PAN_CONVERSION[t]);
        const amountTag = tags.find(t => t.startsWith("amount:"));
        let amount = 1;
        if (amountTag) amount = parseInt(amountTag.split(":")[1]);
        let itemToGive = null;
        if ((stage === 8 || stage === 9) && inputId) {
          itemToGive = new server.ItemStack(PAN_CONVERSION[inputId], amount);
          dim.playSound("random.pop", block.location);
        } else if (stage === 10) {
          itemToGive = new server.ItemStack("minecraft:coal", amount);
          dim.playSound("random.pop", block.location);
        }
        if (itemToGive) {
          inv.addItem(itemToGive);
        }
        panEntity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
        );
        panEntity.runCommand(`event entity @s ff:despawn`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`
        );
        state["ff:stage"] = 2;
        updateBlock(block, state);
        dim.playSound("entity.item.pickup", block.location);
        const posKey = `${block.location.x},${block.location.y},${block.location.z}`;
        globalThis.panCookTicks.delete(posKey);
        return;
      }
    },
    onTick: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let state = block.permutation.getAllStates();
      let stage = state["ff:stage"] || 1;
      let panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
      let stoveBelow = false;

      const below = { x: block.location.x, y: block.location.y - 1, z: block.location.z };
      const belowBlock = dim.getBlock(below);
      if (belowBlock && belowBlock.typeId === "ff:stove") {
        const belowState = belowBlock.permutation.getAllStates();
        if (belowState["block:lit"] === true) {
          stoveBelow = true;
        }
      }

      if (state["ff:stove_below"] !== stoveBelow) {
        state["ff:stove_below"] = stoveBelow;
        updateBlock(block, state);
      }

      if (!stoveBelow) {
        if (stage !== 1) {
          state["ff:stage"] = 1;
          updateBlock(block, state);
          let panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
          if (panEntity) {
            panEntity.runCommand(`event entity @s ff:kill`);
            dim.runCommand(
              `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
            );
          }
        }
        return;
      }

      if (panEntity && stage >= 1 && stage <= 9) {
        setPanEntityTimerEvent(panEntity, stage);
      }

      if (panEntity && stage === 3) {
        state["ff:stage"] = 4;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        panEntity.dimension.runCommand(`particle ff:pan_smoke ${block.location.x} ${block.location.y + 0.7} ${block.location.z}`);
        return;
      }
      if (panEntity && stage === 4) {
        state["ff:stage"] = 5;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        return;
      }
      if (panEntity && stage === 5) {
        state["ff:stage"] = 6;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        return;
      }

      if (panEntity && stage === 6) {
        state["ff:stage"] = 7;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        return;
      }
      

      if (panEntity && stage === 7) {
        state["ff:stage"] = 8;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.orb @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 1 1`);
        
        for (let i = 0; i < 5; i++) {
          const dx = (Math.random() - 0.5) * 0.6;
          const dz = (Math.random() - 0.5) * 0.6;
          const px = block.location.x + 0.5 + dx;
          const py = block.location.y + 0.3;
          const pz = block.location.z + 0.5 + dz;
          block.dimension.runCommand(`particle minecraft:villager_happy ${px} ${py} ${pz}`);
        }

        const tags = panEntity.getTags();
        const inputId = tags.find(t => PAN_CONVERSION[t]);
        const amountTag = tags.find(t => t.startsWith("amount:"));
        let amount = 1;
        if (amountTag) amount = parseInt(amountTag.split(":")[1]);
        if (inputId) {
          panEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${PAN_CONVERSION[inputId]} ${amount}`);
        }
        panEntity.dimension.runCommand(`particle ff:pan_ready ${block.location.x} ${block.location.y + 0.7} ${block.location.z}`);
        panEntity.dimension.playSound("entity.experience_orb.pickup", block.location);
        return;
      }

      if (panEntity && stage === 8) {
        state["ff:stage"] = 9;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        panEntity.dimension.runCommand(`particle ff:pan_warning2 ${block.location.x} ${block.location.y + 0.7} ${block.location.z}`);
        return;
      }
      if (panEntity && stage === 9) {
        state["ff:stage"] = 10;
        updateBlock(block, state);
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        const amountTag = panEntity.getTags().find(t => t.startsWith("amount:"));
        let amount = 1;
        if (amountTag) amount = parseInt(amountTag.split(":")[1]);
        panEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 minecraft:coal ${amount}`);
        panEntity.dimension.runCommand(`particle ff:pan_burnt ${block.location.x} ${block.location.y + 0.7} ${block.location.z}`);
        panEntity.dimension.playSound("block.fire.extinguish", block.location);
        return;
      }
    },
    onDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
      if (panEntity) {
        const tags = panEntity.getTags();
        const inputId = tags.find(t => t in PAN_CONVERSION);
        if (inputId) {
          dim.spawnItem(new server.ItemStack(inputId, 1), {
            x: block.location.x + 0.5,
            y: block.location.y + 1,
            z: block.location.z + 0.5
          });
        }
        panEntity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
        );
        panEntity.runCommand(`event entity @s ff:despawn`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`
        );
      }
    },
    onPlayerDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
      if (panEntity) {
        const tags = panEntity.getTags();
        const inputId = tags.find(t => t in PAN_CONVERSION);
        if (inputId) {
          dim.spawnItem(new server.ItemStack(inputId, 1), {
            x: block.location.x + 0.5,
            y: block.location.y + 1,
            z: block.location.z + 0.5
          });
        }
        panEntity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
        );
        panEntity.runCommand(`event entity @s ff:despawn`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`
        );
      }
    }
  });

  result.blockComponentRegistry.registerCustomComponent("ff:stove", {
    onPlayerInteract: result => {
      let state = result.block.permutation.getAllStates();
      let item = result.player.getComponent("minecraft:equippable").getEquipment("Mainhand");
      if (result.player.isSneaking && state["block:lit"] === true) {
        state["block:lit"] = false;
        result.block.setPermutation(server.BlockPermutation.resolve(result.block.typeId, state));
        result.player.dimension.playSound("extinguish.candle", result.block.location);
        result.player.dimension.playSound("block.fire.extinguish", result.block.location);
        return;
      }
      if (state["block:lit"] === true && item?.typeId === "minecraft:potion") {
        state["block:lit"] = false;
        result.player.getComponent("minecraft:equippable")
              .setEquipment("Mainhand", new server.ItemStack("minecraft:bucket", 1));
        result.player.dimension.playSound("extinguish.candle", result.block.location);
      } else if (state["block:lit"] === false && item?.typeId === "minecraft:flint_and_steel") {
        state["block:lit"] = true;
        if (item.getComponent("minecraft:durability").damage < item.getComponent("minecraft:durability").maxDurability) {
          item.getComponent("minecraft:durability").damage++;
          result.player.getComponent("minecraft:equippable").setEquipment("Mainhand", item);
        } else {
          result.player.getComponent("minecraft:equippable").setEquipment("Mainhand", undefined);
          result.player.dimension.playSound("random.break", result.player.location);
        }
        result.player.dimension.playSound("fire.ignite", result.block.location);
      }
      result.block.setPermutation(server.BlockPermutation.resolve(result.block.typeId, state));
    },
    onTick: result => {
      const { block } = result;
      const dim = block.dimension;
      const above = { x: block.location.x, y: block.location.y + 1, z: block.location.z };
      const aboveBlock = dim.getBlock(above);

      if (aboveBlock && aboveBlock.typeId === "ff:pan") {
        const panBlock = aboveBlock;
        const state = panBlock.permutation.getAllStates();
        const stage = state["ff:stage"] || 1;
        const panEntity = dim.getEntitiesAtBlockLocation(panBlock.center()).find(e => e.typeId === "ff:pan_bottom_left");
        if (!panEntity) return;
        setPanEntityTimerEvent(panEntity, stage);

        if (stage >= 2 && stage <= 8) {
          if (stage === 2) {
            dim.runCommand(`particle ff:pan_oil ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
          } else {
            dim.runCommand(`particle ff:pan_oil ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
            dim.runCommand(`particle ff:pan_smoke ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
          }
        }

        if (stage == 9) {
            dim.runCommand(`particle ff:pan_oil ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
            dim.runCommand(`particle ff:pan_smoke_full ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
            block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound fire.fire @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z}`);
        }

        if (stage == 10) {
            dim.runCommand(`particle ff:pan_oil ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
            dim.runCommand(`particle ff:pan_smoke_full_ultra ${panBlock.location.x} ${panBlock.location.y + 0.1} ${panBlock.location.z}`);
            block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound fire.fire @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z}`);
        }
        return;
      }


    }
  });


  
 


  result.blockComponentRegistry.registerCustomComponent("ff:cutting_board", {
    onPlayerInteract: result => {
      const { block, player, face } = result;
      if (player.isSneaking || face !== "Up") return;

      const equippable = player.getComponent("minecraft:equippable");
      let item = equippable.getEquipment("Mainhand");
      const offhand = equippable.getEquipment("Offhand");
      const offId = offhand?.typeId ?? "";
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const dim = block.dimension;
      const center = block.center();

      const mapping = {
        "minecraft:bread": ["ff:bread_slice", 2, 4],
        "minecraft:melon_block": ["minecraft:melon_slice", 4, 6],
        "minecraft:sugar_cane": ["minecraft:sugar", 2, 4],

        // New recipes
        "minecraft:short_grass": ["minecraft:wheat_seeds", 1, 1],
        "minecraft:dandelion": ["minecraft:yellow_dye", 2, 2],
        "minecraft:pink_tulip": ["minecraft:pink_dye", 2, 2],
        "minecraft:red_tulip": ["minecraft:red_dye", 2, 2],
        "minecraft:white_tulip": ["minecraft:white_dye", 2, 2],
        "minecraft:orange_tulip": ["minecraft:orange_dye", 2, 2],
        "minecraft:rotten_flesh": ["minecraft:brown_dye", 1, 1],
        "minecraft:white_wool": ["minecraft:string", 4, 4],
        "minecraft:torchflower": ["minecraft:orange_dye", 2, 2],
        "minecraft:pumpkin": ["minecraft:pumpkin_seeds", 2, 2],
        "minecraft:melon_slice": ["minecraft:melon_seeds", 2, 2],
        "minecraft:cornflower": ["minecraft:blue_dye", 2, 2],
        "minecraft:blue_orchid": ["minecraft:light_blue_dye", 2, 2],
        "minecraft:slime": ["minecraft:slime_ball", 9, 9],
        "minecraft:magma": ["minecraft:magma_cream", 9, 9],
        "minecraft:rose_bush": ["minecraft:red_dye", 3, 3],
        "minecraft:peony": ["minecraft:pink_dye", 3, 3],
        "minecraft:lilac": ["minecraft:purple_dye", 3, 3],
        "minecraft:web": ["minecraft:string", 2, 4],
        "minecraft:azure_bluet": ["minecraft:light_gray_dye", 2, 2],
        "minecraft:allium": ["minecraft:magenta_dye", 2, 2],
        "minecraft:cactus_flower": ["minecraft:pink_dye", 2, 2],
        "minecraft:wither_rose": ["minecraft:black_dye", 2, 2],
        "minecraft:open_eyeblossom": ["minecraft:orange_dye", 2, 2],
        "minecraft:closed_eyeblossom": ["minecraft:light_gray_dye", 2, 2],
        "minecraft:wildflowers": ["minecraft:yellow_dye", 2, 2],
        "minecraft:pink_petals": ["minecraft:pink_dye", 2, 2],
        "minecraft:pitcher_plant": ["minecraft:cyan_dye", 2, 2],
        "minecraft:sunflower": ["minecraft:yellow_dye", 2, 2],
        "minecraft:lily_of_the_valley": ["minecraft:white_dye", 2, 2],
        "minecraft:oxeye_daisy": ["minecraft:white_dye", 2, 2],
        "minecraft:poppy": ["minecraft:red_dye", 2, 2],
        "minecraft:warped_roots": ["minecraft:cyan_dye", 2, 2],
        "minecraft:crimson_roots": ["minecraft:red_dye", 2, 2],
        "minecraft:lily_pad": ["minecraft:green_dye", 2, 2],
        "minecraft:deadbush": ["minecraft:stick", 1, 3],
        "minecraft:mangrove_roots": ["minecraft:stick", 7, 9],
        "minecraft:fern": ["minecraft:wheat_seeds", 1, 2],
        "minecraft:tall_grass": ["minecraft:wheat_seeds", 2, 3],
        "minecraft:large_fern": ["minecraft:wheat_seeds", 2, 3],
        "minecraft:bush": ["minecraft:wheat_seeds", 1, 2],
        "minecraft:dried_kelp": ["minecraft:black_dye", 1, 1],
        "minecraft:dried_kelp_block": ["minecraft:dried_kelp", 9, 9],
       };
      const knifeTypes = [
        "ff:iron_knife",
        "ff:diamond_knife",
        "ff:netherite_knife",
        "ff:gold_knife"
      ];

      // Jam application constants
      const TOAST_ID = "ff:bread_slice_toasted";
      const JAM_SWEET = "ff:sweet_berries_jam";
      const JAM_GLOW = "ff:glow_berries_jam";
      const OUT_SWEET = "ff:bread_slice_sweet_berry_jam";
      const OUT_GLOW = "ff:bread_slice_glow_berry_jam";

      let entity = dim.getEntitiesAtBlockLocation(center)
                      .find(e => e.typeId === "ff:entity_cutting_board");

      if (!item && entity) {
        const itemTag = entity.getTags().find(t => t.startsWith("item:"));
        if (itemTag) {
          try {
            const itemData = JSON.parse(itemTag.slice(5));
            const restored = new server.ItemStack(itemData.typeId, itemData.amount);
            if (itemData.nameTag) restored.nameTag = itemData.nameTag;
            if (itemData.lore) restored.setLore(itemData.lore);
            if (itemData.enchantments) {
              const enchComp = restored.getComponent("minecraft:enchantable");
              if (enchComp) {
                for (const ench of itemData.enchantments) {
                  enchComp.addEnchantment({ type: new server.EnchantmentType(ench.id), level: ench.level });
                }
              }
            }
            inv.addItem(restored);
          } catch (e) {
            const fallbackId = entity.getTags()[0];
            if (fallbackId) inv.addItem(new server.ItemStack(fallbackId, 1));
          }
        }
        entity.runCommand(`event entity @s kills`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] kills`
        );
        return;
      }

      if (item && !entity) {
        entity = dim.spawnEntity("ff:entity_cutting_board", {
          x: center.x, y: center.y - 0.5, z: center.z
        });
        const enchComp = item.getComponent("minecraft:enchantable");
        const enchantments = enchComp ? enchComp.getEnchantments().map(e => ({ id: e.type.id, level: e.level })) : undefined;
        const itemData = {
          typeId: item.typeId,
          amount: 1,
          nameTag: item.nameTag,
          lore: item.getLore ? item.getLore() : undefined,
          enchantments: enchantments && enchantments.length > 0 ? enchantments : undefined
        };
        entity.addTag(item.typeId);
        entity.addTag("item:" + JSON.stringify(itemData));
        entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1`);
        const slot = player.selectedSlotIndex;
        if (item.amount > 1) {
          item.amount--;
          inv.setItem(slot, item);
        } else {
          inv.setItem(slot, undefined);
        }
        return;
      }

      if (item && knifeTypes.includes(item.typeId) && entity) {
        const firstTag = entity.getTags()[0];
        const isToastOnBoard = firstTag === TOAST_ID;
        const isJamOffhand = offId === JAM_SWEET || offId === JAM_GLOW;
        if (isToastOnBoard && isJamOffhand) {
          if (offhand) {
            if (offhand.amount > 1) {
              offhand.amount--;
              equippable.setEquipment("Offhand", offhand);
            } else {
              equippable.setEquipment("Offhand", undefined);
            }
          }
          const outId = offId === JAM_GLOW ? OUT_GLOW : OUT_SWEET;
          inv.addItem(new server.ItemStack(outId, 1));
          inv.addItem(new server.ItemStack("ff:glass_jar", 1));
          try { dim.playSound("step.honey_block", block.location); } catch {}
          entity.runCommand(`event entity @s kills`);
          dim.runCommand(
            `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] kills`
          );
          return;
        }

        const tag = entity.getTags()[0];
        const recipe = mapping[tag] || [];
        const [sliceId, min, max] = recipe;
        let specialCut = false;
        if (sliceId && Number.isInteger(min) && Number.isInteger(max)) {
          const count = Math.floor(Math.random() * (max - min + 1)) + min;
          for (let i = 0; i < count; i++) {
            inv.addItem(new server.ItemStack(sliceId, 1));
          }
          specialCut = true;
        } else {
          const itemTag = entity.getTags().find(t => t.startsWith("item:"));
          if (itemTag) {
            try {
              const itemData = JSON.parse(itemTag.slice(5));
              const restored = new server.ItemStack(itemData.typeId, itemData.amount);
              if (itemData.nameTag) restored.nameTag = itemData.nameTag;
              if (itemData.lore) restored.setLore(itemData.lore);
              if (itemData.enchantments) {
                const enchComp = restored.getComponent("minecraft:enchantable");
                if (enchComp) {
                  for (const ench of itemData.enchantments) {
                    enchComp.addEnchantment({ type: new server.EnchantmentType(ench.id), level: ench.level });
                  }
                }
              }
              inv.addItem(restored);
            } catch (e) {
              inv.addItem(new server.ItemStack(tag, 1));
            }
          } else {
            inv.addItem(new server.ItemStack(tag, 1));
          }
        }
        
        const durComp = item.getComponent("minecraft:durability");
        if (durComp) {
          if (specialCut) {
            durComp.damage++;
          } else {
            durComp.damage += (Math.random() < 2 ? 4 : 5);
          }
          if (durComp.damage >= durComp.maxDurability) {
            equippable.setEquipment("Mainhand", undefined);
            player.dimension.playSound("random.break", player.location);
          } else {
            equippable.setEquipment("Mainhand", item);
          }
        }

        if (specialCut) {
          entity.runCommand(`particle ff:sparks_done ${block.location.x} ${block.location.y} ${block.location.z}`);
          player.dimension.playSound("mob.sheep.shear", player.location);
        } else {
          let mat = "iron";
          if (item.typeId.includes("diamond")) mat = "diamond";
          else if (item.typeId.includes("gold")) mat = "gold";
          else if (item.typeId.includes("netherite")) mat = "netherite";
          entity.runCommand(`particle ff:knife_${mat} ${block.location.x} ${block.location.y} ${block.location.z}`);
          player.dimension.playSound("random.break", player.location);
          
        }
        entity.runCommand(`event entity @s kills`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] kills`
        );
      }
    },
    onDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let entity = dim.getEntitiesAtBlockLocation(center)
                      .find(e => e.typeId === "ff:entity_cutting_board");
      if (entity) {
        const itemTag = entity.getTags().find(t => t.startsWith("item:"));
        if (itemTag) {
          try {
            const itemData = JSON.parse(itemTag.slice(5));
            const restored = new server.ItemStack(itemData.typeId, itemData.amount);
            if (itemData.nameTag) restored.nameTag = itemData.nameTag;
            if (itemData.lore) restored.setLore(itemData.lore);
            if (itemData.enchantments) {
              const enchComp = restored.getComponent("minecraft:enchantable");
              if (enchComp) {
                for (const ench of itemData.enchantments) {
                  enchComp.addEnchantment({ type: new server.EnchantmentType(ench.id), level: ench.level });
                }
              }
            }
            dim.spawnItem(restored, {
              x: block.location.x + 0.5,
              y: block.location.y + 1,
              z: block.location.z + 0.5
            });
          } catch (e) {
            const fallbackId = entity.getTags()[0];
            if (fallbackId) dim.spawnItem(new server.ItemStack(fallbackId, 1), {
              x: block.location.x + 0.5,
              y: block.location.y + 1,
              z: block.location.z + 0.5
            });
          }
        }
        entity.runCommand(`event entity @s kills`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] kills`
        );
                entity.runCommand(`event entity @s ff:despawn`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`
        );
      }
    },
    onPlayerDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let entity = dim.getEntitiesAtBlockLocation(center)
                      .find(e => e.typeId === "ff:entity_cutting_board");
      if (entity) {
        const itemTag = entity.getTags().find(t => t.startsWith("item:"));
        if (itemTag) {
          try {
            const itemData = JSON.parse(itemTag.slice(5));
            const restored = new server.ItemStack(itemData.typeId, itemData.amount);
            if (itemData.nameTag) restored.nameTag = itemData.nameTag;
            if (itemData.lore) restored.setLore(itemData.lore);
            if (itemData.enchantments) {
              const enchComp = restored.getComponent("minecraft:enchantable");
              if (enchComp) {
                for (const ench of itemData.enchantments) {
                  enchComp.addEnchantment({ type: new server.EnchantmentType(ench.id), level: ench.level });
                }
              }
            }
            dim.spawnItem(restored, {
              x: block.location.x + 0.5,
              y: block.location.y + 1,
              z: block.location.z + 0.5
            });
          } catch (e) {
            const fallbackId = entity.getTags()[0];
            if (fallbackId) dim.spawnItem(new server.ItemStack(fallbackId, 1), {
              x: block.location.x + 0.5,
              y: block.location.y + 1,
              z: block.location.z + 0.5
            });
          }
        }
        entity.runCommand(`event entity @s kills`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] kills`
        );
      }
    }
  });
});