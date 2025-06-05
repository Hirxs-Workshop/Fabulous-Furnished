export function registerChristmasStockingVars(registry) {
  registry.registerCustomComponent("ff:christmas_stocking_vars", {
    onPlace: (onPlaceEvent => {
      onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
    })
  });
} 