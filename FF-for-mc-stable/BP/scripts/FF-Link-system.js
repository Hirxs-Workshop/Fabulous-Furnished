import { world, system, ItemStack, ItemTypes } from "@minecraft/server";
import { ActionFormData }                     from "@minecraft/server-ui";

/*═══════════════════════════════════════════════════════════════
= 1.  GENERADOR
═══════════════════════════════════════════════════════════════*/
const GENERATOR_ID     = "ff:generator";
const GENERATOR_ENTITY = "ff:energy_generator";
const GENERATOR_NAME   = "§t§e§s§t§r";

const FUEL_ITEM  = "minecraft:coal";
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
const FUEL_VALUE   = 6800;
const USE_PER_TICK = 5;
const USE_PER_CONN = 5;
const TICK_PERIOD  = 5;
const MAX_GEN_CONNS = 8;

const genState = new Map();
const GENSTATE_KEY = "ff:genstate";

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
      genState.set(g.id, { energy: g.energy, enabled: g.enabled });
    }
  } catch {}
}

const CONNECTIONS_KEY = "ff:connections";

function getConnections(){
  try{
    const raw = world.getDynamicProperty(CONNECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch{ return []; }
}
function saveConnections(arr){
  try{ world.setDynamicProperty(CONNECTIONS_KEY, JSON.stringify(arr)); }catch{}
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
  const c = ent.getComponent("inventory")?.container;
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
  for(const ent of gens){
    const inv = ent.getComponent("inventory")?.container;
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
          const hopperInv = hopper.getComponent("inventory")?.container;
          if (hopperInv) hopperInv.addItem(item);
        } else {
          const players = world.getPlayers();
          let nearest = null, minDist = Infinity;
          for (const p of players) {
            const dist = Math.hypot(
              p.location.x - ent.location.x,
              p.location.y - ent.location.y,
              p.location.z - ent.location.z
            );
            if (dist < minDist) { minDist = dist; nearest = p; }
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
        const hopperInv = hopper.getComponent("inventory")?.container;
        if (hopperInv) hopperInv.addItem(fuelItem);
      } else {
        const players = world.getPlayers();
        let nearest = null, minDist = Infinity;
        for (const p of players) {
          const dist = Math.hypot(
            p.location.x - ent.location.x,
            p.location.y - ent.location.y,
            p.location.z - ent.location.z
          );
          if (dist < minDist) { minDist = dist; nearest = p; }
        }
        if (nearest) {
          const container = nearest.getComponent("minecraft:inventory")?.container;
          if (container) container.addItem(fuelItem);
        }
      }
      inv.setItem(FUEL_SLOT, undefined);
    }
  }
}, 0);

