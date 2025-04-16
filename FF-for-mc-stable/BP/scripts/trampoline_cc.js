import * as mc from "@minecraft/server"

mc.Player.prototype.applyImpulse = function (vector) {
    const horizontal = Math.sqrt(vector.x * vector.x + vector.z * vector.z) * 2.0
    this.applyKnockback(
        vector.x,
        vector.z,
        horizontal,
        vector.y < 0.0 ? 0.5 * vector.y : vector.y
    )
}

const bouncinessComponent = {
    onEntityFallOn: data => {
        const entity = data.entity
        const tags = data.block.permutation.getTags()
        let bounciness = -1
        let reduction = 2
        for (const v of tags) {
            if (v.startsWith("ff:bounciness_")) {
                bounciness = parseFloat(v.split("_")[1])
            }
            if (v.startsWith("ff:bounciness.reduction_")) {
                reduction = parseFloat(v.split("_")[1])
            }
        }
        const bouncinessMultiplier =
            entity.getDynamicProperty("ff:bounciness_multiplier") ?? 1
        if (bounciness < 0) {
            throw "Specify a valid value of bounciness in tags."
        }
        if (entity.isSneaking) return
        entity.applyImpulse({
            x: 0,
            y: (data.fallDistance * bounciness) / bouncinessMultiplier / 5,
            z: 0
        })
        if (data.fallDistance < 2) {
            entity.setDynamicProperty("ff:bounciness_multiplier", 1)
        } else {
            entity.setDynamicProperty(
                "ff:bounciness_multiplier",
                bouncinessMultiplier * reduction
            )
        }
    }
}

mc.system.beforeEvents.startup.subscribe(data => {
    data.blockComponentRegistry.registerCustomComponent(
        "ff:bounciness",
        bouncinessComponent
    )
})

mc.system.runInterval(() => {
    for (const player of mc.world.getAllPlayers()) {
        if (
            !player.dimension
                .getBlock({
                    x: player.location.x,
                    y: player.location.y - 1,
                    z: player.location.z
                })
                ?.permutation.hasTag("ff:bouncy") &&
            player.dimension.getBlock({
                x: player.location.x,
                y: player.location.y - 1,
                z: player.location.z
            })?.isSolid
        ) {
            player.setDynamicProperty("ff:bounciness_multiplier", 1)
        }
    }
}, 20)

mc.system.runInterval(() => {
    for (const player of mc.world.getAllPlayers()) {
        const block = player.dimension.getBlockFromRay(
            player.location,
            {
                x: 0,
                y: -1,
                z: 0
            },
            {
                maxDistance: 100
            }
        )?.block
        if (block) {
            if (block.permutation.hasTag("ff:bounciness.noFallDamage")) {
            } else {
            }
        } else {
        }
    }
})
