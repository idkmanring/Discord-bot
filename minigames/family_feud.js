// minigames/family_feud.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔴 استدعاء ملف الأسئلة المحلي
const feudQuestionsPool = require("../data/feud_questions.json");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const activeGames = new Map();
const activeLobbies = new Map();

// ==========================================
// 1. سحب السؤال من قاعدة البيانات (منع التكرار)
// ==========================================
async function getFeudData(db) {
  const collection = db.collection("feud_used_questions");
  
  // جلب الأسئلة التي تم لعبها
  const usedDocs = await collection.find({}).toArray();
  const usedQuestions = usedDocs.map(doc => doc.question);

  // فلترة الأسئلة المتوفرة
  let available = feudQuestionsPool.filter(item => !usedQuestions.includes(item.question));

  // إذا خلصت الأسئلة (300 سؤال)، نفرمت ونبدأ من جديد
  if (available.length === 0) {
    await collection.deleteMany({});
    available = feudQuestionsPool;
    console.log("♻️ تم إعادة تصفير أسئلة صراع العائلات (تم استخدامها بالكامل).");
  }

  // اختيار سؤال عشوائي
  const randomIndex = Math.floor(Math.random() * available.length);
  const chosenData = available[randomIndex];

  // تسجيل السؤال كـ "مستخدم"
  await collection.insertOne({ question: chosenData.question, usedAt: new Date() });

  // تجهيز الإجابات للعب (إضافة index و revealed)
  const preparedData = {
    question: chosenData.question,
    answers: chosenData.answers.map((a, i) => ({
      ...a,
      revealed: false,
      index: i + 1
    }))
  };

  return preparedData;
}

// ==========================================
// 2. الحكم الذكي (Gemini Validator) - نسخة متسامحة جداً + JSON Mode
// ==========================================
async function matchAnswer(guess, gameData) {
  // 1. تنظيف قوي جداً للإجابة (يوحد الحروف بالكامل)
  const clean = (str) => str.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').toLowerCase().trim();
  const cleanGuess = clean(guess);
  
  // 2. تحقق برمجي سريع جداً (التطابق التام أو التطابق الجزئي الواضح)
  for (let a of gameData.answers) {
    const cleanA = clean(a.text);
    if (cleanA === cleanGuess || (cleanA.includes(cleanGuess) && cleanGuess.length > 3) || (cleanGuess.includes(cleanA) && cleanA.length > 3)) {
      return a.index;
    }
  }

  // 3. التحقق الذكي باستخدام Gemini مع ميزة (JSON Mode) لمنع الهلوسة
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        temperature: 0.1, // دقيق جداً
        responseMimeType: "application/json" // إجباره على الرد ككود برمجي فقط
      } 
    });

    const optionsText = gameData.answers.map(a => `${a.index}- ${a.text}`).join("\n");
    
    const prompt = `أنت حكم "متسامح جداً" في لعبة صراع العائلات. وظيفتك مطابقة إجابة اللاعب مع الخيارات بناءً على "المعنى والمقصد" وليس التطابق الحرفي.

إجابة اللاعب هي: "${guess}"

الخيارات المتاحة هي:
${optionsText}

شروط التقييم الصارمة:
1. التسامح المطلق في المعنى: (مثال: "طعام صحي" أو "أكل دايت" = "أكل صحي")، ("اشتراك الجيم" أو "نادي" = "اشتراك نادي")، ("جزمة رياضية" أو "ملابس" = "حذاء رياضي"). إذا كان المعنى يندرج تحت نفس التصنيف، اعتبره صحيحاً.
2. مكافحة الغش: إذا كتب اللاعب عدة أفكار أو جمل منفصلة (مثال: أكل، نوم، لعب)، قم بتقييم "الفكرة الأولى فقط" وتجاهل الباقي. لا تقسم الجملة الواحدة (مثلاً "اشتراك نادي" تعتبر فكرة واحدة لا تقسمها).

أرجع النتيجة بصيغة JSON فقط بالتنسيق التالي:
{"match": رقم_الخيار}
(إذا لم تتطابق الإجابة أبداً، أرجع {"match": 0})`;
    
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise(resolve => setTimeout(() => resolve({ response: { text: () => '{"match": 0}' } }), 3000))
    ]);

    const jsonResponse = JSON.parse(result.response.text());
    
    if (jsonResponse && jsonResponse.match > 0 && jsonResponse.match <= gameData.answers.length) {
      return jsonResponse.match;
    }
  } catch (e) {
    console.error("Gemini Validator Error:", e);
  }

  return null;
}
// ==========================================
// دالة لتقسيم النص الطويل في اللوحة
// ==========================================
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  
  for(let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), x, startY + (i * lineHeight));
  }
}

