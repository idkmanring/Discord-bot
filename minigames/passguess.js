// minigames/passguess.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");

const activeLobbies = new Map();
const activeGames = new Map();

// ==========================================
// 1. حساب الألوان (لوغاريتم كسر الرقم)
// ==========================================
function getFeedback(guess, secret) {
  let greens = 0, yellows = 0;
  let gArr = guess.split('');
  let sArr = secret.split('');
  
  // فحص الأخضر (الرقم صح والمكان صح)
  for (let i = 0; i < 4; i++) {
    if (gArr[i] === sArr[i]) {
      greens++;
      gArr[i] = null; 
      sArr[i] = null; 
    }
  }
  
  // فحص الأصفر (الرقم صح بس المكان خطأ)
  for (let i = 0; i < 4; i++) {
    if (gArr[i] !== null) {
      let matchIdx = sArr.indexOf(gArr[i]);
      if (matchIdx !== -1) {
        yellows++;
        sArr[matchIdx] = null; 
      }
    }
  }
  
  let greys = 4 - greens - yellows;
  return { greens, yellows, greys };
}

// ==========================================
// 2. رسم اللوحة (التصميم الشفاف والذكي)
// ==========================================
async function buildBoardImage(playerState, targetName, isOffline) {
  const history = playerState.history;
  const maxPerCol = 10;
  // 🔴 تفعيل العمود الثاني فقط إذا تجاوز اللاعب 10 محاولات (ديناميكي)
  const showTwoCols = history.length > 10; 

  // تكبير عرض الصورة فقط إذا فتحنا العمود الثاني
  const width = showTwoCols ? 1150 : 650;
  const height = 1150; // ارتفاع ثابت يكفي لـ 10 صفوف براحة
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // خلفية شفافة بالكامل (بدون إطار)
  ctx.clearRect(0, 0, width, height);

  // النصوص العلوية (مع ظل أسود لضمان وضوحها على كل ثيمات الديسكورد)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 10;
  ctx.font = "bold 50px Cairo";
  ctx.fillText(`🎯 الهدف: كسر رقم ${targetName}`, width / 2, 60);
  ctx.shadowBlur = 0; // إيقاف الظل لباقي العناصر

  const boxS = 85; // مربعات ضخمة وعريضة
  const gap = 15;
  const rowH = boxS + gap;
  const sBox = 38; // مربعات الألوان الجانبية
  const sGap = 8;

  const colW = (4 * boxS + 3 * gap) + 30 + (2 * sBox + sGap); // عرض العمود الواحد
  const col1X = showTwoCols ? (width / 2 - colW - 30) : (width - colW) / 2; // التمركز الذكي
  const col2X = width / 2 + 30;
  const boardStartY = 140;

  // دالة لرسم صف واحد
  const drawRow = (guessObj, startX, startY, isEmpty = false) => {
    // 1. رسم 4 مربعات للأرقام (أبيض فاتح)
    for (let i = 0; i < 4; i++) {
      const x = startX + i * (boxS + gap);
      
      // ظل خفيف لجمالية المربع الأبيض
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#F8FAFC"; 
      ctx.beginPath();
      ctx.roundRect(x, startY, boxS, boxS, 14);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // كتابة الرقم بخط كبير واضح
      if (!isEmpty && guessObj) {
        ctx.fillStyle = "#0F172A"; // لون نص غامق داخل المربع الأبيض
        ctx.font = "bold 55px Cairo";
        ctx.fillText(guessObj.guess[i], x + boxS / 2, startY + boxS / 2 + 5);
      }
    }

    // 2. رسم مربعات الألوان (2x2) الجانبية
    const fbX = startX + 4 * (boxS + gap) + 15;
    const fbStartY = startY + (boxS - (2 * sBox + sGap)) / 2; // التمركز عمودياً مع المربعات الكبيرة

    let colors = [];
    if (!isEmpty && guessObj) {
      for(let i=0; i<guessObj.feedback.greens; i++) colors.push("#22C55E");
      for(let i=0; i<guessObj.feedback.yellows; i++) colors.push("#EAB308");
      // 🔴 الخطأ صار رمادي غامق جداً يبرز بوضوح
      for(let i=0; i<guessObj.feedback.greys; i++) colors.push("#334155"); 
    } else {
      // لون شفاف جداً للمحاولات اللي لسه ما انلعبت
      colors = ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)"];
    }

    for (let i = 0; i < 4; i++) {
      const rx = fbX + (i % 2) * (sBox + sGap);
      const ry = fbStartY + Math.floor(i / 2) * (sBox + sGap);
      
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.roundRect(rx, ry, sBox, sBox, 8);
      ctx.fill();
    }
  };

  // رسم العمود الأول (دائماً موجود)
  for (let i = 0; i < maxPerCol; i++) {
    const y = boardStartY + i * rowH;
    if (i < history.length) drawRow(history[i], col1X, y, false);
    else drawRow(null, col1X, y, true);
  }

  // رسم العمود الثاني (فقط إذا تجاوز اللاعب 10 محاولات في الأونلاين)
  if (showTwoCols) {
    for (let i = 0; i < maxPerCol; i++) {
      const y = boardStartY + i * rowH;
      const histIndex = i + 10;
      if (histIndex < history.length) {
        drawRow(history[histIndex], col2X, y, false);
      } else {
        if (!isOffline) drawRow(null, col2X, y, true);
      }
    }
  }

  return canvas.toBuffer("image/png");
}

