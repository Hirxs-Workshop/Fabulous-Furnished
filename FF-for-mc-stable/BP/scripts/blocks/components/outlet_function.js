import { ItemStack } from '@minecraft/server';

export function registerOutletFunction(registry) {
  registry.registerCustomComponent('ff:outlet_function', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      const add_folk = block.permutation.withState("ff:outlet_function", 1);
      const remove_folk = block.permutation.withState("ff:outlet_function", 0);
      const givefolk = new ItemStack("ff:folk");
      if (!player.isSneaking && selectedItem && (selectedItem.typeId === 'ff:folk') && block.permutation.getState("ff:outlet_function") === 0) {
        block.setPermutation(add_folk);
        player.playSound("random.pop2");
        if (selectedItem.amount > 1) {
          selectedItem.amount -= 1;
          equipment.setEquipment('Mainhand', selectedItem);
        } else {
          equipment.setEquipment('Mainhand', undefined);
        }
        return;
      }
      if (!player.isSneaking && block.permutation.getState("ff:outlet_function") === 1) {
        block.dimension.spawnItem(givefolk, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
        block.setPermutation(remove_folk);
        player.playSound("random.pop");
        return;
      }
      if (!player.isSneaking && block.permutation.getState("ff:outlet_function") === 2) {
        block.dimension.runCommand(`title @p actionbar §6 It's too late...`);
        return;
      }
    },
    onTick: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const folk_explode = block.permutation.withState("ff:outlet_function", 2);
      const folk_explode2 = block.permutation.withState("ff:outlet_function", 3);
      if (block.permutation.getState("ff:outlet_function") === 1) {
        block.dimension.spawnParticle("ff:smoke_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
        block.setPermutation(folk_explode);
        return;
      }
      if (block.permutation.getState("ff:outlet_function") === 2) {
        block.dimension.spawnParticle("ff:elec_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
        block.dimension.spawnParticle("ff:smoke_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
        block.setPermutation(folk_explode2);
        return;
      }
      if (block.permutation.getState("ff:outlet_function") === 3) {
        block.dimension.runCommand(`summon ender_crystal ${x} ${y} ${z} 0 0 minecraft:crystal_explode`);
        block.dimension.runCommand(`setblock ${x} ${y} ${z} air`)
        block.dimension.spawnParticle("ff:elec_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
        block.dimension.spawnParticle("ff:smoke_folk", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
        return;
      }
    }
  });
} 