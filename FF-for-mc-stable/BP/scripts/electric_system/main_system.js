import { world, system, BlockPermutation } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  getLinePoints,
  turnOffLight
} from "./utils.js";
import {
  LIGHT_TYPES,
  SWITCH_TYPES,
  LIGHT_ALIASES,
  SWITCH_ALIASES,
  CONNECTIONS_KEY
} from "./connection_types.js";

let selections = {};
const animStates = new Map();
let isInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;

function getConnections() {
  const json = world.getDynamicProperty(CONNECTIONS_KEY);
  return json ? JSON.parse(json) : [];
}

function setConnections(connections) {
  world.setDynamicProperty(CONNECTIONS_KEY, JSON.stringify(connections));
}

function connectionKey(conn) {
  return `${conn.switch.dimensionId}:${conn.switch.x},${conn.switch.y},${conn.switch.z}` +
         `->${conn.light.dimensionId}:${conn.light.x},${conn.light.y},${conn.light.z}`;
}

function forceBlockOff(dimension, blockPos, blockType) {
  const block = dimension.getBlock(blockPos);
  if (!block) return;

  const permutation = block.permutation;
  
  let newPermutation;
  if (blockType.includes("tv")) {
    newPermutation = BlockPermutation.resolve(blockType, { "ff:channels": 0 });
  } else {
    newPermutation = BlockPermutation.resolve(blockType, { "ff:lamp_state": false });
  }

  try {
    block.setPermutation(newPermutation);
  } catch (error) {
    try {
      const blockData = {
        x: blockPos.x,
        y: blockPos.y,
        z: blockPos.z
      };
      dimension.runCommand(`setblock ${blockData.x} ${blockData.y} ${blockData.z} air`);
      dimension.runCommand(`setblock ${blockData.x} ${blockData.y} ${blockData.z} ${blockType} ${blockType.includes("tv") ? '["ff:channels":0]' : '["ff:lamp_state":false]'}`);
    } catch (e) {
      console.warn("Failed to set block state:", e);
    }
  }
}

function disconnectSingleConnection(player, connection) {
  let connections = getConnections();
  const index = connections.findIndex(
    (conn) => connectionKey(conn) === connectionKey(connection)
  );
  if (index === -1) return;

  connections.splice(index, 1);
  setConnections(connections);

  const dimLt = world.getDimension(connection.light.dimensionId);
  const lt = dimLt.getBlock(connection.light);
  if (lt) {
    forceBlockOff(dimLt, connection.light, lt.typeId);

    const name = lt.typeId.split(":")[1];
    const isFan = name.startsWith("wooden_ceiling_fan_") || name.includes("_ceiling_fan_");
    const entityType = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";
    const cx = connection.light.x + 0.5;
    const cy = connection.light.y;
    const cz = connection.light.z + 0.5;
    lt.dimension.runCommand(
      `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=${entityType},r=1] destroy`
    );
  }

  animStates.delete(connectionKey(connection));

  world
    .getDimension(player.dimension.id)
    .runCommand(`tellraw "${player.name}" {"rawtext":[{"text":"§cBlock disconnected"}]}`);
}

function disconnectConnections(player, connectionsToDisconnect) {
  let connections = getConnections();

  connectionsToDisconnect.forEach((conn) => {
    const dimLt = world.getDimension(conn.light.dimensionId);
    const lt = dimLt.getBlock(conn.light);
    if (lt) {
      forceBlockOff(dimLt, conn.light, lt.typeId);

      const name = lt.typeId.split(":")[1];
      const isFan = name.startsWith("wooden_ceiling_fan_") || name.includes("_ceiling_fan_");
      const entityType = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";
      const cx = conn.light.x + 0.5;
      const cy = conn.light.y;
      const cz = conn.light.z + 0.5;
      dimLt.runCommand(
        `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=${entityType},r=1] destroy`
      );
    }
    animStates.delete(connectionKey(conn));
  });

  connections = connections.filter(
    (conn) =>
      !connectionsToDisconnect.some(
        (disconn) => connectionKey(disconn) === connectionKey(conn)
      )
  );
  setConnections(connections);
}

