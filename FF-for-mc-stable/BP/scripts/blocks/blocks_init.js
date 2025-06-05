import { world } from '@minecraft/server';
import { registerAllBlockComponents } from './components';

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  registerAllBlockComponents(blockComponentRegistry);
});