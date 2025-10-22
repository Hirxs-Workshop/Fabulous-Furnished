import { world, system, ItemStack, ItemTypes } from "@minecraft/server";
import { ActionFormData }                     from "@minecraft/server-ui";
import { getConnections, saveConnections }    from "./energy/connections.js";
import { EnergyMsg }                          from "./energy/messages.js";
import { switchTargets, outletTargets, ceilingLightTargets, ceilingFanTargets, getWoodType } from "./energy/targets.js";

 

const GENERATOR_ID     = "ff:generator";
const GENERATOR_ENTITY = "ff:energy_generator";
const GENERATOR_NAME   = "§t§e§s§t§r";

const SLIDER_ON  = "ff:slider_on";
const SLIDER_OFF = "ff:slider_off";
const ENERGY_ICON = "ff:energy_icon";
const ENERGY_BARS = [
  "ff:energy_bar_0",
  "ff:energy_bar_1",
  "ff:energy_bar_2",
  "ff:energy_bar_3",
  "ff:energy_bar_4",
  "ff:energy_bar_5",
  "ff:energy_bar_6",
  "ff:energy_bar_7",
  "ff:energy_bar_8",
  "ff:energy_bar_9",
  "ff:energy_bar_10",
  "ff:energy_bar_11",
  "ff:energy_bar_12",
  "ff:energy_bar_13",
  "ff:energy_bar_14",
  "ff:energy_bar_15",
  "ff:energy_bar_16"
];

const CONN_SLOTS  = [1,2,3,4,5,6,7,8];
const BAR_SLOTS   = [9,10,11];
const SLIDER_SLOT = 12;
const FUEL_SLOT   = 0;
const ICON_SLOT   = 13;

const MAX_ENERGY = 20400;
const MAX_GEN_CONNS = 8;

const genState = new Map();
const GENSTATE_KEY = "ff:genstate";

const failedConnectionAttempts = new Map();
const FAILED_ATTEMPTS_KEY = "ff:failed_attempts";
const MAX_FAILED_ATTEMPTS = 5;

const LOW_ENERGY_THRESHOLD = 3400;
const notifiedLowEnergy = new Set();
const notifiedGeneratorOff = new Set();

const INF_ITEM = "minecraft:nether_star";
const ENERGY_BAR_INF = "ff:energy_bar_inf";
const FUEL_ITEMS = {
  "minecraft:coal": 6800,
  "minecraft:charcoal": 6800,
  "minecraft:lava_bucket": 20400,
  "minecraft:coal_block": 20400,
  "minecraft:blaze_rod": 13600,
  "minecraft:blaze_powder": 6800,
  "ff:feldspar": 3400
};

const ALLOWED_CONN_IDS = [
  "ff:modern_switch", "ff:outlet",
  "ff:modern_switch_icon", "ff:outlet_icon"
];
const ALLOWED_FUEL_IDS = [
  INF_ITEM,
  ...Object.keys(FUEL_ITEMS)
];

let _genBatchPhase = 0;
let _saveGenStateTick = 0;
let _smokeTick = 0;

