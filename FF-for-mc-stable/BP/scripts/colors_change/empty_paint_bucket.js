import { world, system, BlockPermutation, ItemStack } from '@minecraft/server'

function updateEquipment(equipment, selectedItem) {
  if (selectedItem.amount > 1) {
    selectedItem.amount -= 1;
    equipment.setEquipment('Mainhand', selectedItem);
  } else {
    equipment.setEquipment('Mainhand', undefined);
  }
}

function handleAddDyeColor(player, block) {
  const equipment = player.getComponent('equippable');
  const selectedItem = equipment.getEquipment('Mainhand');
  if (!selectedItem) return false;
  const allowedDirections = ["north", "south", "west", "east"];
  const direction = block.permutation.getState("minecraft:cardinal_direction");
  if (!allowedDirections.includes(direction)) return false;
  const { x, y, z } = block.location;
  const dyeMapping = {
    'minecraft:white_dye': 'ff:paint_bucket_white',
    'minecraft:orange_dye': 'ff:paint_bucket_orange',
    'minecraft:magenta_dye': 'ff:paint_bucket_magenta',
    'minecraft:light_blue_dye': 'ff:paint_bucket_light_blue',
    'minecraft:yellow_dye': 'ff:paint_bucket_yellow',
    'minecraft:lime_dye': 'ff:paint_bucket_lime',
    'minecraft:pink_dye': 'ff:paint_bucket_pink',
    'minecraft:gray_dye': 'ff:paint_bucket_gray',
    'minecraft:light_gray_dye': 'ff:paint_bucket_light_gray',
    'minecraft:cyan_dye': 'ff:paint_bucket_cyan',
    'minecraft:purple_dye': 'ff:paint_bucket_purple',
    'minecraft:blue_dye': 'ff:paint_bucket_blue',
    'minecraft:brown_dye': 'ff:paint_bucket_brown',
    'minecraft:green_dye': 'ff:paint_bucket_green',
    'minecraft:red_dye': 'ff:paint_bucket_red',
    'minecraft:black_dye': 'ff:paint_bucket_black'
  };
  const paintBucket = dyeMapping[selectedItem.typeId];
  if (!paintBucket) return false;
  block.dimension.runCommand(`setblock ${x} ${y} ${z} ${paintBucket}["minecraft:cardinal_direction"="${direction}"]`);
  player.playSound("bucket.fill_water");
  updateEquipment(equipment, selectedItem);
  return true;
}

