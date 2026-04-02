// minigames/chained_words.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// إعداد Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CHAIN_REWARD_BASE = 15000;
const chainSessions = new Map();

// ==========================================
// 1. توليد التحدي الذكي (بدون ال التعريف + بدون تكرار)
// ==========================================
async function generateChainChallenge() {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: {
      temperature: 1.3 
    }
  });
  
  const topics = ["التكنولوجيا والإنترنت", "الطب والصحة", "الطبيعة والبيئة", "الفضاء والفلك", "الرياضة", "التجارة والمال", "السياسة", "التاريخ", "الفن والثقافة", "المطبخ والغذاء", "التعليم والمدرسة", "الأسرة والمجتمع"];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const prompt = `أنت صانع ألعاب كلمات ذكي. مهمتك توليد لغز "سلسلة الكلمات" (Chained Words) باللغة العربية.
الفكرة: الانتقال من الكلمة الأولى إلى الكلمة الأخيرة عبر 5 كلمات في المنتصف (الإجمالي 7 كلمات).

القواعد الذهبية والصارمة جداً: 
1. كل كلمتين متتاليتين (من الأعلى للأسفل) يجب أن تشكلا مصطلحاً عربياً منطقياً وواقعياً بنسبة 100٪ ومستخدماً في الحياة اليومية (مثل مضاف ومضاف إليه، أو صفة وموصوف).
2. يُمنع منعاً باتاً وضع كلمات لا تشكل معنى واضحاً عند دمجها.
3. ممنوع منعاً باتاً استخدام "ال" التعريف في بداية أي كلمة. جميع الكلمات يجب أن تكون نكرة (بدون ال). (مثال: اكتب "سيارة" وليس "السيارة"، اكتب "مدرسة" وليس "المدرسة").

لضمان عدم التكرار أبداً:
- ابدأ السلسلة بكلمة تتعلق بمجال (${randomTopic}).
- إياك أن تكرر السلاسل السابقة. كن مبدعاً في كل مرة.

مثال مثالي لسلسلة من 7 كلمات (بدون ال التعريف نهائياً):
1. سيارة
2. اسعاف (سيارة اسعاف)
3. سريع (اسعاف سريع)
4. جدا (سريع جدا)
5. صعب (جدا صعب)
6. مراس (صعب مراس)
7. قوي (مراس قوي)

أرجع النتيجة بصيغة JSON فقط بهذا الشكل وبدون أي نصوص إضافية:
{
  "chain": ["سيارة", "اسعاف", "سريع", "جدا", "صعب", "مراس", "قوي"]
}

شروط إضافية:
- المصفوفة "chain" يجب أن تحتوي على 7 كلمات بالضبط.
- كلمات فصحى ومنطقية ومفهومة وبدون تشكيل.
- كل عنصر عبارة عن كلمة واحدة فقط بدون مسافات.`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const data = JSON.parse(text);
      if (data.chain && data.chain.length === 7) {
        // تنظيف إضافي لإزالة "ال" لو الذكاء الاصطناعي أخطأ ووضعها
        return data.chain.map(word => {
          let cleaned = word.trim();
          if (cleaned.startsWith("ال") && cleaned.length > 3) cleaned = cleaned.substring(2);
          return cleaned;
        });
      }
    } catch (err) {
      console.error("Gemini Parsing Error in Chained Words:", err);
    }
    attempts++;
  }
  
  // لغز احتياطي 100% آمن
  return ["سيارة", "اسعاف", "سريع", "استجابة", "فورية", "جدا", "ممتاز"];
}