async function renderGameState(channel, game, customMsg = null) {
  if (game.phase === "ended") return;

  const currentPlayer = game.alivePlayers[game.turnIndex];
  const targetPlayer = game.isOffline ? null : game.alivePlayers[(game.turnIndex + 1) % game.alivePlayers.length];
  const targetName = game.isOffline ? "البوت (سولو)" : targetPlayer.name;

  const imgBuffer = await buildBoardImage(currentPlayer, targetName, game.isOffline);
  const attachment = new AttachmentBuilder(imgBuffer, { name: "password.png" });

  let content = customMsg || `🔐 **كسر الأرقام** | الدور على: <@${currentPlayer.id}>\nالهدف الحالي: كسر رقم **${targetName}**!\nاكتب بالشات **4 أرقام** للتوقع (لديك 60 ثانية).`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pg_quit_${game.id}`).setLabel("انسحاب").setStyle(ButtonStyle.Danger)
  );

  const payload = { content, files: [attachment], components: [row] };

  if (game.msgId) {
    try {
      const oldMsg = await channel.messages.fetch(game.msgId);
      await oldMsg.delete().catch(()=>{});
    } catch(e) {}
  }
  
  const newMsg = await channel.send(payload);
  game.msgId = newMsg.id;

  // مؤقت الدور (60 ثانية)
  if (game.timer) clearTimeout(game.timer);
  game.timer = setTimeout(async () => {
    if (activeGames.has(channel.id) && game.turnIndex === game.alivePlayers.indexOf(currentPlayer)) {
      channel.send(`⏳ انتهى الوقت! طار الدور عن <@${currentPlayer.id}>.`).then(m=>setTimeout(()=>m.delete().catch(()=>{}), 4000));
      nextTurn(game);
      await renderGameState(channel, game);
    }
  }, 60000);
}

function nextTurn(game) {
  game.turnIndex = (game.turnIndex + 1) % game.alivePlayers.length;
}

// ==========================================
// 3. إدارة اللوبي وإعدادات ما قبل اللعبة
// ==========================================
module.exports.startPasswordLobby = async function(interaction) {
  const lobbyId = interaction.id;
  const lobby = { id: lobbyId, host: interaction.user.id, players: new Map(), mode: "solo", msgId: null };
  lobby.players.set(interaction.user.id, { name: interaction.user.username, isReady: false, secret: null });
  activeLobbies.set(interaction.channelId, lobby);

  await updateLobbyMessage(interaction, lobby, true);
};

async function updateLobbyMessage(interaction, lobby, isFirst = false) {
  const embed = new EmbedBuilder()
    .setTitle("🔐 لوبي كسر الأرقام")
    .setColor("#38BDF8")
    .setDescription(`الوضع الحالي: **${lobby.mode === "solo" ? "سولو (لاعب ضد البوت)" : "أونلاين (2 إلى 4 لاعبين)"}**`)
    .addFields({ name: `اللاعبين (${lobby.players.size})`, value: Array.from(lobby.players.keys()).map(id => `<@${id}>`).join("\n") });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pgl_start_${lobby.id}`).setLabel("ابدأ اللعبة").setStyle(ButtonStyle.Success).setEmoji("🚀"),
    new ButtonBuilder().setCustomId(`pgl_toggle_${lobby.id}`).setLabel(lobby.mode === "solo" ? "تحويل إلى أونلاين" : "تحويل إلى سولو").setStyle(ButtonStyle.Primary).setEmoji("🔄"),
    new ButtonBuilder().setCustomId(`pgl_cancel_${lobby.id}`).setLabel("إلغاء").setStyle(ButtonStyle.Danger)
  );

  if (lobby.mode === "online") {
    row.addComponents(new ButtonBuilder().setCustomId(`pgl_join_${lobby.id}`).setLabel("انضمام").setStyle(ButtonStyle.Secondary));
  }

  if (isFirst) {
    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();
    lobby.msgId = msg.id;
  } else {
    await interaction.update({ embeds: [embed], components: [row] });
  }
}

