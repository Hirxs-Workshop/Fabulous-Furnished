import * as server from "@minecraft/server";
import { updateBlock } from "../../utils/block";
import { consumeEquipped, giveOrDrop, ItemStack } from "../../utils/item";

const _coffeeParticleIntervals = new Map();

function _keyForBlock(block) {
  const d = block?.dimension?.id ?? "";
  const l = block?.location;
  return `${d}:${l?.x},${l?.y},${l?.z}`;
}

function _stopParticles(block) {
  try {
    const key = _keyForBlock(block);
    const handle = _coffeeParticleIntervals.get(key);
    if (handle !== undefined) {
      server.system.clearRun(handle);
      _coffeeParticleIntervals.delete(key);
    }
  } catch {}
}

function _startParticles(block) {
  try {
    const key = _keyForBlock(block);
    if (_coffeeParticleIntervals.has(key)) return;

    const handle = server.system.runInterval(() => {
      try {
        const dim = block.dimension;
        const state = block.permutation.getAllStates();
        const hasJar = !!state["ff:has_jar"];
        const stage = state["ff:stage"] ?? 0;
        const hasCoffee = !!state["ff:has_coffee"]; 
        if (!hasJar || (stage === 0 && !hasCoffee)) {
          _stopParticles(block);
          return;
        }

        const c = block.center();
        const dir = state["minecraft:cardinal_direction"] ?? "south";
        let ox = 0, oz = 0;
        if (dir === "north") { oz = 0.1; }
        else if (dir === "south") { oz = -0.1; }
        else if (dir === "east") { ox = -0.1; }
        else if (dir === "west") { ox = 0.1; }
        const loc = { x: c.x + ox, y: c.y + 0.1, z: c.z + oz };
        dim.spawnParticle("ff:coffee_drop", loc);
        try { dim.playSound("cauldron_drip.water.pointed_dripstone", loc); } catch {}
      } catch {
        _stopParticles(block);
      }
    }, 20); 

    _coffeeParticleIntervals.set(key, handle);
  } catch {}
}

server.world.beforeEvents.worldInitialize.subscribe(init => {
  init.blockComponentRegistry.registerCustomComponent("ff:coffee_cc", {
    onPlayerInteract(event) {
      const { block, player } = event;
      if (!block || !player) return;

      const state = block.permutation.getAllStates();
      const eq = player.getComponent("minecraft:equippable");
      const hand = eq?.getEquipment("Mainhand");
      const dim = block.dimension;

      const hasJar = !!state["ff:has_jar"];
      const stage = state["ff:stage"] ?? 0;
      const hasCoffee = !!state["ff:has_coffee"];

      if (player.isSneaking && hasJar) {
        const giveFilled = (state["ff:stage"] === 5) && !!state["ff:has_coffee"];
        updateBlock(block, { "ff:has_jar": false, "ff:has_coffee": false, "ff:stage": 0 });
        try { dim.playSound("step.decorated_pot", block.location); } catch {}
        try {
          const id = giveFilled ? "ff:coffee_glass_jar" : "ff:empty_coffee_glass_jar";
          dim.spawnItem(new ItemStack(id, 1), block.center());
        } catch {}
        _stopParticles(block);
        return;
      }

      if (!player.isSneaking && hand?.typeId === "ff:empty_coffee_glass_jar" && !hasJar && stage === 0) {
        updateBlock(block, { "ff:has_jar": true });
        consumeEquipped(eq, hand);
        try { dim.playSound("step.decorated_pot", block.location); } catch {}
        return;
      }

      if (!player.isSneaking && hand?.typeId === "minecraft:cocoa_beans" && hasJar && stage === 0) {
        updateBlock(block, { "ff:stage": 1 });
        consumeEquipped(eq, hand);
        try { dim.playSound("mob.axolotl.idle_water", block.location); } catch {}
        _startParticles(block);
        return;
      }

      if (!player.isSneaking && hand?.typeId === "ff:empty_coffee_cup" && hasCoffee && hasJar) {
        try {
          giveOrDrop(player, new ItemStack("ff:coffee_cup", 1), block);
        } catch {}
        consumeEquipped(eq, hand);
        updateBlock(block, { "ff:has_coffee": false, "ff:stage": 0 });
        try { dim.playSound("step.decorated_pot", block.location); } catch {}
        _stopParticles(block);
        return;
      }
    },

    onTick(event) {
      const { block } = event;
      if (!block) return;
      const state = block.permutation.getAllStates();
      const hasJar = !!state["ff:has_jar"];
      let stage = state["ff:stage"] ?? 0;
      let hasCoffee = !!state["ff:has_coffee"];

      if (hasJar && stage >= 1 && stage < 5) {
        stage += 1;
        updateBlock(block, { "ff:stage": stage });
        return;
      }

      if (hasJar && stage === 5 && !hasCoffee) {
        hasCoffee = true;
        updateBlock(block, { "ff:has_coffee": true });
        return;
      }

      try {
        const key = _keyForBlock(block);
        const running = _coffeeParticleIntervals.has(key);
        if (hasJar && (stage >= 1 || hasCoffee)) {
          if (!running) _startParticles(block);
        } else if (running && stage === 0 && !hasCoffee) {
          _stopParticles(block);
        }
      } catch {}
    }
  });
});
