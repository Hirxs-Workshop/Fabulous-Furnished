import { world } from '@minecraft/server';
import { registerAllBlockComponents } from './components/index';

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  registerAllBlockComponents(blockComponentRegistry);
});