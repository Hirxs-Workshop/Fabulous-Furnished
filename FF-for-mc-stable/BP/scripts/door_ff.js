import { world, system, DimensionTypes, ItemStack, BlockPermutation } from '@minecraft/server';

function dimensionToHeight(dimension) {
  const heights = [
    { id: DimensionTypes.overworld, maxHeight: 320 },
    { id: DimensionTypes.nether, maxHeight: 128 },
    { id: DimensionTypes.theEnd, maxHeight: 256 }
  ];
  const data = heights.find(f => f.id == dimension);
  return data ? data.maxHeight : undefined;
}

const blockComps = [
  {
    id: "ff:door_function",
    code: {
      onTick: data => {
        redstoneManager.redstonePowerAfterEvent(data.block, {
          code: block => {
            if (block.permutation.getState("ff:open_bit") === true) return;
            pizzeriaDoorsFunction.interactWithDoor(block);
          },
          unpowered: block => {
            const topHalf = block.permutation.getState("ff:upper_block_bit");
            let doorPart;
            if (topHalf === false) {
              try { doorPart = block.above(1); } catch { }
            } else {
              try { doorPart = block.below(1); } catch { }
            }
            if (block.permutation.getState("ff:open_bit") === false) return;
            if (doorPart && doorPart.hasTag(pizzeriaDoorsFunction.doorHasTag) &&
                doorPart.permutation.getState('ff:powered') === true) return;
            pizzeriaDoorsFunction.interactWithDoor(block);
          }
        });

        const block = data.block;
        if (!block) return;

        const doorData = pizzeriaDoorsFunction.doors.find(door =>
          door.id === block.typeId || (door.ids && door.ids.includes(block.typeId))
        );
        const topHalf = block.permutation.getState("ff:upper_block_bit");
        let doorPart;
        if (topHalf === false) {
          try { doorPart = block.above(1); } catch { }
        } else {
          try { doorPart = block.below(1); } catch { }
        }
        if (doorPart == undefined) {
          if (topHalf === true) {
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          } else {
            if (doorData) {
              const item = new ItemStack(doorData.itemID, 1);
              spawnItemAnywhere(item, block.location, block.dimension);
            }
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          }
        } else if (!doorPart.hasTag(pizzeriaDoorsFunction.doorHasTag)) {
          if (topHalf === true) {
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          } else {
            if (doorData) {
              const item1 = new ItemStack(doorData.itemID, 1);
              spawnItemAnywhere(item1, block.location, block.dimension);
            }
            block.setPermutation(BlockPermutation.resolve("minecraft:air"));
          }
        }
      },
      onPlayerInteract: data => {
        pizzeriaDoorsFunction.interactWithDoor(data.block);
      },
      beforeOnPlayerPlace: data => {
        const { block, dimension } = data;
        const loc = block.location;
        if (loc.y + 1 >= dimensionToHeight(dimension.id)) {
          data.cancel = true;
          return;
        }
        let blockAbove, blockBelow;
        try {
          blockBelow = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
        } catch { }
        if (blockBelow == undefined || blockBelow.isAir || blockBelow.isLiquid) {
          data.cancel = true;
          return;
        }
        try {
          blockAbove = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
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
  const itemEntity = dimension.spawnItem(item, { x: location.x, y: 100, z: location.z });
  itemEntity.teleport(location);
  return itemEntity;
}

class pizzeriaDoorsFunction {
  static interactWithDoor(block) {
    const dim = block.dimension;
    const loc = block.location;
    const topHalf = block.permutation.getState("ff:upper_block_bit");
    const open = block.permutation.getState("ff:open_bit");
    let doorPart;
    if (topHalf === false) {
      try { doorPart = block.above(1); } catch { }
    } else {
      try { doorPart = block.below(1); } catch { }
    }
    if (doorPart != undefined) {
      const doorData = this.doors.find(door =>
        door.id === block.typeId || (door.ids && door.ids.includes(block.typeId))
      );
      let bool = false;
      if (open === true) {
        if (doorData && doorData.closeSound != undefined) {
          dim.playSound(doorData.closeSound.id, loc, {
            pitch: doorData.closeSound.pitch,
            volume: doorData.closeSound.volume
          });
        }
        bool = false;
      } else {
        if (doorData && doorData.openSound != undefined) {
          dim.playSound(doorData.openSound.id, loc, {
            pitch: doorData.openSound.pitch,
            volume: doorData.openSound.volume
          });
        }
        bool = true;
      }
      const blocks = [block, doorPart];
      for (const door of blocks) {
        try {
          door.setPermutation(door.permutation.withState("ff:open_bit", bool));
        } catch { }
      }
    }
  }
  static breakDoor(blockID, block, topHalf) {
    system.runTimeout(() => {
      let doorPart;
      if (topHalf === false) {
        try { doorPart = block.above(1); } catch { }
      } else {
        try { doorPart = block.below(1); } catch { }
      }
      if (doorPart != undefined && doorPart.hasTag(this.doorHasTag))
        doorPart.setPermutation(BlockPermutation.resolve("minecraft:air"));
      const doorData = this.doors.find(door =>
        door.id === blockID || (door.ids && door.ids.includes(blockID))
      );
      if (doorData == undefined) return;
      const item = new ItemStack(doorData.itemID, 1);
      const loc = block.location;
      spawnItemAnywhere(item, { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 }, block.dimension);
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
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
              if (otherfacing == facing) reversed = true;
            }
          } catch { }
          break;
        case "south":
          try {
            const otherblock1 = block.east(1);
            if (otherblock1.typeId.includes("door")) {
              const otherfacing1 = otherblock1.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing1 == facing) reversed = true;
            }
          } catch { }
          break;
        case "east":
          try {
            const otherblock2 = block.north(1);
            if (otherblock2.typeId.includes("door")) {
              const otherfacing2 = otherblock2.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing2 == facing) reversed = true;
            }
          } catch { }
          break;
        case "west":
          try {
            const otherblock3 = block.south(1);
            if (otherblock3.typeId.includes("door")) {
              const otherfacing3 = otherblock3.permutation.getState("minecraft:cardinal_direction");
              if (otherfacing3 == facing) reversed = true;
            }
          } catch { }
          break;
      }
      block.setPermutation(block.permutation.withState("ff:reversed", reversed));
      aboveBlock.setPermutation(BlockPermutation.resolve(block.typeId));
      aboveBlock.setPermutation(aboveBlock.permutation.withState("ff:upper_block_bit", true));
      aboveBlock.setPermutation(aboveBlock.permutation.withState("minecraft:cardinal_direction", facing)
        .withState("ff:reversed", reversed));
    });
  }
}

