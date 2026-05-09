// minigames/flags_country.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addGameReward } = require("../utils/economyEffects");

async function addBalance(userId, amount, db) {
  return addGameReward(userId, amount, db);
}

const flags = require("../data/flags.json");
const updateMinigameStats = require("../utils/updateMinigameStats");

const activeGames = new Map();

module.exports = async function startFlagsCountryGame(interaction, db) {
  const gameId = interaction.id; // نستخدم ID مميز للتفاعل
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  let round = 0;
  const scores = new Map(); // { userId: { points, username } }

  const gameMessage = await interaction.reply({ content: "🕹️ جاري بدء لعبة علم + دولة ...", fetchReply: true });
  activeGames.set(gameId, true);

  // سنحذف آخر رسالة بعد 10 ثوانٍ من إرسال الرسالة التالية
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    round++;

    const choices = shuffle([...flags]).slice(0, 4);
    const correct = choices[Math.floor(Math.random() * choices.length)];

    const buttons = new ActionRowBuilder().addComponents(
      choices.map((flag) =>
        new ButtonBuilder()
          .setCustomId(`flag_${round}_${flag.country}`)
          .setLabel(flag.country)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    // إرسال رسالة جديدة لكل جولة بدلاً من تعديل رسالة واحدة
    const roundMsg = await interaction.followUp({
      content: `🏳️ (${round}/5)\nاختر اسم الدولة:`,
      files: [correct.image],
      components: [buttons],
      embeds: []
    });

    // بعد إرسال الرسالة الجديدة بعشر ثوانٍ، احذف السابقة (إن وجدت)
    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => {
        toDelete.delete().catch(() => {});
      }, 10_000);
    }
    lastRoundMessage = roundMsg;

    // اجمع تفاعلات الأزرار على رسالة الجولة نفسها
    const collector = roundMsg.createMessageComponentCollector({ time: 30_000 });
    let answered = false;

    collector.on("collect", async (btn) => {
      const picked = btn.customId.split("_")[2];
      const userId = btn.user.id;

      // لتفادي "This interaction failed"
      await btn.deferUpdate().catch(() => {});

      if (answered) return;

      if (picked === correct.country) {
        answered = true;

        // تحديث نقاط اللاعب
        const prev = scores.get(userId) || { points: 0, username: btn.user.username };
        prev.points += 1;
        scores.set(userId, prev);

        // إضافة فلوس
        const reward = await addBalance(userId, 1000, db);
        await db.collection("transactions").insertOne({
          userId,
          amount: reward.finalAmount,
          reason: "ربح من لعبة اعلام دول",
          timestamp: new Date()
        });

        await updateMinigameStats(db, userId, "flags_country", true);

        // رسالة علنية تُعلن الفائز في هذه الجولة وتحذف بعد 10 ثوانٍ
        const winMsg = await interaction.followUp({
          content: `${btn.user.username} جاوب صح! وكسب 1000 ريال + نقطة`
        });
        setTimeout(() => {
          winMsg.delete().catch(() => {});
        }, 10_000);

        collector.stop();
        nextRound();
      }
      // لا نرسل رسالة عند الإجابة الخاطئة (ولا ephemeral)
    });

    collector.on("end", () => {
      if (!answered) nextRound();
    });
  }

  async function endGame() {
    activeGames.delete(gameId);

    // ترتيب اللاعبين حسب النقاط
    const ranking = [...scores.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id, data], idx) => `**${idx + 1}. ${data.username}** - ${data.points} نقطة (💰 ${data.points * 1000})`)
      .join("\n");

    // إرسال رسالة النهاية كرسالة جديدة
    const endMsg = await interaction.followUp({
      content:
        `🏁 انتهت اللعبة!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
      components: [],
      embeds: [],
      files: []
    });

    // حذف آخر رسالة جولة بعد 10 ثوانٍ من إرسال رسالة النهاية
    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => {
        toDelete.delete().catch(() => {});
      }, 10_000);
    }

    // حذف رسالة النهاية بعد 25 ثانية
    setTimeout(() => {
      endMsg.delete().catch(() => {});
    }, 25_000);

    return endMsg;
  }

  nextRound();
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
