import { world, system, BlockComponentTypes, MolangVariableMap, ItemStack } from "@minecraft/server";

const NOTHING = "nothing";

const BlenderMsg = {
    msg(player, parts) {
        try {
            player.sendMessage({ rawtext: parts });
        } catch (e) {
            const text = parts.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("");
            if (text) player.sendMessage(text);
        }
    },
    tr(player, key, withParts = []) {
        try {
            player.sendMessage({ rawtext: [ { translate: key, with: withParts } ] });
        } catch (e) {
            player.sendMessage(key);
        }
    }
};

function resetBlender(block) {
    try {
        const key = `${block.location.x},${block.location.y},${block.location.z}`;
        blenderData.delete(key);
        saveBlendersToWorld();
        
        const dir = block.permutation.getState("minecraft:cardinal_direction");
        block.setType(block.typeId);
        if (dir !== undefined) {
            const perm = block.permutation.withState("minecraft:cardinal_direction", dir);
            block.setPermutation(perm);
        }
    } catch (e) {
        console.warn("Failed to reset blender block:", e);
    }
}
const blendTimers = new Map();
const blenderData = new Map();
const DP_KEY = "ff:blenders";
const BLEND_INTERVAL_TICKS = 65;
const PARTICLE_INTERVAL_TICKS = 10;

const BLENDER_ITEMS = {
    "minecraft:sweet_berries": { r: 165, g: 7, b: 0 },
    "minecraft:glow_berries": { r: 241, g: 163, b: 47 },
    "minecraft:carrot": { r: 255, g: 142, b: 9 },
    "minecraft:golden_carrot": { r: 219, g: 162, b: 19 },
    "minecraft:apple": { r: 255, g: 28, b: 43 },
    "minecraft:golden_apple": { r: 236, g: 203, b: 69 },
    "minecraft:beetroot": { r: 182, g: 72, b: 76 },
    "minecraft:melon_slice": { r: 193, g: 60, b: 45 },
    "minecraft:potato": { r: 233, g: 186, b: 98 },
    "minecraft:glistering_melon_slice": { r: 201, g: 73, b: 8 },
    "minecraft:cake": { r: 253, g: 246, b: 223 },
    "minecraft:chorus_fruit": { r: 141, g: 103, b: 140 },
    "minecraft:cocoa_beans": { r: 111, g: 68, b: 37 },
    "minecraft:rotten_flesh": { r: 179, g: 68, b: 32 },
    
};
const ITEM_DISPLAY = {
    "minecraft:sweet_berries": "Sweet Berries",
    "minecraft:glow_berries": "Glow Berries",
    "minecraft:carrot": "Carrot",
    "minecraft:golden_carrot": "Golden Carrot",
    "minecraft:apple": "Apple",
    "minecraft:golden_apple": "Golden Apple",
    "minecraft:beetroot": "Beetroot",
    "minecraft:melon_slice": "Melon",
    "minecraft:potato": "Potato",
    "minecraft:glistering_melon_slice": "Glistering Melon",
    "minecraft:cake": "Cake",
    "minecraft:chorus_fruit": "Chorus Fruit",
    "minecraft:cocoa_beans": "Cocoa Beans",
    "minecraft:rotten_flesh": "Rotten Flesh",
    "minecraft:sugar": "Sugar",
    "minecraft:redstone": "Redstone"
};

const MODIFIERS = {
    "minecraft:sugar": "modSugar",
    "minecraft:redstone": "amplifier_redstone",
    "minecraft:glowstone_dust": "amplifier_glowstone"
};