function saveAllGenStates() {
  try {
    const arr = Array.from(genState.entries()).map(([id, st]) => ({ id, ...st }));
    world.setDynamicProperty(GENSTATE_KEY, JSON.stringify(arr));
  } catch {}
}
function loadAllGenStates() {
  try {
    const raw = world.getDynamicProperty(GENSTATE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    for (const g of arr) {
      genState.set(g.id, { energy: g.energy, enabled: g.enabled, ownerId: g.ownerId });
    }
  } catch {}
}

function saveFailedAttempts() {
  try {
    const arr = Array.from(failedConnectionAttempts.entries()).map(([id, count]) => ({ id, count }));
    world.setDynamicProperty(FAILED_ATTEMPTS_KEY, JSON.stringify(arr));
  } catch {}
}

function loadFailedAttempts() {
  try {
    const raw = world.getDynamicProperty(FAILED_ATTEMPTS_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    for (const item of arr) {
      failedConnectionAttempts.set(item.id, item.count);
    }
  } catch {}
}

 

const posFloor = v => ({x:Math.floor(v.x),y:Math.floor(v.y),z:Math.floor(v.z)});
const posEqual = (a,b)=>a.x===b.x && a.y===b.y && a.z===b.z;

function getGeneratorConns(srcPos){
  return getConnections()
        .filter(c=>c.sourceId===GENERATOR_ID && posEqual(c.sourcePos,srcPos));
}
function findGeneratorEntity(pos){
  return world.getDimension("overworld")
              .getEntities({
                type: GENERATOR_ENTITY,
                location:{x:pos.x+0.5,y:pos.y,z:pos.z+0.5},
                maxDistance:1
              })[0];
}

function makeConnItem(conn){
  const id = conn.targetId;
  const name = id.replace("ff:", "")
                  .replace(/_/g, " ")
                  .split(" ")
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
  let tipo = "";
  if(id === "ff:modern_switch") tipo = "§eTipo: Switch";
  else if(id === "ff:outlet") tipo = "§eTipo: Outlet";
  else tipo = `§eTipo: ${name}`;
  let iconId = conn.targetId;
  if(conn.sourceId === GENERATOR_ID && id === "ff:modern_switch") iconId = "ff:modern_switch_icon";
  if(conn.sourceId === GENERATOR_ID && id === "ff:outlet") iconId = "ff:outlet_icon";
  const it = new ItemStack(ItemTypes.get(iconId), 1);
  it.nameTag = `§r§i[${name}]`;
  it.setLore([ 
    `§r§8- (${conn.targetPos.x}, ${conn.targetPos.y}, ${conn.targetPos.z})`,
    "",
    "§r§c[Click to disconnect]"
  ]);
  return it;
}

function initGeneratorInventory(ent){
  const c = ent.getComponent("minecraft:inventory")?.container;
  if(!c) return;
  CONN_SLOTS.forEach(s=>c.setItem(s,undefined));
  BAR_SLOTS .forEach(s=>c.setItem(s,new ItemStack(ItemTypes.get(ENERGY_BARS[0]),1)));
  c.setItem(SLIDER_SLOT,new ItemStack(ItemTypes.get(SLIDER_OFF),1));
  c.setItem(ICON_SLOT,  new ItemStack(ItemTypes.get(ENERGY_ICON),1));
}

const fuelToRemove = new Map();
system.runInterval(() => {
  const gens = world.getDimension("overworld")
    .getEntities({type:GENERATOR_ENTITY,name:GENERATOR_NAME});
  const playersCache = world.getPlayers();
  for(const ent of gens){
    const inv = ent.getComponent("minecraft:inventory")?.container;
    if(!inv) continue;
    const allowedConnIds = [
      "ff:modern_switch", "ff:outlet",
      "ff:modern_switch_icon", "ff:outlet_icon"
    ];
    const allowedFuelIds = [
      INF_ITEM,
      ...Object.keys(FUEL_ITEMS)
    ];
    for (const slot of CONN_SLOTS) {
      const item = inv.getItem(slot);
      if (item && !allowedConnIds.includes(item.typeId)) {
        const hopper = findNearbyHopper(ent);
        if (hopper) {
          const hopperInv = hopper.getComponent("minecraft:inventory")?.container;
          if (hopperInv) hopperInv.addItem(item);
        } else {
          let nearest = null, minD2 = Infinity;
          for (const p of playersCache) {
            const dx = p.location.x - ent.location.x;
            const dy = p.location.y - ent.location.y;
            const dz = p.location.z - ent.location.z;
            const d2 = dx*dx + dy*dy + dz*dz;
            if (d2 < minD2) { minD2 = d2; nearest = p; }
          }
          if (nearest) {
            const container = nearest.getComponent("minecraft:inventory")?.container;
            if (container) container.addItem(item);
          }
        }
        inv.setItem(slot, undefined);
      }
    }
    const fuelItem = inv.getItem(FUEL_SLOT);
    if (fuelItem && !allowedFuelIds.includes(fuelItem.typeId)) {
      const hopper = findNearbyHopper(ent);
      if (hopper) {
        const hopperInv = hopper.getComponent("minecraft:inventory")?.container;
        if (hopperInv) hopperInv.addItem(fuelItem);
      } else {
        let nearest = null, minD2 = Infinity;
        for (const p of playersCache) {
          const dx = p.location.x - ent.location.x;
          const dy = p.location.y - ent.location.y;
          const dz = p.location.z - ent.location.z;
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < minD2) { minD2 = d2; nearest = p; }
        }
        if (nearest) {
          const container = nearest.getComponent("minecraft:inventory")?.container;
          if (container) container.addItem(fuelItem);
        }
      }
      inv.setItem(FUEL_SLOT, undefined);
    }
  }
}, 40);

system.runInterval(() => {
  const playersCache = world.getPlayers();
  const gens = world.getDimension("overworld")
    .getEntities({type:GENERATOR_ENTITY,name:GENERATOR_NAME});

  const total = gens.length;
  const batches = 2; // process half of generators per tick to smooth load
  const start = Math.floor(_genBatchPhase * total / batches);
  const end   = Math.floor((_genBatchPhase + 1) * total / batches);
  _genBatchPhase = total > 0 ? (_genBatchPhase + 1) % batches : 0;
  _smokeTick++;

  for(let gi = start; gi < end; gi++){
    const ent = gens[gi];
    const inv = ent.getComponent("minecraft:inventory")?.container;
    if(!inv) continue;

    if(!genState.has(ent.id)) genState.set(ent.id,{energy:0,enabled:false});
    const st = genState.get(ent.id);

    let slider = inv.getItem(SLIDER_SLOT);
    if(!slider){
      if(st.energy>0) st.enabled = !st.enabled;
      try {
        const genBlock = ent.dimension.getBlock(posFloor(ent.location));
        if (genBlock && genBlock.typeId === GENERATOR_ID) {
          genBlock.setPermutation(
            genBlock.permutation.withState("ff:generator_type", st.enabled && st.energy > 0)
          );
        }
      } catch (e) {}
      inv.setItem(
        SLIDER_SLOT,
        new ItemStack(ItemTypes.get(st.enabled?SLIDER_ON:SLIDER_OFF),1)
      );
    }else{
      const must = st.enabled?SLIDER_ON:SLIDER_OFF;
      if(slider.typeId!==must)
        inv.setItem(SLIDER_SLOT,new ItemStack(ItemTypes.get(must),1));
    }

    const gPos = posFloor(ent.location);
    let conns  = getGeneratorConns(gPos);

    const fuel = inv.getItem(FUEL_SLOT);
    const isFeldspar = fuel?.typeId === INF_ITEM;
    if(isFeldspar) {
      st.energy = Infinity;
      st.enabled = true;
      for(const s of BAR_SLOTS){
        inv.setItem(s,new ItemStack(ItemTypes.get(ENERGY_BAR_INF),1));
      }
      const icon = new ItemStack(ItemTypes.get(ENERGY_ICON),1);
      icon.setLore([
        `§i- Energy: ∞/∞` +
        `\n\n- Connections: ${conns.length} - §p x${conns.length}`
      ]);
      icon.nameTag = "§r§uEnergy Info (Infinite)";
      inv.setItem(ICON_SLOT,icon);
      CONN_SLOTS.forEach((slot,i)=>{
        if(i<conns.length){
          inv.setItem(slot, makeConnItem(conns[i]));
        }else inv.setItem(slot, undefined);
      });
      st._wasInfinite = true;
      continue;
    }

    if(st.energy === Infinity || st._wasInfinite) {
      st.energy = 0;
      st.enabled = false;
      delete st._wasInfinite;
    }

    for(let i=0;i<conns.length && i<CONN_SLOTS.length;i++){
      const slot = CONN_SLOTS[i];
      if(!inv.getItem(slot)){
        const victim = conns[i];
        const all = getConnections()
                      .filter(c=>
                        !(c.sourceId===GENERATOR_ID &&
                          posEqual(c.sourcePos,victim.sourcePos) &&
                          posEqual(c.targetPos,victim.targetPos)));
        saveConnections(all);
        conns.splice(i,1);
        i--;
        
        failedConnectionAttempts.delete(ent.id);
        saveFailedAttempts();
      }
    }

    if(st.enabled){
      if(conns.length > 0) {
        const energyToConsume = conns.length;
        st.energy = Math.max(0, st.energy - energyToConsume);
        if(st.energy === 0) st.enabled = false;
      }
    }

    if(!st.enabled || st.energy === 0){
      for(const c of getConnections().filter(c=>c.sourceId===GENERATOR_ID && posEqual(c.sourcePos, gPos))){
        if(c.targetId === "ff:modern_switch"){
          const swBlock = world.getDimension("overworld").getBlock(c.targetPos);
          if(swBlock){
            const key = `ff:switch_type_${c.targetPos.x}_${c.targetPos.y}_${c.targetPos.z}`;
            world.setDynamicProperty(key, false);
            for(const c2 of getConnections().filter(c2=>c2.sourceId==="ff:modern_switch" && posEqual(c2.sourcePos, c.targetPos))){
              const lampBlock = world.getDimension("overworld").getBlock(c2.targetPos);
              if(lampBlock) {
                setBlockState(lampBlock, false);
                cleanLampEntitiesInChain(lampBlock);
              }
            }
          }
        }
        if(c.targetId === "ff:outlet"){
          const outletPos = c.targetPos;
          for(const c2 of getConnections().filter(c2=>c2.sourceId==="ff:outlet" && posEqual(c2.sourcePos, outletPos))){
            const devBlock = world.getDimension("overworld").getBlock(c2.targetPos);
            if(devBlock){
              setBlockState(devBlock, false);
              cleanLampEntitiesInChain(devBlock);
            }
          }
        }
      }
    }

    const fuelValue = fuel && FUEL_ITEMS[fuel.typeId];
    if(fuelValue && st.energy <= MAX_ENERGY - fuelValue){
      st.energy = Math.min(MAX_ENERGY, st.energy + fuelValue);
      if(fuel.typeId === "minecraft:lava_bucket") {
        inv.setItem(FUEL_SLOT, new ItemStack(ItemTypes.get("minecraft:bucket"), 1));
      } else {
        const newAmount = fuel.amount - 1;
        if(newAmount <= 0) {
          inv.setItem(FUEL_SLOT, undefined);
        } else {
          const newFuel = new ItemStack(ItemTypes.get(fuel.typeId), newAmount);
          inv.setItem(FUEL_SLOT, newFuel);
        }
      }
    }

    let e = st.energy;
    for(const s of BAR_SLOTS){
      const lvl=Math.max(1,Math.min(16,Math.ceil(e/425)));
      inv.setItem(s,new ItemStack(ItemTypes.get(ENERGY_BARS[lvl-1]),1));
      e-=6800;
    }

    const icon = new ItemStack(ItemTypes.get(ENERGY_ICON),1);
    let connColor = "§7";
    if (conns.length === 0) connColor = "§8";
    else if (conns.length === 1) connColor = "§s";
    else if (conns.length === 2) connColor = "§a";
    else if (conns.length === 3) connColor = "§q";
    else if (conns.length === 4) connColor = "§p";
    else if (conns.length === 5) connColor = "§6";
    else if (conns.length === 6) connColor = "§v";
    else if (conns.length === 7) connColor = "§c";
    else if (conns.length === 8) connColor = "§4";
    let statusText = "Quiet";
    if (conns.length === 0) statusText = "Quiet";
    else if (conns.length === 1) statusText = "Minimal";
    else if (conns.length === 2) statusText = "Very Low";
    else if (conns.length === 3) statusText = "Low";
    else if (conns.length === 4) statusText = "Moderate";
    else if (conns.length === 5) statusText = "High";
    else if (conns.length === 6) statusText = "Very High";
    else if (conns.length === 7) statusText = "Intensive";
    else if (conns.length === 8) statusText = "Unstable";
    let iconNameTag = `§r${connColor}Energy Info`;
    let iconLore = [
      `§i- Energy: ${st.energy}/${MAX_ENERGY}` +
      `\n\n- Connections: ${conns.length} - ${connColor}x${conns.length}` +
      `\n\nStatus: ${statusText}`
    ];
    icon.setLore(iconLore);
    icon.nameTag = iconNameTag;
    inv.setItem(ICON_SLOT,icon);

    CONN_SLOTS.forEach((slot,i)=>{
      if(i<conns.length){
        inv.setItem(slot, makeConnItem(conns[i]));
      }else inv.setItem(slot, undefined);
    });

    if(st.energy <= LOW_ENERGY_THRESHOLD && !notifiedLowEnergy.has(ent.id)) {
      // prefer notifying the owner;...otherwise, notify the nearest player within 32 blocks
      let recipient = world.getPlayers().find(p => p.id === st.ownerId);
      if (!recipient) {
        let nearest = null, minD2 = Infinity;
        for (const p of world.getPlayers()) {
          const dx = p.location.x - ent.location.x;
          const dy = p.location.y - ent.location.y;
          const dz = p.location.z - ent.location.z;
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < minD2) { minD2 = d2; nearest = p; }
        }
        if (minD2 <= 32*32) recipient = nearest;
      }
      if (recipient) {
        EnergyMsg.tr(recipient, "ff.energy.low_energy", [LOW_ENERGY_THRESHOLD, gPos.x, gPos.y, gPos.z]);
      }
      notifiedLowEnergy.add(ent.id);
    }
    if(st.energy > LOW_ENERGY_THRESHOLD && notifiedLowEnergy.has(ent.id)) {
      notifiedLowEnergy.delete(ent.id);
    }

    try {
      const genBlock = ent.dimension.getBlock(gPos);
      if (genBlock && genBlock.typeId === GENERATOR_ID) {
        genBlock.setPermutation(
          genBlock.permutation.withState("ff:generator_type", st.enabled && st.energy > 0)
        );
      }
    } catch (e) {}

    if (st.enabled && st.energy > 0) {
      const genConnsNow = getGeneratorConns(posFloor(ent.location));
      const failedCount = failedConnectionAttempts.get(ent.id) || 0;
      
      if (genConnsNow.length === 8 && failedCount >= MAX_FAILED_ATTEMPTS) {
        const base = posFloor(ent.location);
        ent.dimension.createExplosion(
          { x: base.x + 0.5, y: base.y + 0.5, z: base.z + 0.5 },
          4,
          { breaksBlocks: true, causesFire: true }
        );
        ent.triggerEvent("minecraft:despawn");
        for (const p of playersCache) {
          const dx = p.location.x - ent.location.x;
          const dy = p.location.y - ent.location.y;
          const dz = p.location.z - ent.location.z;
          if (dx*dx + dy*dy + dz*dz < 100) {
            EnergyMsg.tr(p, "ff.energy.exploded");
          }
        }
        failedConnectionAttempts.delete(ent.id);
        saveFailedAttempts();
        return;
      }
      if (genConnsNow.length === 8) {
        try {
          const base = posFloor(ent.location);
          // Spawn smoke only when a player is nearby and every other tick of this interval
          let minD2 = Infinity;
          for (const p of playersCache) {
            const dx = p.location.x - base.x;
            const dy = p.location.y - base.y;
            const dz = p.location.z - base.z;
            const d2 = dx*dx + dy*dy + dz*dz;
            if (d2 < minD2) minD2 = d2;
          }
          if ((_smokeTick % 2) === 0 && minD2 <= 32*32) {
            ent.dimension.spawnParticle("ff:pan_smoke_full", {
              x: base.x + 0.5,
              y: base.y + 0.5,
              z: base.z + 0.5
            });
          }
        } catch (e) {}
      } else {
        try {
          const base = posFloor(ent.location);
          let minD2 = Infinity;
          for (const p of playersCache) {
            const dx = p.location.x - base.x;
            const dy = p.location.y - base.y;
            const dz = p.location.z - base.z;
            const d2 = dx*dx + dy*dy + dz*dz;
            if (d2 < minD2) minD2 = d2;
          }
          if ((_smokeTick % 2) === 0 && minD2 <= 32*32) {
            ent.dimension.spawnParticle("ff:pan_smoke", {
              x: base.x + 0.5,
              y: base.y + 0.5,
              z: base.z + 0.5
            });
          }
        } catch (e) {}
      }
    }
  }
  if ((++_saveGenStateTick % 4) === 0) saveAllGenStates();
}, 10);