// ==========================================
// 3. رسم اللوحة (Canvas) الفخمة والمريحة
// ==========================================
async function buildFeudImage(game) {
  const width = 900;
  const height = 650;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = "#0A192F";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 45px Cairo";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  wrapText(ctx, game.data.question, width / 2, 80, 800, 55);

  const boxW = 380;
  const boxH = 70;
  const gapX = 20;
  const gapY = 15;
  const startY = 180;
  const startXRight = width / 2 + gapX / 2; 
  const startXLeft = width / 2 - boxW - gapX / 2;

  for (let i = 0; i < game.data.answers.length; i++) {
    const ans = game.data.answers[i];
    const isRightCol = i < 3;
    const row = i % 3;
    
    const x = isRightCol ? startXRight : startXLeft;
    const y = startY + row * (boxH + gapY);

    ctx.fillStyle = "#1E293B";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.fillStyle = "#FFFFFF";
    if (ans.revealed) {
      ctx.font = "bold 30px Cairo";
      ctx.textAlign = "right";
      ctx.fillText(ans.text, x + boxW - 20, y + boxH / 2 + 5);
      
      ctx.fillStyle = "#2563EB"; 
      ctx.fillRect(x + 10, y + 5, 70, boxH - 10);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = "bold 32px Arial";
      ctx.fillText(ans.points * game.multiplier, x + 45, y + boxH / 2 + 5);
    } else {
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.fillText((i + 1).toString(), x + boxW / 2, y + boxH / 2 + 5);
    }
  }

  if (game.strikes > 0) {
    ctx.fillStyle = "#EF4444";
    ctx.font = "bold 65px Arial";
    ctx.textAlign = "center";
    const strikesText = "X ".repeat(game.strikes).trim();
    ctx.fillText(strikesText, width / 2, height - 120);
  }

  ctx.font = "bold 35px Cairo";
  
  ctx.fillStyle = "#22C55E"; 
  ctx.textAlign = "right";
  ctx.fillText(`الفريق الأخضر: ${game.scores.green}`, width - 30, height - 40);

  ctx.fillStyle = "#EF4444";
  ctx.textAlign = "left";
  ctx.fillText(`الفريق الأحمر: ${game.scores.red}`, 30, height - 40);

  return canvas.toBuffer("image/png");
}

async function renderGameState(channel, game, customMessage = null) {
  const imgBuffer = await buildFeudImage(game);
  const attachment = new AttachmentBuilder(imgBuffer, { name: "feud.png" });

  let displayMsg = customMessage;
  if (!displayMsg) {
    if (game.currentPhase === "play" || game.currentPhase === "steal") {
      displayMsg = `🎯 **الجولة ${game.round}** | الدور على: <@${game.currentPlayer}>`;
    } else {
      displayMsg = `🎯 **الجولة ${game.round}**`;
    }
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`feud_quit_${game.id}`).setLabel("انسحاب").setStyle(ButtonStyle.Danger).setEmoji("🚪")
  );

  if (game.currentPhase === "decision") {
    row.addComponents(
      new ButtonBuilder().setCustomId(`feud_play_${game.id}`).setLabel("العب السؤال").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`feud_pass_${game.id}`).setLabel("ورط الفريق الثاني").setStyle(ButtonStyle.Secondary)
    );
  }

  const payload = { content: displayMsg, files: [attachment], components: [row] };

  if (game.msgId) {
    try {
      const oldMsg = await channel.messages.fetch(game.msgId);
      await oldMsg.delete().catch(()=>{}); 
    } catch(e) {}
  }
  
  const newMsg = await channel.send(payload);
  game.msgId = newMsg.id;
}