function showDisconnectSubmenu(player, connection) {
  const form = new ActionFormData()
    .title("Connection")
    .body(
      `Light: (${connection.light.x}, ${connection.light.y}, ${connection.light.z})\n` +
      `Switch: (${connection.switch.x}, ${connection.switch.y}, ${connection.switch.z})\n` +
      "Disconnect this connection?"
    )
    .button("Disconnect")
    .button("Back");
  form.show(player).then((response) => {
    if (response.selection === 0) {
      disconnectSingleConnection(player, connection);
    }
  });
}

function showSwitchConnectionsMenu(player) {
  const conns = getConnections().filter(conn => {
    const light = world.getDimension(conn.light.dimensionId).getBlock(conn.light);
    return light && LIGHT_TYPES.has(light.typeId);
  });

  if (conns.length === 0) {
    world
      .getDimension(player.dimension.id)
      .runCommand(
        `tellraw "${player.name}" {"rawtext":[{"text":" §pYou need to connect a block first!"}]}`
      );
    return;
  }

  const form = new ActionFormData()
    .title("Current connections")
    .body("Select a light to disconnect");

  conns.forEach((conn) => {
    const light = world.getDimension(conn.light.dimensionId).getBlock(conn.light);
    const alias = LIGHT_ALIASES[light.typeId] || "Light";
    const id    = light.typeId.split(":")[1];
    const icon  = `textures/ff_ui/icons/${id}`;
    form.button(alias, icon);
  });

  form.button("Disconnect all");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) return;

    if (response.selection < conns.length) {
      showDisconnectSubmenu(player, conns[response.selection]);
    } else {
      disconnectConnections(player, conns);
    }
  });
}

function showTestLightMenu(player, blockPos) {
  const connection = getConnections().find(
    (conn) =>
      conn.light.x === blockPos.x &&
      conn.light.y === blockPos.y &&
      conn.light.z === blockPos.z &&
      conn.light.dimensionId === blockPos.dimensionId
  );
  if (!connection) return;
  const form = new ActionFormData()
    .title("Block settings")
    .body("Options for this block:")
    .button("Disconnect")
    .button("Back");
  form.show(player).then((response) => {
    if (response.selection === 0) {
      disconnectSingleConnection(player, connection);
    }
  });
}

