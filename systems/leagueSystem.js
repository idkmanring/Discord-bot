const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");

const LeagueTournament = require("../models/LeagueTournament");
const LeagueTeam = require("../models/LeagueTeam");
const LeagueMatch = require("../models/LeagueMatch");
const LeagueBet = require("../models/LeagueBet");

const ADMIN_ID = process.env.LEAGUE_ADMIN_ID || "532264405476573224";
const LEAGUE_CHANNEL_ID = process.env.LEAGUE_CHANNEL_ID || "1502480106994532553";
const LEAGUE_RESULTS_CHANNEL_ID = process.env.LEAGUE_RESULTS_CHANNEL_ID || LEAGUE_CHANNEL_ID;
const LEAGUE_MATCH_CHANNEL_ID = process.env.LEAGUE_MATCH_CHANNEL_ID || LEAGUE_RESULTS_CHANNEL_ID;
const READY_TIMEOUT_MS = 5 * 60 * 1000;

const LEAGUE_GAMES = [
  "اونو",
  "انسان جماد",
  "كود نيمز",
  "حروف مع عزيز",
  "سين جيم",
];

const LEAGUE_GAME_LINKS = {
  "اونو": "https://scuffeduno.online/menu/room",
  "انسان جماد": "https://insan-jamad.com/public-rooms",
  "كود نيمز": "https://codenames.game/r/fonav-rirad",
  "حروف مع عزيز": "https://buzzin.live/",
  "سين جيم": "https://seenjeemkw.com/",
};

const COLORS = {
  bg: "#071117",
  panel: "#0d1b22",
  panel2: "#102834",
  line: "#24414d",
  gold: "#f4c95d",
  green: "#44c27a",
  red: "#e85d68",
  yellow: "#e7c44f",
  gray: "#65747c",
  text: "#eef8fb",
  muted: "#9db2bb",
  blue: "#60a5fa",
};

const TEAM_PALETTE = [
  "#f4c95d",
  "#44c27a",
  "#60a5fa",
  "#e85d68",
  "#b38cff",
  "#42d9c8",
  "#ff9f6e",
  "#d7e768",
];

const swapRequests = new Map();
const gameApprovalRequests = new Map();
const readyIntervals = new Set();

try {
  const cairoPath = path.join(__dirname, "..", "assets", "fonts", "Cairo-Regular.ttf");
  if (fs.existsSync(cairoPath)) GlobalFonts.registerFromPath(cairoPath, "Cairo");
} catch (err) {
  console.warn("League font registration failed:", err.message);
}

function setupLeagueSystem(client) {
  client.on("messageCreate", async (message) => {
    try {
      if (message.author?.bot) return;
      const text = String(message.content || "").trim();
      if (text !== "!دوري" && text !== "دوري") return;
      await handleLeagueCommand(client, message);
    } catch (err) {
      console.error("League command error:", err);
      message.reply("صار خطأ أثناء تجهيز الدوري.").catch(() => {});
    }
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      const id = interaction.customId || "";
      if (!id.startsWith("league:")) return;
      await handleLeagueInteraction(client, interaction);
    } catch (err) {
      console.error("League interaction error:", err);
      await replyPrivate(interaction, "صار خطأ غير متوقع في نظام الدوري.").catch(() => {});
    }
  });

  const interval = setInterval(() => {
    postponeExpiredReadyChecks(client).catch((err) => console.error("League ready scan error:", err));
  }, 60 * 1000);
  interval.unref?.();
  readyIntervals.add(interval);
}

async function handleLeagueCommand(client, message) {
  if (!message.guild) return message.reply("أمر الدوري يعمل داخل السيرفر فقط.");
  await waitForMongoose();

  const guildId = message.guild.id;
  const activeTournament = await LeagueTournament.findOne({ guildId, status: "active" }).sort({ startedAt: -1 });

  if (activeTournament) {
    // ---- إضافة نظام المزامنة للفرق المضافة يدوياً ----
    const addedMatchesCount = await syncMissingMatches(activeTournament._id);
    
    await refreshStandingsMessage(client, activeTournament._id, message.author.id);
    const standingsChannelId = activeTournament.standingsChannelId || LEAGUE_RESULTS_CHANNEL_ID;
    
    let replyMsg = `جدول الدوري موجود هنا: <#${standingsChannelId}>`;
    if (addedMatchesCount > 0) {
      replyMsg += `\n*(تم اكتشاف فرق جديدة بالمونقو وإضافة ${addedMatchesCount} مباراة لهم تلقائياً! 🔄)*`;
    }

    if (message.channel.id !== standingsChannelId || addedMatchesCount > 0) {
      await message.reply(replyMsg).catch(() => {});
    }
    return;
  }

  let tournament = await LeagueTournament.findOne({ guildId, status: "registration" }).sort({ createdAt: -1 });
  if (!tournament) {
    tournament = await LeagueTournament.create({
      guildId,
      name: "دوري درب التبانة",
      createdBy: message.author.id,
      registrationChannelId: LEAGUE_CHANNEL_ID,
    });
  }

  await refreshRegistrationMessage(client, tournament._id);
  if (message.channel.id !== LEAGUE_CHANNEL_ID) {
    await message.reply(`فتحت تسجيل الدوري هنا: <#${LEAGUE_CHANNEL_ID}>`).catch(() => {});
  }
}

async function handleLeagueInteraction(client, interaction) {
  const parts = String(interaction.customId || "").split(":");
  const action = parts[1];

  if (interaction.isButton?.()) {
    if (action === "join") return handleJoin(client, interaction, parts[2]);
    if (action === "leave") return handleLeave(client, interaction, parts[2]);
    if (action === "start") return handleStartTournament(client, interaction, parts[2]);
    if (action === "my_matches") return handleMyMatches(interaction, parts[2]);
    if (action === "team") return handleMyTeam(interaction, parts[2]);
    if (action === "rename") return handleRenameButton(interaction, parts[2]);
    if (action === "start_match") return handleStartMatchButton(interaction, parts[2]);
    if (action === "ready") return handleReady(client, interaction, parts[2]);
    if (action === "postpone") return handlePostpone(client, interaction, parts[2]);
    if (action === "game_random") return handleRandomGame(client, interaction, parts[2]);
    if (action === "game_agree") return handleCustomGameVote(client, interaction, parts[2]);
    if (action === "game_confirm") return handleGameConfirm(client, interaction, parts[2], parts[3], parts[4]);
    if (action === "admin_result") return handleAdminResult(client, interaction, parts[2], parts[3]);
    if (action === "bet") return handleBetButton(interaction, parts[2], Number(parts[3]));
    if (action === "swap_vote") return handleSwapVote(client, interaction, parts[2], parts[3]);
  }

  if (interaction.isStringSelectMenu?.()) {
    if (action === "replace_pick") return handleReplacePick(client, interaction, parts[2]);
    if (action === "start_match_pick") return handleStartMatchPick(client, interaction, parts[2]);
    if (action === "game_pick") return handleGamePick(client, interaction, parts[2]);
  }

  if (interaction.isModalSubmit?.()) {
    if (action === "rename_modal") return handleRenameModal(client, interaction, parts[2]);
    if (action === "bet_modal") return handleBetModal(client, interaction, parts[2], Number(parts[3]));
  }
}

async function handleJoin(client, interaction, tournamentId) {
  await waitForMongoose();
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "registration") {
    return replyPrivate(interaction, "التسجيل مقفل حاليًا.");
  }

  // --- التعديل هنا: منع المشاركة أكثر من مرة ---
  if (tournament.participants.some(p => p.userId === interaction.user.id)) {
    return replyPrivate(interaction, "أنت مسجل في الدوري بالفعل! لا يمكنك المشاركة أكثر من مرة.");
  }
  // ------------------------------------------

  const participant = makeParticipant(interaction, tournament);
  await LeagueTournament.updateOne(
    { _id: tournament._id, status: "registration" },
    { $push: { participants: participant } }
  );

  await interaction.deferUpdate().catch(() => {});
  await refreshRegistrationMessage(client, tournament._id);
}

async function handleLeave(client, interaction, tournamentId) {
  await waitForMongoose();
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "registration") {
    return replyPrivate(interaction, "الانسحاب متاح قبل بداية الدوري فقط.");
  }

  if (!tournament.participants.some((p) => p.userId === interaction.user.id)) {
    return replyPrivate(interaction, "أنت غير مسجل في الدوري.");
  }

  const participants = [...tournament.participants].map((p) => p.toObject ? p.toObject() : p);
  const removeIndex = participants.map((p) => p.userId).lastIndexOf(interaction.user.id);
  if (removeIndex >= 0) participants.splice(removeIndex, 1);

  await LeagueTournament.updateOne(
    { _id: tournament._id, status: "registration" },
    { $set: { participants } }
  );

  await interaction.deferUpdate().catch(() => {});
  await refreshRegistrationMessage(client, tournament._id);
}

async function handleStartTournament(client, interaction, tournamentId) {
  await waitForMongoose();
  if (interaction.user.id !== ADMIN_ID) {
    return replyPrivate(interaction, "ما عندك صلاحية تبدأ الدوري.");
  }

  await deferPrivate(interaction);
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "registration") {
    return editPrivate(interaction, "لا يوجد تسجيل مفتوح لهذا الدوري.");
  }

  if (tournament.participants.length < 4) {
    return editPrivate(interaction, "تحتاج 4 مشاركين على الأقل عشان يبدأ دوري 2v2.");
  }

  const participants = [...tournament.participants].map((p) => p.toObject ? p.toObject() : p);
  const reserveParticipants = [];
  if (participants.length % 2 === 1) reserveParticipants.push(participants.pop());

  const shuffled = shuffle(participants);
  const teams = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    teams.push({
      guildId: tournament.guildId,
      tournamentId: tournament._id,
      teamId: `team${teams.length + 1}`,
      members: [
        { userId: shuffled[i].userId, username: shuffled[i].username },
        { userId: shuffled[i + 1].userId, username: shuffled[i + 1].username },
      ],
    });
  }

  if (teams.length < 2) {
    return editPrivate(interaction, "عدد الفرق غير كافٍ بعد التقسيم.");
  }

  const now = new Date();
  const matches = [];
  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      matches.push({
        guildId: tournament.guildId,
        tournamentId: tournament._id,
        matchId: makeMatchId(matches.length),
        team1Id: teams[i].teamId,
        team2Id: teams[j].teamId,
        status: "pending",
        odds: { team1: 1.9, team2: 1.9 },
      });
    }
  }

  await LeagueTeam.deleteMany({ tournamentId: tournament._id });
  await LeagueMatch.deleteMany({ tournamentId: tournament._id });
  await LeagueBet.deleteMany({ tournamentId: tournament._id });
  await LeagueTeam.insertMany(teams);
  await LeagueMatch.insertMany(matches);

  await LeagueTournament.updateOne(
    { _id: tournament._id },
    {
      $set: {
        status: "active",
        startedBy: interaction.user.id,
        startedAt: now,
        standingsChannelId: LEAGUE_RESULTS_CHANNEL_ID,
        reserveParticipants,
      },
    }
  );

  await deleteRegistrationMessage(client, tournament);
  await refreshStandingsMessage(client, tournament._id, interaction.user.id);

  const reserveText = reserveParticipants.length
    ? `\nالاحتياط: <@${reserveParticipants[0].userId}> بسبب العدد الفردي.`
    : "";
  await editPrivate(interaction, `تم بدء الدوري: ${teams.length} فرق، ${matches.length} مباراة.${reserveText}`);
}

