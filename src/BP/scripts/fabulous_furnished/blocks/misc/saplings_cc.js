import { world, BlockPermutation, system, EquipmentSlot } from "@minecraft/server";

function growWithFeature(e, featureId, forceTry = false) {
  const { block, dimension } = e;
  const { x, y, z } = block.location;

  try {
    if (!forceTry) {
      try {
        const r = dimension.placeFeature(featureId, { x, y, z });
        return r !== false;
      } catch (_) {
        return false;
      }
    } else {
      const prevPerm = block.permutation;
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
      try {
        const anchors = [0, -1, 1];
        for (const dy of anchors) {
          try {
            const ok = dimension.placeFeature(featureId, { x, y: y + dy, z });
            if (ok !== false) return true;
          } catch (_) {}
        }
        try { block.setPermutation(prevPerm); } catch (_) {}
        return false;
      } catch (_) {
        try { block.setPermutation(prevPerm); } catch (_) {}
        return false;
      }
    }
  } catch (_) {
    return false;
  }
}

function registerSaplingComponent(name, featureId) {
  world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(name, {
      onRandomTick: (e) => {
        if (Math.random() < 0.05) {
          growWithFeature(e, featureId);
        }
      },
      onPlayerInteract: (e) => {
        const { player, block } = e;
        const eq = player.getComponent("equippable");
        const main = eq?.getEquipment(EquipmentSlot.Mainhand);
        if (main?.typeId === "minecraft:bone_meal") {
          const loc = block.location;
          player.playSound("use.bone_meal", loc);

          try {
            for (let i = 0; i < 6; i++) {
              const ox = (Math.random() - 0.5) * 1.2;
              const oy = Math.random() * 0.8 + 0.2;
              const oz = (Math.random() - 0.5) * 1.2;
              block.dimension.spawnParticle("minecraft:villager_happy", {
                x: loc.x + 0.5 + ox,
                y: loc.y + oy,
                z: loc.z + 0.5 + oz,
              });
            }
          } catch (_) {}

          const isCreative = (() => {
            try { return player.getGameMode && player.getGameMode() === "creative"; } catch { return false; }
          })();

          if (!isCreative) {
            try {
              if (main.amount > 1) {
                main.amount -= 1;
                eq.setEquipment(EquipmentSlot.Mainhand, main);
              } else {
                eq.setEquipment(EquipmentSlot.Mainhand, undefined);
              }
            } catch (_) {}
          }

          let ok = false;
          if (isCreative) {
            ok = growWithFeature(e, featureId, true);
          } else {
            const chance = 0.45;
            if (Math.random() < chance) {
              ok = growWithFeature(e, featureId, true);
            } else {
              ok = false;
            }
          }

        }
      },
    });
  });
}

registerSaplingComponent("ff:orange_maple_sapling", "ff:autumn_tree_big_feature");
registerSaplingComponent("ff:red_maple_sapling", "ff:maple_fancy_tree_feature");
registerSaplingComponent("ff:yellow_maple_sapling", "ff:maple_tree_yellow_big_feature");
