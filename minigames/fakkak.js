// minigames/fakkak.js
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// إعداد Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function addBalance(userId, amount, db) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: amount } },
    { upsert: true }
  );
}

const updateMinigameStats = require("../utils/updateMinigameStats");

const activeGames = new Map();

// ==========================================
// 1. توليد 5 كلمات جديدة تماماً وعدم تكرارها
// ==========================================
async function generateFakkakWords(db) {
  const prompt = `أنت خبير في اللغة العربية. قم بتوليد 5 كلمة عربية فصحى أصيلة ومألوفة جداً، تتكون من 3 إلى 5 حروف كحد أقصى.
يجب أن تكون الكلمات نكرة (بدون ال التعريف)، وبدون تشكيل، وبدون أي نصوص إضافية.
تحذير صارم جداً: المثال أدناه للتنسيق فقط. إياك أن تنسخ الكلمات الموجودة في المثال (مثل كلمة١، كلمة٢...). استخدم كلمات عربية حقيقية فقط.
يجب أن ترجع النتيجة بصيغة JSON array فقط، مثال للتنسيق:
["كلمة١", "كلمة٢", "كلمة٣", "كلمة٤", "كلمة٥"]`;

  let aiWords = [];
  const usedWordsCol = db.collection("used_fakkak_words");

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { temperature: 1.3 } 
    });
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    aiWords = JSON.parse(text);
    
  } catch (err) {
    console.error("Gemini Parsing Error in Fakkak:", err.message);
    // كلمات احتياطية في حال فشل الذكاء الاصطناعي
    aiWords = ["كتاب", "قمر", "شمس", "جبل", "نهر", "بحر", "شجر", "سماء", "نجم", "أرض", "عالم", "وطن"];
  }

  const finalWords = [];

  // التحقق من قاعدة البيانات لضمان عدم التكرار
  for (let word of aiWords) {
    if (finalWords.length >= 5) break; 
    if (typeof word !== "string" || word.length < 3 || word.length > 5) continue;
    
    // 🔴 فلتر قوي: يمنع دخول أي كلمة تحتوي على كلمة "كلمة" (عشان نضمن ما ينسخ المثال)
    if (word.includes("كلمة")) continue;
    
    const exists = await usedWordsCol.findOne({ word });
    if (!exists) {
      finalWords.push(word);
      // حفظ الكلمة عشان ما تتكرر بالجولات الجاية
      await usedWordsCol.insertOne({ word, usedAt: new Date() });
    }
  }

  // في حال نقصت الكلمات نعوضها من الاحتياطي
  const fallbacks = ["قلم", "عسل", "ورد", "سيف", "خيل", "ليل", "فجر", "عطر", "حلم", "مطر"];
  while (finalWords.length < 5) {
    let fw = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    if (!finalWords.includes(fw)) {
      finalWords.push(fw);
      await usedWordsCol.updateOne({ word: fw }, { $set: { usedAt: new Date() } }, { upsert: true });
    }
  }

  return finalWords;
}

// ==========================================
// 2. إدارة اللعبة الرئيسية
// ==========================================
module.exports = async function startFakkakGame(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  // رسالة انتظار أثناء جلب الكلمات
  const gameMessage = await interaction.reply({ content: "⏳ جاري تجهيز كلمات حصرية للعبة...", fetchReply: true });
  activeGames.set(gameId, true);

  // توليد 5 كلمات للجولة الحالية
  const roundWords = await generateFakkakWords(db);

  let round = 0;
  const scores = new Map(); // { userId: { points, username } }

  await gameMessage.edit({ content: "🕹️ بدأت لعبة فكّك! ركز على الحروف..." });
  
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    
    const currentWord = roundWords[round];
    round++;

    const imageBuffer = await drawWordImage(currentWord);
    const attachment = new AttachmentBuilder(imageBuffer, { name: `fakkak.png` });

    const roundMsg = await interaction.followUp({
      content: `🎯 فكّك الكلمة (${round}/5)\n(أكتبها بحروف وبين كل حرف مسافة)`,
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

      // تجهيز الكلمة (تقسيمها بمسافات عشان نقارنها بإجابة اللاعب)
      const expected = currentWord.split("").join(" "); 
      // تنظيف إجابة اللاعب من المسافات الزائدة
      const userGuess = msg.content.trim().replace(/\s+/g, " ");

      if (userGuess === expected) {
        answered = true;

        const prev = scores.get(msg.author.id) || { points: 0, username: msg.author.username };
        prev.points += 1;
        scores.set(msg.author.id, prev);

        await addBalance(msg.author.id, 1000, db);
        await db.collection("transactions").insertOne({
          userId: msg.author.id,
          amount: 1000,
          reason: "ربح من لعبة فكك",
          timestamp: new Date()
        });

        await updateMinigameStats(db, msg.author.id, "fakkak", true);

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
      content:
        `🏁 انتهت لعبة فكك!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
      components: [],
      embeds: [],
      files: []
    });

    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => {
        toDelete.delete().catch(() => {});
      }, 10_000);
    }

    setTimeout(() => {
      endMsg.delete().catch(() => {});
    }, 25_000);

    return endMsg;
  }

  nextRound();
};

// ==========================================
// 3. رسم الكلمة على الصورة
// ==========================================
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