async function handleMyMatches(interaction, tournamentId) {
  await waitForMongoose();
  await deferPrivate(interaction);

  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return editPrivate(interaction, "لا يوجد دوري نشط.");
  }

  const userTeams = await findUserTeams(tournament._id, interaction.user.id);
  if (!userTeams.length) return editPrivate(interaction, "أنت لست ضمن أي فريق في هذا الدوري.");

  const teams = await LeagueTeam.find({ tournamentId: tournament._id }).lean();
  const teamIds = userTeams.map((team) => team.teamId);
  const matches = await LeagueMatch.find({
    tournamentId: tournament._id,
    $or: [{ team1Id: { $in: teamIds } }, { team2Id: { $in: teamIds } }],
  }).sort({ createdAt: 1 }).lean();

  const upcomingOrder = { active: 0, game_selection: 1, ready_check: 2, pending: 3, postponed: 4, finished: 9 };
  matches.sort((a, b) => (upcomingOrder[a.status] ?? 5) - (upcomingOrder[b.status] ?? 5));

  const attachment = new AttachmentBuilder(
    await renderMyMatchesCanvas(userTeams, matches, teams),
    { name: "league-my-matches.png" }
  );
  
  await editPrivate(interaction, {
    content: "**مبارياتك في الدوري**",
    files: [attachment],
  });
}

async function handleMyTeam(interaction, tournamentId) {
  await waitForMongoose();
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return replyPrivate(interaction, "لا يوجد دوري نشط.");
  }

  const userTeams = await findUserTeams(tournament._id, interaction.user.id);
  const team = userTeams[0];
  if (!team) return replyPrivate(interaction, "أنت لست ضمن أي فريق في هذا الدوري.");

  const teams = await LeagueTeam.find({ tournamentId: tournament._id }).lean();
  const matches = await LeagueMatch.find({ tournamentId: tournament._id }).lean();
  const playedLocked = await teamHasPlayed(tournament._id, team.teamId);
  const content = userTeams.map((currentTeam, index) => {
    const currentWinrate = getWinrate(currentTeam);
    return [
      `**${index + 1}. ${teamName(currentTeam)}**`,
      `الأعضاء: ${currentTeam.members.map((m) => `<@${m.userId}>`).join(" / ")}`,
      `النقاط: **${currentTeam.points}** | المباريات: **${currentTeam.played}** | نسبة الفوز: **${currentWinrate.toFixed(0)}%**`,
    ].join("\n");
  }).join("\n\n");

  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`league:rename:${tournament._id}`)
        .setLabel("تسمية")
        .setStyle(ButtonStyle.Primary)
    ),
  ];

  if (!playedLocked) {
    const replaceRow = buildReplaceSelect(tournament._id, team, teams, matches);
    if (replaceRow) rows.push(replaceRow);
  }

  await replyPrivate(interaction, { content, components: rows });
}

async function handleRenameButton(interaction, tournamentId) {
  await waitForMongoose();
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return replyPrivate(interaction, "لا يوجد دوري نشط.");
  }
  const team = await findUserTeam(tournament._id, interaction.user.id);
  if (!team) return replyPrivate(interaction, "أنت لست ضمن أي فريق.");

  const modal = new ModalBuilder()
    .setCustomId(`league:rename_modal:${tournament._id}`)
    .setTitle("تسمية الفريق");

  const input = new TextInputBuilder()
    .setCustomId("team_name")
    .setLabel("اسم الفريق")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(24)
    .setValue(team.customName || "");

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

async function handleRenameModal(client, interaction, tournamentId) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return editPrivate(interaction, "لا يوجد دوري نشط.");
  }

  const team = await findUserTeam(tournament._id, interaction.user.id);
  if (!team) return editPrivate(interaction, "أنت لست ضمن أي فريق.");

  const name = sanitizeTeamName(interaction.fields.getTextInputValue("team_name"));
  if (!name) return editPrivate(interaction, "اسم الفريق غير صالح. اكتب اسمًا واضحًا بدون منشنات أو روابط.");

  await LeagueTeam.updateOne({ _id: team._id }, { $set: { customName: name } });
  await refreshStandingsMessage(client, tournament._id, interaction.user.id);
  await editPrivate(interaction, `تم تغيير اسم فريقك إلى: **${name}**`);
}

