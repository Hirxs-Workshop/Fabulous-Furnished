import { world } from "@minecraft/server";

world.beforeEvents.worldInitialize.subscribe(ev => {
    ev.itemComponentRegistry.registerCustomComponent("ff:glass_cup_effects", {
        onConsume(event) {
            const { itemStack } = event;
            const player = event.player ?? event.source ?? event.entity;
            if (!player || !player.isValid?.()) {
                console.warn("glass_cup_effects onConsume: player entity not found", event);
                return;
            }
            try {
                const parts = [];
                if (itemStack.nameTag) parts.push(itemStack.nameTag);
                if (itemStack.getLore) {
                    const loreArr = itemStack.getLore();
                    if (Array.isArray(loreArr)) parts.push(...loreArr);
                }
                let tag = parts.join(" ");
                tag = tag.replace(/§./g, "").toLowerCase();
                
                const hasRedstone = tag.includes("+30s duration");
                const hasSugar = tag.includes("sugar:");
                const hasGlow = tag.includes("amplifier: level +1");
                const bonus = hasRedstone ? 600 : 0;
                const ampLvl = hasGlow ? 1 : 0;

                
                /*/ Nutrition list :p
                    Sweet berries > 1
                    Glow berries > 1
                    Carrot > 3
                    Golden carrot > 8
                    Apple > 4
                    Golden apple > 10
                    Beetroot > 1
                    Rotten flesh > 0
                    Cocoa beans > 2
                    Chorus fruit > 2
                    Cake > 10
                    Melon slice / Melon > 4
                    Glistering melon slice / Glistering melon > 8
                    Potato > 1
                /*/

                const NUTRITION_RULES = [
                    { keys: ["sweet berries", "sweet_berries"], value: 1 },
                    { keys: ["glow berries", "glow_berries"], value: 1 },
                    { keys: ["carrot"], value: 3 },
                    { keys: ["golden carrot", "golden_carrot"], value: 8 },
                    { keys: ["apple"], value: 4 },
                    { keys: ["golden apple", "golden_apple"], value: 10 },
                    { keys: ["beetroot"], value: 1 },
                    { keys: ["rotten flesh", "rotten_flesh"], value: 0 },
                    { keys: ["cocoa beans", "cocoa_beans"], value: 2 },
                    { keys: ["chorus fruit", "chorus_fruit"], value: 2 },
                    { keys: ["cake", "cake"], value: 10 },
                    { keys: ["melon slice", "melon_slice", "melon"], value: 4 },
                    { keys: ["glistering melon slice", "glistering_melon_slice", "glistering melon"], value: 8 },
                    { keys: ["potato"], value: 1 }
                ];

                let totalNutrition = 0;
                for (const rule of NUTRITION_RULES) {
                    if (rule.keys.some(k => tag.includes(k))) totalNutrition += rule.value;
                }

                if (tag.includes("golden carrot")) {
                    player.addEffect("night_vision", 600 + bonus, { amplifier: ampLvl, showParticles: true });
                }
                if (tag.includes("golden apple")) {
                    player.addEffect("regeneration", 400 + bonus, { amplifier: ampLvl, showParticles: true });
                }
                if (tag.includes("rotten flesh")) {
                    player.addEffect("hunger", 300 + bonus, { amplifier: ampLvl, showParticles: true });
                }
                if (hasSugar) {
                    player.addEffect("speed", 900 + bonus, { amplifier: ampLvl, showParticles: true });
                }
                if (totalNutrition > 0) {
                    const satAmplifier = Math.max(0, Math.min(15, totalNutrition - 1));
                    player.addEffect("saturation", 1, { amplifier: satAmplifier, showParticles: false });
                }

                // Chorus fruit tp (beta)
                if (tag.includes("chorus fruit")) {
                    try {
                        const dx = (Math.random() - 0.5) * 16;
                        const dz = (Math.random() - 0.5) * 16;
                        const target = {
                            x: player.location.x + dx,
                            y: player.location.y + 1,
                            z: player.location.z + dz
                        };
                        player.teleport(target, player.dimension);
                        player.dimension.playSound("mob.shulker.teleport", target);
                    } catch {}
                }
            } catch (e) {
                console.warn("glass_cup_effects onConsume error:", e);
                            if (player?.sendMessage) player.sendMessage("§cGlass cup effect error, check logs");
            }
        }
    });
});
