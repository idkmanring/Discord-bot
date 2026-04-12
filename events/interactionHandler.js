// events/interactionHandler.js
const startFakkakGame = require("../minigames/fakkak");
const startJam3Game = require("../minigames/jam3");
const startAsra3Game = require("../minigames/asra3");
const startRakkibGame = require("../minigames/rakkib");
const startFlagsCountryGame = require("../minigames/flags_country");
const startFlagsCapitalGame = require("../minigames/flags_capital");

// استدعاء ملفات الألعاب الجديدة 👇
const { startHarfFromMenu } = require("../minigames/harf");
const { startWordleFromMenu } = require("../minigames/wordle");
const { startPicChallengeFromMenu } = require("../minigames/pic_challenge");
const { startChainedWordsFromMenu } = require("../minigames/chained_words");
const { startFeudLobby } = require("../minigames/family_feud"); // 🔴 إضافة استدعاء صراع العائلات
const { startDawamaLobby } = require("../minigames/dawama");
const showMinigameStats = require("../utils/minigameStats");
const { startPasswordLobby } = require("../minigames/passguess");
const { startImposterLobby } = require("../minigames/imposter");


module.exports = async function handleInteraction(interaction, db) {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

  const userId = interaction.user.id;

  // 📍 تشغيل اللعبة بناءً على الاختيار
  if (interaction.customId === "minigame_menu") {
    const gameId = interaction.values[0];

    const runners = {
      fakkak: startFakkakGame,
      jam3: startJam3Game,
      asra3: startAsra3Game,
      rakkib: startRakkibGame,
      flags_country: startFlagsCountryGame,
      flags_capital: startFlagsCapitalGame,
      harf: startHarfFromMenu,     
      wordle: startWordleFromMenu,  
      pic_challenge: startPicChallengeFromMenu,
      chained_words: startChainedWordsFromMenu,
      feud: startFeudLobby,
      dawama: startDawamaLobby,
      password: startPasswordLobby,
      imposter: startImposterLobby,
      // 🔴 ربط خيار كلمة المرور بالدالة
    };

    const runner = runners[gameId];
    if (!runner) return interaction.reply({ content: " اللعبة غير متوفرة.<:icons8wrong1001:1415979909825695914>", ephemeral: true });

    await runner(interaction, db);
  }

  // 📍 زر الإحصائيات
  if (interaction.customId === "minigame_stats") {
    await showMinigameStats(interaction, db);
  }
}