async function handleReplacePick(client, interaction, tournamentId) {
  await waitForMongoose();
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return replyPrivate(interaction, "لا يوجد دوري نشط.");
  }

  const requesterTeam = await findUserTeam(tournament._id, interaction.user.id);
  if (!requesterTeam) return replyPrivate(interaction, "أنت لست ضمن أي فريق.");
  if (await teamHasPlayed(tournament._id, requesterTeam.teamId)) {
    return replyPrivate(interaction, "الاستبدال مقفل بعد لعب أي مباراة.");
  }

  const targetUserId = interaction.values?.[0];
  const targetTeam = await findUserTeam(tournament._id, targetUserId);
  if (!targetTeam) return replyPrivate(interaction, "اللاعب المختار ليس ضمن فريق.");
  if (targetTeam.teamId === requesterTeam.teamId) {
    return replyPrivate(interaction, "اختر لاعبًا من فريق آخر.");
  }
  if (await teamHasPlayed(tournament._id, targetTeam.teamId)) {
    return replyPrivate(interaction, "فريق اللاعب المختار لعب مباراة، لذلك لا يمكن الاستبدال.");
  }

  const requesterPartner = requesterTeam.members.find((m) => m.userId !== interaction.user.id);
  const targetMember = targetTeam.members.find((m) => m.userId === targetUserId);
  if (!requesterPartner || !targetMember) return replyPrivate(interaction, "تعذر تحديد أطراف الاستبدال.");

  const swapId = `s${Date.now().toString(36)}${Math.floor(Math.random() * 999)}`;
  const approverIds = targetTeam.members.map((m) => m.userId);
  const request = {
    tournamentId: String(tournament._id),
    requestTeamId: requesterTeam.teamId,
    targetTeamId: targetTeam.teamId,
    requesterId: interaction.user.id,
    requesterPartnerId: requesterPartner.userId,
    targetUserId,
    approverIds,
    yesVotes: new Set(),
    timeout: null,
  };
  swapRequests.set(swapId, request);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:swap_vote:${swapId}:yes`)
      .setLabel("موافق")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`league:swap_vote:${swapId}:no`)
      .setLabel("رفض")
      .setStyle(ButtonStyle.Danger)
  );

  const msg = await interaction.channel.send({
    content: [
      `${approverIds.map((id) => `<@${id}>`).join(" ")}`,
      `طلب استبدال من <@${interaction.user.id}>:`,
      `ينتقل <@${targetUserId}> إلى **${teamName(requesterTeam)}**، وينتقل <@${requesterPartner.userId}> إلى **${teamName(targetTeam)}**.`,
      "يلزم موافقة عضوي الفريق المقابل خلال 5 دقائق.",
    ].join("\n"),
    components: [row],
  });

  request.channelId = msg.channel.id;
  request.messageId = msg.id;
  request.timeout = setTimeout(() => cancelSwapRequest(client, swapId, "انتهت مهلة طلب الاستبدال."), READY_TIMEOUT_MS);
  request.timeout.unref?.();

  await replyPrivate(interaction, "تم إرسال طلب الاستبدال للفريق المقابل.");
}

async function handleSwapVote(client, interaction, swapId, vote) {
  await waitForMongoose();
  const request = swapRequests.get(swapId);
  if (!request) return replyPrivate(interaction, "طلب الاستبدال غير موجود أو انتهت مهلته.");
  if (!request.approverIds.includes(interaction.user.id)) {
    return replyPrivate(interaction, "التصويت على هذا الاستبدال لأعضاء الفريق المقابل فقط.");
  }

  if (vote === "no") {
    await cancelSwapRequest(client, swapId, `تم رفض الاستبدال بواسطة <@${interaction.user.id}>.`);
    return replyPrivate(interaction, "تم رفض طلب الاستبدال.");
  }

  request.yesVotes.add(interaction.user.id);
  if (request.yesVotes.size < request.approverIds.length) {
    return replyPrivate(interaction, "تم تسجيل موافقتك. بانتظار العضو الآخر.");
  }

  clearTimeout(request.timeout);
  const tournament = await getTournament(request.tournamentId);
  const requestTeam = await LeagueTeam.findOne({ tournamentId: tournament._id, teamId: request.requestTeamId });
  const targetTeam = await LeagueTeam.findOne({ tournamentId: tournament._id, teamId: request.targetTeamId });

  if (!requestTeam || !targetTeam) {
    swapRequests.delete(swapId);
    return replyPrivate(interaction, "تعذر تنفيذ الاستبدال لأن أحد الفريقين غير موجود.");
  }

  if (await teamHasPlayed(tournament._id, requestTeam.teamId) || await teamHasPlayed(tournament._id, targetTeam.teamId)) {
    await cancelSwapRequest(client, swapId, "تم إلغاء الاستبدال لأن أحد الفريقين لعب مباراة.");
    return replyPrivate(interaction, "تم إلغاء الاستبدال لأن أحد الفريقين لعب مباراة.");
  }

  const requesterPartner = requestTeam.members.find((m) => m.userId === request.requesterPartnerId);
  const targetMember = targetTeam.members.find((m) => m.userId === request.targetUserId);
  const requester = requestTeam.members.find((m) => m.userId === request.requesterId);
  const targetPartner = targetTeam.members.find((m) => m.userId !== request.targetUserId);
  if (!requesterPartner || !targetMember || !requester || !targetPartner) {
    await cancelSwapRequest(client, swapId, "تعذر تنفيذ الاستبدال بسبب تغير أعضاء الفريق.");
    return replyPrivate(interaction, "تعذر تنفيذ الاستبدال بسبب تغير أعضاء الفريق.");
  }

  requestTeam.members = [requester, targetMember];
  targetTeam.members = [requesterPartner, targetPartner];
  await requestTeam.save();
  await targetTeam.save();
  await refreshStandingsMessage(client, tournament._id, interaction.user.id);
  await finishSwapMessage(client, request, "تم تنفيذ الاستبدال وتحديث الفرق.");
  swapRequests.delete(swapId);
  await replyPrivate(interaction, "تم تنفيذ الاستبدال بنجاح.");
}

async function handleStartMatchButton(interaction, tournamentId) {
  await waitForMongoose();
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") return replyPrivate(interaction, "لا يوجد دوري نشط.");

  const team = await findUserTeam(tournament._id, interaction.user.id);
  if (!team) return replyPrivate(interaction, "أنت لست ضمن أي فريق.");

  const teams = await LeagueTeam.find({ tournamentId: tournament._id }).lean();
  const teamMap = makeTeamMap(teams);
  const matches = await LeagueMatch.find({
    tournamentId: tournament._id,
    status: { $in: ["pending", "postponed"] },
    $or: [{ team1Id: team.teamId }, { team2Id: team.teamId }],
  }).lean();

  if (!matches.length) {
    return replyPrivate(interaction, "ما عندك مباريات pending أو postponed حاليًا.");
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`league:start_match_pick:${tournament._id}`)
    .setPlaceholder("اختر الخصم")
    .addOptions(matches.slice(0, 25).map((match) => {
      const opponentId = match.team1Id === team.teamId ? match.team2Id : match.team1Id;
      const opponent = teamMap.get(opponentId);
      return new StringSelectMenuOptionBuilder()
        .setLabel(truncateOption(`ضد ${teamName(opponent)}`))
        .setDescription(statusLabel(match.status))
        .setValue(match.matchId);
    }));

  await replyPrivate(interaction, {
    content: "اختر المباراة التي تريد فتحها:",
    components: [new ActionRowBuilder().addComponents(menu)],
  });
}

async function handleStartMatchPick(client, interaction, tournamentId) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") return editPrivate(interaction, "لا يوجد دوري نشط.");

  const matchId = interaction.values?.[0];
  let match = await LeagueMatch.findOne({ tournamentId: tournament._id, matchId });
  if (!match) return editPrivate(interaction, "المباراة غير موجودة.");
  if (!["pending", "postponed"].includes(match.status)) {
    return editPrivate(interaction, "هذه المباراة مفتوحة أو منتهية بالفعل.");
  }

  const { team1, team2 } = await getMatchTeams(match);
  if (!isMatchPlayer(interaction.user.id, team1, team2)) {
    return editPrivate(interaction, "هذه المباراة لا تخص فريقك.");
  }

  const teams = await LeagueTeam.find({ tournamentId: tournament._id }).lean();
  const matches = await LeagueMatch.find({ tournamentId: tournament._id }).lean();
  const odds = calculateOdds(team1, team2, matches);

  match = await LeagueMatch.findOneAndUpdate(
    { tournamentId: tournament._id, matchId, status: { $in: ["pending", "postponed"] } },
    {
      $set: {
        status: "ready_check",
        readyUserIds: [],
        readyStartedAt: new Date(),
        odds,
      },
    },
    { new: true }
  );
  if (!match) return editPrivate(interaction, "تم فتح هذه المباراة للتو بواسطة لاعب آخر.");

  const channel = await getTextChannel(client, LEAGUE_MATCH_CHANNEL_ID, interaction.channel);
  const attachment = new AttachmentBuilder(
    await renderMatchCardCanvas(match.toObject(), team1, team2, teams, matches),
    { name: "league-match.png" }
  );
  const content = await buildMatchContent(match, team1, team2);
  const baseMessage = await channel.send({
    content,
    files: [attachment],
    components: [makeReadyRow(match.matchId), await makeBetRow(match.matchId, odds)],
  });

  const threadName = truncateThreadName(`دوري ${teamName(team1)} ضد ${teamName(team2)}`);
  const thread = await baseMessage.startThread({
    name: threadName,
    autoArchiveDuration: 1440,
  }).catch(() => null);

  const playChannel = thread || channel;
  if (thread) {
    await thread.send({
      content: [
        team1.members.map((m) => `<@${m.userId}>`).join(" "),
        team2.members.map((m) => `<@${m.userId}>`).join(" "),
        "اضغطوا بدء عند جاهزية الأربعة. الرهان متاح فقط قبل بداية المباراة.",
      ].join("\n"),
      components: [makeReadyRow(match.matchId), await makeBetRow(match.matchId, odds)],
    }).catch(() => {});
  }

  match.channelId = channel.id;
  match.threadId = thread?.id || null;
  match.messageId = baseMessage.id;
  await match.save();
  scheduleReadyTimeout(client, match.matchId);

  await editPrivate(interaction, `تم فتح المباراة: ${thread ? `<#${thread.id}>` : `<#${playChannel.id}>`}`);
}

async function handleReady(client, interaction, matchId) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const match = await LeagueMatch.findOne({ matchId });
  if (!match || match.status !== "ready_check") {
    return editPrivate(interaction, "المباراة ليست في مرحلة الجاهزية.");
  }

  const { team1, team2 } = await getMatchTeams(match);
  if (!isMatchPlayer(interaction.user.id, team1, team2)) {
    return editPrivate(interaction, "الجاهزية لأعضاء المباراة فقط.");
  }

  const updated = await LeagueMatch.findOneAndUpdate(
    { matchId, status: "ready_check" },
    { $addToSet: { readyUserIds: interaction.user.id } },
    { new: true }
  );
  const readyCount = new Set(updated.readyUserIds).size;
  const neededReadyCount = getMatchUniqueUserIds(team1, team2).length;

  if (readyCount < neededReadyCount) {
    return editPrivate(interaction, `تم تسجيل جاهزيتك (${readyCount}/${neededReadyCount}).`);
  }

  await LeagueMatch.updateOne(
    { matchId, status: "ready_check" },
    { $set: { status: "game_selection" } }
  );
  await sendMatchSystemMessage(client, updated, "اكتملت جاهزية اللاعبين. حان وقت اختيار اللعبة.");
  await refreshMatchMessage(client, matchId);
  const channel = await getMatchChannel(client, updated);
  await sendGameSelectionMessage(channel, updated.matchId);
  await editPrivate(interaction, "اكتملت الجاهزية، وتم فتح اختيار اللعبة.");
}

async function handlePostpone(client, interaction, matchId) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const match = await LeagueMatch.findOne({ matchId });
  if (!match || !["ready_check", "game_selection"].includes(match.status)) {
    return editPrivate(interaction, "لا يمكن تأجيل هذه المباراة الآن.");
  }

  const { team1, team2 } = await getMatchTeams(match);
  if (!isMatchPlayer(interaction.user.id, team1, team2)) {
    return editPrivate(interaction, "التأجيل لأعضاء المباراة فقط.");
  }

  await LeagueMatch.updateOne(
    { matchId },
    { $set: { status: "postponed", readyUserIds: [], readyStartedAt: null } }
  );
  await sendMatchSystemMessage(client, match, `تم تأجيل المباراة بواسطة <@${interaction.user.id}>.`);
  await editPrivate(interaction, "تم تأجيل المباراة.");
}

async function handleRandomGame(client, interaction, matchId) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const game = LEAGUE_GAMES[Math.floor(Math.random() * LEAGUE_GAMES.length)];
  await startActiveMatch(client, interaction, matchId, game, "تم اختيار اللعبة عشوائيًا");
}

async function handleGamePick(client, interaction, matchId) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const gameIndex = Number(interaction.values?.[0]);
  const game = LEAGUE_GAMES[gameIndex];
  if (!game) return editPrivate(interaction, "اللعبة المختارة غير موجودة.");

  const match = await LeagueMatch.findOne({ matchId });
  if (!match || match.status !== "game_selection") return editPrivate(interaction, "المباراة ليست في مرحلة اختيار اللعبة.");

  const { team1, team2 } = await getMatchTeams(match);
  const userTeamId = getUserTeamId(interaction.user.id, team1, team2);
  if (!userTeamId) return editPrivate(interaction, "اختيار اللعبة لأعضاء المباراة فقط.");

  const key = `${matchId}:${gameIndex}`;
  const old = gameApprovalRequests.get(key);
  if (old?.timeout) clearTimeout(old.timeout);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:game_confirm:${matchId}:${gameIndex}:yes`)
      .setLabel("موافق")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`league:game_confirm:${matchId}:${gameIndex}:no`)
      .setLabel("رفض")
      .setStyle(ButtonStyle.Danger)
  );

  const msg = await interaction.channel.send({
    content: `هل توافقون على لعب: **${game}**؟\nيكفي لاعب واحد من كل فريق للموافقة.`,
    components: [row],
  });

  const request = {
    matchId,
    game,
    team1Id: team1.teamId,
    team2Id: team2.teamId,
    approvals: new Set([userTeamId]),
    channelId: msg.channel.id,
    messageId: msg.id,
    timeout: setTimeout(() => {
      gameApprovalRequests.delete(key);
      msg.delete().catch(() => {});
    }, READY_TIMEOUT_MS),
  };
  request.timeout.unref?.();
  gameApprovalRequests.set(key, request);

  await editPrivate(interaction, "تم إرسال طلب الموافقة على اللعبة.");
}

