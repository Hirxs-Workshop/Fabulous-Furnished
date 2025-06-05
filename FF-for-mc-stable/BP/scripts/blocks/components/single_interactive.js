export function registerSingleInteractive(registry) {
  registry.registerCustomComponent("ff:single_interactive", {
    onPlayerInteract: e => {
      const { player, block } = e;
      player.playSound("random.click");
    }
  });
} 