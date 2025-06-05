import { system, ItemStack, world } from '@minecraft/server';

let lastInteraction = { player: null, block: null, time: 0 };

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { block, player } = event;
  const blockType = block.typeId;
  if (!['ff:cinder_log', 'ff:cinder_wood', 'ff:spicewood_log', 'ff:spicewood_wood', 'ff:maple_wood', 'ff:maple_log'].includes(blockType)) return;
  lastInteraction = {
    player,
    block: {
      x: block.location.x,
      y: block.location.y,
      z: block.location.z,
      face: event.face,
      blockState: block.permutation.getState("minecraft:block_face"),
      type: blockType
    },
    time: Date.now()
  };
});

system.runInterval(() => {
  if (!lastInteraction.player || !lastInteraction.block || Date.now() - lastInteraction.time > 100) return;
  const player = lastInteraction.player;
  const blockLoc = lastInteraction.block;
  const face = lastInteraction.block.face;
  const blockState = lastInteraction.block.blockState;
  const blockType = lastInteraction.block.type;
  const equipment = player.getComponent('equippable');
  const selectedItem = equipment.getEquipment('Mainhand');
  if (selectedItem?.hasTag('minecraft:is_axe')) {
    system.run(() => {
      let strippedType;
      switch(blockType) {
        case 'ff:cinder_log': strippedType = 'ff:stripped_cinder_log'; break;
        case 'ff:cinder_wood': strippedType = 'ff:stripped_cinder_wood'; break;
        case 'ff:spicewood_wood': strippedType = 'ff:stripped_spicewood_wood'; break;
        case 'ff:spicewood_log': strippedType = 'ff:stripped_spicewood_log'; break;
        case 'ff:maple_wood': strippedType = 'ff:stripped_maple_wood'; break;
        case 'ff:maple_log': strippedType = 'ff:stripped_maple_log'; break;
      }
      if (blockState) {
        player.dimension.runCommand(`setblock ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} ${strippedType} ["minecraft:block_face"="${blockState}"]`);
      } else {
        player.dimension.runCommand(`setblock ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} ${strippedType}`);
      }
      player.playSound('step.wood');
    });
  } else if (selectedItem && selectedItem.typeId !== blockType) {
    const allowedSuffixes = [
      '_log', '_wood', '_planks', '_leaves', '_sapling', '_slab', '_stairs', '_fence', '_door', '_trapdoor', '_button', '_pressure_plate', '_sign', '_wall', '_stripped'
    ];
    const isVanillaBlock = selectedItem.typeId.startsWith('minecraft:') && !selectedItem.typeId.includes('item');
    const isAllowed = allowedSuffixes.some(suf => selectedItem.typeId.endsWith(suf)) || isVanillaBlock;
    if (!isAllowed) return;
    let targetX = blockLoc.x, targetY = blockLoc.y, targetZ = blockLoc.z;
    switch (face) {
      case 'up': targetY++; break;
      case 'down': targetY--; break;
      case 'north': targetZ--; break;
      case 'south': targetZ++; break;
      case 'east': targetX++; break;
      case 'west': targetX--; break;
    }
    system.run(() => {
      const targetBlock = player.dimension.getBlock({ x: targetX, y: targetY, z: targetZ });
      if (targetBlock && targetBlock.typeId === 'minecraft:air') {
        player.dimension.runCommand(`setblock ${targetX} ${targetY} ${targetZ} ${selectedItem.typeId.replace('minecraft:', '')}`);
        if (player.getGameMode() !== "creative") {
          selectedItem.amount--;
          if (selectedItem.amount <= 0) {
            equipment.setEquipment('Mainhand', undefined);
          } else {
            equipment.setEquipment('Mainhand', selectedItem);
          }
        }
        player.playSound('use.wood');
      }
    });
  }
  lastInteraction = { player: null, block: null, time: 0 };
}, 1); 