async function handleCustomGameVote(client, interaction, matchId) {
  await waitForMongoose();
  await deferPrivate(interaction);

  const match = await LeagueMatch.findOne({ matchId });
  if (!match || match.status !== "game_selection") return editPrivate(interaction, "المباراة ليست في مرحلة اختيار اللعبة.");

  const { team1, team2 } = await getMatchTeams(match);
  if (!isMatchPlayer(interaction.user.id, team1, team2)) {
    return editPrivate(interaction, "التصويت لأعضاء المباراة فقط.");
  }

  const key = `${matchId}:custom`;
  const old = gameApprovalRequests.get(key);
  if (old?.timeout) clearTimeout(old.timeout);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:game_confirm:${matchId}:custom:yes`)
      .setLabel("موافق")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`league:game_confirm:${matchId}:custom:no`)
      .setLabel("رفض")
      .setStyle(ButtonStyle.Danger)
  );

  const msg = await interaction.channel.send({
    content: "تصويت على لعبة مخصصة.",
    components: [row],
  });

  const request = {
    matchId,
    game: "مخصص",
    custom: true,
    approvals: new Set([interaction.user.id]),
    playerSlots: getMatchPlayerSlots(team1, team2),
    channelId: msg.channel.id,
    messageId: msg.id,
    timeout: setTimeout(() => {
      gameApprovalRequests.delete(key);
      msg.delete().catch(() => {});
    }, READY_TIMEOUT_MS),
  };
  request.timeout.unref?.();
  gameApprovalRequests.set(key, request);

  const approved = countApprovedSlots(request.playerSlots, request.approvals);
  if (approved >= request.playerSlots.length) {
    clearTimeout(request.timeout);
    gameApprovalRequests.delete(key);
    await removeComponents(client, request.channelId, request.messageId);
    return startActiveMatch(client, interaction, matchId, request.game, "تم الاتفاق على اللعبة");
  }

  await editPrivate(interaction, `تم تسجيل موافقتك (${approved}/${request.playerSlots.length}).`);
}

async function handleGameConfirm(client, interaction, matchId, gameKey, vote) {
  await waitForMongoose();
  await deferPrivate(interaction);
  const isCustom = gameKey === "custom";
  const game = isCustom ? "مخصص" : LEAGUE_GAMES[Number(gameKey)];
  const key = `${matchId}:${gameKey}`;
  const request = gameApprovalRequests.get(key);
  if (!game || !request) return editPrivate(interaction, "طلب الموافقة غير موجود أو انتهت مهلته.");

  const match = await LeagueMatch.findOne({ matchId });
  if (!match || match.status !== "game_selection") return editPrivate(interaction, "المباراة لم تعد في مرحلة اختيار اللعبة.");

  const { team1, team2 } = await getMatchTeams(match);
  const userTeamId = getUserTeamId(interaction.user.id, team1, team2);
  if (!userTeamId) return editPrivate(interaction, "التصويت لأعضاء المباراة فقط.");

  if (vote === "no") {
    clearTimeout(request.timeout);
    gameApprovalRequests.delete(key);
    await removeComponents(client, request.channelId, request.messageId);
    await interaction.channel.send("تم رفض اللعبة. اختاروا لعبة أخرى.").catch(() => {});
    await sendGameSelectionMessage(interaction.channel, matchId);
    return editPrivate(interaction, "تم رفض اللعبة.");
  }

  if (isCustom) {
    request.approvals.add(interaction.user.id);
    const approved = countApprovedSlots(request.playerSlots || getMatchPlayerSlots(team1, team2), request.approvals);
    const total = (request.playerSlots || getMatchPlayerSlots(team1, team2)).length;
    if (approved < total) {
      return editPrivate(interaction, `تم تسجيل موافقتك (${approved}/${total}).`);
    }

    clearTimeout(request.timeout);
    gameApprovalRequests.delete(key);
    await removeComponents(client, request.channelId, request.messageId);
    return startActiveMatch(client, interaction, matchId, game, "تم الاتفاق على اللعبة");
  }

  request.approvals.add(userTeamId);
  if (!(request.approvals.has(team1.teamId) && request.approvals.has(team2.teamId))) {
    return editPrivate(interaction, "تم تسجيل موافقة فريقك. بانتظار الفريق الآخر.");
  }

  clearTimeout(request.timeout);
  gameApprovalRequests.delete(key);
  await removeComponents(client, request.channelId, request.messageId);
  await startActiveMatch(client, interaction, matchId, game, "تم الاتفاق على اللعبة");
}

async function handleBetButton(interaction, matchId, teamPick) {
  await waitForMongoose();
  const match = await LeagueMatch.findOne({ matchId });
  if (!match || ["active", "finished"].includes(match.status)) {
    return replyPrivate(interaction, "الرهان مقفل لهذه المباراة.");
  }

  const { team1, team2 } = await getMatchTeams(match);
  if (isMatchPlayer(interaction.user.id, team1, team2)) {
    return replyPrivate(interaction, "لا يمكنك المراهنة على مباراة فريقك.");
  }

  const pickedTeam = teamPick === 1 ? team1 : team2;
  if (!pickedTeam) return replyPrivate(interaction, "اختيار الرهان غير صحيح.");

  const modal = new ModalBuilder()
    .setCustomId(`league:bet_modal:${matchId}:${teamPick}`)
    .setTitle(`رهان على ${teamName(pickedTeam)}`);

  const amountInput = new TextInputBuilder()
    .setCustomId("amount")
    .setLabel("مبلغ الرهان")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("مثال: 5000")
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
  await interaction.showModal(modal);
}

async function handleBetModal(client, interaction, matchId, teamPick) {
  await waitForMongoose();
  await deferPrivate(interaction);

  const amount = parseAmount(interaction.fields.getTextInputValue("amount"));
  if (!Number.isInteger(amount) || amount <= 0) {
    return editPrivate(interaction, "اكتب مبلغًا صحيحًا أكبر من صفر.");
  }

  const match = await LeagueMatch.findOne({ matchId });
  if (!match || ["active", "finished"].includes(match.status)) {
    return editPrivate(interaction, "الرهان مقفل لهذه المباراة.");
  }

  const { team1, team2 } = await getMatchTeams(match);
  if (isMatchPlayer(interaction.user.id, team1, team2)) {
    return editPrivate(interaction, "لا يمكنك المراهنة على مباراة فريقك.");
  }

  const pickedTeam = teamPick === 1 ? team1 : team2;
  const odds = teamPick === 1 ? Number(match.odds?.team1 || 1.9) : Number(match.odds?.team2 || 1.9);

  const existing = await LeagueBet.findOne({ matchId, userId: interaction.user.id });
  if (existing) return editPrivate(interaction, "لديك رهان محفوظ على هذه المباراة بالفعل.");

  let bet;
  try {
    bet = await LeagueBet.create({
      guildId: match.guildId,
      tournamentId: match.tournamentId,
      matchId,
      userId: interaction.user.id,
      username: getInteractionDisplayName(interaction),
      teamPick,
      pickedTeamId: pickedTeam.teamId,
      amount,
      odds,
      status: "pending",
    });
  } catch (err) {
    if (err.code === 11000) return editPrivate(interaction, "لديك رهان محفوظ على هذه المباراة بالفعل.");
    throw err;
  }

  const db = await getMongoDb();
  const users = db.collection("users");
  const debit = await users.updateOne(
    { userId: String(interaction.user.id), wallet: { $gte: amount } },
    { $inc: { wallet: -amount } }
  );

  if (!debit.modifiedCount) {
    await LeagueBet.deleteOne({ _id: bet._id });
    return editPrivate(interaction, "رصيدك لا يكفي أو لا تملك محفظة. افتح محفظتك بأمر `رصيد`.");
  }

  const userDoc = await users.findOne({ userId: String(interaction.user.id) });
  await recordTransaction({
    userId: interaction.user.id,
    amount: -amount,
    reason: `دوري - رهان على ${teamName(pickedTeam)}`,
    type: "bet",
    game: "league",
    guildId: interaction.guildId || match.guildId,
    channelId: interaction.channelId,
    balanceAfter: userDoc?.wallet ?? null,
    ref: { type: "league_bet", matchId, betId: String(bet._id), pickedTeamId: pickedTeam.teamId },
  });

  await refreshMatchMessage(client, matchId);
  await editPrivate(interaction, `تم تسجيل رهانك: **${amount.toLocaleString("en-US")}** على **${teamName(pickedTeam)}** بسعر x${odds.toFixed(2)}.`);
}

async function handleAdminResult(client, interaction, matchId, resultType) {
  await waitForMongoose();
  if (interaction.user.id !== ADMIN_ID) {
    return replyPrivate(interaction, "هذا الزر للأدمن فقط.");
  }

  await deferPrivate(interaction);
  const match = await LeagueMatch.findOne({ matchId });
  if (!match || match.status !== "active") {
    return editPrivate(interaction, "المباراة غير نشطة أو تم اعتماد نتيجتها سابقًا.");
  }

  const { team1, team2 } = await getMatchTeams(match);
  const isDraw = resultType === "draw";
  const winnerTeamId = resultType === "team1" ? team1.teamId : resultType === "team2" ? team2.teamId : null;
  const result = isDraw
    ? { team1Score: 0, team2Score: 0 }
    : resultType === "team1"
      ? { team1Score: 1, team2Score: 0 }
      : { team1Score: 0, team2Score: 1 };

  const updated = await LeagueMatch.findOneAndUpdate(
    { matchId, status: "active" },
    {
      $set: {
        status: "finished",
        winnerTeamId,
        isDraw,
        resultBy: interaction.user.id,
        result,
        finishedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!updated) return editPrivate(interaction, "تم اعتماد النتيجة سابقًا.");

  await applyMatchResult(updated, resultType, team1, team2);
  await resolveMatchBets(updated, winnerTeamId, isDraw);
  await cleanupMatchArtifacts(client, updated);
  await refreshStandingsMessage(client, updated.tournamentId, null);

  await editPrivate(interaction, "تم اعتماد النتيجة وتحديث الجدول والرهانات.");
}

async function startActiveMatch(client, interaction, matchId, game, prefixText) {
  const match = await LeagueMatch.findOne({ matchId });
  if (!match || match.status !== "game_selection") {
    return editPrivate(interaction, "لا يمكن بدء هذه المباراة الآن.");
  }
  const { team1, team2 } = await getMatchTeams(match);
  if (!isMatchPlayer(interaction.user.id, team1, team2)) {
    return editPrivate(interaction, "اختيار اللعبة لأعضاء المباراة فقط.");
  }

  const updated = await LeagueMatch.findOneAndUpdate(
    { matchId, status: "game_selection" },
    {
      $set: {
        status: "active",
        selectedGame: game,
        startedAt: new Date(),
        // حفظ رابط اللعبة مع بيانات المباراة لتسهيل الوصول لاحقاً إن لزم
        gameLink: getLeagueGameLink(game) 
      },
    },
    { new: true }
  );

  if (!updated) return editPrivate(interaction, "بدأت المباراة بالفعل.");

  await refreshMatchMessage(client, matchId);
  const gameLink = getLeagueGameLink(game);
  const linkLine = gameLink ? `\nرابط اللعبة: ${gameLink}` : "";
  await sendMatchSystemMessage(client, updated, `${prefixText}: **${game}**${linkLine}\nبدأت المباراة، وتم إغلاق الرهانات.`);
  await sendAdminResultDM(client, updated, team1, team2, game);
  await editPrivate(interaction, `بدأت المباراة على لعبة: **${game}**`);
}

async function applyMatchResult(match, resultType, team1, team2) {
  if (resultType === "draw") {
    await LeagueTeam.updateMany(
      { tournamentId: match.tournamentId, teamId: { $in: [team1.teamId, team2.teamId] } },
      { $inc: { played: 1, draws: 1, points: 1 } }
    );
    return;
  }

  const winner = resultType === "team1" ? team1 : team2;
  const loser = resultType === "team1" ? team2 : team1;

  await LeagueTeam.updateOne(
    { tournamentId: match.tournamentId, teamId: winner.teamId },
    { $inc: { played: 1, wins: 1, points: 3, scoreFor: 1 } }
  );
  await LeagueTeam.updateOne(
    { tournamentId: match.tournamentId, teamId: loser.teamId },
    { $inc: { played: 1, losses: 1, scoreAgainst: 1 } }
  );
}

async function resolveMatchBets(match, winnerTeamId, isDraw) {
  const bets = await LeagueBet.find({ matchId: match.matchId, status: "pending" });
  if (!bets.length) return;

  for (const bet of bets) {
    if (isDraw) {
      await creditWallet(bet.userId, bet.amount);
      const balanceAfter = await getWallet(bet.userId);
      await LeagueBet.updateOne(
        { _id: bet._id },
        { $set: { status: "refunded", payout: bet.amount, resolvedAt: new Date() } }
      );
      await recordTransaction({
        userId: bet.userId,
        amount: bet.amount,
        reason: "دوري - استرجاع رهان بسبب التعادل",
        type: "refund",
        game: "league",
        guildId: match.guildId,
        balanceAfter,
        ref: { type: "league_bet_refund", matchId: match.matchId, betId: String(bet._id) },
      });
      continue;
    }

    if (bet.pickedTeamId === winnerTeamId) {
      const payout = Math.floor(bet.amount * bet.odds);
      await creditWallet(bet.userId, payout);
      const balanceAfter = await getWallet(bet.userId);
      await LeagueBet.updateOne(
        { _id: bet._id },
        { $set: { status: "won", payout, resolvedAt: new Date() } }
      );
      await recordTransaction({
        userId: bet.userId,
        amount: payout,
        reason: "دوري - ربح رهان",
        type: "payout",
        game: "league",
        guildId: match.guildId,
        balanceAfter,
        ref: { type: "league_bet_payout", matchId: match.matchId, betId: String(bet._id) },
      });
    } else {
      await LeagueBet.updateOne(
        { _id: bet._id },
        { $set: { status: "lost", payout: 0, resolvedAt: new Date() } }
      );
    }
  }
}

async function refreshRegistrationMessage(client, tournamentId) {
  const tournament = await getTournament(tournamentId);
  if (!tournament) return null;

  const channel = await getTextChannel(client, LEAGUE_CHANNEL_ID);
  if (!channel) return null;

  const attachment = new AttachmentBuilder(
    await renderRegistrationCanvas(tournament.toObject ? tournament.toObject() : tournament),
    { name: "league-registration.png" }
  );
  const payload = {
    content: tournament.status === "registration"
      ? "**تسجيل دوري درب التبانة**"
      : "**تم بدء دوري درب التبانة**",
    files: [attachment],
    attachments: [],
    components: [makeRegistrationRow(tournament._id, tournament.status !== "registration")],
  };

  let message = null;
  if (tournament.registrationMessageId) {
    if (tournament.registrationChannelId && tournament.registrationChannelId !== channel.id) {
      const oldChannel = await getTextChannel(client, tournament.registrationChannelId);
      const oldMessage = await oldChannel?.messages.fetch(tournament.registrationMessageId).catch(() => null);
      if (oldMessage) await oldMessage.delete().catch(() => {});
    }
    message = await channel.messages.fetch(tournament.registrationMessageId).catch(() => null);
  }

  if (message) {
    await message.edit(payload).catch(() => null);
    return message;
  }

  message = await channel.send(payload);
  await LeagueTournament.updateOne(
    { _id: tournament._id },
    { $set: { registrationMessageId: message.id, registrationChannelId: channel.id } }
  );
  return message;
}

async function deleteRegistrationMessage(client, tournament) {
  if (!tournament?.registrationMessageId) return;
  const channel = await getTextChannel(client, tournament.registrationChannelId || LEAGUE_CHANNEL_ID);
  const message = await channel?.messages.fetch(tournament.registrationMessageId).catch(() => null);
  if (message) await message.delete().catch(() => {});
  await LeagueTournament.updateOne(
    { _id: tournament._id },
    { $set: { registrationMessageId: null, registrationChannelId: LEAGUE_CHANNEL_ID } }
  );
}

async function refreshStandingsMessage(client, tournamentId, viewerUserId = null) {
  const tournament = await getTournament(tournamentId);
  if (!tournament) return null;

  const teams = await LeagueTeam.find({ tournamentId: tournament._id }).lean();
  const matches = await LeagueMatch.find({ tournamentId: tournament._id }).lean();
  const channel = await getTextChannel(client, LEAGUE_RESULTS_CHANNEL_ID);
  if (!channel) return null;

  const attachment = new AttachmentBuilder(
    await renderStandingsCanvas(tournament.toObject ? tournament.toObject() : tournament, teams, matches, viewerUserId),
    { name: "league-standings.png" }
  );

  const finished = matches.filter((m) => m.status === "finished").length;
  const content = `**جدول دوري درب التبانة **\nالفرق: **${teams.length}** | المباريات: **${finished}/${matches.length}**`;
  const payload = {
    content,
    files: [attachment],
    attachments: [],
    components: [makeStandingsRow(tournament._id)],
  };

  let message = null;
  if (tournament.standingsMessageId) {
    if (tournament.standingsChannelId && tournament.standingsChannelId !== channel.id) {
      const oldChannel = await getTextChannel(client, tournament.standingsChannelId);
      const oldMessage = await oldChannel?.messages.fetch(tournament.standingsMessageId).catch(() => null);
      if (oldMessage) await oldMessage.delete().catch(() => {});
    }
    message = await channel.messages.fetch(tournament.standingsMessageId).catch(() => null);
  }

  if (message) {
    await message.edit(payload).catch(() => null);
    return message;
  }

  message = await channel.send(payload);
  await LeagueTournament.updateOne(
    { _id: tournament._id },
    { $set: { standingsMessageId: message.id, standingsChannelId: channel.id } }
  );
  return message;
}

async function refreshMatchMessage(client, matchId) {
  const match = await LeagueMatch.findOne({ matchId });
  if (!match?.messageId || !match.channelId) return;
  const channel = await getTextChannel(client, match.channelId);
  const message = await channel?.messages.fetch(match.messageId).catch(() => null);
  if (!message) return;
  const { team1, team2 } = await getMatchTeams(match);
  const content = await buildMatchContent(match, team1, team2);
  const readyDisabled = match.status !== "ready_check";
  const betDisabled = ["active", "finished"].includes(match.status);
  const components = [makeReadyRow(match.matchId, readyDisabled), await makeBetRow(match.matchId, match.odds, betDisabled)];
  await message.edit({ content, components }).catch(() => {});
}

async function buildMatchContent(match, team1, team2) {
  const totals = await getBetTotals(match.matchId);
  return [
    `**مباراة دوري** - ${statusLabel(match.status)}`,
    `1 = **${teamName(team1)}** x${Number(match.odds?.team1 || 1.9).toFixed(2)}`,
    `2 = **${teamName(team2)}** x${Number(match.odds?.team2 || 1.9).toFixed(2)}`,
    `إجمالي الرهانات: 1) ${totals.team1.toLocaleString("en-US")} | 2) ${totals.team2.toLocaleString("en-US")}`,
  ].join("\n");
}

async function sendGameSelectionMessage(channel, matchId) {
  if (!channel?.send) return;
  const select = new StringSelectMenuBuilder()
    .setCustomId(`league:game_pick:${matchId}`)
    .setPlaceholder("اختروا اللعبة")
    .addOptions(LEAGUE_GAMES.slice(0, 25).map((game, index) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(truncateOption(game))
        .setValue(String(index))
    ));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:game_random:${matchId}`)
      .setLabel("عشوائي")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`league:game_agree:${matchId}`)
      .setLabel("مخصص")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    content: "اختاروا لعبة المباراة:",
    components: [row, new ActionRowBuilder().addComponents(select)],
  }).catch(() => {});
}