system.runInterval(() => {
  const gens = world.getDimension("overworld")
    .getEntities({type:GENERATOR_ENTITY,name:GENERATOR_NAME});
  for(const ent of gens){
    const inv = ent.getComponent("inventory")?.container;
    if(!inv) continue;

    if(!genState.has(ent.id)) genState.set(ent.id,{energy:0,enabled:false});
    const st = genState.get(ent.id);

    let slider = inv.getItem(SLIDER_SLOT);
    if(!slider){
      if(st.energy>0) st.enabled = !st.enabled;
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
              if(lampBlock) setLampStateAndEntity(lampBlock, false);
            }
          }
        }
        if(c.targetId === "ff:outlet"){
          const outletPos = c.targetPos;
          for(const c2 of getConnections().filter(c2=>c2.sourceId==="ff:outlet" && posEqual(c2.sourcePos, outletPos))){
            const devBlock = world.getDimension("overworld").getBlock(c2.targetPos);
            if(devBlock){
              try{ devBlock.setPermutation(devBlock.permutation.withState("ff:tv_on", false)); }catch{}
              try{ devBlock.setPermutation(devBlock.permutation.withState("ff:lamp_state", false)); }catch{}
              updateCeilingEntity(devBlock, false);
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
      for(const p of world.getPlayers()) {
        p.sendMessage("§6 The generator is running out of energy §e(3400 left)§6!\n§7- Coords: " + gPos.x + ", " + gPos.y + ", " + gPos.z);
      }
      notifiedLowEnergy.add(ent.id);
    }
    if(st.energy > LOW_ENERGY_THRESHOLD && notifiedLowEnergy.has(ent.id)) {
      notifiedLowEnergy.delete(ent.id);
    }

    if (st.enabled && st.energy > 0) {
      const genConnsNow = getGeneratorConns(posFloor(ent.location));
      if (genConnsNow.length === 8) {
        if (Math.random() < 0.01) {
          ent.dimension.createExplosion(
            { x: ent.location.x + 0.5, y: ent.location.y + 0.5, z: ent.location.z + 0.5 },
            { breaksBlocks: true, causesFire: true }
          );
          const base = posFloor(ent.location);
          const dim = ent.dimension;
          const fireOffsets = [
            {x:0, y:0, z:0}, {x:1, y:0, z:0}, {x:-1, y:0, z:0}, {x:0, y:0, z:1}, {x:0, y:0, z:-1},
            {x:1, y:0, z:1}, {x:-1, y:0, z:-1}, {x:1, y:0, z:-1}, {x:-1, y:0, z:1},
            {x:0, y:1, z:0}, {x:0, y:-1, z:0}
          ];
          for (const off of fireOffsets) {
            if (Math.random() < 0.7) {
              const pos = {x: base.x + off.x, y: base.y + off.y, z: base.z + off.z};
              try {
                const block = dim.getBlock(pos);
                if (block && block.typeId === "minecraft:air") {
                  block.setType("minecraft:fire");
                }
              } catch {}
            }
          }
          ent.triggerEvent("minecraft:despawn");
          for (const p of world.getPlayers()) {
            const dx = p.location.x - ent.location.x;
            const dy = p.location.y - ent.location.y;
            const dz = p.location.z - ent.location.z;
            if (dx*dx + dy*dy + dz*dz < 100) {
              p.sendMessage("§4¡The generator exploded due to overload!");
            }
          }
          return;
        }
        try {
          ent.dimension.spawnParticle("ff:pan_smoke_full", {
            x: ent.location.x + -0.3,
            y: ent.location.y + 0.5,
            z: ent.location.z + 0
          });
        } catch (e) {}
      } else {
        try {
          ent.dimension.spawnParticle("ff:pan_smoke", {
            x: ent.location.x + -0.3,
            y: ent.location.y + 0.5,
            z: ent.location.z + 0
          });
        } catch (e) {}
      }
    }
  }
  saveAllGenStates();
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
},5);

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
});
world.afterEvents.playerBreakBlock.subscribe(e=>{
  if(e.brokenBlockPermutation.type.id===GENERATOR_ID){
    e.block.dimension.runCommandAsync(
      `execute at @s run kill @e[type=${GENERATOR_ENTITY},r=1]`
    );
    const ent = findGeneratorEntity(e.block.location);
    if (ent) {
      genState.delete(ent.id);
      saveAllGenStates();
    }
  }
  const pos = posFloor(e.block.location);
  for(const c of getConnections().filter(c=>posEqual(c.sourcePos,pos))){
    const blk = world.getDimension("overworld").getBlock(c.targetPos);
    if(blk){
      try{ blk.setPermutation(blk.permutation.withState("ff:tv_on",false)); }catch{}
      try{ blk.setPermutation(blk.permutation.withState("ff:lamp_state",false)); }catch{}
      updateCeilingEntity(blk,false);
    }
  }
  for(const c of getConnections().filter(c=>posEqual(c.targetPos,pos))){
    const blk = world.getDimension("overworld").getBlock(c.targetPos);
    if(blk){
      try{ blk.setPermutation(blk.permutation.withState("ff:tv_on",false)); }catch{}
      try{ blk.setPermutation(blk.permutation.withState("ff:lamp_state",false)); }catch{}
      updateCeilingEntity(blk,false);
    }
  }
  let conns = getConnections();
  conns = conns.filter(c =>
    !(posEqual(c.sourcePos, pos) || posEqual(c.targetPos, pos))
  );
  saveConnections(conns);
  updateVerticalChainConnections(e.block);
});