// ==========================================
// 2. رسم الواجهة (10 مربعات ثابتة لكل كلمة)
// ==========================================
async function buildChainImage(game) {
  const width = 850;
  const height = 750;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // رسم الخلفية
  ctx.fillStyle = '#121213';
  ctx.fillRect(0, 0, width, height);

  const boxSize = 60;
  const gap = 10;
  const rowGap = 20;
  const startY = 120;
  const maxBoxes = 10; // ثابت: 10 فراغات لكل كلمة

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';

  // العنوان
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 45px Cairo';
  ctx.fillText("سلسلة الكلمات", width / 2, 60);

  // حساب نقطة البداية (X) لكي تتمركز الـ 10 مربعات بالمنتصف
  const totalWidth = maxBoxes * boxSize + (maxBoxes - 1) * gap;
  const startX = (width - totalWidth) / 2;

  for (let i = 0; i < game.chain.length; i++) {
    const word = game.chain[i];
    const chars = Array.from(word);
    const len = chars.length;
    
    const y = startY + i * (boxSize + rowGap);
    const isCurrent = (i === game.currentIndex && !game.solved[i]);

    // رسم المربعات الـ 10 من اليمين لليسار (RTL)
    for (let j = 0; j < maxBoxes; j++) {
      const boxX = startX + (maxBoxes - 1 - j) * (boxSize + gap);

      let fillColor = '#1e1e1e';
      let strokeColor = '#3a3a3c';
      let textColor = '#ffffff';
      let charToDraw = "";

      // إذا كان المربع يمثل حرفاً حقيقياً من الكلمة
      if (j < len) {
        if (i === 0) {
          fillColor = '#6b5b95'; strokeColor = '#6b5b95'; charToDraw = chars[j];
        } else if (i === game.chain.length - 1) {
          fillColor = '#d97736'; strokeColor = '#d97736'; charToDraw = chars[j];
        } else if (game.solved[i]) {
          fillColor = '#4CAF50'; strokeColor = '#4CAF50'; charToDraw = chars[j];
        } else {
          if (isCurrent) strokeColor = '#f1c40f'; // إطار أصفر للدور الحالي
          if (j < game.revealedCounts[i]) {
            fillColor = '#8e44ad'; strokeColor = '#8e44ad'; charToDraw = chars[j];
          }
        }
      } 
      // المربعات الوهمية (لإخفاء طول الكلمة)
      else {
        if (game.solved[i] || i === 0 || i === game.chain.length - 1) {
          fillColor = '#121213'; strokeColor = '#1e1e1e';
        } else {
          if (isCurrent) strokeColor = '#f1c40f';
        }
      }

      // رسم المربع
      ctx.beginPath();
      ctx.roundRect(boxX, y, boxSize, boxSize, 10);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // رسم الحرف
      if (charToDraw) {
        ctx.fillStyle = textColor;
        ctx.font = 'bold 35px Cairo';
        ctx.fillText(charToDraw, boxX + boxSize / 2, y + boxSize / 2 + 5);
      }
    }
  }

  return canvas.toBuffer('image/png');
}

// ==========================================
// 3. إدارة اللعبة
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

function getActionRows(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chain_up_${userId}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⬆️"),
    new ButtonBuilder()
      .setCustomId(`chain_down_${userId}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⬇️"),
    new ButtonBuilder()
      .setCustomId(`chain_quit_${userId}`)
      .setLabel("انسحاب")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🚪")
  );
}

async function startChainedWordsForUser(channel, userId) {
  const loadingMsg = await channel.send("⏳ جاري توليد سلسلة كلمات جديدة وفريدة...");
  
  const chainArray = await generateChainChallenge();
  
  const game = {
    userId,
    chain: chainArray, 
    solved: [true, false, false, false, false, false, true], 
    // نبدأ بكشف أول حرف من الكلمة المخفية الأولى فقط
    revealedCounts: [0, 1, 0, 0, 0, 0, 0], 
    currentIndex: 1, 
    score: 100, 
    channelId: channel.id,
    ended: false,
    currentMessage: null
  };
  
  chainSessions.set(userId, game);

  const imgBuffer = await buildChainImage(game);
  const attachment = new AttachmentBuilder(imgBuffer, { name: "chain.png" });

  await loadingMsg.delete().catch(() => {});
  
  const sent = await channel.send({
    content: `🔗 **لعبة سلسلة الكلمات!**\nاكتب الكلمة اللي تربط السلسلة بشكل منطقي.\n💡 **ملاحظة:** المربع المحدد باللون الأصفر هو دورتك الحالية.\n🎯 رصيد نقاطك الحالي: **${game.score}/100**`,
    files: [attachment],
    components: [getActionRows(userId)]
  });

  game.currentMessage = sent;
}

module.exports.startChainedWordsFromMenu = async function(interaction) {
  const userId = interaction.user.id;
  const prev = chainSessions.get(userId);
  
  if (prev && !prev.ended && prev.channelId && prev.channelId !== interaction.channelId) {
    return interaction.reply({ content: `لديك جولة نشطة في <#${prev.channelId}>.`, ephemeral: true });
  }
  if (prev && !prev.ended) {
    prev.ended = true;
    if (prev.currentMessage) setTimeout(() => prev.currentMessage.delete().catch(() => {}), 1000);
    chainSessions.delete(userId);
  }

  await interaction.deferUpdate().catch(()=>{});
  await startChainedWordsForUser(interaction.channel, userId);
};

