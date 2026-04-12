// minigames/imposter.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const imposterQuestionsPool = require("../data/imposter_questions.json");
const activeLobbies = new Map();
const activeGames = new Map();

// ==========================================
// 1. سحب الأسئلة بدون تكرار
// ==========================================
async function getImposterData(db) {
  const collection = db.collection("imposter_used");
  const usedDocs = await collection.find({}).toArray();
  const usedQuestions = usedDocs.map(doc => doc.regular);

  let available = imposterQuestionsPool.filter(item => !usedQuestions.includes(item.regular));

  if (available.length === 0) {
    await collection.deleteMany({});
    available = imposterQuestionsPool;
    console.log("♻️ تم إعادة تصفير أسئلة الإمبوستر.");
  }

  const chosenData = available[Math.floor(Math.random() * available.length)];
  await collection.insertOne({ regular: chosenData.regular, usedAt: new Date() });

  return chosenData;
}

// ==========================================
// 2. إدارة اللوبي
// ==========================================
module.exports.startImposterLobby = async function(interaction, db) {
  const lobbyId = interaction.id;
  const lobby = { id: lobbyId, host: interaction.user.id, players: new Map(), msgId: null, db };
  lobby.players.set(interaction.user.id, interaction.user.username);
  activeLobbies.set(interaction.channelId, lobby);

  await updateLobbyMessage(interaction, lobby, true);
};

async function updateLobbyMessage(interaction, lobby, isFirst = false) {
  const embed = new EmbedBuilder()
    .setTitle("🕵️‍♂️ لوبي الإمبوستر (المخادع)")
    .setColor("#2B2D31")
    .setDescription("هل بتقدر تصيد الإمبوستر من إجابته؟ ولا بتنطرد ظلم؟\nالعدد المسموح: (3 إلى 25 لاعب)")
    .addFields({ name: `اللاعبين (${lobby.players.size})`, value: Array.from(lobby.players.values()).join("\n") || "فارغ" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`impl_join_${lobby.id}`).setLabel("انضمام").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`impl_start_${lobby.id}`).setLabel("بدء اللعبة").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`impl_cancel_${lobby.id}`).setLabel("إلغاء").setStyle(ButtonStyle.Danger)
  );

  if (isFirst) {
    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();
    lobby.msgId = msg.id;
  } else {
    await interaction.update({ embeds: [embed], components: [row] });
  }
}

module.exports.handleLobbyButtons = async function(i, db) {
  const lobby = activeLobbies.get(i.channelId);
  if (!lobby) return i.reply({ content: "❌ اللوبي غير متاح.", ephemeral: true });

  const action = i.customId.split("_")[1];

  if (action === "cancel") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يلغي اللعبة.", ephemeral: true });
    activeLobbies.delete(i.channelId);
    return i.update({ content: "تم إلغاء اللوبي.", embeds: [], components: [] });
  }

  if (action === "join") {
    if (lobby.players.size >= 25) return i.reply({ content: "الحد الأقصى 25 لاعب.", ephemeral: true });
    if (lobby.players.has(i.user.id)) return i.reply({ content: "أنت موجود مسبقاً.", ephemeral: true });

    lobby.players.set(i.user.id, i.user.username);
    return updateLobbyMessage(i, lobby);
  }

  if (action === "start") {
    if (i.user.id !== lobby.host) return i.reply({ content: "الهوست فقط يبدأ.", ephemeral: true });
    if (lobby.players.size < 3) return i.reply({ content: "اللعبة تحتاج 3 لاعبين على الأقل!", ephemeral: true });

    activeLobbies.delete(i.channelId);
    await i.update({ content: "⏳ جاري إعداد الأدوار والأسئلة...", embeds: [], components: [] });
    startImposterGame(i.channel, lobby);
  }
};

// ==========================================
// 3. محرك اللعبة (توزيع الأدوار)
// ==========================================
async function startImposterGame(channel, lobby) {
  const data = await getImposterData(lobby.db);

  // تجهيز اللاعبين
  let playersArray = Array.from(lobby.players.entries()).map(([id, name]) => ({
    id, name, role: 'regular', question: data.regular, answer: null, isReady: false, votes: 0
  }));

  // خلط اللاعبين لتوزيع الأدوار
  playersArray.sort(() => Math.random() - 0.5);

  // إمبوستر 1 أساسي
  playersArray[0].role = 'imposter1';
  playersArray[0].question = data.imposter1;
  let imposterCount = 1;

  // احتمالية 50% لإمبوستر ثاني إذا العدد 5 فأكثر
  if (playersArray.length >= 5 && Math.random() > 0.5) {
    playersArray[1].role = 'imposter2';
    playersArray[1].question = data.imposter2 || data.imposter1; // احتياط لو مافي سؤال ثاني
    imposterCount = 2;
  }

  const game = {
    id: lobby.id,
    channelId: channel.id,
    db: lobby.db,
    players: playersArray,
    regularQuestion: data.regular,
    imposterCount: imposterCount,
    phase: "answering",
    msgId: null,
    timer: null,
    votedPlayers: new Set()
  };

  activeGames.set(channel.id, game);
  await renderAnsweringPhase(channel, game);
}

