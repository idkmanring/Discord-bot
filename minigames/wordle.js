// minigames/wordle.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const { addGameReward } = require("../utils/economyEffects");

const WORDLE_LEN = 4;
const WORDLE_MAX_ATTEMPTS = 5;
const WORDLE_REWARD = 10000;

const wordleSessions = new Map();

// إزالة الحروف: ى, ؤ, ئ
const ARABIC_ALPHABET = [
  "ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض",
  "ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي","ة","ء"
];

function normalizeArabicWord(raw) {
  return String(raw || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^ء-ي]/g, "")
    .trim();
}

function readWordList(fileName) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", fileName), "utf8"));
    return Array.isArray(data)
      ? data.map((entry) => typeof entry === "string" ? entry : entry?.word).filter(Boolean)
      : [];
  } catch (err) {
    console.error(`Wordle data read error (${fileName}):`, err.message);
    return [];
  }
}

const WORDLE_WORDS = [...new Set([
  ...readWordList("word_pool.json"),
  ...readWordList("dictionary.json"),
].map(normalizeArabicWord).filter((word) =>
  word.length === WORDLE_LEN &&
  !word.startsWith("ال") &&
  !word.startsWith("ب") &&
  !word.endsWith("ي") &&
  !/[ءئؤ]/.test(word)
))];

async function generateWordleWord(db) {
  const fallbacks = ["عالم", "كوكب", "قارب", "طريق", "كتاب", "رياح", "شمس"];
  const pool = WORDLE_WORDS.length ? WORDLE_WORDS : fallbacks;

  for (let attempts = 0; attempts < 30; attempts++) {
    const word = pool[Math.floor(Math.random() * pool.length)];
    const existing = await db.collection("wordle_words").findOne({ word });
    if (!existing) {
      await db.collection("wordle_words").insertOne({ word, createdAt: new Date(), source: "data_files" });
      return word;
    }
  }

  const word = pool[Math.floor(Math.random() * pool.length)];
  await db.collection("wordle_words").updateOne({ word }, { $set: { word, updatedAt: new Date() } }, { upsert: true });
  return word;
}

// ==========================================
// 2. منطق تقييم الحروف ورسم اللوحة (Grid + Keyboard)
// ==========================================
function updateLetterStates(states, guessChars, colorTags) {
  for (let i = 0; i < guessChars.length; i++) {
    const ch = guessChars[i];
    const c = colorTags[i];
    const prev = states[ch];
    if (c === "green") states[ch] = "green";
    else if (c === "yellow") { if (prev !== "green") states[ch] = "yellow"; } // تغيير البنفسجي لأصفر
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
      res[i] = "yellow"; // تغيير البنفسجي لأصفر
      remaining[ch]--;
    } else {
      res[i] = "grey";
    }
  }
  return res;
}

async function buildWordleImage(session) {
  const width = 600;
  const height = 850; // رفعنا الطول شوي عشان نستوعب المربعات الكبيرة
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // رسم الخلفية الرئيسية
  ctx.fillStyle = "#121213";
  ctx.fillRect(0, 0, width, height);

  // --- 1. رسم شبكة المحاولات (Grid) مربعات كبيرة ---
  const gridRows = WORDLE_MAX_ATTEMPTS; // 5
  const gridCols = WORDLE_LEN; // 4
  const cellSize = 95; // 🔴 كبرنا المربعات من 75 إلى 95
  const cellGap = 12; // كبرنا المسافة شوي
  const gridWidth = gridCols * cellSize + (gridCols - 1) * cellGap;
  const gridStartX = (width - gridWidth) / 2;
  const gridStartY = 40;

  for (let r = 0; r < gridRows; r++) {
    const isHistory = r < session.history.length;
    const rowData = isHistory ? session.history[r] : null;

    for (let c = 0; c < gridCols; c++) {
      // عربي: العمود صفر يكون في أقصى اليمين
      const x = gridStartX + (gridCols - 1 - c) * (cellSize + cellGap);
      const y = gridStartY + r * (cellSize + cellGap);

      let bgColor = "#121213";
      let borderColor = "#3a3a3c";
      let char = "";

      if (isHistory) {
        char = rowData.letters[c];
        const colorState = rowData.colors[c];
        
        if (colorState === "green") {
          bgColor = "#538d4e"; borderColor = "#538d4e";
        } else if (colorState === "yellow") { // 🔴 التعديل للون الأصفر
          bgColor = "#c9b458"; borderColor = "#c9b458";
        } else {
          bgColor = "#3a3a3c"; borderColor = "#3a3a3c";
        }
      }

      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(x, y, cellSize, cellSize);

      if (char) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 55px Cairo"; // 🔴 كبرنا الخط عشان يناسب المربع
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(char, x + cellSize / 2, y + cellSize / 2 + 5);
      }
    }
  }

  // --- 2. رسم الكيبورد الافتراضي (Keyboard) ---
  const keyboardY = gridStartY + gridRows * (cellSize + cellGap) + 50;
  const keyWidth = 46;
  const keyHeight = 65;
  const keyGap = 8;

  // 3 صفوف متناسقة (إجمالي 30 حرف بدون ى، ؤ، ئ)
  const keyboardLayout = [
    ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح"],
    ["ج", "د", "ذ", "ش", "س", "ي", "ب", "ل", "ا", "ت"],
    ["ن", "م", "ك", "ط", "ظ", "ز", "ر", "و", "ة", "ء"]
  ];

  for (let row = 0; row < keyboardLayout.length; row++) {
    const keys = keyboardLayout[row];
    const rowWidth = keys.length * keyWidth + (keys.length - 1) * keyGap;
    const rowStartX = (width - rowWidth) / 2;

    for (let col = 0; col < keys.length; col++) {
      // اليمين لليسار
      const char = keys[col];
      const x = rowStartX + (keys.length - 1 - col) * (keyWidth + keyGap);
      const y = keyboardY + row * (keyHeight + keyGap);

      const state = session.letterStates[char];
      let keyBg = "#818384"; // الرمادي الفاتح الافتراضي للكيبورد
      
      if (state === "green") keyBg = "#538d4e";
      else if (state === "yellow") keyBg = "#c9b458"; // 🔴 التعديل للون الأصفر بالكيبورد
      else if (state === "grey") keyBg = "#3a3a3c";

      ctx.fillStyle = keyBg;
      ctx.beginPath();
      ctx.roundRect(x, y, keyWidth, keyHeight, 6);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Cairo";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, x + keyWidth / 2, y + keyHeight / 2 + 5);
    }
  }

  return canvas.toBuffer("image/png");
}