async function sendAdminResultDM(client, match, team1, team2, game) {
  const admin = await client.users.fetch(ADMIN_ID).catch(() => null);
  if (!admin) {
    await sendMatchSystemMessage(client, match, "تعذر العثور على الأدمن لإرسال أزرار النتيجة.");
    return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:admin_result:${match.matchId}:team1`)
      .setLabel("الفريق الأول فاز")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`league:admin_result:${match.matchId}:team2`)
      .setLabel("الفريق الثاني فاز")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`league:admin_result:${match.matchId}:draw`)
      .setLabel("تعادل")
      .setStyle(ButtonStyle.Secondary)
  );

  const content = [
    "**تسجيل نتيجة مباراة دوري**",
    `matchId: \`${match.matchId}\``,
    `اللعبة: **${game}**`,
    `الفريق الأول: **${teamName(team1)}** (${team1.members.map((m) => m.userId).join(", ")})`,
    `الفريق الثاني: **${teamName(team2)}** (${team2.members.map((m) => m.userId).join(", ")})`,
  ].join("\n");

  const sent = await admin.send({ content, components: [row] }).catch(() => null);
  if (!sent) {
    await sendMatchSystemMessage(client, match, "تعذر إرسال DM للأدمن. تأكد أن الخاص مفتوح.");
  }
}

