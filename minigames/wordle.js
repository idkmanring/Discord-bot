// minigames/wordle.js
const { EmbedBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// إعداد Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const WORDLE_LEN = 4;
const WORDLE_MAX_ATTEMPTS = 5;
const WORDLE_REWARD = 10000;

const wordleSessions = new Map();

const ARABIC_ALPHABET = [
  "ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض",
  "ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي","ة","ى","ؤ","ئ","ء"
];

// ==========================================
// 1. توليد الكلمة عبر Gemini والتحقق من MongoDB
// ==========================================
async function generateWordleWord(db) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const fallbacks = ["كتاب", "عالم", "تفاح", "كوكب", "قارب", "طريق", "جبال", "بحار", "وردة", "شجرة", "سريع", "حمار"];
  let attempts = 0;

  while (attempts < 5) {
    try {
      const prompt = `أعطني كلمة عربية واحدة فقط، اسم أو صفة صحيحة وذات معنى واضح ومألوف، مكونة من 4 حروف بالضبط (مثل: كوكب، سريع، كتاب، تفاح، بحار). لا تعطني أفعال مبنية للمجهول أو كلمات مدمجة بضمائر (مثل: ترده، لأنك). أجب بالكلمة فقط بدون تشكيل وبدون أي نص إضافي ولا مسافات.`;
      
      const result = await model.generateContent(prompt);
      let word = result.response.text().trim();
      
      // تنظيف الكلمة: إزالة التشكيل وأخذ أول كلمة فقط للضمان
      word = word.replace(/[\u064B-\u065F]/g, ''); 
      word = word.split(/\s+/)[0]; 

      // تنظيف أي رموز غير عربية
      word = word.replace(/[^ء-ي]/g, '');

      if (word.length === WORDLE_LEN) {
        // التحقق إذا كانت الكلمة موجودة مسبقاً في قاعدة البيانات
        const existing = await db.collection("wordle_words").findOne({ word });
        if (!existing) {
          // حفظها في القاعدة عشان ما تتكرر مستقبلاً
          await db.collection("wordle_words").insertOne({ word, createdAt: new Date() });
          return word;
        }
      }
    } catch (err) {
      console.error("Gemini Wordle Error:", err);
    }
    attempts++;
  }
  
  // في حال فشل Gemini بعد 5 محاولات (لتفادي تعليق اللعبة)، نختار كلمة من القائمة الاحتياطية
  const fallbackWord = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  await db.collection("wordle_words").updateOne({ word: fallbackWord }, { $set: { word: fallbackWord } }, { upsert: true });
  return fallbackWord;
}


// ==========================================
// 2. منطق تقييم الحروف ورسم اللوحة
// ==========================================
function updateLetterStates(states, guessChars, colorTags) {
  for (let i = 0; i < guessChars.length; i++) {
    const ch = guessChars[i];
    const c = colorTags[i];
    const prev = states[ch];
    if (c === "green") states[ch] = "green";
    else if (c === "purple") { if (prev !== "green") states[ch] = "purple"; }
    else if (c === "grey") { if (!prev) states[ch] = "grey"; }
  }
}

function judgeGuess(guessRaw, secretRaw) {
  const guess = [...String(guessRaw)];
  const secret = [...String(secretRaw)];
  const len = WORDLE_LEN;
  const res = new Array(len).fill("grey");
  const remaining = {};

  for (let i = 0; i < len; i++) {
    if (guess[i] === secret[i]) {
      res[i] = "green";
    } else {
      const ch = secret[i];
      remaining[ch] = (remaining[ch] || 0) + 1;
    }
  }
  for (let i = 0; i < len; i++) {
    if (res[i] === "green") continue;
    const ch = guess[i];
    if (remaining[ch] > 0) {
      res[i] = "purple";
      remaining[ch]--;
    } else {
      res[i] = "grey";
    }
  }
  return res;
}

const styleOf = (c) => (c === "green" ? 3 : c === "purple" ? 1 : 2);

