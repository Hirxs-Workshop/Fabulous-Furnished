import { system } from '@minecraft/server';

export function registerFanElevador(registry) {
  const playerJumpCounts = new Map();
  registry.registerCustomComponent(
    "ff:fan_elevador",
    {
      onStepOn: (event) => {
        const { block, entity } = event;
        if (!entity.isValid() || entity.typeId !== 'minecraft:player') {
          entity.applyImpulse({ x: 0, y: 0.5, z: 0 });
          return;
        }
        const currentCount = playerJumpCounts.get(entity.id) || 0;
        let impulseY = 0.5;
        if (currentCount > 0) {
          impulseY = Math.min(0.5 + (currentCount * 0.2), 3);
        }
        entity.applyImpulse({ x: 0, y: impulseY, z: 0 });
        playerJumpCounts.set(entity.id, currentCount + 1);
        system.runTimeout(() => {
          const currentCount = playerJumpCounts.get(entity.id);
          if (currentCount) {
            playerJumpCounts.set(entity.id, 0);
          }
        }, 50);
      },
    }
  );
} 