module.exports.handleLobbyButtons = async function(i) {
  const lobby = activeLobbies.get(i.channelId);
  if (!lobby) return i.reply({ content: "❌ اللوبي غير متاح.", ephemeral: true });

  const action = i.customId.split("_")[1];

  if (action === "cancel") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يلغي اللعبة.", ephemeral: true });
    activeLobbies.delete(i.channelId);
    return i.update({ content: "تم إلغاء اللوبي.", embeds: [], components: [] });
  }

  if (action === "toggle") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يغير النمط.", ephemeral: true });
    lobby.mode = lobby.mode === "solo" ? "online" : "solo";
    
    if (lobby.mode === "solo") { 
      lobby.players.clear();
      lobby.players.set(i.user.id, { name: i.user.username, isReady: false, secret: null });
    }
    return updateLobbyMessage(i, lobby);
  }

  if (action === "join") {
    if (lobby.mode === "solo") return i.reply({ content: "اللعبة سولو حالياً.", ephemeral: true });
    if (lobby.players.size >= 4) return i.reply({ content: "الحد الأقصى 4 لاعبين.", ephemeral: true });
    if (lobby.players.has(i.user.id)) return i.reply({ content: "أنت موجود مسبقاً.", ephemeral: true });
    
    lobby.players.set(i.user.id, { name: i.user.username, isReady: false, secret: null });
    return updateLobbyMessage(i, lobby);
  }

  if (action === "start") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يبدأ.", ephemeral: true });
    
    if (lobby.mode === "online" && lobby.players.size < 2) {
      return i.reply({ content: "الأونلاين يحتاج لاعبين 2 على الأقل!", ephemeral: true });
    }

    if (lobby.mode === "solo") {
      activeLobbies.delete(i.channelId);
      await i.update({ content: "⏳ جاري إعداد اللوحة...", embeds: [], components: [] });
      startPasswordGame(i.channel, lobby);
    } else {
      lobby.phase = "prep";
      await updatePrepMessage(i, lobby);
    }
  }
};

