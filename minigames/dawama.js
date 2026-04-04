// minigames/dawama.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");

// 🔴 استدعاء ملف الجمل الجاهز
const sentencesPool = require("../data/dawama_sentences.json");

const activeGames = new Map();
const activeLobbies = new Map();

// 12 خيار لتشكيل عجلة دائرية متناسقة
const WHEEL_OPTIONS = [
  { val: 1000, label: "1000" }, { val: 5000, label: "5000" },
  { val: 10000, label: "10000" }, { val: 50000, label: "50000" },
  { val: 100000, label: "100000" }, { val: "bankrupt", label: "إفلاس" },
  { val: 1000, label: "1000" }, { val: "lose_turn", label: "راحت عليك" },
  { val: 5000, label: "5000" }, { val: "free_vowel", label: "حرف مجاني" },
  { val: 10000, label: "10000" }, { val: "second_chance", label: "فرصة ثانية" }
];

const VOWELS = ["ا", "و", "ي", "أ", "إ", "آ", "ى", "ؤ", "ئ"];

// توحيد الحروف للبحث والمطابقة
function normalizeChar(char) {
  if (["أ", "إ", "آ", "ا", "ى"].includes(char)) return "ا";
  if (char === "ة") return "ه";
  if (char === "ؤ") return "و";
  if (char === "ئ") return "ي";
  return char;
}

// مساعدة لإيقاف المؤقت السابق
function clearGameTimer(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
}

// ==========================================
// 1. توليد الجملة من قاعدة البيانات (بدون تكرار نهائياً)
// ==========================================
async function getDawamaData(db) {
  const collection = db.collection("dawama_used");
  
  // جلب الجمل اللي انلعبت مسبقاً
  const usedDocs = await collection.find({}).toArray();
  const usedSentences = usedDocs.map(doc => doc.sentence);

  // فلترة الجمل المتوفرة
  let available = sentencesPool.filter(item => !usedSentences.includes(item.sentence));

  // إذا خلصت كل الأسئلة بالملف، نفرمت قاعدة البيانات ونبدأ من جديد
  if (available.length === 0) {
    await collection.deleteMany({});
    available = sentencesPool;
    console.log("♻️ تم إعادة تصفير أسئلة الدوامة (تم استخدامها بالكامل).");
  }

  // اختيار جملة عشوائية من المتوفرة
  const randomIndex = Math.floor(Math.random() * available.length);
  const chosenData = available[randomIndex];

  // تسجيل الجملة كـ "مستخدمة" عشان ما تتكرر
  await collection.insertOne({ sentence: chosenData.sentence, usedAt: new Date() });

  return chosenData;
}

// ==========================================
// 2. رسم العجلة الدائرية (Wheel Canvas) 🎡
// ==========================================
async function buildWheelImage(resultIndex) {
  const width = 600;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const cx = width / 2;
  const cy = height / 2;
  const radius = 280;
  const numSlices = WHEEL_OPTIONS.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // ألوان متناسقة للعجلة
  const colors = ["#38BDF8", "#BAE6FD", "#818CF8", "#C084FC", "#F472B6", "#60A5FA", "#0EA5E9", "#93C5FD", "#3B82F6", "#7DD3FC", "#A78BFA", "#F9A8D4"];

  // تدوير العجلة بحيث يكون الخيار الفائز عند السهم في اليمين (0 درجة)
  const rotationOffset = -(resultIndex * sliceAngle);

  ctx.translate(cx, cy);
  ctx.rotate(rotationOffset);

  for (let i = 0; i < numSlices; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const startAngle = i * sliceAngle - sliceAngle / 2;
    const endAngle = i * sliceAngle + sliceAngle / 2;
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    // رسم النص داخل الشريحة
    ctx.save();
    ctx.rotate(i * sliceAngle);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 35px Cairo";
    ctx.fillText(WHEEL_OPTIONS[i].label, radius - 30, 0);
    ctx.restore();
  }

  // رسم الدائرة البيضاء في المنتصف
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, 2 * Math.PI);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  ctx.resetTransform(); // إعادة الإحداثيات لرسم السهم

  // رسم السهم (Pointer) في الجانب الأيمن
  ctx.fillStyle = "#FF0055"; 
  ctx.beginPath();
  ctx.moveTo(width - 5, cy);
  ctx.lineTo(width - 50, cy - 20);
  ctx.lineTo(width - 50, cy + 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas.toBuffer("image/png");
}

