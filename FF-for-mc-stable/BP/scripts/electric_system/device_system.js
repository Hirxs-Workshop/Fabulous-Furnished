import { world, system, BlockPermutation } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  DEVICE_TYPES,
  OUTLET_TYPES,
  DEVICE_ALIASES,
  OUTLET_ALIASES,
  DEVICE_CONNECTIONS_KEY,
  MAX_DEVICES_PER_OUTLET,
  NEAR_DISTANCE
} from "./device_types.js";

let deviceSelections = {};

function isTVBlock(typeId) {
  const rusticTVs = [
  "ff:plasma_tv",
  "ff:wooden_rustic_tv",
  "ff:wooden_rustic_cherry_tv",
  "ff:wooden_rustic_dark_oak_tv",
  "ff:wooden_rustic_pale_tv",
  "ff:wooden_rustic_crimson_tv",
  "ff:wooden_rustic_warped_tv",
  "ff:wooden_rustic_jungle_tv",
  "ff:wooden_rustic_acacia_tv",
  "ff:wooden_rustic_birch_tv",
  "ff:wooden_rustic_cinder_tv",
  "ff:wooden_rustic_spicewood_tv",
  "ff:wooden_rustic_mangrove_tv",
  "ff:wooden_rustic_spruce_tv",
  "ff:wooden_rustic_oak_tv",
  "ff:wooden_rustic_maple_tv"
];

return rusticTVs.includes(typeId);
}