function displayName(typeId) {
    if (!typeId) return "";
    const mapped = ITEM_DISPLAY[typeId];
    if (mapped) return mapped;
    const id = typeId.replace("minecraft:", "");
    return id
        .split("_")
        .map(s => (s ? s[0].toUpperCase() + s.slice(1) : s))
        .join(" ");
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function mixColors(color1, color2, ratio = 0.5) {
    const r = Math.round(color1.r * (1 - ratio) + color2.r * ratio);
    const g = Math.round(color1.g * (1 - ratio) + color2.g * ratio);
    const b = Math.round(color1.b * (1 - ratio) + color2.b * ratio);
    return { r, g, b };
}

const SUGAR_STATE = "ff:with_sugar";
const AMPLIFIER_STATE = "ff:with_amplifier";

function getBlockState(block) {
    const state = {};
    const key = `${block.location.x},${block.location.y},${block.location.z}`;
    const data = blenderData.get(key) || { item1: NOTHING, item2: NOTHING };
    
    try {
        state.item1 = data.item1;
        state.item2 = data.item2;
        state.color = block.permutation.getState("ff:color") || "none";
        state.modSugar = block.permutation.getState(SUGAR_STATE) === true;
        state.amplifier = block.permutation.getState(AMPLIFIER_STATE) || "none";
        state.stage = Number(block.permutation.getState("ff:stage") || 0);
    } catch (e) {
        state.item1 = NOTHING;
        state.item2 = NOTHING;
        state.color = "none";
        state.stage = 0;
    }
    return state;
}

function updateBlockState(block, newState) {
    try {
        const key = `${block.location.x},${block.location.y},${block.location.z}`;
        
        if (newState.item1 !== undefined || newState.item2 !== undefined) {
            const currentData = blenderData.get(key) || { item1: NOTHING, item2: NOTHING };
            blenderData.set(key, {
                item1: newState.item1 ?? currentData.item1,
                item2: newState.item2 ?? currentData.item2
            });
            saveBlendersToWorld();
        }
        
        const currentPermutation = block.permutation;
        const permUpdates = {};
        if (typeof newState.modSugar === "boolean") permUpdates[SUGAR_STATE] = newState.modSugar;

        let perm = currentPermutation
            .withState("ff:stage", newState.stage ?? currentPermutation.getState("ff:stage") ?? 0)
            .withState("ff:color", newState.color ?? currentPermutation.getState("ff:color") ?? "none")

        for (const [k,v] of Object.entries(permUpdates)) {
            perm = perm.withState(k, v);
        }

        if (newState.amplifier !== undefined) {
            perm = perm.withState(AMPLIFIER_STATE, newState.amplifier);
        }
        block.setPermutation(perm);

    } catch (e) {
        console.warn("Failed to update blender block state:", e);
    }
}

function saveBlendersToWorld() {
    try {
        if (typeof world.setDynamicProperty !== "function") return;
        const entries = Array.from(blenderData.entries()).map(([k, v]) => ({ k, i1: v.item1, i2: v.item2 }));
        const payload = JSON.stringify(entries);
        world.setDynamicProperty(DP_KEY, payload);
    } catch (e) {
        console.warn("Failed to save blender data:", e);
    }
}

function loadBlendersFromWorld() {
    try {
        if (typeof world.getDynamicProperty !== "function") return;
        const payload = world.getDynamicProperty(DP_KEY);
        if (!payload || typeof payload !== "string") return;
        const arr = JSON.parse(payload);
        if (!Array.isArray(arr)) return;
        blenderData.clear();
        for (const it of arr) {
            if (!it || typeof it.k !== "string") continue;
            blenderData.set(it.k, { item1: it.i1 ?? NOTHING, item2: it.i2 ?? NOTHING });
        }
    } catch (e) {
        console.warn("Failed to load blender data:", e);
    }
}

function spawnBlenderParticles(dimension, location, color) {
    const molang = new MolangVariableMap();
    molang.setColorRGB("variable.color", { red: color.r / 255, green: color.g / 255, blue: color.b / 255 });
    dimension.spawnParticle("ff:blender_liquid", { x: location.x + 0.5, y: location.y + 0.4, z: location.z + 0.5 }, molang);
}

function calculateColorDistance(color1, color2) {
    const rMean = (color1.r + color2.r) / 2;
    const deltaR = color1.r - color2.r;
    const deltaG = color1.g - color2.g;
    const deltaB = color1.b - color2.b;
    
    const weightR = 2 + rMean / 256;
    const weightG = 4.0;
    const weightB = 2 + (255 - rMean) / 256;
    
    return Math.sqrt(weightR * deltaR * deltaR + weightG * deltaG * deltaG + weightB * deltaB * deltaB);
}

function findClosestColorState(targetColor) {
    const COLOR_STATE_MAP = {
        // BASE MIXES
        "c0": { r: 203, g: 85, b: 24 },   // #CB5518 - Sweet Berries + Glow Berries
        "c1": { r: 210, g: 75, b: 5 },    // #D24B05 - Sweet Berries + Carrot
        "c2": { r: 192, g: 85, b: 10 },   // #C0550A - Sweet Berries + Golden Carrot
        "c3": { r: 210, g: 18, b: 22 },   // #D21216 - Sweet Berries + Apple
        "c4": { r: 201, g: 105, b: 35 },  // #C96923 - Sweet Berries + Golden Apple
        "c5": { r: 174, g: 40, b: 38 },   // #AE2826 - Sweet Berries + Beetroot
        "c6": { r: 179, g: 34, b: 23 },   // #B32217 - Sweet Berries + Melon Slice
        "c7": { r: 199, g: 97, b: 49 },   // #C76131 - Sweet Berries + Potato
        "c8": { r: 183, g: 40, b: 4 },    // #B72804 - Sweet Berries + Glistering Melon
        "c9": { r: 209, g: 127, b: 112 }, // #D17F70 - Sweet Berries + Cake
        "c10": { r: 153, g: 55, b: 70 },  // #993746 - Sweet Berries + Chorus Fruit
        "c11": { r: 138, g: 38, b: 19 },  // #8A2613 - Sweet Berries + Cocoa Beans
        "c12": { r: 172, g: 38, b: 16 },  // #AC2610 - Sweet Berries + Rotten Flesh
        "c13": { r: 248, g: 153, b: 28 }, // #F8991C - Glow Berries + Carrot
        "c14": { r: 230, g: 163, b: 33 }  // #E6A321 - Glow Berries + Golden Carrot
    };
    
    let bestState = "c0";
    let bestDistance = Infinity;
    
    for (const [state, color] of Object.entries(COLOR_STATE_MAP)) {
        const distance = calculateColorDistance(targetColor, color);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestState = state;
        }
    }
    
    return bestState;
}

