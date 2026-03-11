const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const activeHarfGames = {}; // كل اللوبيات والجولات شغالة هنا

function startHarfGame(channelId) {
  // حماية: لو فيه لعبة بنفس القناة لا تبدأ جديد
  if (activeHarfGames[channelId]) return;

  activeHarfGames[channelId] = {
    state: "lobby", // أو "playing"
    players: [],
    hostId: null,
    messageId: null,
    letters: [],
    round: 0,
    turn: 0,
    timer: null,
    playerHands: {},
    history: [],
    votes: null,
  };
}

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
    const alreadyJoined = game.players.find(p => p.id === userId);
    if (alreadyJoined) {
      return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> أنت بالفعل في اللوبي.", ephemeral: true });
    }

    if (game.players.length >= 4) {
      return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> اللوبي ممتلئ.", ephemeral: true });
    }

    game.players.push({ id: userId, username: interaction.user.username });
    if (!game.hostId) game.hostId = userId;
    await updateHarfLobbyMessage(interaction);
    return interaction.deferUpdate();
  }

  if (interaction.customId === "harf_leave") {
    const index = game.players.findIndex(p => p.id === userId);
    if (index === -1) {
      return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> أنت لست في اللوبي.", ephemeral: true });
    }

    game.players.splice(index, 1);
    if (game.players.length === 0) {
      delete activeHarfGames[interaction.channel.id];
      return interaction.message.delete().catch(() => {});
    }

    await updateHarfLobbyMessage(interaction);
    return interaction.deferUpdate();
  }

  if (interaction.customId === "harf_start") {
    // السماح لأي لاعب بالبدء طالما العدد بين [2..4]
    if (game.players.length < 2) {
      return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> تحتاج على الأقل إلى لاعبين.", ephemeral: true });
    }
    if (game.players.length > 4) {
      return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> الحد الأقصى 4 لاعبين.", ephemeral: true });
    }

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

  // توليد الحروف الأساسية
  const baseLetters = [];
  while (baseLetters.length < 3) {
    const l = getRandomArabicLetter();
    if (!baseLetters.includes(l)) baseLetters.push(l);
  }
  game.letters = baseLetters;

  // توزيع الحروف على كل لاعب
  game.players.forEach(p => {
    game.playerHands[p.id] = generatePlayerHand();
  });

  // اختيار الدور الأول عشوائياً
  game.turn = Math.floor(Math.random() * game.players.length);
  game.round = 1;

  // حذف رسالة اللوبي
  const msg = await channel.messages.fetch(game.messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});

  await showHarfTurn(channel);
}

async function showHarfTurn(channel) {
  const game = activeHarfGames[channel.id];
  if (!game) return;

  const currentPlayer = game.players[game.turn];
  const currentId = currentPlayer.id;
  const baseLetters = game.letters;

  // أزرار الحروف الأساسية بالعكس (عرض فقط) مع الحفاظ على الفهارس كما هي
  const baseRow = new ActionRowBuilder();
  for (let i = baseLetters.length - 1; i >= 0; i--) {
    baseRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`harf_base_${i}`)
        .setLabel(baseLetters[i])
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );
  }

  baseRow.addComponents(
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

  const embed = new EmbedBuilder()
    .setTitle(`✏️ دور ${currentPlayer.username}`)
    .setDescription(`🎯 كون كلمة ثلاثية من الحروف الموجودة.

🧱 الحروف الأساسية: **${baseLetters.join(" ")}**
🧩 حروفك: **${playerHand.join(" ")}**
⏳ لديك 60 ثانية لاتخاذ القرار.`)
    .setColor("#3498db");

  const msg = await channel.send({
    content: `🎮 <@${currentId}> دورك الآن`,
    embeds: [embed],
    components: [baseRow, ...handRows]
  });

  game.messageId = msg.id;

  // بدء مؤقت الدقيقة
  if (game.timer) clearTimeout(game.timer);
  game.timer = setTimeout(() => {
    handleHarfTimeout(channel);
  }, 60 * 1000);
}

const fs = require("fs");
const path = require("path");

const dictionary = new Set(fs.readFileSync(path.join(__dirname, "dictionary.txt"), "utf8").split("\n").map(w => w.trim()).filter(Boolean));