function forceDeviceOff(device) {
  if (!device || !DEVICE_TYPES.has(device.typeId)) return;

  try {
    if (isTVBlock(device.typeId)) {
      const { x, y, z } = device.location;
      try {
        device.setPermutation(getUpdatedPermutation(device, { "ff:tv_on": false }));
      } catch (error) {
        device.dimension.runCommand(
          `setblock ${x} ${y} ${z} ${device.typeId}["ff:tv_on"=false]`
        );
      }
    } else if (device.typeId.startsWith("ff:lamp_")) {
      const wood = device.typeId.split('_').slice(2).join('_');
      const dir = device.permutation.getState("minecraft:cardinal_direction");
      const color = device.permutation.getState("ef:colors");
      const topBit = device.permutation.getState("ff:top_bit");
      const bottomBit = device.permutation.getState("ff:bottom_bit");
      
      const { x, y, z } = device.location;
      const cx = x + 0.5, cy = y, cz = z + 0.5;

      device.dimension.runCommand(
        `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
      );

      let stateString = [];
      if (dir) stateString.push(`"minecraft:cardinal_direction"="${dir}"`);
      if (color !== undefined) stateString.push(`"ef:colors"=${color}`);
      if (topBit !== undefined) stateString.push(`"ff:top_bit"=${topBit}`);
      if (bottomBit !== undefined) stateString.push(`"ff:bottom_bit"=${bottomBit}`);

      device.dimension.runCommand(
        `setblock ${x} ${y} ${z} ff:lamp_off_${wood}[${stateString.join(",")}]`
      );

      const newBlock = device.dimension.getBlock({ x, y, z });
      if (newBlock && newBlock.typeId.startsWith('ff:lamp_on_')) {
        device.dimension.runCommand(
          `setblock ${x} ${y} ${z} ff:lamp_off_${wood}[${stateString.join(",")}]`
        );
      }
    }
  } catch (error) {
    console.warn("Error forcing device off:", error);
  }
}

world.afterEvents.playerBreakBlock.subscribe(data => {
  const old = data.block;
  const { x, y, z } = old.location;
  const cx = x + 0.5, cy = y, cz = z + 0.5;

  old.dimension.runCommand(
    `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
  );

  if (OUTLET_TYPES.has(old.typeId)) {
    const connections = getDeviceConnections();
    
    const outletConnections = connections.filter(conn =>
      conn.outlet.dimensionId === old.dimension.id &&
      conn.outlet.x === old.x &&
      conn.outlet.y === old.y &&
      conn.outlet.z === old.z
    );

    outletConnections.forEach(conn => {
      try {
        const dimDevice = world.getDimension(conn.device.dimensionId);
        const device = dimDevice.getBlock(conn.device);
        if (device && DEVICE_TYPES.has(device.typeId)) {
          forceDeviceOff(device);
          
          if (device.typeId.startsWith('ff:lamp_')) {
            const wood = device.typeId.split('_').slice(2).join('_');
            const dir = device.permutation.getState("minecraft:cardinal_direction");
            const color = device.permutation.getState("ef:colors");
            const topBit = device.permutation.getState("ff:top_bit");
            const bottomBit = device.permutation.getState("ff:bottom_bit");
            
            let stateString = [];
            if (dir) stateString.push(`"minecraft:cardinal_direction"="${dir}"`);
            if (color !== undefined) stateString.push(`"ef:colors"=${color}`);
            if (topBit !== undefined) stateString.push(`"ff:top_bit"=${topBit}`);
            if (bottomBit !== undefined) stateString.push(`"ff:bottom_bit"=${bottomBit}`);

            dimDevice.runCommand(
              `setblock ${conn.device.x} ${conn.device.y} ${conn.device.z} ff:lamp_off_${wood}[${stateString.join(",")}]`
            );
          }
        }
      } catch (error) {
        console.warn("Error turning off device:", error);
      }
    });

    const remainingConnections = connections.filter(conn =>
      !(conn.outlet.dimensionId === old.dimension.id &&
        conn.outlet.x === old.x &&
        conn.outlet.y === old.y &&
        conn.outlet.z === old.z)
    );
    setDeviceConnections(remainingConnections);
  } else if (old.typeId.startsWith('ff:lamp_')) {
    const connections = getDeviceConnections();
    const oldConn = connections.find(conn =>
      conn.device.dimensionId === old.dimension.id &&
      conn.device.x === old.x &&
      conn.device.y === old.y &&
      conn.device.z === old.z
    );

    if (oldConn) {
      const newConnections = connections.filter(conn =>
        !(conn.device.dimensionId === old.dimension.id &&
          conn.device.x === old.x &&
          conn.device.y === old.y &&
          conn.device.z === old.z)
      );

      const remainingChains = splitLampChain(old);
      if (remainingChains && remainingChains.length > 0) {
        remainingChains.forEach(chain => {
          chain.forEach(chainBlock => {
            const newConn = {
              outlet: oldConn.outlet,
              device: {
                dimensionId: chainBlock.dimension.id,
                x: chainBlock.x,
                y: chainBlock.y,
                z: chainBlock.z
              }
            };
            newConnections.push(newConn);
          });
        });
      }

      setDeviceConnections(newConnections);
    }
  } else {
    const below = old.below(1);
    if (below && (below.typeId.startsWith('ff:lamp_off_') || below.typeId.startsWith('ff:lamp_on_'))) {
      const newOn = below.typeId.startsWith('ff:lamp_off_');
      toggleLampChain([below], newOn);
    }
  }
});

function clearAllConnections() {
  try {
    world.setDynamicProperty(DEVICE_CONNECTIONS_KEY, "[]");
  } catch (error) {
    console.warn("Error clearing all connections:", error);
  }
}

function getDeviceConnections() {
  try {
    const json = world.getDynamicProperty(DEVICE_CONNECTIONS_KEY);
    if (!json) return [];
    
    const connections = JSON.parse(json);
    return connections.filter(conn => {
      try {
        const dimOutlet = world.getDimension(conn.outlet.dimensionId);
        const dimDevice = world.getDimension(conn.device.dimensionId);
        const outlet = dimOutlet.getBlock(conn.outlet);
        const device = dimDevice.getBlock(conn.device);
        
        return outlet && device &&
              OUTLET_TYPES.has(outlet.typeId) &&
               DEVICE_TYPES.has(device.typeId);
      } catch (error) {
        return false;
      }
    });
  } catch (error) {
    console.warn("Error loading device connections:", error);
    clearAllConnections();
    return [];
  }
}

function setDeviceConnections(connections) {
  try {
    const validConnections = connections.filter(conn => {
      try {
        const dimOutlet = world.getDimension(conn.outlet.dimensionId);
        const dimDevice = world.getDimension(conn.device.dimensionId);
        const outlet = dimOutlet.getBlock(conn.outlet);
        const device = dimDevice.getBlock(conn.device);
        
        return outlet && device && 
               OUTLET_TYPES.has(outlet.typeId) && 
               DEVICE_TYPES.has(device.typeId);
      } catch (error) {
        return false;
      }
    });

    world.setDynamicProperty(DEVICE_CONNECTIONS_KEY, JSON.stringify(validConnections));
  } catch (error) {
    console.warn("Error saving device connections:", error);
    clearAllConnections();
  }
}

function cleanupConnections() {
  try {
    const connections = getDeviceConnections();
    const validConnections = connections.filter(conn => {
      try {
        const dimOutlet = world.getDimension(conn.outlet.dimensionId);
        const dimDevice = world.getDimension(conn.device.dimensionId);
        const outlet = dimOutlet.getBlock(conn.outlet);
        const device = dimDevice.getBlock(conn.device);
        
        if (!outlet || !device || !OUTLET_TYPES.has(outlet.typeId) || !DEVICE_TYPES.has(device.typeId)) {
          if (device && DEVICE_TYPES.has(device.typeId)) {
            toggleDevice(device, false);
          }
          return false;
        }
        return true;
      } catch (error) {
        return false;
      }
    });

    if (validConnections.length !== connections.length) {
      setDeviceConnections(validConnections);
    }
  } catch (error) {
    console.warn("Error during connection cleanup:", error);
  }
}

function deviceConnectionKey(conn) {
  return `${conn.outlet.dimensionId}:${conn.outlet.x},${conn.outlet.y},${conn.outlet.z}` +
         `->${conn.device.dimensionId}:${conn.device.x},${conn.device.y},${conn.device.z}`;
}

function getUpdatedPermutation(block, newStates) {
  const currentStates = {};
  const states = block.permutation.getAllStates();
  if (states) {
    for (const [key, value] of Object.entries(states)) {
      currentStates[key] = value;
    }
  }
  for (const key in newStates) {
    currentStates[key] = newStates[key];
  }
  return BlockPermutation.resolve(block.typeId, currentStates);
}

function ensureDeviceStates(block) {
  if (!DEVICE_TYPES.has(block.typeId)) return;
  
  try {
    const states = block.permutation.getAllStates();
    const newStates = { ...states };
    
    if (isTVBlock(block.typeId)) {
      if ("ff:tv_on" in states) {
        newStates["ff:tv_on"] = states["ff:tv_on"] || false;
      }
    } else if (block.typeId.startsWith("ff:lamp_")) {
      if ("minecraft:cardinal_direction" in states) {
        newStates["minecraft:cardinal_direction"] = states["minecraft:cardinal_direction"];
      }
      if ("ef:colors" in states) {
        newStates["ef:colors"] = states["ef:colors"];
      }
      if ("ff:top_bit" in states) {
        newStates["ff:top_bit"] = states["ff:top_bit"];
      }
      if ("ff:bottom_bit" in states) {
        newStates["ff:bottom_bit"] = states["ff:bottom_bit"];
      }
    }
    
    block.setPermutation(getUpdatedPermutation(block, newStates));
  } catch (error) {
    console.warn("Failed to set device states:", error);
  }
}

function getVerticalLampChain(block) {
  if (!block.typeId.startsWith('ff:lamp_')) {
    return [block];
  }

  const chain = [block];
  const parts = block.typeId.split('_');
  const wood = parts.slice(2).join('_');
  
  let current = block;
  while (true) {
    const above = current.above(1);
    if (!above || !above.typeId.startsWith('ff:lamp_') || !above.typeId.endsWith(`_${wood}`)) {
      break;
    }
    chain.push(above);
    current = above;
  }

  current = block;
  while (true) {
    const below = current.below(1);
    if (!below || !below.typeId.startsWith('ff:lamp_') || !below.typeId.endsWith(`_${wood}`)) {
      break;
    }
    chain.push(below);
    current = below;
  }

  return chain;
}

function toggleLampChain(blocks, turnOn) {
  for (const block of blocks) {
    if (!block.typeId.startsWith('ff:lamp_')) continue;
    
    const parts = block.typeId.split('_');
    const wood = parts.slice(2).join('_');
    const newType = `ff:lamp_${turnOn ? 'on' : 'off'}_${wood}`;
    const dir = block.permutation.getState("minecraft:cardinal_direction");
    const color = block.permutation.getState("ef:colors");
    const topBit = block.permutation.getState("ff:top_bit");
    const bottomBit = block.permutation.getState("ff:bottom_bit");
    
    const { x, y, z } = block.location;
    const cx = x + 0.5, cy = y, cz = z + 0.5;

    if (turnOn && !topBit) {
      block.dimension.runCommand(
        `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
      );
      block.dimension.runCommand(
        `summon ff:ff_light_ray_small ${cx} ${cy} ${cz}`
      );
    } else if (!turnOn && !topBit) {
      block.dimension.runCommand(
        `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
      );
    }

    let stateString = [];
    if (dir) stateString.push(`"minecraft:cardinal_direction"="${dir}"`);
    if (color !== undefined) stateString.push(`"ef:colors"=${color}`);
    if (topBit !== undefined) stateString.push(`"ff:top_bit"=${topBit}`);
    if (bottomBit !== undefined) stateString.push(`"ff:bottom_bit"=${bottomBit}`);

    try {
      block.dimension.runCommand(
        `setblock ${x} ${y} ${z} ${newType}[${stateString.join(",")}]`
      );
    } catch (error) {
      console.warn("Failed to toggle lamp in chain:", error);
    }
  }
}

function toggleDevice(block, turnOn) {
  if (!DEVICE_TYPES.has(block.typeId)) return;
  
  ensureDeviceStates(block);
  
  if (isTVBlock(block.typeId)) {
    try {
      block.setPermutation(getUpdatedPermutation(block, { "ff:tv_on": turnOn }));
    } catch (error) {
      const { x, y, z } = block.location;
      block.dimension.runCommand(
        `setblock ${x} ${y} ${z} ${block.typeId}["ff:tv_on"=${turnOn}]`
      );
    }
  } else if (block.typeId.startsWith("ff:lamp_")) {
    const chain = getVerticalLampChain(block);
    toggleLampChain(chain, turnOn);
  }
}

function getUniqueDeviceGroupsForOutlet(outlet, connections) {
  const groups = new Set();
  for (const conn of connections) {
    if (
      conn.outlet.dimensionId === outlet.dimensionId &&
      conn.outlet.x === outlet.x &&
      conn.outlet.y === outlet.y &&
      conn.outlet.z === outlet.z
    ) {
      const device = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
      if (!device) continue;
      if (device.typeId.startsWith('ff:lamp_')) {
        const chain = getVerticalLampChain(device);
        const sortedChain = chain
          .map(b => `${b.dimension.id}:${b.x},${b.y},${b.z}`)
          .sort()
          .join('|');
        groups.add(sortedChain);
      } else {
        const key = `${device.dimension.id}:${device.x},${device.y},${device.z}`;
        groups.add(key);
      }
    }
  }
  return groups;
}

function showOutletConnectionsMenu(player) {
  const conns = getDeviceConnections().filter(conn => {
    const device = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
    return device && DEVICE_TYPES.has(device.typeId);
  });

  if (conns.length === 0) {
    world
      .getDimension(player.dimension.id)
      .runCommand(
        `tellraw "${player.name}" {"rawtext":[{"text":" §pYou need to connect a device first!"}]}`
      );
    return;
  }

  const groupedConns = new Map();
  conns.forEach(conn => {
    const key = `${conn.outlet.dimensionId}:${conn.outlet.x},${conn.outlet.y},${conn.outlet.z}`;
    if (!groupedConns.has(key)) {
      groupedConns.set(key, []);
    }
    groupedConns.get(key).push(conn);
  });

  const form = new ActionFormData()
    .title("Current device connections")
    .body("Select a device to disconnect");

  const physicalChains = new Map();
  const processedChains = new Set();
  
  for (const [_, outletConns] of groupedConns) {
    for (const conn of outletConns) {
      const device = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
      if (!device) continue;
      
      if (device.typeId.startsWith('ff:lamp_')) {
        const chain = getVerticalLampChain(device);
        const sortedChain = chain
          .map(b => `${b.dimension.id}:${b.x},${b.y},${b.z}`)
          .sort()
          .join('|');
        if (processedChains.has(sortedChain)) continue;
        processedChains.add(sortedChain);
        physicalChains.set(sortedChain, {
          type: device.typeId,
          connections: chain.map(b => ({
            outlet: conn.outlet,
            device: {
              dimensionId: b.dimension.id,
              x: b.x,
              y: b.y,
              z: b.z
            }
          }))
        });
      } else {
        const key = `${device.dimension.id}:${device.x},${device.y},${device.z}`;
        if (processedChains.has(key)) continue;
        processedChains.add(key);
        physicalChains.set(key, {
          type: device.typeId,
          connections: [conn]
        });
      }
    }
  }

  const firstConn = conns[0];
  const outlet = firstConn ? firstConn.outlet : null;
  let groupCount = 0;
  if (outlet) {
    groupCount = getUniqueDeviceGroupsForOutlet(outlet, conns).size;
  }

  for (const [_, chain] of physicalChains) {
    const firstDevice = world.getDimension(chain.connections[0].device.dimensionId)
      .getBlock(chain.connections[0].device);
    if (!firstDevice) continue;
    
    const alias = DEVICE_ALIASES[firstDevice.typeId] || "Device";
    const icon = firstDevice.typeId.startsWith('ff:lamp_') ? "textures/items/torch" : `textures/ff_ui/icons/${firstDevice.typeId.split(":")[1]}`;
    
    let displayName = alias;
    if (firstDevice.typeId.startsWith('ff:lamp_') && chain.connections.length > 1) {
      displayName = `${alias} (${chain.connections.length} blocks)`;
    }
    
    form.button(displayName, icon);
  }

  form.button("Disconnect all");

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) return;

    const allChains = Array.from(physicalChains.values());
    if (response.selection < allChains.length) {
      showDisconnectSubmenu(player, allChains[response.selection].connections[0]);
    } else {
      disconnectAllDevices(player, conns);
    }
  });
}