const switchTargets = [
  "ff:ceiling_light_oak","ff:ceiling_light_spruce","ff:ceiling_light_dark_oak",
  "ff:ceiling_light_acacia","ff:ceiling_light_birch","ff:ceiling_light_warped",
  "ff:ceiling_light_crimson","ff:ceiling_light_pale","ff:ceiling_light_mangrove",
  "ff:ceiling_light_cherry","ff:ceiling_light_spicewood","ff:ceiling_light_cinder",
  "ff:wooden_ceiling_fan_oak","ff:wooden_ceiling_fan_spruce","ff:wooden_ceiling_fan_dark_oak",
  "ff:wooden_ceiling_fan_acacia","ff:wooden_ceiling_fan_birch","ff:wooden_ceiling_fan_warped",
  "ff:wooden_ceiling_fan_crimson","ff:wooden_ceiling_fan_pale","ff:wooden_ceiling_fan_mangrove",
  "ff:wooden_ceiling_fan_cherry","ff:wooden_ceiling_fan_spicewood","ff:wooden_ceiling_fan_cinder"
];
const outletTargets = [
  "ff:plasma_tv","ff:wooden_rustic_cherry_tv","ff:wooden_rustic_dark_oak_tv",
  "ff:wooden_rustic_pale_tv","ff:wooden_rustic_crimson_tv","ff:wooden_rustic_warped_tv",
  "ff:wooden_rustic_jungle_tv","ff:wooden_rustic_acacia_tv","ff:wooden_rustic_birch_tv",
  "ff:wooden_rustic_cinder_tv","ff:wooden_rustic_spicewood_tv","ff:wooden_rustic_mangrove_tv",
  "ff:wooden_rustic_spruce_tv","ff:wooden_rustic_oak_tv",
  "ff:lamp_off_oak","ff:lamp_off_spruce","ff:lamp_off_spicewood","ff:lamp_off_cinder","ff:lamp_off_pale",
  "ff:lamp_off_mangrove","ff:lamp_off_dark_oak","ff:lamp_off_jungle","ff:lamp_off_acacia","ff:lamp_off_crimson",
  "ff:lamp_off_warped","ff:lamp_off_cherry","ff:lamp_off_birch"
];
const ceilingLightTargets = switchTargets.filter(i=>i.includes("ceiling_light"));
const ceilingFanTargets   = switchTargets.filter(i=>i.includes("ceiling_fan"));

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
        try{ blk.setPermutation(blk.permutation.withState("ff:tv_on",false)); }catch{}
        try{ blk.setPermutation(blk.permutation.withState("ff:lamp_state",false)); }catch{}
        updateCeilingEntity(blk,false);
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
      world.getDimension("overworld").spawnParticle("minecraft:connection_ray2", pos);
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
      player.sendMessage("§7 The block has been unlinked");
      const blk = world.getDimension("overworld").getBlock(connection.targetPos);
      if(blk){
        try{ blk.setPermutation(blk.permutation.withState("ff:tv_on",false)); }catch{}
        try{ blk.setPermutation(blk.permutation.withState("ff:lamp_state",false)); }catch{}
        updateCeilingEntity(blk,false);
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
    }
    pruneOutlet({x: Math.floor(originBlock.location.x), y: Math.floor(originBlock.location.y), z: Math.floor(originBlock.location.z)});
    player.sendMessage("§7 The block has been unlinked");
  }
  if(r.selection===1){
    const o = {x: Math.floor(originBlock.location.x) + 0.5, y: Math.floor(originBlock.location.y) + 0.5, z: Math.floor(originBlock.location.z) + 0.5};
    const t = {x: targetPos.x + 0.5, y: targetPos.y + 0.5, z: targetPos.z + 0.5};
    const dist = Math.hypot(t.x - o.x, t.y - o.y, t.z - o.z);
    const steps = Math.floor(dist * 2), dur = 40;
    for(let i = 0; i <= steps; i++) {
      const s = i / steps, x = o.x * (1 - s) + t.x * s, y = o.y * (1 - s) + t.y * s, z = o.z * (1 - s) + t.z * s;
      system.runTimeout(() => player.dimension.spawnParticle("ff:connection_ray2", {x, y, z}), i * (dur / steps));
    }
  }
}

