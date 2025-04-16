import { world, system, BlockPermutation, ItemStack } from '@minecraft/server'

function updateLargeLampOn(block, player) {
  const { x, y, z } = block.location;
  block.dimension.runCommand(`execute at @e[type=ff:ff_light_ray] positioned ${x} ${y} ${z} run event entity @e[r=0.5] destroy`);
  const color = block.permutation.getState("ef:colors");
  const direction = block.permutation.getState("minecraft:cardinal_direction");
  if (!["north", "south", "west", "east"].includes(direction)) return;
  if (color < 0 || color > 15) return;
  block.dimension.runCommand(`setblock ${x} ${y} ${z} ff:large_lamp["minecraft:cardinal_direction"="${direction}","ef:colors"=${color}]`);
  player.playSound("ff:lamp_on");
}

function updateLargeLampOff(block, player) {
    const { x, y, z } = block.location;
    const color = block.permutation.getState("ef:colors");
    const direction = block.permutation.getState("minecraft:cardinal_direction");
    if (!["north", "south", "west", "east"].includes(direction)) return;
    if (color < 0 || color > 15) return;
    block.dimension.runCommand(`summon ff:ff_light_ray ${x} ${y} ${z}`);
    block.dimension.runCommand(`setblock ${x} ${y} ${z} ff:large_lamp_on["minecraft:cardinal_direction"="${direction}","ef:colors"=${color}]`);
    player.playSound("ff:lamp_on");
  }
  

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.blockComponentRegistry.registerCustomComponent('ff:large_lamp_function_on', {
    onPlayerInteract: e => {
      const { player, block } = e;
      updateLargeLampOn(block, player);
    },
    onTick: e => {
      const { block } = e;
      block.dimension.spawnParticle("ff:ff_light_ray", {
        x: block.location.x + 0.5,
        y: block.location.y + 1.1,
        z: block.location.z + 0.5
      });
    }
  });
});

system.beforeEvents.startup.subscribe(initEvent => {
  initEvent.blockComponentRegistry.registerCustomComponent('ff:large_lamp_function_off', {
    onPlayerInteract: e => {
      const { player, block } = e;
      updateLargeLampOff(block, player);
    }
  });
});
