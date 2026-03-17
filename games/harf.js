const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==========================================
// 1. إعدادات قاعدة البيانات (MongoDB) والذكاء الاصطناعي (Gemini)
// ==========================================

// إعداد نموذج Mongoose لحفظ الكلمات ومعانيها
const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  isValid: { type: Boolean, required: true },
  definition: { type: String, default: "لا يوجد تعريف." }
});
const HarfWord = mongoose.models.HarfWord || mongoose.model("HarfWord", wordSchema);

// إعداد Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyBiKTqG6Dax9Xd7gXyeRER4p5mdbKTH-7M");

async function verifyWord(word) {
  try {
    // 1. التحقق من قاعدة البيانات أولاً لتوفير التوكنز
    const existing = await HarfWord.findOne({ word });
    if (existing) {
      return { valid: existing.isValid, definition: existing.definition };
    }

    // 2. إذا لم تكن موجودة، نسأل Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `هل الكلمة العربية "${word}" (مكونة من 3 حروف) صحيحة ولها معنى أو هي تصريف صحيح؟
أجب في السطر الأول بكلمة "نعم" أو "لا" فقط.
إذا كانت الإجابة نعم، اكتب في السطر الثاني تعريفاً مختصراً جداً للكلمة (لا يتجاوز 10 كلمات).`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().split('\n');
    
    const isYes = responseText[0].includes("نعم");
    const definition = isYes && responseText[1] ? responseText[1].trim() : "لا يوجد تعريف متاح حالياً.";

    // 3. حفظ النتيجة في MongoDB للمرات القادمة
    await HarfWord.create({ word, isValid: isYes, definition });

    return { valid: isYes, definition };
  } catch (err) {
    console.error("Gemini/DB Error:", err);
    return { valid: false, definition: "حدث خطأ أثناء التحقق من الكلمة." }; // في حال الخطأ نعتبرها غير صالحة ليتم التصويت
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
    swapUsed: {}, // لتتبع استخدام ميزة التبديل لكل لاعب { userId: boolean }
    isSwappingPhase: false, // لمعرفة ما إذا كان اللاعب الحالي في وضع تبديل حرف
    currentWordDefinition: "ابدأ بتكوين أول كلمة!", // لحفظ تعريف الكلمة الحالية المعروضة
    history: [],
    votes: null,
  };
}

// ==========================================
// 3. الرسم على الصورة (Canvas)
// ==========================================

async function renderHarfBoard(baseLetters) {
  // يرجى التأكد من إضافة الصورة 'harf_board.png' في مجلد templates الخاص بك
  const bg = global.assets?.harf_board; 
  const canvas = createCanvas(bg ? bg.width : 800, bg ? bg.height : 400);
  const ctx = canvas.getContext("2d");

  if (bg) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  } else {
    // خلفية احتياطية في حال عدم وجود الصورة
    ctx.fillStyle = "#2b2d31";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 80px Cairo"; // تأكد من تحميل خط Cairo في الانديكس
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // إحداثيات رسم الحروف الثلاثة الأساسية (يمكنك تعديل الـ x و y لتناسب قالبك)
  const positions = [
    { x: canvas.width / 2 + 150, y: canvas.height / 2 }, // الحرف الأول (يمين)
    { x: canvas.width / 2, y: canvas.height / 2 },       // الحرف الأوسط
    { x: canvas.width / 2 - 150, y: canvas.height / 2 }  // الحرف الثالث (يسار)
  ];

  for (let i = 0; i < 3; i++) {
    ctx.fillText(baseLetters[i] || "", positions[i].x, positions[i].y);
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
  // التحديث كما في الكود السابق
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
// 5. إدارة الأدوار والتفاعل
// ==========================================

async function showHarfTurn(channel) {
  const game = activeHarfGames[channel.id];
  if (!game) return;

  const currentPlayer = game.players[game.turn];
  const currentId = currentPlayer.id;
  game.isSwappingPhase = false; // إعادة تعيين وضع التبديل مع بداية كل دور

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

  // إضافة أزرار التحكم الجانبية (تبديل وانسحاب)
  baseRow.addComponents(
    new ButtonBuilder()
      .setCustomId("harf_swap")
      .setLabel("تبديل")
      .setStyle(ButtonStyle.Success)
      .setEmoji("1416507901425614948") // إيموجي التبديل
      .setDisabled(game.swapUsed[currentId]), // معطل إذا استخدمه مسبقاً
      
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

  const attachment = await renderHarfBoard(game.letters);

  const embed = new EmbedBuilder()
    .setTitle(`✏️ دور ${currentPlayer.username}`)
    .setDescription(`📖 **الكلمة السابقة:** ${game.currentWordDefinition}\n\n🎯 كون كلمة ثلاثية، أو استخدم زر **تبديل** لتغيير أحد حروفك.
⏳ لديك 60 ثانية لاتخاذ القرار.`)
    .setColor("#3498db");

  const msg = await channel.send({
    content: `🎮 <@${currentId}> دورك الآن`,
    embeds: [embed],
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

  // --- زر التبديل ---
  if (interaction.customId === "harf_swap") {
    if (game.swapUsed[userId]) return interaction.reply({ content: "لقد استخدمت التبديل مسبقاً في هذه المباراة.", ephemeral: true });
    
    game.isSwappingPhase = true;
    
    // تعطيل زر التبديل وتفعيل الحروف ليختار اللاعب الحرف الذي يريد تبديله
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
    if (msg) {
        const components = msg.components.map(row => {
            return new ActionRowBuilder().addComponents(
                row.components.map(btn => {
                    const newBtn = ButtonBuilder.from(btn);
                    if (btn.customId === "harf_swap") newBtn.setDisabled(true);
                    return newBtn;
                })
            );
        });
        await msg.edit({ components });
    }
    return interaction.reply({ content: "🔄 لقد فعلت التبديل! اضغط على أي حرف من حروفك لاستبداله بحرف جديد.", ephemeral: true });
  }

  // --- اختيار حرف من اليد ---
  if (interaction.customId.startsWith("harf_play_")) {
    const letter = interaction.customId.split("_")[2];
    const hand = game.playerHands[userId];
    const handIndex = hand.indexOf(letter);
    
    // إذا كان اللاعب في وضع التبديل
    if (game.isSwappingPhase) {
      if (handIndex === -1) return interaction.reply({ content: "خطأ، الحرف غير موجود.", ephemeral: true });
      
      const newLetter = getRandomArabicLetter();
      hand[handIndex] = newLetter; // استبدال الحرف
      game.swapUsed[userId] = true; // تسجيل الاستخدام
      
      await interaction.reply({ content: `✅ تم تبديل الحرف **${letter}** بالحرف **${newLetter}**. استكمل دورك!`, ephemeral: true });
      
      // إعادة عرض الدور بنفس حالة الوقت
      const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});
      return showHarfTurn(interaction.channel);
    }

    // إذا كان لعباً طبيعياً
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
      
      // تعطيل زر التبديل عند بدء اختيار الكلمة لمنع اللخبطة
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

  // --- اختيار حرف أساسي (تكوين الكلمة) ---
  if (interaction.customId.startsWith("harf_base_")) {
    if (!game.selection) return interaction.reply({ content: "اختر حرف من حروفك أولًا.", ephemeral: true });

    const baseIndex = parseInt(interaction.customId.split("_")[2]);
    const oldLetter = game.letters[baseIndex];
    const newLetter = game.selection;
    const trialWordArr = [...game.letters];
    trialWordArr[baseIndex] = newLetter;
    
    // الانتباه للترتيب: الحروف الأساسية معروضة من اليمين لليسار
    const word = trialWordArr.reverse().join(""); 

    const hand = game.playerHands[userId];
    const handIndex = hand.indexOf(newLetter);
    if (handIndex === -1) return interaction.reply({ content: "حدث خطأ، الحرف غير موجود في يدك.", ephemeral: true });

    game.selection = null;
    await interaction.deferUpdate(); // تأجيل الرد لأن الفحص قد يأخذ بضع ثوانٍ

    // التحقق من الكلمة باستخدام الذكاء الاصطناعي/MongoDB
    const checkResult = await verifyWord(word);

    if (checkResult.valid) {
      game.letters[baseIndex] = newLetter;
      hand.splice(handIndex, 1); 
      game.currentWordDefinition = `**${word}**: ${checkResult.definition}`; // حفظ التعريف لعرضه

      clearTimeout(game.timer);
      game.turn = (game.turn + 1) % game.players.length;

      // فوز اللاعب
      if (hand.length === 0) {
        delete activeHarfGames[interaction.channel.id];
        const winEmbed = new EmbedBuilder()
            .setTitle("🏆 نهاية المباراة!")
            .setColor("Green")
            .setDescription(`الكلمة الأخيرة كانت: **${word}**\n📖 تعريفها: ${checkResult.definition}\n\n**الفائز هو: <@${userId}> 🎉**`);
        return interaction.channel.send({ embeds: [winEmbed] });
      }

      const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});

      return showHarfTurn(interaction.channel);
    } else {
      // إذا فشل الفحص، نلجأ للتصويت كنظام حماية (Fallback)
      return startVotingOnInvalidWord(interaction, word, baseIndex, newLetter, checkResult.definition);
    }
  }

  // --- زر الانسحاب ---
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

  const resultMessage = yes > no
    ? `✅ تم قبول الكلمة بأغلبية (${yes} مقابل ${no})`
    : `❌ تم رفض الكلمة (${yes} مقابل ${no})`;

  const resultMsg = await channel.send(resultMessage);
  setTimeout(() => resultMsg.delete().catch(() => {}), 5000);
  
  const voteMsg = await channel.messages.fetch(game.votes.messageId).catch(() => null);
  if (voteMsg) await voteMsg.delete().catch(() => {});

  if (yes > no) {
    // حفظ الكلمة في الداتابيس حتى لا نحتاج للتصويت عليها المرة القادمة!
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
    const winEmbed = new EmbedBuilder()
        .setTitle("🏆 نهاية المباراة!")
        .setColor("Green")
        .setDescription(`**الفائز هو: <@${by}> 🎉**`);
    return channel.send({ embeds: [winEmbed] });
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
