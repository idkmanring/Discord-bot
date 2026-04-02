// minigames/pic_challenge.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// إعداد Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const PIC_CHALLENGE_REWARD = 10000;
const picSessions = new Map();

// ==========================================
// 1. توليد التحدي الذكي عبر Gemini (نسخة صارمة جداً)
// ==========================================
async function generateSmartChallenge() {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  
  const prompt = `أنت صانع ألعاب كلمات ذكي. مهمتك توليد لغز "خمن الكلمة من الصور".
الفكرة: كلمة عربية معروفة تتكون من دمج مقطعين (أو 3 كحد أقصى) لشيئين "ماديين ملموسين" فقط.

القواعد الصارمة جداً (إن خالفاتها ستفشل اللعبة):
1. يجب أن يكون الـ "search_term_en" لشيء مادي ملموس يمكن تصويره (حيوان، جماد، طعام، رقم، شكل).
2. ممنوع منعاً باتاً استخدام الأفعال (مثل Tell, Run) أو الأوقات (مثل Eve, Night) أو الأسماء الشخصية أو المشاعر.
3. اكتب الـ "search_term_en" بكلمة إنجليزية واحدة أو اثنتين كحد أقصى وبدون أي تعقيد (مثال: Tooth, Moon, Duck, Key, Frying Pan).
4. اعتمد على التقسيم المباشر البسيط وليس التقسيم الصوتي المعقد الإنجليزي.

أمثلة صحيحة 100% للقياس عليها:
- ليمون = لي (Water hose) + مون (Moon)
- بطريق = بط (Duck) + ريق (Water drop)
- كيبورد = كي (Key) + بورد (Wood board)
- باندا = بان (Frying pan) + دا (Dad)
- سنفور = سن (Tooth) + فور (Number 4)
- باركود = بار (Chocolate bar) + كود (Barcode)

أرجع النتيجة بصيغة JSON فقط بهذا الشكل:
{
  "answer": "ليمون",
  "parts": [
    { "word": "لي", "search_term_en": "Water hose", "lang": "عربي" },
    { "word": "مون", "search_term_en": "Moon", "lang": "إنجليزي" }
  ]
}`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const data = JSON.parse(text);
      if (data.answer && data.parts && data.parts.length >= 2) {
        return data;
      }
    } catch (err) {
      console.error("Gemini Parsing Error:", err);
    }
    attempts++;
  }
  
  // لغز احتياطي 100% آمن
  return {
    answer: "بطريق",
    parts: [
      { word: "بط", search_term_en: "Duck", lang: "عربي" },
      { word: "ريق", search_term_en: "Water drop", lang: "عربي" }
    ]
  };
}