// ==========================================
// 3. رسم اللوحة المتمركزة واللاعبين (Board Canvas) 🔲
// ==========================================
async function buildDawamaImage(game) {
  const width = 1200;
  const height = 800; 
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // الخلفية 
  ctx.fillStyle = "#0B132B";
  ctx.fillRect(0, 0, width, height);

  // إطار اللوحة
  ctx.strokeStyle = "#4DFFF3";
  ctx.lineWidth = 8;
  ctx.strokeRect(15, 15, width - 30, height - 190); 

  const boxS = 90; 
  const gap = 15;
  const maxCols = 11; 
  
  const words = game.sentence.split(" ");
  const lines = [];
  let currentLine = [];
  let currentLen = 0;

  // خوارزمية تقسيم الأسطر
  for (const w of words) {
    if (currentLen + w.length + (currentLine.length > 0 ? 1 : 0) <= maxCols) {
      currentLine.push(w);
      currentLen += w.length + (currentLine.length > 1 ? 1 : 0);
    } else {
      lines.push(currentLine);
      currentLine = [w];
      currentLen = w.length;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  const totalGridHeight = lines.length * boxS + (lines.length - 1) * gap;
  const startY = ((height - 190) - totalGridHeight) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let r = 0; r < lines.length; r++) {
    const lineWords = lines[r];
    const lineCharCount = lineWords.reduce((sum, word) => sum + word.length, 0) + (lineWords.length - 1);
    const lineWidth = lineCharCount * boxS + (lineCharCount - 1) * gap;
    
    const startX = (width - lineWidth) / 2; 

    let currentXOffset = 0;
    
    for (let w = lineWords.length - 1; w >= 0; w--) {
      const word = lineWords[w];
      
      for (let i = word.length - 1; i >= 0; i--) {
        const char = word[i];
        const normChar = normalizeChar(char);
        const isRevealed = game.revealed.includes(normChar);

        const x = startX + currentXOffset * (boxS + gap);
        const y = startY + r * (boxS + gap);

        // المربع الأبيض
        ctx.fillStyle = "#F8FAFC";
        ctx.beginPath();
        ctx.roundRect(x, y, boxS, boxS, 10);
        ctx.fill();
        ctx.strokeStyle = "#172A45";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, boxS, boxS);

        if (isRevealed) {
          ctx.fillStyle = "#000000";
          ctx.font = "bold 60px Cairo";
          ctx.fillText(char, x + boxS / 2, y + boxS / 2 + 5);
        } else {
          // رسمة هندسية داخل المربع المخفي
          ctx.fillStyle = "#CBD5E1"; 
          ctx.beginPath();
          ctx.arc(x + boxS / 2, y + boxS / 2, boxS / 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        currentXOffset++;
      }
      currentXOffset++; 
    }
  }

  // --- رسم منصات اللاعبين بالأسفل (Podiums) ---
  const panelY = height - 165;
  const panelH = 150;
  const panelGap = 20;
  const panelW = 260;
  const totalPanelsW = game.players.length * panelW + (game.players.length - 1) * panelGap;
  const startPX = (width - totalPanelsW) / 2;

  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i];
    const px = startPX + (game.players.length - 1 - i) * (panelW + panelGap); 
    
    ctx.fillStyle = (i === game.turnIndex) ? "#1E293B" : "#0F172A";
    ctx.beginPath();
    ctx.roundRect(px, panelY, panelW, panelH, 15);
    ctx.fill();

    if (i === game.turnIndex) {
      ctx.strokeStyle = "#4DFFF3"; 
      ctx.lineWidth = 4;
      ctx.strokeRect(px, panelY, panelW, panelH);
    }

    ctx.fillStyle = (i === game.turnIndex) ? "#4DFFF3" : "#94A3B8";
    ctx.font = "bold 30px Cairo";
    ctx.fillText(p.name.substring(0, 15), px + panelW / 2, panelY + 40);

    ctx.fillStyle = "#4ADE80";
    ctx.font = "bold 26px Cairo";
    ctx.fillText(`الرصيد: ${p.balance}`, px + panelW / 2, panelY + 85);

    if (p.freeVowels > 0) {
      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold 22px Cairo";
      ctx.fillText(`مساعدة: ${p.freeVowels}`, px + panelW / 2, panelY + 125);
    }
  }

  return canvas.toBuffer("image/png");
}

