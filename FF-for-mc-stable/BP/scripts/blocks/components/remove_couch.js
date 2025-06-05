import { ItemStack, GameMode } from '@minecraft/server';

const woodTypes = [
  'jungle','birch','crimson','warped',
  'cherry','mangrove','oak','dark_oak',
  'acacia','pale','spruce','cinder','spicewood', 'maple'
];

export function registerRemoveCouch(registry) {
  function register(componentId) {
    registry.registerCustomComponent(componentId, {
      onPlayerInteract(e) {
        const player = e.player;
        const block  = e.block;
        if (!player.isSneaking) return;
        if (player.gameMode !== GameMode.creative) {
          block.dimension.spawnItem(
            new ItemStack("ff:white_cushion", 1),
            { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 }
          );
        }
        const { x, y, z } = block.location;
        const rotation = block.permutation.getState("ff:block_rotation");
        const face = block.permutation.getState("minecraft:block_face");
        const newBlockType = block.typeId.replace("_with_wool", "");
        const baseCommand = `fill ${x} ${y} ${z} ${x} ${y} ${z} ${newBlockType} replace ${block.typeId}`;
        block.dimension.runCommand(baseCommand);
        const newBlock = block.dimension.getBlock({ x, y, z });
        if (!newBlock) return;
        try {
          if (rotation !== undefined) {
            newBlock.setPermutation(newBlock.permutation.withState("ff:block_rotation", rotation));
          }
          if (face !== undefined) {
            newBlock.setPermutation(newBlock.permutation.withState("minecraft:block_face", face));
          }
        } catch (error) {
          console.warn(`Error al aplicar estados: ${error}`);
        }
      },
      onPlayerDestroy(e) {
        const player = e.player;
        if (!player || player.getGameMode() === GameMode.creative) return;
        const destroyedPerm = e.destroyedBlockPermutation;
        if (!destroyedPerm) return;
        const oldId = destroyedPerm.type.id;
        const baseId = oldId.endsWith("_with_wool")
          ? oldId.replace("_with_wool", "")
          : oldId;
        const loc = {
          x: e.block.location.x + 0.5,
          y: e.block.location.y + 0.5,
          z: e.block.location.z + 0.5
        };
        e.dimension.spawnItem(new ItemStack(baseId, 1), loc);
        e.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), loc);
      }
    });
  }
  // Chairs
  for (const type of woodTypes) {
    register(`ff:${type}_remove_couch`);
  }
  // Stools
  for (const type of woodTypes) {
    register(`ff:stool_${type}_remove_couch`);
  }
} 