module.exports.handleChainedWordsGuess = async function(msg, db) {
  if (msg.author?.bot) return;
  const userId = msg.author.id;
  const game = chainSessions.get(userId);
  
  if (!game || game.ended || msg.channel.id !== game.channelId) return;

  const guess = msg.content.trim().replace(/\s+/g, ""); 
  const targetWord = game.chain[game.currentIndex];
  
  if (guess === targetWord) {
    game.solved[game.currentIndex] = true;
    
    // التحقق من الفوز (هل انحلت 1 إلى 5؟)
    if (game.solved.slice(1, 6).every(v => v === true)) {
      game.ended = true;
      
      const finalReward = Math.floor(CHAIN_REWARD_BASE * (game.score / 100));
      await winRewardLocally(db, userId, finalReward, "فوز في سلسلة الكلمات");
      
      const imgBuffer = await buildChainImage(game);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "chain_win.png" });
      
      await msg.reply({
        content: `🎉 **أحسنت! كملت السلسلة بنجاح!**\n🌟 **النقاط النهائية:** ${game.score}/100\n💰 **المكافأة المكتسبة:** ${finalReward.toLocaleString()} ريال`,
        files: [attachment]
      });
      
      if (game.currentMessage) setTimeout(() => game.currentMessage.delete().catch(() => {}), 5000);
      chainSessions.delete(userId);
      return;
    } else {
      let next = 1;
      while (next <= 5 && game.solved[next]) next++;
      
      if (next <= 5) {
        game.currentIndex = next;
        
        // 🔴 الميزة الجديدة: الكشف التلقائي عن أول حرف للكلمة التالية
        if (game.revealedCounts[next] === 0) {
          game.revealedCounts[next] = 1;
        }
      }
      
      const imgBuffer = await buildChainImage(game);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "chain.png" });
      
      await game.currentMessage.edit({
        content: `✅ إجابة صحيحة! تم كشف أول حرف من الكلمة التالية.\n🎯 رصيد نقاطك الحالي: **${game.score}/100**`,
        files: [attachment]
      });
      setTimeout(() => msg.delete().catch(() => {}), 1500); 
    }
  } else {
    const wordLength = targetWord.length;
    
    if (game.revealedCounts[game.currentIndex] < wordLength - 1) {
      game.revealedCounts[game.currentIndex]++;
      game.score = Math.max(10, game.score - 5); 
      
      const imgBuffer = await buildChainImage(game);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "chain.png" });
      
      await game.currentMessage.edit({
        content: `❌ إجابة خاطئة! تم كشف حرف إضافي للمساعدة.\n📉 تم خصم 5 نقاط. نقاطك الآن: **${game.score}/100**`,
        files: [attachment]
      });
    } else {
      game.score = Math.max(10, game.score - 5);
      await game.currentMessage.edit({
        content: `❌ إجابة خاطئة! ركز، بقى حرف واحد بس!\n📉 تم خصم 5 نقاط. نقاطك الآن: **${game.score}/100**`
      });
    }
    setTimeout(() => msg.delete().catch(() => {}), 1500);
  }
};

module.exports.handleChainedWordsButtons = async function(i) {
  const id = i.customId || "";
  const parts = id.split("_");
  const action = parts[1]; 
  const targetUserId = parts[2];

  if (i.user.id !== targetUserId) {
    return i.reply({ content: "هذه الجولة ليست لك.", ephemeral: true });
  }

  const game = chainSessions.get(targetUserId);
  if (!game) return i.reply({ content: "لا توجد جولة نشطة.", ephemeral: true });

  await i.deferUpdate().catch(() => {});

  if (action === "quit") {
    game.ended = true;
    
    // إظهار الحل النهائي بالكامل كصورة عند الانسحاب بدل الشات
    game.solved = [true, true, true, true, true, true, true];
    const imgBuffer = await buildChainImage(game);
    const attachment = new AttachmentBuilder(imgBuffer, { name: "chain_quit.png" });
    
    await i.channel.send({
      content: `🚪 انسحبت من التحدي. هذا هو الحل الكامل للسلسلة:`,
      files: [attachment]
    });
    
    if (game.currentMessage) setTimeout(() => game.currentMessage.delete().catch(() => {}), 2000);
    chainSessions.delete(targetUserId);
    return;
  }

  if (action === "up") {
    let next = game.currentIndex - 1;
    while (next >= 1 && game.solved[next]) next--; 
    if (next >= 1) {
      game.currentIndex = next;
      const imgBuffer = await buildChainImage(game);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "chain.png" });
      await game.currentMessage.edit({ files: [attachment] }).catch(()=>{});
    }
  } else if (action === "down") {
    let next = game.currentIndex + 1;
    while (next <= 5 && game.solved[next]) next++; 
    if (next <= 5) {
      game.currentIndex = next;
      const imgBuffer = await buildChainImage(game);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "chain.png" });
      await game.currentMessage.edit({ files: [attachment] }).catch(()=>{});
    }
  }
};

module.exports.hasActiveSession = (userId, channelId) => {
  const game = chainSessions.get(userId);
  return Boolean(game && !game.ended && game.channelId === channelId);
};