system.runInterval(()=>{
  for(const p of world.getPlayers()){
    const c = p.getComponent("minecraft:inventory")?.container;
    if(!c) continue;
    for(let i=0;i<c.size;i++){
      const it=c.getItem(i);
      if(it && (it.typeId===SLIDER_ON||it.typeId===SLIDER_OFF))
        c.setItem(i,undefined);
    }
  }
},100);

world.afterEvents.playerPlaceBlock.subscribe(e=>{
  if(e.block.typeId!==GENERATOR_ID) return;
  const dir = e.block.permutation.getState("minecraft:cardinal_direction") || "north";
  let dx = 0, dz = 0;
  switch(dir){
    case "north": dz = 0.3; break;
    case "south": dz = -0.3; break;
    case "east": dx = -0.3; break;
    case "west": dx = 0.3; break;
  }
  const ent = e.block.dimension.spawnEntity(GENERATOR_ENTITY,{
    x:e.block.location.x+0.5+dx,
    y:e.block.location.y+0.5,
    z:e.block.location.z+0.5+dz
  });
  ent.nameTag = GENERATOR_NAME;
  initGeneratorInventory(ent);
  try {
    e.block.setPermutation(e.block.permutation.withState("ff:generator_type", false));
  } catch (err) {}
  // track wner of this generator (the player who placed it)
  try {
    genState.set(ent.id, { energy: 0, enabled: false, ownerId: e.player?.id });
    saveAllGenStates();
  } catch {}
});

