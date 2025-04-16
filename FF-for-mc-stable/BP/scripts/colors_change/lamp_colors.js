import { world, system, BlockPermutation, ItemStack } from '@minecraft/server'

function updateLampOn(block, player) {
  const { x, y, z } = block.location;
  block.dimension.runCommand(`execute at @e[type=ff:ff_light_ray_small] positioned ${x} ${y} ${z} run event entity @e[r=0.5] destroy`);
  const color = block.permutation.getState("ef:colors");
  const direction = block.permutation.getState("minecraft:cardinal_direction");
  if (!["north", "south", "west", "east"].includes(direction)) return;
  if (color < 0 || color > 15) return;
  block.dimension.runCommand(`setblock ${x} ${y} ${z} ff:small_lamp["minecraft:cardinal_direction"="${direction}","ef:colors"=${color}]`);
  player.playSound("ff:lamp_on");
}

function updateLampOff(block, player) {
  const { x, y, z } = block.location;
  const color = block.permutation.getState("ef:colors");
  const direction = block.permutation.getState("minecraft:cardinal_direction");
  if (!["north", "south", "west", "east"].includes(direction)) return;
  if (color < 0 || color > 15) return;
  if (color === 0) {
    block.dimension.runCommand(`summon ff:ff_light_ray_small ${x} ${y} ${z}`);
  }
  block.dimension.runCommand(`setblock ${x} ${y} ${z} ff:small_lamp_on["minecraft:cardinal_direction"="${direction}","ef:colors"=${color}]`);
  player.playSound("ff:lamp_on");
}

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.blockComponentRegistry.registerCustomComponent('ff:lamp_function_on', {
    onPlayerInteract: e => {
      const { player, block } = e;
      updateLampOn(block, player);
    },
    onTick: e => {
      const { block } = e;
      block.dimension.spawnParticle("ff:ff_light_ray_small", { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 });
    }
  });
});

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.blockComponentRegistry.registerCustomComponent('ff:lamp_function_off', {
    onPlayerInteract: e => {
      const { player, block } = e;
      updateLampOff(block, player);
    }
  });
});
