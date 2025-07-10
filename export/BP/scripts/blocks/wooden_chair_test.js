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
                let blockStr = e.block.x + " " + e.block.y + " " + e.block.z;
                e.dimension.runCommand("summon ff:sit " + blockStr);
                e.dimension.runCommand("execute as @e[type=ff:sit,c=1] run tp @s " + blockStr + " facing @p");
                e.player.runCommand(`execute at @e[type=player] positioned ${x} ${y} ${z} run ride @s start_riding @e[type=ff:sit,c=1] teleport_rider`);
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
            e.dimension.runCommand("summon ff:sit_couch " + blockStr);
            e.dimension.runCommand("execute as @e[type=ff:sit_couch,c=1] run tp @s " + blockStr + " facing @p");
            e.player.runCommand(`execute at @e[type=player] positioned ${x} ${y} ${z} run ride @s start_riding @e[type=ff:sit_couch,c=1] teleport_rider`);
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
                e.dimension.runCommand("summon ff:sit_couch2 " + blockStr);
                e.dimension.runCommand("execute as @e[type=ff:sit_couch2,c=1] run tp @s " + blockStr + " facing @p");
                e.player.runCommand(`execute at @e[type=player] positioned ${x} ${y} ${z} run ride @s start_riding @e[type=ff:sit_couch2,c=1] teleport_rider`);
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
    