world.afterEvents.playerPlaceBlock.subscribe(e => {
  const block = e.block;
  const player = e.player;
  
  if (!block.typeId.startsWith('ff:lamp_off_')) return;
  
  const wood = getWoodType(block);
  if (!wood) return;
  
  const pos = {x: Math.floor(block.location.x), y: Math.floor(block.location.y), z: Math.floor(block.location.z)};
  const connections = getConnections();
  
  const adjacentPositions = [
    {x: pos.x, y: pos.y + 1, z: pos.z},
    {x: pos.x, y: pos.y - 1, z: pos.z}
  ];
  
  let foundConnection = null;
  let connectionSource = null;
  
  for (const adjPos of adjacentPositions) {
    const existingConn = connections.find(c =>
      c.targetId.startsWith('ff:lamp_off_') &&
      posEqual(c.targetPos, adjPos)
    );
    
    if (existingConn) {
      foundConnection = existingConn;
      connectionSource = existingConn.sourcePos;
      break;
    }
  }
  
  if (foundConnection) {
    const newConnection = {
      sourceId: foundConnection.sourceId,
      sourcePos: foundConnection.sourcePos,
      targetId: block.typeId,
      targetPos: pos
    };
    
    connections.push(newConnection);
    saveConnections(connections);
    
    if (foundConnection.sourceId === "ff:modern_switch") {
      const key = `ff:switch_type_${foundConnection.sourcePos.x}_${foundConnection.sourcePos.y}_${foundConnection.sourcePos.z}`;
      const switchState = world.getDynamicProperty(key) ?? false;
      if (switchState) {
        toggleLampTvOn(block, true, player);
      }
    } else if (foundConnection.sourceId === "ff:outlet") {
      const outletConn = connections.find(c =>
        c.targetId === "ff:outlet" && posEqual(c.targetPos, foundConnection.sourcePos) && c.sourceId === GENERATOR_ID
      );
      if (outletConn) {
        const gen = findGeneratorEntity(outletConn.sourcePos);
        const st = gen && genState.get(gen.id);
        if (st && st.enabled && st.energy > 0) {
          toggleLampTvOn(block, true, player);
        }
      }
    }
    
    EnergyMsg.tr(player, "ff.energy.conn_linked_existing_lamp");
  }
});

world.afterEvents.playerBreakBlock.subscribe(e=>{
  if(e.brokenBlockPermutation.type.id===GENERATOR_ID){
    e.block.dimension.runCommandAsync(
      `execute at @s run kill @e[type=${GENERATOR_ENTITY},r=1]`
    );
    const ent = findGeneratorEntity(e.block.location);
    if (ent) {
      genState.delete(ent.id);
      failedConnectionAttempts.delete(ent.id);
      saveAllGenStates();
      saveFailedAttempts();
    }
    try {
      e.block.setPermutation(e.block.permutation.withState("ff:generator_type", false));
    } catch (err) {}
  }
  const pos = posFloor(e.block.location);
  for(const c of getConnections().filter(c=>posEqual(c.sourcePos,pos))){
    const blk = world.getDimension("overworld").getBlock(c.targetPos);
    if(blk){
      setBlockState(blk, false);
      cleanLampEntitiesInChain(blk);
    }
  }
  for(const c of getConnections().filter(c=>posEqual(c.targetPos,pos))){
    const blk = world.getDimension("overworld").getBlock(c.targetPos);
    if(blk){
      setBlockState(blk, false);
      cleanLampEntitiesInChain(blk);
    }
  }
  let conns = getConnections();
  conns = conns.filter(c =>
    !(posEqual(c.sourcePos, pos) || posEqual(c.targetPos, pos))
  );
  saveConnections(conns);
  updateVerticalChainConnections(e.block);
});


const SWITCH_MAX_CONNECTIONS = 10;
const OUTLET_MAX_CHAINS      = 2;

const toXZKey = (id,x,z)=>`${id}|${x}|${z}`;

function getVerticalChain(block,typeId=null){
  const chain=[block], id=typeId??block.typeId;
  const x=Math.floor(block.location.x), z=Math.floor(block.location.z);
  let y=Math.floor(block.location.y)+1;
  while(true){
    const up=block.dimension.getBlock({x,y,z});
    if(!up||up.typeId!==id) break;
    chain.push(up); y++;
  }
  y=Math.floor(block.location.y)-1;
  while(true){
    const dn=block.dimension.getBlock({x,y,z});
    if(!dn||dn.typeId!==id) break;
    chain.push(dn); y--;
  }
  return chain;
}

function updateCeilingEntity(block,state){
  let ent=null;
  if(ceilingLightTargets.includes(block.typeId)) ent="ff:ff_ceiling_light";
  else if(ceilingFanTargets.includes(block.typeId)) ent="ff:ff_ceiling_fan";
  if(!ent) return;
  const dim=block.dimension;
  const loc={x:block.location.x+0.5,y:block.location.y+0,z:block.location.z+0.5};
  if(state){
    try{ dim.spawnEntity(ent,loc); }catch{}
  }else{
    try{
      dim.runCommandAsync(
        `execute positioned ${loc.x} ${loc.y} ${loc.z} run event entity @e[type=${ent},r=0.5] destroy`
      );
    }catch{}
  }
}

function setLampStateAndEntity(block,state){
  try{ block.setPermutation(block.permutation.withState("ff:lamp_state",state)); }catch{}
  updateCeilingEntity(block,state);
}

