export function registerWoodenSupportVerticalEvents() {
  const wooden_support_verticalTag = 'ff:wooden_support_vertical';
  class wooden_support_vertical_Manager {
    static updatewooden_support_verticalsAround(block) {
      let aboveBlock = undefined;
      try { aboveBlock = block.above(1); } catch { }
      let belowBlock = undefined;
      try { belowBlock = block.below(1); } catch { }
      const blocks = [aboveBlock, belowBlock, block];
      for (const wooden_support_vertical of blocks) {
        if (wooden_support_vertical != undefined && wooden_support_vertical.hasTag(wooden_support_verticalTag)) this.updatewooden_support_vertical(wooden_support_vertical);
      }
    }
    static updatewooden_support_vertical(block) {
      let aboveBlock = undefined;
      try { aboveBlock = block.above(1); } catch { }
      let belowBlock = undefined;
      try { belowBlock = block.below(1); } catch { }
      if (aboveBlock != undefined) {
        if (aboveBlock.hasTag(wooden_support_verticalTag)) {
          block.setPermutation(block.permutation.withState("ff:top_bit", true));
        } else block.setPermutation(block.permutation.withState("ff:top_bit", false));
      } else block.setPermutation(block.permutation.withState("ff:top_bit", false));
      if (belowBlock != undefined) {
        if (belowBlock.hasTag(wooden_support_verticalTag)) {
          block.setPermutation(block.permutation.withState("ff:bottom_bit", true));
        } else block.setPermutation(block.permutation.withState("ff:bottom_bit", false));
      } else block.setPermutation(block.permutation.withState("ff:bottom_bit", false));
    }
  }
  const { world } = require('@minecraft/server');
  world.afterEvents.playerBreakBlock.subscribe((data) => {
    wooden_support_vertical_Manager.updatewooden_support_verticalsAround(data.block);
  });
  world.afterEvents.playerPlaceBlock.subscribe((data) => {
    wooden_support_vertical_Manager.updatewooden_support_verticalsAround(data.block);
  });
} 