async function sendBoardMessage(channel, session, finalMsg) {
  const imgBuffer = await buildWordleImage(session);
  const attachment = { attachment: imgBuffer, name: `wordle_${session.userId}.png` };

  const componentsRow = new ActionRowBuilder();

  // زر الانسحاب (دائماً موجود)
  componentsRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`wordle_quit_${session.userId}`)
      .setLabel("انسحاب")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("1408077754557136926") // أيقونة الخروج
  );

  // زر الإعادة (يظهر فقط إذا انتهت الجولة)
  if (finalMsg) {
    componentsRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`wordle_restart_${session.userId}`)
        .setLabel("إعادة اللعب")
        .setStyle(ButtonStyle.Success)
        .setEmoji("1416507901425614948") // أيقونة الإعادة
    );
  }

  const remaining = WORDLE_MAX_ATTEMPTS - session.attempts;
  const baseLine = finalMsg
    ? (session.won
      ? `🎉 **أحسنت! الكلمة:** ${session.word} — تم الفوز!`
      : `💀 **انتهت الجولة.** الكلمة الصحيحة كانت: **${session.word}**`)
    : `📝 **اكتب كلمة من ${WORDLE_LEN} أحرف بالشات.** (محاولاتك: ${remaining})`;

  const sent = await channel.send({
    content: `🎯 **لعبة الووردل (Wordle)**\n${baseLine}`,
    files: [attachment],
    components: [componentsRow]
  });

  if (session.currentMessage) {
    const oldMsg = session.currentMessage;
    setTimeout(() => oldMsg.delete().catch(() => {}), 1000);
  }
  session.currentMessage = sent;
  if (finalMsg) setTimeout(() => sent.delete().catch(() => {}), 30000); // تنحذف بعد نصف دقيقة لعدم الإزعاج
}


// ==========================================
// 3. إدارة الرصيد والإحصائيات وجلسة اللعب
// ==========================================
async function updateBalanceWithLogLocally(db, userId, amount, reason) {
  const reward = await addGameReward(userId, amount, db);
  await db.collection("transactions").insertOne({
    userId: String(userId), amount: reward.finalAmount, reason, timestamp: new Date()
  });
  return reward;
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
  const loadingMsg = await channel.send("⏳ جاري اختيار كلمة سرية من ملفات الداتا...");
  
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
// 4. المداخل (Handlers)
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

module.exports.handleWordleGuess = async function(msg, db) {
  if (msg.author?.bot) return;
  const userId = msg.author.id;
  const s = wordleSessions.get(userId);
  if (!s || s.ended || msg.channel.id !== s.channelId) return;

  const text = normalizeArabicWord((msg.content || "").trim().replace(/\s+/g, ''));
  if (!text) return;
  if (text.length !== WORDLE_LEN) {
      msg.reply(`❗ أرسل كلمة من ${WORDLE_LEN} أحرف بالضبط.`).then(m => setTimeout(()=>m.delete().catch(()=> {}), 3000));
      setTimeout(() => msg.delete().catch(() => {}), 1500);
      return;
  }
  if (s.attempts >= WORDLE_MAX_ATTEMPTS) return;

  s.attempts += 1;
  const colors = judgeGuess(text, s.word);
  s.history.push({ letters: [...text], colors });
  updateLetterStates(s.letterStates, [...text], colors);

  const isWin = colors.every(c => c === "green");
  
  setTimeout(() => msg.delete().catch(() => {}), 500); // حذف إجابة اللاعب للترتيب

  if (isWin) {
    s.ended = true;
    s.won = true;
    const reward = await updateBalanceWithLogLocally(db, userId, WORDLE_REWARD, "لعبة حروف: فوز");
    await wordleStatsWin(userId, reward.finalAmount, db);
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
    .setTitle("📊 إحصائيات لعبة الووردل")
    .setColor("Blue")
    .addFields(
      { name: "اللعبات", value: `${played}      🎮`, inline: true },
      { name: "الانتصارات", value: `${wins}       🏆 `, inline: true },
      { name: "الخسائر", value: `${losses}       ❌ `, inline: true },
      { name: "نسبة الفوز", value: `${winRate}%       📈 `, inline: true },
      { name: "السلسلة الحالية", value: `${currentStreak}         🔥`, inline: true },
      { name: "أفضل سلسلة", value: `${bestStreak}      ⭐ `, inline: true },
      { name: "إجمالي الأرباح", value: `${earnings.toLocaleString("en-US")}           💰 `, inline: true }
    );
  return msg.reply({ embeds: [embed] });
};

module.exports.hasActiveSession = (userId, channelId) => {
  const s = wordleSessions.get(userId);
  return Boolean(s && !s.ended && s.channelId === channelId);
};
