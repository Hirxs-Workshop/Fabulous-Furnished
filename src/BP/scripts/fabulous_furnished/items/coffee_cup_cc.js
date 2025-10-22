import { world, system, ItemStack } from "@minecraft/server";

const ITEM_ID = "ff:coffee_cup";
const EMPTY_ITEM_ID = "ff:empty_coffee_cup";
const PROJECTILE_ID = "ff:coffee_cup_entity";
const EMPTY_PROJECTILE_ID = "ff:empty_coffee_cup_entity";
const CUP_BLOCK_ID = "ff:empty_coffee_cup";
const pickupGuards = new Set();

function spawnCoffeeProjectile(player, entityId) {
  const dim = player.dimension;
  const eye = player.getHeadLocation();
  const dir = player.getViewDirection();
  const dist = 1.1;
  const spawnPos = {
    x: eye.x + dir.x * dist,
    y: eye.y + 0.1,
    z: eye.z + dir.z * dist,
  };
  system.run(() => {
    const ent = dim.spawnEntity(entityId, spawnPos);
    if (!ent) return;
    const speed = 1.4;
    const vel = {
      x: dir.x * speed,
      y: dir.y * speed,
      z: dir.z * speed,
    };
    try {
      ent.setVelocity(vel);
    } catch (_) {
      try { ent.applyImpulse(vel); } catch (_) {}
    }
  });
}

function applySaturationEffect(player) {
  try {
    return player.runCommandAsync("effect @s saturation 1 5 true");
  } catch (_) {
    try {
      return player.runCommandAsync("effect @s regeneration 2 1 true");
    } catch (_) {
    }
  }
}

function removeHeldItem(player) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  const slot = (typeof player.selectedSlotIndex === 'number') ? player.selectedSlotIndex : 0;
  inv.setItem(slot, undefined);
}

world.beforeEvents.itemUse.subscribe((ev) => {
  const { source: player, itemStack } = ev;
  if (!itemStack) return;

  if (!player?.isSneaking && itemStack.typeId === ITEM_ID) {
    system.run(() => {
      applySaturationEffect(player);
    });
    return;
  }

  if (!player?.isSneaking) return;

  let projectileId = undefined;
  if (itemStack.typeId === ITEM_ID) {
    projectileId = PROJECTILE_ID;
  } else if (itemStack.typeId === EMPTY_ITEM_ID) {
    projectileId = EMPTY_PROJECTILE_ID;
  } else {
    return;
  }

  ev.cancel = true;
  system.run(() => {
    spawnCoffeeProjectile(player, projectileId);
    removeHeldItem(player);
  });
});

function viewToCardinal(player) {
  const dir = player.getViewDirection();
  const ax = Math.abs(dir.x), az = Math.abs(dir.z);
  if (az >= ax) {
    return dir.z >= 0 ? "south" : "north";
  } else {
    return dir.x >= 0 ? "east" : "west";
  }
}

world.beforeEvents.itemUseOn.subscribe((ev) => {
  const { source: player, itemStack, block, blockFace } = ev;
  if (!player || !itemStack) return;
  if (itemStack.typeId !== ITEM_ID) return;

  const pos = { x: block.location.x, y: block.location.y, z: block.location.z };
  if (blockFace === "Up") pos.y += 1;
  else if (blockFace === "Down") pos.y -= 1;
  else if (blockFace === "North") pos.z -= 1;
  else if (blockFace === "South") pos.z += 1;
  else if (blockFace === "West") pos.x -= 1;
  else if (blockFace === "East") pos.x += 1;

  const dim = player.dimension;
  const placeBlock = dim.getBlock(pos);
  if (!placeBlock) return;

  if (placeBlock.typeId !== "minecraft:air") return;

  ev.cancel = true;
  system.run(() => {
    try {
      placeBlock.setType(CUP_BLOCK_ID);
      const current = placeBlock.permutation;
      const perm = current
        .withState("ff:has_coffee", true)
        .withState("minecraft:cardinal_direction", viewToCardinal(player));
      placeBlock.setPermutation(perm);
      removeHeldItem(player);
    } catch (_) {}
  });
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  const { player, block } = ev;
  if (!player || !block) return;
  if (block.typeId !== CUP_BLOCK_ID) return;

  const hasCoffee = block.permutation.getState("ff:has_coffee");

  if (player.isSneaking) {
    ev.cancel = true;
    const key = `${block.dimension.id}|${block.location.x},${block.location.y},${block.location.z}`;
    if (pickupGuards.has(key)) return;
    pickupGuards.add(key);
    system.run(() => {
      try {
        const giveId = hasCoffee ? ITEM_ID : EMPTY_ITEM_ID;
        const inv = player.getComponent("minecraft:inventory")?.container;
        if (inv) inv.addItem(new ItemStack(giveId, 1));
      } catch (_) {}
      try { block.setType("minecraft:air"); } catch (_) {}
    });
    system.runTimeout(() => pickupGuards.delete(key), 5);
    return;
  }

  if (hasCoffee) {
    ev.cancel = true;
    system.run(() => {
      applySaturationEffect(player);
      try {
        const perm = block.permutation.withState("ff:has_coffee", false);
        block.setPermutation(perm);
      } catch (_) {}
    });
  }
});
