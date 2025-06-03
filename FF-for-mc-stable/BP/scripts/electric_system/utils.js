import { system, world, BlockPermutation } from "@minecraft/server";

export function getLinePoints(pos1, pos2, numPoints) {
  const start = { x: pos1.x + 0.5, y: pos1.y + 0.5, z: pos1.z + 0.5 };
  const end = { x: pos2.x + 0.5, y: pos2.y + 0.5, z: pos2.z + 0.5 };
  const points = [];
  const dx = (end.x - start.x) / (numPoints - 1);
  const dy = (end.y - start.y) / (numPoints - 1);
  const dz = (end.z - start.z) / (numPoints - 1);
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: start.x + dx * i,
      y: start.y + dy * i,
      z: start.z + dz * i,
    });
  }
  return points;
}

export function turnOffLight(connection, LIGHT_TYPES) {
  const lightDimension = world.getDimension(connection.light.dimensionId);
  const lightBlock = lightDimension.getBlock({
    x: connection.light.x,
    y: connection.light.y,
    z: connection.light.z,
  });
  if (lightBlock && LIGHT_TYPES.has(lightBlock.typeId)) {
    const newPerm = BlockPermutation.resolve(lightBlock.typeId, { "ff:lamp_state": false });
    lightBlock.setPermutation(newPerm);
  }
  const key = `${connection.light.dimensionId}_${connection.light.x}_${connection.light.y}_${connection.light.z}`;
}


/**
 * Dibuja un trazo de partículas entre dos puntos.
 * @param {Dimension} dim      Dimensión donde spawnear.
 * @param {{x:number,y:number,z:number}} start  Punto de inicio.
 * @param {{x:number,y:number,z:number}} end    Punto final.
 * @param {string} particleType  ID de la partícula ("minecraft:endrod", etc).
 * @param {number} steps       Cuántos pasos interpolar (por defecto 20).
 */
export function drawParticleLine(dim, start, end, particleType, steps = 20) {
  const dx = (end.x - start.x) / steps;
  const dy = (end.y - start.y) / steps;
  const dz = (end.z - start.z) / steps;
  for (let i = 0; i <= steps; i++) {
    dim.spawnParticle(particleType, {
      x: start.x + dx * i,
      y: start.y + dy * i,
      z: start.z + dz * i
    });
  }
}