import { world, ItemStack, BlockTypes, BlockPermutation, system } from '@minecraft/server';

function registerDestroyComponent(registry, wood) {
  const inventoryType = `ff:garden_fence_${wood}_inventory`;
  registry.registerCustomComponent(`ff:${wood}_on_player_destroy`, {
    onPlayerDestroy(e) {
      const { block } = e;
      const aboveBlock = block.above();
      if (aboveBlock.typeId === inventoryType) {
        aboveBlock.setType('minecraft:air');
      }
    }
  });
}

function registerInteractComponent(registry, wood) {
  const inventoryType = `ff:garden_fence_${wood}_inventory`;
  registry.registerCustomComponent(`ff:${wood}_on_interact`, {
    onPlayerInteract(e) {
      const { block, player, face } = e;
      const equipment = player.getComponent('equippable');
      const selectedItem = equipment.getEquipment('Mainhand');
      if (selectedItem && face === 'Up' && BlockTypes.get(selectedItem.typeId)) {
        const aboveBlock = block.above();
        if (aboveBlock.typeId === inventoryType) {
          aboveBlock.setType(selectedItem.typeId);
          if (player.getGameMode() !== "creative") {
            if (selectedItem.amount > 1) {
              selectedItem.amount -= 1;
              equipment.setEquipment('Mainhand', selectedItem);
            } else {
              equipment.setEquipment('Mainhand', undefined);
            }
          }
        }
      }
    }
  });
}

function registerPlaceComponent(registry, wood) {
  const fenceType = `ff:garden_fence_${wood}`;
  const inventoryType = `ff:garden_fence_${wood}_inventory`;
  registry.registerCustomComponent(`ff:${wood}_on_player_placed`, {
    onPlace(e) {
      const { block } = e;
      const aboveBlock = block.above();
      block.setType(fenceType);
      if (aboveBlock.typeId === 'minecraft:air') {
        aboveBlock.setPermutation(BlockPermutation.resolve(inventoryType, { 'ff:post': 1 }));
      }
    }
  });
}

system.beforeEvents.startup.subscribe(eventData => {
  const registry = eventData.blockComponentRegistry;

  const destroyTypes = ['oak','birch','dark_oak','spruce','spicewood','acacia','pale','cinder','jungle','mangrove','cherry','warped','crimson'];
  const interactTypes = ['birch','dark_oak','acacia','pale','cinder','spruce','spicewood','jungle','crimson','warped','cherry','mangrove'];
  const placeTypes = ['oak','birch','dark_oak','jungle','acacia','cinder','pale','cherry','mangrove','warped','crimson','spruce','spicewood'];

  destroyTypes.forEach(wood => registerDestroyComponent(registry, wood));
  interactTypes.forEach(wood => registerInteractComponent(registry, wood));
  placeTypes.forEach(wood => registerPlaceComponent(registry, wood));
});
