// minigames/fakkak.js
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");

async function addBalance(userId, amount, db) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: amount } },
    { upsert: true }
  );
}

const wordPool = require("../data/word_pool.json");
const updateMinigameStats = require("../utils/updateMinigameStats");

const activeGames = new Map();

module.exports = async function startFakkakGame(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  const usedIndices = new Set();
  let round = 0;
  const scores = new Map(); // { userId: { points, username } }

  const gameMessage = await interaction.reply({ content: "🕹️ جاري بدء لعبة فكّك...", fetchReply: true });
  activeGames.set(gameId, true);

  // سنحذف آخر رسالة بعد 10 ثوانٍ من إرسال الرسالة التالية
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    round++;

    // جلب كلمة عشوائية بدون تكرار
    let word;
    let attempts = 0;
    do {
      word = wordPool[Math.floor(Math.random() * wordPool.length)];
      attempts++;
    } while (usedIndices.has(word.word) && attempts < 10);
    usedIndices.add(word.word);

    const imageBuffer = await drawWordImage(word.word);
    const attachment = new AttachmentBuilder(imageBuffer, { name: `fakkak.png` });

    // إرسال رسالة جديدة لكل جولة
    const roundMsg = await interaction.followUp({
      content: `🎯 فكّك الكلمة (${round}/5)\n(أكتبها بحروف وبين كل حرف مسافة)`,
      files: [attachment],
      embeds: []
    });

    // بعد إرسال الرسالة الجديدة بعشر ثواني، احذف السابقة (إن وجدت)
    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => {
        toDelete.delete().catch(() => {});
      }, 10_000);
    }
    lastRoundMessage = roundMsg;

    const collector = gameMessage.channel.createMessageCollector({ time: 30_000 });
    let answered = false;

    collector.on("collect", async (msg) => {
      if (answered) return; // أول واحد فقط

      const expected = word.word.split("").join(" "); // مثل "ك ت ا ب"
      if (msg.content.trim() === expected) {
        answered = true;

        // تحديث نقاط اللاعب
        const prev = scores.get(msg.author.id) || { points: 0, username: msg.author.username };
        prev.points += 1;
        scores.set(msg.author.id, prev);

        // إضافة فلوس
        await addBalance(msg.author.id, 1000, db);
        await db.collection("transactions").insertOne({
          userId: msg.author.id,
          amount: 1000,
          reason: "ربح من لعبة فكك",
          timestamp: new Date()
        });

        await updateMinigameStats(db, msg.author.id, "fakkak", true);

        await msg.react("1415979896433278986");

        collector.stop();
        nextRound();
      }
    });

    collector.on("end", () => {
      if (!answered) nextRound();
    });
  }

  async function endGame() {
    activeGames.delete(gameId);

    // ترتيب اللاعبين
    const ranking = [...scores.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id, data], idx) => `**${idx + 1}. ${data.username}** - ${data.points} نقطة (💰 ${data.points * 1000})`)
      .join("\n");

    // إرسال رسالة النهاية
    const endMsg = await interaction.followUp({
      content:
        `🏁 انتهت لعبة فكك!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
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

async function drawWordImage(word) {
  const bgPath = path.join(__dirname, "../assets/fkk.png");
  const bg = await loadImage(bgPath);

  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  ctx.font = "90px Cairo";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(word, canvas.width / 2, 250);

  return canvas.encode("png");
}
