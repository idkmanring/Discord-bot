const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==========================================
// 1. إعدادات قاعدة البيانات (MongoDB) والذكاء الاصطناعي (Gemini)
// ==========================================

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  isValid: { type: Boolean, required: true },
  definition: { type: String, default: "لا يوجد تعريف." }
});
const HarfWord = mongoose.models.HarfWord || mongoose.model("HarfWord", wordSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function verifyWord(word) {
  try {
    const existing = await HarfWord.findOne({ word });
    if (existing) {
      return { valid: existing.isValid, definition: existing.definition };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `هل الكلمة العربية "${word}" (مكونة من 3 حروف) صحيحة ولها معنى أو هي تصريف صحيح؟
أجب في السطر الأول بكلمة "نعم" أو "لا" فقط.
إذا كانت الإجابة نعم، اكتب في السطر الثاني تعريفاً مختصراً جداً للكلمة (لا يتجاوز 10 كلمات).`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().split('\n');
    
    const isYes = responseText[0].includes("نعم");
    const definition = isYes && responseText[1] ? responseText[1].trim() : "لا يوجد تعريف متاح حالياً.";

    await HarfWord.create({ word, isValid: isYes, definition });

    return { valid: isYes, definition };
  } catch (err) {
    console.error("Gemini/DB Error:", err);
    // جلب رسالة الخطأ الحقيقية لتسهيل حل المشكلة من داخل ديسكورد
    const errorReason = err.message ? err.message.substring(0, 50) : "غير معروف";
    return { valid: false, definition: `خطأ تقني: ${errorReason} (راجع الكونسول)` };
  }
}

// ==========================================
// 2. إدارة حالة اللعبة
// ==========================================

const activeHarfGames = {};

function startHarfGame(channelId) {
  if (activeHarfGames[channelId]) return;

  activeHarfGames[channelId] = {
    state: "lobby",
    players: [],
    hostId: null,
    messageId: null,
    letters: [],
    round: 0,
    turn: 0,
    timer: null,
    playerHands: {},
    swapUsed: {}, 
    isSwappingPhase: false, 
    currentWordDefinition: "ابدأ بتكوين أول كلمة!", 
    history: [],
    votes: null,
  };
}

// ==========================================
// 3. الرسم على الصورة (Canvas)
// ==========================================

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

async function renderHarfBoard(baseLetters, definition, playerHand, playerName, isWin = false) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  // ملاحظة: قمنا بإزالة لون الخلفية لتصبح شفافة تماماً

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";

  // --- 1. القسم العلوي (التعريف واسم اللاعب) ---
  if (isWin) {
    ctx.font = "bold 45px Cairo";
    ctx.fillStyle = "#2ecc71";
    ctx.fillText(`🏆 الفائز: ${playerName}`, 400, 60);
  } else {
    ctx.font = "bold 35px Cairo";
    ctx.fillStyle = "#f1c40f";
    ctx.fillText(`دور اللاعب: ${playerName}`, 400, 50);
  }

  ctx.font = "bold 25px Cairo";
  ctx.fillStyle = "#ffffff";
  wrapText(ctx, definition, 400, 110, 700, 35);

  // --- 2. القسم الأوسط (الحروف الأساسية) ---
  const boxSize = 140; // تم تكبير المربع
  const gap = 25;
  const basePositions = [
    { x: 400 + boxSize + gap, y: 300 }, 
    { x: 400, y: 300 },                 
    { x: 400 - boxSize - gap, y: 300 }  
  ];

  ctx.font = "bold 100px Cairo"; // تم تكبير الخط
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#4f545c"; 
    ctx.fillRect(basePositions[i].x - boxSize/2, basePositions[i].y - boxSize/2, boxSize, boxSize);
    
    ctx.strokeStyle = "#23272a";
    ctx.lineWidth = 5;
    ctx.strokeRect(basePositions[i].x - boxSize/2, basePositions[i].y - boxSize/2, boxSize, boxSize);

    ctx.fillStyle = isWin ? "#2ecc71" : "#3498db"; 
    ctx.fillText(baseLetters[i] || "", basePositions[i].x, basePositions[i].y + 10);
  }

  // --- 3. القسم السفلي (حروف اللاعب) ---
  if (!isWin && playerHand && playerHand.length > 0) {
    // تم إزالة جملة "حروفك:"

    const handBox = 110; // تم تكبير المربع الخاص باللاعب
    const handGap = 20;
    const totalWidth = playerHand.length * handBox + (playerHand.length - 1) * handGap;
    let currentX = 400 + totalWidth / 2 - handBox / 2; 

    ctx.font = "bold 70px Cairo"; // تم تكبير خط اللاعب
    for (let i = 0; i < playerHand.length; i++) {
      ctx.fillStyle = "#313338";
      ctx.fillRect(currentX - handBox/2, 480 - handBox/2, handBox, handBox); // رفعناها قليلاً للأعلى
      
      ctx.strokeStyle = "#1e1f22";
      ctx.lineWidth = 4;
      ctx.strokeRect(currentX - handBox/2, 480 - handBox/2, handBox, handBox);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(playerHand[i] || "", currentX, 480 + 10);
      currentX -= (handBox + handGap);
    }
  }

  return new AttachmentBuilder(await canvas.encode("png"), { name: "harf_board.png" });
}