async function renderGameState(channel, game, msgText = null) {
  let imgBuffer;
  let content = "";
  let components = [];
  let attachmentName = "dawama.png";

  const currentPlayer = game.players[game.turnIndex];

  if (game.phase === "spinning") {
    imgBuffer = await buildWheelImage(game.spinResultIndex);
    attachmentName = "wheel.png";
    content = `🎡 **العجلة تدور لـ <@${currentPlayer.id}>...**`;
  } 
  else {
    imgBuffer = await buildDawamaImage(game);
    content = msgText || `🎡 **الدوامة** | التصنيف: **${game.category}**\nالدور على: <@${currentPlayer.id}>`;

    const row = new ActionRowBuilder();
    
    if (game.phase === "idle") {
      row.addComponents(
        new ButtonBuilder().setCustomId(`dw_spin_${game.id}`).setLabel("تدوير").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`dw_solve_${game.id}`).setLabel(" جواب").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`dw_vowel_${game.id}`).setLabel("حرف مساعد (5000)").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`dw_quit_${game.id}`).setLabel("انسحاب").setStyle(ButtonStyle.Danger)
      );
    } else if (game.phase === "waiting_consonant") {
      content += `\n\n✨ العجلة وقفت على: **${game.currentPrizeLabel}**\nاكتب حرف (غير مساعد) بالشات الآن! (لديك 20 ثانية)`;
      row.addComponents(new ButtonBuilder().setCustomId("dummy").setLabel("اكتب الحرف بالشات...").setStyle(ButtonStyle.Secondary).setDisabled(true));
    } else if (game.phase === "waiting_vowel") {
      content += `\n\n🅰️ اكتب حرف مساعد (ا، و، ي) بالشات الآن! (لديك 20 ثانية)`;
      row.addComponents(new ButtonBuilder().setCustomId("dummy").setLabel("اكتب الحرف المساعد بالشات...").setStyle(ButtonStyle.Secondary).setDisabled(true));
    } else if (game.phase === "waiting_solve") {
      content += `\n\n💡 اكتب الجملة كاملة بالشات الآن! (لديك 60 ثانية)`;
      row.addComponents(new ButtonBuilder().setCustomId("dummy").setLabel("اكتب الجواب النهائي بالشات...").setStyle(ButtonStyle.Secondary).setDisabled(true));
    }
    
    components = [row];
  }

  const attachment = new AttachmentBuilder(imgBuffer, { name: attachmentName });
  const payload = { content, files: [attachment], components };

  if (game.msgId) {
    try {
      const oldMsg = await channel.messages.fetch(game.msgId);
      await oldMsg.delete().catch(()=>{});
    } catch(e) {}
  }
  
  const newMsg = await channel.send(payload);
  game.msgId = newMsg.id;

  if (game.phase !== "spinning") {
    startTurnTimer(channel, game);
  }
}

function startTurnTimer(channel, game) {
  clearGameTimer(game);
  
  let seconds = 0;
  if (game.phase === "idle") seconds = 25;
  else if (game.phase === "waiting_consonant" || game.phase === "waiting_vowel") seconds = 20;
  else if (game.phase === "waiting_solve") seconds = 60;

  if (seconds > 0) {
    const currentPhase = game.phase;
    const pIndex = game.turnIndex;

    game.timer = setTimeout(async () => {
      if (activeGames.has(game.channelId) && game.phase === currentPhase && game.turnIndex === pIndex) {
        channel.send(`⏳ انتهى الوقت! راح الدور عن <@${game.players[game.turnIndex].id}>.`).then(m => setTimeout(()=>m.delete().catch(()=>{}), 5000));
        nextTurn(game);
        await renderGameState(channel, game);
      }
    }, seconds * 1000);
  }
}

function nextTurn(game) {
  clearGameTimer(game);
  game.turnIndex = (game.turnIndex + 1) % game.players.length;
  game.phase = "idle";
  game.players[game.turnIndex].hasSecondChance = false; 
}

