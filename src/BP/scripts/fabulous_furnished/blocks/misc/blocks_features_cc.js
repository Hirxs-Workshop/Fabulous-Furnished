import { world, system, BlockPermutation, ItemStack, GameMode, EnchantmentType, Player } from '@minecraft/server'
import { ModalFormData, ActionFormData } from '@minecraft/server-ui'
import { updateBlock } from "../../utils/block";
import { consumeEquipped } from "../../utils/item";

const Utils = {
    getPlayerEquipment(player) {
        return player.getComponent('equippable');
    },
    
    getSelectedItem(player) {
        const equip = this.getPlayerEquipment(player);
        return equip ? equip.getEquipment('Mainhand') : null;
    },
    
    consumeItem(player, item) {
        if (player.getGameMode() === GameMode.creative) return;
        const equip = this.getPlayerEquipment(player);
        consumeEquipped(equip, item);
    },
    
    spawnItemAtBlock(dimension, item, block, offsetY = 1) {
        const { x, y, z } = block.location;
        dimension.spawnItem(item, { x: x + 0.5, y: y + offsetY, z: z + 0.5 });
    },
    
    playSoundForPlayer(player, sound) {
        player.playSound(sound);
    },
    
    getBlockState(block, stateName) {
        return block.permutation.getState(stateName);
    },
    
    setBlockState(block, stateName, value) {
        updateBlock(block, { [stateName]: value });
    }
};

const WOOD_TYPES = Object.freeze([
    'jungle','birch','crimson','warped',
    'cherry','mangrove','oak','dark_oak',
    'acacia','pale','spruce','cinder','spicewood'
]);

const DIRECTIONS = Object.freeze(['north','south','east','west']);

const ComponentRegistry = {
    deriveWoodType(block, isStool) {
        try {
            const id = block.typeId || "";
            if (isStool) {
                const m = id.match(/ff:wooden_([a-z_]+)_stool/);
                if (m) return m[1];
            }
            const m2 = id.match(/ff:wooden_([a-z_]+)_(?:chair|sofa|bench|seat)/);
            if (m2) return m2[1];
            const m3 = id.match(/ff:([a-z_]+)_(?:chair|sofa|bench|seat)/);
            if (m3) return m3[1];
        } catch {}
        return undefined;
    },
    registerCushionComponent(registry, type, isStool = false) {
        const componentId = isStool ? `ff:stool_${type}_add_couch` : `ff:${type}_add_couch`;
        registry.registerCustomComponent(componentId, {
            onPlayerInteract: e => CouchSystem.addCushion(e.player, e.block, type, isStool)
        });
    },

    registerRemoveCushionComponent(registry, type, isStool = false) {
        const componentId = isStool ? `ff:stool_${type}_remove_couch` : `ff:${type}_remove_couch`;
        registry.registerCustomComponent(componentId, {
            onPlayerInteract: e => CouchSystem.removeCushion(e.player, e.block, type, isStool),
            onPlayerDestroy: e => {
                const player = e.player;
                if (!player || player.getGameMode() === GameMode.creative) return;

                const destroyedPerm = e.destroyedBlockPermutation;
                if (!destroyedPerm) return;

                const oldId = destroyedPerm.type.id;
                const baseId = oldId.endsWith("_with_wool") ? oldId.replace("_with_wool", "") : oldId;
                let hadWool = false;
                try {
                    if (typeof destroyedPerm.hasState === 'function' && destroyedPerm.hasState("ff:has_wool")) {
                        hadWool = destroyedPerm.getState("ff:has_wool") === 1;
                    } else {
                        hadWool = oldId.endsWith("_with_wool");
                    }
                } catch {}

                const loc = {
                    x: e.block.location.x + 0.5,
                    y: e.block.location.y + 0.5,
                    z: e.block.location.z + 0.5
                };

                e.dimension.spawnItem(new ItemStack(baseId, 1), loc);
                if (hadWool) {
                    e.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), loc);
                }
            }
        });
    },

    registerItemInteractionComponent(registry, componentId, config) {
        registry.registerCustomComponent(componentId, {
            onPlayerInteract: e => {
                const { player, block } = e;
                const selectedItem = Utils.getSelectedItem(player);
                const currentState = Utils.getBlockState(block, config.stateName);
                
                if (!player.isSneaking && selectedItem && selectedItem.typeId === config.requiredItem) {
                    if (config.addStates && config.addStates[currentState] !== undefined) {
                        Utils.setBlockState(block, config.stateName, config.addStates[currentState]);
                        Utils.playSoundForPlayer(player, config.addSound);
                        Utils.consumeItem(player, selectedItem);
                    }
                } else if (!player.isSneaking && config.removeState !== undefined && currentState === config.removeState) {
                    Utils.setBlockState(block, config.stateName, config.resetState || 0);
                    Utils.playSoundForPlayer(player, config.removeSound);
                    if (config.spawnItems) {
                        config.spawnItems.forEach(itemType => {
                            Utils.spawnItemAtBlock(block.dimension, new ItemStack(itemType), block);
                        });
                    }
                }
            }
        });
    }
};

const WeatherSystem = {
    currentWeather: "Clear",
    weatherPermutations: new Map(),
    weatherChangeSubscription: null,
  
    init() {
        this.weatherChangeSubscription = world.beforeEvents.weatherChange.subscribe(({ newWeather }) => {
            this.currentWeather = newWeather;
            world.setDynamicProperty("ff:dynamic_weather_system", newWeather);
        });
    },
  
    cleanup() {
        if (this.weatherChangeSubscription) {
            this.weatherChangeSubscription.unsubscribe();
            this.weatherChangeSubscription = null;
        }
        this.weatherPermutations.clear();
    },
  
    getWeatherPermutation(block, channel) {

        try {
            return block.permutation.withState("ff:channels", channel);
        } catch {
            try {
                const states = { ...(block.permutation.getAllStates?.() || {}) };
                states["ff:channels"] = channel;
                return BlockPermutation.resolve(block.typeId, states);
            } catch {}
        }
        return block.permutation;
    },
  
    updateTVChannel(block) {
        const current = Utils.getBlockState(block, "ff:channels");
        const weather = this.currentWeather;
        
        let newChannel = current;
        if (weather === "Rain" && (current === 1 || current === 3)) newChannel = 2;
        else if (weather === "Thunder" && (current === 1 || current === 2)) newChannel = 3;
        else if (weather === "Snow" && current === 1) newChannel = 4;
        else if (weather === "Clear" && (current >= 2 && current <= 4)) newChannel = 1;
        
        if (newChannel !== current) {
            block.setPermutation(this.getWeatherPermutation(block, newChannel));
        }
    }
};

const CouchSystem = {
    addCushion(player, block = false, type, isStool = false) {
        const item = Utils.getSelectedItem(player);
        if (player.isSneaking || !item || item.typeId !== 'ff:white_cushion') return;

        Utils.playSoundForPlayer(player, 'hit.cloth');
        block.dimension.spawnParticle('ff:cushion_effect', {
            x: block.location.x + 0.5,
            y: block.location.y + 0.5,
            z: block.location.z + 0.5
        });

        try {
            const perm = block.permutation;
            let usedStatePath = false;
            if (typeof perm.hasState === 'function' && perm.hasState("ff:has_wool")) {
                let newPerm = perm.withState("ff:has_wool", 1);
                if (perm.hasState && perm.hasState("ef:colors")) newPerm = newPerm.withState("ef:colors", 0);
                block.setPermutation(newPerm);
                Utils.consumeItem(player, item);
                return;
            }
            if (typeof perm.getAllStates === 'function') {
                const states = perm.getAllStates();
                if (states && Object.prototype.hasOwnProperty.call(states, 'ff:has_wool')) {
                    const next = { ...states, 'ff:has_wool': 1 };
                    if (Object.prototype.hasOwnProperty.call(states, 'ef:colors')) next['ef:colors'] = 0;
                    const newPerm = BlockPermutation.resolve(block.typeId, next);
                    block.setPermutation(newPerm);
                    Utils.consumeItem(player, item);
                    return;
                }
            }
        } catch {}
        return;
    },

    removeCushion(player, block = false) {
        if (!player.isSneaking) return;

        try {
            const perm = block.permutation;
            if (typeof perm.hasState === 'function' && perm.hasState("ff:has_wool")) {
                const current = typeof perm.getState === 'function' ? perm.getState("ff:has_wool") : 0;
                if (current === 1) {
                    let newPerm = perm.withState("ff:has_wool", 0);
                    if (perm.hasState && perm.hasState("ef:colors")) newPerm = newPerm.withState("ef:colors", 0);
                    block.setPermutation(newPerm);
                    const dropLoc = { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 };
                    block.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), dropLoc);
                    return;
                }
            }
            if (typeof perm.getAllStates === 'function') {
                const states = perm.getAllStates();
                if (states && Object.prototype.hasOwnProperty.call(states, 'ff:has_wool') && states['ff:has_wool'] === 1) {
                    const next = { ...states, 'ff:has_wool': 0 };
                    if (Object.prototype.hasOwnProperty.call(states, 'ef:colors')) next['ef:colors'] = 0;
                    const newPerm = BlockPermutation.resolve(block.typeId, next);
                    block.setPermutation(newPerm);
                    const dropLoc = { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 };
                    block.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), dropLoc);
                    return;
                }
            }
        } catch {}
    }
};

const wooden_support_verticalTag = 'ff:wooden_support_vertical';
class WoodenSupportVerticalManager {
    static updatewooden_support_verticalsAround(block) {
        let aboveBlock = undefined;
        try {
            aboveBlock = block.above(1);
        } catch { }
        let belowBlock = undefined;
        try {
            belowBlock = block.below(1);
        } catch { }
        const blocks = [
            aboveBlock,
            belowBlock,
            block
        ];
        for (const wooden_support_vertical of blocks) {
            if (wooden_support_vertical != undefined && wooden_support_vertical.hasTag(wooden_support_verticalTag)) {
                this.updatewooden_support_vertical(wooden_support_vertical);
            }
        }
    }
    
    static updatewooden_support_vertical(block) {
        let aboveBlock = undefined;
        try {
            aboveBlock = block.above(1);
        } catch { }
        let belowBlock = undefined;
        try {
            belowBlock = block.below(1);
        } catch { }
        if (aboveBlock != undefined) {
            if (aboveBlock.hasTag(wooden_support_verticalTag)) {
                block.setPermutation(block.permutation.withState("ff:top_bit", true));
            } else block.setPermutation(block.permutation.withState("ff:top_bit", false));
        } else block.setPermutation(block.permutation.withState("ff:top_bit", false));
        if (belowBlock != undefined) {
            if (belowBlock.hasTag(wooden_support_verticalTag)) {
                block.setPermutation(block.permutation.withState("ff:bottom_bit", true));
            } else block.setPermutation(block.permutation.withState("ff:bottom_bit", false));
        } else block.setPermutation(block.permutation.withState("ff:bottom_bit", false));
    }
}

