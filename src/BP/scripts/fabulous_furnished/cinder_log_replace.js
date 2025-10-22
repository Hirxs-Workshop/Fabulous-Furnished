import { system, world } from "@minecraft/server";

const TICK_INTERVAL = 100;
const SCAN_RADIUS = 8;
const FIRE_COOLDOWN_TICKS = 60;
const LAYERS_PER_TICK = 4;
const FIRE_TTL_TICKS = 1200;
const CLEANUP_INTERVAL_TICKS = 600;

const seenFire = new Map();
const playerYProgress = new Map();
let lastCleanupTick = 0;
function forEachNeighbor(pos, cb) {
  cb({ x: pos.x + 1, y: pos.y, z: pos.z });
  cb({ x: pos.x - 1, y: pos.y, z: pos.z });
  cb({ x: pos.x, y: pos.y + 1, z: pos.z });
  cb({ x: pos.x, y: pos.y - 1, z: pos.z });
  cb({ x: pos.x, y: pos.y, z: pos.z + 1 });
  cb({ x: pos.x, y: pos.y, z: pos.z - 1 });
}

function tryReplaceBurningLogsNearFire(dim, firePos) {
  forEachNeighbor(firePos, (nPos) => {
    try {
      const block = dim.getBlock(nPos);
      if (!block) return;

      if (typeof block.typeId === "string" && block.typeId.includes("log")) {
        block.setType("ff:cinder_log");
        return;
      }

      if (block.typeId === "minecraft:fire") {
        const key = `${firePos.x},${firePos.y},${firePos.z}`;
        const firstSeen = seenFire.get(key) ?? 0;
        const age = system.currentTick - firstSeen;
        if (age < FIRE_COOLDOWN_TICKS) {
          block.setType("minecraft:air");
        }
      }
    } catch (_) {
    }
  });
}

function scanAroundPlayer(player) {
  const dim = player.dimension;
  const { x: px, y: py, z: pz } = player.location;

  const minX = Math.floor(px) - SCAN_RADIUS;
  const maxX = Math.floor(px) + SCAN_RADIUS;
  const minY = Math.max(0, Math.floor(py) - SCAN_RADIUS);
  const maxY = Math.min(319, Math.floor(py) + SCAN_RADIUS);
  const minZ = Math.floor(pz) - SCAN_RADIUS;
  const maxZ = Math.floor(pz) + SCAN_RADIUS;

  const totalY = maxY - minY + 1;
  if (totalY <= 0) return;
  const prog = playerYProgress.get(player.id) ?? 0;
  const startIndex = prog % totalY;
  const endIndex = Math.min(startIndex + LAYERS_PER_TICK - 1, totalY - 1);
  const startY = minY + startIndex;
  const endY = minY + endIndex;
  playerYProgress.set(player.id, (prog + LAYERS_PER_TICK) % totalY);

  for (let y = startY; y <= endY; y++) {
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        try {
          const block = dim.getBlock({ x, y, z });
          if (!block) continue;
          if (block.typeId === "minecraft:fire") {
            const key = `${x},${y},${z}`;
            if (!seenFire.has(key)) {
              seenFire.set(key, system.currentTick);
            }
            tryReplaceBurningLogsNearFire(dim, { x, y, z });
          }
        } catch (_) {
          // No errors
        }
      }
    }
  }
}

system.runInterval(() => {
  try {
    const players = world.getAllPlayers();
    for (const p of players) scanAroundPlayer(p);
    if (system.currentTick - lastCleanupTick >= CLEANUP_INTERVAL_TICKS) {
      lastCleanupTick = system.currentTick;
      for (const [key, firstSeen] of Array.from(seenFire.entries())) {
        if (system.currentTick - firstSeen > FIRE_TTL_TICKS) {
          seenFire.delete(key);
        }
      }
    }
  } catch (_) {
    // No errors #2
  }
}, TICK_INTERVAL);