async function archiveMatchThread(client, match) {
  if (!match.threadId) return;
  const thread = await client.channels.fetch(match.threadId).catch(() => null);
  if (thread?.setArchived) {
    await thread.setArchived(true, "League match finished").catch(() => {});
  }
}

async function cleanupMatchArtifacts(client, match) {
  if (match.threadId) {
    const thread = await client.channels.fetch(match.threadId).catch(() => null);
    if (thread?.delete) {
      await thread.delete("League match finished").catch(async () => {
        await deleteRecentBotMessages(thread, client.user?.id);
        await thread.setLocked?.(true, "League match finished").catch(() => {});
        await thread.setArchived?.(true, "League match finished").catch(() => {});
      });
    } else if (thread?.setArchived) {
      await deleteRecentBotMessages(thread, client.user?.id);
      await thread.setLocked?.(true, "League match finished").catch(() => {});
      await thread.setArchived(true, "League match finished").catch(() => {});
    }
  }

  if (match.channelId && match.messageId) {
    const channel = await getTextChannel(client, match.channelId);
    const message = await channel?.messages.fetch(match.messageId).catch(() => null);
    if (message) await message.delete().catch(() => {});
  }
}

async function deleteRecentBotMessages(channel, botId) {
  if (!channel?.messages?.fetch || !botId) return;
  const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!messages) return;
  for (const message of messages.values()) {
    if (message.author?.id === botId) await message.delete().catch(() => {});
  }
}

async function sendMatchSystemMessage(client, match, content) {
  const channel = await getMatchChannel(client, match);
  await channel?.send({ content }).catch(() => {});
}

async function getMatchChannel(client, match) {
  if (match.threadId) {
    const thread = await client.channels.fetch(match.threadId).catch(() => null);
    if (thread?.send) return thread;
  }
  return getTextChannel(client, match.channelId || LEAGUE_MATCH_CHANNEL_ID);
}

function scheduleReadyTimeout(client, matchId) {
  setTimeout(async () => {
    const match = await LeagueMatch.findOne({ matchId }).catch(() => null);
    if (!match || match.status !== "ready_check") return;
    const cutoff = Date.now() - READY_TIMEOUT_MS;
    if (!match.readyStartedAt || match.readyStartedAt.getTime() > cutoff) return;
    await LeagueMatch.updateOne(
      { matchId, status: "ready_check" },
      { $set: { status: "postponed", readyUserIds: [], readyStartedAt: null } }
    );
    await sendMatchSystemMessage(client, match, "انتهت مهلة الجاهزية وتم تأجيل المباراة.");
  }, READY_TIMEOUT_MS + 2000).unref?.();
}

async function postponeExpiredReadyChecks(client) {
  if (mongoose.connection.readyState !== 1) return;
  const cutoff = new Date(Date.now() - READY_TIMEOUT_MS);
  const expired = await LeagueMatch.find({ status: "ready_check", readyStartedAt: { $lte: cutoff } }).limit(20);
  for (const match of expired) {
    await LeagueMatch.updateOne(
      { _id: match._id, status: "ready_check" },
      { $set: { status: "postponed", readyUserIds: [], readyStartedAt: null } }
    );
    await sendMatchSystemMessage(client, match, "انتهت مهلة الجاهزية وتم تأجيل المباراة.");
  }
}

async function cancelSwapRequest(client, swapId, reason) {
  const request = swapRequests.get(swapId);
  if (!request) return;
  clearTimeout(request.timeout);
  await finishSwapMessage(client, request, reason);
  swapRequests.delete(swapId);
}

async function finishSwapMessage(client, request, content) {
  const channel = await getTextChannel(client, request.channelId);
  const message = await channel?.messages.fetch(request.messageId).catch(() => null);
  if (message) await message.edit({ content, components: [] }).catch(() => {});
}

async function removeComponents(client, channelId, messageId) {
  const channel = await getTextChannel(client, channelId);
  const message = await channel?.messages.fetch(messageId).catch(() => null);
  if (message) await message.edit({ components: [] }).catch(() => {});
}

function renderRegistrationCanvas(tournament) {
  const participants = tournament.participants || [];
  const height = Math.max(520, 245 + Math.ceil(Math.max(participants.length, 1) / 2) * 58);
  const canvas = createCanvas(1100, height);
  const ctx = canvas.getContext("2d");
  paintBackground(ctx, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.gold;
  ctx.font = "700 58px Cairo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("دوري درب التبانة", canvas.width / 2, 92);

  ctx.fillStyle = COLORS.text;
  ctx.font = "700 31px Cairo, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("قائمة المشاركين", 995, 166);

  if (!participants.length) {
    drawPanel(ctx, 110, 205, 880, 90, 14, "#102834");
    ctx.fillStyle = COLORS.muted;
    ctx.font = "26px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("لا يوجد مشاركون حتى الآن", 550, 260);
    return canvas.encode("png");
  }

  const colWidth = 430;
  const startY = 205;
  participants.forEach((participant, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = col === 0 ? 110 : 560;
    const y = startY + row * 58;
    drawPanel(ctx, x, y, colWidth, 46, 10, index % 4 < 2 ? "#102834" : "#0d202a");
    ctx.fillStyle = TEAM_PALETTE[index % TEAM_PALETTE.length];
    ctx.beginPath();
    ctx.arc(x + 28, y + 23, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = "22px Cairo, sans-serif";
    ctx.textAlign = "right";
    const label = truncateCanvasText(ctx, `${index + 1}. ${participant.username}`, colWidth - 64);
    ctx.fillText(label, x + colWidth - 20, y + 31);
  });

  return canvas.encode("png");
}

function renderStandingsCanvas(tournament, teams, matches, viewerUserId) {
  const sorted = sortTeams(teams);
  const headerY = 178;
  const rowStartY = headerY + 112; 
  const height = Math.max(690, rowStartY + sorted.length * 68 + 80);
  const width = 1360;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  paintBackground(ctx, width, height);

  const viewerTeam = sorted.find((team) => team.members.some((m) => m.userId === viewerUserId));
  const finished = matches.filter((m) => m.status === "finished").length;

  ctx.fillStyle = COLORS.gold;
  ctx.font = "700 54px Cairo, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(tournament.name || "دوري درب التبانة", width - 70, 86);
  ctx.fillStyle = COLORS.muted;
  ctx.font = "22px Cairo, sans-serif";
  ctx.fillText(`الفرق ${teams.length}  |  المباريات ${finished}/${matches.length}  |  ${formatDate(new Date())}`, width - 70, 126);

  const columns = [
    { label: "#", x: 60, w: 50, align: "center" },
    { label: "الفريق", x: 120, w: 420, align: "right" },
    { label: "لعب", x: 560, w: 70, align: "center" },
    { label: "فوز", x: 650, w: 70, align: "center" },
    { label: "تعادل", x: 740, w: 70, align: "center" },
    { label: "خسارة", x: 830, w: 70, align: "center" },
    { label: "نسبة الفوز", x: 920, w: 100, align: "center" },
    { label: "نقاط", x: 1040, w: 80, align: "center" },
    { label: "آخر 5", x: 1140, w: 150, align: "center" }, 
  ];

  drawPanel(ctx, 42, headerY, width - 84, 54, 12, "#132a35");
  ctx.fillStyle = COLORS.muted;
  ctx.font = "700 21px Cairo, sans-serif";
  for (const col of columns) drawCellText(ctx, col.label, col, headerY + 35);

  sorted.forEach((team, index) => {
    const y = rowStartY + index * 68;
    const highlighted = viewerTeam?.teamId === team.teamId;
    drawPanel(ctx, 42, y - 43, width - 84, 58, 12, highlighted ? "rgba(244,201,93,0.24)" : index % 2 ? "#0d202a" : "#102834");
    ctx.fillStyle = TEAM_PALETTE[index % TEAM_PALETTE.length];
    ctx.fillRect(44, y - 41, 6, 54);

    const values = [
      index + 1,
      teamName(team),
      team.played || 0,
      team.wins || 0,
      team.draws || 0,
      team.losses || 0,
      `${getWinrate(team).toFixed(0)}%`,
      team.points || 0,
    ];

    ctx.font = "22px Cairo, sans-serif";
    ctx.fillStyle = COLORS.text;
    values.forEach((value, valueIndex) => {
      const col = columns[valueIndex];
      const text = valueIndex === 1 ? truncateCanvasText(ctx, String(value), col.w - 12) : String(value);
      drawCellText(ctx, text, col, y - 5);
    });

    drawRecentForm(ctx, matches, team.teamId, columns[8].x + columns[8].w / 2, y - 13);
  });

  if (!sorted.length) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = "26px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("لم يبدأ الدوري بعد.", width / 2, 360);
  }

  return canvas.encode("png");
}

function renderMyMatchesCanvas(userTeams, matches, allTeams) {
  const teamMap = makeTeamMap(allTeams);
  const rows = [];
  
  for (const match of matches) {
    const myTeam = userTeams.find((team) => team.teamId === match.team1Id || team.teamId === match.team2Id);
    if (!myTeam) continue;
    const opponentId = match.team1Id === myTeam.teamId ? match.team2Id : match.team1Id;
    const outcome = getMatchOutcome(match, myTeam.teamId);
    
    rows.push({
      myTeam,
      opponent: teamMap.get(opponentId),
      status: statusLabel(match.status),
      result: outcome.text,
      outcome: outcome.key,
      game: match.selectedGame || "-",
    });
  }

  const width = 1200;
  const titleTeams = truncateCanvasTitle(userTeams.map((team) => teamName(team)).join(" / "), 56);
  
  const headerY = 178;
  const rowStartY = headerY + 112; 
  const rowHeight = 68;
  const height = Math.max(540, rowStartY + rows.length * rowHeight + 80);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  paintBackground(ctx, width, height);

  ctx.fillStyle = COLORS.gold;
  ctx.font = "700 48px Cairo, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`مبارياتي - ${titleTeams}`, width - 70, 82);

  ctx.fillStyle = COLORS.muted;
  ctx.font = "22px Cairo, sans-serif";
  ctx.fillText(`عدد المباريات: ${rows.length}`, width - 70, 122);

  const columns = [
    { label: "#", x: 60, w: 50, align: "center" },
    { label: "فريقي", x: 130, w: 290, align: "right" },
    { label: "الخصم", x: 440, w: 290, align: "right" },
    { label: "اللعبة", x: 750, w: 160, align: "center" },
    { label: "الحالة", x: 930, w: 100, align: "center" },
    { label: "النتيجة", x: 1050, w: 90, align: "center" },
  ];

  drawPanel(ctx, 42, headerY, width - 84, 54, 12, "#132a35");
  ctx.fillStyle = COLORS.muted;
  ctx.font = "700 21px Cairo, sans-serif";
  for (const col of columns) drawCellText(ctx, col.label, col, headerY + 35);

  if (!rows.length) {
    drawPanel(ctx, 120, rowStartY + 20, width - 240, 100, 14, "#102834");
    ctx.fillStyle = COLORS.muted;
    ctx.font = "27px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("لا توجد مباريات محفوظة لفريقك حتى الآن", width / 2, rowStartY + 82);
    return canvas.encode("png");
  }

  rows.forEach((row, index) => {
    const y = rowStartY + index * rowHeight;
    
    let barColor = TEAM_PALETTE[index % TEAM_PALETTE.length];
    if (row.outcome === "win") barColor = COLORS.green;
    else if (row.outcome === "loss") barColor = COLORS.red;
    else if (row.outcome === "draw") barColor = COLORS.yellow;

    drawPanel(ctx, 42, y - 43, width - 84, 58, 12, index % 2 ? "#0d202a" : "#102834");
    
    ctx.fillStyle = barColor;
    ctx.fillRect(44, y - 41, 6, 54);

    ctx.fillStyle = COLORS.text;
    ctx.font = "21px Cairo, sans-serif";
    
    drawCellText(ctx, index + 1, columns[0], y - 5);
    drawCellText(ctx, truncateCanvasText(ctx, teamName(row.myTeam), columns[1].w - 10), columns[1], y - 5);
    drawCellText(ctx, truncateCanvasText(ctx, teamName(row.opponent), columns[2].w - 10), columns[2], y - 5);
    drawCellText(ctx, truncateCanvasText(ctx, row.game, columns[3].w - 10), columns[3], y - 5);
    drawCellText(ctx, row.status, columns[4], y - 5);
    
    // المربع الملون لنتيجة المباراة (Pill)
    if (row.outcome !== "none") {
      const pillColor = row.outcome === "win" ? COLORS.green : row.outcome === "loss" ? COLORS.red : COLORS.yellow;
      const px = columns[5].x + columns[5].w / 2 - 40;
      drawSoftPill(ctx, px, y - 28, 80, 28, row.result, pillColor);
    } else {
      drawCellText(ctx, "-", columns[5], y - 5);
    }
  });

  return canvas.encode("png");
}

function renderMatchCardCanvas(match, team1, team2, teams, matches) {
  const canvas = createCanvas(1100, 540);
  const ctx = canvas.getContext("2d");
  paintBackground(ctx, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.gold;
  ctx.font = "700 44px Cairo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("المباراة الحالية", 550, 70);

  drawTeamMatchPanel(ctx, 80, 125, 400, 310, team1, teams, matches, match.odds?.team1, "1");
  drawTeamMatchPanel(ctx, 620, 125, 400, 310, team2, teams, matches, match.odds?.team2, "2");

  ctx.fillStyle = COLORS.text;
  ctx.font = "700 42px Cairo, sans-serif";
  ctx.fillText("VS", 550, 290);

  ctx.fillStyle = COLORS.muted;
  ctx.font = "22px Cairo, sans-serif";
  ctx.fillText("الرهان متاح قبل بداية المباراة فقط", 550, 485);

  return canvas.encode("png");
}

function drawTeamMatchPanel(ctx, x, y, w, h, team, teams, matches, odds, number) {
  drawPanel(ctx, x, y, w, h, 18, "#102834");
  ctx.fillStyle = TEAM_PALETTE[Math.abs(hashCode(team.teamId)) % TEAM_PALETTE.length];
  ctx.fillRect(x, y, 8, h);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "700 22px Cairo, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(number, x + 26, y + 42);
  ctx.textAlign = "center";
  ctx.font = "700 30px Cairo, sans-serif";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(truncateCanvasText(ctx, teamName(team), w - 60), x + w / 2, y + 72);

  const rank = getTeamRank(teams, team.teamId);
  const rows = [
    ["الترتيب", `#${rank || "-"}`],
    ["النقاط", `${team.points || 0}`],
    ["نسبة الفوز", `${getWinrate(team).toFixed(0)}%`],
    ["الاحتمالات", `x${Number(odds || 1.9).toFixed(2)}`],
  ];

  ctx.font = "22px Cairo, sans-serif";
  rows.forEach((row, index) => {
    const yy = y + 125 + index * 42;
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "right";
    ctx.fillText(row[0], x + w - 32, yy);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "left";
    ctx.fillText(row[1], x + 32, yy);
  });

  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "center";
  ctx.fillText("آخر 5", x + w / 2, y + h - 58);
  drawRecentForm(ctx, matches, team.teamId, x + w / 2, y + h - 36);
}

function makeRegistrationRow(tournamentId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:join:${tournamentId}`)
      .setLabel("مشاركة")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`league:leave:${tournamentId}`)
      .setLabel("انسحاب")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`league:start:${tournamentId}`)
      .setLabel("بدء الدوري")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled)
  );
}

function makeStandingsRow(tournamentId, active = null) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:my_matches:${tournamentId}`)
      .setLabel("مباراياتي")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "my_matches"),
    new ButtonBuilder()
      .setCustomId(`league:team:${tournamentId}`)
      .setLabel("فريقي")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "team"),
    new ButtonBuilder()
      .setCustomId(`league:start_match:${tournamentId}`)
      .setLabel("بدء مباراة")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(active === "start_match")
  );
}