// ==========================================
// 4. دوال اللوبي والبداية
// ==========================================

async function showHarfLobby(channel) {
  const game = activeHarfGames[channel.id];
  if (!game) return;

  const embed = new EmbedBuilder()
    .setTitle("🎮 لعبة: حرف")
    .setDescription(`🧠 انضم للعبة لتكوين كلمات ثلاثية من الحروف.
    
👥 اللاعبين في اللوبي:
${game.players.length > 0 ? game.players.map(p => `• <@${p.id}>`).join("\n") : "_لا أحد انضم بعد_"}

⚠️ الحد الأدنى: 2 لاعبين — الحد الأقصى: 4 لاعبين`)
    .setColor("#f1c40f");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("harf_join").setLabel(" انضمام").setStyle(ButtonStyle.Secondary).setEmoji("1408077902859472966"),
    new ButtonBuilder().setCustomId("harf_leave").setLabel(" انسحاب").setStyle(ButtonStyle.Secondary).setEmoji("1408077754557136926"),
    new ButtonBuilder().setCustomId("harf_start").setLabel("ابدأ ").setStyle(ButtonStyle.Secondary).setEmoji("1408080743971950653")
  );

  const sent = await channel.send({ embeds: [embed], components: [row] });
  game.messageId = sent.id;
}

async function handleHarfLobbyInteraction(interaction) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game || game.state !== "lobby") return;

  const userId = interaction.user.id;

  if (interaction.customId === "harf_join") {
    if (game.players.find(p => p.id === userId)) return interaction.reply({ content: "أنت بالفعل في اللوبي.", ephemeral: true });
    if (game.players.length >= 4) return interaction.reply({ content: "اللوبي ممتلئ.", ephemeral: true });

    game.players.push({ id: userId, username: interaction.user.username });
    if (!game.hostId) game.hostId = userId;
    await updateHarfLobbyMessage(interaction);
    return interaction.deferUpdate();
  }

  if (interaction.customId === "harf_leave") {
    const index = game.players.findIndex(p => p.id === userId);
    if (index === -1) return interaction.reply({ content: "أنت لست في اللوبي.", ephemeral: true });

    game.players.splice(index, 1);
    if (game.players.length === 0) {
      delete activeHarfGames[interaction.channel.id];
      return interaction.message.delete().catch(() => {});
    }
    await updateHarfLobbyMessage(interaction);
    return interaction.deferUpdate();
  }

  if (interaction.customId === "harf_start") {
    if (game.players.length < 2) return interaction.reply({ content: "تحتاج على الأقل إلى لاعبين.", ephemeral: true });
    game.state = "playing";
    return startHarfMatch(interaction.channel);
  }
}

async function updateHarfLobbyMessage(interaction) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game) return;
  
  const embed = new EmbedBuilder()
    .setTitle("🎮 لعبة: حرف")
    .setDescription(`👥 اللاعبين في اللوبي:
${game.players.length > 0 ? game.players.map(p => `• <@${p.id}>`).join("\n") : "_لا أحد انضم بعد_"}

⚠️ الحد الأدنى: 2 لاعبين — الحد الأقصى: 4 لاعبين`)
    .setColor("#f1c40f");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("harf_join").setLabel("انضمام").setStyle(ButtonStyle.Secondary).setEmoji("1408077902859472966"),
    new ButtonBuilder().setCustomId("harf_leave").setLabel("انسحاب").setStyle(ButtonStyle.Secondary).setEmoji("1408077754557136926"),
    new ButtonBuilder().setCustomId("harf_start").setLabel("ابدأ").setStyle(ButtonStyle.Secondary).setEmoji("1408080743971950653")
  );

  const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
  if (msg) await msg.edit({ embeds: [embed], components: [row] });
}