world.afterEvents.playerInteractWithBlock.subscribe(async e => {
  const item = e.itemStack, player = e.player, block = e.block;
  const id = block.typeId;
  const pos = {x: Math.floor(block.location.x), y: Math.floor(block.location.y), z: Math.floor(block.location.z)};
  const inv = player.getComponent("minecraft:inventory").container;
  const slot = player.selectedSlotIndex;
  const isWrench = item?.typeId === "ff:wrench";

  if ((!item || item.typeId === "minecraft:air") && player.isSneaking && id === GENERATOR_ID) {
    const ent = findGeneratorEntity(block.location);
    let st = ent && genState.get(ent.id);
    let conns = getGeneratorConns(posFloor(block.location));
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
    let statusText = "Minimal";
    if (conns.length === 0) statusText = "Quiet";
    else if (conns.length === 1) statusText = "Minimal";
    else if (conns.length === 2) statusText = "Very Low";
    else if (conns.length === 3) statusText = "Low";
    else if (conns.length === 4) statusText = "Moderate";
    else if (conns.length === 5) statusText = "High";
    else if (conns.length === 6) statusText = "Very High";
    else if (conns.length === 7) statusText = "Intensive";
    else if (conns.length === 8) statusText = "Unstable";
    let info = `${connColor}Energy Info §r| §i${st ? st.energy : 0}/${MAX_ENERGY}§r | ${connColor}x${conns.length}§r | Status: ${statusText}`;
    player.runCommandAsync(`title @s actionbar "${info.replace(/"/g, '\\"')}"`);
    return;
  }

  if ((!item || item.typeId === "minecraft:air") && player.isSneaking && (id === "ff:modern_switch" || id === "ff:outlet")) {
    if (id === "ff:outlet") {
      const x = pos.x, z = pos.z;
      let connsNow = getConnections();
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
            p.sendMessage("§c Outlet full!, unlink a connection\n§7- Crouch without an item in your hand to see the connections");
          }
        }
      }
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
    let energia = " §pWithout energy§r";
    if(genConn){
      const genEnt = findGeneratorEntity(genConn.sourcePos);
      const st = genEnt && genState.get(genEnt.id);
      if(st && st.enabled && st.energy > 0){
        energia = " §qLinked to a generator, but with energy§r";
      } else {
        energia = " §pLinked to a generator, but without energy§r";
      }
    } else {
      energia = " §7Not linked to a generator§r";
    }

    const form = new ActionFormData().title("Connections");
    form.body(energia + "\n\n§7- Click on a connection to see its settings:");
    if(allConns.length === 0 && Object.keys(lampGroups).length === 0){
      form.body("§7 This block has no connections!\n- Use the §f[Wrench]§7 item to link a block");
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

  if ((!item || item.typeId === "minecraft:air") && id === "ff:modern_switch") {
    const gConn = getConnections().find(c => posEqual(c.targetPos, pos) && c.sourceId === GENERATOR_ID);
    const gen = gConn && findGeneratorEntity(gConn.sourcePos);
    const st = gen && genState.get(gen.id);
    if (!gConn) {
      player.sendMessage("§c This block is not linked to any generator");
      return;
    }
    if (!st || !st.enabled || st.energy <= 0) {
      player.sendMessage("§6 The generator has no energy... Add some coal!");
      return;
    }
    toggleSwitchAndLamp(block);
    return;
  }

  if ((!item || item.typeId === "minecraft:air") && outletTargets.includes(id)) {
    const outletConn = getConnections().find(c =>
      outletTargets.includes(c.targetId) && posEqual(c.targetPos, pos)
    );
    if (!outletConn) {
      player.sendMessage("§7 This block is not linked to any outlet");
      return;
    }
    const outletPos = outletConn.sourcePos;
    const gConn = getConnections().find(c =>
      c.targetId === "ff:outlet" && posEqual(c.targetPos, outletPos) && c.sourceId === GENERATOR_ID
    );
    const gen = gConn && findGeneratorEntity(gConn.sourcePos);
    const st = gen && genState.get(gen.id);
    if (!gConn || !st || !st.enabled || st.energy <= 0) {
      player.sendMessage("§6 The generator has no energy... Add some coal!");
      return;
    }
    const s = id.startsWith("ff:lamp_") ? "ff:lamp_state" : "ff:tv_on";
    const next = !(block.permutation.getState(s) ?? false);
    for (const b of getVerticalChain(block)) b.setPermutation(b.permutation.withState(s, next));
    return;
  }

  if (!isWrench) {
    if (switchTargets.includes(id)) {
      const ref = getConnections().find(c => posEqual(c.targetPos, pos));
      if (ref) player.sendMessage(`§q Linked to: ${ref.sourceId} (${ref.sourcePos.x}, ${ref.sourcePos.y}, ${ref.sourcePos.z})`);
    }
    return;
  }

  const Wrench = inv.getItem(slot);

  if (!selectedBlock && (id === GENERATOR_ID || id === "ff:modern_switch" || id === "ff:outlet")) {
    selectedBlock = {block, id};
    let blockName = id.replace("ff:", "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    let nameTag = `§r§s Wrench  `;
    let lore = [`§r§sBlock selected\n§7- [Block: ${blockName}]`, `§r§7- [Coords: (${pos.x}, ${pos.y}, ${pos.z})]`];
    if (id === GENERATOR_ID) {
      nameTag = "§r§s Wrench  ";
      lore = [`§r§sGenerator selected\n§7- [Block: ${blockName}]`, `§r§7- [Coords: (${pos.x}, ${pos.y}, ${pos.z})]`];
    }
    player.sendMessage(`§s Block selected: ${id}`);
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
      player.sendMessage("§c You cannot link a primary connection to another");
      clearSelection(player);
      return;
    }
  }

  if (!selectedBlock) { player.sendMessage("§6 Select a block first"); return; }

  const sourceId = selectedBlock.id;
  const sourcePos = {x: Math.floor(selectedBlock.block.location.x), y: Math.floor(selectedBlock.block.location.y), z: Math.floor(selectedBlock.block.location.z)};
  const targetId = id;
  let conns = getConnections();

  if (conns.some(c => posEqual(c.targetPos, pos))) {
    player.sendMessage("§6 This block is already linked");
    clearSelection(player);
    return;
  }

  if (sourceId === GENERATOR_ID) {
    const genConns = getGeneratorConns(sourcePos);
    if (genConns.length >= MAX_GEN_CONNS) {
      player.sendMessage("§c Generator full!");
      clearSelection(player);
      return;
    }
    if (targetId !== "ff:modern_switch" && targetId !== "ff:outlet") {
      player.sendMessage("§c You can only link the generator to a switch or outlet");
      clearSelection(player);
      return;
    }
    if (conns.some(c => posEqual(c.sourcePos, sourcePos) && posEqual(c.targetPos, pos))) {
      player.sendMessage("§6 This connection already exists");
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
      const inv = genEnt.getComponent("inventory")?.container;
      if (inv) {
        const genConnsNow = getGeneratorConns(sourcePos);
        CONN_SLOTS.forEach((slot, i) => {
          if (i < genConnsNow.length) {
            inv.setItem(slot, makeConnItem(genConnsNow[i]));
          } else inv.setItem(slot, undefined);
        });
      }
    }
    player.sendMessage("§q Block linked successfully!");
    clearSelection(player);
    return;
  }

  if (sourceId === "ff:modern_switch" && countSwitchConns(sourcePos) >= SWITCH_MAX_CONNECTIONS) {
    player.sendMessage("§c Switch full!, unlink a connection\n§7- Crouch without an item in your hand to see the connections"); return;
  }

  const ok = (sourceId === "ff:modern_switch" && switchTargets.includes(targetId)) || (sourceId === "ff:outlet" && outletTargets.includes(targetId));
  if (!ok) { player.sendMessage(`§c Could not link ${sourceId} with ${targetId}`); clearSelection(player); return; }

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
        player.sendMessage("§c Outlet fully, link removed");
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
      setLampStateAndEntity(b, !!st);
    }
  }
  saveConnections(conns);
  player.sendMessage("§q Block linked successfully!");

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
      if (blk) setLampStateAndEntity(blk, !!state);
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
        p.sendMessage("§c Outlet fully, link removed");
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

loadAllGenStates();