function getColorFromState(colorState) {
    // MIXES MAP COLORS
    const COLOR_STATE_MAP = {
        "c0": { r: 203, g: 85, b: 24 },   // #CB5518
        "c1": { r: 210, g: 75, b: 5 },    // #D24B05
        "c2": { r: 192, g: 85, b: 10 },   // #C0550A
        "c3": { r: 210, g: 18, b: 22 },   // #D21216
        "c4": { r: 201, g: 105, b: 35 },  // #C96923
        "c5": { r: 174, g: 40, b: 38 },   // #AE2826
        "c6": { r: 179, g: 34, b: 23 },   // #B32217
        "c7": { r: 199, g: 97, b: 49 },   // #C76131
        "c8": { r: 183, g: 40, b: 4 },    // #B72804
        "c9": { r: 209, g: 127, b: 112 }, // #D17F70
        "c10": { r: 153, g: 55, b: 70 },  // #993746
        "c11": { r: 138, g: 38, b: 19 },  // #8A2613
        "c12": { r: 172, g: 38, b: 16 },  // #AC2610
        "c13": { r: 248, g: 153, b: 28 }, // #F8991C
        "c14": { r: 230, g: 163, b: 33 }  // #E6A321
    };
    return COLOR_STATE_MAP[colorState] || { r: 203, g: 85, b: 24 }; // default to c0
}

