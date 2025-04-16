import { rightBlockLocation, leftBlockLocation } from './classes/blinds_dir';
export class fabulousBlindsBlock {
	onPlace(e) {
		const { block } = e;
		const topBlock = block.offset({x: 0, y: 1, z: 0});
		const bottomBlock = block.offset({x: 0, y: -1, z: 0});
		ff_blinds_update_place(block);
		if (bottomBlock.getTags()[0] === block.getTags()[0]) {
			ff_blinds_update_place(bottomBlock);
		}
		if (topBlock.getTags()[0] === block.getTags()[0]) {
			ff_blinds_update_place(topBlock);
		}
	}
	onPlayerDestroy(e) {
		const { block, destroyedBlockPermutation } = e;
		const topBlock = block.offset({x: 0, y: 1, z: 0});
		const bottomBlock = block.offset({x: 0, y: -1, z: 0});
		if (bottomBlock.getTags()[0] === destroyedBlockPermutation.getTags()[0]) {
			ff_blinds_update_place(bottomBlock);
		}
		if (topBlock.getTags()[0] === destroyedBlockPermutation.getTags()[0]) {
			ff_blinds_update_place(topBlock);
		}
	}
	onPlayerInteract(e) {
		const { block, dimension } = e;
		const close = block.permutation.getState("ff:close_blinds");
		ff_blinds_update(block, block.location.x, block.location.y, block.location.z);
		if (close) {
			dimension.playSound("step.wood", block.center());
		} else {
			dimension.playSound("step.wood", block.center());
		}
	}
}

function ff_blinds_update(block, originX, originY, originZ) {
	const blockType = block.typeId;
	const { x, y, z } = block.location;
	if (Math.abs(x - originX) > 8 || Math.abs(y - originY) > 8 || Math.abs(z - originZ) > 8) {
		return;
	}
	const stack = [];
	const visitedBlocks = new Set();
	stack.push(block);

	while (stack.length > 0) {
		const currentBlock = stack.pop();
		const currentDirection = currentBlock.permutation.getState("minecraft:cardinal_direction");
		const currentClose = currentBlock.permutation.getState("ff:close_blinds");
		const { x: currentX, y: currentY, z: currentZ } = currentBlock.location;
		const blockKey = `${currentX},${currentY},${currentZ}`;
		if (visitedBlocks.has(blockKey)) {
			continue;
		}
		visitedBlocks.add(blockKey);
		currentBlock.setPermutation(currentBlock.permutation.withState("ff:close_blinds", !currentClose));
		const rightBlock = currentBlock.offset(rightBlockLocation[currentDirection]);
		const leftBlock = currentBlock.offset(leftBlockLocation[currentDirection]);
		const topBlock = currentBlock.offset({ x: 0, y: 1, z: 0 });
		const bottomBlock = currentBlock.offset({ x: 0, y: -1, z: 0 });
		const adjacentBlocks = [rightBlock, leftBlock, topBlock, bottomBlock];
		adjacentBlocks.forEach(adjacentBlock => {
			try {
				if (adjacentBlock && adjacentBlock.typeId === blockType && adjacentBlock.permutation.getState("minecraft:cardinal_direction") === currentDirection) {
					const adjacentClose = adjacentBlock.permutation.getState("ff:close_blinds");
					if (adjacentClose === currentClose) {
						const { x: adjX, y: adjY, z: adjZ } = adjacentBlock.location;
						if (Math.abs(adjX - originX) <= 10 && Math.abs(adjY - originY) <= 10 && Math.abs(adjZ - originZ) <= 10) {
							stack.push(adjacentBlock);
						}
					}
				}
			} catch (error) {
				console.error("Unloaded chunk:", error);
			}
		});
	}
}

function ff_blinds_update_place(block) {
	const topBlock = block.offset({x: 0, y: 1, z: 0});
	if (topBlock.getTags()[0] === block.getTags()[0]) {
		block.setPermutation(block.permutation.withState("ff:open_blinds", true));
	} else {
		block.setPermutation(block.permutation.withState("ff:open_blinds", false));
	}
}