function buildRowComponents(letters, colors, userId, attemptNo, action, enabled) {
  const letterButtons = letters.map((ch, idx) => ({
    type: 2,
    style: styleOf(colors[idx]),
    label: ch,
    custom_id: `wordle_lock_${userId}_${attemptNo}_${idx}`,
    disabled: true
  }));

  letterButtons.reverse(); // لضبط الاتجاه العربي (من اليمين لليسار)

  let actionButton;
  if (action === "restart") {
    actionButton = {
      type: 2,
      style: enabled ? 3 : 2,
      emoji: { id: "1416507901425614948", name: ":icons8retry100:" },
      custom_id: `wordle_restart_${userId}_${attemptNo}`,
      disabled: !enabled
    };
  } else {
    actionButton = {
      type: 2,
      style: enabled ? 4 : 2,
      emoji: { id: "1408077754557136926", name: ":icons8leave100:" },
      custom_id: `wordle_quit_${userId}_${attemptNo}`,
      disabled: !enabled
    };
  }

  return { type: 1, components: [...letterButtons, actionButton] };
}

async function buildAlphabetBoardImage(states) {
  const cellW = 54, cellH = 54, gap = 6, padding = 12, cols = 12;
  const rows = Math.ceil(ARABIC_ALPHABET.length / cols);
  const width = padding * 2 + cols * (cellW + gap);
  const height = padding * 2 + rows * (cellH + gap) + 24;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = "#000000ff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 35px Cairo";
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "rtl";
  ctx.fillText("لوحة الحروف", padding + 275, padding + 16);

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= ARABIC_ALPHABET.length) break;
      const ch = ARABIC_ALPHABET[idx++];
      const state = states[ch];

      let bg = "#99aab5";
      if (state === "green") bg = "#2ecc71";
      else if (state === "purple") bg = "#5865F2";
      else if (!state) bg = "#4f545c";

      const colFromRight = c;
      const x = width - padding - (colFromRight + 1) * (cellW + gap);
      const y = padding + 24 + r * (cellH + gap);

      ctx.fillStyle = bg;
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = "#23272a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Cairo";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = "rtl";
      ctx.fillText(ch, x + cellW / 2, y + cellH / 2);
    }
  }
  return canvas.toBuffer("image/png");
}

async function sendBoardMessage(channel, session, finalMsg) {
  const rows = [];
  
  // بناء الأزرار للمحاولات السابقة
  for (let i = 0; i < session.history.length; i++) {
    const entry = session.history[i];
    const isLast = i === session.history.length - 1;

    if (finalMsg) {
      rows.push(buildRowComponents(entry.letters, entry.colors, session.userId, i + 1, isLast ? "restart" : "quit", isLast));
    } else {
      rows.push(buildRowComponents(entry.letters, entry.colors, session.userId, i + 1, "quit", isLast));
    }
  }

  // 🔴 إضافة زر الانسحاب في الجولة الأولى (قبل أي محاولة)
  if (session.history.length === 0 && !finalMsg) {
    rows.push({
      type: 1,
      components: [{
        type: 2,
        style: 4, // أحمر (Danger)
        label: "انسحاب",
        emoji: { id: "1408077754557136926", name: ":icons8leave100:" },
        custom_id: `wordle_quit_${session.userId}_0`,
        disabled: false
      }]
    });
  }

  const remaining = WORDLE_MAX_ATTEMPTS - session.attempts;
  const baseLine = finalMsg
    ? (session.won
        ? `<:icons8correct1002:1415979896433278986> أحسنت! الكلمة: **${session.word}** — تم الفوز.`
        : `<:icons8wrong1001:1415979909825695914> انتهت الجولة. الكلمة كانت: **${session.word}**`)
    : `📝 أرسل كلمة من ${WORDLE_LEN} أحرف. (محاولات متبقية: ${remaining})`;

  const img = await buildAlphabetBoardImage(session.letterStates);
  const sent = await channel.send({
    content: `🎯 لعبة الحروف\n${baseLine}`,
    components: rows,
    files: [{ attachment: img, name: `letters_${session.userId}.png` }]
  });

  if (session.currentMessage) {
    const oldMsg = session.currentMessage;
    setTimeout(() => oldMsg.delete().catch(() => {}), 10000);
  }
  session.currentMessage = sent;
  if (finalMsg) setTimeout(() => sent.delete().catch(() => {}), 25000);
}