function handleBucketFunction(e, lootId, particleName, dyeItem, paintBucketEmpty, paintBucketColor) {
  const { player, block } = e;
  const { x, y, z } = block.location;
  const equipment = player.getComponent('equippable');
  const selectedItem = equipment.getEquipment('Mainhand');
  const uses = block.permutation.getState("ff:uses");
  const newPermutation = block.permutation.withState("ff:uses", uses + 1);
  if (selectedItem && selectedItem.typeId === 'ef:brush_empty') {
    if (uses < 8) {
      block.setPermutation(newPermutation);
      block.dimension.runCommand(`loot spawn ${x} ${y} ${z} loot ${lootId}`);
      player.playSound("bucket.fill_water");
      block.dimension.spawnParticle(particleName, { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
      updateEquipment(equipment, selectedItem);
      return;
    }
    if (uses === 8) {
      block.dimension.spawnParticle(particleName, { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
      block.setPermutation(newPermutation);
      updateEquipment(equipment, selectedItem);
      player.playSound("bucket.fill_water");
      block.dimension.runCommand(`loot spawn ${x} ${y} ${z} loot ${lootId}`);
      ["north", "south", "west", "east"].forEach(dir => {
        block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ${paintBucketEmpty}["minecraft:cardinal_direction"="${dir}"] replace ${paintBucketColor}["minecraft:cardinal_direction"="${dir}"]`);
      });
      return;
    }
  }
  if (player.isSneaking && uses === 1) {
    block.dimension.spawnParticle(particleName, { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
    player.playSound("bucket.fill_water");
    block.dimension.spawnItem(new ItemStack(dyeItem), { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
    ["north", "south", "west", "east"].forEach(dir => {
      block.dimension.runCommand(`fill ${x} ${y} ${z} ${x} ${y} ${z} ${paintBucketEmpty}["minecraft:cardinal_direction"="${dir}"] replace ${paintBucketColor}["minecraft:cardinal_direction"="${dir}"]`);
    });
  }
}

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.blockComponentRegistry.registerCustomComponent('ff:add_dye_color', {
    onPlayerInteract: e => {
      if (handleAddDyeColor(e.player, e.block)) return;
    }
  });
});

const bucketFunctions = [
  {
    component: 'ff:white_bucket_function',
    lootId: 'brush_with_paint_white',
    particleName: 'ff:paint_drip_white',
    dyeItem: 'minecraft:white_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_white'
  },
  {
    component: 'ff:orange_bucket_function',
    lootId: 'brush_with_paint_orange',
    particleName: 'ff:paint_drip_orange',
    dyeItem: 'minecraft:orange_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_orange'
  },
  {
    component: 'ff:magenta_bucket_function',
    lootId: 'brush_with_paint_magenta',
    particleName: 'ff:paint_drip_magenta',
    dyeItem: 'minecraft:magenta_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_magenta'
  },
  {
    component: 'ff:light_blue_bucket_function',
    lootId: 'brush_with_paint_light_blue',
    particleName: 'ff:paint_drip_light_blue',
    dyeItem: 'minecraft:light_blue_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_light_blue'
  },
  {
    component: 'ff:yellow_bucket_function',
    lootId: 'brush_with_paint_yellow',
    particleName: 'ff:paint_drip_yellow',
    dyeItem: 'minecraft:yellow_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_yellow'
  },
  {
    component: 'ff:lime_bucket_function',
    lootId: 'brush_with_paint_lime',
    particleName: 'ff:paint_drip_lime',
    dyeItem: 'minecraft:lime_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_lime'
  },
  {
    component: 'ff:pink_bucket_function',
    lootId: 'brush_with_paint_pink',
    particleName: 'ff:paint_drip_pink',
    dyeItem: 'minecraft:pink_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_pink'
  },
  {
    component: 'ff:gray_bucket_function',
    lootId: 'brush_with_paint_gray',
    particleName: 'ff:paint_drip_gray',
    dyeItem: 'minecraft:gray_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_gray'
  },
  {
    component: 'ff:light_gray_bucket_function',
    lootId: 'brush_with_paint_light_gray',
    particleName: 'ff:paint_drip_light_gray',
    dyeItem: 'minecraft:light_gray_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_light_gray'
  },
  {
    component: 'ff:cyan_bucket_function',
    lootId: 'brush_with_paint_cyan',
    particleName: 'ff:paint_drip_cyan',
    dyeItem: 'minecraft:cyan_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_cyan'
  },
  {
    component: 'ff:purple_bucket_function',
    lootId: 'brush_with_paint_purple',
    particleName: 'ff:paint_drip_purple',
    dyeItem: 'minecraft:purple_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_purple'
  },
  {
    component: 'ff:blue_bucket_function',
    lootId: 'brush_with_paint_blue',
    particleName: 'ff:paint_drip_blue',
    dyeItem: 'minecraft:blue_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_blue'
  },
  {
    component: 'ff:brown_bucket_function',
    lootId: 'brush_with_paint_brown',
    particleName: 'ff:paint_drip_brown',
    dyeItem: 'minecraft:brown_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_brown'
  },
  {
    component: 'ff:green_bucket_function',
    lootId: 'brush_with_paint_green',
    particleName: 'ff:paint_drip_green',
    dyeItem: 'minecraft:green_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_green'
  },
  {
    component: 'ff:red_bucket_function',
    lootId: 'brush_with_paint_red',
    particleName: 'ff:paint_drip_red',
    dyeItem: 'minecraft:red_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_red'
  },
  {
    component: 'ff:black_bucket_function',
    lootId: 'brush_with_paint_black',
    particleName: 'ff:paint_drip_black',
    dyeItem: 'minecraft:black_dye',
    paintBucketEmpty: 'ff:paint_bucket_empty',
    paintBucketColor: 'ff:paint_bucket_black'
  }
];

bucketFunctions.forEach(({ component, lootId, particleName, dyeItem, paintBucketEmpty, paintBucketColor }) => {
  system.beforeEvents.startup.subscribe(initEvent => {
    initEvent.blockComponentRegistry.registerCustomComponent(component, {
      onPlayerInteract: e => {
        handleBucketFunction(e, lootId, particleName, dyeItem, paintBucketEmpty, paintBucketColor);
      }
    });
  });
});