// ==========================================
// 4. إدارة اللوبي
// ==========================================
module.exports.startDawamaLobby = async function(interaction, db) {
  const lobbyId = interaction.id;
  const lobby = { id: lobbyId, host: interaction.user.id, players: new Map(), msgId: null, db: db };
  lobby.players.set(interaction.user.id, interaction.user.username);
  activeLobbies.set(interaction.channelId, lobby);

  const embed = new EmbedBuilder()
    .setTitle("🎡 لوبي الدوامة")
    .setColor("#4DFFF3")
    .setDescription("انضم للعبة! (من 1 إلى 4 لاعبين)")
    .addFields({ name: "اللاعبين", value: `<@${interaction.user.id}>` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`dwl_join_${lobbyId}`).setLabel("انضمام").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`dwl_start_${lobbyId}`).setLabel("ابدا").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`dwl_cancel_${lobbyId}`).setLabel("إلغاء").setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
  const msg = await interaction.fetchReply();
  lobby.msgId = msg.id;
};

module.exports.handleDawamaLobbyButtons = async function(i, db) {
  const lobby = activeLobbies.get(i.channelId);
  if (!lobby) return i.reply({ content: "اللوبي غير متاح.", ephemeral: true });

  const action = i.customId.split("_")[1];

  if (action === "cancel") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يلغي اللعبة.", ephemeral: true });
    activeLobbies.delete(i.channelId);
    return i.update({ content: "تم إلغاء اللوبي.", embeds: [], components: [] });
  }

  if (action === "join") {
    if (lobby.players.size >= 4) return i.reply({ content: "اللوبي ممتلئ (الحد الأقصى 4).", ephemeral: true });
    if (lobby.players.has(i.user.id)) return i.reply({ content: "أنت موجود مسبقاً.", ephemeral: true });
    
    lobby.players.set(i.user.id, i.user.username);
    const embed = EmbedBuilder.from(i.message.embeds[0]).setFields({ name: `اللاعبين (${lobby.players.size}/4)`, value: Array.from(lobby.players.keys()).map(id => `<@${id}>`).join("\n") });
    return i.update({ embeds: [embed] });
  }

  if (action === "start") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يبدأ.", ephemeral: true });
    activeLobbies.delete(i.channelId);
    await i.update({ content: "⏳ جاري إعداد الدوامة...", embeds: [], components: [] });
    
    startDawamaGame(i.channel, lobby, db);
  }
};

// ==========================================
// 5. محرك اللعبة الرئيسي
// ==========================================
async function startDawamaGame(channel, lobby, db) {
  const data = await getDawamaData(db); // استخدام السحب من قاعدة البيانات

  const players = Array.from(lobby.players.entries()).map(([id, name]) => ({
    id, name, balance: 0, freeVowels: 0, hasSecondChance: false
  }));

  const game = {
    id: lobby.id,
    channelId: channel.id,
    category: data.category,
    sentence: data.sentence,
    revealed: [], 
    players,
    turnIndex: 0,
    phase: "idle", 
    currentPrize: 0,
    currentPrizeLabel: "",
    spinResultIndex: 0,
    msgId: null,
    timer: null,
    isProcessing: false
  };

  activeGames.set(channel.id, game);
  await renderGameState(channel, game);
}