function getRandomArabicLetter() {
  const letters = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
  return letters[Math.floor(Math.random() * letters.length)];
}

function generatePlayerHand() {
  const hand = [];
  while (hand.length < 6) {
    const l = getRandomArabicLetter();
    if (!hand.includes(l)) hand.push(l);
  }
  return hand;
}

async function startHarfMatch(channel) {
  const game = activeHarfGames[channel.id];
  if (!game) return;

  const baseLetters = [];
  while (baseLetters.length < 3) {
    const l = getRandomArabicLetter();
    if (!baseLetters.includes(l)) baseLetters.push(l);
  }
  game.letters = baseLetters;

  game.players.forEach(p => {
    game.playerHands[p.id] = generatePlayerHand();
    game.swapUsed[p.id] = false;
  });

  game.turn = Math.floor(Math.random() * game.players.length);
  game.round = 1;

  const msg = await channel.messages.fetch(game.messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});

  await showHarfTurn(channel);
}

// ==========================================
// 5. إدارة الأدوار والتفاعل (بدون إيمبيد)
// ==========================================

async function showHarfTurn(channel) {
  const game = activeHarfGames[channel.id];
  if (!game) return;

  const currentPlayer = game.players[game.turn];
  const currentId = currentPlayer.id;
  game.isSwappingPhase = false; 

  const baseRow = new ActionRowBuilder();
  for (let i = game.letters.length - 1; i >= 0; i--) {
    baseRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`harf_base_${i}`)
        .setLabel(game.letters[i])
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );
  }

  baseRow.addComponents(
    new ButtonBuilder()
      .setCustomId("harf_swap")
      .setLabel("تبديل")
      .setStyle(ButtonStyle.Success)
      .setEmoji("1416507901425614948") 
      .setDisabled(game.swapUsed[currentId]),
      
    new ButtonBuilder()
      .setCustomId("harf_quit")
      .setLabel("انسحاب")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("1408077754557136926")
  );

  const playerHand = game.playerHands[currentId] || [];
  const handRows = [];
  for (let i = 0; i < playerHand.length; i += 5) {
    const slice = playerHand.slice(i, i + 5);
    const row = new ActionRowBuilder();
    slice.forEach((letter) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`harf_play_${letter}`)
          .setLabel(letter)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false)
      );
    });
    handRows.push(row);
  }

  const attachment = await renderHarfBoard(
    game.letters, 
    game.currentWordDefinition, 
    playerHand, 
    currentPlayer.username
  );

  const msg = await channel.send({
    content: `🎮 <@${currentId}> دورك الآن (لديك 60 ثانية)`,
    files: [attachment],
    components: [baseRow, ...handRows]
  });

  game.messageId = msg.id;

  if (game.timer) clearTimeout(game.timer);
  game.timer = setTimeout(() => {
    handleHarfTimeout(channel);
  }, 60 * 1000);
}

