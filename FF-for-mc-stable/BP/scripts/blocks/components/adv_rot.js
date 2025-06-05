function getPreciseRotation(playerYRotation) {
  if (playerYRotation < 0) playerYRotation += 360;
  const rotation = Math.round(playerYRotation / 22.5);
  return rotation !== 16 ? rotation : 0;
}

export function registerAdvRot(registry) {
  registry.registerCustomComponent("ff:adv_rot", {
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
} 