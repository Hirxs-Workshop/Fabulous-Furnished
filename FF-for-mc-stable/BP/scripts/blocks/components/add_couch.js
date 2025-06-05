import { GameMode } from '@minecraft/server';

const woodTypes = [
  'jungle','birch','crimson','warped',
  'cherry','mangrove','oak','dark_oak',
  'acacia','pale','spruce','cinder','spicewood', 'maple'
];

export function registerAddCouch(registry) {
  const chairDirections = ['north','south','east','west'];
  const stoolDirections = ['north','south','east','west','up'];

  woodTypes.forEach(type => {
    // Chair with wool
    registry.registerCustomComponent(
      `ff:${type}_add_couch`,
      {
        onPlayerInteract: e => {
          const { player, block } = e;
          const { x, y, z } = block.location;
          const equip = player.getComponent('equippable');
          const item = equip.getEquipment('Mainhand');
          if (player.isSneaking || !item || item.typeId !== 'ff:white_cushion') return;
          player.playSound('hit.cloth');
          block.dimension.spawnParticle('ff:cushion_effect', {
            x: x + 0.5,
            y: y + 0.5,
            z: z + 0.5
          });
          if (player.getGameMode() !== GameMode.creative) {
            if (item.amount > 1) {
              item.amount -= 1;
              equip.setEquipment('Mainhand', item);
            } else {
              equip.setEquipment('Mainhand', undefined);
            }
          }
          chairDirections.forEach(dir => {
            block.dimension.runCommand(
              `fill ${x} ${y} ${z} ${x} ${y} ${z}` +
              ` ff:wooden_${type}_chair_with_wool` +
              `["minecraft:cardinal_direction"="${dir}"]` +
              ` replace ff:wooden_${type}_chair` +
              `["minecraft:cardinal_direction"="${dir}"]`
            );
          });
        }
      }
    );
    // Stool with wool
    registry.registerCustomComponent(
      `ff:stool_${type}_add_couch`,
      {
        onPlayerInteract(e) {
          const { player, block } = e;
          if (player.isSneaking) return;
          const equip = player.getComponent('equippable');
          const item  = equip.getEquipment('Mainhand');
          if (!item || item.typeId !== 'ff:white_cushion') return;
          player.playSound('hit.cloth');
          block.dimension.spawnParticle('ff:cushion_effect', {
            x: block.location.x + 0.5,
            y: block.location.y + 0.5,
            z: block.location.z + 0.5
          });
          if (player.getGameMode() !== GameMode.creative) {
            if (item.amount > 1) {
              item.amount--;
              equip.setEquipment('Mainhand', item);
            } else {
              equip.setEquipment('Mainhand', undefined);
            }
          }
          const rotation  = block.permutation.getState('ff:block_rotation');
          const placement = block.permutation.getState('minecraft:block_face');
          const { x, y, z } = block.location;
          stoolDirections.forEach(dir => {
            block.dimension.runCommand(
              `fill ${x} ${y} ${z} ${x} ${y} ${z}` +
              ` ff:wooden_${type}_stool_with_wool[` +
                  `"ff:block_rotation"=${rotation},` +
                  `"minecraft:block_face"="${dir}"` +
              `] replace ff:wooden_${type}_stool[` +
                  `"ff:block_rotation"=${rotation},` +
                  `"minecraft:block_face"="${dir}"` +
              `]`
            );
          });
        }
      }
    );
  });
} 