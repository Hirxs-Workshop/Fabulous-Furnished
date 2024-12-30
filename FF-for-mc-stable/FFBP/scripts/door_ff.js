import { world, system, MinecraftDimensionTypes, ItemStack, BlockPermutation } from '@minecraft/server';
function dimensionToHeight(dimension) {
  const heights = [
    {
      id: MinecraftDimensionTypes.overworld,
      maxHeight: 320
    },
    {
      id: MinecraftDimensionTypes.nether,
      maxHeight: 128
    },
    {
      id: MinecraftDimensionTypes.theEnd,
      maxHeight: 256
    }
  ];
  const data = heights.find((f) => f.id == dimension);
  if (data != undefined) {
    return data.maxHeight;
  } else return undefined;
}
const blockComps = [
  {
    id: "ff:cinder_door_cc",
    code: {
      onTick: (data) => {
        redstoneManager.redstonePowerAfterEvent(data.block, {
          code: (block) => {
            if (block.permutation.getState("ff:open_bit") == true) return;
            pizzeriaDoorsFunction.interactWithDoor(block);
          },
          unpowered: (block) => {
            const topHalf = block.permutation.getState("ff:upper_block_bit");
            let doorPart = undefined;
            if (topHalf == false) {
              try {
                doorPart = block.above(1);
              } catch { }
            } else try {
              doorPart = block.below(1);
            } catch { }
            if (block.permutation.getState("ff:open_bit") == false) return;
            if (doorPart && doorPart.hasTag(pizzeriaDoorsFunction.doorHasTag) && doorPart.permutation.getState('ff:powered') == true) return;
            pizzeriaDoorsFunction.interactWithDoor(block);
          }
        });
        const block = data.block;
        if (!block) return;
        const doordata = pizzeriaDoorsFunction.doors.find((f) => f.id == block.typeId);
        const topHalf = block.permutation.getState("ff:upper_block_bit");
        let doorPart = undefined;
        if (topHalf == false) {
          try {
            doorPart = block.above(1);
          } catch { }
        } else try {
          doorPart = block.below(1);
        } catch { }
        if (doorPart == undefined) {
          if (topHalf == true) {
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          } else {
            if (doordata) {
              const item = new ItemStack(doordata.itemID, 1);
              spawnItemAnywhere(item, block.location, block.dimension);
            }
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          }
        } else if (!doorPart.hasTag(pizzeriaDoorsFunction.doorHasTag)) {
          if (topHalf == true) {
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          } else {
            if (doordata) {
              const item1 = new ItemStack(doordata.itemID, 1);
              spawnItemAnywhere(item1, block.location, block.dimension);
            }
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          }
        }
      },
      onPlayerInteract: (data) => {
        pizzeriaDoorsFunction.interactWithDoor(data.block);
      },
      beforeOnPlayerPlace: (data) => {
        const { block, player, dimension, permutationToPlace } = data;
        const loc = block.location;
        if (loc.y + 1 >= dimensionToHeight(dimension.id)) {
          data.cancel = true;
          return;
        }
        let blockAbove = undefined;
        let blockBelow = undefined;
        try {
          blockBelow = dimension.getBlock({
            x: loc.x,
            y: loc.y - 1,
            z: loc.z
          });
        } catch { }
        if (blockBelow == undefined) {
          data.cancel = true;
          return;
        }
        if (blockBelow.isAir || blockBelow.isLiquid) {
          data.cancel = true;
          return;
        }
        try {
          blockAbove = dimension.getBlock({
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          });
        } catch { }
        if (blockAbove == undefined) {
          data.cancel = true;
          return;
        }
        if (blockAbove.isAir || blockAbove.isLiquid) {
          pizzeriaDoorsFunction.placeDoor(block, blockAbove);
        } else {
          data.cancel = true;
          return;
        }
      }
    }
  }
];
function spawnItemAnywhere(item, location, dimension) {
  //spawn the item at y100
  const itemEntity = dimension.spawnItem(item, {
    x: location.x,
    y: 100,
    z: location.z
  });
  //tp the item to the specified location
  itemEntity.teleport(location);
  //return the itemEntity
  return itemEntity;
}
class pizzeriaDoorsFunction {
  //interact with a door block
  static interactWithDoor(block) {
    const dim = block.dimension;
    const loc = block.location;
    const topHalf = block.permutation.getState("ff:upper_block_bit");
    const open = block.permutation.getState("ff:open_bit");
    let doorPart = undefined;
    if (topHalf == false) {
      try {
        doorPart = block.above(1);
      } catch { }
    } else try {
      doorPart = block.below(1);
    } catch { }
    if (doorPart != undefined) {
      const data = this.doors.find((f) => f.id == block.typeId);
      let bool = false;
      if (open == true) {
        if (data != undefined && data.closeSound != undefined) dim.playSound(data.closeSound.id, loc, {
          pitch: data.closeSound.pitch,
          volume: data.closeSound.volume
        });
        bool = false;
      } else {
        if (data != undefined && data.openSound != undefined) dim.playSound(data.openSound.id, loc, {
          pitch: data.openSound.pitch,
          volume: data.openSound.volume
        });
        bool = true;
      }
      const blocks = [
        block,
        doorPart
      ];
      for (const door of blocks) {
        try {
          door.setPermutation(door.permutation.withState("ff:open_bit", bool));
        } catch { }
      }
    }
  }
  static breakDoor(blockID, block, topHalf) {
    system.runTimeout(() => {
      let doorPart = undefined;
      if (topHalf == false) {
        try {
          doorPart = block.above(1);
        } catch { }
      } else try {
        doorPart = block.below(1);
      } catch { }
      if (doorPart != undefined && doorPart.hasTag(this.doorHasTag)) doorPart.setPermutation(BlockPermutation.resolve("minecraft:air"));
      const data = this.doors.find((f) => f.id == blockID);
      if (data == undefined) return;
      const item = new ItemStack(data.itemID, 1);
      const loc = block.location;
      spawnItemAnywhere(item, {
        x: loc.x + 0.5,
        y: loc.y + 0.5,
        z: loc.z + 0.5
      }, block.dimension)
        ;
      block.setPermutation(BlockPermutation.resolve("minecraft:air"))
        ;
    });
  }
  static placeDoor(block, aboveBlock) {
    system.runTimeout(() => {
      let reversed = false;
      const facing = block.permutation.getState("minecraft:cardinal_direction");
      switch (facing) {
        case "north":
          try {
            const otherblock = block.west(1);
            if (otherblock.typeId.includes("door")) {
              const otherfacing = otherblock.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing == facing) {
                reversed = true;
              }
            }
          } catch { }
          break;
        case "south":
          try {
            const otherblock1 = block.east(1);
            if (otherblock1.typeId.includes("door")) {
              const otherfacing1 = otherblock1.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing1 == facing) {
                reversed = true;
              }
            }
          } catch { }
          break;
        case "east":
          try {
            const otherblock2 = block.north(1);
            if (otherblock2.typeId.includes("door")) {
              const otherfacing2 = otherblock2.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing2 == facing) {
                reversed = true;
              }
            }
          } catch { }
          break;
        case "west":
          try {
            const otherblock3 = block.south(1);
            if (otherblock3.typeId.includes("door")) {
              const otherfacing3 = otherblock3.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing3 == facing) {
                reversed = true;
              }
            }
          } catch { }
          break;
      }
      block.setPermutation(block.permutation.withState("ff:reversed", reversed));
      aboveBlock.setPermutation(BlockPermutation.resolve(block.typeId));
      aboveBlock.setPermutation(aboveBlock.permutation.withState("ff:upper_block_bit", true))
      aboveBlock.setPermutation(aboveBlock.permutation.withState("minecraft:cardinal_direction", facing).withState("ff:reversed", reversed));
    });
  }
}
pizzeriaDoorsFunction.doorHasTag = "ff:is_this_a_door";
pizzeriaDoorsFunction.doors = [
  {
    id: "ff:cinder_door",
    itemID: "ff:cinder_door_item",
    openSound: {
      id: "open.wooden_door",
      volume: 1,
      pitch: 1
    },
    closeSound: {
      id: "close.wooden_door",
      volume: 1,
      pitch: 1
    }
  }
];
class redstoneManager {
  static powered(block) {
    if (!block.hasTag(pizzeriaDoorsFunction.doorHasTag)) return;
    let powered = false;
    let above = undefined;
    try {
      above = block.above(1);
    } catch { }
    let below = undefined;
    try {
      below = block.below(1);
    } catch { }
    let north = undefined;
    try {
      north = block.north(1);
    } catch { }
    let south = undefined;
    try {
      south = block.south(1);
    } catch { }
    let east = undefined;
    try {
      east = block.east(1);
    } catch { }
    let west = undefined;
    try {
      west = block.west(1);
    } catch { }
    const sides = [
      above,
      below,
      north,
      south,
      east,
      west
    ];
    for (const side of sides) {
      if (side != undefined && side.getRedstonePower() > 0) powered = true;
    }
    return powered;
  }
  static redstonePowerAfterEvent(block, event) {
    if (!block.hasTag(pizzeriaDoorsFunction.doorHasTag)) return;
    const state = block.permutation.getState("ff:powered");
    const powered = this.powered(block);
    if (state) {
      if (!powered) {
        block.setPermutation(block.permutation.withState("ff:powered", false));
        if (event.unpowered != undefined) event.unpowered(block);
      }
      return;
    }
    if (!powered) return;
    block.setPermutation(block.permutation.withState("ff:powered", true));
    event.code(block);
  }
}
world.beforeEvents.playerBreakBlock.subscribe((data) => {
  if (data.block.hasTag(pizzeriaDoorsFunction.doorHasTag)) {
    data.cancel = true;
    pizzeriaDoorsFunction.breakDoor(data.block.typeId, data.block, data.block.permutation.getState("ff:upper_block_bit"));
  } else try {
    const blockAbove = data.block.above(1);
    if (blockAbove.hasTag(pizzeriaDoorsFunction.doorHasTag)) pizzeriaDoorsFunction.breakDoor(blockAbove.typeId, blockAbove, blockAbove.permutation.getState("ff:upper_block_bit"));
  } catch { }
});
let int = 0;
world.beforeEvents.worldInitialize.subscribe((data) => {
  int = int + 1;
  if (int != 1) return;
  for (const comp of blockComps) {
    data.blockComponentRegistry.registerCustomComponent(comp.id, comp.code);
  }
});
