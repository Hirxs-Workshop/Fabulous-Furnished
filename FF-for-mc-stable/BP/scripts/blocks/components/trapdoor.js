import { BlockPermutation } from '@minecraft/server';

export function registerCinderTrapdoorOnInteract(registry) {
  registry.registerCustomComponent('ff:cinder_trapdoor_on_interact', {
    onPlayerInteract(e) {
      const { block, player } = e;
      const currentState = block.permutation.getState('ff:open');
      const newOpenState = !currentState;
      const newPermutation = BlockPermutation.resolve(block.typeId, {
        ...block.permutation.getAllStates(),
        'ff:open': newOpenState
      });
      block.setPermutation(newPermutation);
      const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
      player.playSound(sound);
    }
  });
}

export function registerSpicewoodTrapdoorOnInteract(registry) {
  registry.registerCustomComponent('ff:spicewood_trapdoor_on_interact', {
    onPlayerInteract(e) {
      const { block, player } = e;
      const currentState = block.permutation.getState('ff:open');
      const newOpenState = !currentState;
      const newPermutation = BlockPermutation.resolve(block.typeId, {
        ...block.permutation.getAllStates(),
        'ff:open': newOpenState
      });
      block.setPermutation(newPermutation);
      const sound = currentState ? 'open.wooden_trapdoor' : 'close.wooden_trapdoor';
      player.playSound(sound);
    }
  });
} 