pizzeriaDoorsFunction.doorHasTag = "ff:is_this_a_door";
pizzeriaDoorsFunction.doors = [
  {
    id: "ff:cinder_door",
    itemID: "ff:cinder_door_item",
    openSound: { id: "open.wooden_door", volume: 1, pitch: 1 },
    closeSound: { id: "close.wooden_door", volume: 1, pitch: 1 }
  },
  {
    id: "ff:spicewood_door",
    itemID: "ff:spicewood_door_item",
    openSound: { id: "open.metallic_door", volume: 1, pitch: 1 },
    closeSound: { id: "close.metallic_door", volume: 1, pitch: 1 }
  }
];

class redstoneManager {
  static powered(block) {
    if (!block.hasTag(pizzeriaDoorsFunction.doorHasTag)) return;
    let powered = false;
    let above, below, north, south, east, west;
    try { above = block.above(1); } catch { }
    try { below = block.below(1); } catch { }
    try { north = block.north(1); } catch { }
    try { south = block.south(1); } catch { }
    try { east = block.east(1); } catch { }
    try { west = block.west(1); } catch { }
    const sides = [above, below, north, south, east, west];
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

world.beforeEvents.playerBreakBlock.subscribe(data => {
  if (data.block.hasTag(pizzeriaDoorsFunction.doorHasTag)) {
    data.cancel = true;
    pizzeriaDoorsFunction.breakDoor(data.block.typeId, data.block, data.block.permutation.getState("ff:upper_block_bit"));
  } else {
    try {
      const blockAbove = data.block.above(1);
      if (blockAbove.hasTag(pizzeriaDoorsFunction.doorHasTag))
        pizzeriaDoorsFunction.breakDoor(blockAbove.typeId, blockAbove, blockAbove.permutation.getState("ff:upper_block_bit"));
    } catch { }
  }
});

let int = 0;
system.beforeEvents.startup.subscribe(data => {
  int++;
  if (int != 1) return;
  for (const comp of blockComps) {
    data.blockComponentRegistry.registerCustomComponent(comp.id, comp.code);
  }
});