function showDisconnectSubmenu(player, connection) {
  const form = new ActionFormData()
    .title("Device Connection")
    .body(
      `Device: (${connection.device.x}, ${connection.device.y}, ${connection.device.z})\n` +
      `Outlet: (${connection.outlet.x}, ${connection.outlet.y}, ${connection.outlet.z})\n` +
      "Disconnect this device?"
    )
    .button("Disconnect")
    .button("Back");
  form.show(player).then((response) => {
    if (response.selection === 0) {
      const connections = getDeviceConnections();
      const device = world.getDimension(connection.device.dimensionId).getBlock(connection.device);
      if (device && device.typeId.startsWith('ff:lamp_')) {
        const chain = getVerticalLampChain(device);
        const chainConns = connections.filter(conn => 
          chain.some(b => 
            b.dimension.id === conn.device.dimensionId &&
            b.x === conn.device.x &&
            b.y === conn.device.y &&
            b.z === conn.device.z
          )
        );
        disconnectDevice(player, connection, chainConns);
      } else {
        disconnectDevice(player, connection);
      }
    }
  });
}

function disconnectDevice(player, connection, chainConnections = null) {
  let connections = getDeviceConnections();
  const connectionsToRemove = chainConnections || [connection];
  
  connectionsToRemove.forEach(conn => {
    const index = connections.findIndex(
      (c) => deviceConnectionKey(c) === deviceConnectionKey(conn)
    );
    if (index !== -1) {
      connections.splice(index, 1);
    }
  });
  
  setDeviceConnections(connections);

  const dimDevice = world.getDimension(connection.device.dimensionId);
  const device = dimDevice.getBlock(connection.device);
  if (device) {
    toggleDevice(device, false);
  }

  world
    .getDimension(player.dimension.id)
    .runCommand(`tellraw "${player.name}" {"rawtext":[{"text":"§cDevice disconnected"}]}`);
}

