export class entityManager {
    //spawn an item anywhere
    static spawnItemAnywhere(item, location, dimension) {
        const itemEntity = dimension.spawnItem(item, {
            x: location.x,
            y: 100,
            z: location.z
        });
        itemEntity.teleport(location, {
            dimension: dimension
        });
        return itemEntity;
    }
}