// ==========================================
// 3. إدارة الرصيد والإحصائيات وجلسة اللعب
// ==========================================
async function updateBalanceWithLogLocally(db, userId, amount, reason) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: amount } },
    { upsert: true }
  );
  await db.collection("transactions").insertOne({
    userId: String(userId), amount, reason, timestamp: new Date()
  });
}

async function wordleStatsPlayed(userId, db) {
  await db.collection("wordle_stats").updateOne(
    { userId: String(userId) },
    { $inc: { played: 1 }, $setOnInsert: { wins: 0, earnings: 0, currentStreak: 0, bestStreak: 0 } },
    { upsert: true }
  );
}

async function wordleStatsWin(userId, reward, db) {
  await db.collection("wordle_stats").updateOne(
    { userId: String(userId) },
    { $inc: { wins: 1, earnings: reward, currentStreak: 1 }, $max: { bestStreak: 0 } },
    { upsert: true }
  );
  const doc = await db.collection("wordle_stats").findOne({ userId: String(userId) });
  if (doc && (doc.currentStreak || 0) > (doc.bestStreak || 0)) {
    await db.collection("wordle_stats").updateOne({ userId: String(userId) }, { $set: { bestStreak: doc.currentStreak || 0 } });
  }
}

async function wordleStatsLose(userId, db) {
  await db.collection("wordle_stats").updateOne(
    { userId: String(userId) },
    { $set: { currentStreak: 0 }, $setOnInsert: { played: 0, wins: 0, earnings: 0, bestStreak: 0 } },
    { upsert: true }
  );
}

async function startWordleForUser(channel, userId, db) {
  const loadingMsg = await channel.send("⏳ جاري توليد كلمة سرية جديدة وفريدة من 4 حروف...");
  
  // توليد الكلمة
  const secret = await generateWordleWord(db);
  
  await loadingMsg.delete().catch(() => {});
  await wordleStatsPlayed(userId, db);

  const session = {
    userId, word: secret, attempts: 0, history: [], letterStates: {},
    currentMessage: null, ended: false, won: false, channelId: channel.id,
  };
  wordleSessions.set(userId, session);
  
  await sendBoardMessage(channel, session, false);
}


// ==========================================
// 4. المداخل (Handlers) التي يتم ربطها في index.js
// ==========================================
module.exports.startWordleFromMenu = async function(interaction, db) {
  const userId = interaction.user.id;
  const prev = wordleSessions.get(userId);
  
  if (prev && !prev.ended && prev.channelId && prev.channelId !== interaction.channelId) {
    return interaction.reply({ content: `لديك جولة نشطة في <#${prev.channelId}>. أنهِها هناك أولاً.`, ephemeral: true });
  }
  if (prev && !prev.ended) {
    prev.ended = true;
    if (prev.currentMessage) setTimeout(() => prev.currentMessage.delete().catch(() => {}), 1000);
    wordleSessions.delete(userId);
  }

  await interaction.deferUpdate().catch(()=>{});
  await startWordleForUser(interaction.channel, userId, db);
};

module.exports.handleWordleStartMessage = async function(msg, db) {
  if (msg.author?.bot) return;
  const userId = msg.author.id;
  const prev = wordleSessions.get(userId);
  
  if (prev && !prev.ended && prev.channelId && prev.channelId !== msg.channel.id) {
    return msg.reply(`لديك جولة نشطة في <#${prev.channelId}>. أنهِها هناك أولاً.`).catch(() => {});
  }
  if (prev && !prev.ended) {
    prev.ended = true;
    if (prev.currentMessage) setTimeout(() => prev.currentMessage.delete().catch(() => {}), 1000);
    wordleSessions.delete(userId);
  }
  await startWordleForUser(msg.channel, userId, db);
};

