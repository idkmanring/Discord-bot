// minigames/jam3.js
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

module.exports = async function startJam3Game(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  const usedIndices = new Set();
  let round = 0;
  const scores = new Map();

  const gameMessage = await interaction.reply({ content: "🕹️ بدأت لعبة جمّع! ركز على تجميع الحروف...", fetchReply: true });
  activeGames.set(gameId, true);

  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    round++;

    let word;
    let attempts = 0;
    do {
      word = wordPool[Math.floor(Math.random() * wordPool.length)];
      attempts++;
    } while (usedIndices.has(word.word) && attempts < 10);
    usedIndices.add(word.word);

    const separated = word.word.split("").join(" ");
    const imageBuffer = await drawLettersImage(separated);
    const attachment = new AttachmentBuilder(imageBuffer, { name: `jam3.png` });

    const roundMsg = await interaction.followUp({
      content: `🎯 جمّع الكلمة (${round}/5)`,
      files: [attachment],
      embeds: []
    });

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
      if (answered || msg.author.bot) return;

      const guess = msg.content.replace(/\s+/g, "").trim();
      if (guess === word.word) {
        answered = true;

        const prev = scores.get(msg.author.id) || { points: 0, username: msg.author.username };
        prev.points += 1;
        scores.set(msg.author.id, prev);

        await addBalance(msg.author.id, 1000, db);
        await db.collection("transactions").insertOne({
          userId: msg.author.id,
          amount: 1000,
          reason: "ربح من لعبة جمع",
          timestamp: new Date()
        });

        await updateMinigameStats(db, msg.author.id, "jam3", true);
        await msg.react("1415979896433278986").catch(() => {});

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

    const ranking = [...scores.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id, data], idx) => `**${idx + 1}. ${data.username}** - ${data.points} نقطة (💰 ${data.points * 1000})`)
      .join("\n");

    const endMsg = await interaction.followUp({
      content: `🏁 انتهت لعبة جمّع!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
      components: [], embeds: [], files: []
    });

    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => {
        toDelete.delete().catch(() => {});
      }, 10_000);
    }

    setTimeout(() => { endMsg.delete().catch(() => {}); }, 25_000);
    return endMsg;
  }

  nextRound();
};

async function drawLettersImage(letters) {
  const bgPath = path.join(__dirname, "../assets/gam3.png");
  const bg = await loadImage(bgPath);
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);
  ctx.font = "90px Cairo";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(letters, canvas.width / 2, 250);
  return canvas.encode("png");
}