// ==========================================
// 4. طور الإجابة (Answering Phase)
// ==========================================
async function renderAnsweringPhase(channel, game) {
  const embed = new EmbedBuilder()
    .setTitle("🕵️‍♂️ الإمبوستر | مرحلة الإجابات")
    .setColor("#2B2D31")
    .setDescription("اضغط على **جواب** لقراءة سؤالك السري وكتابة إجابتك.\nبعد ما تخلص اضغط **جاهز**.\n\n**حالة اللاعبين:**");

  let status = "";
  game.players.forEach(p => {
    status += `🔹 ${p.name}: ${p.isReady ? "✅ جاهز" : (p.answer ? "📝 جاوب (غير جاهز)" : "⏳ ينتظر")}\n`;
  });
  embed.addFields({ name: "اللاعبين", value: status });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`impg_answer_${game.id}`).setLabel("جواب ").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`impg_ready_${game.id}`).setLabel("جاهز").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`impg_quit_${game.id}`).setLabel("انسحاب").setStyle(ButtonStyle.Danger)
  );

  if (game.msgId) {
    try {
      const oldMsg = await channel.messages.fetch(game.msgId);
      await oldMsg.edit({ embeds: [embed], components: [row], content: "" });
    } catch(e) {}
  } else {
    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    game.msgId = newMsg.id;
  }
}

module.exports.handleGameButtons = async function(i) {
  const game = activeGames.get(i.channelId);
  if (!game || game.phase !== "answering") return;

  const action = i.customId.split("_")[1];
  const playerIndex = game.players.findIndex(p => p.id === i.user.id);

  if (action === "quit") {
    if (playerIndex === -1) return i.reply({ content: "أنت لست في اللعبة.", ephemeral: true });
    game.players.splice(playerIndex, 1);
    await i.reply(`🚪 <@${i.user.id}> انسحب من اللعبة!`);

    if (game.players.length < 3) {
      activeGames.delete(game.channelId);
      return i.channel.send("💀 انتهت اللعبة لأن عدد اللاعبين أقل من 3.");
    }
    return renderAnsweringPhase(i.channel, game);
  }

  if (playerIndex === -1) return i.reply({ content: "لست من المشاركين.", ephemeral: true });
  const player = game.players[playerIndex];

  if (action === "answer") {
    const modal = new ModalBuilder()
      .setCustomId(`imp_modal_ans_${game.id}`)
      .setTitle("سؤالك السري (لا توريه أحد!)"); // العنوان ثابت لأن ديسكورد يمنع العناوين الطويلة

    // عرض السؤال في الـ Label وقصه لـ 45 حرف كحماية من الكراش
    const safeQuestion = player.question.length > 45 ? player.question.substring(0, 42) + "..." : player.question;

    const input = new TextInputBuilder()
      .setCustomId('user_answer')
      .setLabel(safeQuestion)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await i.showModal(modal);
  }

  if (action === "ready") {
    if (!player.answer) return i.reply({ content: "لازم تجاوب أولاً عشان تضغط جاهز!", ephemeral: true });
    player.isReady = true;

    const allReady = game.players.every(p => p.isReady);
    if (allReady) {
      game.phase = "voting";
      await i.update({ content: "🚀 الكل جاهز! ننتقل للتصويت...", embeds: [], components: [] });
      startVotingPhase(i.channel, game);
    } else {
      await i.deferUpdate();
      await renderAnsweringPhase(i.channel, game);
    }
  }
};

module.exports.handleModal = async function(i) {
  const gameId = i.customId.split("_")[3];
  const game = activeGames.get(i.channelId);
  if (!game || game.id !== gameId) return i.reply({ content: "انتهى وقت اللعبة.", ephemeral: true });

  const answer = i.fields.getTextInputValue('user_answer');
  const player = game.players.find(p => p.id === i.user.id);
  player.answer = answer;
  player.isReady = false; 

  await i.reply({ content: `✅ تم حفظ إجابتك: **${answer}**\nلا تنسى تضغط "جاهز"!`, ephemeral: true });
  await renderAnsweringPhase(i.channel, game);
};

