import { BlockPermutation } from "@minecraft/server";

export function updateBlock(block, newState, newType = null) {
  try {
    const typeId = newType || block.typeId;
    if (newType) block.setType(newType);
    const current = block.permutation.getAllStates();
    const merged = { ...current, ...newState };
    block.setPermutation(BlockPermutation.resolve(typeId, merged));
  } catch (e) {
    console.warn("utils.updateBlock error:", e);
  }
}

export function getStates(block) {
  try {
    return block.permutation.getAllStates();
  } catch (e) {
    console.warn("utils.getStates error:", e);
    return {};
  }
}