// ==========================================
// 4. إدارة اللوبي
// ==========================================
module.exports.startFeudLobby = async function(interaction, db) {
  const lobbyId = interaction.id;
  
  const lobby = {
    id: lobbyId,
    host: interaction.user.id,
    green: new Map(),
    red: new Map(),
    msgId: null,
    db: db
  };
  activeLobbies.set(interaction.channelId, lobby);

  const embed = new EmbedBuilder()
    .setTitle("👨‍👩‍👧‍👦 لوبي صراع العائلات (2 إلى 8 لاعبين)")
    .setColor("#001460")
    .setDescription("اضغط على لون الفريق الذي ترغب بالانضمام إليه!");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`fl_join_green_${lobbyId}`).setLabel("الفريق الأخضر").setStyle(ButtonStyle.Success).setEmoji("🟢"),
    new ButtonBuilder().setCustomId(`fl_join_red_${lobbyId}`).setLabel("الفريق الأحمر").setStyle(ButtonStyle.Danger).setEmoji("🔴"),
    new ButtonBuilder().setCustomId(`fl_start_${lobbyId}`).setLabel("بدء اللعبة").setStyle(ButtonStyle.Primary).setEmoji("🚀"),
    new ButtonBuilder().setCustomId(`fl_cancel_${lobbyId}`).setLabel("إلغاء").setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
  const msg = await interaction.fetchReply();
  lobby.msgId = msg.id;
};

module.exports.handleFeudLobbyButtons = async function(i, db) {
  const lobby = activeLobbies.get(i.channelId);
  if (!lobby) return i.reply({ content: "❌ اللوبي مغلق أو بدأ.", ephemeral: true });

  const parts = i.customId.split("_");
  const action = parts[1] + (parts[2] && !parts[2].match(/^\d+$/) ? "_" + parts[2] : ""); 

  if (action === "cancel") {
    if (i.user.id !== lobby.host) return i.reply({ content: "❌ الهوست فقط يمكنه الإلغاء.", ephemeral: true });
    activeLobbies.delete(i.channelId);
    return i.update({ content: "تم إلغاء اللعبة.", embeds: [], components: [] });
  }

  if (action === "join_green" || action === "join_red") {
    lobby.green.delete(i.user.id);
    lobby.red.delete(i.user.id);
    
    if (action === "join_green") lobby.green.set(i.user.id, i.user.username);
    else lobby.red.set(i.user.id, i.user.username);

    const embed = new EmbedBuilder()
      .setTitle("👨‍👩‍👧‍👦 لوبي صراع العائلات")
      .setColor("#001460")
      .addFields(
        { name: `🟢 الأخضر (${lobby.green.size})`, value: Array.from(lobby.green.values()).join("\n") || "فارغ", inline: true },
        { name: `🔴 الأحمر (${lobby.red.size})`, value: Array.from(lobby.red.values()).join("\n") || "فارغ", inline: true }
      );
    
    return i.update({ embeds: [embed] });
  }

  if (action === "start") {
    if (i.user.id !== lobby.host) return i.reply({ content: "❌ الهوست فقط يطلق اللعبة.", ephemeral: true });
    if (lobby.green.size === 0 || lobby.red.size === 0) return i.reply({ content: "❌ لازم يكون فيه لاعبين على الأقل بكل فريق!", ephemeral: true });
    
    const totalPlayers = lobby.green.size + lobby.red.size;
    if (totalPlayers < 2 || totalPlayers > 8) return i.reply({ content: "❌ عدد اللاعبين يجب أن يكون بين 2 و 8.", ephemeral: true });

    activeLobbies.delete(i.channelId);
    await i.update({ content: "⏳ جاري سحب السؤال من قاعدة البيانات...", embeds: [], components: [] });
    
    startFeudGame(i.channel, lobby, db);
  }
};

// ==========================================
// 5. محرك اللعبة الأساسي
// ==========================================
async function startFeudGame(channel, lobby, db) {
  const game = {
    id: lobby.id,
    channelId: channel.id,
    db: db,
    round: 1,
    multiplier: 1,
    scores: { green: 0, red: 0 },
    teams: {
      green: Array.from(lobby.green.keys()),
      red: Array.from(lobby.red.keys())
    },
    turnIndex: { green: 0, red: 0 },
    data: null,
    pot: 0,
    strikes: 0,
    currentPhase: "init",
    faceoffPlayers: { green: null, red: null },
    playingTeam: null,
    currentPlayer: null,
    msgId: null,
    isProcessing: false
  };

  activeGames.set(channel.id, game);
  await startRound(channel, game);
}