function disconnectAllDevices(player, connections) {
  connections.forEach(conn => {
    const dimDevice = world.getDimension(conn.device.dimensionId);
    const device = dimDevice.getBlock(conn.device);
    if (device) {
      toggleDevice(device, false);
    }
  });

  setDeviceConnections([]);
}

function updateOutletActionBarForPlayer(player) {
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  const item = (slot >= 0 && slot < inv.size) ? inv.getItem(slot) : null;
  const dim = world.getDimension(player.dimension.id);

  const view = player.getBlockFromViewDirection({ maxDistance: 7.5 });
  const block = view?.block;
  const isOutlet = block && OUTLET_TYPES.has(block.typeId);

  if (item?.typeId === "ff:wrench" && deviceSelections[player.id]?.category === "outlet") {
    const sel = deviceSelections[player.id].pos;
    const outlet = world.getDimension(sel.dimensionId).getBlock(sel);
    
    if (!outlet || !OUTLET_TYPES.has(outlet.typeId)) {
      delete deviceSelections[player.id];
      dim.runCommand(`title "${player.name}" title b_slot2`);
      return;
    }

    const connections = getDeviceConnections();
    const outletConnections = connections.filter(c =>
      c.outlet.dimensionId === sel.dimensionId &&
      c.outlet.x === sel.x &&
      c.outlet.y === sel.y &&
      c.outlet.z === sel.z
    );
    const uniqueGroups = new Set();
    for (const conn of outletConnections) {
      const device = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
      if (!device) continue;
      if (device.typeId.startsWith('ff:lamp_')) {
        const chain = getVerticalLampChain(device);
        const sortedChain = chain.map(b => `${b.dimension.id}:${b.x},${b.y},${b.z}`).sort().join('|');
        uniqueGroups.add(sortedChain);
      } else {
        const key = `${device.dimension.id}:${device.x},${device.y},${device.z}`;
        uniqueGroups.add(key);
      }
    }
    const groupCount = uniqueGroups.size;

    const name = OUTLET_ALIASES[outlet.typeId] || "Outlet";
    const message = `§lSelected ${name}§r\n§7 Connected devices: ${groupCount}/${MAX_DEVICES_PER_OUTLET}\n§7Coords: (${sel.x},${sel.y},${sel.z})`;
    dim.runCommand(`title "${player.name}" title b_slot2${message}`);
    return;
  }

  if (!item && isOutlet) {
    const connections = getDeviceConnections();
    const outletConnections = connections.filter(c =>
      c.outlet.dimensionId === block.dimension.id &&
      c.outlet.x === block.x &&
      c.outlet.y === block.y &&
      c.outlet.z === block.z
    );
    const uniqueGroups = new Set();
    for (const conn of outletConnections) {
      const device = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
      if (!device) continue;
      if (device.typeId.startsWith('ff:lamp_')) {
        const chain = getVerticalLampChain(device);
        const sortedChain = chain.map(b => `${b.dimension.id}:${b.x},${b.y},${b.z}`).sort().join('|');
        uniqueGroups.add(sortedChain);
      } else {
        const key = `${device.dimension.id}:${device.x},${device.y},${device.z}`;
        uniqueGroups.add(key);
      }
    }
    const groupCount = uniqueGroups.size;

    const name = OUTLET_ALIASES[block.typeId] || "Outlet";
    const message = `§l${name}§r\n§7 Connected devices: ${groupCount}/${MAX_DEVICES_PER_OUTLET}\n§7> Click to: §fconnect device\n§7> Crouch + click to: §fview connections`;
    dim.runCommand(`title "${player.name}" title b_slot2${message}`);
    return;
  }

  dim.runCommand(`title "${player.name}" title b_slot2`);
}