async function handleHarfInteraction(interaction) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game || game.state !== "playing") return;

  if (interaction.customId.startsWith("harf_vote_")) return; 

  const userId = interaction.user.id;
  const currentPlayer = game.players[game.turn];
  if (userId !== currentPlayer.id) {
    return interaction.reply({ content: "ليس دورك!", ephemeral: true });
  }

  if (interaction.customId === "harf_swap") {
    if (game.swapUsed[userId]) return interaction.reply({ content: "لقد استخدمت التبديل مسبقاً في هذه المباراة.", ephemeral: true });
    
    game.isSwappingPhase = true;
    
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
    if (msg) {
        const components = msg.components.map(row => {
            return new ActionRowBuilder().addComponents(
                row.components.map(btn => {
                    const newBtn = ButtonBuilder.from(btn);
                    if (btn.data.custom_id === "harf_swap") newBtn.setDisabled(true);
                    return newBtn;
                })
            );
        });
        await msg.edit({ components });
    }
    return interaction.reply({ content: "🔄 فعلت التبديل! اضغط على أي حرف من حروفك لاستبداله بحرف جديد.", ephemeral: true });
  }

  if (interaction.customId.startsWith("harf_play_")) {
    const letter = interaction.customId.split("_")[2];
    const hand = game.playerHands[userId];
    const handIndex = hand.indexOf(letter);
    
    if (game.isSwappingPhase) {
      if (handIndex === -1) return interaction.reply({ content: "خطأ، الحرف غير موجود.", ephemeral: true });
      
      const newLetter = getRandomArabicLetter();
      hand[handIndex] = newLetter; 
      game.swapUsed[userId] = true; 
      
      await interaction.reply({ content: `✅ تم تبديل الحرف **${letter}** بالحرف **${newLetter}**. استكمل دورك!`, ephemeral: true });
      
      const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});
      return showHarfTurn(interaction.channel);
    }

    game.selection = letter;
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);

    if (msg) {
      const baseRow = new ActionRowBuilder();
      for (let i = game.letters.length - 1; i >= 0; i--) {
        baseRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`harf_base_${i}`)
            .setLabel(game.letters[i])
            .setStyle(ButtonStyle.Primary)
            .setDisabled(false)
        );
      }
      
      baseRow.addComponents(
        new ButtonBuilder().setCustomId("harf_swap").setLabel("تبديل").setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId("harf_quit").setLabel("انسحاب").setStyle(ButtonStyle.Danger)
      );

      const playerHand = game.playerHands[userId] || [];
      const handRows = [];
      for (let i = 0; i < playerHand.length; i += 5) {
        const slice = playerHand.slice(i, i + 5);
        const row = new ActionRowBuilder();
        slice.forEach((l) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`harf_play_${l}`)
              .setLabel(l)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        });
        handRows.push(row);
      }

      await msg.edit({ components: [baseRow, ...handRows] });
    }

    return interaction.reply({ content: `✅ اخترت الحرف **${letter}**، الآن اختر أي حرف أساسي لتبديله.`, ephemeral: true });
  }

  if (interaction.customId.startsWith("harf_base_")) {
    if (!game.selection) return interaction.reply({ content: "اختر حرف من حروفك أولًا.", ephemeral: true });

    const baseIndex = parseInt(interaction.customId.split("_")[2]);
    const oldLetter = game.letters[baseIndex];
    const newLetter = game.selection;
    
    const trialWordArr = [...game.letters];
    trialWordArr[baseIndex] = newLetter;
    const word = trialWordArr.join(""); 

    const hand = game.playerHands[userId];
    const handIndex = hand.indexOf(newLetter);
    if (handIndex === -1) return interaction.reply({ content: "حدث خطأ، الحرف غير موجود في يدك.", ephemeral: true });

    game.selection = null;
    await interaction.deferUpdate(); 

    const checkResult = await verifyWord(word);

    if (checkResult.valid) {
      game.letters[baseIndex] = newLetter;
      hand.splice(handIndex, 1); 
      game.currentWordDefinition = `**${word}**: ${checkResult.definition}`;

      clearTimeout(game.timer);
      game.turn = (game.turn + 1) % game.players.length;

      const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});

      if (hand.length === 0) {
        delete activeHarfGames[interaction.channel.id];
        const winAttachment = await renderHarfBoard(
          game.letters, 
          game.currentWordDefinition, 
          [], 
          currentPlayer.username, 
          true
        );
        return interaction.channel.send({ content: `🎉 مبروك الفوز <@${userId}>!`, files: [winAttachment] });
      }

      return showHarfTurn(interaction.channel);
    } else {
      return startVotingOnInvalidWord(interaction, word, baseIndex, newLetter, checkResult.definition);
    }
  }

  if (interaction.customId === "harf_quit") {
    game.players = game.players.filter(p => p.id !== userId);
    delete game.playerHands[userId];
    if (game.players.length === 1) {
      const winner = game.players[0];
      delete activeHarfGames[interaction.channel.id];
      return interaction.channel.send(`🏆 <@${winner.id}> فاز لأن البقية انسحبوا!`);
    }

    clearTimeout(game.timer);
    game.turn = game.turn >= game.players.length ? 0 : game.turn;
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
    if (msg) await msg.delete().catch(() => {});
    return showHarfTurn(interaction.channel);
  }
}

async function startVotingOnInvalidWord(interaction, word, baseIndex, newLetter, botReason) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game) return;

  const userId = interaction.user.id;
  const voters = game.players.filter(p => p.id !== userId);
  
  const voteData = {
    word,
    by: userId,
    baseIndex,
    newLetter,
    votes: {},
    messageId: null,
    timeout: null
  };
  game.votes = voteData;

  const embed = new EmbedBuilder()
    .setTitle("📋 تصويت على الكلمة")
    .setDescription(`🤖 البوت لم يتعرف على الكلمة: **${word}**\nالسبب: ${botReason}\n\n🗳️ هل توافقون على أنها كلمة صحيحة؟
    
✅ إذا كانت الكلمة منطقية وافقوا عليها.
❌ إذا لا، ارفضوها.

عدد المصوتين: ${voters.length}`)
    .setColor("#e67e22");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("harf_vote_yes").setLabel(" اوافق").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("harf_vote_no").setLabel(" أرفض").setStyle(ButtonStyle.Danger)
  );

  const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
  voteData.messageId = msg.id;

  voteData.timeout = setTimeout(() => finishVote(interaction.channel), 30000);
}

