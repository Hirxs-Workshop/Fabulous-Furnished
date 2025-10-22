import * as server from "@minecraft/server";
import { updateBlock as utilUpdateBlock } from "../../utils/block";
import { consumeEquipped } from "../../utils/item";

const IronPotUtils = {
  stoveCache: new Map(),
  sunflowerStages: new Map(),
  
  isStoveLit(block) {
    const cacheKey = `${block.location.x},${block.location.y - 1},${block.location.z}`;
    const cached = this.stoveCache.get(cacheKey);
    if (cached && Date.now() - cached.time < 150) return cached.value;

    const below = { x: block.location.x, y: block.location.y - 1, z: block.location.z };
    const belowBlock = block.dimension.getBlock(below);
    const isLit = !!(belowBlock?.typeId === "ff:stove" && belowBlock.permutation.getAllStates()["block:lit"]);

    this.stoveCache.set(cacheKey, { value: isLit, time: Date.now() });
    return isLit;
  },

  updateStoveState(block) {
    const state = block.permutation.getAllStates();
    const stoveLit = this.isStoveLit(block);
    if (state["ff:stove_below"] !== stoveLit) {
      state["ff:stove_below"] = stoveLit;
      block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
    }
    return stoveLit;
  },

  spawnParticles(dim, loc, type, a = 0, b = 0, variant = null) {
    const { x, y, z } = loc;
    const bubbleParticle = variant === "beetroot"
      ? "ff:beetroot_stem_bubbles"
      : variant === "mushroom"
        ? "ff:mushroom_stem_bubbles"
        : "ff:rabbit_stem_bubbles";
    const particles = {
      smoke: () => dim.runCommand(`particle ff:pan_smoke ${x} ${y + 0.1} ${z}`),
      water: (h = 0.3) => dim.runCommand(`particle ff:water_b ${x} ${y + h} ${z}`),
      bubbles: (h = 0) => dim.runCommand(`particle ${bubbleParticle} ${x} ${y + h} ${z}`)
    };

    if (type === "cooking") {
      particles.smoke();
      particles.water();
      if (Math.random() < 0.35) dim.playSound("bubble.pop", loc);
      return;
    }

    if (type === "stew") {
      const stage = a;
      const liquid = b;
      const heightMap = { 3: -0.1, 2: -0.3, 1: -0.5 };
      const height = heightMap[liquid] ?? -0.3;

      particles.smoke();
      if (stage >= 1 && stage <= 7) {
        particles.water(height + 0.6);
        if (Math.random() < 0.25) dim.playSound("bubble.pop", loc);
      } else if (stage === 8) {
        particles.bubbles(height + 0.6);
        if (Math.random() < 0.15) dim.playSound("bubble.pop", loc);
      }
    }
  },

  handleItem(equippable, item, consume = false) {
    if (!consume) return item;
    consumeEquipped(equippable, item);
    return null;
  },
  
  msg(player, parts) {
    try {
      player.sendMessage({ rawtext: parts });
    } catch (e) {
      const text = parts.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("");
      if (text) player.sendMessage(text);
    }
  },
  msgTr(player, key, withParts = []) {
    try {
      player.sendMessage({ rawtext: [ { translate: key, with: withParts } ] });
    } catch (e) {
      player.sendMessage(key);
    }
  },

  manageEntity(dim, center, action = "cleanup", itemTypeId = null) {
    const entity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
    if (!entity) return null;

    if (action === "cleanup") {
      entity.runCommand(`event entity @s ff:despawn`);
      dim.runCommand(`execute positioned ${center.x} ${center.y} ${center.z} run event entity @e[r=0.25] kills`);
    } else if (action === "spawn") {
      const item = itemTypeId ?? "minecraft:rabbit_stew";
      entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item} 1`);
    }
    return entity;
  },

  setPanEntityTimerEvent(panEntity, stage) {
    if (!panEntity) return;

    for (let i = 0; i <= 9; i++) {
      panEntity.runCommand(`event entity @s remove:timer_${i}`);
    }

    const map = { 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 };
    const timer = map[stage] ?? 0;
    if (timer > 0) panEntity.runCommand(`event entity @s timer_${timer}`);
  },

  updateBlock(block, newState, newType = null) {
    utilUpdateBlock(block, newState, newType);
  },
  _keyFromBlock(block) {
    return `${block.location.x},${block.location.y},${block.location.z}`;
  },
  getSunStage(block) {
    const k = this._keyFromBlock(block);
    return this.sunflowerStages.get(k) ?? 1;
  },
  setSunStage(block, stage) {
    const k = this._keyFromBlock(block);
    this.sunflowerStages.set(k, stage);
  },
  clearSunStage(block) {
    const k = this._keyFromBlock(block);
    this.sunflowerStages.delete(k);
  },

  getIngredientInfo() {
    return {
      "minecraft:carrot": { key: "carrot", name: "carrot", display: "Carrot" },
      "minecraft:brown_mushroom": { key: "mushroom", name: "brown mushroom", display: "Brown Mushroom" },
      "minecraft:red_mushroom": { key: "mushroom", name: "red mushroom", display: "Red Mushroom" },
      "minecraft:potato": { key: "potato", name: "potato", display: "Potato" }
    };
  },

  checkIngredients(state, type = "missing") {
    const ingredients = ["rabbit", "carrot", "mushroom", "potato"];
    if (type === "all") return ingredients.every(ing => state[`ff:has_${ing}`]);
    if (type === "missing") {
      const names = { carrot: "carrot", mushroom: "brown/red mushroom", potato: "potato" };
      return ["carrot", "mushroom", "potato"]
        .filter(ing => !state[`ff:has_${ing}`])
        .map(ing => names[ing]);
    }
    return false;
  },

  progressCooking(block, state, dim, center) {
    const cookedLevel = state["ff:cooked"] || 0;
    const stoveLit = this.updateStoveState(block);
    
    if (!stoveLit) return false;
    
    if (cookedLevel === 0 && this.checkIngredients(state, "all")) {
      state["ff:cooked"] = 1;
      this.updateBlock(block, state);
      dim.playSound("mob.axolotl.idle_water", block.location);
      return true;
    }
    
    if (cookedLevel > 0 && cookedLevel < 3) {
      state["ff:cooked"] = cookedLevel + 1;
      this.updateBlock(block, state);
      
      if (cookedLevel === 2) {
        this.manageEntity(dim, center, "spawn");
        dim.playSound("random.orb", block.location);
      }
      return true;
    }
    
    return false;
  }
};

server.world.beforeEvents.worldInitialize.subscribe(result => {
  result.blockComponentRegistry.registerCustomComponent("ff:stove_iron_pot_particles", {
    onTick: result => {
      const { block } = result;
      const state = block.permutation.getAllStates();
      
      if (!state["block:lit"]) return;
      
      const dim = block.dimension;
      const above = { x: block.location.x, y: block.location.y + 1, z: block.location.z };
      const aboveBlock = dim.getBlock(above);
      
      if (aboveBlock?.typeId?.includes("iron_pot")) {
        const aboveState = aboveBlock.permutation.getAllStates();
        const liquidLevel = aboveState["ff:fully"] || 0;
        
        if (aboveBlock.typeId === "ff:iron_pot_with_sunflower") {
          const cookedLevel = aboveState["ff:cooked"] || 0;
          if (cookedLevel === 1 && liquidLevel > 0) {
            IronPotUtils.spawnParticles(dim, aboveBlock.location, "cooking", liquidLevel);
          }
        }
        
        if (aboveBlock.typeId === "ff:iron_pot_with_stew" || aboveBlock.typeId === "ff:iron_pot_with_mushroom_stew" || aboveBlock.typeId === "ff:iron_pot_with_beetroot_stew") {
          const stage = aboveState["ff:stage"] || 0;
          if (stage > 1 && stage < 10 && liquidLevel > 0) {
            const variant = aboveBlock.typeId === "ff:iron_pot_with_beetroot_stew"
              ? "beetroot"
              : (aboveBlock.typeId === "ff:iron_pot_with_mushroom_stew" ? "mushroom" : null);
            IronPotUtils.spawnParticles(dim, aboveBlock.location, "stew", stage, liquidLevel, variant);
          }
        }
      }
    }
  });

  result.blockComponentRegistry.registerCustomComponent("ff:pot_beetroot_stew_cooking", {
    onPlayerInteract: result => {
      const { block, player } = result;
      const state = block.permutation.getAllStates();
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();
      const waterLevel = state["ff:fully"] || 0;

      if (waterLevel === 0) {
        IronPotUtils.msgTr(player, "ff.iron_pot.tip_fill_water");
        return;
      }

      if (item?.typeId === "minecraft:beetroot" && !state["ff:has_beetroot"]) {
        state["ff:has_beetroot"] = true;
        IronPotUtils.updateBlock(block, state);
        IronPotUtils.handleItem(equippable, item, true);
        dim.playSound("random.pop", block.location);
        const stoveLit = IronPotUtils.isStoveLit(block);
        if (stoveLit) IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_cooking");
        else IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_light_stove");
        return;
      }

      if (item?.typeId === "ff:wooden_tablespoon" && state["ff:stage"] === 5) {
        state["ff:stage"] = 6;
        IronPotUtils.updateBlock(block, state);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, 6);
        dim.playSound("mob.chicken.plop", block.location);
        IronPotUtils.msgTr(player, "ff.iron_pot.stirred_continue");
        return;
      }

      if (item?.typeId === "minecraft:bowl" && (state["ff:stage"] === 8 || state["ff:stage"] === 9 || state["ff:stage"] === 10) && waterLevel > 0) {
        state["ff:fully"]--;
        if (state["ff:stage"] === 10) {
          inv.addItem(new server.ItemStack("minecraft:charcoal", 1));
          dim.playSound("random.fizz", block.location);
          IronPotUtils.msgTr(player, "ff.iron_pot.burnt_charcoal");
        } else {
          inv.addItem(new server.ItemStack("minecraft:beetroot_soup", 1));
          IronPotUtils.handleItem(equippable, item, true);
          dim.playSound("cauldron.takepotion", block.location);
          if (state["ff:fully"] > 0) IronPotUtils.msgTr(player, "ff.iron_pot.collected_generic_remaining", ["Stew", "Bowl", state["ff:fully"].toString()]);
          else IronPotUtils.msgTr(player, "ff.iron_pot.collected_generic_last", ["stew", "Bowl"]);
        }
        if (state["ff:fully"] === 0) {
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": 0,
            "ff:stove_below": state["ff:stove_below"]
          };
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
        } else {
          IronPotUtils.updateBlock(block, state);
        }
        return;
      }

      if (!item && state["ff:stage"] === 1 && waterLevel > 0) {
        const ingredientsToReturn = [
          { condition: state["ff:has_beetroot"], typeId: "minecraft:beetroot" }
        ].filter(ing => ing.condition);
        if (ingredientsToReturn.length > 0) {
          ingredientsToReturn.forEach(ing => inv.addItem(new server.ItemStack(ing.typeId, 1)));
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": state["ff:fully"],
            "ff:stove_below": state["ff:stove_below"]
          };
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
          dim.playSound("random.pop", block.location);
          if (ingredientsToReturn.length === 1) IronPotUtils.msgTr(player, "ff.iron_pot.returned_1_ingredient");
          else IronPotUtils.msgTr(player, "ff.iron_pot.returned_n_ingredients", [ingredientsToReturn.length.toString()]);
          return;
        }
      }

      if (!item && state["ff:stage"] === 5) {
        IronPotUtils.msgTr(player, "ff.iron_pot.needs_stirring");
        return;
      }
      if (!item && (state["ff:stage"] === 8 || state["ff:stage"] === 9 || state["ff:stage"] === 10) && waterLevel > 0) {
        if (state["ff:stage"] === 10) IronPotUtils.msgTr(player, "ff.iron_pot.info_burnt_use_bowl", [waterLevel.toString()]);
        else IronPotUtils.msgTr(player, "ff.iron_pot.info_need_bowl_with_portions", [waterLevel.toString()]);
      }
    },
    onTick: result => {
      const { block } = result;
      const state = block.permutation.getAllStates();
      const dim = block.dimension;
      const center = block.center();
      const stoveLit = IronPotUtils.updateStoveState(block);
      if (!stoveLit) return;
      if (state["ff:stage"] === 1 && state["ff:has_beetroot"]) {
        state["ff:stage"] = 2;
        IronPotUtils.updateBlock(block, state);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, 2);
        dim.playSound("mob.axolotl.idle_water", block.location);
        return;
      }
      if (state["ff:stage"] > 1 && state["ff:stage"] < 10 && state["ff:stage"] !== 5) {
        state["ff:stage"]++;
        const newStage = state["ff:stage"];
        IronPotUtils.updateBlock(block, state);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, newStage);
        if (newStage === 10) {
          IronPotUtils.manageEntity(dim, center, "spawn", "minecraft:beetroot_soup");
          dim.playSound("random.orb", block.location);
        }
      }
    },
    onDestroy: result => {
      IronPotUtils.manageEntity(result.block.dimension, result.block.center(), "cleanup");
    }
  });

  result.blockComponentRegistry.registerCustomComponent("ff:pot_basic", {
    onPlayerInteract: result => {
      const { block, player } = result;
      const state = block.permutation.getAllStates();
      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();

      if (item?.typeId === "minecraft:water_bucket" && (state["ff:fully"] || 0) === 0) {
        const waterLevel = 3;
        state["ff:fully"] = waterLevel;
        
        equippable.setEquipment("Mainhand", new server.ItemStack("minecraft:bucket", item.amount));
        IronPotUtils.updateBlock(block, state);
        dim.playSound("cauldron.fillwater", block.location);
        return;
      }
      
      const waterLevel = state["ff:fully"] || 0;
      if (waterLevel === 0) {
        IronPotUtils.msgTr(player, "ff.iron_pot.tip_fill_water");
        return;
      }
      
      const FLOWER_ITEMS = new Set([
        "minecraft:dandelion",
        "minecraft:poppy",
        "minecraft:blue_orchid",
        "minecraft:allium",
        "minecraft:azure_bluet",
        "minecraft:red_tulip",
        "minecraft:orange_tulip",
        "minecraft:white_tulip",
        "minecraft:pink_tulip",
        "minecraft:oxeye_daisy",
        "minecraft:cornflower",
        "minecraft:lily_of_the_valley",
        "minecraft:wither_rose",
        "minecraft:torchflower",
        "minecraft:pitcher_plant",
        "minecraft:sunflower",
        "minecraft:lilac",
        "minecraft:peony",
        "minecraft:rose_bush"
      ]);

      const transformations = {
        "minecraft:cooked_rabbit": {
          newType: "ff:iron_pot_with_stew",
          newState: { 
            "ff:stage": 1,
            "ff:has_rabbit": true, "ff:has_carrot": false,
            "ff:has_mushroom": false, "ff:has_potato": false
          },
          entityItem: "minecraft:cooked_rabbit",
          messageKey: "ff.iron_pot.recipe_pinned_rabbit_stew"
        },
        "minecraft:brown_mushroom": {
          newType: "ff:iron_pot_with_mushroom_stew",
          newState: {
            "ff:stage": 1,
            "ff:has_mushroom": true,
            "ff:has_brown": true,
            "ff:has_red": false
          },
          entityItem: "minecraft:brown_mushroom",
          messageKey: "ff.iron_pot.recipe_pinned_mushroom_stew"
        },
        "minecraft:red_mushroom": {
          newType: "ff:iron_pot_with_mushroom_stew",
          newState: {
            "ff:stage": 1,
            "ff:has_mushroom": true,
            "ff:has_brown": false,
            "ff:has_red": true
          },
          entityItem: "minecraft:red_mushroom",
          messageKey: "ff.iron_pot.recipe_pinned_mushroom_stew"
        },
        "minecraft:beetroot": {
          newType: "ff:iron_pot_with_beetroot_stew",
          newState: {
            "ff:stage": 1,
            "ff:has_beetroot": true
          },
          entityItem: "minecraft:beetroot",
          messageKey: "ff.iron_pot.recipe_pinned_beetroot_stew"
        }
      };
      
      if (item && FLOWER_ITEMS.has(item.typeId)) {
        const flowerTransformation = {
          newType: "ff:iron_pot_with_sunflower",
          newState: { "ff:cooked": 1 },
          entityItem: item.typeId,
          messageKey: "ff.iron_pot.added_sunflower"
        };
        const newState = {
          "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
          "ff:fully": waterLevel,
          "ff:stove_below": state["ff:stove_below"],
          ...flowerTransformation.newState
        };
        IronPotUtils.setSunStage(block, 1);
        IronPotUtils.updateBlock(block, newState, flowerTransformation.newType);
        IronPotUtils.handleItem(equippable, item, true);
        const entity = dim.spawnEntity("ff:iron_pot_indicator", {
          x: center.x, y: center.y - 0.3, z: center.z
        });
        entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${flowerTransformation.entityItem} 1`);
        dim.playSound("random.pop", block.location);
        IronPotUtils.msgTr(player, flowerTransformation.messageKey);
        return;
      }

      const transformation = transformations[item?.typeId];
      if (transformation) {
        const newState = {
          "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
          "ff:fully": waterLevel,
          "ff:stove_below": state["ff:stove_below"],
          ...transformation.newState
        };
        
        IronPotUtils.updateBlock(block, newState, transformation.newType);
        IronPotUtils.handleItem(equippable, item, true);
        
        const entity = dim.spawnEntity("ff:iron_pot_indicator", {
          x: center.x, y: center.y - 0.3, z: center.z
        });
        entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${transformation.entityItem} 1`);
        
        dim.playSound("random.pop", block.location);
        IronPotUtils.msgTr(player, transformation.messageKey);
      }
    },
    onTick: result => {
      IronPotUtils.updateStoveState(result.block);
    }
  });

  result.blockComponentRegistry.registerCustomComponent("ff:pot_sunflower_cooking", {
    onPlayerInteract: result => {
      const { block, player } = result;
      const state = block.permutation.getAllStates();
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();
      const waterLevel = state["ff:fully"] || 0;

      if (waterLevel === 0) {
        IronPotUtils.msgTr(player, "ff.iron_pot.tip_fill_water");
        return;
      }

      const stage = IronPotUtils.getSunStage(block);

      if (item?.typeId === "ff:wooden_tablespoon" && stage === 5) {
        IronPotUtils.setSunStage(block, 6);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, 6);
        dim.playSound("mob.chicken.plop", block.location);
        IronPotUtils.msgTr(player, "ff.iron_pot.stirred_continue");
        return;
      }

      if (item?.typeId === "minecraft:glass_bottle" && (stage === 8 || stage === 9 || stage === 10) && waterLevel > 0) {
        state["ff:fully"]--;
        if (stage === 10) {
          inv.addItem(new server.ItemStack("minecraft:charcoal", 1));
          dim.playSound("random.fizz", block.location);
          IronPotUtils.msgTr(player, "ff.iron_pot.burnt_charcoal");
        } else {
          inv.addItem(new server.ItemStack("ff:vegetable_oil", 1));
          IronPotUtils.handleItem(equippable, item, true);
          dim.playSound("cauldron.takepotion", block.location);
          if (state["ff:fully"] > 0) IronPotUtils.msgTr(player, "ff.iron_pot.collected_generic_remaining", ["Vegetable oil", "Glass Bottle", state["ff:fully"].toString()]);
          else IronPotUtils.msgTr(player, "ff.iron_pot.collected_generic_last", ["vegetable oil", "Glass Bottle"]);
        }
        if (state["ff:fully"] === 0) {
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": 0,
            "ff:stove_below": state["ff:stove_below"]
          };
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
          IronPotUtils.clearSunStage(block);
        } else {
          IronPotUtils.updateBlock(block, state);
        }
        return;
      }

      if (!item && stage === 5) {
        IronPotUtils.msgTr(player, "ff.iron_pot.needs_stirring");
        return;
      }
      if (!item && (stage === 8 || stage === 9 || stage === 10) && waterLevel > 0) {
        if (stage === 10) IronPotUtils.msgTr(player, "ff.iron_pot.info_burnt_use_bottle", [waterLevel.toString()]);
        else IronPotUtils.msgTr(player, "ff.iron_pot.info_need_bottle_with_portions", [waterLevel.toString()]);
      }
    },
    onTick: result => {
      const { block } = result;
      const state = block.permutation.getAllStates();
      const dim = block.dimension;
      const center = block.center();
      const stoveLit = IronPotUtils.updateStoveState(block);
      if (!stoveLit) return;

      let stage = IronPotUtils.getSunStage(block);
      if (stage === 1) {
        stage = 2;
        IronPotUtils.setSunStage(block, stage);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, 2);
        dim.playSound("mob.axolotl.idle_water", block.location);
        return;
      }
      if (stage > 1 && stage < 10 && stage !== 5) {
        stage += 1;
        IronPotUtils.setSunStage(block, stage);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, stage);
        // when reaching ready stage, switch liquid texture/state and show oil indicator
        if (stage === 8) {
          state["ff:cooked"] = 2;
          IronPotUtils.updateBlock(block, state);
          IronPotUtils.manageEntity(dim, center, "spawn", "ff:vegetable_oil");
          dim.playSound("random.orb", block.location);
        }
      }
    },
    onDestroy: result => {
      IronPotUtils.manageEntity(result.block.dimension, result.block.center(), "cleanup");
      IronPotUtils.clearSunStage(result.block);
    }
  });
  
  result.blockComponentRegistry.registerCustomComponent("ff:pot_mushroom_stew_cooking", {
    onPlayerInteract: result => {
      const { block, player } = result;
      const state = block.permutation.getAllStates();
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();
      const waterLevel = state["ff:fully"] || 0;

      if (waterLevel === 0) {
        IronPotUtils.msgTr(player, "ff.iron_pot.tip_fill_water");
        return;
      }

      if (item?.typeId === "minecraft:brown_mushroom" && !state["ff:has_brown"]) {
        state["ff:has_brown"] = true;
        state["ff:has_mushroom"] = true;
        IronPotUtils.updateBlock(block, state);
        IronPotUtils.handleItem(equippable, item, true);
        dim.playSound("random.pop", block.location);
        if (state["ff:has_red"]) {
          const stoveLit = IronPotUtils.isStoveLit(block);
          if (stoveLit) IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_cooking");
          else IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_light_stove");
        } else {
          IronPotUtils.msg(player, [{ translate: "ff.iron_pot.still_need" }, { text: " red mushroom." }]);
        }
        return;
      }
      if (item?.typeId === "minecraft:red_mushroom" && !state["ff:has_red"]) {
        state["ff:has_red"] = true;
        state["ff:has_mushroom"] = true;
        IronPotUtils.updateBlock(block, state);
        IronPotUtils.handleItem(equippable, item, true);
        dim.playSound("random.pop", block.location);
        if (state["ff:has_brown"]) {
          const stoveLit = IronPotUtils.isStoveLit(block);
          if (stoveLit) IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_cooking");
          else IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_light_stove");
        } else {
          IronPotUtils.msg(player, [{ translate: "ff.iron_pot.still_need" }, { text: " brown mushroom." }]);
        }
        return;
      }

      if (item?.typeId === "ff:wooden_tablespoon" && state["ff:stage"] === 5) {
        state["ff:stage"] = 6;
        IronPotUtils.updateBlock(block, state);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, 6);
        dim.playSound("mob.chicken.plop", block.location);
        IronPotUtils.msgTr(player, "ff.iron_pot.stirred_continue");
        return;
      }

      if (item?.typeId === "minecraft:bowl" && (state["ff:stage"] === 8 || state["ff:stage"] === 9 || state["ff:stage"] === 10) && waterLevel > 0) {
        state["ff:fully"]--;
        if (state["ff:stage"] === 10) {
          inv.addItem(new server.ItemStack("minecraft:charcoal", 1));
          dim.playSound("random.fizz", block.location);
          IronPotUtils.msgTr(player, "ff.iron_pot.burnt_charcoal");
        } else {
          inv.addItem(new server.ItemStack("minecraft:mushroom_stew", 1));
          IronPotUtils.handleItem(equippable, item, true);
          dim.playSound("cauldron.takepotion", block.location);
          if (state["ff:fully"] > 0) IronPotUtils.msgTr(player, "ff.iron_pot.stew_collected_remaining", [state["ff:fully"].toString()]);
          else IronPotUtils.msgTr(player, "ff.iron_pot.stew_collected_last");
        }
        if (state["ff:fully"] === 0) {
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": 0,
            "ff:stove_below": state["ff:stove_below"]
          };
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
        } else {
          IronPotUtils.updateBlock(block, state);
        }
        return;
      }

      if (!item && state["ff:stage"] === 1 && waterLevel > 0) {
        const ingredientsToReturn = [
          { condition: state["ff:has_brown"], typeId: "minecraft:brown_mushroom" },
          { condition: state["ff:has_red"], typeId: "minecraft:red_mushroom" }
        ].filter(ing => ing.condition);
        if (ingredientsToReturn.length > 0) {
          ingredientsToReturn.forEach(ing => inv.addItem(new server.ItemStack(ing.typeId, 1)));
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": state["ff:fully"],
            "ff:stove_below": state["ff:stove_below"]
          };
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
          dim.playSound("random.pop", block.location);
          if (ingredientsToReturn.length === 1) IronPotUtils.msgTr(player, "ff.iron_pot.returned_1_ingredient");
          else IronPotUtils.msgTr(player, "ff.iron_pot.returned_n_ingredients", [ingredientsToReturn.length.toString()]);
          return;
        }
      }

      if (!item && state["ff:stage"] === 5) {
        IronPotUtils.msgTr(player, "ff.iron_pot.needs_stirring");
        return;
      }
      if (!item && (state["ff:stage"] === 8 || state["ff:stage"] === 9 || state["ff:stage"] === 10) && waterLevel > 0) {
        if (state["ff:stage"] === 10) IronPotUtils.msgTr(player, "ff.iron_pot.info_burnt_use_bowl", [waterLevel.toString()]);
        else IronPotUtils.msgTr(player, "ff.iron_pot.info_need_bowl_with_portions", [waterLevel.toString()]);
      }
    },
    onTick: result => {
      const { block } = result;
      const state = block.permutation.getAllStates();
      const dim = block.dimension;
      const center = block.center();
      const stoveLit = IronPotUtils.updateStoveState(block);
      if (!stoveLit) return;
      if (state["ff:stage"] === 1 && state["ff:has_brown"] && state["ff:has_red"]) {
        state["ff:stage"] = 2;
        IronPotUtils.updateBlock(block, state);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, 2);
        dim.playSound("mob.axolotl.idle_water", block.location);
        return;
      }
      if (state["ff:stage"] > 1 && state["ff:stage"] < 10 && state["ff:stage"] !== 5) {
        state["ff:stage"]++;
        const newStage = state["ff:stage"];
        IronPotUtils.updateBlock(block, state);
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) IronPotUtils.setPanEntityTimerEvent(panEntity, newStage);
        if (newStage === 10) {
          IronPotUtils.manageEntity(dim, center, "spawn", "minecraft:mushroom_stew");
          dim.playSound("random.orb", block.location);
        }
      }
    },
    onDestroy: result => {
      IronPotUtils.manageEntity(result.block.dimension, result.block.center(), "cleanup");
    }
  });

  result.blockComponentRegistry.registerCustomComponent("ff:pot_stew_cooking", {
    onPlayerInteract: result => {
      const { block, player } = result;
      const state = block.permutation.getAllStates();
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();
      const waterLevel = state["ff:fully"] || 0;

      if (waterLevel === 0) return;

      const ingredientInfo = IronPotUtils.getIngredientInfo();
      const ingredient = ingredientInfo[item?.typeId];
      if (ingredient && state["ff:has_rabbit"] && !state[`ff:has_${ingredient.key}`]) {
        state[`ff:has_${ingredient.key}`] = true;
        IronPotUtils.updateBlock(block, state);
        IronPotUtils.handleItem(equippable, item, true);
        dim.playSound("random.pop", block.location);
        
        const remaining = IronPotUtils.checkIngredients(state, "missing");
        if (remaining.length > 0) {
          IronPotUtils.msg(player, [
            { translate: "ff.iron_pot.added_ingredient", with: [ingredient.display.toLowerCase()] },
            { text: "\n" },
            { translate: "ff.iron_pot.still_need" },
            { text: " " + remaining.join(", ") + "." }
          ]);
        }
        
        if (IronPotUtils.checkIngredients(state, "all")) {
          const stoveLit = IronPotUtils.isStoveLit(block);
          if (stoveLit) {
            IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_cooking");
          } else {
            IronPotUtils.msgTr(player, "ff.iron_pot.all_ingredients_light_stove");
          }
        }
        return;
      }

      if (item?.typeId === "ff:wooden_tablespoon" && state["ff:stage"] === 5) {
        state["ff:stage"] = 6;
        IronPotUtils.updateBlock(block, state);
        
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) {
          IronPotUtils.setPanEntityTimerEvent(panEntity, 6);
        }
        
        dim.playSound("mob.chicken.plop", block.location);
        IronPotUtils.msgTr(player, "ff.iron_pot.stirred_continue");
        return;
      }
      
      if (item?.typeId === "minecraft:bowl" && (state["ff:stage"] === 8 || state["ff:stage"] === 9 || state["ff:stage"] === 10) && waterLevel > 0) {
        state["ff:fully"]--;
        
        if (state["ff:stage"] === 10) {
          inv.addItem(new server.ItemStack("minecraft:charcoal", 1));
          dim.playSound("random.fizz", block.location);
          IronPotUtils.msgTr(player, "ff.iron_pot.burnt_charcoal");
        } else {
          inv.addItem(new server.ItemStack("minecraft:rabbit_stew", 1));
          IronPotUtils.handleItem(equippable, item, true);
          dim.playSound("cauldron.takepotion", block.location);
          
          if (state["ff:fully"] > 0) {
            IronPotUtils.msgTr(player, "ff.iron_pot.stew_collected_remaining", [state["ff:fully"].toString()]);
          } else {
            IronPotUtils.msgTr(player, "ff.iron_pot.stew_collected_last");
          }
        }
        
        if (state["ff:fully"] === 0) {
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": 0,
            "ff:stove_below": state["ff:stove_below"]
          };
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
        } else {
          IronPotUtils.updateBlock(block, state);
        }
        return;
      }
      
      if (!item && state["ff:stage"] === 1 && waterLevel > 0) {
        const ingredientsToReturn = [
          { condition: state["ff:has_rabbit"], typeId: "minecraft:cooked_rabbit" },
          { condition: state["ff:has_carrot"], typeId: "minecraft:carrot" },
          { condition: state["ff:has_mushroom"], typeId: "minecraft:brown_mushroom" },
          { condition: state["ff:has_potato"], typeId: "minecraft:potato" }
        ].filter(ing => ing.condition);
        
        if (ingredientsToReturn.length > 0) {
          ingredientsToReturn.forEach(ing => inv.addItem(new server.ItemStack(ing.typeId, 1)));
          
          const newState = {
            "minecraft:cardinal_direction": state["minecraft:cardinal_direction"],
            "ff:fully": state["ff:fully"],
            "ff:stove_below": state["ff:stove_below"]
          };
          
          IronPotUtils.updateBlock(block, newState, "ff:iron_pot");
          IronPotUtils.manageEntity(dim, center, "cleanup");
          dim.playSound("random.pop", block.location);
          if (ingredientsToReturn.length === 1) {
            IronPotUtils.msgTr(player, "ff.iron_pot.returned_1_ingredient");
          } else {
            IronPotUtils.msgTr(player, "ff.iron_pot.returned_n_ingredients", [ingredientsToReturn.length.toString()]);
          }
          return;
        }
      }
      
      if (!item && state["ff:stage"] === 5) {
        IronPotUtils.msgTr(player, "ff.iron_pot.needs_stirring");
        return;
      }
      
      if (!item && (state["ff:stage"] === 8 || state["ff:stage"] === 9 || state["ff:stage"] === 10) && waterLevel > 0) {
        if (state["ff:stage"] === 10) {
          IronPotUtils.msgTr(player, "ff.iron_pot.info_burnt_use_bowl", [waterLevel.toString()]);
        } else {
          IronPotUtils.msgTr(player, "ff.iron_pot.info_need_bowl_with_portions", [waterLevel.toString()]);
        }
      }
    },
    onTick: result => {
      const { block } = result;
      const state = block.permutation.getAllStates();
      const dim = block.dimension;
      const center = block.center();
      const stoveLit = IronPotUtils.updateStoveState(block);
      
      if (!stoveLit) return;
      
      if (IronPotUtils.checkIngredients(state, "all") && state["ff:stage"] === 1) {
        state["ff:stage"] = 2;
        IronPotUtils.updateBlock(block, state);
        
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) {
          IronPotUtils.setPanEntityTimerEvent(panEntity, 2);
        }
        
        dim.playSound("mob.axolotl.idle_water", block.location);
        return;
      }
      
      if (state["ff:stage"] > 1 && state["ff:stage"] < 10 && state["ff:stage"] !== 5) {
        const currentStage = state["ff:stage"];
        state["ff:stage"]++;
        const newStage = state["ff:stage"];
        
        IronPotUtils.updateBlock(block, state);
        
        const panEntity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:iron_pot_indicator");
        if (panEntity) {
          IronPotUtils.setPanEntityTimerEvent(panEntity, newStage);
        }
        
        if (newStage === 10) {
          IronPotUtils.manageEntity(dim, center, "spawn");
          dim.playSound("random.orb", block.location);
        }
      }
    },
    onDestroy: result => {
      IronPotUtils.manageEntity(result.block.dimension, result.block.center(), "cleanup");
    }
  });
});