function makeReadyRow(matchId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:ready:${matchId}`)
      .setLabel("بدء")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`league:postpone:${matchId}`)
      .setLabel("تأجيل")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );
}

async function makeBetRow(matchId, odds, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`league:bet:${matchId}:1`)
      .setLabel(`رهان على 1 x${Number(odds?.team1 || 1.9).toFixed(2)}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`league:bet:${matchId}:2`)
      .setLabel(`رهان على 2 x${Number(odds?.team2 || 1.9).toFixed(2)}`)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

function buildReplaceSelect(tournamentId, requesterTeam, teams, matches) {
  const options = [];
  const addedUsers = new Set(); // سلة مؤقتة عشان نتأكد من عدم تكرار اللاعبين

  for (const team of teams) {
    if (team.teamId === requesterTeam.teamId) continue;
    if (matches.some((m) => m.status === "finished" && [team.teamId, requesterTeam.teamId].includes(m.team1Id))) continue;
    
    for (const member of team.members) {
      // إذا اللاعب انضاف مسبقاً للقائمة، تجاهله وكمل
      if (addedUsers.has(member.userId)) continue;
      
      addedUsers.add(member.userId); // تسجيل اللاعب كـ "مضاف"
      
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(truncateOption(member.username))
          .setDescription(truncateOption(`من فريق ${teamName(team)}`, 100))
          .setValue(member.userId)
      );
    }
  }
  
  if (!options.length) return null;
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`league:replace_pick:${tournamentId}`)
      .setPlaceholder("اختيار لاعب للاستبدال")
      .addOptions(options.slice(0, 25))
  );
}

async function syncMissingMatches(tournamentId) {
  const teams = await LeagueTeam.find({ tournamentId }).lean();
  const matches = await LeagueMatch.find({ tournamentId }).lean();

  const existingMatchPairs = new Set();
  
  // حفظ كل المباريات الحالية عشان ما نكررها
  for (const match of matches) {
    const id1 = match.team1Id;
    const id2 = match.team2Id;
    const key = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    existingMatchPairs.add(key);
  }

  const newMatches = [];
  
  // مقارنة كل فريق مع كل فريق آخر
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const id1 = teams[i].teamId;
      const id2 = teams[j].teamId;
      const key = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

      // إذا الفريقين ما بينهم مباراة، ننشئ وحدة جديدة
      if (!existingMatchPairs.has(key)) {
        newMatches.push({
          guildId: teams[0].guildId,
          tournamentId: tournamentId,
          matchId: makeMatchId(matches.length + newMatches.length),
          team1Id: id1,
          team2Id: id2,
          status: "pending",
          odds: { team1: 1.9, team2: 1.9 },
        });
        existingMatchPairs.add(key); // نضيفها للسيت عشان ما تتكرر بالغلط
      }
    }
  }

  // إذا في مباريات جديدة تم إنشاؤها، نحفظها بالمونقو
  if (newMatches.length > 0) {
    await LeagueMatch.insertMany(newMatches);
    return newMatches.length;
  }
  
  return 0;
}

async function getTournament(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) return null;
  return LeagueTournament.findById(id);
}

async function findUserTeam(tournamentId, userId) {
  return LeagueTeam.findOne({ tournamentId, "members.userId": String(userId) });
}

async function findUserTeams(tournamentId, userId) {
  return LeagueTeam.find({ tournamentId, "members.userId": String(userId) }).sort({ createdAt: 1 }).lean();
}

async function teamHasPlayed(tournamentId, teamId) {
  const team = await LeagueTeam.findOne({ tournamentId, teamId }).lean();
  if (Number(team?.played || 0) > 0) return true;
  return Boolean(await LeagueMatch.exists({
    tournamentId,
    status: "finished",
    $or: [{ team1Id: teamId }, { team2Id: teamId }],
  }));
}

async function getMatchTeams(match) {
  const [team1, team2] = await Promise.all([
    LeagueTeam.findOne({ tournamentId: match.tournamentId, teamId: match.team1Id }).lean(),
    LeagueTeam.findOne({ tournamentId: match.tournamentId, teamId: match.team2Id }).lean(),
  ]);
  return { team1, team2 };
}

function makeTeamMap(teams) {
  return new Map(teams.map((team) => [team.teamId, team]));
}

function teamName(team) {
  if (!team) return "فريق غير معروف";
  const customName = String(team.customName || "").trim();
  if (customName) return customName;
  return (team.members || []).map((m) => m.username || `User-${String(m.userId).slice(-4)}`).join(" / ");
}

function isMatchPlayer(userId, team1, team2) {
  return Boolean(getUserTeamId(userId, team1, team2));
}