module.exports.handleDawamaActionButtons = async function(i, db) {
  const game = activeGames.get(i.channelId);
  if (!game || game.isProcessing) return i.reply({ content: "لا توجد لعبة نشطة أو جاري المعالجة.", ephemeral: true });

  const action = i.customId.split("_")[1];
  const currentPlayer = game.players[game.turnIndex];

  if (action === "quit") {
    if (!game.players.find(p => p.id === i.user.id)) return i.reply({ content: "أنت لست في اللعبة.", ephemeral: true });
    game.players = game.players.filter(p => p.id !== i.user.id);
    await i.reply(`🚪 <@${i.user.id}> انسحب من الدوامة!`);
    
    if (game.players.length === 0) {
      clearGameTimer(game);
      activeGames.delete(game.channelId);
      return i.channel.send("💀 الجميع انسحب. انتهت اللعبة.");
    }
    if (game.turnIndex >= game.players.length) game.turnIndex = 0;
    game.phase = "idle";
    return renderGameState(i.channel, game);
  }

  if (i.user.id !== currentPlayer.id) return i.reply({ content: "❌ مو دورك يا كابتن!", ephemeral: true });

  clearGameTimer(game); 

  if (action === "spin") {
    game.phase = "spinning";
    game.spinResultIndex = Math.floor(Math.random() * WHEEL_OPTIONS.length);
    const result = WHEEL_OPTIONS[game.spinResultIndex];
    game.currentPrizeLabel = result.label;
    
    await i.deferUpdate();
    await renderGameState(i.channel, game);

    setTimeout(async () => {
      if (!activeGames.has(game.channelId)) return;

      if (result.val === "bankrupt") {
        currentPlayer.balance = 0;
        i.channel.send("💸 **إفلااااس!** طار كل رصيدك بالجولة وانتقل الدور!").then(m=>setTimeout(()=>m.delete().catch(()=>{}), 4000));
        nextTurn(game);
      } 
      else if (result.val === "lose_turn") {
        i.channel.send("🛑 **راحت عليك!** خسرت دورك!").then(m=>setTimeout(()=>m.delete().catch(()=>{}), 4000));
        nextTurn(game);
      }
      else if (result.val === "free_vowel") {
        currentPlayer.freeVowels++;
        i.channel.send("🎟️ **مبروك!** حصلت على مساعدة. العجلة عطتك 1000 ريال للحرف كترضية.").then(m=>setTimeout(()=>m.delete().catch(()=>{}), 6000));
        game.currentPrize = 1000;
        game.phase = "waiting_consonant";
      }
      else if (result.val === "second_chance") {
        currentPlayer.hasSecondChance = true;
        game.currentPrize = 1000; 
        i.channel.send("♻️ **فرصة ثانية!** (لو غلطت ما تخسر دورك). العجلة عطتك 1000 ريال للحرف.").then(m=>setTimeout(()=>m.delete().catch(()=>{}), 6000));
        game.phase = "waiting_consonant";
      }
      else {
        game.currentPrize = result.val;
        game.phase = "waiting_consonant";
      }

      await renderGameState(i.channel, game);
    }, 3000);
    return;
  }

  if (action === "vowel") {
    if (currentPlayer.freeVowels > 0) {
      currentPlayer.freeVowels--;
      await i.reply({ content: "🎟️ استخدمت بطاقة مساعدة! اكتب الحرف الآن." }).then(m=>setTimeout(()=>m.delete().catch(()=>{}), 4000));
    } else if (currentPlayer.balance >= 5000) {
      currentPlayer.balance -= 5000; 
      await i.reply({ content: "💸 خصمنا 5000 من رصيدك. اكتب الحرف المساعد الآن." }).then(m=>setTimeout(()=>m.delete().catch(()=>{}), 4000));
    } else {
      return i.reply({ content: "❌ رصيدك أقل من 5000 وما عندك بطاقة!", ephemeral: true });
    }
    game.phase = "waiting_vowel";
    return renderGameState(i.channel, game);
  }

  if (action === "solve") {
    game.phase = "waiting_solve";
    await i.deferUpdate();
    return renderGameState(i.channel, game);
  }
};