function toggleLampTvOn(block, turnOn, player, visited = new Set()) {
  if (!block.typeId.startsWith('ff:lamp_off_')) return;
  const wood = getWoodType(block);
  if (!wood) return;
  const key = `${block.location.x},${block.location.y},${block.location.z}`;
  if (visited.has(key)) return;
  visited.add(key);
  const { x, y, z } = block.location;
  const cx = x + 0.5, cy = y, cz = z + 0.5;
  const dir    = block.permutation.getState("minecraft:cardinal_direction");
  const color  = block.permutation.getState("ef:colors");
  const topBit = block.permutation.getState("ff:top_bit");
  if (!dir || color == null) return;
  if (!topBit) {
    block.dimension.runCommand(
      `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
    );
    if (turnOn) {
      block.dimension.runCommand(
        `summon ff:ff_light_ray_small ${cx} ${cy} ${cz}`
      );
    }
  }
  try {
    block.setPermutation(block.permutation.withState("ff:tv_on", !!turnOn));
    if (!turnOn) {
      block.setPermutation(block.permutation.withState("ff:tv_on", true));
      block.setPermutation(block.permutation.withState("ff:tv_on", false));
    }
  } catch (e) {}
  if (player && player.playSound) {
    player.playSound(`ff:lamp_${turnOn ? 'on' : 'off'}`);
  }
  for (const neighbor of [block.above(1), block.below(1)]) {
    if (!neighbor) continue;
    if (neighbor.typeId.startsWith('ff:lamp_off_') && getWoodType(neighbor) === wood) {
      toggleLampTvOn(neighbor, turnOn, player, visited);
    }
  }
}

function setBlockState(block, state) {
  const blockId = block.typeId;
  
  if (BLOCK_TYPE_CHANGES[blockId]) {
    if (state) {
      const newTypeId = BLOCK_TYPE_CHANGES[blockId];
      try {
        block.setType(newTypeId);
      } catch (e) {}
    } else {
      try {
        block.setType(blockId);
      } catch (e) {}
    }
    return;
  }
  
  if (blockId.startsWith("ff:lamp_off_")) {
    try {
      block.setPermutation(block.permutation.withState("ff:tv_on", !!state));
      if (!state) {
        block.setPermutation(block.permutation.withState("ff:tv_on", true));
        block.setPermutation(block.permutation.withState("ff:tv_on", false));
      }
    } catch (e) {}
    return;
  }
  
  if (blockId.startsWith("ff:lamp_") || switchTargets.includes(blockId)) {
    try {
      block.setPermutation(block.permutation.withState("ff:lamp_state", state));
    } catch (e) {}
    updateCeilingEntity(block, state);
    return;
  }
  
  if (outletTargets.includes(blockId)) {
    try {
      block.setPermutation(block.permutation.withState("ff:tv_on", state));
    } catch (e) {}
    return;
  }
}

function countSwitchConns(srcPos){
  return getConnections()
        .filter(c=>c.sourceId==="ff:modern_switch" && posEqual(c.sourcePos,srcPos))
      .length;
}

function getOutletChains(srcPos){
  const byKey=new Map();
  for(const c of getConnections()
        .filter(c=>c.sourceId==="ff:outlet"&&posEqual(c.sourcePos,srcPos))){
    const k=toXZKey(c.targetId,c.targetPos.x,c.targetPos.z);
    if(!byKey.has(k))
      byKey.set(k,{id:c.targetId,x:c.targetPos.x,z:c.targetPos.z,ys:[]});
    byKey.get(k).ys.push(c.targetPos.y);
  }
  const chains=[];
  for(const o of byKey.values()){
    o.ys.sort((a,b)=>a-b);
    let seg=[o.ys[0]];
    for(let i=1;i<o.ys.length;i++){
      if(o.ys[i]===seg[seg.length-1]+1) seg.push(o.ys[i]);
      else{ chains.push({id:o.id,x:o.x,z:o.z,ys:seg}); seg=[o.ys[i]]; }
    }
    chains.push({id:o.id,x:o.x,z:o.z,ys:seg});
  }
  return chains;
}
function pruneOutlet(srcPos){
  let conns=getConnections();
  const chains=getOutletChains(srcPos).sort((a,b)=>a.ys[0]-b.ys[0]);
  const drop=chains.slice(OUTLET_MAX_CHAINS);
  for(const seg of drop){
    for(const y of seg.ys){
      conns=conns.filter(c=>!(
        c.sourceId==="ff:outlet"&&posEqual(c.sourcePos,srcPos)&&
        c.targetId===seg.id&&c.targetPos.x===seg.x&&c.targetPos.z===seg.z&&c.targetPos.y===y
      ));
      const blk=world.getDimension("overworld").getBlock({x:seg.x,y,z:seg.z});
      if(blk){
        setBlockState(blk, false);
        cleanLampEntitiesInChain(blk);
      }
    }
  }
  saveConnections(conns);
}

function showParticleTrail(sourcePos, targetPos) {
  const source = {
    x: Math.floor(sourcePos.x),
    y: Math.floor(sourcePos.y),
    z: Math.floor(sourcePos.z)
  };
  
  const target = {
    x: Math.floor(targetPos.x),
    y: Math.floor(targetPos.y),
    z: Math.floor(targetPos.z)
  };
  
  const sourceCenter = {
    x: source.x + 0.5,
    y: source.y + 0.5,
    z: source.z + 0.5
  };
  
  const targetCenter = {
    x: target.x + 0.5,
    y: target.y + 0.5,
    z: target.z + 0.5
  };
  
  const steps = 20;
  for(let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = sourceCenter.x + (targetCenter.x - sourceCenter.x) * t;
    const y = sourceCenter.y + (targetCenter.y - sourceCenter.y) * t;
    const z = sourceCenter.z + (targetCenter.z - sourceCenter.z) * t;
    const pos = {
      x: x,
      y: y,
      z: z
    };

    try {
      world.getDimension("overworld").spawnParticle("ff:connection_ray2", pos);
    } catch (e) {}
  }
}

function showConnectionOptions(player, connection, pos) {
  const form = new ActionFormData();
  form.title("Block options");
  form.button("Unlink");
  form.button("Find block");
  return form.show(player).then(response => {
    if(response.selection === 0) {
      const conns = getConnections();
      const newConns = conns.filter(c =>
        !(posEqual(c.sourcePos, connection.sourcePos) &&
          posEqual(c.targetPos, connection.targetPos)));
      saveConnections(newConns);
      EnergyMsg.tr(player, "ff.energy.block_unlinked");
      const blk = world.getDimension("overworld").getBlock(connection.targetPos);
      if(blk){
        setBlockState(blk, false);
        cleanLampEntitiesInChain(blk);
      }
    } else if(response.selection === 1) {
      showParticleTrail(connection.sourcePos, connection.targetPos);
    }
  });
}

async function showConnectionOptionsUI(player, originBlock, targetPos, targetId) {
  const form = new ActionFormData();
  form.title("Block options");
  form.button("Unlink")
    .button("Find block");
  const r = await form.show(player);
  if(r.canceled) return;

  let conns = getConnections();
  if(r.selection===0){
    conns = conns.filter(c => !(
      c.sourceId === originBlock.typeId &&
      posEqual(c.sourcePos, {x: Math.floor(originBlock.location.x), y: Math.floor(originBlock.location.y), z: Math.floor(originBlock.location.z)}) &&
      posEqual(c.targetPos, targetPos)
    ));
    saveConnections(conns);
    const blk = originBlock.dimension.getBlock(targetPos);
    if(blk){
      try{ blk.setPermutation(blk.permutation.withState("ff:tv_on",false)); }catch{}
      try{ blk.setPermutation(blk.permutation.withState("ff:lamp_state",false)); }catch{}
      updateCeilingEntity(blk,false);
      cleanLampEntitiesInChain(blk);
    }
    pruneOutlet({x: Math.floor(originBlock.location.x), y: Math.floor(originBlock.location.y), z: Math.floor(originBlock.location.z)});
    EnergyMsg.tr(player, "ff.energy.block_unlinked");
  }
  if(r.selection===1){
    // Use compact trail without scheduling many timeouts
    showParticleTrail(originBlock.location, targetPos);
  }
}

world.afterEvents.playerInteractWithBlock.subscribe(async e => {
  const item = e.itemStack, player = e.player, block = e.block;
  const id = block.typeId;
  const pos = {x: Math.floor(block.location.x), y: Math.floor(block.location.y), z: Math.floor(block.location.z)};
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  const isWrench = item?.typeId === "ff:wrench";

  if ((!item || item.typeId === "minecraft:air") && player.isSneaking && (id === "ff:modern_switch" || id === "ff:outlet")) {
    if (id === "ff:outlet") {

    }
    let allConns = getConnections().filter(c =>
      ((c.sourceId === id && posEqual(c.sourcePos, pos)) ||
    (c.targetId === id && posEqual(c.targetPos, pos))) &&
      c.sourceId !== GENERATOR_ID && c.targetId !== GENERATOR_ID
    );
    const lampGroups = {};
    allConns = allConns.filter(c => {
      if (c.targetId === "ff:lamp_off_oak") {
        const key = `${c.targetId}|${c.targetPos.x}|${c.targetPos.z}`;
        if (!lampGroups[key]) lampGroups[key] = [];
        lampGroups[key].push(c);
        return false;
      }
      return true;
    });
    const lampSegments = [];
    for (const key in lampGroups) {
      const group = lampGroups[key];
      const ys = group.map(c => c.targetPos.y).sort((a, b) => a - b);
      let segments = [], current = [ys[0]];
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] === ys[i - 1] + 1) {
          current.push(ys[i]);
        } else {
          segments.push([...current]);
          current = [ys[i]];
        }
      }
      segments.push([...current]);
      for (const seg of segments) {
        const segConns = group.filter(c => seg.includes(c.targetPos.y));
        lampSegments.push(segConns);
      }
    }
    const genConn = getConnections().find(c =>
      c.targetId === id && posEqual(c.targetPos, pos) && c.sourceId === GENERATOR_ID
    );
    let ff_energy = "§p(!) Without energy§r";
    if(genConn){
      const genEnt = findGeneratorEntity(genConn.sourcePos);
      const st = genEnt && genState.get(genEnt.id);
      if(st && st.enabled && st.energy > 0){
        ff_energy = "§qLinked to a generator, but with energy§r";
      } else {
        ff_energy = "§pLinked to a generator, but without energy§r";
      }
    } else {
      ff_energy = "§7Not linked to a generator§r";
    }

    const form = new ActionFormData().title("Connections");
    form.body(ff_energy + "\n\n§7- Click on a connection to see its settings:");
    if(allConns.length === 0 && Object.keys(lampGroups).length === 0){
      form.body("§7The block has no connections!\n- Use the §f[Wrench]§7 item to link a block");
      await form.show(player);
      return;
    }
    for(const c of allConns){
      const isSource = c.sourceId === id && posEqual(c.sourcePos, pos);
      const otherId = isSource ? c.targetId : c.sourceId;
      const otherPos = isSource ? c.targetPos : c.sourcePos;
      const name = otherId.replace("ff:", "").replace(/_/g, " ");
      const capitalizedName = name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      const iconPath = "textures/ff_ui/icons/" + otherId.replace("ff:", "");
      form.button(capitalizedName + " (" + otherPos.x + "," + otherPos.y + "," + otherPos.z + ")", iconPath);
    }
    for(const segConns of lampSegments) {
      const c = segConns[0];
      const isSource = c.sourceId === id && posEqual(c.sourcePos, pos);
      const otherId = isSource ? c.targetId : c.sourceId;
      const otherPos = isSource ? c.targetPos : c.sourcePos;
      const name = otherId.replace("ff:", "").replace(/_/g, " ");
      const capitalizedName = name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      const iconPath = "textures/ff_ui/icons/" + otherId.replace("ff:", "");
      form.button(`${capitalizedName} (Blocks: ${segConns.length})`, iconPath);
    }
    const resp = await form.show(player);
    if(resp.canceled || (allConns.length === 0 && lampSegments.length === 0)) return;
    let selConn;
    if(resp.selection < allConns.length) {
      selConn = allConns[resp.selection];
    } else {
      selConn = lampSegments[resp.selection - allConns.length][0];
    }
    showConnectionOptions(player, selConn, pos);
    return;
  }

  if (id === "ff:modern_switch" && !isWrench) {
    const gConn = getConnections().find(c => posEqual(c.targetPos, pos) && c.sourceId === GENERATOR_ID);
    const gen = gConn && findGeneratorEntity(gConn.sourcePos);
    const st = gen && genState.get(gen.id);
    if (!gConn) { EnergyMsg.tr(player, "ff.energy.no_generator_link"); return; }
    if (!st || !st.enabled || st.energy <= 0) { EnergyMsg.tr(player, "ff.energy.no_energy"); return; }
    toggleSwitchAndLamp(block);
    return;
  }

  if (outletTargets.includes(id) && !isWrench) {
    if (item && item.typeId.startsWith('ff:lamp_off_')) {
      return;
    }
    const outletConn = getConnections().find(c =>
      outletTargets.includes(c.targetId) && posEqual(c.targetPos, pos)
    );
    if (!outletConn) { EnergyMsg.tr(player, "ff.energy.no_outlet_link"); return; }
    const outletPos = outletConn.sourcePos;
    const gConn = getConnections().find(c =>
      c.targetId === "ff:outlet" && posEqual(c.targetPos, outletPos) && c.sourceId === GENERATOR_ID
    );
    const gen = gConn && findGeneratorEntity(gConn.sourcePos);
    const st = gen && genState.get(gen.id);
    if (!gConn || !st || !st.enabled || st.energy <= 0) { EnergyMsg.tr(player, "ff.energy.no_energy"); return; }
    let currentState = false;
    if (BLOCK_TYPE_CHANGES[block.typeId]) {
      currentState = block.typeId !== id;
    } else if (id.startsWith("ff:lamp_off_")) {
      currentState = block.permutation.getState("ff:tv_on") ?? false;
    } else if (id.startsWith("ff:lamp_")) {
      currentState = block.permutation.getState("ff:lamp_state") ?? false;
    } else {
      currentState = block.permutation.getState("ff:tv_on") ?? false;
    }
    
    const nextState = !currentState;
    for (const b of getVerticalChain(block)) {
      if (b.typeId.startsWith('ff:lamp_off_')) {
        toggleLampTvOn(b, nextState, player);
      } else {
        setBlockState(b, nextState);
      }
    }
    return;
  }

  if (!isWrench) {
    if (switchTargets.includes(id)) {
      const ref = getConnections().find(c => posEqual(c.targetPos, pos));
      if (ref) EnergyMsg.tr(player, "ff.energy.linked_to", [ref.sourceId, ref.sourcePos.x, ref.sourcePos.y, ref.sourcePos.z]);
    }
    return;
  }

  const Wrench = inv.getItem(slot);

  if (!selectedBlock && (id === GENERATOR_ID || id === "ff:modern_switch" || id === "ff:outlet")) {
    selectedBlock = {block, id};
    let blockName = id.replace("ff:", "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    let nameTag = `§r§s Wrench`;
    let lore = [`§r§sBlock selected\n§7- [Block: ${blockName}]`, `§r§7- [Coords: (${pos.x}, ${pos.y}, ${pos.z})]`];
    if (id === GENERATOR_ID) {
      nameTag = "§r§s Wrench";
      lore = [`§r§sGenerator selected\n§7- [Block: ${blockName}]`, `§r§7- [Coords: (${pos.x}, ${pos.y}, ${pos.z})]`];
    }
    EnergyMsg.tr(player, "ff.energy.block_selected", [id]);
    if (Wrench?.typeId === "ff:wrench") {
      const sItem = new ItemStack("ff:wrench", 1);
      sItem.setLore(lore);
      sItem.nameTag = nameTag;
      inv.setItem(slot, sItem);
    }
    if (selectionTimer) system.clearRun(selectionTimer);
    selectionTimer = system.runTimeout(() => clearSelection(player), SELECT_TIMEOUT_TICKS);
    return;
  }
  if (selectedBlock && (id === GENERATOR_ID || id === "ff:modern_switch" || id === "ff:outlet")) {
    if (
      (selectedBlock.id === GENERATOR_ID && id === GENERATOR_ID) ||
      (selectedBlock.id !== GENERATOR_ID && id !== selectedBlock.id)
    ) {
      EnergyMsg.tr(player, "ff.energy.cannot_link_primary");
      clearSelection(player);
      return;
    }
  }

  if (!selectedBlock) { EnergyMsg.tr(player, "ff.energy.select_first"); return; }

  const sourceId = selectedBlock.id;
  const sourcePos = {x: Math.floor(selectedBlock.block.location.x), y: Math.floor(selectedBlock.block.location.y), z: Math.floor(selectedBlock.block.location.z)};
  const targetId = id;
  let conns = getConnections();

  if (conns.some(c => posEqual(c.targetPos, pos))) {
    EnergyMsg.tr(player, "ff.energy.already_linked");
    clearSelection(player);
    return;
  }

  if (sourceId === GENERATOR_ID) {
    const genConns = getGeneratorConns(sourcePos);
    if (genConns.length >= MAX_GEN_CONNS) {
      const genEnt = findGeneratorEntity(sourcePos);
      if (genEnt) {
        const currentAttempts = failedConnectionAttempts.get(genEnt.id) || 0;
        failedConnectionAttempts.set(genEnt.id, currentAttempts + 1);
        saveFailedAttempts();
        
        const remainingAttempts = MAX_FAILED_ATTEMPTS - (currentAttempts + 1);
        if (remainingAttempts > 0) {
          EnergyMsg.tr(player, "ff.energy.generator_full_attempts", [remainingAttempts]);
        } else {
          EnergyMsg.tr(player, "ff.energy.generator_exploding");
        }
      } else {
        EnergyMsg.tr(player, "ff.energy.generator_full");
      }
      clearSelection(player);
      return;
    }
    if (targetId !== "ff:modern_switch" && targetId !== "ff:outlet") {
      EnergyMsg.tr(player, "ff.energy.generator_only_switch_or_outlet");
      clearSelection(player);
      return;
    }
    if (conns.some(c => posEqual(c.sourcePos, sourcePos) && posEqual(c.targetPos, pos))) {
      EnergyMsg.tr(player, "ff.energy.connection_exists");
      clearSelection(player);
      return;
    }
    conns.push({
      sourceId: sourceId,
      sourcePos: sourcePos,
      targetId: targetId,
      targetPos: pos
    });
    saveConnections(conns);
    const genEnt = findGeneratorEntity(sourcePos);
    if (genEnt) {
      failedConnectionAttempts.delete(genEnt.id);
      saveFailedAttempts();
      
      const inv = genEnt.getComponent("minecraft:inventory")?.container;
      if (inv) {
        const genConnsNow = getGeneratorConns(sourcePos);
        CONN_SLOTS.forEach((slot, i) => {
          if (i < genConnsNow.length) {
            inv.setItem(slot, makeConnItem(genConnsNow[i]));
          } else inv.setItem(slot, undefined);
        });
      }
    }
    EnergyMsg.tr(player, "ff.energy.link_success");
    clearSelection(player);
    return;
  }

  if (sourceId === "ff:modern_switch" && countSwitchConns(sourcePos) >= SWITCH_MAX_CONNECTIONS) {
    EnergyMsg.tr(player, "ff.energy.switch_full_hint"); return;
  }

  const ok = (sourceId === "ff:modern_switch" && switchTargets.includes(targetId)) || (sourceId === "ff:outlet" && outletTargets.includes(targetId));
  if (!ok) { EnergyMsg.tr(player, "ff.energy.could_not_link", [sourceId, targetId]); clearSelection(player); return; }

  if (sourceId === "ff:outlet") {
    const x = pos.x, z = pos.z;
    pruneLampSegmentsForOutlet(x, z);
    const connsNow = getConnections();
    const outletConns = connsNow.filter(c => c.targetId === "ff:lamp_off_oak" && c.targetPos.x === x && c.targetPos.z === z && c.sourceId === "ff:outlet");
    if (outletConns.length > 0) {
      const ys = outletConns.map(c => c.targetPos.y).sort((a, b) => a - b);
      let segments = [], current = [ys[0]];
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] === ys[i - 1] + 1) {
          current.push(ys[i]);
        } else {
          segments.push([...current]);
          current = [ys[i]];
        }
      }
      segments.push([...current]);
      if (segments.length >= OUTLET_MAX_CHAINS) {
        EnergyMsg.tr(player, "ff.energy.outlet_full_link_removed");
        clearSelection(player);
        return;
      }
    }
  }

  const chain = (targetId.startsWith("ff:lamp_") || switchTargets.includes(targetId) || outletTargets.includes(targetId))
    ? getVerticalChain(block) : [block];

  for (const b of chain) {
    const tp = {x: Math.floor(b.location.x), y: Math.floor(b.location.y), z: Math.floor(b.location.z)};
    if (conns.some(c => posEqual(c.targetPos, tp))) continue;
    conns.push({sourceId, sourcePos, targetId: b.typeId, targetPos: tp});
    if (sourceId === "ff:modern_switch") {
      const key = `ff:switch_type_${sourcePos.x}_${sourcePos.y}_${sourcePos.z}`;
      const st = world.getDynamicProperty(key) ?? false;
      setBlockState(b, !!st);
    }
  }
  saveConnections(conns);
  EnergyMsg.tr(player, "ff.energy.link_success");

  inv.setItem(slot, new ItemStack("ff:wrench", 1));
  selectedBlock = null;
  if (selectionTimer) system.clearRun(selectionTimer);
});

function toggleSwitchAndLamp(sw) {
  const swPos = posFloor(sw.location);
  const gConn = getConnections().find(c =>
    c.targetId === "ff:modern_switch" && posEqual(c.targetPos, swPos) &&
    c.sourceId === GENERATOR_ID);
  if (!gConn) return false;
  const gen = findGeneratorEntity(gConn.sourcePos);
  const st = gen && genState.get(gen.id);
  if (!st || !st.enabled || st.energy <= 0) return false;

  const key = `ff:switch_type_${swPos.x}_${swPos.y}_${swPos.z}`;
  const next = !(world.getDynamicProperty(key) ?? false);
  world.setDynamicProperty(key, next);
  forceSwitchConnectionsState(swPos, next);
  return true;
}

function forceSwitchConnectionsState(swPos, state) {
  for (const c of getConnections()) {
    if (c.sourceId === "ff:modern_switch" && posEqual(c.sourcePos, swPos)) {
      const blk = world.getDimension("overworld").getBlock(c.targetPos);
      if (blk) setBlockState(blk, !!state);
    }
  }
}

let selectedBlock = null; // { block, id }
let selectionTimer = null;
const SELECT_TIMEOUT_TICKS = 30 * 20; // 30 s

function clearSelection(player) {
  if (!selectedBlock) return;
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  if (inv.getItem(slot)?.typeId === "ff:wrench") inv.setItem(slot, new ItemStack("ff:wrench", 1));
  selectedBlock = null; if (selectionTimer) system.clearRun(selectionTimer);
}

function updateVerticalChainConnections(brokenBlock) {
  const x = Math.floor(brokenBlock.location.x), z = Math.floor(brokenBlock.location.z);
  let conns = getConnections();
  
  const blockTypeChanges = Object.keys(BLOCK_TYPE_CHANGES);
  for (const typeId of blockTypeChanges) {
    const verticalConns = conns.filter(c => c.targetId === typeId && c.targetPos.x === x && c.targetPos.z === z);
    if (verticalConns.length <= 1) continue;
    const ys = verticalConns.map(c => c.targetPos.y).sort((a, b) => a - b);
    let segments = [], current = [ys[0]];
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] === ys[i - 1] + 1) {
        current.push(ys[i]);
      } else {
        segments.push([...current]);
        current = [ys[i]];
      }
    }
    segments.push([...current]);
    if (segments.length > 1) {
      let toKeep = new Set();
      for (const seg of segments) {
        for (const y of seg) toKeep.add(y);
      }
      conns = conns.filter(c => {
        if (c.targetId === typeId && c.targetPos.x === x && c.targetPos.z === z) {
          return toKeep.has(c.targetPos.y);
        }
        return true;
      });
    }
  }
  
  const lampTypes = new Set(
    conns
      .filter(c => c.targetId && c.targetId.startsWith("ff:lamp_") && c.targetPos.x === x && c.targetPos.z === z)
      .map(c => c.targetId)
  );
  for (const typeId of lampTypes) {
    const verticalConns = conns.filter(c => c.targetId === typeId && c.targetPos.x === x && c.targetPos.z === z);
    if (verticalConns.length <= 1) continue;
    const ys = verticalConns.map(c => c.targetPos.y).sort((a, b) => a - b);
    let segments = [], current = [ys[0]];
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] === ys[i - 1] + 1) {
        current.push(ys[i]);
      } else {
        segments.push([...current]);
        current = [ys[i]];
      }
    }
    segments.push([...current]);
    if (segments.length > 1) {
      let toKeep = new Set();
      for (const seg of segments) {
        for (const y of seg) toKeep.add(y);
      }
      conns = conns.filter(c => {
        if (c.targetId === typeId && c.targetPos.x === x && c.targetPos.z === z) {
          return toKeep.has(c.targetPos.y);
        }
        return true;
      });
    }
  }
  saveConnections(conns);
}

function pruneLampSegmentsForOutlet(x, z) {
  let connsNow = getConnections();
  
  const blockTypeChanges = Object.keys(BLOCK_TYPE_CHANGES);
  for (const typeId of blockTypeChanges) {
    const outletConns = connsNow.filter(c => c.targetId === typeId && c.targetPos.x === x && c.targetPos.z === z && c.sourceId === "ff:outlet");
    if (outletConns.length > 0) {
      const ys = outletConns.map(c => c.targetPos.y).sort((a, b) => a - b);
      let segments = [], current = [ys[0]];
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] === ys[i - 1] + 1) {
          current.push(ys[i]);
        } else {
          segments.push([...current]);
          current = [ys[i]];
        }
      }
      segments.push([...current]);
      if (segments.length > OUTLET_MAX_CHAINS) {
        let sorted = segments.slice().sort((a, b) => a.length - b.length || Math.max(...b) - Math.max(...a));
        const toRemove = sorted.slice(OUTLET_MAX_CHAINS);
        const removeYs = new Set(toRemove.flat());
        const newConns = connsNow.filter(c => {
          if (c.targetId === typeId && c.targetPos.x === x && c.targetPos.z === z && c.sourceId === "ff:outlet") {
            return !removeYs.has(c.targetPos.y);
          }
          return true;
        });
        saveConnections(newConns);
        for(const p of world.getPlayers()) {
          p.sendMessage("§cThe outlet is fully, link removed");
        }
      }
    }
  }
  
  const outletConns = connsNow.filter(c => c.targetId === "ff:lamp_off_oak" && c.targetPos.x === x && c.targetPos.z === z && c.sourceId === "ff:outlet");
  if (outletConns.length > 0) {
    const ys = outletConns.map(c => c.targetPos.y).sort((a, b) => a - b);
    let segments = [], current = [ys[0]];
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] === ys[i - 1] + 1) {
        current.push(ys[i]);
      } else {
        segments.push([...current]);
        current = [ys[i]];
      }
    }
    segments.push([...current]);
    if (segments.length > OUTLET_MAX_CHAINS) {
      let sorted = segments.slice().sort((a, b) => a.length - b.length || Math.max(...b) - Math.max(...a));
      const toRemove = sorted.slice(OUTLET_MAX_CHAINS);
      const removeYs = new Set(toRemove.flat());
      const newConns = connsNow.filter(c => {
        if (c.targetId === "ff:lamp_off_oak" && c.targetPos.x === x && c.targetPos.z === z && c.sourceId === "ff:outlet") {
          return !removeYs.has(c.targetPos.y);
        }
        return true;
      });
      saveConnections(newConns);
      for(const p of world.getPlayers()) {
        EnergyMsg.tr(p, "ff.energy.outlet_full_link_removed");
      }
    }
  }
}

function findNearbyHopper(ent) {
  const dim = ent.dimension;
  const base = posFloor(ent.location);
  const offsets = [
    {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
    {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0},
    {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}
  ];
  for (const off of offsets) {
    const pos = {x: base.x + off.x, y: base.y + off.y, z: base.z + off.z};
    const block = dim.getBlock(pos);
    if (block && block.typeId === "minecraft:hopper") {
      return block;
    }
  }
  return null;
}

function cleanLampEntity(block) {
  if (!block || !block.typeId.startsWith('ff:lamp_off_')) return;
  
  const { x, y, z } = block.location;
  const cx = x + 0.5, cy = y, cz = z + 0.5;
  
  try {
    block.dimension.runCommand(
      `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
    );
  } catch (e) {}
}

function cleanLampEntitiesInChain(block) {
  if (!block || !block.typeId.startsWith('ff:lamp_off_')) return;
  
  const wood = getWoodType(block);
  if (!wood) return;
  
  const visited = new Set();
  const toClean = [block];
  
  while (toClean.length > 0) {
    const current = toClean.pop();
    const key = `${current.location.x},${current.location.y},${current.location.z}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    cleanLampEntity(current);
    
    for (const neighbor of [current.above(1), current.below(1)]) {
      if (neighbor && neighbor.typeId.startsWith('ff:lamp_off_') && getWoodType(neighbor) === wood) {
        toClean.push(neighbor);
      }
    }
  }
}
const BLOCK_TYPE_CHANGES = {
  "fb:light_off": "fb:light_on",
  "fb:office_light_off": "fb:office_light",
  "fb:light_roof_off": "fb:light_roof_on"
};

loadAllGenStates();
loadFailedAttempts();