function beginBlending(block){
    const key = `${block.location.x},${block.location.y},${block.location.z}`;
    if(blendTimers.has(key)) return;

    const dim = block.dimension;
    const runStage = () => {
        const st = getBlockState(block);
        if(st.item1===NOTHING || st.item2===NOTHING){
            resetBlender(block);
            blendTimers.delete(key);
            return;
        }
        if(st.stage>=4){
            blendTimers.delete(key);
            
            return;
        }
        let nextStage=st.stage+1;
        const c1=BLENDER_ITEMS[st.item1];
        const c2=BLENDER_ITEMS[st.item2];
        if(c1&&c2){
            const mix=mixColors(c1,c2,0.5);
            const hex=rgbToHex(mix.r,mix.g,mix.b).toUpperCase();
            
            let colorState = findClosestColorState(mix);
            
            const mappedColor = getColorFromState(colorState);
            
            const spawn=(name,loc)=>dim.spawnParticle(name, {x:loc.x+0.5,y:loc.y+0.4,z:loc.z+0.5});
            if(st.stage===1){
                spawn(`ff:blender_${st.item1.split(":")[1]}`, block.location);
                spawn(`ff:blender_${st.item2.split(":")[1]}`, block.location);
            }else if(st.stage===2){
                spawn(`ff:blender_${st.item1.split(":")[1]}`, block.location);
                spawn(`ff:blender_${st.item2.split(":")[1]}`, block.location);
                spawnBlenderParticles(dim, block.location, mappedColor);
            }else if(st.stage===3){
                spawnBlenderParticles(dim, block.location, mappedColor);
                spawnBlenderParticles(dim, block.location, mappedColor);
            }
            if(nextStage===4){
                const isIdenticalBerries = (st.item1 === st.item2) && (st.item1 === "minecraft:sweet_berries" || st.item1 === "minecraft:glow_berries");
                if (isIdenticalBerries) {
                    const specialAmp = st.item1 === "minecraft:sweet_berries" ? "sweet_berries" : "glow_berries";
                    updateBlockState(block, { stage: nextStage, color: "none", amplifier: specialAmp });
                } else {
                    const mixedColor=mix;
                    const colorState = findClosestColorState(mixedColor);
                    updateBlockState(block, { stage: nextStage, color: colorState });
                }
            } else {
                updateBlockState(block, { stage: nextStage });
            }
        }
        system.runTimeout(runStage, BLEND_INTERVAL_TICKS);
    };
    blendTimers.set(key,true);
    try { dim.playSound("ff:blender_mix", block.location); } catch {}

    const particleLoop = () => {
        const s = getBlockState(block);
        if (s.stage >= 4 || !s.item1 || !s.item2) return;

        const loc = { x: block.location.x + 0.5, y: block.location.y + 0.4, z: block.location.z + 0.5 };
        const id1 = s.item1.split(":")[1];
        const id2 = s.item2.split(":")[1];
        const c1 = BLENDER_ITEMS[s.item1];
        const c2 = BLENDER_ITEMS[s.item2];

        switch (s.stage) {
            case 1:
                dim.spawnParticle(`ff:blender_${id1}`, loc);
                dim.spawnParticle(`ff:blender_${id2}`, loc);
                break;
            case 2:
                dim.spawnParticle(`ff:blender_${id1}`, loc);
                dim.spawnParticle(`ff:blender_${id2}`, loc);
                if (c1 && c2) {
                    const mix = mixColors(c1, c2, 0.5);
                    spawnBlenderParticles(dim, block.location, mix);
                }
                break;
            case 3:
                if (c1 && c2) {
                    const mix = mixColors(c1, c2, 0.5);
                    for (let i = 0; i < 3; i++) {
                        spawnBlenderParticles(dim, block.location, mix);
                    }
                }
                break;
        }

        system.runTimeout(particleLoop, PARTICLE_INTERVAL_TICKS);
    };
    system.runTimeout(particleLoop, PARTICLE_INTERVAL_TICKS);

    system.runTimeout(runStage, BLEND_INTERVAL_TICKS);
}