async function startRound(channel, game) {
  if (game.round > 3) return endGame(channel, game);

  game.multiplier = game.round === 3 ? 3 : game.round === 2 ? 2 : 1;
  game.pot = 0;
  game.strikes = 0;
  game.currentPhase = "faceoff";
  
  // سحب السؤال من قاعدة البيانات
  game.data = await getFeudData(game.db);

  game.faceoffPlayers.green = game.teams.green[Math.floor(Math.random() * game.teams.green.length)];
  game.faceoffPlayers.red = game.teams.red[Math.floor(Math.random() * game.teams.red.length)];

  await renderGameState(channel, game, `🔥 **مواجهة البداية!** الأسرع يحدد مصير فريقه.\nالمطلوبين للإجابة: 🟢 <@${game.faceoffPlayers.green}> ضد 🔴 <@${game.faceoffPlayers.red}>`);
}

module.exports.handleFeudMessages = async function(msg, db) {
  const game = activeGames.get(msg.channel.id);
  if (!game || game.isProcessing || msg.author.bot) return;

  // 🔴 الحماية السحرية: تجاهل أي كلام ينكتب في الشات إذا كان الطور يتطلب ضغط زر فقط!
  if (game.currentPhase === "decision" || game.currentPhase === "init") return;

  if (game.currentPhase === "faceoff" && msg.author.id !== game.faceoffPlayers.green && msg.author.id !== game.faceoffPlayers.red) return;
  if (game.currentPhase === "play" && msg.author.id !== game.currentPlayer) return;
  if (game.currentPhase === "steal" && msg.author.id !== game.currentPlayer) return; 

  const text = msg.content.trim();
  game.isProcessing = true; // قفل الباب عشان ما يصير تداخل

  // حذف الرسالة للترتيب
  setTimeout(() => msg.delete().catch(() => {}), 3000);

  try {
    // --- طور المواجهة (Faceoff) ---
    if (game.currentPhase === "faceoff") {
      const matchIndex = await matchAnswer(text, game.data);
      
      if (matchIndex) {
        const answer = game.data.answers[matchIndex - 1];
        if (!answer.revealed) {
          answer.revealed = true;
          game.pot += (answer.points * game.multiplier);
          await msg.react("✅").catch(()=>{});
          
          game.currentPhase = "decision";
          game.playingTeam = game.teams.green.includes(msg.author.id) ? "green" : "red";
          game.decisionMaker = msg.author.id;
          
          await renderGameState(msg.channel, game, `👏 صح عليك يا <@${msg.author.id}>!\nتلعبون وتكملون اللوحة، ولا تورطونهم؟ (اختر من الأزرار)`);
        } else {
          await msg.react("🔄").catch(()=>{});
        }
      } else {
        await msg.react("❌").catch(()=>{});
      }
    }

    // --- طور اللعب العادي (Play) ---
    else if (game.currentPhase === "play") {
      const matchIndex = await matchAnswer(text, game.data);

      if (matchIndex) {
        const answer = game.data.answers[matchIndex - 1];
        if (!answer.revealed) {
          answer.revealed = true;
          game.pot += (answer.points * game.multiplier);
          await msg.react("✅").catch(()=>{});

          if (game.data.answers.every(a => a.revealed)) {
            game.scores[game.playingTeam] += game.pot;
            await renderGameState(msg.channel, game, `🎉 **اللوحة كاملة!** الفريق ${game.playingTeam === 'green' ? 'الأخضر 🟢' : 'الأحمر 🔴'} يفوز بالنقاط!`);
            setTimeout(() => { game.round++; startRound(msg.channel, game); }, 5000);
            game.isProcessing = false;
            return;
          }

          nextTurn(game);
          await renderGameState(msg.channel, game);
        } else {
          await msg.react("🔄").catch(()=>{});
        }
      } else {
        game.strikes++;
        await msg.react("❌").catch(()=>{});

        if (game.strikes >= 3) {
          game.currentPhase = "steal";
          game.playingTeam = game.playingTeam === "green" ? "red" : "green"; 
          game.currentPlayer = game.teams[game.playingTeam][0];
          await renderGameState(msg.channel, game, `🚨 **ثلاث أخطاء (X X X)!**\nفرصة للسرقة للفريق ${game.playingTeam === 'green' ? 'الأخضر🟢' : 'الأحمر🔴'}!\n<@${game.currentPlayer}> هو ممثل الفريق، عطنا إجابتكم الحاسمة!`);
        } else {
          nextTurn(game);
          await renderGameState(msg.channel, game);
        }
      }
    }

    // --- طور السرقة (Steal) ---
    else if (game.currentPhase === "steal") {
      const matchIndex = await matchAnswer(text, game.data);

      if (matchIndex && !game.data.answers[matchIndex - 1].revealed) {
        game.data.answers[matchIndex - 1].revealed = true;
        game.pot += (game.data.answers[matchIndex - 1].points * game.multiplier);
        game.scores[game.playingTeam] += game.pot;
        await msg.react("😈").catch(()=>{});
        await renderGameState(msg.channel, game, `😈 **سرقة ناجحة!** الفريق ${game.playingTeam === 'green' ? 'الأخضر 🟢' : 'الأحمر 🔴'} يسرق النقاط!`);
      } else {
        await msg.react("❌").catch(()=>{});
        const originalTeam = game.playingTeam === "green" ? "red" : "green";
        game.scores[originalTeam] += game.pot;
        await renderGameState(msg.channel, game, `🛡️ **فشلت السرقة!** النقاط ترجع للفريق ${originalTeam === 'green' ? 'الأخضر 🟢' : 'الأحمر 🔴'}.`);
      }

      game.data.answers.forEach(a => a.revealed = true);
      setTimeout(async () => {
        await renderGameState(msg.channel, game, `👀 هذي كانت الإجابات الناقصة! ننتقل للجولة القادمة...`);
        setTimeout(() => { game.round++; startRound(msg.channel, game); }, 5000);
      }, 4000);
    }
  } catch (error) {
    console.error("Error processing feud message:", error);
  } finally {
    // 🔴 نضمن 100% إن الباب ينفتح مره ثانية مهما صار
    game.isProcessing = false;
  }
};