function showGlobalMenu(player) {
  const form = new ActionFormData()
    .title("Global Functions")
    .body("Select a global action:")
    .button("Disconnect all connections")
    .button("Cancel");
  form.show(player).then((response) => {
    if (response.selection === 0) {
      const all = getConnections();
      all.forEach(conn => {
        turnOffLight(conn, LIGHT_TYPES);
        animStates.delete(connectionKey(conn));
      });
      setConnections([]);
    }
  });
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const player = event.player;
  const block = event.block;
  const blockPos = {
    dimensionId: block.dimension.id,
    x: block.x,
    y: block.y,
    z: block.z
  };
  const item = event.itemStack;

  if (player.isSneaking && SWITCH_TYPES.has(block.typeId)) {
    showSwitchConnectionsMenu(player);
    return;
  }

  if (item && item.typeId === "ff:wrench") {
    const category = (() => {
      if (LIGHT_TYPES.has(block.typeId)) return "light";
      if (SWITCH_TYPES.has(block.typeId)) return "switch";
      return null;
    })();

    if (category === "switch") {
      selections[player.id] = { pos: blockPos, category };
      const dim = world.getDimension(blockPos.dimensionId);
      const start = {
        x: blockPos.x + 0.5,
        y: blockPos.y + 0.5,
        z: blockPos.z + 0.5
      };
      const view = player.getBlockFromViewDirection({ maxDistance: 7.5 });
      if (view && view.block) {
        const end = {
          x: view.block.x + 0.5,
          y: view.block.y + 0.5,
          z: view.block.z + 0.5
        };
        const pts = getLinePoints(start, end, 20);
        for (const p of pts) {
          dim.spawnParticle("ff:unused", {
            x: p.x,
            y: p.y,
            z: p.z
          });
        }
      }
      return;
    }

    if (category === "light" && selections[player.id]?.category === "switch") {
      const source = selections[player.id].pos;
      const dx = blockPos.x - source.x;
      const dy = blockPos.y - source.y;
      const dz = blockPos.z - source.z;
      if (Math.hypot(dx, dy, dz) > 64) return;

      const connections = getConnections();
      const lightTaken = connections.some(c =>
        c.light.dimensionId === blockPos.dimensionId &&
        c.light.x === blockPos.x &&
        c.light.y === blockPos.y &&
        c.light.z === blockPos.z
      );
      if (lightTaken) {
        world
          .getDimension(blockPos.dimensionId)
          .runCommand(
            `tellraw "${player.name}" {"rawtext":[{"text":"This block is already connected"}]}`
          );
        return;
      }

      const newConn = { switch: source, light: blockPos };
      connections.push(newConn);
      setConnections(connections);
      animStates.delete(connectionKey(newConn));

      const swBlock = world
        .getDimension(source.dimensionId)
        .getBlock(source);
      const isActive =
        SWITCH_TYPES.has(swBlock.typeId) &&
        swBlock.permutation.getState("ff:switch_type") === true;

      const lightBlock = world
        .getDimension(blockPos.dimensionId)
        .getBlock(blockPos);
      if (lightBlock && LIGHT_TYPES.has(lightBlock.typeId)) {
        const channelsVal = lightBlock.permutation.getState("ff:channels");
        const newState = channelsVal !== undefined
          ? { "ff:channels": isActive ? 1 : 0 }
          : { "ff:lamp_state": isActive };
        lightBlock.setPermutation(
          BlockPermutation.resolve(lightBlock.typeId, newState)
        );

        if (isActive) {
          const name = lightBlock.typeId.split(":")[1];
          if (
            name.startsWith("ceiling_light_") ||
            name.startsWith("wooden_ceiling_fan_")
          ) {
            const isFan = name.includes("fan");
            const entityType = isFan
              ? "ff:ff_ceiling_fan"
              : "ff:ff_ceiling_light";
            const cx = blockPos.x + 0.5;
            const cy = blockPos.y;
            const cz = blockPos.z + 0.5;
            lightBlock.dimension.runCommand(
              `summon ${entityType} ${cx} ${cy} ${cz}`
            );
          }
        }
      }

      world
        .getDimension(blockPos.dimensionId)
        .runCommand(
          `tellraw "${player.name}" {"rawtext":[{"text":" §qConnection established"}]}`
        );
      return;
    }
  }

  if (LIGHT_TYPES.has(block.typeId) && item?.typeId !== "ff:wrench") {
    const exists = getConnections().some(c =>
      c.light.dimensionId === blockPos.dimensionId &&
      c.light.x === blockPos.x &&
      c.light.y === blockPos.y &&
      c.light.z === blockPos.z
    );
    const dimChat = world.getDimension(blockPos.dimensionId);
    if (!exists) {
      dimChat.runCommand(
        `tellraw "${player.name}" {"rawtext":[{"text":" §pThis block needs energy!\n\n§9Tip: Connect the block to a switch using the wrench item"}]}`
      );
      return;
    }
    showTestLightMenu(player, blockPos);
  }
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const block = event.block;
  const player = event.player;
  const blockPos = {
    dimensionId: block.dimension.id,
    x: block.x,
    y: block.y,
    z: block.z
  };

  if (LIGHT_TYPES.has(block.typeId) || SWITCH_TYPES.has(block.typeId)) {
    let connections = getConnections();
    let modified = false;
    let disconnectedCount = 0;

    if (SWITCH_TYPES.has(block.typeId)) {
      for (const playerId in selections) {
        const selection = selections[playerId];
        if (selection.pos.dimensionId === blockPos.dimensionId &&
            selection.pos.x === blockPos.x &&
            selection.pos.y === blockPos.y &&
            selection.pos.z === blockPos.z) {
          delete selections[playerId];
        }
      }

      const switchConnections = connections.filter(conn => 
        conn.switch.dimensionId === blockPos.dimensionId &&
        conn.switch.x === blockPos.x &&
        conn.switch.y === blockPos.y &&
        conn.switch.z === blockPos.z
      );

      disconnectedCount = switchConnections.length;

      connections = connections.filter(conn => 
        !(conn.switch.dimensionId === blockPos.dimensionId &&
          conn.switch.x === blockPos.x &&
          conn.switch.y === blockPos.y &&
          conn.switch.z === blockPos.z)
      );
      setConnections(connections);

      switchConnections.forEach(conn => {
        const dimLt = world.getDimension(conn.light.dimensionId);
        const lt = dimLt.getBlock(conn.light);
        if (!lt || !LIGHT_TYPES.has(lt.typeId)) return;

        const { x, y, z } = lt.location;
        const cx = x + 0.5, cy = y, cz = z + 0.5;

        dimLt.runCommand(
          `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
        );

        try {
          const currentStates = lt.permutation.getAllStates();
          
          const newStates = {};
          for (const [key, value] of Object.entries(currentStates)) {
            if (key === "ff:lamp_state") {
              newStates[key] = false;
            } else if (key === "ff:channels") {
              newStates[key] = 0;
            } else {
              newStates[key] = value;
            }
          }

          const newPermutation = BlockPermutation.resolve(lt.typeId, newStates);
          lt.setPermutation(newPermutation);

          system.runTimeout(() => {
            const updatedBlock = dimLt.getBlock({ x, y, z });
            if (updatedBlock) {
              const finalStates = updatedBlock.permutation.getAllStates();
              if (finalStates["ff:lamp_state"] !== false && finalStates["ff:channels"] !== 0) {
                dimLt.runCommand(`setblock ${x} ${y} ${z} air`);
                dimLt.runCommand(`setblock ${x} ${y} ${z} ${lt.typeId}["ff:lamp_state"=false]`);
              }
            }
          }, 1);
        } catch (error) {
          console.warn("Error setting block state:", error);
          try {
            dimLt.runCommand(`setblock ${x} ${y} ${z} air`);
            dimLt.runCommand(`setblock ${x} ${y} ${z} ${lt.typeId}["ff:lamp_state"=false]`);
          } catch (cmdError) {
            console.warn("Error using command:", cmdError);
          }
        }
      });

      modified = true;
    } else {
      connections = connections.filter(conn => {
        const isLight = conn.light.dimensionId === blockPos.dimensionId &&
                       conn.light.x === blockPos.x &&
                       conn.light.y === blockPos.y &&
                       conn.light.z === blockPos.z;
        
        if (isLight) {
          disconnectedCount = 1;
          forceBlockOff(block.dimension, blockPos, block.typeId);

          const name = block.typeId.split(":")[1];
          if (name.startsWith("ceiling_light_") || name.startsWith("wooden_ceiling_fan_")) {
            const isFan = name.includes("fan");
            const entityType = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";
            const cx = blockPos.x + 0.5;
            const cy = blockPos.y;
            const cz = blockPos.z + 0.5;
            block.dimension.runCommand(
              `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=${entityType},r=1] destroy`
            );
          }
          modified = true;
          return false;
        }
        return true;
      });
    }

    if (modified) {
      setConnections(connections);
    }
  }
});

const lastLook = new Map();

function updateLightTestActionBarForPlayer(player) {
  const now = Date.now();
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  const item = (slot >= 0 && slot < inv.size) ? inv.getItem(slot) : null;
  const dim = world.getDimension(player.dimension.id);

  const view = player.getBlockFromViewDirection({ maxDistance: 7.5 });
  const block = view?.block;
  const isSwitch = block && SWITCH_TYPES.has(block.typeId);

  if (!item && isSwitch) {
    lastLook.set(player.id, now);
    const base = `§7> Click to: §fturn on/off\n§7> Crouch + click to: §fview connections`;
    dim.runCommand(`title "${player.name}" title b_slot0${base}`);
    return;
  }

  const startTime = lastLook.get(player.id);
  if (startTime) {
    const delta = (now - startTime) / 1000;
    if (delta < 2) {
      const pct = Math.floor((delta / 2) * 30);
      const msg = `§7> Click to: §fturn on/off\n§7> Crouch + click to: §fview connections`;
      dim.runCommand(`title "${player.name}" title b_slot0${msg}`);
      return;
    }
    lastLook.delete(player.id);
    dim.runCommand(`title "${player.name}" title b_slot0`);
  }

  if (!item || item.typeId !== "ff:wrench") {
    dim.runCommand(`title "${player.name}" title b_slot0`);
    return;
  }
  lastLook.delete(player.id);

  let message = "";
  const pos = { x: block?.x, y: block?.y, z: block?.z, dimensionId: player.dimension.id };
  const conns = getConnections();

  if (block && LIGHT_TYPES.has(block.typeId)) {
    const conn = conns.find(c => c.light.x === pos.x && c.light.y === pos.y && c.light.z === pos.z);
    const name = LIGHT_ALIASES[block.typeId] || "Light";
    if (conn) {
      const channels = block.permutation.getState("ff:channels");
      const isOn = channels !== undefined ? channels > 0 : block.permutation.getState("ff:lamp_state");
      const icon = isOn ? "§q(On)" : "§c(Off)";
      message = `${name} ${isOn ? "§q" : "§c"}${icon}§r`;
    } else {
      message = `${name} §6(Unlinked)§r`;
    }
  } else if (block && SWITCH_TYPES.has(block.typeId)) {
    const cnt = conns.filter(c => c.switch.x === block.x && c.switch.y === block.y && c.switch.z === block.z).length;
    const name = SWITCH_ALIASES[block.typeId] || "Switch";
    message = `§l${name}§r\n§7 Connections: ${cnt}/20`;
  }

  if (selections[player.id]) {
    const sel = selections[player.id].pos;
    const sw = world.getDimension(sel.dimensionId).getBlock(sel);
    
    if (!sw || !SWITCH_TYPES.has(sw.typeId)) {
      delete selections[player.id];
      dim.runCommand(`title "${player.name}" title b_slot0`);
      return;
    }

    let selMsg = "";
    if (sw && SWITCH_TYPES.has(sw.typeId)) {
      const cnt = conns.filter(c => c.switch.x === sel.x && c.switch.y === sel.y && c.switch.z === sel.z).length;
      selMsg = `§lSelected Switch§r\n§7 Connections: ${cnt}/20\n§7Coords: (${sel.x},${sel.y},${sel.z})`;
    } else {
      selMsg = `§cOutside radius\n§7Selected at (${sel.x},${sel.y},${sel.z})`;
    }
    message = message ? message + "\n\n" + selMsg : selMsg;
  }

  if (message) {
    dim.runCommand(`title "${player.name}" title b_slot0${message}`);
  } else {
    dim.runCommand(`title "${player.name}" title b_slot0`);
  }
}

function spawnSelectionParticlesForPlayer(player) {
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  const item = (slot >= 0 && slot < inv.size) ? inv.getItem(slot) : null;
  if (!item || item.typeId !== "ff:wrench") return;

  const sel = selections[player.id];
  if (!sel) return;

  const dim = world.getDimension(sel.pos.dimensionId);
  const view = player.getBlockFromViewDirection({ maxDistance: 7.5 });
  const target = view?.block;

  if (target && (target.x !== sel.pos.x || target.y !== sel.pos.y || target.z !== sel.pos.z)) {
    const start = { x: sel.pos.x + 0.5, y: sel.pos.y + 0.5, z: sel.pos.z + 0.5 };
    const end = { x: target.x + 0.5, y: target.y + 0.5, z: target.z + 0.5 };
    const ptsFull = getLinePoints(start, end, 30);
    const pts = ptsFull.filter((_, i) => i % 2 === 0);

    let particleType = "ff:unused";
    if (LIGHT_TYPES.has(target.typeId)) {
      const already = getConnections().some(c =>
        c.light.dimensionId === sel.pos.dimensionId &&
        c.light.x === target.x &&
        c.light.y === target.y &&
        c.light.z === target.z
      );
      particleType = already ? "ff:unused" : "ff:unused";
    }

    for (const p of pts) {
      dim.spawnParticle(particleType, {
        x: p.x - 0.5,
        y: p.y - 0.5,
        z: p.z - 0.5
      });
    }
  }
}

function tryInitialize() {
  const connections = getConnections();
  let allBlocksValid = true;

  for (const conn of connections) {
    const dimSw = world.getDimension(conn.switch.dimensionId);
    const sw = dimSw.getBlock(conn.switch);
    const dimLt = world.getDimension(conn.light.dimensionId);
    const lt = dimLt.getBlock(conn.light);

    if (!sw || !lt || !SWITCH_TYPES.has(sw.typeId) || !LIGHT_TYPES.has(lt.typeId)) {
      allBlocksValid = false;
      break;
    }
  }

  if (allBlocksValid) {
    isInitialized = true;
  } else if (initializationAttempts < MAX_INIT_ATTEMPTS) {
    initializationAttempts++;
    system.runTimeout(tryInitialize, 20);
  } else {
    isInitialized = true;
  }
}

system.runTimeout(tryInitialize, 20);

system.runInterval(() => {
  if (!isInitialized) return;

  const connections = getConnections();
  let connectionsModified = false;

  const validConnections = connections.filter(conn => {
    const dimSw = world.getDimension(conn.switch.dimensionId);
    const sw = dimSw.getBlock(conn.switch);
    const dimLt = world.getDimension(conn.light.dimensionId);
    const lt = dimLt.getBlock(conn.light);

    if (!sw || !lt || !SWITCH_TYPES.has(sw.typeId) || !LIGHT_TYPES.has(lt.typeId)) {
      connectionsModified = true;
      if (lt && LIGHT_TYPES.has(lt.typeId)) {
        const name = lt.typeId.split(":")[1];
        if (name.startsWith("ceiling_light_") || name.startsWith("wooden_ceiling_fan_")) {
          const isFan = name.includes("fan");
          const entityType = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";
          const cx = conn.light.x + 0.5;
          const cy = conn.light.y;
          const cz = conn.light.z + 0.5;
          dimLt.runCommand(
            `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=${entityType},r=1] destroy`
          );
        }
      }
      return false;
    }
    return true;
  });

  if (connectionsModified) {
    setConnections(validConnections);
  }

  for (const conn of validConnections) {
    const dimSw = world.getDimension(conn.switch.dimensionId);
    const sw = dimSw.getBlock(conn.switch);
    const dimLt = world.getDimension(conn.light.dimensionId);
    const lt = dimLt.getBlock(conn.light);

    const active = sw.permutation.getState("ff:switch_type") === true;
    const channelsVal = lt.permutation.getState("ff:channels");
    const current = channelsVal !== undefined ? channelsVal > 0 : lt.permutation.getState("ff:lamp_state") === true;

    if (active !== current) {
      if (!active) {
        forceBlockOff(dimLt, conn.light, lt.typeId);
      } else {
        const newState = channelsVal !== undefined
          ? { "ff:channels": 1 }
          : { "ff:lamp_state": true };
        lt.setPermutation(BlockPermutation.resolve(lt.typeId, newState));
      }

      const name = lt.typeId.split(":")[1];
      if (name.startsWith("ceiling_light_") || name.startsWith("wooden_ceiling_fan_")) {
        const isFan = name.includes("fan");
        const entity = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";
        const cx = conn.light.x + 0.5;
        const cy = conn.light.y;
        const cz = conn.light.z + 0.5;
        if (active) {
          dimLt.runCommand(`summon ${entity} ${cx} ${cy} ${cz}`);
        } else {
          dimLt.runCommand(`execute positioned ${cx} ${cy} ${cz} run event entity @e[type=${entity},r=1] destroy`);
        }
      }
    }
  }
}, 0);

system.runInterval(() => {
  world.getPlayers().forEach((player) => {
    updateLightTestActionBarForPlayer(player);
    spawnSelectionParticlesForPlayer(player);
  });
}, 5);
