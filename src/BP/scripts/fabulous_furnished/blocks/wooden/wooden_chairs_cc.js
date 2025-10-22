	import { world, system } from '@minecraft/server';

    world.beforeEvents.worldInitialize.subscribe(function (ffh) {
        ffh.blockComponentRegistry.registerCustomComponent('ff:rider', {
            onPlayerInteract: function (e) {
                let {
                  x,
                  y,
                  z
                } = e.block.location;
                const equippable = e.player.getComponent("equippable");
                const mainhand = equippable ? equippable.getEquipment("Mainhand") : null;
                if (mainhand && mainhand.typeId.startsWith("ef:brush_")) {
                  e.cancel = true;
                  return;
                }
                if (mainhand && mainhand.typeId.startsWith("ff:white_cush")) {
                  e.cancel = true;
                  return;
                }
                if (e.player.isSneaking) return;
                const cx = x + 0.5;
                const cy = y;
                const cz = z + 0.5;
                let yaw = 0;
                let seatId = 'ff:south_sit';
                try {
                  const face = e.block.permutation.getState('minecraft:cardinal_direction');
                  if (face === 'north') { yaw = 180; seatId = 'ff:north_sit'; }
                  else if (face === 'east') { yaw = 270; seatId = 'ff:west_sit'; }
                  else if (face === 'south') { yaw = 0; seatId = 'ff:south_sit'; }
                  else if (face === 'west') { yaw = 90; seatId = 'ff:east_sit'; }
                } catch {}

                e.dimension.runCommand(`summon ${seatId} ${cx} ${cy} ${cz}`);
                e.dimension.runCommand(`execute positioned ${cx} ${cy} ${cz} as @e[type=${seatId},r=0.8] run tp @s ${cx} ${cy} ${cz}`);
                e.player.runCommand(`execute at @e[type=player] positioned ${cx} ${cy} ${cz} run ride @s start_riding @e[type=${seatId},r=0.8] teleport_rider`);
              },
              onPlayerDestroy: function (e) {
                if (!e.player) return;
                let playerLoc = e.player.location;
                playerLoc.x -= 0.5;
                playerLoc.z -= 0.5;
          
                if (playerLoc.x != e.block.location.x) return;
                if (playerLoc.y != e.block.location.y) return;
                if (playerLoc.z != e.block.location.z) return;
          
                e.player.runCommand("ride @s stop_riding");
              },
              onPlace: function (e) {
                if (!e.block) return;
                let block = e.block.above();
                if (!block) return;
              }
            });

    ffh.blockComponentRegistry.registerCustomComponent('ff:rider_couch', {
        onPlayerInteract: function (e) {
            let {
              x,
              y,
              z
            } = e.block.location;
            const equippable = e.player.getComponent("equippable");
            const mainhand = equippable ? equippable.getEquipment("Mainhand") : null;
            if (mainhand && (mainhand.typeId === 'ff:white_cushion')) {
              e.cancel = true;
              return;
            }
            if (mainhand && mainhand.typeId.startsWith("ef:brush_")) {
              e.cancel = true;
              return;
            }
            if (e.player.isSneaking) return;
            let blockStr = e.block.x + " " + e.block.y + " " + e.block.z;
            let yaw = 0;
            let seatId = 'ff:south_sit';
            try {
              const face = e.block.permutation.getState('minecraft:cardinal_direction');
              if (face === 'north') { yaw = 180; seatId = 'ff:south_sit'; }
              else if (face === 'east') { yaw = 270; seatId = 'ff:east_sit'; }
              else if (face === 'south') { yaw = 0; seatId = 'ff:north_sit'; }
              else if (face === 'west') { yaw = 90; seatId = 'ff:west_sit'; }
            } catch {}
            e.dimension.runCommand(`summon ${seatId} ${e.block.x} ${e.block.y} ${e.block.z}`);
            e.dimension.runCommand(`execute positioned ${e.block.x} ${e.block.y} ${e.block.z} as @e[type=${seatId},c=1] run tp @s ${e.block.x} ${e.block.y} ${e.block.z} ${yaw} 0`);
            e.player.runCommand(`execute at @e[type=player] positioned ${x} ${y} ${z} run ride @s start_riding @e[type=${seatId},c=1] teleport_rider`);
          },
          onPlayerDestroy: function (e) {
            if (!e.player) return;
            let playerLoc = e.player.location;
            playerLoc.x -= 0.5;
            playerLoc.z -= 0.5;
      
            if (playerLoc.x != e.block.location.x) return;
            if (playerLoc.y != e.block.location.y) return;
            if (playerLoc.z != e.block.location.z) return;
      
            e.player.runCommand("ride @s stop_riding");
          },
          onPlace: function (e) {
            if (!e.block) return;
            let block = e.block.above();
            if (!block) return;
          }
        });

        ffh.blockComponentRegistry.registerCustomComponent('ff:lines_couch', {
            onPlayerInteract: function (e) {
                let {
                  x,
                  y,
                  z
                } = e.block.location;
                const equippable = e.player.getComponent("equippable");
                const mainhand = equippable ? equippable.getEquipment("Mainhand") : null;
                if (mainhand && mainhand.typeId.startsWith("ef:brush_")) {
                  e.cancel = true;
                  return;
                }
                if (mainhand && mainhand.typeId.startsWith("ff:white_cush")) {
                  e.cancel = true;
                  return;
                }
                if (!e.player.isSneaking) return;
                let blockStr = e.block.x + " " + e.block.y + " " + e.block.z;
                let yaw = 0;
                let seatId = 'ff:south_sit';
                try {
                  const face = e.block.permutation.getState('minecraft:cardinal_direction');
                  if (face === 'north') { yaw = 180; seatId = 'ff:north_sit'; }
                  else if (face === 'east') { yaw = 270; seatId = 'ff:west_sit'; }
                  else if (face === 'south') { yaw = 0; seatId = 'ff:south_sit'; }
                  else if (face === 'west') { yaw = 90; seatId = 'ff:east_sit'; }
                } catch {}
                e.dimension.runCommand(`summon ${seatId} ${e.block.x} ${e.block.y} ${e.block.z}`);
                e.dimension.runCommand(`execute positioned ${e.block.x} ${e.block.y} ${e.block.z} as @e[type=${seatId},c=1] run tp @s ${e.block.x} ${e.block.y} ${e.block.z} ${yaw} 0`);
                e.player.runCommand(`execute at @e[type=player] positioned ${x} ${y} ${z} run ride @s start_riding @e[type=${seatId},c=1] teleport_rider`);
              },
              onPlayerDestroy: function (e) {
                if (!e.player) return;
                let playerLoc = e.player.location;
                playerLoc.x -= 0.5;
                playerLoc.z -= 0.5;
          
                if (playerLoc.x != e.block.location.x) return;
                if (playerLoc.y != e.block.location.y) return;
                if (playerLoc.z != e.block.location.z) return;
          
                e.player.runCommand("ride @s stop_riding");
              },
              onPlace: function (e) {
                if (!e.block) return;
                let block = e.block.above();
                if (!block) return;
              }
            });
          });
    