// ==========================================
// 2. دمج الصور والرسم عبر Canvas (مع نظام الطوارئ الثلاثي)
// ==========================================
async function buildChallengeImage(challenge, showHint = false) {
  const imgSize = 150; 
  const gap = 80;      
  const padding = 40;  
  
  const extraHintHeight = showHint ? 60 : 0; 
  const width = (challenge.parts.length * imgSize) + ((challenge.parts.length - 1) * gap) + (padding * 2);
  const height = imgSize + (padding * 2) + extraHintHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // رسم الخلفية
  ctx.fillStyle = '#2b2d31';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 20);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let currentX = width - padding - (imgSize / 2);

  for (let i = 0; i < challenge.parts.length; i++) {
    const part = challenge.parts[i];
    const safeTerm = part.search_term_en || "Unknown";
    
    let imgBuffer = null;
    let success = false;

    // التخفي كمتصفح حقيقي لتفادي حظر المواقع (Cloudflare)
    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };

    // الخطة أ: الذكاء الاصطناعي (Pollinations)
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safeTerm + " isolated object real photo")}?width=300&height=300&nologo=true&seed=${randomSeed}`;
      
      const response = await fetch(aiUrl, fetchOptions);
      if (response.ok) {
        imgBuffer = await response.arrayBuffer();
        success = true;
      }
    } catch (err) { console.error("Plan A Failed:", err.message); }

    // الخطة ب: موقع فليكر للصور الحقيقية (LoremFlickr)
    if (!success) {
      try {
        const flickrWord = encodeURIComponent(safeTerm.split(" ")[0]); // نأخذ أول كلمة فقط لزيادة الدقة
        const flickrUrl = `https://loremflickr.com/300/300/${flickrWord}`;
        const response = await fetch(flickrUrl, fetchOptions);
        if (response.ok) {
          imgBuffer = await response.arrayBuffer();
          success = true;
        }
      } catch (err) { console.error("Plan B Failed:", err.message); }
    }

    // الخطة ج: المربع النصي كحل أخير
    if (!success) {
      try {
        const fallbackUrl = `https://placehold.co/300x300/4f545c/FFF.png?text=${encodeURIComponent(safeTerm)}`;
        const response = await fetch(fallbackUrl, fetchOptions);
        if (response.ok) {
          imgBuffer = await response.arrayBuffer();
          success = true;
        }
      } catch (e) { console.error("Plan C Failed:", e.message); }
    }

    // الرسم النهائي
    try {
      if (success && imgBuffer) {
        const img = await loadImage(Buffer.from(imgBuffer));
        ctx.drawImage(img, currentX - (imgSize / 2), padding, imgSize, imgSize);
      } else {
        throw new Error("No Image Data");
      }
    } catch (e) {
      ctx.fillStyle = '#99aab5';
      ctx.fillRect(currentX - (imgSize / 2), padding, imgSize, imgSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Cairo';
      ctx.fillText(safeTerm.substring(0, 10), currentX, padding + (imgSize / 2));
    }

    // التلميح والعلامة الزائدة
    if (showHint) {
      ctx.fillStyle = '#f1c40f'; 
      ctx.font = 'bold 24px Cairo';
      ctx.fillText(part.lang, currentX, padding + imgSize + 30);
    }

    if (i < challenge.parts.length - 1) {
      currentX -= (imgSize / 2) + (gap / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px Arial';
      ctx.fillText('+', currentX, padding + (imgSize / 2));
      currentX -= (gap / 2) + (imgSize / 2);
    }
  }

  return canvas.toBuffer('image/png');
}

// ==========================================
// 3. خوارزمية التسامح في الإجابة (Levenshtein)
// ==========================================
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from(Array(a.length + 1), () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // حذف
        matrix[i][j - 1] + 1,      // إدخال
        matrix[i - 1][j - 1] + cost // استبدال
      );
    }
  }
  return matrix[a.length][b.length];
}

function isAnswerCorrect(guess, answer) {
  // تنظيف الكلمات من المسافات
  const g = guess.trim().replace(/\s+/g, "");
  const a = answer.trim().replace(/\s+/g, "");
  
  if (g === a) return true;
  
  // السماح بخطأ إملائي واحد (مسافة حرف أو حرف ناقص)
  const distance = getEditDistance(g, a);
  return distance <= 1; 
}


// ==========================================
// 4. إدارة اللعبة
// ==========================================
async function winRewardLocally(db, userId, amount, reason) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: amount } },
    { upsert: true }
  );
  await db.collection("transactions").insertOne({
    userId: String(userId), amount, reason, timestamp: new Date()
  });
}

