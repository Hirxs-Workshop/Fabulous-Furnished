import { world, system, BlockTypes, Player } from "@minecraft/server";

const achievements = {
    "ff:spicewood_log": {
        title: "A Spicy Touch",
        description: "Place a Spicewood log block"
    }
};

function adjustTextLength(text = '', totalLength = 100) {
  return (text.slice(0, totalLength)).padEnd(totalLength, '\t');
}

function dynamicToast(title = '', message = '', icon = '', background = 'textures/ui/greyBorder') {
  return "§N§O§T§I§F§I§C§A§T§I§O§N" +
    adjustTextLength(title, 100) +
    adjustTextLength(message, 200) +
    adjustTextLength(icon, 100) +
    adjustTextLength(background, 100);
}

function dynamicToastEvent(text) {
  const contents = text.split('|');
  if (contents[3] === undefined) { contents[3] = 'textures/ui/greyBorder'; }
  return "§N§O§T§I§F§I§C§A§T§I§O§N" +
    adjustTextLength(contents[0], 100) +
    adjustTextLength(contents[1], 200) +
    adjustTextLength(contents[2], 100) +
    adjustTextLength(contents[3], 100);
}

const playerAchievements = new Map();

function loadAchievements() {
    const storedData = world.getDynamicProperty("achievements");
    if (storedData) {
        const parsed = JSON.parse(storedData);
        for (const [playerId, achievements] of Object.entries(parsed)) {
            playerAchievements.set(playerId, new Set(achievements));
        }
    }
}

function saveAchievements() {
    const saveData = {};
    playerAchievements.forEach((achievements, playerId) => {
        saveData[playerId] = [...achievements];
    });
    world.setDynamicProperty("achievements", JSON.stringify(saveData));
}

world.afterEvents.playerPlaceBlock.subscribe(event => {
    const player = event.player;
    const blockType = event.block.typeId;
    
    if (achievements[blockType] && !hasAchievement(player, blockType)) {
        grantAchievement(player, blockType);
    }
});

world.afterEvents.playerInteractWithBlock.subscribe(event => {
    const player = event.player;
    const equip = player.getComponent('equippable');
    const item = equip.getEquipment('Mainhand');
    
    if (item.typeId !== 'minecraft:stick' &&
        event.block.typeId === "minecraft:lever") {
        resetAchievements(player);
    }
});

function hasAchievement(player, achievementId) {
    const achievements = playerAchievements.get(player.id) || new Set();
    return achievements.has(achievementId);
}

function grantAchievement(player, achievementId) {
    if (!playerAchievements.has(player.id)) {
        playerAchievements.set(player.id, new Set());
    }
    
    playerAchievements.get(player.id).add(achievementId);
    saveAchievements();
    
    const achievement = achievements[achievementId];
	      player.sendMessage(dynamicToast(
        `§h${achievement.title}`, 
        `§h${achievement.description}`, 
        "textures/blocks/spicewood_log_side", 
        "textures/ff_ui/ff_badge_ui"
      ));
}

function resetAchievements(player) {
    playerAchievements.delete(player.id);
    saveAchievements();
    player.sendMessage("§cTodos tus logros han sido restablecidos!");
}

system.run(() => {
    loadAchievements();
    world.sendMessage("§aSistema de logros cargado!");
});