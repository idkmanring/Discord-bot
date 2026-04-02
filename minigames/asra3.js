// minigames/asra3.js
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
async function generateAsra3Words(db) {
  const prompt = `أنت خبير في اللغة العربية. قم بتوليد 5 كلمة عربية فصحى أصيلة ومألوفة جداً، تتكون من 3 إلى 5 حروف كحد أقصى.
يجب أن تكون الكلمات نكرة (بدون ال التعريف)، وبدون تشكيل، وبدون أي نصوص إضافية.
تحذير صارم جداً: المثال أدناه للتنسيق فقط. إياك أن تنسخ الكلمات الموجودة في المثال (مثل كلمة١، كلمة٢...). استخدم كلمات عربية حقيقية فقط.
يجب أن ترجع النتيجة بصيغة JSON array فقط، مثال للتنسيق:
["كلمة١", "كلمة٢", "كلمة٣", "كلمة٤", "كلمة٥"]`;

  let aiWords = [];
  const usedWordsCol = db.collection("used_asra3_words");

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { temperature: 1.3 } 
    });
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    aiWords = JSON.parse(text);
    
  } catch (err) {
    console.error("Gemini Parsing Error in Asra3:", err.message);
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

  // في حال نقصت الكلمات نعوضها من الاحتياطي أو المونقو
  if (finalWords.length < 5) {
    const needed = 5 - finalWords.length;
    const randomDocs = await usedWordsCol.aggregate([{ $sample: { size: needed + 10 } }]).toArray();
    for (let doc of randomDocs) {
      if (finalWords.length >= 5) break;
      if (!finalWords.includes(doc.word) && doc.word.length >= 3 && doc.word.length <= 5) {
        finalWords.push(doc.word);
      }
    }
  }

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
module.exports = async function startAsra3Game(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  // رسالة انتظار أثناء جلب الكلمات من الذكاء الاصطناعي
  const gameMessage = await interaction.reply({ content: "⏳ جاري تجهيز كلمات حصرية للعبة...", fetchReply: true });
  activeGames.set(gameId, true);

  // توليد 5 كلمات للجولة الحالية
  const roundWords = await generateAsra3Words(db);

  let round = 0;
  const scores = new Map(); // { userId: { points, username } }

  // تعديل الرسالة لبدء اللعبة
  await gameMessage.edit({ content: "🕹️ بدأت لعبة أسرع! جهز كيبوردك..." });
  
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    
    const currentWord = roundWords[round]; // سحب الكلمة المخصصة لهذه الجولة
    round++;

    const imageBuffer = await drawWordImage(currentWord);
    const attachment = new AttachmentBuilder(imageBuffer, { name: `asra3.png` });

    // إرسال رسالة جديدة لكل جولة بدلاً من تعديل الرسالة
    const roundMsg = await interaction.followUp({
      content: `⚡ اكتب الكلمة بسرعة (${round}/5)`,
      files: [attachment],
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

    const collector = gameMessage.channel.createMessageCollector({ time: 30_000 });
    let answered = false;

    collector.on("collect", async (msg) => {
      if (answered || msg.author.bot) return; // أول واحد فقط

      const guess = msg.content.replace(/\s+/g, "").trim();
      if (guess === currentWord) { // التحقق الدقيق من البوت
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
          reason: "ربح من لعبة أسرع",
          timestamp: new Date()
        });

        await updateMinigameStats(db, msg.author.id, "asra3", true);

        await msg.react("1415979896433278986").catch(() => {}); // ✅ يظل نفس نظام الرياكشن

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

    // إرسال رسالة النهاية كرسالة جديدة
    const endMsg = await interaction.followUp({
      content:
        `🏁 انتهت لعبة أسرع!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
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

  // بدء الجولة الأولى
  nextRound();
};

// ==========================================
// 3. رسم الكلمة على الصورة
// ==========================================
async function drawWordImage(word) {
  const bgPath = path.join(__dirname, "../assets/asr3.png");
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