async function startPicChallengeForUser(channel, userId) {
  const loadingMsg = await channel.send("⏳ جاري توليد تحدي صور ذكي عبر الذكاء الاصطناعي...");
  
  const challenge = await generateSmartChallenge();
  const imgBuffer = await buildChallengeImage(challenge, false);
  const attachment = new AttachmentBuilder(imgBuffer, { name: "pic_challenge.png" });

  const session = {
    userId, 
    challenge: challenge, 
    channelId: channel.id,
    ended: false,
    currentMessage: null,
    hintTimer: null
  };
  picSessions.set(userId, session);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`picchal_quit_${userId}`)
      .setLabel("انسحاب")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("1408077754557136926")
  );

  await loadingMsg.delete().catch(() => {});
  
  const sent = await channel.send({
    content: `🖼️ **تحدي الصور!**\nاجمع معاني الصور من اليمين لليسار عشان تطلع بكلمة وحدة صحيحة. اكتب الكلمة بالشات:`,
    files: [attachment],
    components: [row]
  });

  session.currentMessage = sent;

  // ⏱️ نظام التلميح الذكي بعد 60 ثانية
  session.hintTimer = setTimeout(async () => {
    const currentSession = picSessions.get(userId);
    if (!currentSession || currentSession.ended) return;

    try {
      const hintImgBuffer = await buildChallengeImage(challenge, true);
      const hintAttachment = new AttachmentBuilder(hintImgBuffer, { name: "pic_hint.png" });
      
      await channel.send({
        content: `💡 **تلميح:** مرّت دقيقة! عشان نسهلها، تم إضافة لغة كل مقطع تحت صورته:`,
        files: [hintAttachment]
      });
    } catch (e) {
      console.error("Hint Error:", e);
    }
  }, 60 * 1000); // دقيقة كاملة
}

module.exports.startPicChallengeFromMenu = async function(interaction) {
  const userId = interaction.user.id;
  const prev = picSessions.get(userId);
  
  if (prev && !prev.ended && prev.channelId && prev.channelId !== interaction.channelId) {
    return interaction.reply({ content: `لديك جولة نشطة في <#${prev.channelId}>.`, ephemeral: true });
  }
  if (prev && !prev.ended) {
    prev.ended = true;
    if (prev.hintTimer) clearTimeout(prev.hintTimer);
    if (prev.currentMessage) setTimeout(() => prev.currentMessage.delete().catch(() => {}), 1000);
    picSessions.delete(userId);
  }

  await interaction.deferUpdate().catch(()=>{});
  await startPicChallengeForUser(interaction.channel, userId);
};

module.exports.handlePicChallengeGuess = async function(msg, db) {
  if (msg.author?.bot) return;
  const userId = msg.author.id;
  const s = picSessions.get(userId);
  
  if (!s || s.ended || msg.channel.id !== s.channelId) return;

  const guess = msg.content.trim();
  
  if (isAnswerCorrect(guess, s.challenge.answer)) {
    s.ended = true;
    if (s.hintTimer) clearTimeout(s.hintTimer); // إيقاف مؤقت التلميح

    await winRewardLocally(db, userId, PIC_CHALLENGE_REWARD, "فوز في تحدي الصور");
    
    await msg.reply(`🎉 صح عليك! الكلمة هي **${s.challenge.answer}**. كسبت 💰 ${PIC_CHALLENGE_REWARD.toLocaleString()}`);
    if (s.currentMessage) setTimeout(() => s.currentMessage.delete().catch(() => {}), 5000);
    picSessions.delete(userId);
  }
};

module.exports.handlePicChallengeButtons = async function(i) {
  const id = i.customId || "";
  const targetUserId = id.split("_")[2];

  if (i.user.id !== targetUserId) {
    return i.reply({ content: "هذا التحدي ليس لك.", ephemeral: true });
  }

  const s = picSessions.get(targetUserId);
  if (!s) return i.reply({ content: "لا توجد جولة نشطة.", ephemeral: true });

  await i.deferUpdate().catch(() => {});
  s.ended = true;
  if (s.hintTimer) clearTimeout(s.hintTimer); // إيقاف التلميح عند الانسحاب

  await i.channel.send(`❌ انسحبت من التحدي. الكلمة كانت: **${s.challenge.answer}**`);
  if (s.currentMessage) setTimeout(() => s.currentMessage.delete().catch(() => {}), 2000);
  picSessions.delete(targetUserId);
};

module.exports.hasActiveSession = (userId, channelId) => {
  const s = picSessions.get(userId);
  return Boolean(s && !s.ended && s.channelId === channelId);
};