// --- طور التجهيز للأونلاين ---
async function updatePrepMessage(interaction, lobby) {
  const embed = new EmbedBuilder()
    .setTitle("🔐 التجهيز السري (أونلاين)")
    .setColor("#FBBF24")
    .setDescription("كل لاعب يضغط الزر لاختيار 4 أرقام، ثم يضغط جاهز!");

  let playersStatus = "";
  lobby.players.forEach((p, id) => {
    playersStatus += `<@${id}>: ${p.isReady ? "✅ جاهز" : (p.secret ? "🔒 وضع الرقم" : "⏳ ينتظر")}\n`;
  });
  embed.addFields({ name: "حالة اللاعبين", value: playersStatus });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pgp_setpass_${lobby.id}`).setLabel("اختيار الأرقام").setStyle(ButtonStyle.Primary).setEmoji("⌨️"),
    new ButtonBuilder().setCustomId(`pgp_ready_${lobby.id}`).setLabel("جاهز").setStyle(ButtonStyle.Success).setEmoji("✅"),
    new ButtonBuilder().setCustomId(`pgp_cancel_${lobby.id}`).setLabel("إلغاء اللعبة").setStyle(ButtonStyle.Danger)
  );

  if (interaction.isButton()) {
    await interaction.update({ embeds: [embed], components: [row] });
  } else {
    try {
      const msg = await interaction.channel.messages.fetch(lobby.msgId);
      await msg.edit({ embeds: [embed], components: [row] });
    } catch(e) {}
  }
}

module.exports.handlePrepButtons = async function(i) {
  const lobby = activeLobbies.get(i.channelId);
  if (!lobby || lobby.phase !== "prep") return;

  const action = i.customId.split("_")[1];

  if (action === "cancel") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يلغي.", ephemeral: true });
    activeLobbies.delete(i.channelId);
    return i.update({ content: "تم إلغاء اللعبة.", embeds: [], components: [] });
  }

  if (!lobby.players.has(i.user.id)) return i.reply({ content: "لست من المشاركين.", ephemeral: true });
  const player = lobby.players.get(i.user.id);

  if (action === "setpass") {
    const modal = new ModalBuilder()
      .setCustomId(`pg_modal_pass_${lobby.id}`)
      .setTitle("اكتب رقمك السري (4 أرقام)");

    const input = new TextInputBuilder()
      .setCustomId('secret_code')
      .setLabel("يجب أن يكون 4 أرقام بالضبط:")
      .setStyle(TextInputStyle.Short)
      .setMinLength(4)
      .setMaxLength(4)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await i.showModal(modal);
  }

  if (action === "ready") {
    if (!player.secret) return i.reply({ content: "لازم تختار رقمك أولاً!", ephemeral: true });
    player.isReady = true;
    
    let allReady = true;
    lobby.players.forEach(p => { if(!p.isReady) allReady = false; });

    if (allReady) {
      activeLobbies.delete(i.channelId);
      await i.update({ content: "🚀 الكل جاهز! اللعبة بتبدأ الآن...", embeds: [], components: [] });
      startPasswordGame(i.channel, lobby);
    } else {
      await updatePrepMessage(i, lobby);
    }
  }
};

module.exports.handleModal = async function(i) {
  const lobbyId = i.customId.split("_")[3];
  const lobby = activeLobbies.get(i.channelId);
  if (!lobby || lobby.id !== lobbyId) return i.reply({ content: "انتهى وقت اللوبي.", ephemeral: true });

  const code = i.fields.getTextInputValue('secret_code');
  if (!/^\d{4}$/.test(code)) return i.reply({ content: "❌ الرقم لازم يكون 4 أرقام فقط (بدون حروف أو مسافات).", ephemeral: true });

  const player = lobby.players.get(i.user.id);
  player.secret = code;
  player.isReady = false; 
  
  await i.reply({ content: `✅ تم حفظ رقمك السري: ||${code}|| تأكد تضغط جاهز الحين!`, ephemeral: true });
  await updatePrepMessage(i, lobby);
};

// ==========================================
// 4. محرك اللعبة الأساسي
// ==========================================
async function startPasswordGame(channel, lobby) {
  const isOffline = lobby.mode === "solo";
  
  const alivePlayers = [];
  lobby.players.forEach((p, id) => {
    alivePlayers.push({
      id, name: p.name, 
      secret: isOffline ? null : p.secret,
      history: [] 
    });
  });

  const game = {
    id: lobby.id,
    channelId: channel.id,
    isOffline,
    alivePlayers,
    turnIndex: 0,
    botSecret: isOffline ? Math.floor(1000 + Math.random() * 9000).toString() : null,
    msgId: null,
    timer: null,
    phase: "play"
  };

  activeGames.set(channel.id, game);
  await renderGameState(channel, game);
}

module.exports.handleGameButtons = async function(i) {
  const game = activeGames.get(i.channelId);
  if (!game) return;
  const action = i.customId.split("_")[1];

  if (action === "quit") {
    if (!game.alivePlayers.find(p => p.id === i.user.id)) return i.reply({ content: "لست في اللعبة.", ephemeral: true });
    
    if (game.isOffline) {
      if (game.timer) clearTimeout(game.timer);
      activeGames.delete(i.channelId);
      return i.update({ content: `🚪 انسحبت من اللعبة! رقم البوت السري كان: **${game.botSecret}**`, files: [], components: [] });
    }

    const pIndex = game.alivePlayers.findIndex(p => p.id === i.user.id);
    game.alivePlayers.splice(pIndex, 1);
    await i.reply(`🚪 <@${i.user.id}> انسحب من المعركة!`);
    
    if (game.alivePlayers.length === 1) {
      const winner = game.alivePlayers[0];
      if (game.timer) clearTimeout(game.timer);
      activeGames.delete(i.channelId);
      return i.channel.send(`🎉 **الناجي الأخير!** <@${winner.id}> يفوز باللعبة بعد انسحاب الباقين!`);
    }
    
    if (game.turnIndex >= game.alivePlayers.length) game.turnIndex = 0;
    await renderGameState(i.channel, game);
  }
};

module.exports.handleMessages = async function(msg, db) {
  const game = activeGames.get(msg.channel.id);
  if (!game || msg.author.bot) return;

  const currentPlayer = game.alivePlayers[game.turnIndex];
  if (msg.author.id !== currentPlayer.id) return;

  const guess = msg.content.trim();
  if (!/^\d{4}$/.test(guess)) {
    return msg.reply("اكتب 4 أرقام فقط!").then(m=>setTimeout(()=>m.delete().catch(()=>{}),3000));
  }

  setTimeout(() => msg.delete().catch(() => {}), 3000);
  if (game.timer) clearTimeout(game.timer);

  const targetIndex = game.isOffline ? null : (game.turnIndex + 1) % game.alivePlayers.length;
  const targetPlayer = game.isOffline ? null : game.alivePlayers[targetIndex];
  const secretCode = game.isOffline ? game.botSecret : targetPlayer.secret;

  const feedback = getFeedback(guess, secretCode);
  currentPlayer.history.push({ guess, feedback });

  if (feedback.greens === 4) {
    if (game.isOffline) {
      activeGames.delete(msg.channel.id);
      
      await db.collection("users").updateOne(
        { userId: String(currentPlayer.id) },
        { $inc: { wallet: 50000 } },
        { upsert: true }
      );
      
      const imgBuffer = await buildBoardImage(currentPlayer, "البوت", true);
      const att = new AttachmentBuilder(imgBuffer, { name: "win.png" });
      return msg.channel.send({ content: `🎉🎉 **عبقري!** <@${currentPlayer.id}> كسر رقم البوت السري (**${secretCode}**) وفاز بـ 50,000 ريال 💰!`, files: [att] });
    } 
    else {
      msg.channel.send(`💀 **ضربة قاتلة!** <@${currentPlayer.id}> عرف الرقم السري حق **${targetPlayer.name}** (${secretCode}) وطلعه برا اللعبة!`).then(m=>setTimeout(()=>m.delete().catch(()=>{}), 5000));
      game.alivePlayers.splice(targetIndex, 1);
      
      if (game.alivePlayers.length === 1) {
        activeGames.delete(msg.channel.id);
        
        await db.collection("users").updateOne(
          { userId: String(currentPlayer.id) },
          { $inc: { wallet: 100000 } },
          { upsert: true }
        );
        
        const imgBuffer = await buildBoardImage(currentPlayer, "الجميع", false);
        const att = new AttachmentBuilder(imgBuffer, { name: "win.png" });
        return msg.channel.send({ content: `👑 **البقاء للأقوى!**\n<@${currentPlayer.id}> هو الناجي الوحيد وملك الأرقام! فاز بـ 100,000 ريال 💰!`, files: [att] });
      }

      if (game.turnIndex >= game.alivePlayers.length) game.turnIndex = 0;
      return renderGameState(msg.channel, game, `🔄 <@${currentPlayer.id}> يكمل هجومه على الهدف الجديد!`);
    }
  }
  else {
    const maxAttempts = game.isOffline ? 10 : 20; 

    if (currentPlayer.history.length >= maxAttempts) {
      if (game.isOffline) {
        activeGames.delete(msg.channel.id);
        const imgBuffer = await buildBoardImage(currentPlayer, "البوت", true);
        const att = new AttachmentBuilder(imgBuffer, { name: "lose.png" });
        return msg.channel.send({ content: `💀 **انتهت محاولاتك!**\nالرقم السري كان: **${secretCode}**. حظ أوفر يا <@${currentPlayer.id}>!`, files: [att] });
      } 
      else {
        msg.channel.send(`🚨 **إرهاق تام!** <@${currentPlayer.id}> استهلك كل محاولاته ومات!`).then(m=>setTimeout(()=>m.delete().catch(()=>{}), 5000));
        game.alivePlayers.splice(game.turnIndex, 1);
        
        if (game.alivePlayers.length === 1) {
          activeGames.delete(msg.channel.id);
          return msg.channel.send(`👑 <@${game.alivePlayers[0].id}> يفوز لأن الباقين استسلموا!`);
        }
        if (game.turnIndex >= game.alivePlayers.length) game.turnIndex = 0;
        return renderGameState(msg.channel, game);
      }
    }

    if (!game.isOffline) nextTurn(game);
    await renderGameState(msg.channel, game);
  }
};

module.exports.hasActiveGame = (channelId) => {
  return activeGames.has(channelId);
};