const CurtainSystem = {
    neighborOffsets: Object.freeze({
        north: { left: [-1, 0, 0], right: [1, 0, 0], above: [0, 1, 0], below: [0, -1, 0] },
        south: { left: [1, 0, 0], right: [-1, 0, 0], above: [0, 1, 0], below: [0, -1, 0] },
        east:  { left: [0, 0, -1], right: [0, 0, 1], above: [0, 1, 0], below: [0, -1, 0] },
        west:  { left: [0, 0, 1], right: [0, 0, -1], above: [0, 1, 0], below: [0, -1, 0] }
    }),

    isCurtainBlock(block) {
        if (!block || !block.typeId) return false;
        return block.typeId === 'ff:white_curtain_oak';
    },

    getCurtainNeighbors(block) {
        const { x, y, z } = block.location;
        const dim = block.dimension;
        const dir = block.permutation.getState('minecraft:cardinal_direction');
        const offsets = this.neighborOffsets[dir] || this.neighborOffsets.north;
        return {
            left: dim.getBlock({ x: x + offsets.left[0], y: y + offsets.left[1], z: z + offsets.left[2] }),
            right: dim.getBlock({ x: x + offsets.right[0], y: y + offsets.right[1], z: z + offsets.right[2] }),
            above: dim.getBlock({ x: x + offsets.above[0], y: y + offsets.above[1], z: z + offsets.above[2] }),
            below: dim.getBlock({ x: x + offsets.below[0], y: y + offsets.below[1], z: z + offsets.below[2] })
        };
    },

    updateCurtainConnections(block) {
        if (!this.isCurtainBlock(block)) return;
        const direction = block.permutation.getState('minecraft:cardinal_direction');
        const neighbors = this.getCurtainNeighbors(block);
        let newStates = { ...block.permutation.getAllStates() };
        let hasChanges = false;
        
        for (const [dir, neighbor] of Object.entries(neighbors)) {
            const shouldConnect = this.isCurtainBlock(neighbor) && neighbor.permutation.getState('minecraft:cardinal_direction') === direction;
            const newValue = shouldConnect ? 1 : 0;
            const currentValue = newStates[`ff:${dir}_connection`] || 0;
            
            if (newValue !== currentValue) {
                newStates[`ff:${dir}_connection`] = newValue;
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            const newPerm = BlockPermutation.resolve(block.typeId, newStates);
            block.setPermutation(newPerm);
        }
    },

    updateSelfAndNeighbors(block) {
        this.updateCurtainConnections(block);
        const direction = block.permutation.getState('minecraft:cardinal_direction');
        const neighbors = this.getCurtainNeighbors(block);
        for (const neighbor of Object.values(neighbors)) {
            if (this.isCurtainBlock(neighbor) && neighbor.permutation.getState('minecraft:cardinal_direction') === direction) {
                this.updateCurtainConnections(neighbor);
            }
        }
    },

    propagateCurtainOpen(block, openValue, visited = new Set()) {
        if (!this.isCurtainBlock(block)) return;
        
        const key = `${block.location.x},${block.location.y},${block.location.z}`;
        if (visited.has(key)) return;
        visited.add(key);

        const currentOpen = block.permutation.getState("ff:open") || 0;
        if (currentOpen !== openValue) {
            const newStates = { ...block.permutation.getAllStates(), "ff:open": openValue };
            const newPerm = BlockPermutation.resolve(block.typeId, newStates);
            block.setPermutation(newPerm);

            const { x, y, z } = block.location;
            block.dimension.spawnParticle("ff:curtains_open_effect", {
                x: x + 0.5,
                y: y + 0.5,
                z: z + 0.5
            });
            block.dimension.spawnParticle("ff:curtain_open_dust", {
                x: x + 0.5,
                y: y + 0.5,
                z: z + 0.5
            });
        }

        if (visited.size > 50) return;

        const direction = block.permutation.getState('minecraft:cardinal_direction');
        const neighbors = this.getCurtainNeighbors(block);
        for (const neighbor of Object.values(neighbors)) {
            if (
                neighbor &&
                this.isCurtainBlock(neighbor) &&
                neighbor.permutation.getState('minecraft:cardinal_direction') === direction &&
                neighbor.permutation.getState('ff:open') !== openValue
            ) {
                this.propagateCurtainOpen(neighbor, openValue, visited);
            }
        }
    }
};

let eventSubscriptions = [];
let systemIntervals = [];
let lastInteraction = { player: null, block: null, time: 0 };
const playerJumpCounts = new Map();

function applyStates(permutation, states) {
    let newPerm = permutation;
    for (const [key, value] of Object.entries(states)) {
        if (newPerm.hasState && newPerm.hasState(key)) {
            newPerm = newPerm.withState(key, value);
        }
    }
    return newPerm;
}

function getPreciseRotation(playerYRotation) {
    if (playerYRotation < 0) playerYRotation += 360;
    const rotation = Math.round(playerYRotation / 22.5);
    return rotation !== 16 ? rotation : 0;
}

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

world.beforeEvents.worldInitialize.subscribe(ffh => {
    eventSubscriptions.push(ffh);

    ffh.blockComponentRegistry.registerCustomComponent("ff:wall_clock_tick", {
        onTick(e) {
          const { block, dimension } = e;
          if (!block || !dimension) return;
    
          const { x, y, z } = block.location;
          const radius = 4;
          const r2 = radius * radius;
          let nearby = false;
    
          for (const player of world.getPlayers()) {
            try {
              if (player.dimension !== dimension) continue;
              const px = player.location.x - x;
              const py = player.location.y - y;
              const pz = player.location.z - z;
              const d2 = px * px + py * py + pz * pz;
              if (d2 <= r2) { nearby = true; break; }
            } catch {}
          }
    
          if (!nearby) return;
          dimension.playSound("note.hat", block.location, { volume: 0.4, pitch: 0.95 });
        }
      });

    ffh.blockComponentRegistry.registerCustomComponent('ff:empty_dish_on_interact', {
        onPlayerInteract: e => {
            const { player, block } = e;
            if (!player || !block) return;
    
            const selectedItem = Utils.getSelectedItem(player);
            if (player.isSneaking) return;
            if (!selectedItem) return;
            let targetId = null;
            if (selectedItem.typeId === 'ff:pancake') targetId = 'ff:pancake_dish';
            else if (selectedItem.typeId === 'ff:waffle') targetId = 'ff:waffle_dish';
            if (!targetId) return;
            let newPerm = BlockPermutation.resolve(targetId);
            try {
                const face = block.permutation.getState('minecraft:cardinal_direction');
                if (face !== undefined) newPerm = newPerm.withState('minecraft:cardinal_direction', face);
            } catch {}
            try {
                const onTable = block.permutation.getState('ff:on_table');
                if (onTable !== undefined) newPerm = newPerm.withState('ff:on_table', onTable);
            } catch {}
    
            block.setPermutation(newPerm);
            Utils.playSoundForPlayer(player, 'block.decorated_pot.insert');
            Utils.consumeItem(player, selectedItem);
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:laptop_interaction", {
        async onPlayerInteract(e) {
            const { player, block } = e;
            if (!player || !block) return;

            const typeId = block.typeId;
            const isOff = typeId === "ff:laptop";
            const isOnVariant = typeId === "ff:laptop_open" || typeId === "ff:laptop_chill" || typeId === "ff:laptop_desktop" || typeId === "ff:laptop_excel";

            const replaceType = (targetId) => {
                try {
                    let newPerm = BlockPermutation.resolve(targetId);
                    try {
                        const face = block.permutation.getState('minecraft:cardinal_direction');
                        if (face !== undefined) newPerm = newPerm.withState('minecraft:cardinal_direction', face);
                    } catch {}
                    try {
                        const onTable = block.permutation.getState('ff:on_table');
                        if (onTable !== undefined) newPerm = newPerm.withState('ff:on_table', onTable);
                    } catch {}
                    block.setPermutation(newPerm);
                } catch {}
            };

            if (player.isSneaking && isOnVariant) {
                try { player.runCommand('stopsound @s record.mall'); } catch {}
                replaceType('ff:laptop');
                return;
            }

            const showScreenPicker = async () => {
                try {
                    const form = new ActionFormData()
                        .title('Choose an app')
                        .button('Laptop Desktop')
                        .button('Chill Craft App')
                        .button('Excil App');
                    const res = await form.show(player);
                    if (res.canceled) return;
                    const sel = res.selection;
                    if (sel === 0) {
                        try { player.runCommand('stopsound @s record.mall'); } catch {}
                        replaceType('ff:laptop_desktop');
                    } else if (sel === 1) {
                        replaceType('ff:laptop_chill');
                        try { player.playSound('record.mall'); } catch {}
                    } else if (sel === 2) {
                        try { player.runCommand('stopsound @s record.mall'); } catch {}
                        replaceType('ff:laptop_excel');
                    }
                } catch {}
            };
            if (isOff) {
                replaceType('ff:laptop_open');
                return;
            }
            if (isOnVariant) {
                await showScreenPicker();
                return;
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:dish_return_on_sneak', {
        onPlayerInteract: e => {
            const { player, block, dimension } = e;
            if (!player || !block) return;
            if (!player.isSneaking) return;

            const typeId = block.typeId;
            let giveId = null;
            if (typeId === 'ff:pancake_dish') giveId = 'ff:pancake';
            else if (typeId === 'ff:waffle_dish') giveId = 'ff:waffle';
            if (!giveId) return;

            try {
                const inv = player.getComponent('minecraft:inventory').container;
                const leftover = inv.addItem(new ItemStack(giveId, 1));
                if (leftover) {
                    const c = block.center();
                    dimension.spawnItem(new ItemStack(giveId, 1), c);
                }
            } catch {
                const c = block.center();
                dimension.spawnItem(new ItemStack(giveId, 1), c);
            }

            let newPerm = BlockPermutation.resolve('ff:empty_dish');
            try {
                const face = block.permutation.getState('minecraft:cardinal_direction');
                if (face !== undefined) newPerm = newPerm.withState('minecraft:cardinal_direction', face);
            } catch {}
            try {
                const onTable = block.permutation.getState('ff:on_table');
                if (onTable !== undefined) newPerm = newPerm.withState('ff:on_table', onTable);
            } catch {}
            block.setPermutation(newPerm);
            Utils.playSoundForPlayer(player, 'random.pop');
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:maple_spile_collect', {
        onPlayerInteract: e => {
            const { player, block, dimension } = e;
            if (!player || !block) return;
            if (player.isSneaking) return;

            const selectedItem = Utils.getSelectedItem(player);
            if (!selectedItem || selectedItem.typeId !== 'minecraft:glass_bottle') return;

            const { x, y, z } = block.location;
            let nearMapleLog = false;
            for (let dx = -1; dx <= 1 && !nearMapleLog; dx++) {
                for (let dy = -1; dy <= 1 && !nearMapleLog; dy++) {
                    for (let dz = -1; dz <= 1 && !nearMapleLog; dz++) {
                        const nb = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
                        if (nb && nb.typeId === 'ff:maple_log') {
                            nearMapleLog = true;
                        }
                    }
                }
            }
            if (!nearMapleLog) {
                return;
            }

            try {
                const equip = Utils.getPlayerEquipment(player);
                const inv = player.getComponent('minecraft:inventory')?.container;
                const hand = equip ? equip.getEquipment('Mainhand') : null;
                if (!hand || hand.typeId !== 'minecraft:glass_bottle') return;

                const syrup = new ItemStack('ff:maple_syrup', 1);
                const added = inv?.addItem ? inv.addItem(syrup) : undefined;
                if (added === false) {
                    const c = block.center();
                    dimension.spawnItem(syrup, c);
                }

                if (player.getGameMode() !== GameMode.creative) {
                    const newAmount = Math.max(0, (hand.amount || 1) - 1);
                    if (newAmount > 0) {
                        hand.amount = newAmount;
                        equip.setEquipment('Mainhand', hand);
                    } else {
                        equip.setEquipment('Mainhand', undefined);
                    }
                }
            } catch {}
            Utils.playSoundForPlayer(player, 'use.honey_block');
            try {
                const face = block.permutation.getState('minecraft:cardinal_direction');
                let ox = 0, oz = 0;
                if (face === 'north') { oz = -0.15; }
                else if (face === 'south') { oz = 0.15; }
                else if (face === 'east') { ox = 0.15; }
                else if (face === 'west') { ox = -0.15; }
                const px = x + 0.5 + ox;
                const py = y + 0.4;
                const pz = z + 0.5 + oz;
                dimension.runCommand(`particle ff:syrup_drop ${px} ${py} ${pz}`);
            } catch {}
        }
    });
    ffh.blockComponentRegistry.registerCustomComponent('ff:rope_extend', {
        onPlayerInteract(e) {
            const { player, block } = e;
            if (!player || !block) return;
            const item = Utils.getSelectedItem(player);

            if (player.isSneaking) {
                let current = block;
                let removed = 0;
                while (true) {
                    let next;
                    try { next = current.below(1); } catch { next = undefined; }
                    if (!next) break;
                    let nextId = '';
                    try { nextId = next.typeId; } catch { nextId = ''; }
                    if (nextId !== 'ff:rope') break;
                    try { next.setPermutation(BlockPermutation.resolve('minecraft:air')); } catch { break; }
                    removed++;
                    current = next;
                    if (removed > 512) break; 
                }
                if (removed > 0) {
                    try {
                        const inv = player.getComponent('minecraft:inventory')?.container;
                        const dropAt = block.center();
                        let remaining = removed;
                        while (remaining > 0) {
                            const give = Math.min(64, remaining);
                            const stack = new ItemStack('ff:rope', give);
                            const added = inv?.addItem ? inv.addItem(stack) : undefined;
                            if (added === false) {
                                block.dimension.spawnItem(stack, dropAt);
                            }
                            remaining -= give;
                        }
                    } catch {
                        const dropAt = block.center();
                        block.dimension.spawnItem(new ItemStack('ff:rope', removed), dropAt);
                    }
                    Utils.playSoundForPlayer(player, 'random.pop');
                }
                return;
            }

            if (!item || item.typeId !== 'ff:rope') return;

            let current = block;
            while (true) {
                let next;
                try { next = current.below(1); } catch { next = undefined; }
                if (!next) return;
                let nextId = '';
                try { nextId = next.typeId; } catch { nextId = ''; }
                if (nextId === 'ff:rope') {
                    current = next;
                    continue;
                }
                if (nextId !== 'minecraft:air') return;
                let newPerm = BlockPermutation.resolve('ff:rope');
                try {
                    const face = block.permutation.getState('minecraft:cardinal_direction');
                    if (face !== undefined) newPerm = newPerm.withState('minecraft:cardinal_direction', face);
                } catch {}
                try { next.setPermutation(newPerm); } catch { return; }
                Utils.consumeItem(player, item);
                Utils.playSoundForPlayer(player, 'hit.cloth');
                return;
            }

        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:coffee_cup_particles', {
        onTick(e) {
            const { block, dimension } = e;
            if (!block || !dimension) return;
            try {
                const hasCoffee = block.permutation.getState('ff:has_coffee');
                if (!hasCoffee) return;
            } catch { return; }
            let pos = block.center();
            try {
                const onTable = block.permutation.getState('ff:on_table');
                if (onTable) pos = { x: pos.x, y: pos.y - 0.5, z: pos.z };
            } catch {}
            try {
                dimension.spawnParticle('ff:coffee_smoke', pos);
            } catch {
                const { x, y, z } = pos;
                dimension.runCommand(`particle ff:coffee_smoke ${x} ${y} ${z}`);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:coffee_jar', {
        onTick(e) {
            const { block, dimension } = e;
            if (!block || !dimension) return;
            let pos = block.center();
            try {
                const onTable = block.permutation.getState('ff:on_table');
                if (onTable) pos = { x: pos.x, y: pos.y - 0.5, z: pos.z };
            } catch {}
            try {
                dimension.spawnParticle('ff:coffee_smoke', pos);
            } catch {
                const { x, y, z } = pos;
                dimension.runCommand(`particle ff:coffee_smoke ${x} ${y} ${z}`);
            }
        },
        onPlayerInteract(e) {
            const { player, block } = e;
            if (!player || !block) return;
            if (block.typeId !== 'ff:coffee_glass_jar') return;
            if (player.isSneaking) return;

            const equip = player.getComponent('equippable');
            const inv = player.getComponent('inventory')?.container;
            const inHand = equip ? equip.getEquipment('Mainhand') : undefined;

            const preserveStates = () => {
                let perm = BlockPermutation.resolve('ff:empty_coffee_glass_jar');
                try {
                    const face = block.permutation.getState('minecraft:cardinal_direction');
                    if (face !== undefined) perm = perm.withState('minecraft:cardinal_direction', face);
                } catch {}
                try {
                    const onTable = block.permutation.getState('ff:on_table');
                    if (onTable !== undefined) perm = perm.withState('ff:on_table', onTable);
                } catch {}
                try { block.setPermutation(perm); } catch {}
            };

            if (inHand && inHand.typeId === 'ff:empty_coffee_cup') {
                try {
                    if (player.getGameMode() !== GameMode.creative) {
                        const newAmount = Math.max(0, (inHand.amount || 1) - 1);
                        if (newAmount > 0) { inHand.amount = newAmount; equip.setEquipment('Mainhand', inHand); }
                        else { equip.setEquipment('Mainhand', undefined); }
                    }
                } catch {}
                try {
                    const fullCup = new ItemStack('ff:coffee_cup', 1);
                    if (!inv || inv.addItem(fullCup) === false) {
                        block.dimension.spawnItem(fullCup, block.center());
                    }
                } catch {}
                try { player.playSound('random.drink'); } catch {}
                preserveStates();
                return;
            }

            try {
                player.runCommandAsync('effect @s saturation 1 5 true').catch(() => {
                    try { player.runCommandAsync('effect @s regeneration 2 1 true'); } catch {}
                });
            } catch {}
            try { player.playSound('random.drink'); } catch {}
            preserveStates();
        }
    });

    // Old/Rustic Radio songs list :p
    const RADIO_STATIONS = [
        { id: 'record.13',       label: 'Music Disc 13',       icon: 'textures/items/record_13' },
        { id: 'record.cat',      label: 'Music Disc Cat',      icon: 'textures/items/record_cat' },
        { id: 'record.blocks',   label: 'Music Disc Blocks',   icon: 'textures/items/record_blocks' },
        { id: 'record.chirp',    label: 'Music Disc Chirp',    icon: 'textures/items/record_chirp' },
        { id: 'record.far',      label: 'Music Disc Far',      icon: 'textures/items/record_far' },
        { id: 'record.mall',     label: 'Music Disc Mall',     icon: 'textures/items/record_mall' },
        { id: 'record.mellohi',  label: 'Music Disc Mellohi',  icon: 'textures/items/record_mellohi' },
        { id: 'record.stal',     label: 'Music Disc Stal',     icon: 'textures/items/record_stal' },
        { id: 'record.strad',    label: 'Music Disc Strad',    icon: 'textures/items/record_strad' },
        { id: 'record.ward',     label: 'Music Disc Ward',     icon: 'textures/items/record_ward' },
        { id: 'record.11',       label: 'Music Disc 11',       icon: 'textures/items/record_11' },
        { id: 'record.wait',     label: 'Music Disc Wait',     icon: 'textures/items/record_wait' },
        { id: 'record.pigstep',  label: 'Music Disc Pigstep',  icon: 'textures/items/record_pigstep' },
        { id: 'record.otherside',label: 'Music Disc Otherside',icon: 'textures/items/record_otherside' },
        { id: 'record.5',        label: 'Music Disc 5',        icon: 'textures/items/record_5' },
        { id: 'record.relic',    label: 'Music Disc Relic',    icon: 'textures/items/music_disc_relic' },
        { id: 'record.precipice',    label: 'Music Disc Precipice',    icon: 'textures/items/music_disc_precipice' },
        { id: 'record.creator',    label: 'Music Disc Creator',    icon: 'textures/items/music_disc_creator' },
        { id: 'record.creator_music_box',    label: 'Music Disc Creator (music box)',    icon: 'textures/items/music_disc_creator_music_box' },
        { id: 'record.tears',    label: 'Music Disc Tears',    icon: 'textures/items/music_disc_tears' },
        { id: 'record.lava_chicken',    label: 'Music Disc Lava Chicken',    icon: 'textures/items/music_disc_lava_chicken' }
    ];
    const radioStationByBlock = new Map();
    const lastPlayedByBlock = new Map();

    ffh.blockComponentRegistry.registerCustomComponent('ff:rustic_radio_music', {
        onTick(e) {
            const { block } = e;
            if (block.permutation.getState("ff:radio_on")) {
                const { x, y, z } = block.location;
                block.dimension.runCommand(`particle ff:radio_music ${x} ${y + 0.4} ${z}`);
            }
        },
        async onPlayerInteract(e) {
            const { player, block } = e;
            if (!player || !block) return;

            const key = `${block.location.x},${block.location.y},${block.location.z}`;
            let idx = radioStationByBlock.get(key) ?? 0;
            const { x, y, z } = block.location;

            const playArea = (soundId) => {
                try {
                    const prev = lastPlayedByBlock.get(key);
                    if (prev) {
                        block.dimension.runCommand(`stopsound @a[x=${x},y=${y},z=${z},r=25] ${prev}`);
                    }
                } catch {}
                try {
                    block.dimension.runCommand(`stopsound @a[x=${x},y=${y},z=${z},r=25] ${soundId}`);
                } catch {}
                try {
                    block.dimension.runCommand(`playsound ${soundId} @a[x=${x},y=${y},z=${z},r=25]`);
                    lastPlayedByBlock.set(key, soundId);
                } catch {}
            };

            const formatRecordName = (id) => {
                const core = id.startsWith('record.') ? id.slice(7) : id;
                return core
                    .split('_')
                    .map(w => (/^\d+$/.test(w) ? w : (w.charAt(0).toUpperCase() + w.slice(1))))
                    .join(' ');
            };

            if (player.isSneaking) {
                try {
                    const prev = lastPlayedByBlock.get(key);
                    if (prev) {
                        block.dimension.runCommand(`stopsound @a[x=${x},y=${y},z=${z},r=25] ${prev}`);
                        lastPlayedByBlock.delete(key);
                    } else {
                        for (const st of RADIO_STATIONS) {
                            try { block.dimension.runCommand(`stopsound @a[x=${x},y=${y},z=${z},r=25] ${st.id}`); } catch {}
                        }
                    }
                } catch {}
                try { block.setPermutation(block.permutation.withState('ff:radio_on', false)); } catch {}
                try { player.sendMessage({ rawtext: [ { translate: 'ff.radio.powered_off' } ] }); } catch {}
                try { player.playSound('random.click'); } catch {}
                return;
            }

            try { block.setPermutation(block.permutation.withState('ff:radio_on', true)); } catch {}

            try {
                const form = new ActionFormData().title('Rustic Radio');
                for (let i = 0; i < RADIO_STATIONS.length; i++) {
                    const st = RADIO_STATIONS[i];
                    const prefix = i === idx ? '§q' : '';
                    form.button(`${prefix}${st.label}`, st.icon);
                }
                const res = await form.show(player);
                if (res.canceled) return;
                const sel = res.selection;
                if (typeof sel === 'number' && sel >= 0 && sel < RADIO_STATIONS.length) {
                    idx = sel;
                    radioStationByBlock.set(key, idx);
                }
            } catch {}

            const soundId = RADIO_STATIONS[idx]?.id ?? 'record.stal';
            const wasSame = (lastPlayedByBlock.get(key) === soundId);
            playArea(soundId);
            try {
                if (wasSame) player.sendMessage({ rawtext: [ { translate: 'ff.radio.rewinding' } ] });
                else player.sendMessage({ rawtext: [ { translate: 'ff.radio.now_playing', with: [ formatRecordName(soundId) ] } ] });
            } catch {}
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:fridge_dual', {
        beforeOnPlayerPlace(e) {
            const { dimension, permutationToPlace } = e;
            const loc = e.block && e.block.location ? e.block.location : (e.location || {});
            const x = loc.x, y = loc.y, z = loc.z;
            if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
                e.cancel = true;
                return;
            }
            const blockAbove = dimension.getBlock({ x, y: y + 1, z });
            if (!blockAbove || blockAbove.typeId !== 'minecraft:air') {
                e.cancel = true;
                return;
            }
            const player = e.player;
            let cardinal = 'north';
            if (player) {
                const yRot = player.getRotation().y;
                const dirs = ['north', 'east', 'south', 'west'];
                let idx = Math.floor(((yRot % 360) + 360) % 360 / 90 + 0.5) % 4;
                cardinal = dirs[idx];
            }
            e.permutationToPlace = permutationToPlace
                .withState('minecraft:cardinal_direction', cardinal)
                .withState('ff:fridge_bottom', true)
                .withState('ff:fridge_upper', false)
                .withState('ff:fridge_door', false);
        },
        onPlace(e) {
            const { block } = e;
            const { x, y, z } = block.location;
            if (!block.permutation.getState('ff:fridge_bottom')) return;
            const cardinal = block.permutation.getState('minecraft:cardinal_direction');
            const upperType = block.typeId;
            let displayName = 'Refrigerador';
            if (upperType.includes('fridge_white')) displayName = '§8White fridge';
            else if (upperType.includes('fridge_black')) displayName = '§fBlack fridge';
            const blockAbove = block.dimension.getBlock({ x, y: y + 1, z });
            if (blockAbove && blockAbove.typeId === 'minecraft:air') {
                const upperPermutation = BlockPermutation.resolve(upperType, {
                    "minecraft:cardinal_direction": cardinal,
                    "ff:fridge_bottom": false,
                    "ff:fridge_upper": true,
                    "ff:fridge_door": false
                });
                blockAbove.setPermutation(upperPermutation);
                
                const inv = block.dimension.spawnEntity("ff:fridge_inventory", {
                    x: x + 0.5,
                    y: y + 1.5,
                    z: z + 0.5
                });
                try { inv.nameTag = displayName; } catch {}
                const freezer = block.dimension.spawnEntity("ff:fridge_inventory_freezer", {
                    x: x + 0.5,
                    y: y + 0.5,
                    z: z + 0.5
                });
                try { freezer.nameTag = 'freezer_gui'; } catch {}
            }
        },
        onPlayerInteract(e) {
            const { block, player } = e;
            const current = block.permutation.getState('ff:fridge_door');
            block.setPermutation(block.permutation.withState('ff:fridge_door', !current));
            player.playSound(!current ? 'block.barrel.open' : 'block.barrel.close');
        },
        onTick(e) {
            const { block } = e;
            if (block.permutation.getState('ff:fridge_door')) {
                block.setPermutation(block.permutation.withState('ff:fridge_door', false));
            }
        },
        onPlayerDestroy(e) {
            const { block } = e;
            const { x, y, z } = block.location;
            const above = block.dimension.getBlock({ x, y: y + 1, z });
            if (above && above.permutation &&
                (above.permutation.getState('ff:fridge_upper') || above.permutation.getState('ff:fridge_bottom')) &&
                (above.typeId.includes('fridge_white') || above.typeId.includes('fridge_black'))) {
                above.setPermutation(BlockPermutation.resolve('minecraft:air'));
            }
            const below = block.dimension.getBlock({ x, y: y - 1, z });
            if (below && below.permutation &&
                (below.permutation.getState('ff:fridge_upper') || below.permutation.getState('ff:fridge_bottom')) &&
                (below.typeId.includes('fridge_white') || below.typeId.includes('fridge_black'))) {
                below.setPermutation(BlockPermutation.resolve('minecraft:air'));
            }
        },
        onRandomTick(e) {
            const { block } = e;
            const { x, y, z } = block.location;
            const entities = block.dimension.getEntities({
                type: 'ff:fridge_inventory_freezer',
                location: { x: x + 0.5, y: y + 0.5, z: z + 0.5 },
                maxDistance: 2
            });
            const freezeMap = {
                'minecraft:beef': 'ff:frozen_beef_raw',
                'minecraft:porkchop': 'ff:frozen_porkchop_raw',
                'minecraft:rabbit': 'ff:frozen_rabbit_raw',
                'minecraft:chicken': 'ff:frozen_chicken_raw',
                'minecraft:mutton': 'ff:frozen_mutton_raw',
                'minecraft:salmon': 'ff:frozen_fish_salmon_raw',
                'minecraft:cod': 'ff:frozen_fish_raw',
                'minecraft:tropical_fish': 'ff:frozen_fish_clownfish_raw',
                'minecraft:ice': 'minecraft:packed_ice',
                'minecraft:water_bucket': 'minecraft:ice',
                'minecraft:lava_bucket': 'minecraft:obsidian',
            };
            
            for (const entity of entities) {
                const entityX = Math.floor(entity.location.x);
                const entityY = Math.floor(entity.location.y);
                const entityZ = Math.floor(entity.location.z);
                
                let found = false;
                for (let dx = -1; dx <= 1 && !found; dx++) {
                    for (let dy = -1; dy <= 1 && !found; dy++) {
                        for (let dz = -1; dz <= 1 && !found; dz++) {
                            const nearBlock = block.dimension.getBlock({
                                x: entityX + dx,
                                y: entityY + dy,
                                z: entityZ + dz
                            });
                            if (
                                nearBlock &&
                                nearBlock.typeId.startsWith('ff:fridge_') &&
                                nearBlock.permutation?.getState('ff:fridge_bottom')
                            ) {
                                found = true;
                            }
                        }
                    }
                }
                if (!found) continue;
                
                const inv = entity.getComponent("minecraft:inventory");
                const c = inv?.container;
                if (c) {
                    for (let slot = 0; slot < 5; slot++) {
                        const item = c.getItem(slot);
                        if (item && freezeMap[item.typeId]) {
                            const frozenItem = new ItemStack(freezeMap[item.typeId], item.amount);
                            c.setItem(slot, frozenItem);
                        }
                    }
                }
            }
        }
    });

    

    ffh.blockComponentRegistry.registerCustomComponent('ff:flower_pot_interaction', {
        beforeOnPlayerPlace(e) {
            try {
                const p = e.permutationToPlace;
                if (!p) return;
                let newPerm = p;
                if (p.hasState && p.hasState('ff:has_flower')) {
                    newPerm = newPerm.withState('ff:has_flower', 'none');
                }
                e.permutationToPlace = newPerm;
            } catch {}
        },
        onPlayerInteract(e) {
            const { block, player, dimension } = e;
            if (!block || !player) return;

            const validStates = new Set(['yellow_flower','red_flower','blue_orchid','allium','azure_bluet','red_tulip','orange_tulip','white_tulip','pink_tulip','oxeye_daisy','cornflower','lily_of_the_valley','rose_bush','lilac','peony','bamboo']);
            const largeStates = new Set(['rose_bush','lilac','peony','bamboo']);

            const ITEM_TO_STATE = new Map([

                ['minecraft:yellow_flower', 'yellow_flower'],
                ['minecraft:dandelion', 'yellow_flower'],

                ['minecraft:red_flower', 'red_flower'],
                ['minecraft:poppy', 'red_flower'],

                ['minecraft:blue_orchid', 'blue_orchid'],
                ['minecraft:allium', 'allium'],
                ['minecraft:azure_bluet', 'azure_bluet'],
                ['minecraft:red_tulip', 'red_tulip'],
                ['minecraft:orange_tulip', 'orange_tulip'],
                ['minecraft:white_tulip', 'white_tulip'],
                ['minecraft:pink_tulip', 'pink_tulip'],
                ['minecraft:oxeye_daisy', 'oxeye_daisy'],
                ['minecraft:cornflower', 'cornflower'],
                ['minecraft:lily_of_the_valley', 'lily_of_the_valley'],
                ['minecraft:rose_bush', 'rose_bush'],
                ['minecraft:lilac', 'lilac'],
                ['minecraft:peony', 'peony'],
                ['minecraft:bamboo', 'bamboo']
            ]);

            const STATE_TO_ITEM = new Map([
                ['yellow_flower', 'minecraft:dandelion'],
                ['red_flower', 'minecraft:poppy'],
                ['blue_orchid', 'minecraft:blue_orchid'],
                ['allium', 'minecraft:allium'],
                ['azure_bluet', 'minecraft:azure_bluet'],
                ['red_tulip', 'minecraft:red_tulip'],
                ['orange_tulip', 'minecraft:orange_tulip'],
                ['white_tulip', 'minecraft:white_tulip'],
                ['pink_tulip', 'minecraft:pink_tulip'],
                ['oxeye_daisy', 'minecraft:oxeye_daisy'],
                ['cornflower', 'minecraft:cornflower'],
                ['lily_of_the_valley', 'minecraft:lily_of_the_valley'],
                ['rose_bush', 'minecraft:rose_bush'],
                ['lilac', 'minecraft:lilac'],
                ['peony', 'minecraft:peony'],
                ['bamboo', 'minecraft:bamboo']
            ]);

            const current = block.permutation.getState('ff:flower');
            const hasState = block.permutation.getState('ff:has_flower');
            const hasFlower = hasState && hasState !== 'none';
            const selected = Utils.getSelectedItem(player);

            if (player.isSneaking) {
                if (hasFlower && current && validStates.has(current)) {
                    const dropId = STATE_TO_ITEM.get(current);
                    if (dropId) {
                        try { Utils.spawnItemAtBlock(dimension, new ItemStack(dropId, 1), block, 0.75); } catch {}
                    }
                    try {
                        block.setPermutation(block.permutation
                            .withState('ff:has_flower', 'none')
                            .withState('ff:flower', current));
                    } catch {}
                    Utils.playSoundForPlayer(player, 'random.pop');
                }
                return;
            }

            if (!selected) return;
            const nextState = ITEM_TO_STATE.get(selected.typeId);
            if (!nextState) return;

            if (hasFlower && current === nextState) return;

            if (hasFlower && current && validStates.has(current)) {
                const dropId = STATE_TO_ITEM.get(current);
                if (dropId) {
                    try { Utils.spawnItemAtBlock(dimension, new ItemStack(dropId, 1), block, 0.75); } catch {}
                }
            }

            try { Utils.consumeItem(player, selected); } catch {}
            try {
                const sizeState = largeStates.has(nextState) ? 'large' : 'small';
                block.setPermutation(block.permutation
                    .withState('ff:has_flower', sizeState)
                    .withState('ff:flower', nextState));
            } catch {}
            Utils.playSoundForPlayer(player, 'block.grass.place');
        }
        ,
        onPlayerDestroy(e) {
            const destroyedPerm = e.destroyedBlockPermutation;
            if (!destroyedPerm) return;

            try {
                const has = destroyedPerm.getState && destroyedPerm.getState('ff:has_flower');
                if (has !== 'small' && has !== 'large') return;
            } catch { return; }

            let current = null;
            try {
                if (destroyedPerm.getState) current = destroyedPerm.getState('ff:flower');
            } catch {}
            if (!current) return;

            // Flowers mapping
            const STATE_TO_ITEM = new Map([
                ['yellow_flower', 'minecraft:dandelion'],
                ['red_flower', 'minecraft:poppy'],
                ['blue_orchid', 'minecraft:blue_orchid'],
                ['allium', 'minecraft:allium'],
                ['azure_bluet', 'minecraft:azure_bluet'],
                ['red_tulip', 'minecraft:red_tulip'],
                ['orange_tulip', 'minecraft:orange_tulip'],
                ['white_tulip', 'minecraft:white_tulip'],
                ['pink_tulip', 'minecraft:pink_tulip'],
                ['oxeye_daisy', 'minecraft:oxeye_daisy'],
                ['cornflower', 'minecraft:cornflower'],
                ['lily_of_the_valley', 'minecraft:lily_of_the_valley'],
                ['rose_bush', 'minecraft:rose_bush'],
                ['lilac', 'minecraft:lilac'],
                ['peony', 'minecraft:peony'],
                ['bamboo', 'minecraft:bamboo']
            ]);

            const dropId = STATE_TO_ITEM.get(current);
            if (!dropId) return;

            const loc = { x: e.block.location.x + 0.5, y: e.block.location.y + 0.75, z: e.block.location.z + 0.5 };
            try { e.dimension.spawnItem(new ItemStack(dropId, 1), loc); } catch {}
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:stool_add_couch', {
        onPlayerInteract: e => {
            const type = ComponentRegistry.deriveWoodType(e.block, true);
            if (!type) return;
            CouchSystem.addCushion(e.player, e.block, type, true);
        }
    });
    ffh.blockComponentRegistry.registerCustomComponent('ff:add_couch', {
        onPlayerInteract: e => {
            const type = ComponentRegistry.deriveWoodType(e.block, false);
            if (!type) return;
            CouchSystem.addCushion(e.player, e.block, type, false);
        }
    });
    ffh.blockComponentRegistry.registerCustomComponent('ff:stool_remove_couch', {
        onPlayerInteract: e => {
            const type = ComponentRegistry.deriveWoodType(e.block, true);
            if (!type) return;
            CouchSystem.removeCushion(e.player, e.block, type, true);
        },
        onPlayerDestroy: e => {
            const player = e.player;
            if (!player || player.getGameMode() === GameMode.creative) return;
            const destroyedPerm = e.destroyedBlockPermutation;
            if (!destroyedPerm) return;
            const oldId = destroyedPerm.type.id;
            const loc = { x: e.block.location.x + 0.5, y: e.block.location.y + 0.5, z: e.block.location.z + 0.5 };
            const baseId = oldId.endsWith("_with_wool") ? oldId.replace("_with_wool", "") : oldId;
            e.dimension.spawnItem(new ItemStack(baseId, 1), loc);
            let dropCush = false;
            try {
                if (destroyedPerm.getState && destroyedPerm.hasState && destroyedPerm.hasState("ff:has_wool")) {
                    dropCush = destroyedPerm.getState("ff:has_wool") === 1;
                }
            } catch {}
            if (dropCush || oldId.endsWith("_with_wool")) {
                e.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), loc);
            }
        }
    });
    ffh.blockComponentRegistry.registerCustomComponent('ff:remove_couch', {
        onPlayerInteract: e => {
            const type = ComponentRegistry.deriveWoodType(e.block, false);
            if (!type) return;
            CouchSystem.removeCushion(e.player, e.block, type, false);
        },
        onPlayerDestroy: e => {
            const player = e.player;
            if (!player || player.getGameMode() === GameMode.creative) return;
            const destroyedPerm = e.destroyedBlockPermutation;
            if (!destroyedPerm) return;
            const oldId = destroyedPerm.type.id;
            const loc = { x: e.block.location.x + 0.5, y: e.block.location.y + 0.5, z: e.block.location.z + 0.5 };
            const baseId = oldId.endsWith("_with_wool") ? oldId.replace("_with_wool", "") : oldId;
            e.dimension.spawnItem(new ItemStack(baseId, 1), loc);
            let dropCush = false;
            try {
                if (destroyedPerm.getState && destroyedPerm.hasState && destroyedPerm.hasState("ff:has_wool")) {
                    dropCush = destroyedPerm.getState("ff:has_wool") === 1;
                }
            } catch {}
            if (dropCush || oldId.endsWith("_with_wool")) {
                e.dimension.spawnItem(new ItemStack("ff:white_cushion", 1), loc);
            }
        }
    });

    ComponentRegistry.registerItemInteractionComponent(ffh.blockComponentRegistry, 'ff:paper_fill', {
        stateName: 'ff:paper',
        requiredItem: 'ff:toilet_paper_item',
        addStates: { 0: 9 },
        addSound: 'random.pop',
        removeState: 2,
        resetState: 0,
        removeSound: 'random.pop2',
        spawnItems: ['ff:bread_slice', 'ff:bread_slice']
    });

    
    ffh.blockComponentRegistry.registerCustomComponent("ff:add_item", {
        onPlayerInteract: result => {
            const { block, player, face } = result;
            if (player.isSneaking || face !== "Up") return;
            const equippable = player.getComponent("minecraft:equippable");
            let item = equippable.getEquipment("Mainhand");
            if (item && (item.typeId == 'ff:pancake' || item.typeId == 'ff:waffle')) return;
            const inv = player.getComponent("minecraft:inventory").container;
            const dim = block.dimension;
            const center = block.center();

            let entity = dim.getEntitiesAtBlockLocation(center)
                            .find(e => e.typeId === "ff:pan_bottom_left");

            if (!item && entity) {
                const itemTag = entity.getTags().find(t => t.startsWith("item:"));
                if (itemTag) {
                    try {
                        const itemData = JSON.parse(itemTag.slice(5));
                        const restored = new ItemStack(itemData.typeId, itemData.amount);
                        if (itemData.nameTag) restored.nameTag = itemData.nameTag;
                        if (itemData.lore) restored.setLore(itemData.lore);
                        if (itemData.enchantments) {
                            const enchComp = restored.getComponent("minecraft:enchantable");
                            if (enchComp) {
                                for (const ench of itemData.enchantments) {
                                    enchComp.addEnchantment({ type: new EnchantmentType(ench.id), level: ench.level });
                                }
                            }
                        }
                        inv.addItem(restored);
                    } catch (e) {
                        const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                        if (fallbackId) inv.addItem(new ItemStack(fallbackId, 1));
                    }
                } else {
                    const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                    if (fallbackId) inv.addItem(new ItemStack(fallbackId, 1));
                }
                entity.runCommand(`event entity @s ff:kill`);
                dim.runCommand(
                    `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:kill`
                );
                entity.runCommand(`event entity @s ff:despawn`);
                dim.runCommand(
                    `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
                return;
            }

            if (item && !entity) {
                entity = dim.spawnEntity("ff:pan_bottom_left", {
                    x: center.x, y: center.y - 0.5, z: center.z
                });
                const enchComp = item.getComponent("minecraft:enchantable");
                const enchantments = enchComp ? enchComp.getEnchantments().map(e => ({ id: e.type.id, level: e.level })) : undefined;
                const itemData = {
                    typeId: item.typeId,
                    amount: 1,
                    nameTag: item.nameTag,
                    lore: item.getLore ? item.getLore() : undefined,
                    enchantments: enchantments && enchantments.length > 0 ? enchantments : undefined
                };
                entity.addTag(item.typeId);
                entity.addTag("item:" + JSON.stringify(itemData));
                entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1`);
                const slot = player.selectedSlotIndex;
                if (item.amount > 1) {
                    item.amount--;
                    inv.setItem(slot, item);
                } else {
                    inv.setItem(slot, undefined);
                }
                return;
            }

        },
        onPlayerDestroy: result => {
            const { block } = result;
            const dim = block.dimension;
            const center = block.center();
            let entity = dim.getEntitiesAtBlockLocation(center)
                            .find(e => e.typeId === "ff:pan_bottom_left");
            if (entity) {
                const itemTag = entity.getTags().find(t => t.startsWith("item:"));
                if (itemTag) {
                    try {
                        const itemData = JSON.parse(itemTag.slice(5));
                        const restored = new ItemStack(itemData.typeId, itemData.amount);
                        if (itemData.nameTag) restored.nameTag = itemData.nameTag;
                        if (itemData.lore) restored.setLore(itemData.lore);
                        if (itemData.enchantments) {
                            const enchComp = restored.getComponent("minecraft:enchantable");
                            if (enchComp) {
                                for (const ench of itemData.enchantments) {
                                    enchComp.addEnchantment({ type: new EnchantmentType(ench.id), level: ench.level });
                                }
                            }
                        }
                        dim.spawnItem(restored, {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    } catch (e) {
                        const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                        if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    }
                } else {
                    const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                    if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                        x: block.location.x + 0.5,
                        y: block.location.y + 1,
                        z: block.location.z + 0.5
                    });
                }
                entity.runCommand(`event entity @s ff:kill`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:kill`
                );
                entity.runCommand(`event entity @s ff:despawn`);
                dim.runCommand(
                `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
            }
        },
        onDestroy: result => {
            const { block } = result;
            const dim = block.dimension;
            const center = block.center();
            let entity = dim.getEntitiesAtBlockLocation(center)
                            .find(e => e.typeId === "ff:pan_bottom_left");
            if (entity) {
                const itemTag = entity.getTags().find(t => t.startsWith("item:"));
                if (itemTag) {
                    try {
                        const itemData = JSON.parse(itemTag.slice(5));
                        const restored = new ItemStack(itemData.typeId, itemData.amount);
                        if (itemData.nameTag) restored.nameTag = itemData.nameTag;
                        if (itemData.lore) restored.setLore(itemData.lore);
                        if (itemData.enchantments) {
                            const enchComp = restored.getComponent("minecraft:enchantable");
                            if (enchComp) {
                                for (const ench of itemData.enchantments) {
                                    enchComp.addEnchantment({ type: new EnchantmentType(ench.id), level: ench.level });
                                }
                            }
                        }
                        dim.spawnItem(restored, {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    } catch (e) {
                        const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                        if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    }
                } else {
                    const fallbackId = entity.getTags().find(t => !t.startsWith("item:"));
                    if (fallbackId) dim.spawnItem(new ItemStack(fallbackId, 1), {
                        x: block.location.x + 0.5,
                        y: block.location.y + 1,
                        z: block.location.z + 0.5
                    });
                }
                entity.runCommand(`event entity @s ff:kill`);
                dim.runCommand(
                  `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:kill`
                );
                entity.runCommand(`event entity @s ff:despawn`);
                dim.runCommand(
            `execute at @e[type=ff:pan_bottom_left] positioned ${block.location.x} ${block.location.y} ${block.location.z} run event entity @e[type=ff:pan_bottom_left,r=0.5] ff:despawn`
                );
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent(`ff:curtain_oak`, {
            beforeOnPlayerPlace(e) {
                if (!e.permutationToPlace || !e.permutationToPlace.typeId || !e.permutationToPlace.typeId.startsWith('ff:white_curtain_')) return;
                let perm = e.permutationToPlace;
                perm = applyStates(perm, {
                    'ff:left_connection': 0,
                    'ff:right_connection': 0,
                    'ff:above_connection': 0,
                    'ff:below_connection': 0
                });
                e.permutationToPlace = perm;
            },
            onPlace(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                CurtainSystem.updateSelfAndNeighbors(e.block);
            },
            afterOnPlayerPlace(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                CurtainSystem.updateSelfAndNeighbors(e.block);
            },
            onPlayerInteract(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                const current = e.block.permutation.getState('ff:open') || 0;
                const next = current === 1 ? 0 : 1;
                CurtainSystem.propagateCurtainOpen(e.block, next);
                e.player.playSound(current === 1 ? 'block.wooden_trapdoor.close' : 'block.wooden_trapdoor.open');
            },
            onPlayerDestroy(e) {
                if (!e.block || !e.block.typeId || !e.block.typeId.startsWith('ff:white_curtain_')) return;
                const neighbors = CurtainSystem.getCurtainNeighbors(e.block);
                for (const neighbor of Object.values(neighbors)) {
                    if (CurtainSystem.isCurtainBlock(neighbor)) {
                        CurtainSystem.updateCurtainConnections(neighbor);
                    }
                }
            }
        });

    ffh.blockComponentRegistry.registerCustomComponent("ff:laptop_on_table", {
        onPlace(e) {
            const { block } = e;
            
            if (block.permutation.getState("ff:on_table") === false) {
                const blockBelow = block.dimension.getBlock({
                    x: block.location.x,
                    y: block.location.y - 1,
                    z: block.location.z
                });

                if (blockBelow && blockBelow.typeId.endsWith("_coffee_table")) {
                    block.setPermutation(block.permutation.withState("ff:on_table", true));
                } else {
                    block.setPermutation(block.permutation.withState("ff:on_table", false));
                }
            }
            
            if (block.typeId.endsWith("_coffee_table")) {
                const blockAbove = block.dimension.getBlock({
                    x: block.location.x,
                    y: block.location.y + 1,
                    z: block.location.z
                });

                if (blockAbove && (blockAbove.permutation.getState("ff:on_table") === false)) {
                    blockAbove.setPermutation(blockAbove.permutation.withState("ff:on_table", true));
                }
            }
        },

        onPlayerDestroy(e) {
            const { block } = e;
            const blockAbove = block.dimension.getBlock({
                x: block.location.x,
                y: block.location.y + 1,
                z: block.location.z
            });

            if (blockAbove && (blockAbove.permutation.getState("ff:on_table") === true)) {
                blockAbove.setPermutation(blockAbove.permutation.withState("ff:on_table", false));
            }
        },

        onDestroy(e) {
            const { block } = e;
            const blockAbove = block.dimension.getBlock({
                x: block.location.x,
                y: block.location.y + 1,
                z: block.location.z
            });

            if (blockAbove && (blockAbove.permutation.getState("ff:on_table") === true)) {
                blockAbove.setPermutation(blockAbove.permutation.withState("ff:on_table", false));
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:feldspar_ore_xp_reward", {
        onPlayerDestroy({ block, dimension, player }) {
            const xpAmount = randomInt(0, 3);

            for (let i = 0; i < xpAmount; i++) {
                dimension.spawnEntity("minecraft:xp_orb", block.location);
            }
        },
    });

    function ffGetSelectedItem(player) {
        const inventory = player.getComponent("minecraft:inventory")?.container;
        const slot = player.selectedSlotIndex;
        if (!inventory || typeof slot !== "number" || slot < 0 || slot >= inventory.size) return null;
        return inventory.getItem(slot);
    }

    ffh.blockComponentRegistry.registerCustomComponent("ff:switch", {
        onPlayerInteract: e => {
            const { player, block } = e;

            if (player.isSneaking) {
                e.cancel = true;
                return;
            }

            const item = ffGetSelectedItem(player);

            if (item && item.typeId === "ff:wrench") {
                Utils.playSoundForPlayer(player, "random.click");
                e.cancel = true;
                return;
            }

            if (item && item.typeId === "minecraft:breeze_rod") {
                Utils.playSoundForPlayer(player, "random.pop2");
                return;
            }

            Utils.playSoundForPlayer(player, "random.click");
            const enable = block.permutation.withState("ff:switch_type", true);
            const disable = block.permutation.withState("ff:switch_type", false);

            if (Utils.getBlockState(block, "ff:switch_type") === false) {
                block.setPermutation(enable);
                return;
            }
            if (Utils.getBlockState(block, "ff:switch_type") === true) {
                block.setPermutation(disable);
                return;
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:single_interactive", {
        onPlayerInteract: e => {
            const { player } = e;
            Utils.playSoundForPlayer(player, "random.clickss");
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:toilet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const toilet_open = block.permutation.withState("ff:bathroom_vars", 1);
            const toilet_function = block.permutation.withState("ff:bathroom_vars", 2);
            const toilet_close = block.permutation.withState("ff:bathroom_vars", 0);
            
            if (player.isSneaking) {
                const currentState = Utils.getBlockState(block, "ff:bathroom_vars");
                if (currentState === 0) {
                    block.setPermutation(toilet_open);
                } else if (currentState === 1) {
                    block.setPermutation(toilet_function);
                    Utils.playSoundForPlayer(player, "ff:toilet");
                } else if (currentState === 2) {
                    block.setPermutation(toilet_close);
                }
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:on_player_place', {
        beforeOnPlayerPlace: e => {
            const { block } = e;
            if (block.typeId.includes("water") || block.typeId.includes("lava")) {
                e.cancel = true;
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:summoning_light", {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;

            const name = block.typeId.split(":")[1];
            const isFan = name.includes("fan");
            const entityType = isFan ? "ff:ff_ceiling_fan" : "ff:ff_ceiling_light";

            const cx = x + 0.5;
            const cy = isFan ? y - 0 : y;
            const cz = z + 0.5;

            if (!isFan && Utils.getBlockState(block, "ff:lamp_state")) {
                block.dimension.runCommand(`particle ff:ff_light_ray ${x} ${y + 0.8} ${z}`);
            }

            if (isFan && Utils.getBlockState(block, "ff:lamp_state")) {
                block.dimension.runCommand(`particle ff:ff_light_ray ${x} ${y + 0} ${z}`);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:tv_weather_channel', {
        onTick({ block }) {
            WeatherSystem.updateTVChannel(block);
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_cinder_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block, player } = e;
            if (!player || !player.getComponent('equippable')) {
                return;
            }
            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            const isPickaxe = selectedItem && selectedItem.hasTag('minecraft:is_axe');
            if (isPickaxe) {
                const slabItem = new ItemStack('ff:cinder_slab', 1);
                e.dimension.spawnItem(slabItem, block.location);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_maple_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block, player } = e;
            if (!player || !player.getComponent('equippable')) {
                return;
            }
            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            const isPickaxe = selectedItem && selectedItem.hasTag('minecraft:is_axe');
            if (isPickaxe) {
                const slabItem = new ItemStack('ff:maple_slab', 1);
                e.dimension.spawnItem(slabItem, block.location);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_cinder_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem?.typeId === 'ff:cinder_slab' && !block.permutation.getState('ff:double')) {
                const verticalHalf = block.permutation.getState('minecraft:vertical_half');
                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';
                if (isBottomUp || isTopDown) {
                    if (player.getGameMode() !== "creative") {
                        selectedItem.amount -= 1;
                        if (selectedItem.amount === 0) {
                            equipment.setEquipment('Mainhand', undefined);
                        } else {
                            equipment.setEquipment('Mainhand', selectedItem);
                        }
                    }
                    block.setPermutation(block.permutation.withState('ff:double', true));
                    block.setWaterlogged(false);
                    player.playSound('use.wood');
                }
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_maple_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem?.typeId === 'ff:maple_slab' && !block.permutation.getState('ff:double')) {
                const verticalHalf = block.permutation.getState('minecraft:vertical_half');
                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';
                if (isBottomUp || isTopDown) {
                    if (player.getGameMode() !== "creative") {
                        selectedItem.amount -= 1;
                        if (selectedItem.amount === 0) {
                            equipment.setEquipment('Mainhand', undefined);
                        } else {
                            equipment.setEquipment('Mainhand', selectedItem);
                        }
                    }
                    block.setPermutation(block.permutation.withState('ff:double', true));
                    block.setWaterlogged(false);
                    player.playSound('use.wood');
                }
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_spicewood_on_player_destroy', {
        onPlayerDestroy(e) {
            const { block, player } = e;
            if (!player || !player.getComponent('equippable')) {
                return;
            }
            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            const isPickaxe = selectedItem && selectedItem.hasTag('minecraft:is_axe');
            if (isPickaxe) {
                const slabItem = new ItemStack('ff:spicewood_slab', 1);
                e.dimension.spawnItem(slabItem, block.location);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:slab_spicewood_on_interact', {
        onPlayerInteract(e) {
            const { block, player, face } = e;
            console.warn(`Interacted face: ${face}`);
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem?.typeId === 'ff:spicewood_slab' && !block.permutation.getState('ff:double')) {
                const verticalHalf = block.permutation.getState('minecraft:vertical_half');
                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';
                if (isBottomUp || isTopDown) {
                    if (player.getGameMode() !== "creative") {
                        selectedItem.amount -= 1;
                        if (selectedItem.amount === 0) {
                            equipment.setEquipment('Mainhand', undefined);
                        } else {
                            equipment.setEquipment('Mainhand', selectedItem);
                        }
                    }
                    block.setPermutation(block.permutation.withState('ff:double', true));
                    block.setWaterlogged(false);
                    player.playSound('use.wood');
                }
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:cinder_trapdoor_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const currentState = block.permutation.getState('ff:open');
            const newOpenState = !currentState;
            const newPermutation = BlockPermutation.resolve(block.typeId, {
                ...block.permutation.getAllStates(),
                'ff:open': newOpenState
            });
            block.setPermutation(newPermutation);
            const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
            player.playSound(sound);
        }
    });

    
    ffh.blockComponentRegistry.registerCustomComponent('ff:maple_trapdoor_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const currentState = block.permutation.getState('ff:open');
            const newOpenState = !currentState;
            const newPermutation = BlockPermutation.resolve(block.typeId, {
                ...block.permutation.getAllStates(),
                'ff:open': newOpenState
            });
            block.setPermutation(newPermutation);
            const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
            player.playSound(sound);
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:spicewood_trapdoor_on_interact', {
        onPlayerInteract(e) {
            const { block, player } = e;
            const currentState = block.permutation.getState('ff:open');
            const newOpenState = !currentState;
            const newPermutation = BlockPermutation.resolve(block.typeId, {
                ...block.permutation.getAllStates(),
                'ff:open': newOpenState
            });
            block.setPermutation(newPermutation);
            const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
            player.playSound(sound);
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:christmas_stocking_vars", {
        onPlace: (onPlaceEvent => {
          onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
        })
    });
  
    ffh.blockComponentRegistry.registerCustomComponent("ff:gravestone_vars", {
        onPlace: (onPlaceEvent => {
          onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
        })
    });

    ffh.blockComponentRegistry.registerCustomComponent(
      "ff:fan_elevador",
      {
        onStepOn: (event) => {
          const { block, entity } = event;
          
          if (!entity.isValid() || entity.typeId !== 'minecraft:player') {
            entity.applyImpulse({
              x: 0,
              y: 0.5,
              z: 0
            });
            return;
          }
          
          const currentCount = playerJumpCounts.get(entity.id) || 0;
          
          let impulseY = 0.5;
          if (currentCount > 0) {
            impulseY = Math.min(0.5 + (currentCount * 0.2), 3);
          }
          
          entity.applyImpulse({
            x: 0,
            y: impulseY,
            z: 0
          });
          
          playerJumpCounts.set(entity.id, currentCount + 1);
          
          system.runTimeout(() => {
            const currentCount = playerJumpCounts.get(entity.id);
            if (currentCount) {
              playerJumpCounts.set(entity.id, 0);
            }
          }, 50);
        },
      }
    );
    
    ffh.blockComponentRegistry.registerCustomComponent('ff:water_particle', {
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            if (Math.floor(Math.random() * 40) === 0 && block.permutation.getState("ff:sink_vars") === 1) {
                block.dimension.spawnParticle("minecraft:water_drip_particle", { x: block.location.x + 0.5, y: block.location.y + 1.2, z: block.location.z + 0.5 });
            }
        },
    });

    const FF_isNearClimbTag = (player) => {
        try {
            if (!player?.isValid()) return false;
            const dim = player.dimension;
            const base = player.location;
            for (let dy = 0; dy <= 1; dy++) {
                const y = Math.floor(base.y) + dy;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const bx = Math.floor(base.x) + dx;
                        const bz = Math.floor(base.z) + dz;
                        const b = dim.getBlock({ x: bx, y, z: bz });
                        if (b && b.permutation?.hasTag?.("ff:can_climb")) return true;
                    }
                }
            }
        } catch {}
        return false;
    };

    Player.prototype.climb = function () {
        const block = this.dimension.getBlock(this.location);
        if (!block?.permutation?.hasTag?.("ff:can_climb")) return;
      
        this.isJumping && !this.isSneaking ? this.applyKnockback(0, 0, 0, 0.2) : this.applyKnockback(0, 0, 0, -0.06);
      
        if (this.isSneaking && !this.isJumping) {
          this.applyKnockback(0, 0, 0, 0.04);
        }
      };
      
      system.runInterval(() => {
          for (const player of world.getPlayers()) {
              player.climb();

              const near = FF_isNearClimbTag(player);
              try {
                  if (near) {
                      try { player.runCommandAsync('effect @s slow_falling 1 1 true'); } catch {}
                      try { if (!player.hasTag('ff:rope_slow')) player.addTag('ff:rope_slow'); } catch {}
                  } else {
                      try {
                          if (player.hasTag?.('ff:rope_slow')) {
                              if (player.getEffect?.('minecraft:slow_falling')) {
                                  player.removeEffect('minecraft:slow_falling');
                              }
                              player.removeTag?.('ff:rope_slow');
                          }
                      } catch {}
                  }
              } catch {}
          }
      });

    ffh.blockComponentRegistry.registerCustomComponent('ff:smoke_toaster', {
        onTick: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const toasterState = block.permutation.getState("ff:toaster_with_breads");
            if ((toasterState === 3 || toasterState === 4) && Math.floor(Math.random() * 10) === 0) {
                block.dimension.spawnParticle("ff:toast_smoke", { x: block.location.x + 0.55, y: block.location.y + 0.5, z: block.location.z + 0.50 });
            }
        },
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:outlet_function', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const { x, y, z } = block.location;
            const selectedItem = Utils.getSelectedItem(player);
            const currentState = Utils.getBlockState(block, "ff:outlet_function");

            if (!player.isSneaking && selectedItem && selectedItem.typeId === 'ff:fork' && currentState === 0) {
                Utils.setBlockState(block, "ff:outlet_function", 1);
                Utils.playSoundForPlayer(player, "random.pop2");
                Utils.consumeItem(player, selectedItem);
            } else if (!player.isSneaking && currentState === 1) {
                Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:fork"), block);
                Utils.setBlockState(block, "ff:outlet_function", 0);
                Utils.playSoundForPlayer(player, "random.pop");
            } else if (!player.isSneaking && currentState === 2) {
                block.dimension.runCommand(`title @p actionbar §6 It's too late...`);
            }
        },
        onTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            const currentState = Utils.getBlockState(block, "ff:outlet_function");

            if (currentState === 1) {
                block.dimension.spawnParticle("ff:smoke_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                Utils.setBlockState(block, "ff:outlet_function", 2);
            } else if (currentState === 2) {
                block.dimension.spawnParticle("ff:elec_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                block.dimension.spawnParticle("ff:smoke_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                Utils.setBlockState(block, "ff:outlet_function", 3);
            } else if (currentState === 3) {
                                block.dimension.createExplosion(
          { x: x + 0.5, y: y + 0.5, z: z + 0.5 },
          4,
          { breaksBlocks: false, causesFire: true }
        );
                block.setPermutation(BlockPermutation.resolve('minecraft:air'));
                block.dimension.spawnParticle("ff:elec_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
                block.dimension.spawnParticle("ff:smoke_fork", { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:give_breads', {
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

                const nearbyPlayers = block.dimension.getPlayers({ location: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, maxDistance: 8 });
                for (const nearbyPlayer of nearbyPlayers) {
                    nearbyPlayer.playSound('ff:toast_finish');
                }
                block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
            if (block.permutation.getState("ff:toaster_with_breads") === 4) {
                block.setPermutation(finish_execute_toaster2);
                
                const nearbyPlayers = block.dimension.getPlayers({ location: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, maxDistance: 8 });
                for (const nearbyPlayer of nearbyPlayers) {
                    nearbyPlayer.playSound('ff:toast_finish');
                }
                block.dimension.spawnItem(breadtoastedGive, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                block.dimension.spawnItem(breadtoastedGive2, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
            }
            if (Math.random() < 0.09 && block.permutation.getState("ff:toaster_with_breads") === 3) {
                block.dimension.spawnParticle("ff:pan_smoke", { x: x, y: y + 0.1, z: z });
            }
            if (Math.random() < 0.09 && block.permutation.getState("ff:toaster_with_breads") === 4) {
                block.dimension.spawnParticle("ff:pan_smoke", { x: x, y: y + 0.1, z: z });
            }
        },
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:add_breads', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const selectedItem = Utils.getSelectedItem(player);
            const currentState = Utils.getBlockState(block, "ff:toaster_with_breads");
            
            if (!player.isSneaking && selectedItem && selectedItem.typeId === 'ff:bread_slice') {
                if (currentState === 0) {
                    Utils.setBlockState(block, "ff:toaster_with_breads", 1);
                    Utils.playSoundForPlayer(player, "random.pop");
                    Utils.consumeItem(player, selectedItem);
                } else if (currentState === 1) {
                    Utils.setBlockState(block, "ff:toaster_with_breads", 2);
                    Utils.playSoundForPlayer(player, "random.pop");
                    Utils.consumeItem(player, selectedItem);
                }
            } else if (!player.isSneaking && currentState === 2) {
                Utils.setBlockState(block, "ff:toaster_with_breads", 0);
                Utils.playSoundForPlayer(player, "random.pop2");
                Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:bread_slice"), block);
                Utils.spawnItemAtBlock(block.dimension, new ItemStack("ff:bread_slice"), block);
            }
        },
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:add_ff_stacked_book', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const stacked_book = Utils.getBlockState(block, "book:state");
            const book_s = block.permutation.withState("book:state", stacked_book + 1);
            const book_remove = block.permutation.withState("book:vertical_stacked", + 1);
            const selectedItem = Utils.getSelectedItem(player);
            
            if (selectedItem && selectedItem.typeId === 'ff:stacked_books' && Utils.getBlockState(block, "book:state") < 3) {
                Utils.playSoundForPlayer(player, "use.candle");
                block.setPermutation(book_s);
                Utils.consumeItem(player, selectedItem);
                return;
            }
            
            if (player.isSneaking && Utils.getBlockState(block, "book:state") === 3) {
                Utils.playSoundForPlayer(player, "fall.wood");
                block.setPermutation(book_remove);
                return;
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:sink_open_close', {
        onPlayerInteract: e => {
            const { player, block } = e;
            const currentState = Utils.getBlockState(block, "ff:sink_vars");
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const inventory = player.getComponent('minecraft:inventory').container;
            const slot = player.selectedSlotIndex;

            if (
                currentState === 1 &&
                selectedItem &&
                selectedItem.typeId === 'minecraft:bucket'
            ) {
                if (player.getGameMode() !== GameMode.creative) {
                    const waterBucket = new ItemStack('minecraft:water_bucket', 1);
                    const success = inventory.addItem(waterBucket);
                    if (success === false) {
                        const dropLoc = { x: player.location.x, y: player.location.y + 0.5, z: player.location.z };
                        player.dimension.spawnItem(waterBucket, dropLoc);
                    }

                    const newAmount = Math.max(0, (selectedItem.amount || 1) - 1);
                    if (newAmount > 0) {
                        selectedItem.amount = newAmount;
                        equipment.setEquipment('Mainhand', selectedItem);
                    } else {
                        equipment.setEquipment('Mainhand', undefined);
                    }

                    Utils.playSoundForPlayer(player, 'bucket.fill_water');
                } else {
                    const waterBucket = new ItemStack('minecraft:water_bucket', 1);
                    const success = inventory.addItem(waterBucket);
                    if (success === false) {
                        const dropLoc = { x: player.location.x, y: player.location.y + 0.5, z: player.location.z };
                        player.dimension.spawnItem(waterBucket, dropLoc);
                    }
                    Utils.playSoundForPlayer(player, 'bucket.fill_water');
                }
                return;
            }

            if (currentState === 0) {
                Utils.setBlockState(block, "ff:sink_vars", 1);
                Utils.playSoundForPlayer(player, "mob.axolotl.splash");
            } else if (currentState === 1) {
                Utils.setBlockState(block, "ff:sink_vars", 0);
            }
        },
    });

    ffh.blockComponentRegistry.registerCustomComponent('ff:trash_items', {
        onPlayerInteract: e => {
            const { player } = e;
            const selectedItem = Utils.getSelectedItem(player);

            if (!player.isSneaking && selectedItem) {
                Utils.playSoundForPlayer(player, "random.pop2");
                Utils.consumeItem(player, selectedItem);
            }
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:adv_rot", {
        beforeOnPlayerPlace(event) {
            const { player } = event;
            if (!player) return;
            const blockFace = event.permutationToPlace.getState("minecraft:block_face");
            if (blockFace !== "up") return;
            const playerYRotation = player.getRotation().y;
            const rotation = getPreciseRotation(playerYRotation);
            event.permutationToPlace = event.permutationToPlace.withState("ff:block_rotation", rotation);
        }
    });

    ffh.blockComponentRegistry.registerCustomComponent("ff:spicewood_sapling", {
        onPlayerInteract: e => {
            const { player, block } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            
            if (selectedItem && selectedItem.typeId === 'minecraft:bone_meal') {
                const { x, y, z } = block.location;
                
                const saplingPositions = [
                    { x: x, y: y, z: z },
                    { x: x + 1, y: y, z: z },
                    { x: x, y: y, z: z + 1 },
                    { x: x + 1, y: y, z: z + 1 }
                ];
                
                let hasAllSaplings = true;
                let missingSaplings = [];
                for (const pos of saplingPositions) {
                    const checkBlock = block.dimension.getBlock(pos);
                    if (!checkBlock || checkBlock.typeId !== 'ff:spicewood_sapling') {
                        hasAllSaplings = false;
                        missingSaplings.push(`${pos.x},${pos.y},${pos.z}: ${checkBlock ? checkBlock.typeId : 'null'}`);
                    }
                }
                if (!hasAllSaplings) {
                }
                
                if (hasAllSaplings && Math.random() < 0.3) {
                    for (const pos of saplingPositions) {
                        const saplingBlock = block.dimension.getBlock(pos);
                        if (saplingBlock) {
                            saplingBlock.setPermutation(BlockPermutation.resolve('minecraft:air'));
                        }
                    }
                    
                    block.dimension.runCommand(`structure load spicewood_tree_large ${x - 5} ${y} ${z - 5}`);
                    
                    for (let i = 0; i < 3; i++) {
                        const randomX = x + Math.random();
                        const randomY = y + 0.5 + Math.random() * 0.8;
                        const randomZ = z + Math.random();
                        block.dimension.spawnParticle("minecraft:villager_happy", { x: randomX, y: randomY, z: randomZ });
                    }
                    
                    player.playSound("block.grass.place");
                    
                    if (player.getGameMode() !== GameMode.creative) {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                } else if (!hasAllSaplings && Math.random() < 0.3) {
                    const smallTreeType = Math.random() < 0.5 ? 'spicewood_tree_small_2' : 'spicewood_tree_small_3';
                    
                    block.setPermutation(BlockPermutation.resolve('minecraft:air'));
                    block.dimension.runCommand(`structure load ${smallTreeType} ${x - 1} ${y} ${z - 1}`);
                    
                    for (let i = 0; i < 3; i++) {
                        const randomX = x + Math.random();
                        const randomY = y + 0.5 + Math.random() * 0.8;
                        const randomZ = z + Math.random();
                        block.dimension.spawnParticle("minecraft:villager_happy", { x: randomX, y: randomY, z: randomZ });
                    }
                    
                    player.playSound("block.grass.place");
                    
                    if (player.getGameMode() !== GameMode.creative) {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                } else {
                    
                    for (let i = 0; i < 3; i++) {
                        const randomX = x + Math.random();
                        const randomY = y + 0.5 + Math.random() * 0.8;
                        const randomZ = z + Math.random();
                        block.dimension.spawnParticle("minecraft:villager_happy", { x: randomX, y: randomY, z: randomZ });
                    }
                    
                    player.playSound("block.grass.break");
                    
                    if (player.getGameMode() !== GameMode.creative) {
                        if (selectedItem.amount > 1) {
                            selectedItem.amount -= 1;
                            equipment.setEquipment('Mainhand', selectedItem);
                        } else {
                            equipment.setEquipment('Mainhand', undefined);
                        }
                    }
                }
            }
        },
        
        onRandomTick: e => {
            const { block } = e;
            const { x, y, z } = block.location;
            
            const lightBlock = block.dimension.getBlock({ x, y: y + 1, z });
            const lightLevel = lightBlock ? lightBlock.light : 0;
            
            if (lightLevel < 9) {
                return;
            }
            
            if (x % 2 !== 0 || z % 2 !== 0) return;
            
            const saplingPositions = [
                { x: x, y: y, z: z },
                { x: x + 1, y: y, z: z },
                { x: x, y: y, z: z + 1 },
                { x: x + 1, y: y, z: z + 1 }
            ];
            
            for (const pos of saplingPositions) {
                const checkBlock = block.dimension.getBlock(pos);
                if (!checkBlock || checkBlock.typeId !== 'ff:spicewood_sapling') {
                    return;
                }
            }
            
            const keyPositions = [
                { x: x, y: y + 1, z: z },
                { x: x + 1, y: y + 1, z: z },
                { x: x, y: y + 1, z: z + 1 },
                { x: x + 1, y: y + 1, z: z + 1 },
                { x: x, y: y + 2, z: z },
                { x: x + 1, y: y + 2, z: z },
                { x: x, y: y + 2, z: z + 1 },
                { x: x + 1, y: y + 2, z: z + 1 }
            ];
            
            for (const pos of keyPositions) {
                const checkBlock = block.dimension.getBlock(pos);
                if (checkBlock && checkBlock.typeId !== 'minecraft:air') {
                    return;
                }
            }
            
            const randomChance = Math.random();
            if (randomChance < 0.1) {
                block.dimension.runCommand(`structure load spicewood_tree_large ${x - 5} ${y} ${z - 5}`);
                
                for (const pos of saplingPositions) {
                    const saplingBlock = block.dimension.getBlock(pos);
                    if (saplingBlock) {
                        saplingBlock.setPermutation(BlockPermutation.resolve('minecraft:air'));
                    }
                }
                
                const nearbyPlayers = block.dimension.getPlayers({ location: { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, maxDistance: 16 });
                for (const player of nearbyPlayers) {
                    player.playSound('block.grass.place');
                }
            }
        }
    }); 


    ffh.blockComponentRegistry.registerCustomComponent("ff:vertical_connector", {
        onPlace: e => {
            const { block } = e;
            const targetTypeId = block.typeId;
            VerticalConnectionSystem.updateConnectedBlocks(block, targetTypeId);
        },

        afterOnPlayerPlace: e => {
            const { block } = e;
            const targetTypeId = block.typeId;
            VerticalConnectionSystem.updateConnectedBlocks(block, targetTypeId);
        },

        onTick: e => {
            const { block } = e;
            VerticalConnectionSystem.updateConnectedBlocks(block, block.typeId);
        },


        onPlayerDestroy: e => {
            const { block } = e;
            const targetTypeId = block.typeId;
            const direction = block.permutation.getState('minecraft:cardinal_direction');
            
            if (direction) {
                const { x, y, z } = block.location;
                const offset = VerticalConnectionSystem.getDirectionOffset(direction);
                
                system.runTimeout(() => {
                    const blocksToUpdate = [
                        block.dimension.getBlock({ x: x + offset.x, y: y + 1, z: z + offset.z }),
                        block.dimension.getBlock({ x: x + offset.x, y: y - 1, z: z + offset.z })
                    ];
                    
                    blocksToUpdate.forEach(updateBlock => {
                        if (updateBlock) {
                            VerticalConnectionSystem.updateBlockConnection(updateBlock, targetTypeId);
                        }
                    });
                }, 1);
            }
        }
    });
});

const breakBlockSubscription = world.afterEvents.playerBreakBlock.subscribe((data) => {
    WoodenSupportVerticalManager.updatewooden_support_verticalsAround(data.block);
});
eventSubscriptions.push(breakBlockSubscription);

const placeBlockSubscription = world.afterEvents.playerPlaceBlock.subscribe((data) => {
    WoodenSupportVerticalManager.updatewooden_support_verticalsAround(data.block);
});
eventSubscriptions.push(placeBlockSubscription);

const doorFrameBeforeBreakSub = world.beforeEvents.playerBreakBlock.subscribe((data) => {
    const b = data.block;
    if (!b) return;
    try {
        if (typeof DoorFrameSystem !== 'undefined' && DoorFrameSystem.isFrame(b)) {
            DoorFrameSystem.updateAround(b);
            return;
        }
        const neighbors = CurtainSystem.getCurtainNeighbors(b);
        for (const nb of Object.values(neighbors)) {
            if (nb && typeof DoorFrameSystem !== 'undefined' && DoorFrameSystem.isFrame(nb)) {
                DoorFrameSystem.updateAround(nb);
            }
        }
    } catch {}
});
eventSubscriptions.push(doorFrameBeforeBreakSub);

const doorFrameBreakSub = world.afterEvents.playerBreakBlock.subscribe((data) => {
    const b = data.block;
    if (!b) return;
    if (typeof DoorFrameSystem !== 'undefined' && DoorFrameSystem.isFrame(b)) {
        DoorFrameSystem.updateAround(b);
        return;
    }
    try {
        const neighbors = CurtainSystem.getCurtainNeighbors(b);
        for (const nb of Object.values(neighbors)) {
            if (nb && typeof DoorFrameSystem !== 'undefined' && DoorFrameSystem.isFrame(nb)) {
                DoorFrameSystem.updateAround(nb);
            }
        }
    } catch {}
});
eventSubscriptions.push(doorFrameBreakSub);

const doorFramePlaceSub = world.afterEvents.playerPlaceBlock.subscribe((data) => {
    const b = data.block;
    if (!b) return;
    if (typeof DoorFrameSystem !== 'undefined' && DoorFrameSystem.isFrame(b)) {
        DoorFrameSystem.updateAround(b);
        return;
    }
    try {
        const neighbors = CurtainSystem.getCurtainNeighbors(b);
        for (const nb of Object.values(neighbors)) {
            if (nb && typeof DoorFrameSystem !== 'undefined' && DoorFrameSystem.isFrame(nb)) {
                DoorFrameSystem.updateAround(nb);
            }
        }
    } catch {}
});
eventSubscriptions.push(doorFramePlaceSub);

const interactBlockSubscription = world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player } = event;
    const blockType = block.typeId;
    
    if (!['ff:cinder_log', 'ff:cinder_wood', 'ff:spicewood_log', 'ff:spicewood_wood'].includes(blockType)) return;
    
    lastInteraction = {
        player,
        block: {
            x: block.location.x,
            y: block.location.y,
            z: block.location.z,
            face: event.face,
            blockState: block.permutation.getState("minecraft:block_face"),
            type: blockType
        },
        time: Date.now()
    };
});
eventSubscriptions.push(interactBlockSubscription);

const STRIPPED_BLOCK_MAP = Object.freeze({
    'ff:cinder_log': 'ff:stripped_cinder_log',
    'ff:cinder_wood': 'ff:stripped_cinder_wood',
    'ff:spicewood_wood': 'ff:stripped_spicewood_wood',
    'ff:spicewood_log': 'ff:stripped_spicewood_log'
});

const ALLOWED_SUFFIXES = Object.freeze([
    '_log', '_wood', '_planks', '_leaves', '_sapling', '_slab', '_stairs', '_fence', '_door', '_trapdoor', '_button', '_pressure_plate', '_sign', '_wall', '_stripped'
]);

const interactionInterval = system.runInterval(() => {
    if (!lastInteraction.player || !lastInteraction.block || Date.now() - lastInteraction.time > 100) return;

    const player = lastInteraction.player;
    const blockLoc = lastInteraction.block;
    const face = lastInteraction.block.face;
    const blockState = lastInteraction.block.blockState;
    const blockType = lastInteraction.block.type;
    
    const equipment = player.getComponent('equippable');
    const selectedItem = equipment.getEquipment('Mainhand');
    
    if (selectedItem?.hasTag('minecraft:is_axe')) {
        const strippedType = STRIPPED_BLOCK_MAP[blockType];
        if (strippedType) {
            system.run(() => {
                const block = player.dimension.getBlock({ x: blockLoc.x, y: blockLoc.y, z: blockLoc.z });
                if (block) {
                    const newPermutation = blockState ? 
                        BlockPermutation.resolve(strippedType, { "minecraft:block_face": blockState }) :
                        BlockPermutation.resolve(strippedType);
                    block.setPermutation(newPermutation);
                    player.playSound('step.wood');
                }
            });
        }
    } else if (selectedItem && selectedItem.typeId !== blockType) {
        const isVanillaBlock = selectedItem.typeId.startsWith('minecraft:') && !selectedItem.typeId.includes('item');
        const isAllowed = ALLOWED_SUFFIXES.some(suf => selectedItem.typeId.endsWith(suf)) || isVanillaBlock;
        if (!isAllowed) return;

        let targetX = blockLoc.x, targetY = blockLoc.y, targetZ = blockLoc.z;

        switch (face) {
            case 'up': targetY++; break;
            case 'down': targetY--; break;
            case 'north': targetZ--; break;
            case 'south': targetZ++; break;
            case 'east': targetX++; break;
            case 'west': targetX--; break;
        }

        system.run(() => {
            const targetBlock = player.dimension.getBlock({ x: targetX, y: targetY, z: targetZ });
            if (targetBlock && targetBlock.typeId === 'minecraft:air') {
                const itemTypeId = selectedItem.typeId.replace('minecraft:', '');
                const newPermutation = BlockPermutation.resolve(itemTypeId);
                targetBlock.setPermutation(newPermutation);
                
                if (player.getGameMode() !== "creative") {
                    selectedItem.amount--;
                    if (selectedItem.amount <= 0) {
                        equipment.setEquipment('Mainhand', undefined);
                    } else {
                        equipment.setEquipment('Mainhand', selectedItem);
                    }
                }
                player.playSound('use.wood');
            }
        });
    }
    
    lastInteraction = { player: null, block: null, time: 0 };
}, 2);
systemIntervals.push(interactionInterval);

const curtainUpdateInterval = system.runInterval(() => {
    const players = world.getPlayers();
    if (players.length === 0) return;
    
    for (const player of players) {
        const { x: px, y: py, z: pz } = player.location;
        const dim = player.dimension;
        const range = 4;
        const minY = Math.max(0, Math.floor(py) - range);
        const maxY = Math.min(255, Math.floor(py) + range);
        
        for (let x = Math.floor(px) - range; x <= Math.floor(px) + range; x += 2) {
            for (let y = minY; y <= maxY; y += 2) {
                for (let z = Math.floor(pz) - range; z <= Math.floor(pz) + range; z += 2) {
                    const block = dim.getBlock({ x, y, z });
                    if (block?.typeId?.startsWith('ff:white_curtain_')) {
                        CurtainSystem.updateCurtainConnections(block);
                    }
                }
            }
        }
    }
}, 20);
systemIntervals.push(curtainUpdateInterval);

WeatherSystem.init();


const VerticalConnectionSystem = {
    getDirectionOffset(direction) {
        switch (direction) {
            case 'north': return { x: 0, z: -1 };
            case 'south': return { x: 0, z: 1 };
            case 'east': return { x: 1, z: 0 };
            case 'west': return { x: -1, z: 0 };
            default: return { x: 0, z: 0 };
        }
    },

    isConnectableBlock(block, targetTypeId, requiredDirection) {
        return block && block.typeId === targetTypeId &&
               block.permutation.getState('minecraft:cardinal_direction') === requiredDirection;
    },

    getVerticalNeighbors(block, direction) {
        const { x, y, z } = block.location;
        const offset = this.getDirectionOffset(direction);
        
        return {
            above: block.dimension.getBlock({ x: x + offset.x, y: y + 1, z: z + offset.z }),
            below: block.dimension.getBlock({ x: x + offset.x, y: y - 1, z: z + offset.z })
        };
    },

    getAllNeighbors(block, direction) {
        const { x, y, z } = block.location;
        const offset = this.getDirectionOffset(direction);
        
        return {
            above: block.dimension.getBlock({ x: x + offset.x, y: y + 1, z: z + offset.z }),
            below: block.dimension.getBlock({ x: x - offset.x, y: y - 1, z: z - offset.z }),
            forward: block.dimension.getBlock({ x: x + offset.x, y: y, z: z + offset.z }),
            backward: block.dimension.getBlock({ x: x - offset.x, y: y, z: z - offset.z })
        };
    },

    calculateConnectionState(block, targetTypeId) {
        const direction = block.permutation.getState('minecraft:cardinal_direction');
        if (!direction) return 0;

        const allNeighbors = this.getAllNeighbors(block, direction);
        const hasAbove = this.isConnectableBlock(allNeighbors.above, targetTypeId, direction);
        const hasBelow = this.isConnectableBlock(allNeighbors.below, targetTypeId, direction);
        const hasForward = this.isConnectableBlock(allNeighbors.forward, targetTypeId, direction);
        const hasBackward = this.isConnectableBlock(allNeighbors.backward, targetTypeId, direction);

        if (hasAbove && hasBelow) {
            return 2;
        } else if (hasAbove) {
            return 3;
        } else if (hasBelow) {
            return 1;
        }
        
        if (hasForward && hasBackward) {
            return 4;
        } else if (hasForward) {
            return 5;
        } else if (hasBackward) {
            return 6;
        }
        
        return 0;
    },

    updateBlockConnection(block, targetTypeId) {
        if (!block || block.typeId !== targetTypeId) return;
        
        const newState = this.calculateConnectionState(block, targetTypeId);
        const currentState = block.permutation.getState('ff:fence_type') || 0;
        
        if (newState !== currentState) {
            try {
                block.setPermutation(block.permutation.withState('ff:fence_type', newState));
            } catch (error) {
                console.warn(`Failed to update block state: ${error}`);
            }
        }
    },

    updateConnectedBlocks(centerBlock, targetTypeId) {
        const direction = centerBlock.permutation.getState('minecraft:cardinal_direction');
        if (!direction) return;

        const { x, y, z } = centerBlock.location;
        const offset = this.getDirectionOffset(direction);
        
        const blocksToUpdate = [
            centerBlock,
            centerBlock.dimension.getBlock({ x: x + offset.x, y: y + 1, z: z + offset.z }),
            centerBlock.dimension.getBlock({ x: x + offset.x, y: y - 1, z: z + offset.z }),
            centerBlock.dimension.getBlock({ x: x + offset.x, y: y, z: z + offset.z }),
            centerBlock.dimension.getBlock({ x: x - offset.x, y: y, z: z - offset.z })
        ];

        blocksToUpdate.forEach(block => {
            if (block) {
                this.updateBlockConnection(block, targetTypeId);
            }
        });
    }
};

function cleanup() {
    eventSubscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
    });
    eventSubscriptions.length = 0;

    systemIntervals.forEach(interval => {
        if (interval && typeof interval.cancel === 'function') {
            interval.cancel();
        }
    });
    systemIntervals.length = 0;
    playerJumpCounts.clear();
    lastInteraction = { player: null, block: null, time: 0 };

    WeatherSystem.cleanup();
}

try {
    if (world.beforeEvents.worldUnload) {
        world.beforeEvents.worldUnload.subscribe(() => {
            cleanup();
        });
    }
} catch (error) {
    console.warn("worldUnload event not available, cleanup will need to be called manually");
}

export { cleanup };