function nextTurn(game) {
  const teamArray = game.teams[game.playingTeam];
  let idx = game.turnIndex[game.playingTeam];
  idx = (idx + 1) % teamArray.length;
  game.turnIndex[game.playingTeam] = idx;
  game.currentPlayer = teamArray[idx];
}

module.exports.handleFeudActionButtons = async function(i) {
  const game = activeGames.get(i.channelId);
  if (!game) return i.reply({ content: "لا توجد لعبة نشطة.", ephemeral: true });

  const parts = i.customId.split("_");
  const action = parts[1];
  
  if (action === "quit") {
    game.teams.green = game.teams.green.filter(id => id !== i.user.id);
    game.teams.red = game.teams.red.filter(id => id !== i.user.id);
    await i.reply({ content: `🚪 <@${i.user.id}> انسحب!` });
    
    if (game.teams.green.length === 0) {
      endGame(i.channel, game, "🔴 الأحمر فاز بسبب انسحاب الأخضر بالكامل!");
    } else if (game.teams.red.length === 0) {
      endGame(i.channel, game, "🟢 الأخضر فاز بسبب انسحاب الأحمر بالكامل!");
    }
    return;
  }

  if (game.currentPhase === "decision") {
    if (i.user.id !== game.decisionMaker) return i.reply({ content: "❌ القرار مو بيدك!", ephemeral: true });
    
    if (action === "play") {
      game.currentPhase = "play";
    } else if (action === "pass") {
      game.currentPhase = "play";
      game.playingTeam = game.playingTeam === "green" ? "red" : "green";
    }
    
    nextTurn(game);
    await i.update({ components: [] }); 
    await renderGameState(i.channel, game);
  }
};

async function endGame(channel, game, forcedMsg = null) {
  activeGames.delete(channel.id);
  const winner = game.scores.green > game.scores.red ? "الفريق الأخضر 🟢" : game.scores.red > game.scores.green ? "الفريق الأحمر 🔴" : "تعادل 🤝";
  
  // توزيع الجوائز
  if (game.scores.green > 0) {
    await game.db.collection("users").updateMany({ userId: { $in: game.teams.green } }, { $inc: { wallet: game.scores.green } });
  }
  if (game.scores.red > 0) {
    await game.db.collection("users").updateMany({ userId: { $in: game.teams.red } }, { $inc: { wallet: game.scores.red } });
  }

  const embed = new EmbedBuilder()
    .setTitle("🏆 نهاية صراع العائلات!")
    .setColor("#FFD700")
    .setDescription(forcedMsg || `انتهت الـ 3 جولات الطاحنة!\n\nالفائز: **${winner}**!\n💰 تم تحويل النقاط إلى رصيد اللاعبين المشاركين.`)
    .addFields(
      { name: "🟢 الأخضر", value: `${game.scores.green} نقطة`, inline: true },
      { name: "🔴 الأحمر", value: `${game.scores.red} نقطة`, inline: true }
    );

  await channel.send({ embeds: [embed] });
}

module.exports.hasActiveFeud = (channelId) => {
  return activeGames.has(channelId);
};