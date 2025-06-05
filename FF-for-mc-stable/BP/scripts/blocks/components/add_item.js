import { ItemStack, system } from '@minecraft/server';

export function registerAddItem(registry) {
  registry.registerCustomComponent("ff:add_item", {
    onPlayerInteract: result => {
      const { block, player, face } = result;
      if (player.isSneaking || face !== "Up") return;
      const equippable = player.getComponent("minecraft:equippable");
      let item = equippable.getEquipment("Mainhand");
      const inv = player.getComponent("minecraft:inventory").container;
      const dim = block.dimension;
      const center = block.center();
      let entity = dim.getEntitiesAtBlockLocation(center)
        .find(e => e.typeId === "ff:pan_bottom_left");
      if (!entity && item) {
        system.run(() => {
          let checkEntity = dim.getEntitiesAtBlockLocation(center)
            .find(e => e.typeId === "ff:pan_bottom_left");
          if (!checkEntity) {
            let newEntity = dim.spawnEntity("ff:pan_bottom_left", {
              x: center.x, y: center.y - 0.5, z: center.z
            });
            newEntity.addTag(item.typeId);
            newEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1`);
            const slot = player.selectedSlotIndex;
            if (item.amount > 1) {
              item.amount--;
              inv.setItem(slot, item);
            } else {
              inv.setItem(slot, undefined);
            }
            player.playSound("random.pop");
          }
        });
        return;
      }
      if (entity && !item) {
        const tags = entity.getTags();
        if (tags.length > 0) {
          const itemId = tags[0];
          inv.addItem(new ItemStack(itemId, 1));
          entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 air`);
          entity.removeTag(itemId);
          player.playSound("random.pop2");
        }
        entity.triggerEvent("ff:despawn");
        dim.runCommand(
          `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
        );
        return;
      }
    },
    onPlayerDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      dim.runCommand(
        `execute at @e[type=ff:pan_bottom_left] positioned ${center.x} ${center.y} ${center.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
      );
    },
    onDestroy: result => {
      const { block } = result;
      const dim = block.dimension;
      const center = block.center();
      dim.runCommand(
        `execute at @e[type=ff:pan_bottom_left] positioned ${center.x} ${center.y} ${center.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
      );
    }
  });
} 