function spawnSelectionParticlesForPlayer(player) {
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  const item = (slot >= 0 && slot < inv.size) ? inv.getItem(slot) : null;
  if (!item || item.typeId !== "ff:wrench") return;

  const sel = deviceSelections[player.id];
  if (!sel) return;

  const dim = world.getDimension(sel.pos.dimensionId);
  const view = player.getBlockFromViewDirection({ maxDistance: 7.5 });
  const target = view?.block;

  if (target && (target.x !== sel.pos.x || target.y !== sel.pos.y || target.z !== sel.pos.z)) {
    const start = { x: sel.pos.x + 0.5, y: sel.pos.y + 0.5, z: sel.pos.z + 0.5 };
    const end = { x: target.x + 0.5, y: target.y + 0.5, z: target.z + 0.5 };
    const pts = getLinePoints(start, end, 20);

    let particleType = "ff:unused";
    if (DEVICE_TYPES.has(target.typeId)) {
      const already = getDeviceConnections().some(c =>
        c.device.dimensionId === sel.pos.dimensionId &&
        c.device.x === target.x &&
        c.device.y === target.y &&
        c.device.z === target.z
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

system.runInterval(() => {
  world.getPlayers().forEach((player) => {
    updateOutletActionBarForPlayer(player);
    spawnSelectionParticlesForPlayer(player);
  });
}, 5);

system.runInterval(() => {
  const connections = getDeviceConnections();
  let connectionsModified = false;

  const validConnections = connections.filter(conn => {
    const dimOutlet = world.getDimension(conn.outlet.dimensionId);
    const outlet = dimOutlet.getBlock(conn.outlet);
    const dimDevice = world.getDimension(conn.device.dimensionId);
    const device = dimDevice.getBlock(conn.device);

    if (!outlet || !device || !OUTLET_TYPES.has(outlet.typeId) || !DEVICE_TYPES.has(device.typeId)) {
      connectionsModified = true;
      if (device && DEVICE_TYPES.has(device.typeId)) {
        toggleDevice(device, false);
      }
      return false;
    }

    ensureOutletStates(outlet);
    return true;
  });

  if (connectionsModified) {
    setDeviceConnections(validConnections);
  }
}, 0);

function getLinePoints(start, end, steps) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      z: start.z + (end.z - start.z) * t
    });
  }
  return points;
}

