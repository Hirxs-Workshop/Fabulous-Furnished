export function registerGravestoneVars(registry) {
  registry.registerCustomComponent("ff:gravestone_vars", {
    onPlace: (onPlaceEvent => {
      onPlaceEvent.block.setPermutation(onPlaceEvent.block.permutation.withState("ff:stocking_vars", Math.round(Math.random() * 3)))
    })
  });
} 