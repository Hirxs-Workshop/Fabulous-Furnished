import { ItemDurabilityComponent } from '@minecraft/server';
export class itemManager {
    static reduceDurability(player, item, reduceAmount) {
        const comp = item.getComponent(ItemDurabilityComponent.componentId);
        if (comp.damage + reduceAmount <= comp.maxDurability) {
            comp.damage = comp.damage + reduceAmount;
            return item;
        } else {
            player.dimension.playSound("random.break", player.location);
            return undefined;
        }
    }
    static reduceAmount(item, reduceBy) {
        const amount = item.amount;
        if (amount - reduceBy <= 0) {
            return undefined;
        } else {
            item.amount = amount - reduceBy;
            return item;
        }
    }
}