// ==========================================
// 5. طور التصويت (Voting Phase)
// ==========================================
async function startVotingPhase(channel, game) {
  const embed = new EmbedBuilder()
    .setTitle("🕵️‍♂️ الإمبوستر | مرحلة التصويت")
    .setColor("#EAB308")
    .setDescription(`**السؤال الأصلي كان:**\n📜 "${game.regularQuestion}"\n\nأحد الموجودين سؤاله مختلف وإجابته مالها دخل! من تتوقع الإمبوستر؟ (لديك دقيقتين للتصويت)`);

  let answersList = "";
  game.players.forEach(p => {
    answersList += `👤 **${p.name}:** ${p.answer}\n`;
  });
  embed.addFields({ name: "إجابات اللاعبين", value: answersList });

  // إنشاء أزرار بأسماء اللاعبين (كل 5 أزرار في صف)
  const rows = [];
  let currentRow = new ActionRowBuilder();

  game.players.forEach((p, index) => {
    if (index > 0 && index % 5 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    // قص الاسم إذا كان طويل عشان ديسكورد ما يكرش
    const safeName = p.name.length > 80 ? p.name.substring(0, 77) + "..." : p.name;
    currentRow.addComponents(
      new ButtonBuilder().setCustomId(`impv_vote_${p.id}`).setLabel(safeName).setStyle(ButtonStyle.Secondary)
    );
  });
  if (currentRow.components.length > 0) rows.push(currentRow);

  const msg = await channel.send({ embeds: [embed], components: rows });
  game.msgId = msg.id;

  // مؤقت 120 ثانية للتصويت
  game.timer = setTimeout(() => {
    if (activeGames.has(channel.id) && game.phase === "voting") {
      endImposterGame(channel, game);
    }
  }, 120000);
}

module.exports.handleVotingButtons = async function(i) {
  const game = activeGames.get(i.channelId);
  if (!game || game.phase !== "voting") return;

  const votedForId = i.customId.split("_")[2];
  const voter = game.players.find(p => p.id === i.user.id);

  if (!voter) return i.reply({ content: "أنت مو في اللعبة!", ephemeral: true });
  if (game.votedPlayers.has(i.user.id)) return i.reply({ content: "صوتّ مسبقاً!", ephemeral: true });

  const target = game.players.find(p => p.id === votedForId);
  target.votes += 1;
  game.votedPlayers.add(i.user.id);

  await i.reply({ content: `✅ تم تسجيل تصويتك لـ **${target.name}**`, ephemeral: true });

  // إذا الكل صوت، أنهي اللعبة فوراً
  if (game.votedPlayers.size === game.players.length) {
    if (game.timer) clearTimeout(game.timer);
    endImposterGame(i.channel, game);
  }
};

// ==========================================
// 6. نهاية اللعبة وإعلان الفائز
// ==========================================
async function endImposterGame(channel, game) {
  activeGames.delete(channel.id);

  // فرز أكثر شخص جاه تصويت
  const sortedPlayers = [...game.players].sort((a, b) => b.votes - a.votes);
  const highestVotes = sortedPlayers[0].votes;

  // التحقق من التعادل
  const topVoted = sortedPlayers.filter(p => p.votes === highestVotes);

  const embed = new EmbedBuilder().setTitle("🏁 نهاية اللعبة!").setColor("#22C55E");
  let description = "";

  const imposters = game.players.filter(p => p.role.includes('imposter'));
  const imposterNames = imposters.map(p => p.name).join(" و ");

  if (highestVotes === 0 || topVoted.length > 1) {
    description = `🤷‍♂️ **تعادل في الأصوات!** أو لم يصوت أحد.\n\n😈 **الإمبوستر كان:** ${imposterNames} ونجح في خداعكم!\n\n💸 الإمبوستر يفوز بالمكافأة!`;
    await distributePrizes(game, 'imposters');
    embed.setColor("#EF4444");
  } else {
    const kickedPlayer = topVoted[0];
    description = `🗳️ الأغلبية صوتت لطرد: **${kickedPlayer.name}** (${kickedPlayer.votes} أصوات)\n\n`;

    if (kickedPlayer.role.includes('imposter')) {
      description += `🎉 **كفووو!** صدتوه! ${kickedPlayer.name} فعلاً كان هو الإمبوستر!\n`;
      if (game.imposterCount === 2 && imposters.length > 1) {
        const otherImp = imposters.find(p => p.id !== kickedPlayer.id);
        description += `بس لحظة.. كان فيه إمبوستر ثاني وهو **${otherImp.name}**!\n`;
      }
      description += `\n💰 الفوز للاعبين الأصليين (Regulars)!`;
      await distributePrizes(game, 'regulars');
    } else {
      description += `🤦‍♂️ **ظلمتوه!** ${kickedPlayer.name} كان لاعب عادي!\n\n😈 **الإمبوستر الحقيقي هو:** ${imposterNames}\n\n💸 الإمبوستر نجح في التخفي ويفوز بالمكافأة!`;
      await distributePrizes(game, 'imposters');
      embed.setColor("#EF4444");
    }
  }

  // كشف الأسئلة
  description += `\n\n📜 **السؤال الأصلي:** ${game.regularQuestion}`;
  imposters.forEach((imp, i) => {
    description += `\n🕵️‍♂️ **سؤال إمبوستر ${i+1}:** ${imp.question}`;
  });

  embed.setDescription(description);
  await channel.send({ embeds: [embed] });
}

// دالة توزيع الجوائز
async function distributePrizes(game, winningTeam) {
  const amount = 20000; // جائزة الفوز 20 ألف
  const winners = game.players.filter(p => 
    (winningTeam === 'regulars' && p.role === 'regular') || 
    (winningTeam === 'imposters' && p.role.includes('imposter'))
  ).map(p => p.id);

  if (winners.length > 0) {
    await game.db.collection("users").updateMany(
      { userId: { $in: winners } },
      { $inc: { wallet: amount } }
    );
  }
}
