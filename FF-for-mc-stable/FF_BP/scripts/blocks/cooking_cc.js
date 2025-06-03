import * as server from "@minecraft/server";

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
  let timer = 0;
  if (stage === 3) timer = 2;
  else if (stage === 4) timer = 3;
  else if (stage === 5) timer = 4;
  else if (stage === 6) timer = 5;
  else if (stage === 7) timer = 6;
  else if (stage === 8) timer = 7;
  else if (stage === 9) timer = 8;
  else if (stage === 10) timer = 9;
  panEntity.runCommand(`event entity @s timer_${timer}`);
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

      if (stage === 1 && item && item.typeId === "ff:vegetable_oil") {
        state["ff:stage"] = 2;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
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
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        setPanEntityTimerEvent(panEntity, 3);
        const slot = player.selectedSlotIndex;
        inv.setItem(slot, undefined);
        dim.playSound("block.brewing_stand.brew", block.location);
        const posKey = `${block.location.x},${block.location.y},${block.location.z}`;
        globalThis.panCookTicks.set(posKey, 0);
        return;
      }
      if (stage === 4 && item && item.typeId === "ff:spatula" && panEntity) {
        state["ff:stage"] = 5;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));

        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        block.dimension.runCommand(`execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run playanimation @e[r=1,type=ff:pan_bottom_left] animation.pan_indicador_and_item.flip`);
        dim.playSound("mob.irongolem.throw", block.location);
        
        let tags = panEntity.getTags();
        tags = tags.filter(t => !t.startsWith("cookTick:"));
        for (const tag of panEntity.getTags()) {
          panEntity.removeTag(tag);
        }
        tags.forEach(t => panEntity.addTag(t));
        const posKey = `${block.location.x},${block.location.y},${block.location.z}`;
        globalThis.panCookTicks.set(posKey, 0);
        return;
      }
      if (stage === 5 && item && item.typeId === "ff:spatula" && panEntity) {
        state["ff:stage"] = 6;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        setPanEntityTimerEvent(panEntity, 6);

        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        block.dimension.runCommand(`execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run playanimation @e[r=1,type=ff:pan_bottom_left] animation.pan_indicador_and_item.flip`);
        dim.playSound("mob.irongolem.throw", block.location);
        return;
      }

      if (stage === 7 && item && item.typeId === "ff:spatula" && panEntity) {
        state["ff:stage"] = 8;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));

        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        block.dimension.runCommand(`execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run playanimation @e[r=1,type=ff:pan_bottom_left] animation.pan_indicador_and_item.flip`);
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
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
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
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
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
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
      }

      if (!stoveBelow) {
        if (stage !== 1) {
          state["ff:stage"] = 1;
          block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
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
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        panEntity.dimension.runCommand(`particle ff:pan_smoke ${block.location.x} ${block.location.y + 0.7} ${block.location.z}`);
        return;
      }
      if (panEntity && stage === 4) {
        state["ff:stage"] = 5;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        return;
      }
      if (panEntity && stage === 5) {
        state["ff:stage"] = 6;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        return;
      }

      if (panEntity && stage === 6) {
        state["ff:stage"] = 7;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        return;
      }
      

      if (panEntity && stage === 7) {
        state["ff:stage"] = 8;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
      
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
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        block.dimension.runCommand(`execute at @a positioned ${block.location.x} ${block.location.y} ${block.location.z} run playsound random.fizz @a[r=8] ${block.location.x} ${block.location.y} ${block.location.z} 0.9 0.4`);
        panEntity.dimension.runCommand(`particle ff:pan_warning2 ${block.location.x} ${block.location.y + 0.7} ${block.location.z}`);
        return;
      }
      if (panEntity && stage === 9) {
        state["ff:stage"] = 10;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
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
      if (state["block:lit"] === true && item?.typeId === "minecraft:water_bucket") {
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

      if (aboveBlock && aboveBlock.typeId === "ff:iron_pot") {
        const state = aboveBlock.permutation.getAllStates();
        if (state["ff:cooked"] == 1) {
          dim.runCommand(`particle ff:pan_smoke ${aboveBlock.location.x} ${aboveBlock.location.y + 0.1} ${aboveBlock.location.z}`);
          dim.runCommand(`particle ff:water_b ${aboveBlock.location.x} ${aboveBlock.location.y + 0.1} ${aboveBlock.location.z}`);
          dim.playSound("bubble.pop", block.location);
        }
      }
    }
  });


  

  result.blockComponentRegistry.registerCustomComponent("ff:pot_cooking", {
    onPlayerInteract: result => {
      const { block, player } = result;
      const state = block.permutation.getAllStates();
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const equippable = player.getComponent("minecraft:equippable");
      let item = equippable.getEquipment("Mainhand");
      const dim = block.dimension;
      const center = block.center();

      if (item && item.typeId === "minecraft:potion" && (state["ff:fully"] || 0) < 3) {
        state["ff:fully"] = (state["ff:fully"] || 0) + 1;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        
        if (item.amount > 1) {
          item.amount--;
          equippable.setEquipment("Mainhand", item);
          inv.addItem(new server.ItemStack("minecraft:glass_bottle", 1));
        } else {
          equippable.setEquipment("Mainhand", new server.ItemStack("minecraft:glass_bottle", 1));
        }
        dim.playSound("cauldron.fillwater", block.location);
        return;
      }

      if (item && item.typeId === "minecraft:sunflower" && !state["ff:has_sunflower"]) {
        state["ff:has_sunflower"] = true;
        state["ff:cooked"] = 1;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        const entity = dim.spawnEntity("ff:pan_bottom_left", {
          x: center.x, y: center.y - 0.3, z: center.z
        });
        entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 minecraft:sunflower 1`);
        if (item.amount > 1) {
          item.amount--;
          equippable.setEquipment("Mainhand", item);
        } else {
          equippable.setEquipment("Mainhand", undefined);
        }
        dim.playSound("mob.axolotl.idle_water", block.location);
        return;
      }

      if (item && item.typeId === "minecraft:glass_bottle" && state["ff:cooked"] === 2 && (state["ff:fully"] || 0) > 0) {
        state["ff:fully"]--;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        inv.addItem(new server.ItemStack("ff:vegetable_oil", 1));
        if (item.amount > 1) {
          item.amount--;
          equippable.setEquipment("Mainhand", item);
        } else {
          equippable.setEquipment("Mainhand", undefined);
        }
        dim.playSound("cauldron.takepotion", block.location);
        if (state["ff:fully"] === 0) {
          state["ff:has_sunflower"] = false;
          state["ff:cooked"] = 0;
          block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
          let entity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
          if (entity) entity.runCommand(`event entity @s ff:kill`);
        }
        return;
      }
    },
    onTick: result => {
      const { block } = result;
      const state = block.permutation.getAllStates();
      const dim = block.dimension;
      const center = block.center();

      const below = { x: block.location.x, y: block.location.y - 1, z: block.location.z };
      const belowBlock = dim.getBlock(below);
      const stoveLit = belowBlock && belowBlock.typeId === "ff:stove" && belowBlock.permutation.getAllStates()["block:lit"];

      state["ff:stove_below"] = stoveLit;
      block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));

      if (state["ff:has_sunflower"] && (state["ff:fully"] || 0) > 0 && stoveLit && state["ff:cooked"] === 0) {
        state["ff:cooked"] = 1;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        return;
      }
      if (state["ff:cooked"] === 1) {
        state["ff:cooked"] = 2;
        block.setPermutation(server.BlockPermutation.resolve(block.typeId, state));
        let entity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
        if (entity) {
          entity.runCommand(`event entity @s ff:kill`);
          dim.runCommand(`execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`);
          entity.runCommand(`event entity @s ff:despawn`);
          dim.runCommand(`execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`);
        }
      }
    },
    onDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let entity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
      if (entity) {
        entity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(`execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`);
        entity.runCommand(`event entity @s ff:despawn`);
        dim.runCommand(`execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`);
      }
    },
    onPlayerDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      let entity = dim.getEntitiesAtBlockLocation(center).find(e => e.typeId === "ff:pan_bottom_left");
      if (entity) {
        entity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(`execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`);
        entity.runCommand(`event entity @s ff:despawn`);
        dim.runCommand(`execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:despawn`);
      }
    }
  });
});

server.world.beforeEvents.worldInitialize.subscribe(result => {
  result.blockComponentRegistry.registerCustomComponent("ff:cutting_board", {
    onPlayerInteract: result => {
      const { block, player, face } = result;
      if (player.isSneaking || face !== "Up") return;

      const equippable = player.getComponent("minecraft:equippable");
      let item = equippable.getEquipment("Mainhand");
      const inv = player.getComponent(server.EntityInventoryComponent.componentId).container;
      const dim = block.dimension;
      const center = block.center();

      const mapping = {
        "minecraft:bread": ["ff:bread_slice", 2, 4],
        "minecraft:melon_block": ["minecraft:melon_slice", 4, 6],
        "minecraft:sugar_cane": ["minecraft:sugar", 2, 4]
       };
      const knifeTypes = [
        "ff:iron_knife",
        "ff:diamond_knife",
        "ff:netherite_knife",
        "ff:gold_knife"
      ];

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
        entity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
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
        entity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
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
        entity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
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
        entity.runCommand(`event entity @s ff:kill`);
        dim.runCommand(
          `execute positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[r=0.3] ff:kill`
        );
      }
    }
  });
});