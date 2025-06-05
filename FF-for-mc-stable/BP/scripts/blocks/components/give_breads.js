import { ItemStack } from '@minecraft/server';

export function registerGiveBreads(registry) {
  registry.registerCustomComponent('ff:give_breads', {
    onPlayerInteract: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const execute_toaster1 = block.permutation.withState("ff:toaster_with_breads", 3);
      const execute_toaster2 = block.permutation.withState("ff:toaster_with_breads", 4);
      if (player.isSneaking && block.permutation.getState("ff:toaster_with_breads") === 1) {
        block.setPermutation(execute_toaster1);
        player.playSound("hit.netherite");
      }
      if (player.isSneaking && block.permutation.getState("ff:toaster_with_breads") === 2) {
        block.setPermutation(execute_toaster2);
        player.playSound("hit.netherite");
      }
    },
    onTick: e => {
      const { player, block } = e;
      const { x, y, z } = block.location;
      const breadtoastedGive = new ItemStack("ff:bread_slice_toasted");
      const breadtoastedGive2 = new ItemStack("ff:bread_slice_toasted");
      const finish_execute_toaster1 = block.permutation.withState("ff:toaster_with_breads", 0);
      const finish_execute_toaster2 = block.permutation.withState("ff:toaster_with_breads", 0);
      if (block.permutation.getState("ff:toaster_with_breads") === 3) {
        block.setPermutation(finish_execute_toaster1);
        block.dimension.runCommand(`playsound ff:toast_finish @p`);
        block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
      }
      if (block.permutation.getState("ff:toaster_with_breads") === 4) {
        block.setPermutation(finish_execute_toaster2);
        block.dimension.runCommand(`playsound ff:toast_finish @p`);
        block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
        block.dimension.spawnItem(breadtoastedGive2, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
      }
      if (Math.random() < 0.09 && block.permutation.getState("ff:toaster_with_breads") === 3) {
        block.dimension.runCommand(
          `particle ff:pan_smoke ${x} ${y + 0.1} ${z}`
        );
      }
      if (Math.random() < 0.09 && block.permutation.getState("ff:toaster_with_breads") === 4) {
        block.dimension.runCommand(
          `particle ff:pan_smoke ${x} ${y + 0.1} ${z}`
        );
      }
    },
  });
} 