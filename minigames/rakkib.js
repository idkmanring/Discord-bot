// minigames/rakkib.js
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
const wordValidationCache = new Map(); // 🔴 ذاكرة مؤقتة للتحقق الفوري

// ==========================================
// 1. توليد 5 كلمات جديدة (نظام الطوارئ الثلاثي + 4 إلى 6 حروف)
// ==========================================
async function generateRakkibWords(db) {
  const prompt = `أنت خبير في اللغة العربية. قم بتوليد 5 كلمة عربية فصحى أصيلة ومألوفة جداً، تتكون من 5 إلى 6 حروف كحد أقصى.
يجب أن تكون الكلمات نكرة (بدون ال التعريف)، وبدون تشكيل، وبدون أي نصوص إضافية.
تلميح مهم جداً: ابتكر كلمات جديدة كلياً في كل مرة، ولا تكرر الكلمات الشائعة.
يجب أن ترجع النتيجة بصيغة JSON array فقط، مثال للتنسيق (لا تستخدم هذه الكلمات الوهمية في إجابتك أبداً):
["كلمةأولى", "كلمةثانية", "كلمةثالثة", "كلمةرابعة", "كلمةخامسة"]`;

  let aiWords = [];
  const usedWordsCol = db.collection("used_rakkib_words");
  
  try {
    // 🔴 المحاولة الأولى: الموديل 3.1
    const primaryModel = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
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

  // فلترة الكلمات وحفظ الجديد منها
  for (let word of aiWords) {
    if (finalWords.length >= 5) break; 
    if (typeof word !== "string" || word.length < 4 || word.length > 6) continue;
    
    const exists = await usedWordsCol.findOne({ word });
    if (!exists) {
      finalWords.push(word);
      await usedWordsCol.insertOne({ word, usedAt: new Date() });
    }
  }

  // إذا لم تكتمل الـ 5 كلمات (في حال الذكاء الاصطناعي جاب كلمات مكررة أو فشل) نسحب من المونقو
  if (finalWords.length < 5) {
    const needed = 5 - finalWords.length;
    const randomDocs = await usedWordsCol.aggregate([{ $sample: { size: needed + 10 } }]).toArray();
    for (let doc of randomDocs) {
      if (finalWords.length >= 5) break;
      if (!finalWords.includes(doc.word) && doc.word.length >= 4 && doc.word.length <= 6) {
        finalWords.push(doc.word);
      }
    }
  }

  // احتياطي أخير لو قاعدة البيانات كانت فارغة تماماً (أول مرة يشتغل فيها البوت)
  const fallbacks = ["دفتر", "سفينة", "مفتاح", "عصفور", "صديق", "حديقة", "طريق", "مصباح", "كتابة", "رسالة"];
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
// 2. التحقق السريع من الكلمات (كاش + مهلة زمنية + 2.5 flash)
// ==========================================
async function checkValidArabicWord(word) {
  // 1. التحقق من الكاش الفوري (صفر ثانية)
  if (wordValidationCache.has(word)) {
    return wordValidationCache.get(word);
  }

  try {
    // 2. استخدام المودل الأسرع للتحقق
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `هل الكلمة "${word}" هي كلمة عربية فصحى صحيحة ولها معنى معروف؟ أجب بـ "نعم" أو "لا" فقط.`;
    
    // إنشاء مؤقت زمني (ثانيتين كحد أقصى) لتجنب التعليق
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 2000));
    
    // تشغيل طلب الذكاء الاصطناعي
    const aiPromise = model.generateContent(prompt).then(res => res.response.text().trim().includes("نعم"));
    
    // نتسابق أيهم يخلص أول (الذكاء الاصطناعي أم المؤقت)
    const isValid = await Promise.race([aiPromise, timeoutPromise]);
    
    // حفظ النتيجة في الكاش للسرعة مستقبلاً
    wordValidationCache.set(word, isValid);
    return isValid;

  } catch (err) {
    console.error("Validation Error:", err.message);
    return false; 
  }
}

function isAnagram(input, base) {
  if (input.length !== base.length) return false;
  return input.split("").sort().join("") === base.split("").sort().join("");
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==========================================
// 3. إدارة اللعبة الرئيسية
// ==========================================
module.exports = async function startRakkibGame(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });

  const gameMessage = await interaction.reply({ content: "⏳ جاري تجهيز كلمات حصرية للعبة...", fetchReply: true });
  activeGames.set(gameId, true);

  const roundWords = await generateRakkibWords(db);
  let round = 0;
  const scores = new Map();

  await gameMessage.edit({ content: "🕹️ بدأت لعبة ركّب! رتب الحروف لتكوين كلمة صحيحة..." });
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    
    const currentWord = roundWords[round];
    round++;

    const shuffled = shuffle(currentWord.split(""));
    const imageBuffer = await drawLettersImage(shuffled.join(" "));
    const attachment = new AttachmentBuilder(imageBuffer, { name: `rakkib.png` });

    const roundMsg = await interaction.followUp({
      content: `🔤 كوّن كلمة من هذه الحروف (${round}/5)`,
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
    let isProcessing = false; 

    collector.on("collect", async (msg) => {
      if (answered || isProcessing || msg.author.bot) return;

      const input = msg.content.replace(/\s+/g, "").trim();

      if (!isAnagram(input, currentWord)) return;

      isProcessing = true; 
      
      // 🔴 إضافة رياكشن للمستخدم عشان يعلم أنه يتم التحقق ولا يرسل ثانية
      await msg.react("⏳").catch(() => {});

      let isValid = false;
      let pointsEarned = 1;
      let cashEarned = 1000;

      if (input === currentWord) {
        isValid = true;
        pointsEarned = 2;
        cashEarned = 2000;
      } else {
        isValid = await checkValidArabicWord(input);
      }

      // إزالة رياكشن الـ ⏳
      await msg.reactions.cache.get("⏳")?.remove().catch(() => {});

      if (isValid) {
        answered = true;

        const prev = scores.get(msg.author.id) || { points: 0, username: msg.author.username };
        prev.points += pointsEarned;
        scores.set(msg.author.id, prev);

        await addBalance(msg.author.id, cashEarned, db);
        await db.collection("transactions").insertOne({
          userId: msg.author.id,
          amount: cashEarned,
          reason: "ربح من لعبة ركب",
          timestamp: new Date()
        });

        await updateMinigameStats(db, msg.author.id, "rakkib", true);

        await msg.react("1415979896433278986").catch(() => {});

        collector.stop();
        nextRound();
      } else {
        // إذا الكلمة خطأ (مجرد حروف مجمعة)، نعطيه X ونفتح المجال يجاوبون
        await msg.react("❌").catch(() => {});
        isProcessing = false;
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
        `🏁 انتهت لعبة ركّب!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
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
// 4. رسم الحروف الملخبطة على الصورة
// ==========================================
async function drawLettersImage(letters) {
  const bgPath = path.join(__dirname, "../assets/rakb.png");
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