async function handleVote(interaction) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game || !game.votes) return;

  const voteData = game.votes;
  const userId = interaction.user.id;

  if (userId === voteData.by) return interaction.reply({ content: "لا يمكنك التصويت على كلمتك.", ephemeral: true });
  if (voteData.votes[userId]) return interaction.reply({ content: "لقد صوتت مسبقًا.", ephemeral: true });

  const value = interaction.customId === "harf_vote_yes" ? "yes" : "no";
  voteData.votes[userId] = value;

  const totalVotes = Object.keys(voteData.votes).length;
  const totalVoters = game.players.filter(p => p.id !== voteData.by).length;

  if (totalVotes >= totalVoters) {
    clearTimeout(voteData.timeout);
    return finishVote(interaction.channel);
  }

  return interaction.reply({ content: `🗳️ تم تسجيل صوتك: ${value === "yes" ? "موافق" : "رافض"}`, ephemeral: true });
}

async function finishVote(channel) {
  const game = activeHarfGames[channel.id];
  if (!game || !game.votes) return;

  const { votes, baseIndex, newLetter, by, word } = game.votes;
  const yes = Object.values(votes).filter(v => v === "yes").length;
  const no = Object.values(votes).filter(v => v === "no").length;

  const hand = game.playerHands[by];
  const currentPlayer = game.players.find(p => p.id === by);

  const resultMessage = yes > no
    ? `✅ تم قبول الكلمة بأغلبية (${yes} مقابل ${no})`
    : `❌ تم رفض الكلمة (${yes} مقابل ${no})`;

  const resultMsg = await channel.send(resultMessage);
  setTimeout(() => resultMsg.delete().catch(() => {}), 5000);
  
  const voteMsg = await channel.messages.fetch(game.votes.messageId).catch(() => null);
  if (voteMsg) await voteMsg.delete().catch(() => {});

  if (yes > no) {
    await HarfWord.updateOne(
        { word },
        { $set: { isValid: true, definition: "تم إضافتها عبر تصويت اللاعبين." } },
        { upsert: true }
    ).catch(() => {});

    game.letters[baseIndex] = newLetter;
    game.currentWordDefinition = `**${word}**: تم قبولها بتصويت اللاعبين.`;
    const index = hand.indexOf(newLetter);
    if (index !== -1) hand.splice(index, 1);
  } else {
    const newL = getRandomArabicLetter();
    if (!hand.includes(newL)) hand.push(newL);
  }

  clearTimeout(game.timer);
  game.turn = (game.turn + 1) % game.players.length;
  game.votes = null;

  const msg = await channel.messages.fetch(game.messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});

  if (hand.length === 0) {
    delete activeHarfGames[channel.id];
    const winAttachment = await renderHarfBoard(
      game.letters, 
      game.currentWordDefinition, 
      [], 
      currentPlayer.username, 
      true
    );
    return channel.send({ content: `🎉 مبروك الفوز <@${by}>!`, files: [winAttachment] });
  }

  return showHarfTurn(channel);
}

async function handleHarfTimeout(channel) {
  const game = activeHarfGames[channel.id];
  if (!game || game.state !== "playing") return;

  const current = game.players[game.turn];
  const hand = game.playerHands[current.id];
  const newLetter = getRandomArabicLetter();

  if (!hand.includes(newLetter) && hand.length < 12) {
    hand.push(newLetter);
    await channel.send(`⏰ <@${current.id}> انتهى وقته! تم إضافة حرف عشوائي (${newLetter})`);
  } else if (hand.length >= 12) {
    await channel.send(`❗ <@${current.id}> وصل الحد الأقصى من الحروف. تم تجاوز الدور بدون إضافة حرف.`);
  }

  const msg = await channel.messages.fetch(game.messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});

  game.turn = (game.turn + 1) % game.players.length;
  return showHarfTurn(channel);
}

module.exports = {
  startHarfGame,
  showHarfLobby,
  handleHarfLobbyInteraction,
  handleHarfInteraction,
  handleVote,
};
