import { world, system } from '@minecraft/server'

const woodTypes = [
  'oak','spruce','spicewood','cinder','pale','mangrove',
  'dark_oak','jungle','acacia','crimson','warped','cherry','birch'
]
const directions = ['north','south','west','east']

function getWoodType(block) {
  return woodTypes.find(w => block.typeId.endsWith(`_${w}`))
}

world.beforeEvents.worldInitialize.subscribe(initEvent => {
  const registry = initEvent.blockComponentRegistry

  const prevStates = new Map()
  registry.registerCustomComponent('ff:lamp_cx', {
    onPlayerInteract: e => {
      const { player, block } = e;
      player.playSound("random.click");
    },
    onTick: e => {
      const b = e.block
      const { x, y, z } = b.location
      const key = `${x},${y},${z}`

      const thisWood = getWoodType(b);
      const above  = b.above(1)
      const below  = b.below(1)
      const aboveWood = above ? getWoodType(above) : null;
      const belowWood = below ? getWoodType(below) : null;
      const newTop    = !!(above?.hasTag('ff:lamp_cx') && aboveWood === thisWood)
      const newBottom = !!(below?.hasTag('ff:lamp_cx') && belowWood === thisWood)

      const prev = prevStates.get(key) || { top: false, bottom: false }

      if ((newTop && !newBottom || (newTop && newBottom)) &&
          (newTop !== prev.top || newBottom !== prev.bottom)) {
        const cx = x + 0.5, cy = y, cz = z + 0.5
        b.dimension.runCommand(
          `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
        )
      }

      prevStates.set(key, { top: newTop, bottom: newBottom })

      b.setPermutation(
        b.permutation
         .withState("ff:top_bit",    newTop)
         .withState("ff:bottom_bit", newBottom)
      )
    }
  })
})

world.afterEvents.playerBreakBlock.subscribe(data => {
  const old = data.block
  const { x, y, z } = old.location
  const cx = x + 0.5, cy = y, cz = z + 0.5

  old.dimension.runCommand(
    `execute positioned ${cx} ${cy} ${cz} run event entity @e[type=ff:ff_light_ray_small,r=0.5] destroy`
  )
})