async function handleHarfInteraction(interaction) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game || game.state !== "playing") return;

  // السماح لأزرار التصويت بالمرور بدون رسالة "ليس دورك!"
  if (interaction.customId.startsWith("harf_vote_")) {
    return; // سيُعالج من handleVote
  }

  const userId = interaction.user.id;
  const currentPlayer = game.players[game.turn];
  if (userId !== currentPlayer.id) {
    return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> ليس دورك!", ephemeral: true });
  }

  // الضغط على حرف من اليد
  if (interaction.customId.startsWith("harf_play_")) {
    const letter = interaction.customId.split("_")[2];
    game.selection = letter;
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);

    if (msg) {
      // عند اختيار حرف اليد، فعّل الحروف الأساسية (بعكس العرض أيضاً)
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

    return interaction.reply({ content: `<:icons8correct1002:1415979896433278986> اخترت الحرف **${letter}**، الآن اختر أي حرف أساسي لتبديله.`, ephemeral: true });
  }

  // زر الانسحاب أثناء اللعب
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

  // الضغط على حرف أساسي لتبديله
  if (interaction.customId.startsWith("harf_base_")) {
    if (!game.selection) {
      return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> اختر حرف من حروفك أولًا.", ephemeral: true });
    }

    const baseIndex = parseInt(interaction.customId.split("_")[2]);
    const oldLetter = game.letters[baseIndex];
    const newLetter = game.selection;
    const trialWord = [...game.letters];
    trialWord[baseIndex] = newLetter;
    const word = trialWord.join("");

    const hand = game.playerHands[userId];
    const handIndex = hand.indexOf(newLetter);
    if (handIndex === -1) return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> حدث خطأ، الحرف غير موجود في يدك.", ephemeral: true });

    game.selection = null;

    if (dictionary.has(word)) {
      // <:icons8correct1002:1415979896433278986> الكلمة موجودة
      game.letters[baseIndex] = newLetter;
      hand.splice(handIndex, 1); // نحذف الحرف من يد اللاعب

      // انهاء الدور
      clearTimeout(game.timer);
      game.turn = (game.turn + 1) % game.players.length;

      // فائز؟
      if (hand.length === 0) {
        delete activeHarfGames[interaction.channel.id];
        return interaction.channel.send(`🏆 <@${userId}> فاز في اللعبة!`);
      }

      // حذف رسالة الدور السابق
      const msg = await interaction.channel.messages.fetch(game.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});

      return showHarfTurn(interaction.channel);
    } else {
      return startVotingOnInvalidWord(interaction, word, baseIndex, newLetter);
    }
  }
}

async function startVotingOnInvalidWord(interaction, word, baseIndex, newLetter) {
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
    .setDescription(`🗳️ <@${userId}> اقترح الكلمة: **${word}**

<:icons8correct1002:1415979896433278986> إذا كانت الكلمة منطقية وافقوا عليها.
<:icons8wrong1001:1415979909825695914> إذا لا، ارفضوها.

عدد المصوتين: ${voters.length}`)
    .setColor("#e67e22");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("harf_vote_yes").setLabel(" اوافق").setStyle(ButtonStyle.Success).setEmoji("1415979896433278986"),
    new ButtonBuilder().setCustomId("harf_vote_no").setLabel(" أرفض").setStyle(ButtonStyle.Danger).setEmoji("1415979909825695914")
  );

  const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
  voteData.messageId = msg.id;

  voteData.timeout = setTimeout(() => finishVote(interaction.channel), 30000); // 30 ثانية فقط
}

async function handleVote(interaction) {
  const game = activeHarfGames[interaction.channel.id];
  if (!game || !game.votes) return;

  const voteData = game.votes;
  const userId = interaction.user.id;

  if (userId === voteData.by) {
    return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> لا يمكنك التصويت على كلمتك.", ephemeral: true });
  }

  if (voteData.votes[userId]) {
    return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> لقد صوتت مسبقًا.", ephemeral: true });
  }

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

  const { votes, baseIndex, newLetter, by } = game.votes;
  const yes = Object.values(votes).filter(v => v === "yes").length;
  const no = Object.values(votes).filter(v => v === "no").length;

  const hand = game.playerHands[by];

  const resultMessage = yes > no
    ? `<:icons8correct1002:1415979896433278986> تم قبول الكلمة بأغلبية (${yes} مقابل ${no})`
    : `<:icons8wrong1001:1415979909825695914> تم رفض الكلمة (${yes} مقابل ${no})`;

  const resultMsg = await channel.send(resultMessage);
  setTimeout(() => resultMsg.delete().catch(() => {}), 5000);
  
  const voteMsg = await channel.messages.fetch(game.votes.messageId).catch(() => null);
  if (voteMsg) await voteMsg.delete().catch(() => {});

  if (yes > no) {
    game.letters[baseIndex] = newLetter;
    const index = hand.indexOf(newLetter);
    if (index !== -1) hand.splice(index, 1);
  } else {
    const newL = getRandomArabicLetter();
    if (!hand.includes(newL)) hand.push(newL);
  }

  clearTimeout(game.timer);
  game.turn = (game.turn + 1) % game.players.length;
  game.votes = null;

  // حذف رسالة الدور السابق
  const msg = await channel.messages.fetch(game.messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});

  // فوز؟
  if (hand.length === 0) {
    delete activeHarfGames[channel.id];
    return channel.send(`🏆 <@${by}> فاز في اللعبة!`);
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

  // حذف رسالة الدور السابق
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