module.exports.handleWordleGuess = async function(msg, db) {
  if (msg.author?.bot) return;
  const userId = msg.author.id;
  const s = wordleSessions.get(userId);
  if (!s || s.ended || msg.channel.id !== s.channelId) return;

  const text = (msg.content || "").trim();
  if (!text || text === "حروف" || text === "حروف!") return;
  const chars = [...text];
  if (chars.length !== WORDLE_LEN) return msg.reply(`❗ أرسل كلمة من ${WORDLE_LEN} أحرف بالضبط.`).catch(() => {});
  if (s.attempts >= WORDLE_MAX_ATTEMPTS) return;

  s.attempts += 1;
  const colors = judgeGuess(text, s.word);
  s.history.push({ letters: [...text], colors });
  updateLetterStates(s.letterStates, [...text], colors);

  const isWin = colors.every(c => c === "green");
  if (isWin) {
    s.ended = true;
    s.won = true;
    await updateBalanceWithLogLocally(db, userId, WORDLE_REWARD, "لعبة حروف: فوز");
    await wordleStatsWin(userId, WORDLE_REWARD, db);
    await sendBoardMessage(msg.channel, s, true);
    wordleSessions.delete(userId);
    return;
  }

  if (s.attempts >= WORDLE_MAX_ATTEMPTS) {
    s.ended = true;
    s.won = false;
    await wordleStatsLose(userId, db);
    await sendBoardMessage(msg.channel, s, true);
    wordleSessions.delete(userId);
    return;
  }
  await sendBoardMessage(msg.channel, s, false);
};

module.exports.handleWordleButtons = async function(i, db) {
  const id = i.customId || "";
  const parts = id.split("_");
  const action = parts[1]; // quit أو restart
  const targetUserId = parts[2];

  if (i.user.id !== targetUserId) {
    if (!i.replied && !i.deferred) await i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذه الجلسة ليست لك.", ephemeral: true }).catch(() => {});
    return;
  }

  const s = wordleSessions.get(targetUserId);

  if (action === "restart") {
    if (s && !s.ended && s.channelId && s.channelId !== i.channelId) {
      if (!i.replied && !i.deferred) await i.reply({ content: `لديك جولة نشطة في <#${s.channelId}>.`, ephemeral: true }).catch(() => {});
      return;
    }
    if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});
    if (s && !s.ended) {
      s.ended = true;
      if (s.currentMessage) setTimeout(() => s.currentMessage.delete().catch(() => {}), 500);
      wordleSessions.delete(targetUserId);
    }
    await startWordleForUser(i.channel, targetUserId, db);
    return;
  }

  if (!s) {
    if (!i.replied && !i.deferred) await i.reply({ content: "لا توجد جولة نشطة.", ephemeral: true }).catch(() => {});
    return;
  }

  if (i.channelId !== s.channelId) return;

  if (action === "quit") {
    if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});
    if (s && !s.ended) {
      s.ended = true;
      s.won = false;
      await wordleStatsLose(targetUserId, db);
      await sendBoardMessage(i.channel, s, true);
      wordleSessions.delete(targetUserId);
    }
  }
};

module.exports.handleWordleStatsMessage = async function(msg, db) {
  if (msg.author?.bot) return;
  const userId = String(msg.author.id);
  const s = await db.collection("wordle_stats").findOne({ userId });

  const played = s?.played || 0, wins = s?.wins || 0, earnings = s?.earnings || 0;
  const currentStreak = s?.currentStreak || 0, bestStreak = s?.bestStreak || 0;
  const losses = Math.max(played - wins, 0);
  const winRate = played ? ((wins / played) * 100).toFixed(2) : "0.00";

  const embed = new EmbedBuilder()
    .setTitle(" إحصائيات لعبة الحروف")
    .setColor("Blue")
    .addFields(
      { name: "اللعبات", value: `${played}      <:icons8controller100:1407432162348634163>`, inline: true },
      { name: "الانتصارات", value: `${wins}       <:icons8trophy100:1416394314904244234> `, inline: true },
      { name: "الخسائر", value: `${losses}      <:icons8loss100:1416394312056442980> `, inline: true },
      { name: "نسبة الفوز", value: `${winRate}%      <:icons8piechart100:1416394268716568789> `, inline: true },
      { name: "سلسلة الحالية", value: `${currentStreak}         <:icons8series100:1416510089811988562>`, inline: true },
      { name: "أفضل سلسلة", value: `${bestStreak}      <:icons8series1001:1416510081822101677> `, inline: true },
      { name: "إجمالي الأرباح", value: `${earnings.toLocaleString("en-US")}           <:icons8money100:1416394266066030742> `, inline: true }
    );
  return msg.reply({ embeds: [embed] });
};

module.exports.hasActiveSession = (userId, channelId) => {
  const s = wordleSessions.get(userId);
  return Boolean(s && !s.ended && s.channelId === channelId);
};