module.exports.handleDawamaMessages = async function(msg, db) {
  const game = activeGames.get(msg.channel.id);
  if (!game || game.isProcessing || msg.author.bot) return;

  const currentPlayer = game.players[game.turnIndex];
  if (msg.author.id !== currentPlayer.id) return; 

  game.isProcessing = true;
  clearGameTimer(game); 

  const text = msg.content.trim();
  // 🔴 التعديل السحري هنا: نفكك رسالة اللاعب حرف حرف ونوحدها عشان تتطابق 100% مع الجواب
  const normText = text.toLowerCase().split("").map(c => normalizeChar(c)).join("");

  setTimeout(() => msg.delete().catch(() => {}), 5000);

  if (game.phase === "idle" && text.length === 1 && VOWELS.includes(normText)) {
    msg.channel.send(`🛑 <@${currentPlayer.id}> كتب حرف مساعد بدون زر! عقوبة: خسارة الدور.`).then(m=>setTimeout(()=>m.delete().catch(()=>{}), 5000));
    nextTurn(game);
    await renderGameState(msg.channel, game);
    game.isProcessing = false;
    return;
  }

  if (game.phase === "waiting_consonant") {
    if (text.length !== 1 || VOWELS.includes(normText)) {
      msg.reply("اكتب حرف واحد غير مساعد!").then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));
      startTurnTimer(msg.channel, game);
      game.isProcessing = false;
      return;
    }

    if (game.revealed.includes(normText)) {
      msg.channel.send("❌ الحرف مكشوف مسبقاً! خسرت دورك.").then(m=>setTimeout(()=>m.delete().catch(()=>{}),4000));
      nextTurn(game);
    } else {
      const sentenceNorm = game.sentence.split("").map(c => normalizeChar(c));
      const count = sentenceNorm.filter(c => c === normText).length;

      if (count > 0) {
        game.revealed.push(normText);
        currentPlayer.balance += (count * game.currentPrize);
        currentPlayer.hasSecondChance = false; 
        msg.channel.send(`✅ كفو! لقيت ${count} حرف (${text})! الدور باقي معك.`).then(m=>setTimeout(()=>m.delete().catch(()=>{}),5000));
        game.phase = "idle";
      } else {
        if (currentPlayer.hasSecondChance) {
          currentPlayer.hasSecondChance = false;
          msg.channel.send(`❌ حرف خاطئ! لكن عندك **فرصة ثانية ♻️** جرب حرف غيره الحين!`).then(m=>setTimeout(()=>m.delete().catch(()=>{}),5000));
          game.phase = "waiting_consonant"; 
          startTurnTimer(msg.channel, game); 
          game.isProcessing = false;
          return; 
        } else {
          msg.channel.send("❌ حرف خاطئ! راح الدور للي بعدك.").then(m=>setTimeout(()=>m.delete().catch(()=>{}),4000));
          nextTurn(game);
        }
      }
    }
    await renderGameState(msg.channel, game);
  } 
  
  else if (game.phase === "waiting_vowel") {
    if (text.length !== 1 || !VOWELS.includes(normText)) {
      msg.reply("اكتب حرف مساعد (ا، و، ي) فقط!").then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));
      startTurnTimer(msg.channel, game);
      game.isProcessing = false;
      return;
    }

    if (game.revealed.includes(normText)) {
      msg.channel.send("❌ الحرف مكشوف مسبقاً! راحت فلوسك ودورك.").then(m=>setTimeout(()=>m.delete().catch(()=>{}),4000));
      nextTurn(game);
    } else {
      const sentenceNorm = game.sentence.split("").map(c => normalizeChar(c));
      if (sentenceNorm.includes(normText)) {
        game.revealed.push(normText);
        msg.channel.send(`✅ الحرف موجود! الدور باقي معك.`).then(m=>setTimeout(()=>m.delete().catch(()=>{}),4000));
        game.phase = "idle";
      } else {
        msg.channel.send("❌ الحرف مو موجود! راح الدور للي بعدك.").then(m=>setTimeout(()=>m.delete().catch(()=>{}),4000));
        nextTurn(game);
      }
    }
    await renderGameState(msg.channel, game);
  }

  else if (game.phase === "waiting_solve") {
    const guessClean = normText.replace(/\s+/g, "");
    const correctClean = game.sentence.toLowerCase().split("").map(c => normalizeChar(c)).join("").replace(/\s+/g, "");

    if (guessClean === correctClean) {
      let totalPot = game.players.reduce((sum, p) => sum + p.balance, 0);
      
      await db.collection("users").updateOne(
        { userId: String(currentPlayer.id) },
        { $inc: { wallet: totalPot } },
        { upsert: true }
      );
      await db.collection("transactions").insertOne({
        userId: String(currentPlayer.id), amount: totalPot, reason: "فوز في لعبة الدوامة", timestamp: new Date()
      });

      game.revealed = game.sentence.split("").map(c => normalizeChar(c));
      const imgBuffer = await buildDawamaImage(game);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "dawama_win.png" });

      clearGameTimer(game);
      activeGames.delete(game.channelId);
      
      await msg.channel.send({
        content: `🎉🎉 **مبروووووك!**\n<@${currentPlayer.id}> حل الجملة صحيحة وسرق البنك بالكامل بإجمالي **${totalPot} ريال** 💰!`,
        files: [attachment]
      });

    } else {
      msg.channel.send("❌ إجابة خاطئة! راحت عليك الفرصة وراح الدور للي بعدك.").then(m=>setTimeout(()=>m.delete().catch(()=>{}),4000));
      nextTurn(game);
      await renderGameState(msg.channel, game);
    }
  }

  game.isProcessing = false;
};

module.exports.hasActiveDawama = (channelId) => {
  return activeGames.has(channelId);
};
