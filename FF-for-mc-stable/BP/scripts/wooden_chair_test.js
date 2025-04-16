	import { world, system } from '@minecraft/server';

    system.beforeEvents.startup.subscribe(function (initEvent) {
        initEvent.blockComponentRegistry.registerCustomComponent('ff:rider', {
            onPlayerInteract: function (e) {
                let {
                  x,
                  y,
                  z
                } = e.block.location;
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
          });
    

system.beforeEvents.startup.subscribe(function (initEvent) {
    initEvent.blockComponentRegistry.registerCustomComponent('ff:rider_couch', {
        onPlayerInteract: function (e) {
            let {
              x,
              y,
              z
            } = e.block.location;
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
      });