function ensureOutletStates(block) {
  if (!OUTLET_TYPES.has(block.typeId)) return;
  
  try {
    const states = block.permutation.getAllStates();
    const newStates = { ...states };
    
    if (!("ff:outlet_state" in states)) {
      newStates["ff:outlet_state"] = false;
    }
    
    if (!("minecraft:cardinal_direction" in states)) {
      newStates["minecraft:cardinal_direction"] = "north";
    }
    
    block.setPermutation(getUpdatedPermutation(block, newStates));
  } catch (error) {
    console.warn("Failed to set outlet states:", error);
  }
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

  if (OUTLET_TYPES.has(block.typeId)) {
    ensureOutletStates(block);
  }

  if (item && item.typeId === "ff:wrench") {
    const category = (() => {
      if (DEVICE_TYPES.has(block.typeId)) return "device";
      if (OUTLET_TYPES.has(block.typeId)) return "outlet";
      return null;
    })();

    if (category === "outlet") {
      deviceSelections[player.id] = { pos: blockPos, category };
      const dim = world.getDimension(blockPos.dimensionId);
      
      const name = OUTLET_ALIASES[block.typeId] || "Outlet";
      dim.runCommand(
        `tellraw "${player.name}" {"rawtext":[{"text":"§aSelected ${name} for connection"}]}`
      );
      
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

    if (category === "device" && deviceSelections[player.id]?.category === "outlet") {
      const source = deviceSelections[player.id].pos;
      const dx = blockPos.x - source.x;
      const dy = blockPos.y - source.y;
      const dz = blockPos.z - source.z;
      if (Math.hypot(dx, dy, dz) > NEAR_DISTANCE) {
        world
          .getDimension(blockPos.dimensionId)
          .runCommand(
            `tellraw "${player.name}" {"rawtext":[{"text":"§cDevice is too far from the outlet"}]}`
          );
        return;
      }

      const connections = getDeviceConnections();
      const outletConnections = connections.filter(c =>
        c.outlet.dimensionId === source.dimensionId &&
        c.outlet.x === source.x &&
        c.outlet.y === source.y &&
        c.outlet.z === source.z
      );

      const chain = getVerticalLampChain(block);
      
      const chainTaken = chain.some(chainBlock =>
        connections.some(c =>
          c.device.dimensionId === chainBlock.dimension.id &&
          c.device.x === chainBlock.x &&
          c.device.y === chainBlock.y &&
          c.device.z === chainBlock.z
        )
      );

      if (chainTaken) {
        world
          .getDimension(blockPos.dimensionId)
          .runCommand(
            `tellraw "${player.name}" {"rawtext":[{"text":"§cThis lamp chain is already connected"}]}`
          );
        return;
      }

      const groupCount = getUniqueDeviceGroupsForOutlet(source, connections).size;
      if (groupCount >= MAX_DEVICES_PER_OUTLET) {
        const outletGroups = Array.from(getUniqueDeviceGroupsForOutlet(source, connections));
        const toRemoveKey = outletGroups[0];
        const toRemoveConns = connections.filter(conn => {
          const device = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
          if (!device) return false;
          if (device.typeId.startsWith('ff:lamp_')) {
            const chain = getVerticalLampChain(device);
            const sortedChain = chain
              .map(b => `${b.dimension.id}:${b.x},${b.y},${b.z}`)
              .sort()
              .join('|');
            return sortedChain === toRemoveKey;
          } else {
            const key = `${device.dimension.id}:${device.x},${device.y},${device.z}`;
            return key === toRemoveKey;
          }
        });
        for (const conn of toRemoveConns) {
          const deviceBlock = world.getDimension(conn.device.dimensionId).getBlock(conn.device);
          if (deviceBlock && deviceBlock.typeId.startsWith('ff:lamp_')) {
            const oldChain = getVerticalLampChain(deviceBlock);
            toggleLampChain(oldChain, false);
          } else if (deviceBlock) {
            toggleDevice(deviceBlock, false);
          }
          const idx = connections.findIndex(c => deviceConnectionKey(c) === deviceConnectionKey(conn));
          if (idx !== -1) connections.splice(idx, 1);
        }
        world.getDimension(blockPos.dimensionId).runCommand(
          `tellraw "${player.name}" {"rawtext":[{"text":"§cA device was disconnected to make room for the new one."}]}`
        );
      }

      chain.forEach(chainBlock => {
        const newConn = {
          outlet: source,
          device: {
            dimensionId: chainBlock.dimension.id,
            x: chainBlock.x,
            y: chainBlock.y,
            z: chainBlock.z
          }
        };
        connections.push(newConn);
      });
      
      setDeviceConnections(connections);

      toggleLampChain(chain, false);

      delete deviceSelections[player.id];

      world
        .getDimension(blockPos.dimensionId)
        .runCommand(
          `tellraw "${player.name}" {"rawtext":[{"text":" §qConnection established"}]}`
        );
      return;
    }
  }

  if (DEVICE_TYPES.has(block.typeId)) {
    ensureDeviceStates(block);
    const connections = getDeviceConnections();
    
    const chain = getVerticalLampChain(block);
    const isConnected = chain.some(chainBlock =>
      connections.some(c =>
        c.device.dimensionId === chainBlock.dimension.id &&
        c.device.x === chainBlock.x &&
        c.device.y === chainBlock.y &&
        c.device.z === chainBlock.z
      )
    );

    if (isConnected) {
      const currentState = block.typeId.startsWith("ff:lamp_on_") ||
                           (isTVBlock(block.typeId) ?
                             block.permutation.getState("ff:tv_on") === true :
                             block.permutation.getState("ff:lamp_state") === true);
      toggleDevice(block, !currentState);
      return;
    } else {
      world
        .getDimension(blockPos.dimensionId)
        .runCommand(
          `tellraw "${player.name}" {"rawtext":[{"text":" §pThis device needs to be connected to an outlet first!"}]}`
        );
      return;
    }
  }

  if (player.isSneaking && OUTLET_TYPES.has(block.typeId)) {
    showOutletConnectionsMenu(player);
    return;
  }
});

world.afterEvents.worldInitialize.subscribe(() => {
  const connections = getDeviceConnections();
  connections.forEach(conn => {
    const dimDevice = world.getDimension(conn.device.dimensionId);
    const device = dimDevice.getBlock(conn.device);
    if (device && DEVICE_TYPES.has(device.typeId)) {
      ensureDeviceStates(device);
    }
  });
});

system.runInterval(() => {
  cleanupConnections();
}, 100);

world.afterEvents.playerPlaceBlock.subscribe(data => {
  const block = data.block;
  
  if (OUTLET_TYPES.has(block.typeId)) {
    const connections = getDeviceConnections();
    if (connections.length > 0) {
      console.warn("Found existing connections when placing outlet, clearing them");
      clearAllConnections();
    }
  }
});