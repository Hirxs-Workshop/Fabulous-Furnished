import { system, world, ItemStack, ItemTypes } from "@minecraft/server";

const ENTITY_TYPE = "ff:fridge_inventory";
const ENTITY_NAME = "§t§e§s§t§r";
const OIL_ITEM = "ff:vegetable_oil";
const GLASS_BOTTLE = "minecraft:air";
const CONCRETE_ITEM = "minecraft:green_concrete";
const ENERGY_BARS = [
  "ff:energy_bar_1",
  "ff:energy_bar_2",
  "ff:energy_bar_3",
  "ff:energy_bar_4",
  "ff:energy_bar_5",
  "ff:energy_bar_6",
  "ff:energy_bar_7",
  "ff:energy_bar_8"
];
const ENERGY_SLOT_INDEXES = [1,2,3,4]; // slots 1-4
const OIL_SLOT = 0;
const CONCRETE_SLOT = 5;
const MAX_ENERGY = 3200;
const ENERGY_PER_BAR = 100;
const OIL_ENERGY_VALUE = 200;

const energyState = {};

system.runInterval(() => {
  const entities = world.getDimension("overworld").getEntities({
    type: ENTITY_TYPE,
    name: ENTITY_NAME,
  });

  for (const entity of entities) {
    const inv = entity.getComponent("inventory");
    if (!inv) continue;
    const container = inv.container;
    const entityId = entity.id;

    if (!energyState[entityId]) {
      energyState[entityId] = { energy: 0 };
    }

    let allEmpty = true;
    for (let i = 0; i < ENERGY_SLOT_INDEXES.length; i++) {
      const slot = ENERGY_SLOT_INDEXES[i];
      const item = container.getItem(slot);
      if (item && item.typeId.startsWith("ff:energy_bar_")) {
        allEmpty = false;
        break;
      }
    }
    if (allEmpty) {
      for (let i = 0; i < ENERGY_SLOT_INDEXES.length; i++) {
        container.setItem(ENERGY_SLOT_INDEXES[i], new ItemStack(ItemTypes.get(ENERGY_BARS[0]), 1)); // ff:energy_bar_1
      }
      energyState[entityId].energy = 0;
    }

    const oilStack = container.getItem(OIL_SLOT);

    if (oilStack && oilStack.typeId === OIL_ITEM && energyState[entityId].energy === 0) {

      energyState[entityId].energy = MAX_ENERGY;

      if (oilStack.amount === 1) {
        container.setItem(OIL_SLOT, new ItemStack(ItemTypes.get(GLASS_BOTTLE), 1));
      } else if (oilStack.amount > 1) {
        oilStack.amount--;
        container.setItem(OIL_SLOT, oilStack);
        for (let j = 0; j < container.size; j++) {
          if (j === OIL_SLOT) continue;
          if (!container.getItem(j)) {
            container.setItem(j, new ItemStack(ItemTypes.get(GLASS_BOTTLE), 1));
            break;
          }
        }
      }
      world.sendMessage(`[DEBUG] Aceite consumido, energía total: ${energyState[entityId].energy}`);
    }

    if (energyState[entityId].energy > 0) {
      energyState[entityId].energy--;
    }

    let energyLeft = energyState[entityId].energy;
    for (let i = ENERGY_SLOT_INDEXES.length - 1; i >= 0; i--) {
      let barValue = Math.min(8, Math.max(1, Math.ceil(energyLeft / ENERGY_PER_BAR)));
      container.setItem(ENERGY_SLOT_INDEXES[i], new ItemStack(ItemTypes.get(ENERGY_BARS[barValue - 1]), 1));
      energyLeft -= ENERGY_PER_BAR * barValue;
      if (energyLeft < 0) energyLeft = 0;
    }

    let concrete = container.getItem(CONCRETE_SLOT);
    if (!concrete || concrete.typeId !== CONCRETE_ITEM) {
      concrete = new ItemStack(ItemTypes.get(CONCRETE_ITEM), 1);
    }
    concrete.setLore([`§gEnergy: ${energyState[entityId].energy} / ${MAX_ENERGY}`]);
    container.setItem(CONCRETE_SLOT, concrete);
  }
}, 1);