function getUserTeamId(userId, team1, team2) {
  const uid = String(userId);
  if (team1?.members?.some((m) => m.userId === uid)) return team1.teamId;
  if (team2?.members?.some((m) => m.userId === uid)) return team2.teamId;
  return null;
}

function getMatchUniqueUserIds(team1, team2) {
  return [...new Set([...(team1?.members || []), ...(team2?.members || [])].map((m) => m.userId))];
}

function getMatchPlayerSlots(team1, team2) {
  return [...(team1?.members || []), ...(team2?.members || [])].map((m) => m.userId);
}

function countApprovedSlots(playerSlots, approvals) {
  return (playerSlots || []).filter((userId) => approvals.has(userId)).length;
}

function getLeagueGameLink(game) {
  return LEAGUE_GAME_LINKS[String(game || "").trim()] || "";
}

function makeParticipant(interaction, tournament = null) {
  const baseName = getInteractionDisplayName(interaction);
  // التعديل: إزالة إضافة أرقام للتكرار، نأخذ الاسم الأساسي فقط
  return {
    userId: interaction.user.id,
    username: baseName,
    avatarURL: interaction.user.displayAvatarURL?.({ extension: "png", size: 128 }) || null,
    joinedAt: new Date(),
  };
}

function getInteractionDisplayName(interaction) {
  return interaction.member?.displayName || interaction.user.globalName || interaction.user.username || `User-${interaction.user.id.slice(-4)}`;
}

function sortTeams(teams) {
  return [...teams].sort((a, b) => {
    return (
      (b.points || 0) - (a.points || 0) ||
      getGoalDiff(b) - getGoalDiff(a) ||
      (b.wins || 0) - (a.wins || 0) ||
      getWinrate(b) - getWinrate(a) ||
      (a.played || 0) - (b.played || 0) ||
      new Date(a.createdAt || 0) - new Date(b.createdAt || 0) ||
      String(a.teamId).localeCompare(String(b.teamId))
    );
  });
}

function getGoalDiff(team) {
  return Number(team.scoreFor || 0) - Number(team.scoreAgainst || 0);
}

function getWinrate(team) {
  const played = Number(team.played || 0);
  if (!played) return 0;
  return (Number(team.wins || 0) / played) * 100;
}

function getTeamRank(teams, teamId) {
  const sorted = sortTeams(teams);
  const index = sorted.findIndex((team) => team.teamId === teamId);
  return index >= 0 ? index + 1 : null;
}

function recentForm(teamId, matches) {
  const list = matches
    .filter((m) => m.status === "finished" && (m.team1Id === teamId || m.team2Id === teamId))
    .sort((a, b) => new Date(b.finishedAt || b.updatedAt || 0) - new Date(a.finishedAt || a.updatedAt || 0))
    .slice(0, 5)
    .map((match) => {
      if (match.isDraw) return "D";
      return match.winnerTeamId === teamId ? "W" : "L";
    });
  while (list.length < 5) list.push("E");
  return list;
}

function calculateOdds(team1, team2, matches) {
  if (!team1.played && !team2.played) return { team1: 1.9, team2: 1.9 };
  const strength1 = calculateTeamStrength(team1, recentForm(team1.teamId, matches));
  const strength2 = calculateTeamStrength(team2, recentForm(team2.teamId, matches));
  const total = Math.max(1, strength1 + strength2);
  const prob1 = strength1 / total;
  const prob2 = strength2 / total;
  return {
    team1: clamp((1 / prob1) * 0.9, 1.1, 4),
    team2: clamp((1 / prob2) * 0.9, 1.1, 4),
  };
}

function calculateTeamStrength(team, form) {
  const pointsFactor = Number(team.points || 0) * 4;
  const winrateFactor = getWinrate(team) * 0.28;
  const goalFactor = getGoalDiff(team) * 3;
  const playedConfidence = Math.min(Number(team.played || 0), 6) * 2;
  const formFactor = form.reduce((sum, item) => {
    if (item === "W") return sum + 5;
    if (item === "D") return sum + 2;
    if (item === "L") return sum - 2;
    return sum;
  }, 0);
  return clamp(28 + pointsFactor + winrateFactor + goalFactor + playedConfidence + formFactor, 10, 140);
}

async function getBetTotals(matchId) {
  const bets = await LeagueBet.find({ matchId, status: "pending" }).lean();
  return bets.reduce((totals, bet) => {
    if (bet.teamPick === 1) totals.team1 += Number(bet.amount || 0);
    if (bet.teamPick === 2) totals.team2 += Number(bet.amount || 0);
    return totals;
  }, { team1: 0, team2: 0 });
}

async function getMongoDb() {
  await waitForMongoose();
  return mongoose.connection.client.db("discord_casino");
}

async function getWallet(userId) {
  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ userId: String(userId) });
  return Number(user?.wallet || 0);
}

async function creditWallet(userId, amount) {
  const db = await getMongoDb();
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: Math.max(0, Number(amount) || 0) } },
    { upsert: true }
  );
}

async function recordTransaction(doc) {
  const db = await getMongoDb();
  await db.collection("transactions").insertOne({
    userId: String(doc.userId),
    amount: Number(doc.amount) || 0,
    reason: String(doc.reason || "عملية دوري"),
    timestamp: new Date(),
    type: doc.type || undefined,
    game: doc.game || "league",
    guildId: doc.guildId || null,
    channelId: doc.channelId || null,
    ref: doc.ref || null,
    balanceAfter: doc.balanceAfter ?? null,
  });
}

async function waitForMongoose(timeoutMs = 15000) {
  if (mongoose.connection.readyState === 1) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Mongoose connection timeout"));
    }, timeoutMs);
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      clearTimeout(timer);
      mongoose.connection.off("open", done);
      mongoose.connection.off("error", fail);
    };
    mongoose.connection.once("open", done);
    mongoose.connection.once("error", fail);
  });
}

async function getTextChannel(client, channelId, fallback = null) {
  let channel = null;
  if (channelId) {
    channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
  }
  if (!channel && fallback) channel = fallback;
  if (!channel?.send) return null;
  return channel;
}

async function replyPrivate(interaction, payload) {
  const data = typeof payload === "string" ? { content: payload } : { ...payload };
  if (interaction.guildId) data.ephemeral = true;
  if (interaction.replied || interaction.deferred) return interaction.followUp(data);
  return interaction.reply(data);
}

async function deferPrivate(interaction) {
  if (interaction.deferred || interaction.replied) return;
  const data = {};
  if (interaction.guildId) data.ephemeral = true;
  await interaction.deferReply(data);
}

async function editPrivate(interaction, payload) {
  const data = typeof payload === "string" ? { content: payload } : payload;
  if (interaction.deferred || interaction.replied) return interaction.editReply(data);
  return replyPrivate(interaction, data);
}

function parseAmount(value) {
  const cleaned = String(value || "").replace(/[^\d]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
}

function statusLabel(status) {
  const labels = {
    pending: "قادم",
    ready_check: "تجهيز",
    postponed: "مؤجل",
    game_selection: "اختيار لعبة",
    active: "نشطة",
    finished: "منتهية",
  };
  return labels[status] || status;
}

function matchResultText(match, viewerTeamId) {
  if (match.isDraw) return "تعادل";
  if (match.winnerTeamId === viewerTeamId) return "فوز";
  return "خسارة";
}

function getMatchOutcome(match, viewerTeamId) {
  if (match.status !== "finished") return { key: "none", text: "-" };
  if (match.isDraw) return { key: "draw", text: "تعادل" };
  if (match.winnerTeamId === viewerTeamId) return { key: "win", text: "فوز" };
  return { key: "loss", text: "خسارة" };
}

function makeMatchId(index) {
  return `m${Date.now().toString(36)}${index.toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sanitizeTeamName(raw) {
  return String(raw || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/<@!?&?\d+>/g, "")
    .replace(/@everyone|@here/gi, "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function truncateOption(text, max = 90) {
  const value = String(text || "");
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function truncateThreadName(text) {
  return truncateOption(String(text || "مباراة دوري").replace(/[^\p{L}\p{N}\s._-]/gu, "").trim(), 90);
}

function compactDiscordText(text) {
  const value = String(text || "");
  if (value.length <= 1900) return value;
  return `${value.slice(0, 1850)}\n...`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min));
}

function paintBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#061016");
  gradient.addColorStop(0.55, "#0b222d");
  gradient.addColorStop(1, "#071117");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(244,201,93,0.08)";
  ctx.lineWidth = 1;
  for (let x = -height; x < width; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }
}

function drawStatCard(ctx, x, y, w, h, label, value) {
  drawPanel(ctx, x, y, w, h, 18, "#102834");
  ctx.fillStyle = COLORS.muted;
  ctx.font = "21px Cairo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 38);
  ctx.fillStyle = COLORS.text;
  ctx.font = "700 29px Cairo, sans-serif";
  ctx.fillText(value, x + w / 2, y + 78);
}

function drawPanel(ctx, x, y, w, h, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  roundedPath(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.stroke();
  ctx.restore();
}

function roundedPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCellText(ctx, text, col, y) {
  ctx.textAlign = col.align || "center";
  let x = col.x + col.w / 2;
  if (col.align === "right") x = col.x + col.w - 6;
  if (col.align === "left") x = col.x + 6;
  ctx.fillText(String(text), x, y);
}

function drawSoftPill(ctx, x, y, w, h, text, color) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  drawPanel(ctx, x, y, w, h, 12, color);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.font = "700 18px Cairo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(text), x + w / 2, y + 21);
}

function drawRecentForm(ctx, matches, teamId, centerX, y) {
  const form = recentForm(teamId, matches);
  const colors = { W: COLORS.green, D: COLORS.yellow, L: COLORS.red, E: COLORS.gray };
  const startX = centerX - 48;
  form.reverse().forEach((item, index) => {
    ctx.fillStyle = colors[item] || COLORS.gray;
    ctx.beginPath();
    ctx.arc(startX + index * 24, y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function truncateCanvasTitle(text, maxChars) {
  const value = String(text || "");
  return value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;
}

function truncateCanvasText(ctx, text, maxWidth) {
  const value = String(text || "");
  if (ctx.measureText(value).width <= maxWidth) return value;
  let out = value;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function hashCode(value) {
  return String(value).split("").reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
}

module.exports = setupLeagueSystem;
