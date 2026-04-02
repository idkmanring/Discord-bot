// minigames/jam3.js
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
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
// 1. توليد 5 كلمات جديدة تماماً (مع نظام طوارئ ثلاثي)
// ==========================================
async function generateJam3Words(db) {
  const prompt = `أنت خبير في اللغة العربية. قم بتوليد 5 كلمة عربية فصحى أصيلة ومألوفة جداً، تتكون من 3 إلى 5 حروف كحد أقصى.
يجب أن تكون الكلمات نكرة (بدون ال التعريف)، وبدون تشكيل، وبدون أي نصوص إضافية.
تلميح مهم جداً: ابتكر كلمات جديدة ومختلفة كلياً في كل مرة، ولا تستخدم الكلمات الوهمية الموجودة في المثال أدناه أبداً.
يجب أن ترجع النتيجة بصيغة JSON array فقط، مثال للتنسيق:
["كلمةأولى", "كلمةثانية", "كلمةثالثة", "كلمةرابعة", "كلمةخامسة"]`;

  let aiWords = [];
  const usedWordsCol = db.collection("used_jam3_words");

  try {
    // 🔴 المحاولة الأولى: الموديل 3.1
    const primaryModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { temperature: 1.4 } 
    });
    
    const result = await primaryModel.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    aiWords = JSON.parse(text);
    
  } catch (err) {
    console.warn("⚠️ الموديل الأساسي (3.1) مزدحم، جاري التحويل للموديل الاحتياطي (2.5)...");
    
    try {
      // 🟡 المحاولة الثانية: الموديل 2.5
      const fallbackModel = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { temperature: 1.4 } 
      });
      
      const result = await fallbackModel.generateContent(prompt);
      let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      aiWords = JSON.parse(text);
      
    } catch (fallbackErr) {
      console.error("❌ جميع الموديلات فشلت، جاري السحب عشوائياً من قاعدة البيانات...");
      
      // 🟢 المحاولة الثالثة: سحب كلمات عشوائية من المونقو دي بي
      try {
        const randomDocs = await usedWordsCol.aggregate([{ $sample: { size: 12 } }]).toArray();
        aiWords = randomDocs.map(doc => doc.word);
      } catch(dbErr) {
        aiWords = [];
      }
    }
  }

  const finalWords = [];

  // التحقق من قاعدة البيانات لضمان عدم التكرار
  for (let word of aiWords) {
    if (finalWords.length >= 5) break; 
    if (typeof word !== "string" || word.length < 3 || word.length > 5) continue;
    
    const exists = await usedWordsCol.findOne({ word });
    if (!exists) {
      finalWords.push(word);
      // حفظ الكلمة عشان ما تتكرر بالجولات الجاية
      await usedWordsCol.insertOne({ word, usedAt: new Date() });
    }
  }

  // إذا لم تكتمل الـ 5 كلمات (في حال الذكاء الاصطناعي فشل أو الكلمات مكررة) نسحب من المونقو
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

  // احتياطي أخير لو قاعدة البيانات كانت فارغة تماماً
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
module.exports = async function startJam3Game(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  // رسالة انتظار أثناء جلب الكلمات
  const gameMessage = await interaction.reply({ content: "⏳ جاري تجهيز كلمات حصرية للعبة...", fetchReply: true });
  activeGames.set(gameId, true);

  // توليد 5 كلمات للجولة الحالية
  const roundWords = await generateJam3Words(db);

  let round = 0;
  const scores = new Map(); // { userId: { points, username } }

  await gameMessage.edit({ content: "🕹️ بدأت لعبة جمّع! ركز على تجميع الحروف..." });

  // سنحذف آخر رسالة بعد 10 ثوانٍ من إرسال الرسالة التالية
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    
    const currentWord = roundWords[round];
    round++;

    // تفريق الحروف بمسافات عشان نرسمها على الصورة
    const separated = currentWord.split("").join(" ");
    const imageBuffer = await drawLettersImage(separated);
    const attachment = new AttachmentBuilder(imageBuffer, { name: `jam3.png` });

    // إرسال رسالة جديدة لكل جولة
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
      // إزالة المسافات من إجابة اللاعب للمقارنة السريعة والمباشرة
      const guess = msg.content.replace(/\s+/g, "").trim();

      if (answered || msg.author.bot) return; // أول واحد فقط

      if (guess === currentWord) {
        answered = true;

        // تحديث نقاط اللاعب
        const prev = scores.get(msg.author.id) || { points: 0, username: msg.author.username };
        prev.points += 1;
        scores.set(msg.author.id, prev);

        // فلوس
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

    // ترتيب اللاعبين
    const ranking = [...scores.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id, data], idx) => `**${idx + 1}. ${data.username}** - ${data.points} نقطة (💰 ${data.points * 1000})`)
      .join("\n");

    const endMsg = await interaction.followUp({
      content:
        `🏁 انتهت لعبة جمّع!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
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
// 3. رسم الكلمة المفرقة على الصورة
// ==========================================
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