world.beforeEvents.worldInitialize.subscribe(eventData => {
    system.runTimeout(() => loadBlendersFromWorld(), 1);

    eventData.blockComponentRegistry.registerCustomComponent("ff:blender_sound", {
        onTick(e) {
            const { block, dimension } = e;
            const state = getBlockState(block);
            
            if (state.stage > 0 && state.stage < 4 && state.item1 && state.item2) {
                if (Math.random() < 0.1) {
                    dimension.playSound("block.blastfurnace.fire_crackle", block.location);
                }
            }
        }
    });

    eventData.blockComponentRegistry.registerCustomComponent("ff:blender_interaction", {
        onPlayerInteract(e) {
            const { block, dimension, player } = e;
            const equippable = player.getComponent("equippable");
            const item = equippable?.getEquipment("Mainhand");
            const state = getBlockState(block);

            if (item?.typeId === "ff:glass_cup") {
                const state = getBlockState(block);
                const isJamMode = state.stage === 4 && state.color === "none" && (
                    (state.item1 === "minecraft:sweet_berries" && state.item2 === "minecraft:sweet_berries") ||
                    (state.item1 === "minecraft:glow_berries" && state.item2 === "minecraft:glow_berries")
                );
                if (isJamMode) {
                    BlenderMsg.msg(player, [
                        { translate: "ff.blender.finished" },
                        { text: "\n" },
                        { translate: "ff.blender.use_item_prefix" },
                        { translate: "item.ff:glass_jar.name" },
                        { translate: "ff.blender.use_item_suffix" }
                    ]);
                    return;
                }
                const isBlendReady = state.stage === 4 && state.color !== "none" && state.item1 !== NOTHING && state.item2 !== NOTHING;
                if (isBlendReady) {
                    const inv = player.getComponent("minecraft:inventory")?.container;
                    const smoothieId = `ff:glass_cup_${state.color}`;
                    const smoothie = new ItemStack(smoothieId, 1);
                    
                    const lore = [];
                    const effLines = [];
                    
                    const hasRedstoneAmp = state.amplifier === "redstone";
                    const hasGlowAmp = state.amplifier === "glowstone";
                    const durationBonus = hasRedstoneAmp ? 30 : 0;
                    
                    if (state.item1.includes("golden_carrot") || state.item2.includes("golden_carrot")) {
                        const duration = 30 + durationBonus;
                        const ampNoteNV = hasGlowAmp ? " II" : "";
                        effLines.push(`§r§8- Night Vision${ampNoteNV} - 0:${duration.toString().padStart(2, '0')}`);
                    }
                    if (state.item1.includes("golden_apple") || state.item2.includes("golden_apple")) {
                        const duration = 20 + durationBonus;
                        const ampNoteRG = hasGlowAmp ? " II" : "";
                        effLines.push(`§r§8- Regeneration${ampNoteRG} - 0:${duration.toString().padStart(2, '0')}`);
                    }
                    
                    if (state.item1.includes("chorus_fruit") || state.item2.includes("chorus_fruit")) {
                        effLines.push("§r§d- Random teleport");
                    }
                    if (state.item1.includes("rotten_flesh") || state.item2.includes("rotten_flesh")) {
                        const duration = 15 + durationBonus;
                        const ampNoteHG = hasGlowAmp ? " II" : "";
                        effLines.push(`§r§c- Hunger${ampNoteHG} - 0:${duration.toString().padStart(2, '0')}`);
                    }
                    if (state.modSugar === true) {
                        const duration = 45 + durationBonus;
                        const ampNote = hasGlowAmp ? " II" : "";
                        effLines.push(`§r§e- Speed${ampNote} - 0:${duration.toString().padStart(2, '0')}`);
                    }
                    
                    if (effLines.length > 0) {
                        lore.push("§r§7Effects:");
                        lore.push(...effLines);
                    }
                    const mods = [];
                    if (state.modSugar) mods.push("§r§8Sugar: Speed effect");
                    if (state.amplifier === "redstone") mods.push("§r§8Amplifier: +30s duration");
                    if (state.amplifier === "glowstone") mods.push("§r§8Amplifier: Level +1");
                    if (mods.length) {
                        lore.push("\n§r§7Modifiers:");
                        lore.push(...mods);
                    }

                    const NUTRITION_BY_ID = {
                        "minecraft:sweet_berries": 1,
                        "minecraft:glow_berries": 1,
                        "minecraft:carrot": 3,
                        "minecraft:golden_carrot": 8,
                        "minecraft:apple": 4,
                        "minecraft:golden_apple": 10,
                        "minecraft:beetroot": 1,
                        "minecraft:rotten_flesh": 0,
                        "minecraft:cocoa_beans": 2,
                        "minecraft:chorus_fruit": 2,
                        "minecraft:cake": 10,
                        "minecraft:melon_slice": 4,
                        "minecraft:melon": 4,
                        "minecraft:glistering_melon_slice": 8,
                        "minecraft:potato": 1
                    };
                    const n1 = NUTRITION_BY_ID[state.item1] ?? 0;
                    const n2 = NUTRITION_BY_ID[state.item2] ?? 0;
                    const totalNutrition = n1 + n2;
                    lore.push("\n§r§7Nutrition: §a+" + totalNutrition);
                    if (lore.length > 0) {
                        smoothie.setLore(lore);
                    }
                    
                    const ing1Name = ITEM_DISPLAY[state.item1] || state.item1.replace("minecraft:", "");
                    const ing2Name = ITEM_DISPLAY[state.item2] || state.item2.replace("minecraft:", "");
                    smoothie.nameTag = `§r${ing1Name} and ${ing2Name} smoothie`;

                    if (item.amount > 1) {
                        item.amount--;
                        equippable.setEquipment("Mainhand", item);
                    } else {
                        equippable.setEquipment("Mainhand", undefined);
                    }

                    const unused = inv?.addItem(smoothie);
                    if (unused) {
                        dimension.spawnItem(smoothie, {
                            x: block.location.x + 0.5,
                            y: block.location.y + 1,
                            z: block.location.z + 0.5
                        });
                    }

                    const key = `${block.location.x},${block.location.y},${block.location.z}`;
                    blenderData.delete(key);
                    blendTimers.delete(key);
                    
                    const dir = block.permutation.getState("minecraft:cardinal_direction");
                    block.setType(block.typeId);
                    if (dir !== undefined) {
                        const perm = block.permutation.withState("minecraft:cardinal_direction", dir);
                        block.setPermutation(perm);
                    }
                    
                    dimension.playSound("random.pop", block.location);
                    return;
                }
            }

            if (player.isSneaking) {
                const hasItems = state.item1 !== NOTHING || state.item2 !== NOTHING;
                if (hasItems) {
                    const inv = player.getComponent("minecraft:inventory")?.container;
                    const giveItem = (typeId) => {
                        if (typeId === NOTHING) return;
                        const stack = new ItemStack(typeId, 1);
                        const unused = inv?.addItem(stack);
                        if (unused) {
                            dimension.spawnItem(stack, {
                                x: block.location.x + 0.5,
                                y: block.location.y + 1,
                                z: block.location.z + 0.5
                            });
                        }
                    };
                    giveItem(state.item1);
                    giveItem(state.item2);

                    const key = `${block.location.x},${block.location.y},${block.location.z}`;
                    blendTimers.delete(key);
                    
                    resetBlender(block);
                    dimension.playSound("cauldron.takewater", block.location);
                    BlenderMsg.tr(player, "ff.blender.emptied");
                } else {
                    BlenderMsg.tr(player, "ff.blender.already_empty");
                }
                return;
            }

            if (!item) {
                const has1 = !!state.item1 && state.item1 !== NOTHING;
                const has2 = !!state.item2 && state.item2 !== NOTHING;
                if (state.stage >= 4 && (has1 || has2)) {
                    const isJamMode = state.color === "none" && (
                        (state.item1 === "minecraft:sweet_berries" && state.item2 === "minecraft:sweet_berries") ||
                        (state.item1 === "minecraft:glow_berries" && state.item2 === "minecraft:glow_berries")
                    );
                    if (isJamMode) {
                        BlenderMsg.msg(player, [
                            { translate: "ff.blender.finished" },
                            { text: "\n" },
                            { translate: "ff.blender.use_item_prefix" },
                            { translate: "item.ff:glass_jar.name" },
                            { translate: "ff.blender.use_item_suffix" }
                        ]);
                    } else {
                        BlenderMsg.msg(player, [
                            { translate: "ff.blender.finished" },
                            { text: "\n" },
                            { translate: "ff.blender.use_item_prefix" },
                            { translate: "item.ff:glass_cup.name" },
                            { translate: "ff.blender.use_item_suffix" }
                        ]);
                    }
                } else if (has1 && has2) {
                    BlenderMsg.tr(player, "ff.blender.contains_both", [displayName(state.item1), displayName(state.item2)]);
                } else if (has1 || has2) {
                    const only = has1 ? state.item1 : state.item2;
                    BlenderMsg.tr(player, "ff.blender.contains_one", [displayName(only)]);
                } else {
                    BlenderMsg.tr(player, "ff.blender.empty_hint");
                }
                return;
            }

            const itemType = item.typeId;

            // Jam feature
            if (itemType === "ff:glass_jar") {
                const s = getBlockState(block);
                const isJamMode = s.stage === 4 && s.color === "none" && (
                    (s.item1 === "minecraft:sweet_berries" && s.item2 === "minecraft:sweet_berries") ||
                    (s.item1 === "minecraft:glow_berries" && s.item2 === "minecraft:glow_berries")
                );
                if (!isJamMode) {
                    BlenderMsg.tr(player, "ff.blender.item_cannot_blend");
                    return;
                }
                const jamId = s.item1.includes("glow_berries") ? "ff:glow_berries_jam" : "ff:sweet_berries_jam";
                if (item.amount > 1) { item.amount--; equippable.setEquipment("Mainhand", item); } else { equippable.setEquipment("Mainhand", undefined); }
                const inv = player.getComponent("minecraft:inventory")?.container;
                const jam = new ItemStack(jamId, 1);
                const unused = inv?.addItem(jam);
                if (unused) {
                    dimension.spawnItem(jam, { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
                }
                const key = `${block.location.x},${block.location.y},${block.location.z}`;
                blenderData.delete(key);
                blendTimers.delete(key);
                const dir = block.permutation.getState("minecraft:cardinal_direction");
                block.setType(block.typeId);
                if (dir !== undefined) {
                    const perm = block.permutation.withState("minecraft:cardinal_direction", dir);
                    block.setPermutation(perm);
                }
                dimension.playSound("step.honey_block", block.location);
                return;
            }
            
            if (!BLENDER_ITEMS[itemType] && !MODIFIERS[itemType]) {
                BlenderMsg.tr(player, "ff.blender.item_cannot_blend");
                return;
            }

            if (MODIFIERS[itemType]) {
                const modKey = MODIFIERS[itemType];
                if(modKey==="modSugar"){
                     if(state.modSugar){BlenderMsg.tr(player, "ff.blender.mod_already_added");return;}
                     updateBlockState(block,{modSugar:true});
                     if (item.amount>1){item.amount--;equippable.setEquipment("Mainhand",item);} else {equippable.setEquipment("Mainhand",undefined);}
                     dimension.playSound("block.composter.fill_success", block.location);
                     BlenderMsg.tr(player, "ff.blender.mod_sugar_added");
                     return;
                 } else {
                      if(state.amplifier!=="none"){BlenderMsg.tr(player, "ff.blender.amp_already_added");return;}
                      const ampValue = itemType.endsWith("redstone") ? "redstone" : "glowstone";
                      updateBlockState(block,{amplifier:ampValue});
                      if (item.amount>1){item.amount--;equippable.setEquipment("Mainhand",item);} else {equippable.setEquipment("Mainhand",undefined);}
                      dimension.playSound("block.composter.fill_success", block.location);
                      const ampDisplay = ampValue === "redstone" ? "Redstone" : "Glowstone";
                      BlenderMsg.tr(player, "ff.blender.amp_added", [ampDisplay]);
                      return;
                 }
            }

            if (state.item1 === NOTHING) {
                const newState = { ...state, item1: itemType };
                updateBlockState(block, newState);
                
                if (item.amount > 1) {
                    item.amount--;
                    equippable.setEquipment("Mainhand", item);
                } else {
                    equippable.setEquipment("Mainhand", undefined);
                }
                
                dimension.playSound("block.composter.fill_success", block.location);
                BlenderMsg.tr(player, "ff.blender.added_item", [displayName(itemType)]);
                
            } else if (state.item2 === NOTHING && state.item1 !== itemType) {
                const newState = { ...state, item2: itemType, stage: 1 };
                if (state.modSugar) newState.modSugar = true;
                if (state.modRedstone) newState.modRedstone = true;
                updateBlockState(block, newState);
                beginBlending(block);
                
                if (item.amount > 1) {
                    item.amount--;
                    equippable.setEquipment("Mainhand", item);
                } else {
                    equippable.setEquipment("Mainhand", undefined);
                }
                
                dimension.playSound("block.composter.fill_success", block.location);
                BlenderMsg.tr(player, "ff.blender.added_item_started", [displayName(itemType)]);
                // Mix identical items for Jam (and state)
            } else if (state.item2 === NOTHING && state.item1 === itemType && (itemType === "minecraft:sweet_berries" || itemType === "minecraft:glow_berries")) {
                const newState = { ...state, item2: itemType, stage: 1 };
                if (state.modSugar) newState.modSugar = true;
                if (state.modRedstone) newState.modRedstone = true;
                updateBlockState(block, newState);
                beginBlending(block);

                if (item.amount > 1) { item.amount--; equippable.setEquipment("Mainhand", item); } else { equippable.setEquipment("Mainhand", undefined); }
                dimension.playSound("block.composter.fill_success", block.location);
                BlenderMsg.tr(player, "ff.blender.added_item_started", [displayName(itemType)]);
            } else {
                BlenderMsg.tr(player, "ff.blender.full_or_duplicate");
            }
        }
    });

    eventData.blockComponentRegistry.registerCustomComponent("ff:blender_particles", {
        onTick(e) {
            const { block, dimension } = e;
            const state = getBlockState(block);
            
            if (state.stage > 0 && state.stage < 4 && state.item1 && state.item2) {
                const color1 = BLENDER_ITEMS[state.item1];
                const color2 = BLENDER_ITEMS[state.item2];
                
                if (color1 && color2) {
                    const mixedColor = mixColors(color1, color2, 0.5);
                    const hex = rgbToHex(mixedColor.r, mixedColor.g, mixedColor.b).toUpperCase();
                    const colorState = findClosestColorState(mixedColor);
                    const mappedColor = getColorFromState(colorState);
                    
                    if (Math.random() < 0.3) {
                        spawnBlenderParticles(dimension, block.location, mappedColor);
                    }
                }
            }
        }
    });

    eventData.blockComponentRegistry.registerCustomComponent("ff:blender_reset", {
        onPlayerInteract(e) {
            const { block, player } = e;
            const equippable = player.getComponent("equippable");
            const item = equippable?.getEquipment("Mainhand");
            
            if (item?.typeId === "minecraft:bucket") {
                const state = getBlockState(block);
                
                if (state.item1 !== NOTHING || state.item2 !== NOTHING || state.color !== "none") {
                    const key = `${block.location.x},${block.location.y},${block.location.z}`;
                    blendTimers.delete(key);
                    
                    const newState = { item1: NOTHING, item2: NOTHING, stage: 0, color: "none" };
                    updateBlockState(block, newState);
                    
                    e.dimension.playSound("cauldron.takewater", block.location);
                }
            }
        }
    });
});
