import { world, ItemStack, ItemTypes, system } from "@minecraft/server";

world.afterEvents.worldLoad.subscribe((event) => {
    const allDimensions = ['overworld', 'nether', 'the_end'];
    const dimensions = allDimensions.map(dimension => world.getDimension(dimension));
    system.runInterval(updateSmelterTick(dimensions), 20);
})

function updateSmelterTick(dimensions) {
    const entities = dimensions.flatMap(d => d.getEntities());
    for (const entity of entities) {
        const inventory = entity.getComponent("inventory")?.container;
        if (!inventory) continue;
        const slot0 = inventory.getItem(0);
        const slot1 = inventory.getItem(1);
        const isValidInput = slot0?.typeId === "ff:vegetable_oil" && slot1?.typeId === "minecraft:coal";
        // Read progress from dynamic property
        const progress = entity.getDynamicProperty("smelt_progress") ?? 0;
        const molten = entity.getDynamicProperty("molten_steal") ?? 0;
        if (!isValidInput) {
            // Reset progress and UI slots if input is invalid
            entity.setDynamicProperty("smelt_progress", 0);
            setProgressBar(inventory, 2, 0);
            setProgressBar(inventory, 3, molten);
            continue;
        }
        if (progress < 9) {
            entity.setDynamicProperty("smelt_progress", progress + 1);
            setProgressBar(inventory, 2, progress + 1);
        }
        else {
            // consume 1 steal_ore and 1 coal
            slot0.amount--;
            slot1.amount--;
            inventory.setItem(0, slot0.amount > 0 ? slot0 : undefined);
            inventory.setItem(1, slot1.amount > 0 ? slot1 : undefined);
            // reset progress and increment molten
            entity.setDynamicProperty("smelt_progress", 0);
            entity.setDynamicProperty("molten_steal", molten + 1);
            setProgressBar(inventory, 2, 0);
            setProgressBar(inventory, 3, molten + 1);
        }
    }
}
function setProgressBar(container, slot, value) {
    const item = new ItemStack("minecraft:barrier", 1);
    item.nameTag = value.toString();
    container.setItem(slot, item);
}