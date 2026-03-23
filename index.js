/********************************************************************************************
 *                                   DISCORD GAMBLING BOT                                   *
 *   نسخة جديدة مُحسنة بكامل التعديلات المطلوبة، مع MongoDB ونظام موحد للالعاب والرهانات   *
 ********************************************************************************************/

/******************************************
 * 1)         المتغيّرات العامة          *
 ******************************************/
const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,  ModalBuilder,  TextInputBuilder,TextInputStyle,AttachmentBuilder,StringSelectMenuOptionBuilder, Emoji
 } = require("discord.js");
const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
const activeGames = {};
const fs = require('fs');
const path = require('path');
const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,],}); require('dotenv').config();
const { createCanvas, loadImage , GlobalFonts } = require('@napi-rs/canvas');
const express = require("express");
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const genAIModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const whoAmIGames = new Map(); // حفظ جلسات لعبة مين أنا

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
// سجل Cairo-Regular
GlobalFonts.registerFromPath(
  path.join(__dirname, "assets/fonts/Cairo-Regular.ttf"),
  "Cairo"
);

// سجل Bitsy Arabic
GlobalFonts.registerFromPath(
  path.join(__dirname, "assets/fonts/Arabic Pixel 2.ttf"),
  "Arabic"
);

// سجل Press Start 2P
GlobalFonts.registerFromPath(
  path.join(__dirname, "assets/fonts/PressStart2P.ttf"),
  "PressStart2P"
);
global.assets = {};
async function preloadAssets() {
  assets.base = await loadImage(path.join(__dirname, "assets/templates/BUCKSHOT.png"));
  assets.heart = await loadImage(path.join(__dirname, "assets/icons/heart.png"));
  assets.bulletReal = await loadImage(path.join(__dirname, "assets/icons/bullet_real.png"));
  assets.bulletFake = await loadImage(path.join(__dirname, "assets/icons/bullet_fake.png"));
  assets.beer = await loadImage(path.join(__dirname, "assets/icons/beer.png"));
  assets.saw = await loadImage(path.join(__dirname, "assets/icons/saw.png"));
  assets.pills = await loadImage(path.join(__dirname, "assets/icons/pills.png"));
  assets.scope = await loadImage(path.join(__dirname, "assets/icons/scope.png"));
  assets.cuffs = await loadImage(path.join(__dirname, "assets/icons/cuffs.png"));
  assets.botAvatar = await loadImage(path.join(__dirname, "assets/icons/bot.png"));
  assets.heartEmpty = await loadImage(path.join(__dirname, "assets/icons/heartEmpty.png"));
  assets.cards = await loadImage(path.join(__dirname, "assets/icons/cards.png"));
  assets.blackjack = await loadImage(path.join(__dirname, "assets/templates/Blackjack.png"));
  assets["aceheart.png"] = await loadImage(path.join(__dirname, "assets/cards/aceheart.png"));
 assets["twoheart.png"] = await loadImage(path.join(__dirname, "assets/cards/twoheart.png"));
 assets["threeheart.png"] = await loadImage(path.join(__dirname, "assets/cards/threeheart.png"));
 assets["fourheart.png"] = await loadImage(path.join(__dirname, "assets/cards/fourheart.png"));
 assets["fiveheart.png"] = await loadImage(path.join(__dirname, "assets/cards/fiveheart.png"));
 assets["sixheart.png"] = await loadImage(path.join(__dirname, "assets/cards/sixheart.png"));
 assets["sevenheart.png"] = await loadImage(path.join(__dirname, "assets/cards/sevenheart.png"));
 assets["eightheart.png"] = await loadImage(path.join(__dirname, "assets/cards/eightheart.png"));
 assets["nineheart.png"] = await loadImage(path.join(__dirname, "assets/cards/nineheart.png"));
 assets["tenheart.png"] = await loadImage(path.join(__dirname, "assets/cards/tenheart.png"));
 assets["jackheart.png"] = await loadImage(path.join(__dirname, "assets/cards/jackheart.png"));
 assets["queenheart.png"] = await loadImage(path.join(__dirname, "assets/cards/queenheart.png"));
 assets["kingheart.png"] = await loadImage(path.join(__dirname, "assets/cards/kingheart.png"));
 assets["acespade.png"] = await loadImage(path.join(__dirname, "assets/cards/acespade.png"));
  assets["twospade.png"] = await loadImage(path.join(__dirname, "assets/cards/twospade.png"));
  assets["threespade.png"] = await loadImage(path.join(__dirname, "assets/cards/threespade.png"));
  assets["fourspade.png"] = await loadImage(path.join(__dirname, "assets/cards/fourspade.png"));
  assets["fivespade.png"] = await loadImage(path.join(__dirname, "assets/cards/fivespade.png"));
  assets["sixspade.png"] = await loadImage(path.join(__dirname, "assets/cards/sixspade.png"));
  assets["sevenspade.png"] = await loadImage(path.join(__dirname, "assets/cards/sevenspade.png"));
  assets["eightspade.png"] = await loadImage(path.join(__dirname, "assets/cards/eightspade.png"));
  assets["ninespade.png"] = await loadImage(path.join(__dirname, "assets/cards/ninespade.png"));
  assets["tenspade.png"] = await loadImage(path.join(__dirname, "assets/cards/tenspade.png"));
  assets["jackspade.png"] = await loadImage(path.join(__dirname, "assets/cards/jackspade.png"));
  assets["queenspade.png"] = await loadImage(path.join(__dirname, "assets/cards/queenspade.png"));
  assets["kingspade.png"] = await loadImage(path.join(__dirname, "assets/cards/kingspade.png"));
  assets["acediamond.png"] = await loadImage(path.join(__dirname, "assets/cards/acediamond.png"));
  assets["twodiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/twodiamond.png"));
  assets["threediamond.png"] = await loadImage(path.join(__dirname, "assets/cards/threediamond.png"));
  assets["fourdiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/fourdiamond.png"));
  assets["fivediamond.png"] = await loadImage(path.join(__dirname, "assets/cards/fivediamond.png"));
  assets["sixdiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/sixdiamond.png"));
  assets["sevendiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/sevendiamond.png"));
  assets["eightdiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/eightdiamond.png"));
  assets["ninediamond.png"] = await loadImage(path.join(__dirname, "assets/cards/ninediamond.png"));
  assets["tendiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/tendiamond.png"));
  assets["jackdiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/jackdiamond.png"));
  assets["queendiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/queendiamond.png"));
  assets["kingdiamond.png"] = await loadImage(path.join(__dirname, "assets/cards/kingdiamond.png"));
  assets["aceclub.png"] = await loadImage(path.join(__dirname, "assets/cards/aceclub.png"));
  assets["twoclub.png"] = await loadImage(path.join(__dirname, "assets/cards/twoclub.png"));
  assets["threeclub.png"] = await loadImage(path.join(__dirname, "assets/cards/threeclub.png"));
  assets["fourclub.png"] = await loadImage(path.join(__dirname, "assets/cards/fourclub.png"));
  assets["fiveclub.png"] = await loadImage(path.join(__dirname, "assets/cards/fiveclub.png"));
  assets["sixclub.png"] = await loadImage(path.join(__dirname, "assets/cards/sixclub.png"));
  assets["sevenclub.png"] = await loadImage(path.join(__dirname, "assets/cards/sevenclub.png"));
  assets["eightclub.png"] = await loadImage(path.join(__dirname, "assets/cards/eightclub.png"));
  assets["nineclub.png"] = await loadImage(path.join(__dirname, "assets/cards/nineclub.png"));
  assets["tenclub.png"] = await loadImage(path.join(__dirname, "assets/cards/tenclub.png"));
  assets["jackclub.png"] = await loadImage(path.join(__dirname, "assets/cards/jackclub.png"));
  assets["queenclub.png"] = await loadImage(path.join(__dirname, "assets/cards/queenclub.png"));
  assets["kingclub.png"] = await loadImage(path.join(__dirname, "assets/cards/kingclub.png"));  
  assets["cardback.png"] = await loadImage(path.join(__dirname, "assets/cards/cardback.png"));
  assets.cardback = await loadImage(path.join(__dirname, "assets/cards/cardback.png"));
  assets.winnerBackground = await loadImage(path.join(__dirname, "assets/templates/winnerBackground.png"));
  assets.solobus = await loadImage(path.join(__dirname, "assets/templates/solobus.png"));
assets.slot = await loadImage(path.join(__dirname, "assets/templates/Slot.png"));
assets.slotdiamond = await loadImage(path.join(__dirname, "assets/icons/Slotdiamond.png"));
assets.slotmelon = await loadImage(path.join(__dirname, "assets/icons/Slotmelon.png"));
assets.slotlemon = await loadImage(path.join(__dirname, "assets/icons/Slotlemon.png"));
assets.slotbell = await loadImage(path.join(__dirname, "assets/icons/Slotbell.png"));
assets.slotseven = await loadImage(path.join(__dirname, "assets/icons/Slotseven.png"));
assets.slotcherry = await loadImage(path.join(__dirname, "assets/icons/Slotcherry.png"));
assets.temproom = await loadImage(path.join(__dirname, "assets/templates/temproom.png"));
assets.explosion = await loadImage(path.join(__dirname, "assets/templates/explosion.png"));
assets.mysterybox = await loadImage(path.join(__dirname, "assets/templates/mysterybox.png"));
assets.closedbox = await loadImage(path.join(__dirname, "assets/templates/closedbox.png"));
assets.roulletesolo = await loadImage(path.join(__dirname, "assets/templates/roulletesolo.png"));

}
preloadAssets();

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
async function loadUserAvatar(user) {
  const url = user.displayAvatarURL({ extension: "png", size: 256 });
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return await loadImage(buffer);
}
function drawCircularImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}

/******************************************
 * 2)        الاتصال بـ MongoDB          *
 ******************************************/
const mongoUrl = "mongodb+srv://Nael:i8VFiKISASCUzX5O@discordbot.wzwjonu.mongodb.net/?retryWrites=true&w=majority&appName=DiscordBot";
const mongoClient = new MongoClient(mongoUrl);
let db;

async function connectToMongo() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("discord_casino");
    console.log(" MongoDB Connected!");


  } catch (err) {

    console.error(" MongoDB Connection Error:", err);
  }
}
connectToMongo();


mongoose.connect('mongodb+srv://Nael:i8VFiKISASCUzX5O@discordbot.wzwjonu.mongodb.net/discord_casino?retryWrites=true&w=majority&appName=DiscordBot')
  .then(() => console.log('<:icons8correct1002:1415979896433278986> Mongoose Connected!'))
  .catch((err) => console.error('<:icons8wrong1001:1415979909825695914> Mongoose Connection Error:', err));




client.login(process.env.DISCORD_TOKEN);


// ===== Router عام للتفاعلات والاوامر + الرسائل =====
function createUIRouter(client) {
  const routes = {
    buttons: [],
    selects: [],
    modals: [],
    commands: [], // دعم قديم (exact/prefix/regex) — يبقى كما هو
    messages: {   // واجهة رسائل جديدة: exact/prefix/filter
      exact: new Map(),     // content -> [handler]
      prefix: [],           // [{ prefix, handler }]
      filters: []           // [{ predicate, handler }]
    }
  };

  // ادوات تطابق
  function matchPattern(pattern, text) {
    // يحوّل: bet_add_{inc}_{userId}_{gameId}_{current}
    // الى Regex يلتقط القيم بين الـ _
    const keys = [];
    const regexStr = '^' + pattern.replace(/{(\w+)}/g, (_, k) => {
      keys.push(k);
      return '([^_]+)';
    }) + '$';
    const re = new RegExp(regexStr);
    const m = re.exec(text);
    if (!m) return null;
    const out = {};
    keys.forEach((k, i) => out[k] = m[i + 1]);
    return out;
  }

  function makeMatcher(type, matcher) {
    return (value) => {
      if (type === 'exact') return value === matcher;
      if (type === 'prefix') return value.startsWith(matcher);
      if (type === 'regex') return matcher.test(value);
      if (type === 'pattern') return matchPattern(matcher, value);
      return false;
    };
  }

  // تسجيل مسارات التفاعلات
  function buttonExact(id, handler) { routes.buttons.push({ type:'exact', matcher: makeMatcher('exact', id), handler }); }
  function buttonPrefix(prefix, handler) { routes.buttons.push({ type:'prefix', matcher: makeMatcher('prefix', prefix), handler }); }
  function buttonRegex(regex, handler) { routes.buttons.push({ type:'regex', matcher: makeMatcher('regex', regex), handler }); }
  function buttonPattern(pattern, handler) { routes.buttons.push({ type:'pattern', matcher: makeMatcher('pattern', pattern), handler, pattern }); }

  function selectExact(id, handler) { routes.selects.push({ type:'exact', matcher: makeMatcher('exact', id), handler }); }
  function selectPrefix(prefix, handler) { routes.selects.push({ type:'prefix', matcher: makeMatcher('prefix', prefix), handler }); }
  function selectPattern(pattern, handler) { routes.selects.push({ type:'pattern', matcher: makeMatcher('pattern', pattern), handler, pattern }); }

  function modalExact(id, handler) { routes.modals.push({ type:'exact', matcher: makeMatcher('exact', id), handler }); }
  function modalPrefix(prefix, handler) { routes.modals.push({ type:'prefix', matcher: makeMatcher('prefix', prefix), handler }); }
  function modalPattern(pattern, handler) { routes.modals.push({ type:'pattern', matcher: makeMatcher('pattern', pattern), handler, pattern }); }

  // “اوامر” قديمة (تُحافظ عليها للرجعية)
  function commandExact(text, handler) { routes.commands.push({ type:'exact', text, handler }); }
  function commandPrefix(prefix, handler) { routes.commands.push({ type:'prefix', prefix, handler }); }
  function commandRegex(regex, handler) { routes.commands.push({ type:'regex', regex, handler }); }

  // واجهة الرسائل الجديدة (مطابقة اسلوب ui.messageExact/... الذي تستخدمه)
  function messageExact(text, handler) {
    const key = String(text).trim();
    if (!routes.messages.exact.has(key)) routes.messages.exact.set(key, []);
    routes.messages.exact.get(key).push(handler);
  }
  function messagePrefix(prefix, handler) {
    routes.messages.prefix.push({ prefix: String(prefix), handler });
  }
  function messageFilter(predicate, handler) {
    routes.messages.filters.push({ predicate, handler });
  }

  // نقطة التركيب الوحيدة
  function mount() {
    // توجيه جميع التفاعلات
    client.on('interactionCreate', async (i) => {
      try {
        if (i.isButton && i.isButton()) {
          const id = i.customId;
          for (const r of routes.buttons) {
            const m = r.matcher(id);
            if (m) return r.handler(i, m === true ? {} : m);
          }
        } else if (i.isStringSelectMenu && i.isStringSelectMenu()) {
          const id = i.customId;
          for (const r of routes.selects) {
            const m = r.matcher(id);
            if (m) return r.handler(i, m === true ? {} : m);
          }
        } else if (i.isModalSubmit && i.isModalSubmit()) {
          const id = i.customId;
          for (const r of routes.modals) {
            const m = r.matcher(id);
            if (m) return r.handler(i, m === true ? {} : m);
          }
        }
      } catch (err) {
        console.error('Router interaction error:', err);
        try { if (!i.replied && !i.deferred) await i.reply({ content: 'حدث خطا غير متوقع.', ephemeral: true }); } catch {}
      }
    });

    // توجيه جميع رسائل النص
    client.on('messageCreate', async (msg) => {
      try {
        if (msg.author?.bot) return;
        const text = msg.content?.trim() || '';
        // (1) مطابقة تامة — يسمح بتعدد المعالجات لنفس النص
        const exactList = routes.messages.exact.get(text);
        if (exactList && exactList.length) {
          for (const h of exactList) {
            try { await h(msg); } catch (e) { console.error('messageExact handler failed:', e); }
          }
          return;
        }

        // (2) مطابقة Prefix — اول تطابق يفوز (نمرّر الباقي اختيارياً)
        for (const { prefix, handler } of routes.messages.prefix) {
          if (text.startsWith(prefix)) {
            const rest = text.slice(prefix.length).trim();
            try { await handler(msg, rest); } catch (e) { console.error('messagePrefix handler failed:', e); }
            return;
          }
        }

        // (3) مرشحات مخصصة — اول predicate=true يفوز
        for (const { predicate, handler } of routes.messages.filters) {
          let ok = false;
          try { ok = await predicate(msg); } catch {}
          if (ok) {
            try { await handler(msg); } catch (e) { console.error('messageFilter handler failed:', e); }
            return;
          }
        }

        // (4) دعم الرجعية: اوامر commands القديمة (exact/prefix/regex)
        for (const r of routes.commands) {
          if (r.type === 'exact' && text === r.text) return r.handler(msg);
          if (r.type === 'prefix' && text.startsWith(r.prefix)) return r.handler(msg, text.slice(r.prefix.length).trim());
          if (r.type === 'regex') {
            const m = r.regex.exec(text);
            if (m) return r.handler(msg, m);
          }
        }
      } catch (err) {
        console.error('Router message error:', err);
      }
    });
  }

  return {
    // تفاعلات
    buttonExact, buttonPrefix, buttonRegex, buttonPattern,
    selectExact, selectPrefix, selectPattern,
    modalExact, modalPrefix, modalPattern,
    // اوامر قديمة (للتوافق)
    commandExact, commandPrefix, commandRegex,
    // رسائل جديدة
    messageExact, messagePrefix, messageFilter,
    // تشغيل
    mount,
  };
}
// انشئ الراوتر مرّة واحدة اعلى الملف
const ui = createUIRouter(client);
// ربط دوال التحويل بالراوتر عشان تشتغل الأزرار والقائمة
ui.messageExact("تحويل", handleTransferMessage);
ui.selectExact("bank_transfer_select_user", handleTransferSelectUser);
ui.buttonPrefix("bank_transfer_key_", handleTransferKeys);
// ===== Solo Bet Flow =====
ui.buttonExact("hit", handleMultiplayerBlackjackInteraction);
ui.buttonExact("stand", handleMultiplayerBlackjackInteraction);
ui.buttonPrefix("color_", handleColorWarButton);
ui.buttonPrefix("withdraw_", handleTimeRoomWithdraw);
// سجل ازرار اللعبة في الراوتر
ui.buttonPrefix("roulette_", handleRouletteButtons);

// سجّل الزر مع راوتر التفاعلات
ui.buttonPrefix("passbomb_", handleBombPass);

// اختيار لعبة متعددة اللاعبين
ui.selectExact("select_multi_game", handleSelectMultiGame);

ui.buttonPrefix("soloxo_", handleSoloXOButtons);
ui.buttonPrefix("multixo_", handleMultiXOButtons);
ui.messageExact("اكس او", (msg) => handleTextGameShortcut(msg, "soloxo"));
ui.buttonPrefix("hide_", handleHideButtons);

// ازرار اللوبي
ui.buttonExact("lobby_join", handleLobbyJoin);
ui.buttonExact("lobby_bet", handleLobbyBet);
ui.buttonExact("lobby_leave", handleLobbyLeave);
ui.buttonExact("lobby_start", handleLobbyStart);

// مودالات الرهان
ui.modalPattern("force_bet_modal_{userId}_{gameId}", handleForceBetModal);
ui.modalPattern("bet_modal_{userId}_{gameId}", handleBetModal);

// ===== Menus =====
ui.selectExact('minigame_menu', handleMinigameMenu);
ui.buttonExact('minigame_stats', handleMinigameStats);

ui.selectExact('shop_section_select', handleShopSelect);
ui.selectExact('punishments_menu', handleShopSelect);
ui.selectExact('roles_menu', handleShopSelect);
ui.selectExact('jail_menu', handleShopSelect);
ui.selectExact('gambling_menu', handleShopSelect);

ui.buttonExact('shop_back', handleShopButtons);
ui.buttonExact('confirm_roles_purchase', handleShopButtons);
ui.buttonExact('confirm_mention_jail', handleShopButtons);
ui.buttonExact('confirm_mention_bail', handleShopButtons);
ui.buttonExact('confirm_visit', handleShopButtons);
ui.buttonExact('confirm_timeout', handleShopButtons);
ui.buttonExact('confirm_mute', handleShopButtons);
ui.buttonExact('confirm_steal', handleShopButtons);

// ===== Harf (Lobby + Game) =====
ui.buttonPrefix('harf_', handleHarfButtons);
ui.modalExact('harf_submit_modal', handleHarfModalSubmit);

// ===== Specific Games =====
// Blackjack solo
ui.buttonExact('bj_hit', handleBjHit);
ui.buttonExact('bj_stand', handleBjStand);
ui.buttonExact('bj_quit', handleBjQuit);
ui.buttonPrefix('bus_', handleBusButtons)


// Buckshot solo
ui.buttonPrefix('buck_', handleBuckshotSoloButtons);

// Mystery Box
ui.buttonExact('box_quit', handleBoxButtons);
ui.buttonPrefix('box_', handleBoxButtons); // box_1, box_2, box_3

/******************************************
 * 🔌 ربط تريفيا مع الراوتر
 ******************************************/
ui.messageExact("تريفيا", handleTriviaStartMessage);
ui.buttonPrefix("trivia_answer_", handleTriviaAnswerButton);
ui.buttonExact("trivia_restart", handleTriviaControlButtons);
ui.buttonExact("trivia_end", handleTriviaControlButtons);

/******************************************
 * ربط القائمة الموحدة مع الراوتر
 ******************************************/
ui.messageExact("قمار", handleGambleMainMenu);
ui.messageExact("511", handleGambleMainMenu);
ui.buttonExact("gamble_solo", handleGambleCategory);
ui.buttonExact("gamble_multi", handleGambleCategory);
ui.buttonExact("back_to_main", handleBackToMain);
ui.buttonExact("solostats", handleSoloStatsButton);
ui.buttonExact("multi_stats", handleMultiStatsButton);

ui.messageExact("روليت", (msg) => handleTextGameShortcut(msg, "soloroulette"));
ui.messageExact("بلاكجاك", (msg) => handleTextGameShortcut(msg, "blackjack"));
ui.messageExact("بلاك جاك", (msg) => handleTextGameShortcut(msg, "blackjack"));
ui.messageExact("سلوت ", (msg) => handleTextGameShortcut(msg, "soloslot"));
ui.messageExact("صندوق الحظ", (msg) => handleTextGameShortcut(msg, "solomystery"));
ui.messageExact("صندوق ", (msg) => handleTextGameShortcut(msg, "solomystery"));

// مجموعات نصوص لتحدي الاوراق وباكشوت
const cardTriggers = ["تحدي الاوراق", "الاوراق", "الأوراق", "تحدي الأوراق"];
const buckshotTriggers = ["باكشوت", "باك شوت", "بكشوت", "بك شوت"];

for (const t of cardTriggers) ui.messageExact(t, (msg) => handleTextGameShortcut(msg, "solobus"));
for (const t of buckshotTriggers) ui.messageExact(t, (msg) => handleTextGameShortcut(msg, "buckshot"));

ui.messageExact("رصيد", handleWalletMessage);

ui.buttonPrefix("solo_roulette_color_", handleSoloRouletteButtons);
ui.buttonPrefix("solo_roulette_parity_", handleSoloRouletteButtons);
ui.buttonPrefix("solo_roulette_range_", handleSoloRouletteButtons);
ui.buttonExact("solo_roulette_cancel", handleSoloRouletteButtons);

// ===== Message Commands =====
ui.commandExact('المتجر', handleShopCommandMsg);
ui.commandExact('ميني', handleMinigamesCommandMsg);
ui.messagePrefix?.("تحويل", handleTransferMessage);
ui.messageFilter?.((msg) => msg.content.trim().startsWith("تحويل"), handleTransferMessage);
ui.messageExact("كشف", handleStatementMessage);

ui.messageFilter(
  (m) => {
    try {
      if (!m?.author || m.author.bot) return false;
      const game = whoAmIGames.get(m.author.id);
      return Boolean(game && game.status === 'playing' && game.channelId === m.channelId);
    } catch { return false; }
  },
  handleWhoAmIMessage
);

// فعّل الراوتر بعد التسجيل
ui.mount();

// ===== Menus =====
function handleMinigameMenu(i) { return handleMinigameInteraction(i, db); }
function handleMinigameStats(i) { return handleMinigameInteraction(i, db); }
function handleShopSelect(i) { return handleShopInteraction(i, db); }
function handleShopButtons(i) { return handleShopInteraction(i, db); }


function handleHarfModalSubmit(i) { return handleHarfModal(i); }

function handleShopCommandMsg(message) {
  // نفس سطر: return handleShopCommand(message);
  return handleShopCommand(message);
}

function handleMinigamesCommandMsg(message) {
  return handleMinigamesCommand(message);
}

/******************************************
 * ربط اوامر/تفاعلات الميني قيمز، المتجر، ولعبة حرف عبر الراوتر
 * (نفس المنطق والمخرجات، بدون مستمعات مباشرة)
 ******************************************/

// =====[ استيرادات ]=====
const handleMinigamesCommand = require("./commands/minigames");            // قائمة الميني قيمز (يفتح من امر "ميني")
const handleMinigameInteraction = require("./events/interactionHandler");  // معالج اختيارات الميني قيمز

const handleShopCommand = require("./commands/shop");  // امر "المتجر"
const handleShopInteraction = require("./shop");       // تفاعلات المتجر
// لعبة حرف (داخل مجلد games)
const harfModule = require("./games/harf");
const startHarfGame = harfModule.startHarfGame || harfModule;                  // يدعم حالتي التصدير
const showHarfLobby = harfModule.showHarfLobby || (async () => {});
const handleHarfLobbyInteraction = harfModule.handleHarfLobbyInteraction || (async () => {});
const handleHarfInteraction = harfModule.handleHarfInteraction || (async () => {});
const handleHarfModal = harfModule.handleHarfModal || (async () => {});
const handleHarfVote = harfModule.handleVote || (async () => {});             // ربط التصويت

/******************************************
 * اوامر الرسائل (بدون messageCreate)
 ******************************************/

// 🔤 "حرف" → افتح لوبي لعبة حرف
ui.messageExact("حرف", async (msg) => {
  try {
    await startHarfGame(msg.channel.id);     // تهيئة الحالة
    return showHarfLobby(msg.channel);       // عرض اللوبي
  } catch (e) {
    console.error("حرف start error:", e);
    return msg.reply("<:icons8wrong1001:1415979909825695914> ما قدرت ابدا لعبة حرف.");
  }
});

// ===== Harf (Lobby + Game) =====
// معالج واحد لكل ازرار harf_* يتجاهل ازرار التصويت ويمررها لمعالج التصويت
async function handleHarfButtons(i) {
  try {
    // لو كانت ازرار تصويت، مررها مباشرة لمعالج التصويت ثم انهِ
    if (i.customId.startsWith("harf_vote_")) {
      await handleHarfVote(i);
      if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});
      return;
    }

    // غير ذلك: مرر للّوبي ثم للّعبة
    await handleHarfLobbyInteraction(i);
    await handleHarfInteraction(i);
  } catch (e) {
    console.error("harf handler:", e);
  } finally {
    // لو ما صار رد/تاجيل من اي معالج → نتفادى فشل التفاعل
    if (!i.deferred && !i.replied) {
      await i.deferUpdate().catch(() => {});
    }
  }
}

// ربط عام لازرار لعبة حرف (يشمل كل شيء، والتصويت يُفلتر في الداخل)
ui.buttonPrefix("harf_", handleHarfButtons);

// مودال ادخال الكلمة اثناء اللعب
ui.modalExact("harf_submit_modal", async (i) => {
  try { return handleHarfModal(i); } catch (e) { console.error("harf modal:", e); }
});

/******************************************
 * تفاعلات الميني قيمز (بدون interactionCreate)
 ******************************************/

// قائمة الميني قيمز + زر الاحصائيات
ui.selectExact("minigame_menu", async (i) => {
  try { return handleMinigameInteraction(i, db); } catch (e) { console.error("minigame menu:", e); }
});
ui.buttonExact("minigame_stats", async (i) => {
  try { return handleMinigameInteraction(i, db); } catch (e) { console.error("minigame stats:", e); }
});



/******************************************
 * 3)        نظام المحفظة الجديد          *
 ******************************************/

// المعرّف الثابت لقناة الترحيب
const WELCOME_CHANNEL_ID = "1393900700907606109";

// مُساعد: إنشاء مصنع مجاني للمستخدم إن لم يكن موجوداً
// إنشاء مصنع مجاني للمستخدم باسم النيك نيم الحالي
async function createFreeFactoryForUser(ownerId, options = {}) {
  const uid = String(ownerId);
  const now = new Date();

  // تحقق: مصنع موجود مسبقاً؟
  const existing = await db.collection("companies").findOne({ ownerId: uid, type: "factory" });
  if (existing) {
    return { created: false, name: existing.name, ipoPrice: existing.ipoPrice };
  }

  // دالة داخلية لاشتقاق اسم العرض (النيك نيم) بأفضل محاولة
  const resolveDisplayName = async () => {
    try {
      // 1) لو تم تمرير العضو مباشرة
      if (options.member) {
        const m = options.member;
        const nick = m.displayName || m.nickname || m.user?.globalName || m.user?.username;
        if (nick) return nick;
      }

      // 2) لو تم تمرير guild
      if (options.guild && typeof options.guild.members?.fetch === "function") {
        const m = await options.guild.members.fetch(uid).catch(() => null);
        if (m) {
          const nick = m.displayName || m.nickname || m.user?.globalName || m.user?.username;
          if (nick) return nick;
        }
      }

      // 3) محاولة عبر قناة معروفة (WELCOME_CHANNEL_ID) أو channelId الممرر
      const channelIdHint = options.channelId || (typeof WELCOME_CHANNEL_ID !== "undefined" ? WELCOME_CHANNEL_ID : null);
      if (typeof client !== "undefined" && channelIdHint) {
        let ch = client?.channels?.cache?.get(channelIdHint);
        if (!ch && typeof client?.channels?.fetch === "function") {
          ch = await client.channels.fetch(channelIdHint).catch(() => null);
        }
        const guild = ch?.guild;
        if (guild) {
          const m = await guild.members.fetch(uid).catch(() => null);
          if (m) {
            const nick = m.displayName || m.nickname || m.user?.globalName || m.user?.username;
            if (nick) return nick;
          }
        }
      }

      // 4) احتياط: اسم المستخدم من API
      if (typeof client !== "undefined" && typeof client.users?.fetch === "function") {
        const u = await client.users.fetch(uid).catch(() => null);
        if (u?.globalName || u?.username) return u.globalName || u.username;
      }
    } catch {}

    // 5) احتياط أخير
    return `User-${uid.slice(-4)}`;
  };

  // اسم الشركة = النيك نيم الحالي (أو الخيارات إن مررت اسماً صريحاً)
  const displayName = options.name || await resolveDisplayName();
  const safeName = String(displayName).trim().slice(0, 64) || `User-${uid.slice(-4)}`;
  const name = safeName; // بدون بادئة "مصنع" كما طلبت

  // إعداد سعر الطرح (1..100)
  const ipoPrice =
    Number.isInteger(options.ipoPrice) && options.ipoPrice >= 1 && options.ipoPrice <= 100
      ? options.ipoPrice
      : 10;

  // نفس منطق اختيار الموظفين كما في الكود الأصلي
  const serverMembers = [
    { name: "نايل", id: "532264405476573224" },{ name: "ايفا", id: "1270057947334185053" },
    { name: "روبي", id: "1374244101205131274" },{ name: "شكشوكه", id: "1106288355228004372" },
    { name: "لافندر", id: "545613574874071063" },{ name: "كركم", id: "1097381729007849554" },
    { name: "جبنة", id: "359427305979772938" },{ name: "خالد", id: "734187812236034108" },
    { name: "وحيدا", id: "696302530937880666" },{ name: "سفن", id: "955228953113681970" }
  ];
  const shuffled = [...serverMembers].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);
  const roles = ["حفار", "حداد", "مجوهراتي", "مهندس", "طبيب"];
  const salaries = [4000, 5000, 7000, 8000, 6000];
  const employees = selected.map((u, i) => ({
    role: roles[i],
    name: u.name,
    userId: u.id,
    salary: salaries[i],
    loyalty: 1.0
  }));

  // إدخال الشركة (بدون خصم رصيد)
  await db.collection("companies").insertOne({
    ownerId: uid,
    type: "factory",
    name,
    ipoPrice,
    level: 1,
    reputation: { score: 100, loyalty: 1.0 },
    employees,
    upgrades: [],
    inventory: {},
    events: [],
    dailyIncome: 12500,
    lastCollected: now,
    lastProcessed: now,
    grant: { source: "wallet-open", at: now } // منحة مجانية عند فتح المحفظة
  });

  // إدخال السهم الخاص بالمصنع
  await db.collection("stocks").insertOne({
    symbol: `FAC-${uid}`,
    name,
    type: "player",
    price: ipoPrice,
    ownerId: uid,
    cursorDate: "2021-01-01"
  });

  return { created: true, name, ipoPrice };
}
// getBalance: ينشئ محفظة 100000 ريال + يسجل وقت الفتح + ينشئ مصنعاً مجاناً + يرسل رسالة ترحيب في قناة محددة
// ملاحظة: يتوقع وجود متغير client في نفس السياق (discord.js Client)
async function getBalance(userId, notifyTarget = null) {
  const uid = String(userId);
  const user = await db.collection("users").findOne({ userId: uid });

  // مُرسِل إشعار عام (احتياطي: يستخدم notifyTarget إن توفر)
  const sendNotifyFallback = async (text) => {
    try {
      if (!notifyTarget) return;
      if (typeof notifyTarget === "function") return await notifyTarget(text);
      if (notifyTarget && typeof notifyTarget.send === "function") return await notifyTarget.send(text);
    } catch {}
  };

  // مُرسل القناة الثابتة
  const sendToWelcomeChannel = async (text) => {
    try {
      // يتطلب client (discord.js) متاح في النطاق
      const ch =
        client?.channels?.cache?.get(WELCOME_CHANNEL_ID) ||
        (client?.channels?.fetch ? await client.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null) : null);
      if (ch && typeof ch.send === "function") {
        return await ch.send(text);
      }
      // في حال الفشل، جرّب الإشعار الاحتياطي إن توفّر
      return await sendNotifyFallback(text);
    } catch (e) {
      console.error("welcome notify error:", e);
      return await sendNotifyFallback(text);
    }
  };

  if (!user) {
    const now = new Date();

    // إنشاء محفظة جديدة
    const openingBonus = 100000; // مكافأة الفتح
    const newUser = {
      userId: uid,
      wallet: 100000,
      walletOpenedAt: now,         // وقت فتح الحساب
      stats: { createdAt: now }    // الحقل السابق للإحصاءات
    };
    await db.collection("users").insertOne(newUser);

    // إنشاء مصنع مجاني (مرة واحدة فقط)
    const factory = await createFreeFactoryForUser(uid);

    // رسالة الترحيب — تُرسل دائماً إلى القناة الثابتة
    const lines = [
      `<@${uid}>`,
      "🏦 تم فتح حسابك في بنك Milkyway.",
      `رقم حسابك: ${uid}`,
      `تمت إضافة ${openingBonus.toLocaleString("en-US")} ريال دعماً من معالي نايل.`,
      `🏭 تم إضافة مشروع مصنع مجاني باسمك${factory.name ? `: ${factory.name}` : ""}.`
    ];
    await sendToWelcomeChannel(lines.join("\n"));

    // أعِد قيمة الرصيد الفعلي
    return openingBonus;
  }

  return user.wallet || 0;
}

async function addBalance(userId, amount) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: amount } },
    { upsert: true }
  );
}

async function setBalance(userId, amount) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $set: { wallet: amount } },
    { upsert: true }
  );
}

async function subtractBalance(userId, amount) {
  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $inc: { wallet: -Math.abs(amount) } },
    { upsert: true }
  );
}

// 📦 دوال المتجر - ضيفها بجانب دوال الاقتصاد

async function getShopItems(section) {
  return await db.collection("shop_items").find({ section }).toArray();
}

async function getUserInventory(userId) {
  const user = await db.collection("user_items").findOne({ userId });
  return user?.items || {};
}

async function canBuyItem(userId, item) {
  const balance = await getBalance(userId);
  if (balance < item.price) return { ok: false, reason: "<:icons8wrong1001:1415979909825695914> رصيدك لا يكفي." };
  if (item.stock <= 0) return { ok: false, reason: "<:icons8wrong1001:1415979909825695914> الغرض غير متوفر حالياً." };

  const inventory = await getUserInventory(userId);
  const owned = inventory[item.itemId] || 0;
  if (owned >= item.maxPerUser) return { ok: false, reason: "<:icons8wrong1001:1415979909825695914> لا يمكنك شراء اكثر من نسخة." };

  return { ok: true };
}

async function buyItem(userId, item) {
  await subtractBalance(userId, item.price);
  await db.collection("shop_items").updateOne({ itemId: item.itemId }, { $inc: { stock: -1 } });
  await db.collection("user_items").updateOne(
    { userId },
    { $inc: { [`items.${item.itemId}`]: 1 } },
    { upsert: true }
  );
}

// <:icons8correct1002:1415979896433278986> تحديث الرصيد + اضافة كشف حساب
async function updateBalanceWithLog(db, userId, amount, reason) {
  const users = db.collection("users");
  const transactions = db.collection("transactions");

  // 1. تعديل الرصيد في نفس الحقل wallet
  await users.updateOne(
    { userId: String(userId) }, // <:icons8correct1002:1415979896433278986> مو id
    { $inc: { wallet: amount } }, // <:icons8correct1002:1415979896433278986> مو balance
    { upsert: true }
  );

  // 2. اضافة سجل كشف الحساب
  await transactions.insertOne({
    userId: String(userId),
    amount,
    reason,
    timestamp: new Date()
  });
}

/******************************************
 * 📑 كشف الحساب — ربط مع الراوتر (بدون listeners مباشرة)
 ******************************************/

async function handleStatementMessage(msg) {
  try {
    if (msg.author?.bot) return;

    const userId = msg.author.id;
    const transactions = db.collection("transactions");

    // نستخدم userId كسلسلة نصية تماشياً مع نظام المحفظة
    const docs = await transactions
      .find({ userId: String(userId) })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    if (!docs.length) {
      return msg.reply("📭 لا يوجد اي عمليات مسجلة لحسابك.");
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 كشف العمليات الاخيرة")
      .setColor("Green");

    docs.forEach((tx, i) => {
      const date = tx.timestamp ? new Date(tx.timestamp) : new Date();
      const ts = Math.floor(date.getTime() / 1000);

      const amt = Number(tx.amount) || 0;
      const amtView = amt > 0 ? `+${amt.toLocaleString("en-US")}` : `${amt.toLocaleString("en-US")}`;

      embed.addFields({
        name: `**${i + 1} - ${tx.reason || "عملية"}**`,
        value: `<:ryal:1407444550863032330> ${amtView} \n🗓️ <t:${ts}:f> \n`,
        inline: false
      });
    });

    return msg.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Statement route error:", err);
    return msg.reply("<:icons8wrong1001:1415979909825695914> حدث خطا اثناء جلب كشف الحساب.").catch(() => {});
  }
}



/******************************************
 *لعبة ورردل Wordle عربية   *
 ******************************************/

// ===== Wordle Arabic (4 أحرف، رسائل جديدة، صورة حروف) =====
const dictionary = require("./data/dictionary.json");

// ثابت الطول وعدد المحاولات والمكافأة
const WORDLE_LEN = 4;
const WORDLE_MAX_ATTEMPTS = 5;
const WORDLE_REWARD = 10000;

// فلترة قاموس الكلمات إلى 4 أحرف فقط
const WORDLE_WORDS = Array.isArray(dictionary)
  ? dictionary
      .filter(w => typeof w === "string")
      .map(w => w.trim())
      .filter(w => [...w].length === WORDLE_LEN)
  : [];

// جلسات لكل مستخدم
// userId -> { word, attempts, history, letterStates, currentMessage, ended }
const wordleSessions = new Map();

// حروف عربية أساسية + حالات إضافية
const ARABIC_ALPHABET = [
  "ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض",
  "ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي","ة","ى","ؤ","ئ","ء"
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// تحديث حالات الحروف: green > purple > grey
function updateLetterStates(states, guessChars, colorTags) {
  for (let i = 0; i < guessChars.length; i++) {
    const ch = guessChars[i];
    const c = colorTags[i]; // green/purple/grey
    const prev = states[ch];
    if (c === "green") {
      states[ch] = "green";
    } else if (c === "purple") {
      if (prev !== "green") states[ch] = "purple";
    } else if (c === "grey") {
      if (!prev) states[ch] = "grey";
    }
  }
}

// إنتاج ألوان كل حرف للتخمين بناءً على الكلمة السرية
function judgeGuess(guessRaw, secretRaw) {
  const guess = [...String(guessRaw)];
  const secret = [...String(secretRaw)];
  const len = WORDLE_LEN;

  const res = new Array(len).fill("grey");
  const remaining = {};

  // أخضر أولاً
  for (let i = 0; i < len; i++) {
    if (guess[i] === secret[i]) {
      res[i] = "green";
    } else {
      const ch = secret[i];
      remaining[ch] = (remaining[ch] || 0) + 1;
    }
  }
  // بنفسجي ثم رمادي
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
  return res; // مصفوفة ألوان لكل موضع
}

// خريطة الألوان لزر ديسكورد
const styleOf = (c) => (c === "green" ? 3 : c === "purple" ? 1 : 2);

// إنشاء صف أزرار واحد من نتيجة تخمين
// withQuitOrRestart: "quit" | "restart"
// استبدل الدالة السابقة بهذه النسخة
function buildRowComponents(letters, colors, userId, attemptNo, action, enabled) {
  // أزرار الحروف (معطّلة دومًا)
  const letterButtons = letters.map((ch, idx) => ({
    type: 2,
    style: styleOf(colors[idx]), // green=3, purple=1, grey=2
    label: ch,
    custom_id: `wordle_lock_${userId}_${attemptNo}_${idx}`,
    disabled: true
  }));

  // قلب الترتيب شكليًا فقط كما هو مطلوب في الصف
  letterButtons.reverse();

// زر الإجراء (انسحاب أو إعادة) — مفعّل فقط إذا enabled=true وإلا Disabled + Secondary
let actionButton;
if (action === "restart") {
  actionButton = {
    type: 2,
    style: enabled ? 3 : 2, // Success عند التمكين، وإلا Secondary
    // لو تبي إعادة تكون إيموجي فقط أيضاً:
    // emoji: { name: "🔁" },
    emoji: { id: "1416507901425614948", name: ":icons8retry100:" }, // إيموجي مخصص
    custom_id: `wordle_restart_${userId}_${attemptNo}`,
    disabled: !enabled
  };
} else {
  // انسحاب بإيموجي فقط (بدون label)
  actionButton = {
    type: 2,
    style: enabled ? 4 : 2, // Danger عند التمكين، وإلا Secondary
    emoji: { id: "1408077754557136926", name: ":icons8leave100:" }, // إيموجي مخصص
    // بديل يونيكود إن حبيت: emoji: { name: "🚪" },
    custom_id: `wordle_quit_${userId}_${attemptNo}`,
    disabled: !enabled
  };
}

  return {
    type: 1,
    components: [...letterButtons, actionButton]
  };
}


// إنشاء صورة لوحة الحروف الملونة
async function buildAlphabetBoardImage(states) {
  const cellW = 54;
  const cellH = 54;
  const gap = 6;
  const padding = 12;
  const cols = 12;
  const rows = Math.ceil(ARABIC_ALPHABET.length / cols);

  const width = padding * 2 + cols * (cellW + gap);
  const height = padding * 2 + rows * (cellH + gap) + 24;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // خلفية
  ctx.fillStyle = "#000000ff";
  ctx.fillRect(0, 0, width, height);

  // عنوان
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 35px Cairo";
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "rtl";
  ctx.fillText("لوحة الحروف", padding + 275, padding + 16);

  // رسم الحروف يمين ➜ يسار بدون أي قلب
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= ARABIC_ALPHABET.length) break;
      const ch = ARABIC_ALPHABET[idx++];
      const state = states[ch]; // green/purple/grey/undefined

      let bg = "#99aab5"; // grey
      if (state === "green") bg = "#2ecc71";
      else if (state === "purple") bg = "#5865F2";
      else if (!state) bg = "#4f545c"; // محايد

      // احسب العمود من اليمين إلى اليسار
      const colFromRight = c; // مؤشر بصري
      const x = width - padding - (colFromRight + 1) * (cellW + gap);
      const y = padding + 24 + r * (cellH + gap);

      // خلفية الخلية
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, cellW, cellH);

      // حدود
      ctx.strokeStyle = "#23272a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // الحرف
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Cairo";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = "rtl";
      // رسم مباشر بلا أي scale أو قلب
      ctx.fillText(ch, x + cellW / 2, y + cellH / 2);
    }
  }

  return canvas.toBuffer("image/png");
}

// إرسال رسالة لوحة اللعب الحالية (رسالة جديدة دائمًا)
// finalMsg: إذا true نضع زر "إعادة" في الصف الأخير، وإلا "انسحاب"
async function sendBoardMessage(channel, session, finalMsg) {
  const rows = [];
  for (let i = 0; i < session.history.length; i++) {
    const entry = session.history[i]; // { letters, colors }
    const isLast = i === session.history.length - 1;

    if (finalMsg) {
      // نهاية الجولة: الصف الأخير زر إعادة (Enabled)، والباقي انسحاب Disabled Secondary
      rows.push(
        buildRowComponents(
          entry.letters,
          entry.colors,
          session.userId,
          i + 1,
          isLast ? "restart" : "quit",
          isLast // مفعّل فقط في الأخير
        )
      );
    } else {
      // أثناء اللعب: الصف الأخير انسحاب (Enabled)، وما قبله انسحاب Disabled Secondary
      rows.push(
        buildRowComponents(
          entry.letters,
          entry.colors,
          session.userId,
          i + 1,
          "quit",
          isLast // مفعّل فقط في الأخير
        )
      );
    }
  }

  const remaining = WORDLE_MAX_ATTEMPTS - session.attempts;
  const baseLine = finalMsg
    ? (session.won
        ? `<:icons8correct1002:1415979896433278986> أحسنت! الكلمة: ${session.word} — تم الفوز.`
        : `<:icons8wrong1001:1415979909825695914> انتهت الجولة. الكلمة كانت: ${session.word}`)
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

  if (finalMsg) {
    setTimeout(() => sent.delete().catch(() => {}), 25000);
  }
}


async function startWordleForUser(channel, userId) {
  if (!WORDLE_WORDS.length) {
    await channel.send("<:icons8wrong1001:1415979909825695914> لا توجد كلمات بطول مناسب في القاموس.");
    return;
  }

  // إحصائيات: زيادة عدد اللعب
  await wordleStatsPlayed(userId);

  const secret = pickRandom(WORDLE_WORDS);
  const session = {
    userId,
    word: secret,
    attempts: 0,
    history: [],
    letterStates: {}, // خريطة حرف -> green/purple/grey
    currentMessage: null,
    ended: false,
    won: false,
    channelId: channel.id, // ربط الجلسة بالقناة التي بدأت فيها
  };

  wordleSessions.set(userId, session);
  await sendBoardMessage(channel, session, false);
}

// معالجة بدء اللعبة برسالة "حروف"
async function handleWordleStartMessage(msg) {
  try {
    if (msg.author?.bot) return;
    const userId = msg.author.id;

    const prev = wordleSessions.get(userId);
    // إذا توجد جلسة نشطة في قناة أخرى، لا نغلقها تلقائياً ونمنع البدء هنا
    if (prev && !prev.ended && prev.channelId && prev.channelId !== msg.channel.id) {
      return msg.reply(`لديك جولة نشطة في <#${prev.channelId}>. أنهِها هناك (زر "انسحاب") أو انتظر انتهائها، ثم اكتب: حروف`).catch(() => {});
    }

    // إن كانت جلسة سابقة في نفس القناة أو منتهية، نغلقها ونبدأ جولة جديدة
    if (prev && !prev.ended) {
      prev.ended = true;
      if (prev.currentMessage) setTimeout(() => prev.currentMessage.delete().catch(() => {}), 1000);
      wordleSessions.delete(userId);
    }

    await startWordleForUser(msg.channel, userId);
  } catch (e) {
    console.error("wordle start error:", e);
    return msg.reply("حدث خطأ أثناء بدء لعبة الحروف.").catch(() => {});
  }
}

// استقبال تخمينات اللاعب
async function handleWordleGuess(msg) {
  try {
    if (msg.author?.bot) return;

    const userId = msg.author.id;
    const s = wordleSessions.get(userId);
    if (!s || s.ended) return;

    // رفض التخمين إذا كان في قناة غير القناة المرتبطة بالجولة
    if (msg.channel.id !== s.channelId) return;

    const text = (msg.content || "").trim();
    if (!text || text === "حروف" || text === "حروف!") return;

    const chars = [...text];
    if (chars.length !== WORDLE_LEN) {
      return msg.reply(`❗ أرسل كلمة من ${WORDLE_LEN} أحرف بالضبط.`).catch(() => {});
    }

    if (s.attempts >= WORDLE_MAX_ATTEMPTS) return;

    s.attempts += 1;

    // تقييم التخمين
    const colors = judgeGuess(text, s.word);
    s.history.push({ letters: [...text], colors });

    // تحديث حالات الحروف للصورة
    updateLetterStates(s.letterStates, [...text], colors);

    const isWin = colors.every(c => c === "green");
    if (isWin) {
      s.ended = true;
      s.won = true;

      // مكافأة + إحصائيات الفوز
      try {
        await updateBalanceWithLog(db, userId, WORDLE_REWARD, "لعبة حروف: فوز");
        await wordleStatsWin(userId, WORDLE_REWARD);
      } catch (e) {
        console.error("wordle reward/stats error:", e);
      }

      await sendBoardMessage(msg.channel, s, true);
      wordleSessions.delete(userId);
      return;
    }

    // استنفاد المحاولات
    if (s.attempts >= WORDLE_MAX_ATTEMPTS) {
      s.ended = true;
      s.won = false;
      await wordleStatsLose(userId);
      await sendBoardMessage(msg.channel, s, true);
      wordleSessions.delete(userId);
      return;
    }

    // رسالة جولة جديدة (غير نهائية)
    await sendBoardMessage(msg.channel, s, false);
  } catch (e) {
    console.error("wordle guess error:", e);
    return msg.reply("حدث خطأ أثناء معالجة التخمين.").catch(() => {});
  }
}

// أزرار: انسحاب/إعادة
async function handleWordleButtons(i) {
  try {
    const id = i.customId || "";
    if (!id.startsWith("wordle_")) return;

    const parts = id.split("_"); // wordle_quit_{userId}_{attemptNo} | wordle_restart_{userId}_{attemptNo}
    const action = parts[1];
    const targetUserId = parts[2]; // attemptNo اختياري بالجزء [3]

    // حماية: نفس صاحب الجلسة فقط
    if (i.user.id !== targetUserId) {
      if (!i.replied && !i.deferred) {
        await i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذه الجلسة ليست لك.", ephemeral: true }).catch(() => {});
      }
      return;
    }

    const s = wordleSessions.get(targetUserId);

    // السماح دائمًا بـ "restart" حتى لو لا توجد جلسة (مثلاً بعد نهاية الجولة)
    if (action === "restart") {
      // إن كانت هناك جلسة نشطة في قناة مختلفة، امنع ووجّه للقناة الصحيحة
      if (s && !s.ended && s.channelId && s.channelId !== i.channelId) {
        if (!i.replied && !i.deferred) {
          await i.reply({ content: `لديك جولة نشطة في <#${s.channelId}>. أنهيها هناك أولاً.`, ephemeral: true }).catch(() => {});
        }
        return;
      }

      if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});

      // إن وُجدت جلسة في نفس القناة ولم تُنهَ بعد، أغلقها بلطف ثم ابدأ من جديد
      if (s && !s.ended) {
        try {
          s.ended = true;
          if (s.currentMessage) setTimeout(() => s.currentMessage.delete().catch(() => {}), 500);
        } catch {}
        wordleSessions.delete(targetUserId);
      }

      // ابدأ جولة جديدة في نفس القناة الحالية
      await startWordleForUser(i.channel, targetUserId);
      return;
    }

    // من هنا فصاعدًا (Quit وغيره) تتطلب وجود جلسة
    if (!s) {
      if (!i.replied && !i.deferred) {
        await i.reply({ content: "لا توجد جولة نشطة. أرسل: حروف", ephemeral: true }).catch(() => {});
      }
      return;
    }

    // قيد القناة: لا نسمح بالأزرار خارج قناة الجلسة
    if (i.channelId !== s.channelId) {
      if (!i.replied && !i.deferred) {
        await i.reply({ content: `هذه الجولة نشطة فقط في <#${s.channelId}>.`, ephemeral: true }).catch(() => {});
      }
      return;
    }

    if (action === "quit") {
      if (!i.deferred && !i.replied) await i.deferUpdate().catch(() => {});
      if (s && !s.ended) {
        s.ended = true;
        s.won = false;
        await wordleStatsLose(targetUserId);
        await sendBoardMessage(i.channel, s, true);
        wordleSessions.delete(targetUserId);
      } else {
        await i.channel.send("<:icons8wrong1001:1415979909825695914> لا توجد جولة نشطة. أرسل: حروف").catch(() => {});
      }
      return;
    }

    // إجراءات مستقبلية أخرى لو أضفتها...
  } catch (e) {
    console.error("wordle button error:", e);
    try {
      if (!i.replied && !i.deferred) await i.reply({ content: "حدث خطأ.", ephemeral: true });
    } catch {}
  }
}

// ===== إحصائيات Wordle في MongoDB =====
async function wordleStatsPlayed(userId) {
  try {
    await db.collection("wordle_stats").updateOne(
      { userId: String(userId) },
      {
        $inc: { played: 1 },
        $setOnInsert: { wins: 0, earnings: 0, currentStreak: 0, bestStreak: 0 }
      },
      { upsert: true }
    );
  } catch (e) { console.error("wordleStatsPlayed:", e); }
}

async function wordleStatsWin(userId, reward) {
  try {
    await db.collection("wordle_stats").updateOne(
      { userId: String(userId) },
      {
        $inc: { wins: 1, earnings: reward, currentStreak: 1 },
        $max: { bestStreak: 0 }, // placeholder للتأكد من وجود الحقل
      },
      { upsert: true }
    );
    // تحديث bestStreak إذا لزم
    const doc = await db.collection("wordle_stats").findOne({ userId: String(userId) }, { projection: { currentStreak: 1, bestStreak: 1 } });
    if (doc && (doc.currentStreak || 0) > (doc.bestStreak || 0)) {
      await db.collection("wordle_stats").updateOne(
        { userId: String(userId) },
        { $set: { bestStreak: doc.currentStreak || 0 } }
      );
    }
  } catch (e) { console.error("wordleStatsWin:", e); }
}

async function wordleStatsLose(userId) {
  try {
    await db.collection("wordle_stats").updateOne(
      { userId: String(userId) },
      {
        $set: { currentStreak: 0 },
        $setOnInsert: { played: 0, wins: 0, earnings: 0, bestStreak: 0 }
      },
      { upsert: true }
    );
  } catch (e) { console.error("wordleStatsLose:", e); }
}

async function handleWordleStatsMessage(msg) {
  try {
    if (msg.author?.bot) return;
    const userId = String(msg.author.id);
    const s = await db.collection("wordle_stats").findOne({ userId }, { projection: { _id: 0 } });

const played = s?.played || 0;
const wins = s?.wins || 0;
const earnings = s?.earnings || 0;
const currentStreak = s?.currentStreak || 0;
const bestStreak = s?.bestStreak || 0;
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
    { name: "سلسلة الانتصارات الحالية", value: `${currentStreak}         <:icons8series100:1416510089811988562>`, inline: true },
    { name: "أفضل سلسلة", value: `${bestStreak}      <:icons8series1001:1416510081822101677> `, inline: true },
    { name: "إجمالي الأرباح", value: `${earnings.toLocaleString("en-US")}           <:icons8money100:1416394266066030742> `, inline: true },
  );
  
    return msg.reply({ embeds: [embed] });
  } catch (e) {
    console.error("wordle stats error:", e);
    return msg.reply("حدث خطأ أثناء جلب إحصائياتك.").catch(() => {});
  }
}

// ===== ربط الراوتر =====
// بدء الجولة
ui.messageExact("حروف", handleWordleStartMessage);
// إحصائيات
ui.messageExact("حروف!", handleWordleStatsMessage);
// أزرار الانسحاب/إعادة
ui.buttonPrefix("wordle_", handleWordleButtons);


// التقاط رسائل صاحب الجلسة فقط للتخمين
ui.messageFilter(
  (m) => {
    try {
      if (!m?.author || m.author.bot) return false;
      const s = wordleSessions.get(m.author.id);
      // يلتقط فقط إذا كانت هناك جلسة نشطة لنفس المستخدم وفي نفس القناة
      return Boolean(s && !s.ended && s.channelId === m.channelId);
    } catch { return false; }
  },
  handleWordleGuess
);

/******************************************
 * نظام تحديد مبلغ الرهان (تصميم مفاتيح رقمي)
 * - إزالة زر/مودال "مخصص" بالكامل
 * - نفس المنطق السابق 100% مع واجهة:
 *   [كامل][نصف][ربع][إعادة تعيين]
 *   [1][2][3][+500]
 *   [4][5][6][+1000]
 *   [7][8][9][+5000]
 *   [مسح][0][تأكيد][إلغاء]
 ******************************************/

// أضف هذه ضمن soloGamesMap
const soloGamesMap = {
  soloroulette: "startSoloRoulette",
  soloslot: "startSlotMachine",
  solomystery: "startSoloMystery",
  solobus: "startSoloBus",
  blackjack: "startBlackjackSolo",
  buckshot: "startBuckshotSolo",
  soloxo: "startSoloXO", // <== أضف هذا السطر
  whoami: "startWhoAmI",
};

// أضف الدالة للقائمة
const soloGameFunctions = {
  startSoloRoulette,
  startSlotMachine,
  startSoloMystery,
  startSoloBus,
  startBlackjackSolo,
  startBuckshotSolo,
  startSoloXO,
startWhoAmI,

};

// تحديث أسماء الألعاب
const gameNames = {
  soloroulette: " روليت",
  soloslot: " ماكينة السلوت",
  solomystery: " صندوق الحظ",
  solobus: " تحدي الاوراق ",
  blackjack: " بلاك جاك",
  buckshot: " باكشوت",
  soloxo: " اكس او",
  whoami: " مين أنا؟", // <== أضف هذا السطر
};
const getArabicGameName = (id) => gameNames[id] || id;

// =================== التفاعلات ===================
client.on("interactionCreate", async (i) => {
  // اختيار لعبة فردية من القائمة
  if (i.isStringSelectMenu() && i.customId === "select_solo_game") {
    const gameId = i.values[0];
    const bal = await getBalance(i.user.id);
    await showBetInterface(i, i.user.id, gameId, bal, 1000);
    return;
  }

  // زر إعادة المحاولة
  if (i.isButton() && i.customId.startsWith("solo_retry_")) {
    const gameId = i.customId.replace("solo_retry_", "");
    const bal = await getBalance(i.user.id);
    await showBetInterface(i, i.user.id, gameId, bal, 1000);
    return;
  }

  // =================== أزرار الواجهة الجديدة ===================

  // أرقام: bet_digit_{d}_{userId}_{gameId}_{current}
  if (i.isButton() && i.customId.startsWith("bet_digit_")) {
    const [, , d, userId, gameId, currentStr] = i.customId.split("_");
    if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true });
    const current = parseInt(currentStr) || 0;
    const next = Math.min(2_000_000_000, parseInt(String(current) + String(d))); // حد أمان
    const bal = await getBalance(userId);
    return showBetInterface(i, userId, gameId, bal, isNaN(next) ? 0 : next);
  }

  // زيادة ثابتة: bet_inc_{inc}_{userId}_{gameId}_{current}
  if (i.isButton() && i.customId.startsWith("bet_inc_")) {
    const [, , incStr, userId, gameId, currentStr] = i.customId.split("_");
    if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true });
    const inc = parseInt(incStr) || 0;
    const current = parseInt(currentStr) || 0;
    const next = Math.max(0, current + inc);
    const bal = await getBalance(userId);
    return showBetInterface(i, userId, gameId, bal, next);
  }

  // تعيين مباشر بالنسبة للرصيد: كامل/نصف/ربع
  // bet_set_{full|half|quarter}_{userId}_{gameId}
  if (i.isButton() && i.customId.startsWith("bet_set_")) {
    const [, , mode, userId, gameId] = i.customId.split("_");
    if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true });
    const bal = await getBalance(userId);
    let next = 0;
    if (mode === "full") next = bal;
    else if (mode === "half") next = Math.floor(bal / 2);
    else if (mode === "quarter") next = Math.floor(bal / 4);
    return showBetInterface(i, userId, gameId, bal, next);
  }

  // إعادة تعيين للمبلغ: bet_reset_{userId}_{gameId}
  if (i.isButton() && i.customId.startsWith("bet_reset_")) {
    const [, , userId, gameId] = i.customId.split("_");
    if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true });
    const bal = await getBalance(userId);
    return showBetInterface(i, userId, gameId, bal, 0);
  }

  // مسح آخر رقم: bet_back_{userId}_{gameId}_{current}
  if (i.isButton() && i.customId.startsWith("bet_back_")) {
    const [, , userId, gameId, currentStr] = i.customId.split("_");
    if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true });
    const current = parseInt(currentStr) || 0;
    const next = Math.floor(current / 10);
    const bal = await getBalance(userId);
    return showBetInterface(i, userId, gameId, bal, next);
  }

  // تأكيد الرهان (نفس المنطق السابق)
  // bet_confirm_{userId}_{gameId}_{amount}
  if (i.isButton() && i.customId.startsWith("bet_confirm_")) {
    const [, , userId, gameId, amtStr] = i.customId.split("_");
    if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> ليس لك!", ephemeral: true });

    const bet = parseInt(amtStr);
    const bal = await getBalance(userId);
    if (bet > bal || isNaN(bet)) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> رصيدك لا يكفي او هناك خطا في الرهان", ephemeral: true });

    const userDoc = await db.collection("users").findOne({ userId });
    if (!userDoc) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا تملك محفظة بعد، استخدم امر `رصيدي` لانشائها.", ephemeral: true });

    await db.collection("users").updateOne({ userId }, { $inc: { wallet: -bet } });

    const fnName = soloGamesMap[gameId];
    const gameFunction = soloGameFunctions[fnName];

    await i.deferUpdate();
    setTimeout(() => { i.message.delete().catch(() => {}); }, 1000);

    if (typeof gameFunction === "function") {
      return gameFunction(i, bet);
    } else {
      return i.channel.send("<:icons8wrong1001:1415979909825695914> لم يتم العثور على اللعبة.");
    }
  }

  // إلغاء
  if (i.isButton() && i.customId === "bet_cancel") {
    return i.update({ content: "<:icons8wrong1001:1415979909825695914> تم الغاء الرهان.", embeds: [], components: [] });
  }
});

// =================== الواجهة ===================
async function showBetInterface(inter, userId, gameId, balance, amount = 1000, forceUpdate = false) {
  const gameName = getArabicGameName(gameId);
  const avatarURL = inter.user
    ? inter.user.displayAvatarURL({ dynamic: true })
    : inter.author.displayAvatarURL({ dynamic: true });

  const embed = new EmbedBuilder()
    .setColor("#00b894")
    .setTitle(`مبلغ رهان ${gameName}`)
    .setDescription(
      `**مبلغ الرهان :** ${Math.max(0, amount).toLocaleString("en-US")} <:ryal:1407444550863032330>\n` +
      `\u200B\n` +
      `**رصيدك:** ${balance.toLocaleString("en-US")} <:ryal:1407444550863032330>`
    )
    .setThumbnail(avatarURL);

  // الصف 1: كامل - نصف - ربع - إعادة تعيين
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bet_set_full_${userId}_${gameId}`)
      .setEmoji("1419791368536068177")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_set_half_${userId}_${gameId}`)
      .setEmoji("1419791380833894604")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_set_quarter_${userId}_${gameId}`)
      .setEmoji("1419791397141090385")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_reset_${userId}_${gameId}`)
      .setEmoji("1419525663638950019")
      .setStyle(ButtonStyle.Secondary)
  );

  // الصف 2: 1 - 2 - 3 - +500
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bet_digit_1_${userId}_${gameId}_${amount}`)
      .setLabel("1")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_2_${userId}_${gameId}_${amount}`)
      .setLabel("2")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_3_${userId}_${gameId}_${amount}`)
      .setLabel("3")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_inc_500_${userId}_${gameId}_${amount}`)
      .setLabel("+500")
      .setStyle(ButtonStyle.Secondary)
  );

  // الصف 3: 4 - 5 - 6 - +1000
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bet_digit_4_${userId}_${gameId}_${amount}`)
      .setLabel("4")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_5_${userId}_${gameId}_${amount}`)
      .setLabel("5")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_6_${userId}_${gameId}_${amount}`)
      .setLabel("6")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_inc_1000_${userId}_${gameId}_${amount}`)
      .setLabel("+1000")
      .setStyle(ButtonStyle.Secondary)
  );

  // الصف 4: 7 - 8 - 9 - +5000
  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bet_digit_7_${userId}_${gameId}_${amount}`)
      .setLabel("7")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_8_${userId}_${gameId}_${amount}`)
      .setLabel("8")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_9_${userId}_${gameId}_${amount}`)
      .setLabel("9")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_inc_5000_${userId}_${gameId}_${amount}`)
      .setLabel("+5000")
      .setStyle(ButtonStyle.Secondary)
  );

  // الصف 5: مسح - 0 - تأكيد - إلغاء
  const row5 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bet_back_${userId}_${gameId}_${amount}`)
      .setEmoji("1419791356179644588")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_digit_0_${userId}_${gameId}_${amount}`)
      .setLabel("0")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bet_confirm_${userId}_${gameId}_${amount}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1415979896433278986"),
    new ButtonBuilder()
      .setCustomId("bet_cancel")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1415979909825695914")
  );

  const payload = { embeds: [embed], components: [row1, row2, row3, row4, row5] };

  if (typeof inter.isButton === "function" && inter.isButton()) {
    await inter.update(payload);
  } else if (inter.reply) {
    if (!inter.replied && !inter.deferred) {
      await inter.reply(payload);
    } else {
      await inter.editReply(payload);
    }
  } else {
    await inter.channel.send(payload);
  }
}


//** <:icons8correct1002:1415979896433278986> دالة التحديث الموحد لاحصائيات الالعاب الفردية////////////////////////////////////////

async function updateSoloStats(userId, gameId, bet, didWin, earned) {
  const net = earned - bet;
  const gameKey = `stats.${gameId}`;

  const update = {
    $set: {
      [`${gameKey}.lastPlayed`]: new Date()
    },
    $inc: {
      [`${gameKey}.totalGames`]: 1,
      [`${gameKey}.net`]: net,
      [`${gameKey}.${didWin ? "wins" : "loses"}`]: 1
    }
  };

  await db.collection("solostats").updateOne(
    { userId },
    update,
    { upsert: true }
  );
}


// <:icons8correct1002:1415979896433278986> دالة عرض الاحصائيات بنفس تنسيق الصورة
async function getSoloStatsEmbed(interaction, filterGameId = "all") {
  const userId = interaction.user.id;
  const doc = await db.collection("solostats").findOne({ userId });

  if (!doc || !doc.stats || Object.keys(doc.stats).length === 0) {
    return new EmbedBuilder()
      .setTitle(" احصائياتك")
      .setDescription("لا توجد بيانات لعرضها.")
      .setColor("Orange");
  }

  const embed = new EmbedBuilder()
    .setTitle(" احصائيات الالعاب الفردية")
    .setColor("#3498db")
    .setThumbnail(interaction.user.displayAvatarURL());

  const stats = doc.stats;

  // نحول كل لعبة إلى "بلوك نصي" قابل للدمج
  const blocks = [];
  for (const [game, data] of Object.entries(stats)) {
    if (filterGameId !== "all" && filterGameId !== game) continue;

    const displayName = getArabicGameName(game);
    const winRate = data.totalGames > 0 ? ((data.wins / data.totalGames) * 100).toFixed(1) : "0";

    const block =
      ` ${displayName}\n`    +
      ` مرات اللعب: **${data.totalGames}**    <:icons8controller100:1407432162348634163>   \n`   +
      ` الفوز: **${data.wins}**   <:icons8trophy100:1416394314904244234>   \n`   +
      ` الخسارة: **${data.loses}**   <:icons8loss100:1416394312056442980>   \n`   +
      ` الفوز:  **${winRate}%**   <:icons8piechart100:1416394268716568789>   \n   `   +
      ` الصافي:  **${data.net.toLocaleString("en-US")}**   <:icons8money100:1416394266066030742>   \n  `;

    blocks.push(block);
  }

  // ندمج كل لعبتين داخل حقل واحد، والحقل يكون inline لعمل أعمدة
  for (let i = 0; i < blocks.length; i += 2) {
    const a = blocks[i];
    const b = blocks[i + 1];
    const value = b ? `${a}\n\u200B\n${b}` : a; // \u200B فصل بسيط بين اللعبتين

    embed.addFields({
      name: "\u200B",      // اسم مخفي
      value,               // لعبتان في نفس الحقل
      inline: true         // يجعلها عمودًا ضمن 3 أعمدة في الصف
    });
  }

  return embed;
}


// 🧠 تخزين الرهانات الفردية
const activeSoloBets = {};

// 🔁 استرجاع وحذف رهان اللاعب
function getSoloBet(userId) {
  const bet = activeSoloBets[userId];
  delete activeSoloBets[userId];
  return bet || 0;
}

// 💰 معالجة نتيجة اللعبة وتحديث الرصيد والاحصائيات
async function handleSoloGameResult(interaction, gameId, didWin, multiplier = 0) {
  const userId = interaction.user.id;
  const bet = getSoloBet(userId);
  const earned = didWin ? bet * multiplier : 0;
  const net = earned - bet;

  await addBalance(userId, net);
  await updateSoloStats(interaction, gameId, bet, didWin, earned);

  return { bet, earned, net };
}


// ==========================================
// 👤 لعبة مين أنا؟ (Who Am I) - النسخة المطورة
// ==========================================

// دالة قوية لجلب الصور (تبحث بالإنجليزي أولاً ثم بالعربي لضمان وجود صورة)
async function fetchWikiImageRobust(nameEn, nameAr) {
  try {
    // المحاولة الأولى: ويكيبيديا الإنجليزية
    let url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(nameEn)}&prop=pageimages&format=json&pithumbsize=300`;
    let res = await fetch(url);
    let data = await res.json();
    let pageId = Object.keys(data.query.pages)[0];
    
    if (pageId !== "-1" && data.query.pages[pageId].thumbnail) {
      return data.query.pages[pageId].thumbnail.source;
    }

    // المحاولة الثانية: ويكيبيديا العربية
    url = `https://ar.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(nameAr)}&prop=pageimages&format=json&pithumbsize=300`;
    res = await fetch(url);
    data = await res.json();
    pageId = Object.keys(data.query.pages)[0];
    
    if (pageId !== "-1" && data.query.pages[pageId].thumbnail) {
      return data.query.pages[pageId].thumbnail.source;
    }
  } catch (err) {}
  return null;
}

// دالة مساعدة لكتابة الاسم لو فشلت كل محاولات جلب الصورة
function drawFallbackText(ctx, name, x, y) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x + 10, y + 10, 280, 280);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 30px Cairo';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + 150, y + 150);
}

// دالة الرسم (تقبل مصفوفة الصور ومصفوفة الشخصيات المشطوبة)
async function renderDynamicWhoAmIBoard(characters, imageUrls, eliminated) {
  const canvas = createCanvas(900, 900);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 900, 900);

  for (let i = 0; i < 9; i++) {
    const char = characters[i];
    const x = (i % 3) * 300;
    const y = Math.floor(i / 3) * 300;

    // إذا الشخصية مشطوبة، نرسم مربع أسود فقط
    if (eliminated[i]) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 10, y + 10, 280, 280);
      continue; // ننتقل للشخصية اللي بعدها
    }

    const imageUrl = imageUrls[i];

    if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        const img = await loadImage(buffer);
        ctx.drawImage(img, x + 10, y + 10, 280, 280);
      } catch (e) { drawFallbackText(ctx, char.nameAr, x, y); }
    } else {
      drawFallbackText(ctx, char.nameAr, x, y);
    }

    // رسم الرقم
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(x + 10, y + 10, 50, 50);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 30px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText(i + 1, x + 35, y + 45);
  }
  return new AttachmentBuilder(await canvas.encode('png'), { name: 'whoami.png' });
}

// بدء الجولة
async function startWhoAmI(interaction, bet) {
  const userId = interaction.user.id;
  if (!interaction.replied && !interaction.deferred) await interaction.deferUpdate().catch(() => {});
  const loadingMsg = await interaction.channel.send("⏳ جاري سحب 9 شخصيات من الـ API وتجهيز اللوحة...");

  try {
    // طلبنا الاسم باللغتين عشان قوة البحث عن الصور
    const prompt = `أعطني 9 شخصيات مشهورة جداً (منوّعة: ممثلين، مسلسلات أجنبية وسعودية، أنمي، مارفل، ألعاب). 
    الرد يجب أن يكون مصفوفة JSON فقط بدون أي نص آخر، بهذا الشكل:
    [{"nameAr": "الاسم بالعربي", "nameEn": "الاسم بالإنجليزي", "description": "وصف قصير جداً"}]`;
    
    const aiResult = await genAIModel.generateContent(prompt);
    let jsonText = aiResult.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim();
    
    const selectedChars = JSON.parse(jsonText);
    const targetChar = selectedChars[Math.floor(Math.random() * 9)];
    
    // جلب روابط الصور مسبقاً وتخزينها عشان نعيد استخدامها بسرعة
    const imageUrls = [];
    for (const char of selectedChars) {
      const url = await fetchWikiImageRobust(char.nameEn, char.nameAr);
      imageUrls.push(url);
    }

    const eliminated = Array(9).fill(false); // مصفوفة لتتبع المربعات المشطوبة
    const img = await renderDynamicWhoAmIBoard(selectedChars, imageUrls, eliminated);
    
    await loadingMsg.delete().catch(() => {});
    const gameMsg = await interaction.channel.send({
      content: `👤 **لعبة مين أنا؟**\nاخترت شخصية واحدة من اللي بالصورة وحفظتها في راسي!\nلك **3 أسئلة** تجاوبها بـ (نعم/لا) أو توقع الاسم.\n\n**اكتب سؤالك الأول في الشات:**`,
      files: [img]
    });

    whoAmIGames.set(userId, {
      userId, 
      bet, 
      target: targetChar, 
      selected: selectedChars,
      imageUrls,
      eliminated,
      questionsAsked: 0, 
      status: 'playing', 
      channelId: interaction.channel.id,
      gameMsg // حفظ رسالة اللعبة عشان نحدثها نفسها
    });

  } catch (error) {
    console.error("WhoAmI Error:", error);
    await loadingMsg.edit("❌ حدث خطأ، تم إرجاع رهانك.").catch(() => {});
    await addBalance(userId, bet); 
  }
}

// معالجة أسئلة اللاعب وتحديث الرسالة والصورة
async function handleWhoAmIMessage(msg) {
  const game = whoAmIGames.get(msg.author.id);
  const userText = msg.content.trim();
  
  // حذف رسالة اللاعب عشان نحافظ على نظافة الشات والتركيز على رسالة اللعبة
  setTimeout(() => msg.delete().catch(() => {}), 1000);

  // نستخدم Gemini بضربة واحدة: يفهم إذا هو تخمين أو سؤال، يجاوب، ويحدد الأرقام اللي تنشطب!
  const aiPrompt = `
  أنت تدير لعبة "مين أنا".
  الشخصية المستهدفة هي: "${game.target.nameAr}" (${game.target.description}).
  اللاعب كتب: "${userText}".

  قائمة الشخصيات الحالية وأرقامها:
  ${game.selected.map((c, i) => `${i}: ${c.nameAr} (${c.description})`).join('\n')}

  المطلوب إرجاع رد بصيغة JSON فقط يحتوي على:
  1. "is_guess": true إذا كان اللاعب يحاول تخمين اسم الشخصية مباشرة، false إذا كان يسأل سؤالاً.
  2. "is_correct": true إذا كان التخمين صحيحاً (فقط إذا is_guess = true).
  3. "answer": إجابة السؤال بـ "نعم" أو "لا" أو "غير معروف" (إذا is_guess = false).
  4. "eliminated_indices": مصفوفة أرقام (0-8) للشخصيات التي يجب شطبها لأنها لا تتطابق مع إجابتك. (مثلاً: إذا سأل "هل هو أصلع؟" والشخصية ليست صلعاء، الإجابة "لا"، واشطب كل الصلعان من القائمة).

  صيغة الرد المطلوبة:
  {
    "is_guess": false,
    "is_correct": false,
    "answer": "لا",
    "eliminated_indices": [1, 4]
  }
  `;

  try {
    const aiResult = await genAIModel.generateContent(aiPrompt);
    let jsonText = aiResult.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const result = JSON.parse(jsonText);

    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("solo_retry_whoami")
        .setLabel("اعادة المحاولة")
        .setEmoji("1407461810566860941")
        .setStyle(ButtonStyle.Secondary)
    );

    // حالة: اللاعب يتوقع الاسم
    if (result.is_guess) {
      if (result.is_correct) {
        let mult = game.questionsAsked === 0 ? 15 : game.questionsAsked === 1 ? 10 : game.questionsAsked === 2 ? 5 : 2;
        const winAmount = game.bet * mult;
        
        await updateBalanceWithLog(db, msg.author.id, winAmount, "👤 مين أنا - فوز");
        await addBalance(msg.author.id, game.bet);
        await updateSoloStats(msg.author.id, "whoami", game.bet, true, winAmount);
        whoAmIGames.delete(msg.author.id);

        return game.gameMsg.edit({
          content: `✅ **صح عليك! ذيبان!**\nالشخصية هي **${game.target.nameAr}**.\nجاوبت بعد ${game.questionsAsked} سؤال، ربحت: **${winAmount.toLocaleString()} ريال!** (x${mult})`,
          components: [retryRow]
        }).catch(() => {});
      } else {
        // توقع خاطئ ينهي اللعبة فوراً (تقدر تغيرها وتخليها تنقص سؤال لو تبي)
        await db.collection("transactions").insertOne({ userId: msg.author.id, amount: -game.bet, reason: "👤 مين أنا - خسارة", timestamp: new Date() });
        await updateSoloStats(msg.author.id, "whoami", game.bet, false, 0);
        whoAmIGames.delete(msg.author.id);

        return game.gameMsg.edit({
          content: `❌ **توقع خاطئ!**\nالشخصية كانت: **${game.target.nameAr}**. خسر رهانك.`,
          components: [retryRow]
        }).catch(() => {});
      }
    }

    // حالة: اللاعب يسأل سؤال
    game.questionsAsked++;
    
    // تحديث الشطب
    if (result.eliminated_indices && Array.isArray(result.eliminated_indices)) {
      result.eliminated_indices.forEach(idx => {
        if (idx >= 0 && idx <= 8) game.eliminated[idx] = true;
      });
    }

    // إعادة رسم الصورة مع المربعات السوداء الجديدة
    const newImg = await renderDynamicWhoAmIBoard(game.selected, game.imageUrls, game.eliminated);

    if (game.questionsAsked < 3) {
      await game.gameMsg.edit({
        content: `👤 **لعبة مين أنا؟**\nسؤالك: **${userText}**\nالجواب: **${result.answer}**\n\nباقي لك ${3 - game.questionsAsked} أسئلة! (تم شطب الشخصيات المستبعدة باللون الأسود). اسأل سؤالك التالي:`,
        files: [newImg]
      }).catch(() => {});
    } else {
      await game.gameMsg.edit({
        content: `👤 **لعبة مين أنا؟**\nسؤالك الأخير: **${userText}**\nالجواب: **${result.answer}**\n\nخلصت أسئلتك! الحين عطني **توقعك النهائي** بالاسم:`,
        files: [newImg]
      }).catch(() => {});
    }

  } catch (error) {
    console.error("Error processing question:", error);
    // إعادة محاولة لو الذكاء الاصطناعي خرف وما رجع JSON صح
    msg.reply("معليش ما فهمت عليك، تقدر تعيد صياغة سؤالك؟").then(m => setTimeout(() => m.delete(), 3000));
  }
}

/******************************************
 * 🎰 لعبة روليت (فردية ضد الحظ) — نفس المنطق والمخرجات، مربوطة بالراوتر
 * ملاحظات:
 * - نفس customId والنصوص تماماً.
 * - لا Collectors ولا interactionCreate؛ المعالجة عبر الراوتر.
 * - تم الاكتفاء بتخزين جلسة خفيفة لضمان ملكية الرسالة، مع مؤقّت داخلي
 *   لازالة الجلسة بعد 15 ثانية (بدون اي تغيير بصري للمستخدم).
/* ================= صور ================= */


const rouletteSessions = new Map();
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];


// بداية اللعبة بصورة القالب + صورة اللاعب (كما هي)
async function renderRouletteStartImage(userId) {
  const width = assets.roulletesolo.width;
  const height = assets.roulletesolo.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // القالب
  ctx.drawImage(assets.roulletesolo, 0, 0, width, height);

  // صورة اللاعب في الوسط
  const user = await client.users.fetch(userId);
  const avatar = await loadUserAvatar(user);
  const centerX = 511;
  const centerY = 513;
  const radius = 292;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  return new AttachmentBuilder(await canvas.encode("png"), { name: "roulletesolo.png" });
}

// صورة النتيجة مع مؤشر الرقم الفائز (كما هي)
async function renderRouletteResultWithMarker(number, userId) {
  const width = assets.roulletesolo.width;
  const height = assets.roulletesolo.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // القالب
  ctx.drawImage(assets.roulletesolo, 0, 0, width, height);

  // صورة اللاعب دائرة وسط
  const user = await client.users.fetch(userId);
  const avatar = await loadUserAvatar(user);
  const centerX = 511;
  const centerY = 513;
  const radius = 292;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  // احداثيات الارقام (مطابقة للاصل)
  const numberPositions = {
    1: { x: 453, y: 193 }, 2: { x: 625, y: 817 }, 3: { x: 251, y: 301 },
    4: { x: 798, y: 679 }, 5: { x: 184, y: 518 }, 6: { x: 844, y: 464 },
    7: { x: 257, y: 721 }, 8: { x: 731, y: 261 }, 9: { x: 452, y: 828 },
    10: { x: 514, y: 186 }, 11: { x: 297, y: 762 }, 12: { x: 772, y: 303 },
    13: { x: 396, y: 206 }, 14: { x: 573, y: 835 }, 15: { x: 223, y: 350 },
    16: { x: 762, y: 719 }, 17: { x: 187, y: 573 }, 18: { x: 844, y: 517 },
    19: { x: 828, y: 406 }, 20: { x: 224, y: 678 }, 21: { x: 823, y: 628 },
    22: { x: 186, y: 465 }, 23: { x: 681, y: 796 }, 24: { x: 293, y: 260 },
    25: { x: 680, y: 226 }, 26: { x: 398, y: 818 }, 27: { x: 572, y: 190 },
    28: { x: 512, y: 835 }, 29: { x: 628, y: 203 }, 30: { x: 342, y: 793 },
    31: { x: 801, y: 352 }, 32: { x: 203, y: 625 }, 33: { x: 841, y: 577 },
    34: { x: 197, y: 406 }, 35: { x: 726, y: 759 }, 36: { x: 341, y: 225 }
  };

  // دائرة بيضاء على الرقم الفائز
  const pos = numberPositions[number];
  if (pos) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.restore();
  }

  return new AttachmentBuilder(await canvas.encode("png"), { name: "roulette_result.png" });
}

/* ================= بدء اللعبة ================= */

// نسخة مطابقة للاصل (زرّار + صورة فقط، بلا نص اضافي)
async function startSoloRoulette(interaction, bet) {
  const userId = interaction.user.id;

  const ranges = [
    { id: "1_12", label: " 1–12", min: 1, max: 12, multiplier: 3 },
    { id: "13_24", label: " 13–24", min: 13, max: 24, multiplier: 3 },
    { id: "25_36", label: "25–36", min: 25, max: 36, multiplier: 3 },
  ];

  // ازرار اللون
  const colorRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("solo_roulette_color_red").setLabel("🔴 احمر").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("solo_roulette_color_black").setLabel("⚫ اسود").setStyle(ButtonStyle.Secondary)
  );

  // زوجي/فردي + انسحاب
  const parityRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("solo_roulette_parity_even").setLabel("زوجي").setStyle(ButtonStyle.Secondary).setEmoji("1407423118993002668"),
    new ButtonBuilder().setCustomId("solo_roulette_parity_odd").setLabel("فردي").setStyle(ButtonStyle.Secondary).setEmoji("1407422287652720750"),
    new ButtonBuilder().setCustomId("solo_roulette_cancel").setLabel(" انسحب").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
  );

  // ازرار النطاق
  const rangeRow = new ActionRowBuilder();
  for (const r of ranges) {
    rangeRow.addComponents(
      new ButtonBuilder().setCustomId("solo_roulette_range_" + r.id).setLabel(r.label).setStyle(ButtonStyle.Secondary)
    );
  }

  // ارسال صورة البداية + الازرار
  const startImg = await renderRouletteStartImage(userId);
  const sent = await interaction.channel.send({
    files: [startImg],
    components: [colorRow, rangeRow, parityRow]
  });

  // سجّل جلسة خفيفة للرسالة (ملكية + قيمة الرهان)، واحذفها بعد 15 ثانية (بدون تغيير بصري)
  rouletteSessions.set(sent.id, { userId, bet, killAt: Date.now() + 45000 });
  setTimeout(() => rouletteSessions.delete(sent.id), 45000);
}

/* ================= معالجات الراوتر ================= */

// الازرار (لون/زوجي-فردي/نطاق/انسحاب) — نفس منطق النسخة العاملة
async function handleSoloRouletteButtons(i) {
  // تاكيد سريع لمنع فشل التفاعل
  if (!i.deferred && !i.replied) {
    await i.deferUpdate().catch(() => {});
  }

  const msgId = i.message?.id;
  const session = rouletteSessions.get(msgId);
  if (!session) {
    // الرسالة خارج النافذة او غير معروفة (مطابق لسلوك الانتهاء)
    return;
  }
  if (i.user.id !== session.userId) {
    return i.followUp?.({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true }).catch(() => {});
  }

  // الغاء
  if (i.customId === "solo_roulette_cancel") {
    // نفس صياغة الالغاء الاصلية
    await i.message.edit({ content: "<:icons8wrong1001:1415979909825695914> تم الغاء الجولة.", components: [], files: [] }).catch(() => {});
    await addBalance(session.userId, session.bet).catch(() => {});
    rouletteSessions.delete(msgId);
    return;
  }

  // تدوير الرقم + اللون (كما في النسخة)
  const number = Math.floor(Math.random() * 36) + 1; // 1–36
  const color = redNumbers.includes(number) ? "red" : "black";

  let won = false;
  let multiplier = 0;

  // رهان اللون
  if (i.customId.startsWith("solo_roulette_color_")) {
    const guess = i.customId.split("_")[3]; // red | black
    won = guess === color;
    multiplier = 2;
  }
  // زوجي / فردي
  else if (i.customId.startsWith("solo_roulette_parity_")) {
    const guess = i.customId.split("_").pop(); // even | odd
    if (number === 0) {
      won = false;
    } else if (guess === "even") {
      won = number % 2 === 0;
    } else {
      won = number % 2 === 1;
    }
    multiplier = 2;
  }
  // نطاق
  else if (i.customId.startsWith("solo_roulette_range_")) {
    const [min, max] = i.customId.split("_").slice(3).map(Number);
    won = number >= min && number <= max;
    // multiplier حسب الرينج كما في الاصل
    const ranges = [
      { min: 1, max: 12, multiplier: 3 },
      { min: 13, max: 24, multiplier: 3 },
      { min: 25, max: 36, multiplier: 3 },
    ];
    const rangeObj = ranges.find(r => r.min === min && r.max === max);
    multiplier = rangeObj?.multiplier || 3;
  } else {
    return;
  }

  // نفس حسابات النسخة الاصلية
  const bet = session.bet;
  let net = won ? bet * multiplier : -bet;

  if (won) {
    const earned = bet * multiplier;
    await addBalance(session.userId, bet).catch(() => {});
    await updateBalanceWithLog(db, session.userId, earned, "🎰 لعبة روليت - فوز").catch(() => {});
    await updateSoloStats(session.userId, "soloroulette", bet, true, earned).catch(() => {});
  } else {
    await db.collection("transactions").insertOne({
      userId: session.userId,
      amount: -bet,
      reason: "🎰 لعبة روليت - خسارة",
      timestamp: new Date()
    }).catch(() => {});
    await updateSoloStats(session.userId, "soloroulette", bet, false, 0).catch(() => {});
  }

  // نفس النداء الثاني كما في الكود القديم
  await updateSoloStats(session.userId, "soloroulette", bet, won, net).catch(() => {});

  // صورة النتيجة + زر اعادة المحاولة
  const resultImg = await renderRouletteResultWithMarker(number, session.userId).catch(() => null);
  const retryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("solo_retry_soloroulette")
      .setLabel(" اعادة المحاولة")
      .setEmoji("1407461810566860941")
      .setStyle(ButtonStyle.Secondary)
  );

  await i.message.edit({
    content: won
      ? `  فزت! <:icons8correct1002:1415979896433278986> الرقم: **${number}**`
      : `  خسرت! <:icons8wrong1001:1415979909825695914> الرقم: **${number}**`,
    files: resultImg ? [resultImg] : [],
    components: [retryRow]
  }).catch(() => {});

  rouletteSessions.delete(msgId);
  setTimeout(() => i.message.delete().catch(() => {}), 20000);
}

/******************************************
 * 🎰 ماكينة السلوت (متوافقة مع النظام الموحّد)
 ******************************************/

const slotSymbols = [
  { emoji: "🍒", name: "كرز", value: 1, weight: 25, rarity: "شائع" },
  { emoji: "🍋", name: "ليمون", value: 1, weight: 20, rarity: "شائع" },
  { emoji: "🍉", name: "بطيخ", value: 1, weight: 15, rarity: "غير شائع" },
  { emoji: "💎", name: "الماسة", value: 25, weight: 5, rarity: "نادر" },
  { emoji: "👑", name: "تاج", value: 50, weight: 3, rarity: "اسطوري" },
  { emoji: "🎰", name: "جاكبوت", value: 100, weight: 1, rarity: "جاكبوت" },
];

const slotSymbolMap = {
  "🍒": "slotcherry",
  "🍋": "slotlemon",
  "🍉": "slotmelon",
  "💎": "slotdiamond",
  "👑": "slotbell",   // استخدام bell كصورة بديلة
  "🎰": "slotseven"   // استخدام 7 كصورة للجاكبوت
};

function weightedRandomSymbol() {
  const totalWeight = slotSymbols.reduce((acc, s) => acc + s.weight, 0);
  let rand = Math.random() * totalWeight;
  return slotSymbols.find(s => (rand -= s.weight) < 0) || slotSymbols[0];
}

function getSlotResult(reels, bet) {
  const names = reels.map(r => r.name);
  const isFruit = (n) => ["كرز", "ليمون", "بطيخ"].includes(n);
  const isAllDifferentFruits = new Set(names).size === 3 && names.every(isFruit);
  const allSame = names.every(n => n === names[0]);
  const allFruits = names.every(isFruit);

  if (names.every(n => n === "جاكبوت")) {
    return { isWin: true, multiplier: 100, message: "🎉 JACKPOT! فزت بـ 100x" };
  } else if (names.every(n => n === "تاج")) {
    return { isWin: true, multiplier: 50, message: "👑 ملكي! فزت بـ 50x" };
  } else if (names.every(n => n === "الماسة")) {
    return { isWin: true, multiplier: 25, message: "💎 الماسات! فزت بـ 25x" };
  } else if (allSame && allFruits) {
    return { isWin: true, multiplier: 10, message: `🍉 ${names[0]} ×3! فزت بـ 10x` };
  } else if (isAllDifferentFruits) {
    return { isWin: true, multiplier: 2, message: "🥗 3 فواكه متنوعة! فزت بـ 2x" };
  }

  return { isWin: false, multiplier: 0, message: "<:icons8wrong1001:1415979909825695914> خسرت! حاول مرة ثانية." };
}

async function renderSlotGame(user, bet, reels, result) {
  const canvas = createCanvas(assets.slot.width, assets.slot.height);
  const ctx = canvas.getContext("2d");

  // الخلفية
  ctx.drawImage(assets.slot, 0, 0, canvas.width, canvas.height);

  // الرموز
  const positions = [
    { x: 235, y: 310 }, // يسار
    { x: 365, y: 310 }, // وسط
    { x: 495, y: 310 }  // يمين
  ];

  for (let i = 0; i < 3; i++) {
    const sym = reels[i];
    const key = slotSymbolMap[sym.emoji];
    if (key && assets[key]) {
      ctx.drawImage(assets[key], positions[i].x, positions[i].y, 100, 100);
    }
  }

  // صورة اللاعب
  try {
    const avatar = await loadUserAvatar(user);
    drawCircularImage(ctx, avatar, 415, 275, 25);
  } catch (e) {
    console.error("Avatar load failed:", e);
  }

  return new AttachmentBuilder(await canvas.encode("png"), { name: "slot.png" });
}

async function startSlotMachine(interaction, bet) {
  const userId = interaction.user.id;

  // الرهان مخصوم مسبقاً من واجهة الرهان
  const reels = [weightedRandomSymbol(), weightedRandomSymbol(), weightedRandomSymbol()];
  const result = getSlotResult(reels, bet);
  const img = await renderSlotGame(interaction.user, bet, reels, result);

  // payout = المبلغ النهائي المودَع (يشمل اصل الرهان اذا كان فوزاً)
  const payout = result.isWin ? bet * result.multiplier : 0;

  if (result.isWin) {
    // ايداع دفعة واحدة فقط دون اعادة bet منفصلة
    await updateBalanceWithLog(db, userId, payout, "🎰 سلوت فردي - فوز");
    await addBalance(userId,bet); 
    await updateSoloStats(userId, "soloslot", bet, true, payout);
  } else {
    // لا نخصم مرة اخرى لان الخصم تم عند التاكيد، نسجّل العملية فقط
    await db.collection("transactions").insertOne({
      userId,
      amount: -bet,
      reason: "🎰 سلوت فردي - خسارة",
      timestamp: new Date()
    });
    await updateSoloStats(userId, "soloslot", bet, false, 0);
  }

  // زر اعادة المحاولة
  const retryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("solo_retry_soloslot")
      .setLabel("اعادة المحاولة")
      .setEmoji("1407461810566860941")
      .setStyle(ButtonStyle.Secondary)
  );

  const content =
    `${result.message}\n` +
    `${result.isWin
      ? ` العائد: ${payout.toLocaleString("en-US")} <:ryal:1407444550863032330>`
      : ` الخسارة: ${bet.toLocaleString("en-US")} <:ryal:1407444550863032330>`}`;

  const msg = await interaction.channel.send({ content, files: [img], components: [retryRow] });
  setTimeout(() => msg.delete().catch(() => {}), 20000);
}


/******************************************
 * 🎁 Mystery Box — نسخة متوافقة مع الراوتر والهيلبرز
 ******************************************/

// النتائج والاوزان
const boxOptions = [
  { name: "مضاعفة ×2", type: "win",     multiplier: 2,   weight: 30 },
  { name: "مضاعفة ×3", type: "win",     multiplier: 3,   weight: 15 },
  { name: "صندوق فاضي", type: "lose",   multiplier: 0,   weight: 20 },
  { name: "خسارة جزئية", type: "lose",  multiplier: 0.5, weight: 15 },
  { name: "خسارة كاملة", type: "lose",  multiplier: 0,   weight: 10 },
  { name: "مكافاة ثابتة", type: "bonus", amount: 10000,  weight: 5  },
  { name: "تايم اوت", type: "timeout",  amount: 0,       weight: 5  }
];

// تخزين رهانات الجولات حسب اللاعب
const boxBets = new Map(); // userId -> bet
// تخزين رسالة البداية لحذفها بعد النتيجة
// نخزّنها بمفتاح خاص userId_messageId
// سنستخدم: boxBets.set(`${userId}_messageId`, messageId)

function weightedRandomBox() {
  const total = boxOptions.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const opt of boxOptions) {
    r -= opt.weight;
    if (r < 0) return opt;
  }
  return boxOptions[0];
}

// رسم نتيجة الصندوق
async function renderMysteryBoxResult(user, bet, box, payout, resultMsg) {
  const canvas = createCanvas(assets.mysterybox.height, assets.mysterybox.width);
  const ctx = canvas.getContext("2d");

  // الخلفية
  ctx.drawImage(assets.mysterybox, 0, 0, canvas.width, canvas.height);

  // العنوان
  ctx.font = "65px Cairo";
  ctx.fillStyle = "#8FD6FF";
  ctx.textAlign = "center";
  ctx.fillText(" صندوق الغموض", canvas.width / 2, 100);

  // صورة اللاعب
  const avatar = await loadUserAvatar(user);
  drawCircularImage(ctx, avatar, 140, canvas.height / 2 + 50, 120);

  // النتيجة (تلوين بسيط)
  ctx.font = "50px Cairo";
  ctx.fillStyle = payout > bet ? "#4aaee9ff" : payout === 0 ? "#CBA0E6" : "#b871e4ff";
  ctx.textAlign = "center";
  ctx.fillText(resultMsg, canvas.width / 2, 175);

  return new AttachmentBuilder(await canvas.encode("png"), { name: "mysterybox.png" });
}

/******************************************
 * بداية الجولة — تُستدعى بعد تاكيد الرهان الموحد
 * لا تُنشئ اي مستمعات هنا، الراوتر يتكفّل بالازرار
 ******************************************/
async function startSoloMystery(interaction, bet) {
  // قد يكون تم defer سابقاً اثناء تاكيد الرهان
  if (!interaction.replied && !interaction.deferred) {
    await interaction.deferUpdate({ ephemeral: true }).catch(() => {});
  }

  // خزّن الرهان للاعب
  boxBets.set(interaction.user.id, bet);

  // ازرار الصناديق
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("box_1").setStyle(ButtonStyle.Secondary).setEmoji("1407779540482265190"),
    new ButtonBuilder().setCustomId("box_2").setStyle(ButtonStyle.Secondary).setEmoji("1407779855764029570"),
    new ButtonBuilder().setCustomId("box_3").setStyle(ButtonStyle.Secondary).setEmoji("1407779532001247333"),
    new ButtonBuilder().setCustomId("box_quit").setLabel("انسحب").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
  );

  // قالب البداية
  const attachment = new AttachmentBuilder("./assets/templates/closedbox.png", { name: "mysterybox.png" });

  const introMessage = await interaction.channel.send({
    content: "اختر احد الصناديق الثلاثة 👇",
    components: [row],
    files: [attachment]
  });

  // خزّن معرف الرسالة لحذفها لاحقاً
  boxBets.set(`${interaction.user.id}_messageId`, introMessage.id);
}

/******************************************
 * معالج الازرار — يُربط عبر الراوتر:
 * ui.buttonExact('box_quit', handleBoxButtons);
 * ui.buttonPrefix('box_', handleBoxButtons);
 ******************************************/
async function handleBoxButtons(i) {
  const userId = i.user.id;
  const bet = boxBets.get(userId);

  // حماية: زر ليس لصاحب الجولة
  if (!bet) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true }).catch(() => {});
  }

  // انسحاب: استرجاع الرهان واغلاق الجولة
  if (i.customId === "box_quit") {
    await addBalance(userId, bet).catch(() => {});
    // تنظيف الحالة
    boxBets.delete(userId);
    const introKey = `${userId}_messageId`;
    const introMsgId = boxBets.get(introKey);

    await i.update({ content: "<:icons8wrong1001:1415979909825695914> تم الانسحاب واسترجاع الرهان.", files: [], components: [] }).catch(() => {});

    if (introMsgId) {
      i.channel.messages.fetch(introMsgId).then(m => m.delete().catch(() => {})).catch(() => {});
      boxBets.delete(introKey);
    }
    return;
  }

  // اختيار صندوق
  if (!["box_1", "box_2", "box_3"].includes(i.customId)) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> خيار غير معروف.", ephemeral: true }).catch(() => {});
  }

  await i.deferUpdate().catch(() => {});

  const box = weightedRandomBox();
  // نبقي introMsgId لحذف الرسالة بعد النتيجة
  boxBets.delete(userId);

  let payout = 0; // الدفعة النهائية المُودعة في المحفظة عبر كشف الحساب
  let resultMsg = "";

  switch (box.type) {
    case "win": {
      // دفعة الفوز = bet × multiplier (تتضمن اصل الرهان والربح)
      payout = Math.floor(bet * box.multiplier);
      resultMsg = `${box.name}! ربحت ${payout.toLocaleString("en-US")} ريال`;
      await updateBalanceWithLog(db, userId, payout, "🎁 صندوق الغموض - فوز");
      await addBalance(userId,bet);
      break;
    }
    case "lose": {
      // خسارة جزئية: استرجاع نسبة من الرهان
      payout = Math.floor(bet * (box.multiplier || 0));
      if (payout > 0) {
        resultMsg = `${box.name}! تم استرجاع ${payout.toLocaleString("en-US")} ريال (خسارة جزئية)`;
        await updateBalanceWithLog(db, userId, payout, "🎁 صندوق الغموض - خسارة جزئية");
      } else {
        // خسارة كاملة: نسجل -bet لان الخصم حدث مسبقاً من واجهة الرهان
        resultMsg = `${box.name}! خسرت ${bet.toLocaleString("en-US")} ريال`;
        await db.collection("transactions").insertOne({
          userId,
          amount: -bet,
          reason: "🎁 صندوق الغموض - خسارة كاملة",
          timestamp: new Date()
        });
      }
      break;
    }
    case "bonus": {
      // مكافاة ثابتة: (ارجاع الاصل + المكافاة) لضمان ربح صافٍ
      // لتغييرها لمكافاة صافية فقط: اجعل payout = box.amount
      payout = Math.floor(bet + box.amount);
      resultMsg = `${box.name}! حصلت على ${box.amount.toLocaleString("en-US")} ريال`;
      await updateBalanceWithLog(db, userId, payout, "🎁 صندوق الغموض - مكافاة");
      break;
    }
case "timeout": {
  payout = 0; // لا عائد
  // نحاول اعطاء تايم اوت فعلي 5 دقائق
  let didTimeout = false;
  try {
    const guild = i.guild;
    if (guild) {
      const member = await guild.members.fetch(userId);
      await member.timeout(5 * 60 * 1000, "🎁 صندوق الغموض - تايم اوت 5 دقائق");
      didTimeout = true;
    }
  } catch (e) {
    didTimeout = false;
  }

  if (didTimeout) {
    // سجل خسارة الرهان كعملية (الخصم الحقيقي للرهان تم مسبقاً من واجهة الرهان)
    await db.collection("transactions").insertOne({
      userId,
      amount: -bet,
      reason: "🎁 صندوق الغموض - تايم اوت",
      timestamp: new Date()
    });
    resultMsg = `${box.name}! تم تطبيق تايم اوت 5 دقائق.`; // نص النتيجة
  } else {
    // فشل التايم اوت → خصم ربع الرصيد
    const balance = await getBalance(userId).catch(() => 0);
    const penalty = Math.max(0, Math.floor(balance * 0.25));
    if (penalty > 0) {
      await updateBalanceWithLog(db, userId, -penalty, "🎁 صندوق الغموض - خصم ربع الرصيد (فشل التايم اوت)");
    }
    // سجل خسارة الرهان كعملية (اتساقاً مع بقية النتائج السلبية)
    await db.collection("transactions").insertOne({
      userId,
      amount: -bet,
      reason: "🎁 صندوق الغموض - تايم اوت",
      timestamp: new Date()
    });
    resultMsg = `${box.name}! — تم خصم ${penalty.toLocaleString("en-US")} ريال (ربع رصيدك).`;
  }

  break;
}

  }

  // تحديث الاحصائيات: نعتبر فوزاً اذا الدفعة النهائية > الرهان
  const didWin = payout > bet;
  await updateSoloStats(userId, "solomystery", bet, didWin, payout).catch(() => {});

  // صورة النتيجة
  const img = await renderMysteryBoxResult(i.user, bet, box, payout, resultMsg);

  // زر اعادة المحاولة
  const retryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("solo_retry_solomystery")
      .setLabel("اعادة المحاولة")
      .setEmoji("1407461810566860941")
      .setStyle(ButtonStyle.Secondary)
  );

  const sent = await i.channel.send({ files: [img], components: [retryRow] }).catch(() => {});
  if (sent) setTimeout(() => sent.delete().catch(() => {}), 20000);

  // حذف رسالة البداية
  const introKey = `${userId}_messageId`;
  const introMsgId = boxBets.get(introKey);
  if (introMsgId) {
    i.channel.messages.fetch(introMsgId).then(m => m.delete().catch(() => {})).catch(() => {});
    boxBets.delete(introKey);
  }
}

// ===== Ride the Bus (Solo) — نسخة متينة ومُصحّحة بالكامل =====

// جلسات اللعبة
const rideBusGames = new Map(); // userId -> { userId, stage, drawn, bet, channelId, msgId, lock, timer }

// مفتاح ملف الصورة للبطاقة
function getCardKey(card) {
  const valueMap = { 1:"ace",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",10:"ten",11:"jack",12:"queen",13:"king" };
  const suitMap = { "♥️":"heart","♦️":"diamond","♣️":"club","♠️":"spade" };
  return `${valueMap[card.value]}${suitMap[card.suit]}.png`;
}

// تعديل رسالة آمن
async function safeEditMessage(channelId, messageId, payload) {
  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return false;
    await msg.edit(payload).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

// حذف رسالة آمن
async function safeDeleteMessage(channelId, messageId) {
  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return false;
    await msg.delete().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

// سحب بطاقة فريدة
function drawUniqueCard(drawn, excludeValues = []) {
  const suits = ["♥️", "♦️", "♣️", "♠️"];
  const values = Array.from({ length: 13 }, (_, i) => i + 1);
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      const used = drawn.find(c => c.suit === suit && c.value === value);
      if (!used && !excludeValues.includes(value)) deck.push({ suit, value });
    }
  }
  if (deck.length === 0) return null;
  return deck[Math.floor(Math.random() * deck.length)];
}

// طابع انتهاء بصيغة Discord
function getExpiryTimestamp(seconds) {
  return `<t:${Math.floor(Date.now() / 1000) + seconds}:R>`;
}

// ازرار حسب المرحلة
function buildButtonsForStage(stage) {
  if (stage === 1) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bus_red").setLabel("🔴 احمر").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bus_black").setLabel("⚫ اسود").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bus_quit").setLabel("انسحب").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
    );
  }
  if (stage === 2) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bus_high").setLabel(" اكبر").setStyle(ButtonStyle.Secondary).setEmoji("1407783383169503305"),
      new ButtonBuilder().setCustomId("bus_low").setLabel(" اصغر").setStyle(ButtonStyle.Secondary).setEmoji("1407783374529237203"),
      new ButtonBuilder().setCustomId("bus_quit").setLabel("انسحب ×2").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
    );
  }
  if (stage === 3) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bus_inside").setLabel(" داخل").setStyle(ButtonStyle.Secondary).setEmoji("1407784188681392201"),
      new ButtonBuilder().setCustomId("bus_outside").setLabel(" خارج").setStyle(ButtonStyle.Secondary).setEmoji("1407784181127188571"),
      new ButtonBuilder().setCustomId("bus_quit").setLabel("انسحب ×5").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
    );
  }
  if (stage === 4) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bus_♥️").setEmoji("1407785030863945859").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bus_♦️").setEmoji("1407785057414021272").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bus_♣️").setEmoji("1407785047217541260").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bus_♠️").setEmoji("1407785074346299392").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bus_quit").setLabel("انسحب ×10").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
    );
  }
  return new ActionRowBuilder();
}

// رسم صورة الجولة
async function renderRideBusGame(game, user, stage, revealedCards = []) {
if (!assets.solobus) {
  assets.solobus = await loadImage(
    path.join(__dirname, "assets/templates/solobus.png")
  ).catch(() => null);
}
  if (!assets["cardback.png"]) assets["cardback.png"] = await loadImage( path.join(__dirname, "assets/cards/cardback.png")).catch(() => null);
  const bg = assets.solobus;
  if (!bg) throw new Error("RideBus background missing (assets.solobus)");

  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  // الخلفية والعنوان
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.font = "Bold 50px PressStart2P";
  ctx.fillStyle = "#8FD6FF";
  ctx.textAlign = "center";
  ctx.fillText(` Ride the Bus`, canvas.width / 2, 150);

  // اماكن البطاقات
  const cardPositions = [
    { x: 200, y: 250 },
    { x: 500, y: 250 },
    { x: 800, y: 250 },
    { x: 1100, y: 250 }
  ];

  // رسم البطاقات
  for (let i = 0; i < 4; i++) {
    const card = revealedCards[i] || null;
    const pos = cardPositions[i];
    if (!card) {
      if (assets["cardback.png"]) ctx.drawImage(assets["cardback.png"], pos.x, pos.y, 200, 300);
    } else {
      const key = getCardKey(card);
      if (!assets[key]) {
        try {
  assets[key] = await loadImage(
    path.join(__dirname, "assets/cards", key)
  );
} catch {
  assets[key] = null;
}
      }
      if (assets[key]) {
        ctx.drawImage(assets[key], pos.x, pos.y, 200, 300);
      } else if (assets["cardback.png"]) {
        ctx.drawImage(assets["cardback.png"], pos.x, pos.y, 200, 300);
      }
    }
  }

  // صورة اللاعب داخل دائرة
  try {
    const avatar = await loadUserAvatar(user);
    if (avatar) drawCircularImage(ctx, avatar, 750, 750, 155);
  } catch {}

  // اسم المستخدم
  ctx.font = "Bold 50px PressStart2P";
  ctx.fillStyle = "#8FD6FF";
  ctx.textAlign = "center";
  ctx.fillText(user.username, 750, 1000);

  // الارباح لو انسحب (من المرحلة 2)
  if (stage >= 2) {
    const multipliers = { 2: 2, 3: 5, 4: 10 };
    const currentReward = game.bet * (multipliers[stage] || 1);
    ctx.font = "Bold 50px Cairo";
    ctx.fillStyle = "#8FD6FF";
    ctx.textAlign = "center";
    ctx.fillText(` الارباح لو انسحبت: ${currentReward.toLocaleString("en-US")} ريال`, canvas.width / 2 + 25, 215);
  }

  return new AttachmentBuilder(await canvas.encode("png"), { name: "ridebus.png" });
}

// عرض مرحلة مع صورة + ازرار + مؤقّت
async function pushStageUI(game, user, revealed) {
  if (game.timer) try { clearTimeout(game.timer); } catch {}

  // تطبيع مصفوفة الكشف الى 4 خانات
  const norm = [
    revealed?.[0] || null,
    revealed?.[1] || null,
    revealed?.[2] || null,
    revealed?.[3] || null
  ];

  const img = await renderRideBusGame({ bet: game.bet }, user, game.stage, norm);
  const contentByStage = {
    1: "🎯 ما هو لون البطاقة القادمة؟\n⏳ ينتهي خلال " + getExpiryTimestamp(20),
    2: "🔢 هل البطاقة التالية اكبر ام اصغر؟\n⏳ ينتهي خلال " + getExpiryTimestamp(20),
    3: "🎯 هل البطاقة القادمة داخل او خارج النطاق؟\n⏳ ينتهي خلال " + getExpiryTimestamp(20),
    4: "🎯 ما هو نوع البطاقة القادمة؟\n⏳ ينتهي خلال " + getExpiryTimestamp(20)
  }[game.stage] || "";

  const row = buildButtonsForStage(game.stage);
  const ok = await safeEditMessage(game.channelId, game.msgId, { content: contentByStage, files: [img], components: [row] });
  if (!ok) return false;

  // مؤقّت المرحلة
  game.timer = setTimeout(async () => {
    const still = rideBusGames.get(game.userId);
    if (!still || still.stage !== game.stage) return;
    rideBusGames.delete(game.userId);
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("solo_retry_solobus").setLabel(" اعادة المحاولة").setEmoji("1407461810566860941").setStyle(ButtonStyle.Secondary)
    );
    await safeEditMessage(game.channelId, game.msgId, { content: `⏰ انتهى الوقت! خسرت الرهان.`, files: [], components: [retryRow] });
    setTimeout(() => safeDeleteMessage(game.channelId, game.msgId), 15000);
  }, 20000);

  return true;
}

// تعطيل سريع لكل الازرار لمنع الضغطات المتعددة
async function disableAllButtons(i) {
  try {
    const rows = (i.message.components || []).map(r => {
      const row = new ActionRowBuilder();
      r.components.forEach(b => row.addComponents(ButtonBuilder.from(b).setDisabled(true)));
      return row;
    });
    await i.message.edit({ components: rows }).catch(() => {});
  } catch {}
}

// بدء اللعبة (يُستدعى بعد تاكيد الرهان)
async function startSoloBus(interaction, bet) {
  const userId = interaction.user.id;
  const initMsg = await interaction.channel.send({ content: "⏳ جاري تجهيز اللعبة..." });
  const game = { userId, bet, stage: 1, drawn: [], channelId: interaction.channel.id, msgId: initMsg.id, lock: false, timer: null };
  rideBusGames.set(userId, game);
  await pushStageUI(game, interaction.user, [null, null, null, null]);
}

// معالج الازرار
async function handleBusButtons(i) {
  if (!i.isButton()) return;
  try { if (!i.deferred && !i.replied) await i.deferUpdate(); } catch {}

  const userId = i.user.id;
  const game = rideBusGames.get(userId);
  if (!game) return i.reply?.({ content: "⏳ هذه الجولة انتهت او غير مملوكة لك.", ephemeral: true }).catch(() => {});
  if (i.message.id !== game.msgId) return i.reply?.({ content: "⏳ تم تحديث الرسالة، تفاعل مع الرسالة الحالية.", ephemeral: true }).catch(() => {});
  if (game.lock) return; game.lock = true;

  await disableAllButtons(i);

  const { drawn, bet } = game;
  const suitEmoji = { "♥️":"♥️", "♦️":"♦️", "♣️":"♣️", "♠️":"♠️" };

  const endWithRetry = async (content, revealed) => {
    rideBusGames.delete(userId);
    try { if (game.timer) clearTimeout(game.timer); } catch {}
    const norm = [
      revealed?.[0] || null,
      revealed?.[1] || null,
      revealed?.[2] || null,
      revealed?.[3] || null
    ];
    const img = revealed ? await renderRideBusGame(game, i.user, Math.min(game.stage, 4), norm) : null;
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("solo_retry_solobus").setLabel(" اعادة المحاولة").setEmoji("1407461810566860941").setStyle(ButtonStyle.Secondary)
    );
    await safeEditMessage(game.channelId, game.msgId, { content, files: img ? [img] : [], components: [retryRow] });
    setTimeout(() => safeDeleteMessage(game.channelId, game.msgId), 15000);
  };

  try {
    // انسحاب في اي مرحلة
    if (i.customId === "bus_quit") {
      const multipliers = { 1:1, 2:2, 3:5, 4:10 };
      const refund = bet * (multipliers[game.stage] || 1);
      await updateBalanceWithLog(db, userId, refund, `🃏 Ride the Bus - انسحاب ×${multipliers[game.stage] || 1}`);
      await addBalance(userId,bet);
      await updateSoloStats(userId, "solobus", bet, false, refund);
      return endWithRetry(`<:icons8wrong1001:1415979909825695914> انسحبت من التحدي! تم استرجاع ${refund.toLocaleString("en-US")} ريال.`, null);
    }

    // المرحلة 1: لون البطاقة
    if (game.stage === 1 && (i.customId === "bus_red" || i.customId === "bus_black")) {
      const guess = i.customId === "bus_red" ? "red" : "black";
      const card1 = drawUniqueCard(drawn);
      if (!card1) return endWithRetry(`<:icons8wrong1001:1415979909825695914> خطا في السحب.`, null);
      drawn.push(card1);

      const isRed = card1.suit === "♥️" || card1.suit === "♦️";
      const ok = (isRed && guess === "red") || (!isRed && guess === "black");
      if (!ok) {
        await db.collection("transactions").insertOne({ userId, amount: -bet, reason: "🃏 Ride the Bus - خسارة", timestamp: new Date() });
        await updateSoloStats(userId, "solobus", bet, false, 0);
        return endWithRetry(`<:icons8wrong1001:1415979909825695914> توقّعك خاطئ!`, [card1, null, null, null]);
      }

      game.stage = 2;
      return pushStageUI(game, i.user, [drawn[0], null, null, null]);
    }

    // المرحلة 2: اكبر/اصغر
    if (game.stage === 2 && (i.customId === "bus_high" || i.customId === "bus_low")) {
      const prev = drawn[0];
      const card2 = drawUniqueCard(drawn, [prev.value]);
      if (!card2) return endWithRetry(`<:icons8wrong1001:1415979909825695914> خطا في السحب.`, [drawn[0], null, null, null]);
      drawn.push(card2);

      const ok = i.customId === "bus_high" ? card2.value > prev.value : card2.value < prev.value;
      if (!ok) {
        await db.collection("transactions").insertOne({ userId, amount: -bet, reason: "🃏 Ride the Bus - خسارة", timestamp: new Date() });
        await updateSoloStats(userId, "solobus", bet, false, 0);
        return endWithRetry(`<:icons8wrong1001:1415979909825695914> توقّعك خاطئ!`, [drawn[0], card2, null, null]);
      }

      game.stage = 3;
      return pushStageUI(game, i.user, [drawn[0], drawn[1], null, null]);
    }

    // المرحلة 3: داخل/خارج
    if (game.stage === 3 && (i.customId === "bus_inside" || i.customId === "bus_outside")) {
      const values = [drawn[0].value, drawn[1].value];
      const min = Math.min(...values), max = Math.max(...values);
      const card3 = drawUniqueCard(drawn, values);
      if (!card3) return endWithRetry(`<:icons8wrong1001:1415979909825695914> خطا في السحب.`, [drawn[0], drawn[1], null, null]);
      drawn.push(card3);

      const isInside = card3.value > min && card3.value < max;
      const ok = (i.customId === "bus_inside" && isInside) || (i.customId === "bus_outside" && !isInside);
      if (!ok) {
        await db.collection("transactions").insertOne({ userId, amount: -bet, reason: "🃏 Ride the Bus - خسارة", timestamp: new Date() });
        await updateSoloStats(userId, "solobus", bet, false, 0);
        return endWithRetry(`<:icons8wrong1001:1415979909825695914> توقّعك خاطئ!`, [drawn[0], drawn[1], card3, null]);
      }

      game.stage = 4;
      return pushStageUI(game, i.user, [drawn[0], drawn[1], drawn[2], null]);
    }

    // المرحلة 4: نوع البطاقة
    if (game.stage === 4 && i.customId.startsWith("bus_")) {
      const guessSuit = i.customId.replace("bus_", "");
      const card4 = drawUniqueCard(drawn);
      if (!card4) return endWithRetry(`<:icons8wrong1001:1415979909825695914> خطا في السحب.`, [drawn[0], drawn[1], drawn[2], null]);

      const win = card4.suit === guessSuit;
      if (win) {
        const reward = bet * 20;
        await updateBalanceWithLog(db, userId, reward, "🃏 Ride the Bus - فوز");
        await addBalance(userId, bet);
        await updateSoloStats(userId, "solobus", bet, true, reward);
        rideBusGames.delete(userId);
        try { if (game.timer) clearTimeout(game.timer); } catch {}

        const img = await renderRideBusGame(game, i.user, 4, [drawn[0], drawn[1], drawn[2], card4]);
        await safeEditMessage(game.channelId, game.msgId, {
          content: `<:icons8trophy100:1416394314904244234> البطاقة كانت ${suitEmoji[card4.suit]}${card4.value}، وفزت بـ ${reward.toLocaleString("en-US")} ريال!`,
          files: [img],
          components: []
        });
        setTimeout(() => safeDeleteMessage(game.channelId, game.msgId), 15000);
        return;
      } else {
        await db.collection("transactions").insertOne({ userId, amount: -bet, reason: "🃏 Ride the Bus - خسارة", timestamp: new Date() });
        await updateSoloStats(userId, "solobus", bet, false, 0);
        return endWithRetry(`<:icons8wrong1001:1415979909825695914> توقّعك خاطئ!`, [drawn[0], drawn[1], drawn[2], card4]);
      }
    }

    // خيار غير متاح
    await i.followUp?.({ content: "⏳ خيار غير متاح لهذه المرحلة.", ephemeral: true }).catch(() => {});
  } finally {
    game.lock = false;
  }
}


///////////////////////////////////*************                 
// 🎴 Blackjack Solo - صور كاملة + منطق اللعب
///////////////////////////////////*************                 

const CARD_WIDTH = 250;
const CARD_HEIGHT = 375;

const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const suits  = ["♠️","♥️","♦️","♣️"];

// 🗺️ تحويل القيمة + الرمز → اسم الملف
const valueMap = {
  "A":"ace", "J":"jack", "Q":"queen", "K":"king",
  "10":"ten", "9":"nine", "8":"eight", "7":"seven",
  "6":"six", "5":"five", "4":"four", "3":"three", "2":"two"
};
const suitMap  = { "♠️":"spade", "♥️":"heart", "♦️":"diamond", "♣️":"club" };

function cardToFile(card) {
  return `${valueMap[card.value]}${suitMap[card.suit]}.png`;
}

// تحميل صور الكروت مرة واحدة (حماية من النقص)
let blackjackCardsPreloaded = false;
async function preloadCards() {
  if (blackjackCardsPreloaded) return;
  for (const s of Object.values(suitMap)) {
    for (const v of Object.values(valueMap)) {
      const file = `${v}${s}.png`; // مثال: aceheart.png
      if (!assets[file]) {
        try {
          assets[file] = await loadImage(
            path.join(__dirname, "assets/cards", file)
          );
        } catch (e) {
          console.error("Missing card asset:", file, e);
          assets[file] = null;
        }
      }
    }
  }
  blackjackCardsPreloaded = true;
}

// 🃏 انشاء دكة كاملة (52 ورقة)
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit });
    }
  }
  return shuffle(deck);
}

// 🔀 خلط الدكة
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 🂠 سحب ورقة
function drawFromDeck(deck) {
  return deck.pop();
}

// ➕ حساب قيمة اليد
function calcHand(hand) {
  let total = 0, aces = 0;
  for (const card of hand) {
    if (["J","Q","K"].includes(card.value)) total += 10;
    else if (card.value === "A") { total += 11; aces++; }
    else total += parseInt(card.value);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

// 🎨 يرسم الكرت من صورة منفصلة
function drawCard(ctx, card, x, y) {
  const file = cardToFile(card);
  const img = assets[file];
  if (!img) {
    console.error("<:icons8wrong1001:1415979909825695914> صورة الكرت مفقودة:", file);
    // فولبك: ظهر الكرت ان توفر
    if (assets["cardback.png"]) ctx.drawImage(assets["cardback.png"], x, y, CARD_WIDTH, CARD_HEIGHT);
    return;
  }
  ctx.drawImage(img, x, y, CARD_WIDTH, CARD_HEIGHT);
}

// حالة الالعاب: userId -> game
const blackjackGames = new Map();

// 🎮 بدء لعبة جديدة (تُستدعى بعد تاكيد الرهان الموحّد)
async function startBlackjackSolo(interaction, bet) {
  if (!interaction.replied && !interaction.deferred) interaction.deferUpdate().catch(() => {});
  // ضمان توفر الخلفيات والكروت
  try {
    if (!assets.blackjack) assets.blackjack = await loadImage( path.join(__dirname, "assets/templates/Blackjack.png"));
    if (!assets.botAvatar) assets.botAvatar = await loadImage( path.join(__dirname, "assets/icons/bot.png"));
    if (!assets["cardback.png"]) assets["cardback.png"] = await loadImage( path.join(__dirname, "assets/cards/cardback.png"));
    await preloadCards();
  } catch (e) {
    console.error("Blackjack assets preload error:", e);
  }

  const userId = interaction.user.id;
  const deck = createDeck();

  const game = {
    deck,
    player: [drawFromDeck(deck), drawFromDeck(deck)],
    bot:    [drawFromDeck(deck), drawFromDeck(deck)],
    bet,
    userId,
    msg: null
  };

  await sendBlackjackMessage(interaction.channel, game, interaction.user);
}

// 🖼️ رسم القالب + الاوراق
async function renderBlackjack(game, user) {
  const bg = assets.blackjack;
  if (!bg) throw new Error("Blackjack background missing");
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  // الخلفية
  ctx.drawImage(bg, 0, 0);

  // بطاقات اللاعب
  game.player.forEach((c, i) => drawCard(ctx, c, 225 + i * 260, 100));
  // بطاقات البوت
  game.bot.forEach((c, i) => drawCard(ctx, c, 225 + i * 260, 550));

  // صورة اللاعب
  try {
    const avatar = await loadUserAvatar(user);
    ctx.save();
    ctx.beginPath();
    ctx.arc(110, 260, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 200, 120, 120);
    ctx.restore();
  } catch {}

  // صورة البوت
  if (assets.botAvatar) ctx.drawImage(assets.botAvatar, 50, 680, 100, 100);

  const playerTotal = calcHand(game.player);
  let botTotal = calcHand(game.bot);

  // النصوص (نفس الستايل)
  ctx.fillStyle = "white";
  ctx.font = "bold 40px Cairo";
  ctx.textAlign = "center";

  // 📝 مجموع اللاعب
  ctx.fillText(`مجموعك: ${playerTotal}`, 125, 375);
  // 📝 مجموع البوت
  ctx.fillText(`البوت:  ${botTotal}`, 125, 850);

  return canvas.toBuffer("image/png");
}

// 📤 ارسال الرسالة الاولى
async function sendBlackjackMessage(channel, game, user) {
  const buffer = await renderBlackjack(game, user);
  const attachment = new AttachmentBuilder(buffer, { name: "blackjack.png" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("bj_hit").setLabel(" سحب ").setStyle(ButtonStyle.Secondary).setEmoji("1407789070494597281"),
    new ButtonBuilder().setCustomId("bj_stand").setLabel(" تثبيت ").setStyle(ButtonStyle.Secondary).setEmoji("1407789061510402161"),
    new ButtonBuilder().setCustomId("bj_quit").setLabel(" انسحاب ").setStyle(ButtonStyle.Secondary).setEmoji("1416383140338991244")
  );

  const msg = await channel.send({ files: [attachment], components: [row] });
  blackjackGames.set(game.userId, { ...game, msg });
}

/******************************************************************
 * Handlers للراوتر:
 * ui.buttonExact('bj_hit', handleBjHit)
 * ui.buttonExact('bj_stand', handleBjStand)
 * ui.buttonExact('bj_quit', handleBjQuit)
 ******************************************************************/

async function handleBjHit(i) {
  await i.deferUpdate().catch(() => {});
  const id = i.user.id;
  const game = blackjackGames.get(id);
  if (!game) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا يوجد لعبة جارية.", ephemeral: true }).catch(() => {});

  // سحب ورقة للاعب
  game.player.push(drawFromDeck(game.deck));
  const total = calcHand(game.player);

  // تجاوز 21 = خسارة
  if (total > 21) {
    // لا نخصم من المحفظة؛ فقط سجل عملية -الرهان (خصم سابقاً)
    await db.collection("transactions").insertOne({
      userId: id,
      amount: -game.bet,
      reason: "♠️ Blackjack - خسارة (تجاوز 21)",
      timestamp: new Date()
    }).catch(() => {});
    await updateSoloStats(id, "blackjack", game.bet, false, 0).catch(() => {});

    blackjackGames.delete(id);

    const buffer = await renderBlackjack(game, i.user);
    const attachment = new AttachmentBuilder(buffer, { name: "blackjack.png" });

    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("solo_retry_blackjack")
        .setLabel("اعادة المحاولة")
        .setEmoji("1407461810566860941")
        .setStyle(ButtonStyle.Secondary)
    );

    return game.msg.edit({
      content: `💥 خسرت! مجموعك **${total}** (تجاوزت 21)`,
      files: [attachment],
      components: [retryRow]
    }).catch(() => {});
  }

  // استمرار اللعب
  const buffer = await renderBlackjack(game, i.user);
  const attachment = new AttachmentBuilder(buffer, { name: "blackjack.png" });
  return game.msg.edit({ files: [attachment] }).catch(() => {});
}

async function handleBjStand(i) {
  await i.deferUpdate().catch(() => {});
  const id = i.user.id;
  const game = blackjackGames.get(id);
  if (!game) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا يوجد لعبة جارية.", ephemeral: true }).catch(() => {});

  // سحب للبوت حتى 17+
  let botTotal = calcHand(game.bot);
  while (botTotal < 17) {
    game.bot.push(drawFromDeck(game.deck));
    botTotal = calcHand(game.bot);
  }

  const playerTotal = calcHand(game.player);
  let resultText = "";
  let payout = 0; // المبلغ المودَع عبر السجل

  if (playerTotal > 21) {
    // نظرياً لن يصل هنا لان معالجة bust تمت في hit، لكن نُبقيه احتياطاً
    await db.collection("transactions").insertOne({
      userId: id,
      amount: -game.bet,
      reason: "♠️ Blackjack - خسارة",
      timestamp: new Date()
    }).catch(() => {});
    await updateSoloStats(id, "blackjack", game.bet, false, 0).catch(() => {});
    resultText = `💥 خسرت! تجاوزت 21.`;
  } else if (botTotal > 21 || playerTotal > botTotal) {
    payout = game.bet * 2; // فوز 2x
    await updateBalanceWithLog(db, id, payout, "♠️ Blackjack - فوز").catch(() => {});
    await addBalance(id, game.bet).catch(() => {});
    await updateSoloStats(id, "blackjack", game.bet, true, payout).catch(() => {});
    resultText = `<:icons8trophy100:1416394314904244234> فزت!\nمجموعك: ${playerTotal} مقابل البوت: ${botTotal}\nربحت ${payout} كاش`;
  } else if (playerTotal < botTotal) {
    await db.collection("transactions").insertOne({
      userId: id,
      amount: -game.bet,
      reason: "♠️ Blackjack - خسارة",
      timestamp: new Date()
    }).catch(() => {});
    await updateSoloStats(id, "blackjack", game.bet, false, 0).catch(() => {});
    resultText = `😓 خسرت!\nمجموعك: ${playerTotal} مقابل البوت: ${botTotal}`;
  } else {
    payout = game.bet; // Push: استرجاع الرهان
    await updateBalanceWithLog(db, id, payout, "♠️ Blackjack - تعادل").catch(() => {});
    await updateSoloStats(id, "blackjack", game.bet, false, payout).catch(() => {});
    resultText = `🤝 تعادل!\nمجموعك: ${playerTotal} مقابل البوت: ${botTotal}`;
  }

  blackjackGames.delete(id);

  const buffer = await renderBlackjack(game, i.user);
  const attachment = new AttachmentBuilder(buffer, { name: "blackjack.png" });

  const retryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("solo_retry_blackjack")
      .setLabel("اعادة المحاولة")
      .setEmoji("1407461810566860941")
      .setStyle(ButtonStyle.Secondary)
  );

  return game.msg.edit({
    content: resultText,
    files: [attachment],
    components: [retryRow]
  }).catch(() => {});
}

async function handleBjQuit(i) {
  await i.deferUpdate().catch(() => {});
  const id = i.user.id;
  const game = blackjackGames.get(id);
  if (!game) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا يوجد لعبة جارية.", ephemeral: true }).catch(() => {});

  // استرجاع الرهان (الغاء)
  await updateBalanceWithLog(db, id, game.bet, "♠️ Blackjack - انسحاب").catch(() => {});
  await updateSoloStats(id, "blackjack", game.bet, false, game.bet).catch(() => {});
  blackjackGames.delete(id);

  return game.msg.edit({
    content: `<:icons8wrong1001:1415979909825695914> انسحبت من اللعبة وتم استرجاع ${game.bet.toLocaleString("en-US")} ريال.`,
    files: [],
    components: []
  }).catch(() => {});
}

/******************************************
 * 🔫 Buckshot Solo — متوافق مع الراوتر + اصلاح الاصفاد والمنشار
 ******************************************/

const buckshotGames = new Map(); // userId -> game

function startBuckshotSolo(interaction, bet) {
  if (!interaction.replied && !interaction.deferred) interaction.deferUpdate().catch(() => {});
  const userId = interaction.user.id;

  const game = {
    userId,
    username: interaction.member.displayName,
    playerHearts: 6,
    botHearts: 6,
    turn: "player",
    bet,
    deck: getBulletDeck(),
    tools: getRandomTools(),
    // تعديلات: تحويل الاصفاد الى عدادات، والمنشار كمُعزز للمحاولة القادمة فقط
    buffs: {
      playerDouble: false,      // منشار اللاعب: يضاعف ضرر "المحاولة" القادمة فقط
      botDouble: false,         // منشار البوت: يضاعف ضرر "المحاولة" القادمة فقط
      playerCuffedSkips: 0,     // عدد المرات التي يُسقط فيها دور اللاعب لمرة واحدة
      botCuffedSkips: 0         // عدد المرات التي يُسقط فيها دور البوت لمرة واحدة
    },
    gaveLowHpBonus: false,
    msg: null
  };

  buckshotGames.set(userId, game);
  sendBuckshotGameUI(interaction, userId);
}

function getRandomTools() {
  const items = ["مكبر", "منشار", "دواء", "بيرة", "اصفاد"];
  const tools = {};
  for (const item of items) tools[item] = Math.floor(Math.random() * 2);
  return tools;
}

function getBulletDeck() {
  let real, fake;
  do {
    real = Math.floor(Math.random() * 8) + 1; // 1–8
    fake = Math.floor(Math.random() * 8) + 1; // 1–8
  } while (fake > real + 3 || real + fake > 12);
  const bullets = Array(real).fill("حقيقية").concat(Array(fake).fill("فارغة"));
  return bullets.sort(() => Math.random() - 0.5);
}

function toolMap(tool) {
  return {
    "بيرة": "beer",
    "منشار": "saw",
    "دواء": "pills",
    "مكبر": "scope",
    "اصفاد": "cuffs"
  }[tool];
}

function getToolEmoji(tool) {
  const emojis = {
    مكبر: "1407792799868522629",
    منشار: "1407792789646868562",
    دواء: "1407792778167058514",
    بيرة: "1407792769551958046",
    اصفاد: "1407792760756506665"
  };
  return { id: emojis[tool] };
}

/**
 * منشار: يُستهلك دائماً في اول "محاولة" تالية، ويُضاعف الضرر فقط اذا كانت الطلقة حقيقية
 * يعيد: 2 اذا (منشار مفعّل + طلقة حقيقية)، 1 اذا (طلقة حقيقية بدون منشار)، 0 اذا (طلقة فارغة)
 */
function nextShotDamageAndConsume(buffs, who, isReal) {
  const key = who === "player" ? "playerDouble" : "botDouble";
  const boosted = !!buffs[key];
  if (boosted) buffs[key] = false; // يُستهلك دائماً عند اول محاولة تالية (حتى لو فارغة)
  return isReal ? (boosted ? 2 : 1) : 0;
}

// تحديد الفائز بالاكثر قلوباً (مع دعم التعادل)
function decideWinner(game) {
  if (game.playerHearts <= 0 || game.botHearts <= 0) {
    if (game.playerHearts > game.botHearts) return "player";
    if (game.playerHearts < game.botHearts) return "bot";
    return "draw";
  }
  return null;
}

async function sendBuckshotGameUI(interactionOrMessage, userId, log = null) {
  const game = buckshotGames.get(userId);
  if (!game) return;

  const canvas = createCanvas(1152, 768);
  const ctx = canvas.getContext("2d");

  // الخلفية
  if (assets.base) ctx.drawImage(assets.base, 0, 0, canvas.width, canvas.height);

  // القلوب حسب الدور الحالي
  const currentHearts = game.turn === "player" ? game.playerHearts : game.botHearts;
  const totalHearts = 6;
  for (let i = 0; i < totalHearts; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const startX = 50, startY = 190, cellW = 85, cellH = 63;
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    const heartImg = i < currentHearts ? assets.heart : assets.heartEmpty;
    if (heartImg) ctx.drawImage(heartImg, x, y, 40, 40);
  }

  // الطلقات (شبكة 2×6) للعرض فقط
  const shuffledBullets = [...game.deck].slice(0, 12).sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffledBullets.length; i++) {
    const bullet = shuffledBullets[i];
    const icon = bullet === "حقيقية" ? assets.bulletReal : assets.bulletFake;
    const col = i % 6;
    const row = Math.floor(i / 6);
    const startX = 245, startY = 510, cellW = 120, cellH = 85;
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    if (icon) ctx.drawImage(icon, x, y, 65, 65);
  }

  // الادوات (يمين)
  const tools = Object.entries(game.tools);
  for (let i = 0; i < tools.length; i++) {
    let col = i % 2;
    let row = Math.floor(i / 2);
    const startX = 960, startY = 190, cellW = 85, cellH = 63;
    let x = startX + col * cellW;
    let y = startY + row * cellH;
    if (i === tools.length - 1 && tools.length % 2 !== 0) x = startX + cellW / 2;

    const [tool, count] = tools[i];
    const key = toolMap(tool);
    const icon = assets[key];
    if (icon) ctx.drawImage(icon, x, y, 40, 40);
    ctx.fillStyle = "white";
    ctx.font = "17px PressStart2P";
    ctx.fillText(`x${count}`, x + 45, y + 30);
  }

  // صورة اللاعب/البوت
  async function drawCircularImage(ctx, img, cx, cy, r) {
    const size = r * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, size, size);
    ctx.restore();
  }
  if (game.turn === "bot") {
    if (assets.botAvatar) drawCircularImage(ctx, assets.botAvatar, 565, 300, 150);
  } else {
    try {
      const playerUser = await client.users.fetch(game.userId);
      const url = playerUser.displayAvatarURL({ extension: "png", size: 256 });
      const res = await fetch(url);
      const bufferAvatar = Buffer.from(await res.arrayBuffer());
      const avatarImg = await loadImage(bufferAvatar);
      drawCircularImage(ctx, avatarImg, 565, 300, 150);
    } catch (err) {
      if (assets.botAvatar) drawCircularImage(ctx, assets.botAvatar, 565, 300, 150);
    }
  }

  // السجل
  if (log) {
    ctx.fillStyle = "white";
  ctx.font = "bold 50px Cairo";
  ctx.textAlign = "center";
    ctx.fillText(log, canvas.width / 2, 75);
  }

  const buffer = canvas.toBuffer("image/png");
  const file = new AttachmentBuilder(buffer, { name: "buckshot.png" });

  // ازرار اللعب
  const isPlayerTurn = game.turn === "player";
  const mainRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buck_shoot_bot").setLabel(" بوت").setStyle(ButtonStyle.Secondary).setDisabled(!isPlayerTurn).setEmoji("1407795197760503919"),
    new ButtonBuilder().setCustomId("buck_shoot_self").setLabel(" نفسك").setStyle(ButtonStyle.Secondary).setDisabled(!isPlayerTurn).setEmoji("1407795197760503919"),
    new ButtonBuilder().setCustomId("buck_quit").setLabel("انسحب").setStyle(ButtonStyle.Secondary).setDisabled(!isPlayerTurn).setEmoji("1416383140338991244")
  );

  const toolRow = new ActionRowBuilder().addComponents(
    ...Object.entries(game.tools).map(([tool, count]) =>
      new ButtonBuilder()
        .setCustomId(`buck_tool_${tool}`)
        .setLabel(`(${count})`)
        .setEmoji(getToolEmoji(tool))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!isPlayerTurn || count <= 0)
    )
  );

  if (game.msg) {
    game.msg.edit({ files: [file], components: [mainRow, toolRow] }).catch(() => {});
  } else {
    const channel = interactionOrMessage.channel ?? interactionOrMessage; // دعم الحالتين
    channel.send({ files: [file], components: [mainRow, toolRow] }).then(msg => { game.msg = msg; }).catch(() => {});
  }
}

/******************************************
 * الراوتر: ui.buttonPrefix('buck_', handleBuckshotSoloButtons)
 ******************************************/
async function handleBuckshotSoloButtons(i) {
  if (!i.isButton()) return;
  const userId = i.user.id;
  const game = buckshotGames.get(userId);
  if (!game) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا يوجد لعبة جارية.", ephemeral: true }).catch(() => {});
  if (game.turn !== "player" && !i.customId.startsWith("buck_tool_")) {
    return i.reply({ content: "⏳ انتظر دورك.", ephemeral: true }).catch(() => {});
  }
  await i.deferUpdate().catch(() => {});

  // انسحاب
  if (i.customId === "buck_quit") {
    await updateBalanceWithLog(db, userId, game.bet, "🔫 Buckshot - انسحاب").catch(() => {});
    await updateSoloStats(userId, "buckshot", game.bet, false, game.bet).catch(() => {});
    buckshotGames.delete(userId);
    return game.msg.edit({
      content: `<:icons8wrong1001:1415979909825695914> انسحبت من اللعبة وتم استرجاع ${game.bet.toLocaleString("en-US")} ريال.`,
      files: [],
      components: []
    }).catch(() => {});
  }

  // ادوات
  if (i.customId.startsWith("buck_tool_")) {
    if (game.turn !== "player") return; // لا استخدام ادوات خارج الدور
    const tool = i.customId.replace("buck_tool_", "");
    if (!game.tools[tool] || game.tools[tool] <= 0) return;

    game.tools[tool]--;
    let msg = "";

    if (tool === "مكبر") {
      if (game.deck.length === 0) {
        game.deck = getBulletDeck();
        grantRandomTools(game);
      }
      msg = ` الطلقة التالية هي: ${game.deck[game.deck.length - 1]}`;
    } else if (tool === "منشار") {
      game.buffs.playerDouble = true; // سيُستهلك في "المحاولة القادمة" فقط
      msg = "المنشار نشط! الطلقة القادمة ضررها مضاعف";
    } else if (tool === "دواء") {
      if (game.playerHearts < 6) game.playerHearts++;
      msg = " استخدمت دواء واستعدت قلب!";
    } else if (tool === "بيرة") {
      if (game.deck.length === 0) {
        game.deck = getBulletDeck();
        grantRandomTools(game);
      }
      const removed = game.deck.pop();
      msg = ` استخدمت بيرة وتم حذف الطلقة التالية (${removed})!`;
    } else if (tool === "اصفاد") {
      game.buffs.botCuffedSkips = (game.buffs.botCuffedSkips || 0) + 1; // يسقط دور البوت مرة واحدة
      msg = " قيدت البوت بالاصفاد! تقدر تلعب جولتين ورا بعض!   .";
    }

    return sendBuckshotGameUI(i, userId, msg);
  }

  // اطلاق النار
  if (["buck_shoot_self", "buck_shoot_bot"].includes(i.customId)) {
    // اعادة تعبئة اذا فرغت الطلقات الحقيقية
    if (game.deck.filter(b => b === "حقيقية").length === 0) {
      game.deck = getBulletDeck();
      grantRandomTools(game);
    }
    // لو الدكة فارغة تماماً
    if (game.deck.length === 0) {
      game.deck = getBulletDeck();
      grantRandomTools(game);
    }

    const shot = game.deck.pop();
    const isSelf = i.customId.includes("self");
    const targetKey = isSelf ? "playerHearts" : "botHearts";
    const isReal = shot === "حقيقية";

    // ضرر المنشار الموثوق (يستهلك فور اول محاولة)
    const damage = nextShotDamageAndConsume(game.buffs, "player", isReal);

    let log = ` اطلقت ${isSelf ? "على نفسك" : "على البوت"} وكانت `;
    if (isReal) {
      game[targetKey] -= damage;
      log += `طلقة حقيقية! -${damage} `;
      // انتقال الدور اساساً الى البوت
      game.turn = "bot";
    } else {
      log += `طلقة فارغة.`;
      // عند الفراغ: ان كانت على نفسك يبقى الدور لك، والا ينتقل للبوت
      game.turn = isSelf ? "player" : "bot";
    }

    // تطبيق الاصفاد: اسقاط دور البوت مرة واحدة فقط
    if (game.turn === "bot" && (game.buffs.botCuffedSkips || 0) > 0) {
      game.buffs.botCuffedSkips--;
      game.turn = "player";
      log += `\n (ا دورك مرة ثانية)`;
    }

    // مكافاة قلوب منخفضة مرة واحدة
    if ((game.playerHearts <= 3 || game.botHearts <= 3) && !game.gaveLowHpBonus) {
      grantRandomTools(game);
      game.gaveLowHpBonus = true;
      log += `\n تم توزيع ادوات اضافية بسبب القلوب القليلة!`;
    }

    // حسم النتيجة ان انتهت
    const result = decideWinner(game);
    if (result) {
      await finishBuckshotGame(game, result, log);
      return;
    }

    // تشغيل البوت ان كان دوره
    sendBuckshotGameUI(i, userId, log);
    if (game.turn === "bot") setTimeout(() => botPlay(userId), 1200);
  }
}

function grantRandomTools(game, count = 2) {
  const tools = Object.keys(game.tools);
  for (let i = 0; i < count; i++) {
    const random = tools[Math.floor(Math.random() * tools.length)];
    game.tools[random]++;
  }
}

async function finishBuckshotGame(game, result, log) {
  const userId = game.userId;
  let title, color, footer;
  if (result === "player") {
    const payout = game.bet * 2;
    await updateBalanceWithLog(db, userId, payout, "🔫 Buckshot - فوز").catch(() => {});
    await addBalance(userId, game.bet).catch(() => {});
    await updateSoloStats(userId, "buckshot", game.bet, true, payout).catch(() => {});
    title = "<:icons8trophy100:1416394314904244234> فزت!";
    color = 0x2ecc71;
    footer = `ربحت ${payout.toLocaleString("en-US")} ريال`;
  } else if (result === "bot") {
    await db.collection("transactions").insertOne({
      userId,
      amount: -game.bet,
      reason: "🔫 Buckshot - خسارة",
      timestamp: new Date()
    }).catch(() => {});
    await updateSoloStats(userId, "buckshot", game.bet, false, 0).catch(() => {});
    title = "💀 خسرت!";
    color = 0xe74c3c;
    footer = `خسرت الرهان.`;
  } else {
    // تعادل = استرجاع الرهان
    const payout = game.bet;
    await updateBalanceWithLog(db, userId, payout, "🔫 Buckshot - تعادل").catch(() => {});
    await updateSoloStats(userId, "buckshot", game.bet, false, payout).catch(() => {});
    title = "🤝 تعادل!";
    color = 0x95a5a6;
    footer = `تم استرجاع ${payout.toLocaleString("en-US")} ريال.`;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(`${log}\n\n${footer}`)
    .setColor(color);

  const retryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("solo_retry_buckshot")
      .setLabel("اعادة المحاولة")
      .setEmoji("1407461810566860941")
      .setStyle(ButtonStyle.Secondary)
  );

  const sent = await game.msg.channel.send({ embeds: [embed], components: [retryRow] }).catch(() => {});
  if (sent) setTimeout(() => sent.delete().catch(() => {}), 60000);
  await game.msg.delete().catch(() => {});
  buckshotGames.delete(userId);
}

function botPlay(userId) {
  const game = buckshotGames.get(userId);
  if (!game || game.turn !== "bot") return;

  // استخدام ادوات للبوت
  const choice = Math.random();
  if (game.botHearts < 6 && game.tools.دواء > 0) {
    game.botHearts++; game.tools.دواء--;
  } else if (choice < 0.2 && game.tools.منشار > 0) {
    game.tools.منشار--; game.buffs.botDouble = true; // منشار للبوت — للمحاولة القادمة فقط
  } else if (choice < 0.4 && game.tools.اصفاد > 0) {
    game.tools.اصفاد--; game.buffs.playerCuffedSkips = (game.buffs.playerCuffedSkips || 0) + 1; // يسقط دور اللاعب مرة واحدة
  }

  // اعادة تعبئة عند نفاد الحقيقي
  if (game.deck.filter(b => b === "حقيقية").length === 0) {
    game.deck = getBulletDeck();
    grantRandomTools(game);
  }
  if (game.deck.length === 0) {
    game.deck = getBulletDeck();
    grantRandomTools(game);
  }

  // اختيار هدف البوت: اذا كل الباقي حقيقي، غالباً يطلق على نفسه ليستمر
  const onlyReal = game.deck.every(b => b === "حقيقية");
  const targetKey = onlyReal ? "botHearts" : "playerHearts";
  const isSelf = targetKey === "botHearts";
  const shot = game.deck.pop();
  const isReal = shot === "حقيقية";

  // ضرر المنشار للبوت
  const damage = nextShotDamageAndConsume(game.buffs, "bot", isReal);

  let log = ` البوت اطلق ${isSelf ? "على نفسه" : "عليك"} وكانت `;
  if (isReal) {
    game[targetKey] -= damage;
    log += `طلقة حقيقية! -${damage} `;
    game.turn = "player";
  } else {
    log += `طلقة فارغة.`;
    if (isSelf) {
      game.turn = "bot";
      // متابعة تلقائية للبوت بعد فراغ على نفسه
      return setTimeout(() => botPlay(userId), 900);
    } else {
      game.turn = "player";
    }
  }

  // اذا اللاعب مقيّد: اسقاط دوره مرة واحدة ثم متابعة البوت
  if (game.turn === "player" && (game.buffs.playerCuffedSkips || 0) > 0) {
    game.buffs.playerCuffedSkips--;
    game.turn = "bot";
    log += `\n (الاصفاد فعّالة عليك: سقط دورك، دور البوت مستمر)`;
    return setTimeout(() => botPlay(userId), 900);
  }

  // حسم النتيجة
  const result = decideWinner(game);
  if (result) return finishBuckshotGame(game, result, log);

  sendBuckshotGameUI(game.msg, userId, log);
}

/******************************************
 * ❌⭕ لعبة إكس أو (مساعدات عامة)
 ******************************************/

function checkXOWin(board) {
  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // أفقي
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // عمودي
    [0, 4, 8], [2, 4, 6]             // قطري
  ];
  for (const [a, b, c] of winLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // 'X' أو 'O'
    }
  }
  if (!board.includes(null)) return 'Draw';
  return null;
}
function buildXOGrid(board, prefix, disabled = false) {
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const val = board[idx];
      const btn = new ButtonBuilder()
        .setCustomId(`${prefix}_${idx}`)
        .setStyle(val === 'X' ? ButtonStyle.Secondary : val === 'O' ? ButtonStyle.Secondary : ButtonStyle.Secondary)
        .setDisabled(disabled || val !== null);

      // تم الإصلاح هنا: تمرير الإيموجي كـ Object
      if (val === 'X') btn.setEmoji({ id: "1407439999611310130" });
      else if (val === 'O') btn.setEmoji({ id: "1481411513632686181" });
      else btn.setLabel("\u200B"); // مسافة مخفية مقبولة في ديسكورد
      
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}
/******************************************
 * 🤖 X-O Solo (ضد البوت)
 ******************************************/
const activeSoloXO = new Map(); // userId -> game

async function startSoloXO(interaction, bet) {
  const userId = interaction.user.id;
  const game = {
    userId,
    bet,
    board: Array(9).fill(null),
    msgId: null
  };
  activeSoloXO.set(userId, game);

  const embed = new EmbedBuilder()
    .setTitle(" إكس أو (ضد البوت)")
    .setColor("#8527ff")
    .setDescription(`**رهانك:** ${bet.toLocaleString("en-US")} ريال`);

  const components = buildXOGrid(game.board, `soloxo_${userId}`);
  
  if (!interaction.replied && !interaction.deferred) await interaction.deferUpdate().catch(() => {});
  const msg = await interaction.channel.send({ embeds: [embed], components });
  game.msgId = msg.id;
}

async function handleSoloXOButtons(i) {
  if (!i.isButton()) return;
  const parts = i.customId.split("_");
  const userId = parts[1];
  const idx = parseInt(parts[2]);

  if (i.user.id !== userId) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذي الجيم مو لك!", ephemeral: true });
  
  const game = activeSoloXO.get(userId);
  if (!game) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> اللعبة انتهت أو غير موجودة.", ephemeral: true });

  await i.deferUpdate().catch(() => {});
  
  // حركة اللاعب
  game.board[idx] = 'X';
  let result = checkXOWin(game.board);

  // حركة البوت لو ما خلصت اللعبة
  if (!result) {
    const empty = game.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (empty.length > 0) {
      const botMove = empty[Math.floor(Math.random() * empty.length)];
      game.board[botMove] = 'O';
      result = checkXOWin(game.board);
    }
  }

  const embed = new EmbedBuilder().setTitle(" إكس أو (ضد البوت)");
  let components = buildXOGrid(game.board, `soloxo_${userId}`, !!result);

  if (result) {
    activeSoloXO.delete(userId);
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("solo_retry_soloxo").setLabel("إعادة المحاولة").setEmoji("1407461810566860941").setStyle(ButtonStyle.Secondary)
    );
    components.push(retryRow);

    if (result === 'X') {
      const payout = game.bet * 2;
      await updateBalanceWithLog(db, userId, payout, " اكس او - فوز");
      await addBalance(userId, game.bet);
      await updateSoloStats(userId, "soloxo", game.bet, true, payout);
      embed.setColor("Green").setDescription(`<:icons8trophy100:1416394314904244234> **فزت على البوت!**\nربحت ${payout.toLocaleString("en-US")} ريال!`);
    } else if (result === 'O') {
      await db.collection("transactions").insertOne({ userId, amount: -game.bet, reason: " اكس او - خسارة", timestamp: new Date() });
      await updateSoloStats(userId, "soloxo", game.bet, false, 0);
      embed.setColor("Red").setDescription(`<:icons8wrong1001:1415979909825695914> **خسرت!** البوت فاز عليك.`);
    } else {
      await updateBalanceWithLog(db, userId, game.bet, " اكس او - تعادل");
      await updateSoloStats(userId, "soloxo", game.bet, false, game.bet);
      embed.setColor("Grey").setDescription(` **تعادل!** تم استرجاع رهانك.`);
    }
  } else {
  }

  await i.message.edit({ embeds: [embed], components }).catch(() => {});
}

/******************************************
اللوبي الجماعي - منطق كامل + صور (تقليم الزائدين عند البدء)
******************************************/

// الحالة العامة للوبيّات النشطة حسب القناة
const activeLobbies = {}; 
// { [channelId]: { hostId, gameId, players:{[userId]:{username,bet,joinedAt,ready}}, createdAt, status, messageId, timeout } }

// ترميز/فكّ ترميز داخل customId لتفادي مشكلة "_" مع الراوتر
const encodeId = (s) => String(s).replace(/_/g, "-");
const decodeId = (s) => String(s).replace(/-/g, "_");

// ادوات بناء الواجهة
function buildLobbyRow(isFull = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("lobby_join").setLabel(" انضمام").setStyle(ButtonStyle.Secondary).setEmoji("1408077902859472966").setDisabled(isFull),
    new ButtonBuilder().setCustomId("lobby_bet").setLabel(" تغيير الرهان").setStyle(ButtonStyle.Secondary).setEmoji("1408077696688459836"),
    new ButtonBuilder().setCustomId("lobby_leave").setLabel("انسحاب").setStyle(ButtonStyle.Secondary).setEmoji("1408077754557136926"),
    new ButtonBuilder().setCustomId("lobby_start").setLabel(" ابدا اللعبة").setStyle(ButtonStyle.Secondary).setEmoji("1408080743971950653")
  );
}

function buildPlayersLine(playersObj) {
  return Object.values(playersObj).map(p => p.username).join("، ");
}

async function updateLobbyMessage(i, lobby, gameInfo) {
  const playerCount = Object.keys(lobby.players).length;
  const maxPlayers = gameInfo.maxPlayers;
  const allPlayers = buildPlayersLine(lobby.players);
  const isFull = playerCount >= maxPlayers;
  const row = buildLobbyRow(isFull);

  const lobbyMessage = await i.channel.messages.fetch(lobby.messageId).catch(() => null);
  if (!lobbyMessage) return;

  const fs = require('fs');
  const imgPath = `./assets/lobbies/${lobby.gameId}.png`;
  const filesToAttach = fs.existsSync(imgPath) ? [imgPath] : []; // التأكد من وجود الصورة

  await lobbyMessage.edit({
    content: `<:icons8addusermale100:1408217026350153750> انضم (${playerCount}/${maxPlayers}) \n <:userssolidfull:1407423118993002668>  اللاعبين: ${allPlayers}`,
    files: filesToAttach,
    components: [row]
  }).catch(() => {});
}
/* اختيار لعبة متعددة اللاعبين (Select Menu) */
/* اختيار لعبة متعددة اللاعبين (Select Menu) */
async function handleSelectMultiGame(i) {
  if (!i.isStringSelectMenu()) return;
  if (i.customId !== "select_multi_game") return;

  const gameId = i.values[0];
  const gameInfo = multiGamesMap[gameId];
  if (!gameInfo) return;

  // اغلق اي لوبي سابق في نفس القناة
  if (activeLobbies[i.channel.id]) delete activeLobbies[i.channel.id];

  const lobby = {
    hostId: i.user.id,
    gameId,
    players: {},
    createdAt: Date.now(),
    status: "waiting",
    messageId: null,
    timeout: null
  };
  activeLobbies[i.channel.id] = lobby;

  const playerCount = 0;
  const maxPlayers = gameInfo.maxPlayers;
  const isFull = playerCount >= maxPlayers;
  const row = buildLobbyRow(isFull);

  const fs = require('fs');
  const imgPath = `./assets/lobbies/${gameId}.png`;
  const filesToAttach = fs.existsSync(imgPath) ? [imgPath] : []; // تفادي كراش الصورة

  const sent = await i.update({
    content: `<:icons8addusermale100:1408217026350153750> انضم  (${playerCount}/${maxPlayers} )`,
    files: filesToAttach,
    components: [row],
    fetchReply: true
  }).catch(() => null);
  if (!sent) return;
  lobby.messageId = sent.id;

  // اغلاق تلقائي بعد 90 ثانية ان لم تبدا اللعبة
  lobby.timeout = setTimeout(() => {
    const current = activeLobbies[i.channel.id];
    if (!current || current.status !== "waiting") return;

    i.channel.messages.fetch(lobby.messageId).then(msg => {
      msg.edit({
        content: "<:icons8wrong1001:1415979909825695914> انتهى الوقت ولم يتم بدء اللعبة.",
        embeds: [],
        components: []
      }).catch(() => {});
    }).catch(() => {});
    delete activeLobbies[i.channel.id];
  }, 90000);
}
/* زر الانضمام */
async function handleLobbyJoin(i) {
  if (i.customId !== "lobby_join") return;
  const lobby = activeLobbies[i.channel.id];
  if (!lobby || lobby.status !== "waiting") {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا اللوبي غير متاح حالياً.", ephemeral: true });
  }
  const gameInfo = multiGamesMap[lobby.gameId];
  if (!gameInfo) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> اللعبة غير موجودة.", ephemeral: true });

  const userId = i.user.id;
  if (lobby.players[userId]) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> انت بالفعل في هذا اللوبي.", ephemeral: true });
  }

  const balance = await getBalance(userId);
  if (balance <= 0) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا يمكنك الانضمام، رصيدك صفر.", ephemeral: true });
  }

  // لو الرصيد اقل من 1000 → مودال لتحديد الرهان
  if (balance < 1000) {
    const modal = new ModalBuilder()
      .setCustomId(`force_bet_modal_${i.user.id}_${encodeId(lobby.gameId)}`)
      .setTitle(`رصيدك: ${balance.toLocaleString("en-US")} ريال`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("forced_bet_input")
            .setLabel(`ر اختر مبلغ تراهن فيه:`)
            .setPlaceholder("رصيدك اقل من الف ريال")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    return i.showModal(modal);
  }

  // خصم 1000 والانضمام مباشرة
  await subtractBalance(userId, 1000).catch(() => {});
  lobby.players[userId] = {
    username: i.member.displayName,
    bet: 1000,
    joinedAt: Date.now(),
    ready: true
  };

  await i.deferUpdate().catch(() => {});
  await updateLobbyMessage(i, lobby, gameInfo);
}

/* زر تغيير الرهان */
async function handleLobbyBet(i) {
  if (i.customId !== "lobby_bet") return;
  const lobby = activeLobbies[i.channel.id];
  if (!lobby || lobby.status !== "waiting") {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا اللوبي غير متاح حالياً.", ephemeral: true });
  }

  const userId = i.user.id;
  const player = lobby.players[userId];
  if (!player) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> يجب ان تنضم اولاً قبل تغيير الرهان.", ephemeral: true });

  const currentBet = player.bet || 1000;
  const balance = await getBalance(userId);

  lobby.players[userId].ready = false;

  const modal = new ModalBuilder()
    .setCustomId(`bet_modal_${i.user.id}_${encodeId(lobby.gameId)}`)
    .setTitle(`رصيدك: ${balance.toLocaleString("en-US")} ريال`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("forced_bet_input")
          .setLabel("ادخل مبلغ الرهان الجديد:")
          .setPlaceholder(` رهانك الحالي هو:  ${currentBet} ريال`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

  return i.showModal(modal);
}

/* زر الانسحاب */
/* زر الانسحاب */
async function handleLobbyLeave(i) {
  if (i.customId !== "lobby_leave") return;
  const lobby = activeLobbies[i.channel.id];
  if (!lobby || lobby.status !== "waiting") {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا اللوبي غير متاح حالياً.", ephemeral: true });
  }

  const userId = i.user.id;
  const player = lobby.players[userId];
  if (!player) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> انت لست ضمن هذا اللوبي.", ephemeral: true });

  delete lobby.players[userId];
  await addBalance(userId, player.bet).catch(() => {});

  const gameInfo = multiGamesMap[lobby.gameId];
  if (!gameInfo) return;

  const isFull = Object.keys(lobby.players).length >= gameInfo.maxPlayers;
  const row = buildLobbyRow(isFull);

  const lobbyMessage = await i.channel.messages.fetch(lobby.messageId).catch(() => null);
  if (lobbyMessage) {
    const playerCount = Object.keys(lobby.players).length;
    const maxPlayers = gameInfo.maxPlayers;
    const allPlayers = buildPlayersLine(lobby.players);

    const fs = require('fs');
    const imgPath = `./assets/lobbies/${lobby.gameId}.png`;
    const filesToAttach = fs.existsSync(imgPath) ? [imgPath] : []; // التأكد من وجود الصورة

    await lobbyMessage.edit({
      content: `<:icons8addusermale100:1408217026350153750> انضم (${playerCount}/${maxPlayers}) \n <:userssolidfull:1407423118993002668> اللاعبين: ${allPlayers} `,
      files: filesToAttach,
      components: [row]
    }).catch(() => {});
  }

  return i.reply({ content: "🚪 تم انسحابك من اللوبي وتم استرجاع المبلغ.", ephemeral: true });
}/* زر بدء اللعبة — تقليم الزائدين ثم البدء */
async function handleLobbyStart(i) {
  if (i.customId !== "lobby_start") return;

  const lobby = activeLobbies[i.channel.id];
  if (!lobby || lobby.status !== "waiting") {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا اللوبي غير متاح حالياً.", ephemeral: true });
  }

  const userId = i.user.id;
  const player = lobby.players[userId];
  if (!player) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> يجب ان تكون ضمن اللوبي لتبدا اللعبة.", ephemeral: true });
  }

  const gameInfo = multiGamesMap[lobby.gameId];
  if (!gameInfo) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذه اللعبة غير مدعومة حالياً.", ephemeral: true });
  }

  // 1) اذا العدد اكبر من الحد الاقصى: اقصِ آخر المنضمّين حتى يصل العدد للحد
  const entries = Object.entries(lobby.players)
    .sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0)); // الاقدم اولاً
  const maxPlayers = gameInfo.maxPlayers;
  if (entries.length > maxPlayers) {
    const overflow = entries.slice(maxPlayers); // هؤلاء سيتم طردهم (الاحدث انضماماً)
    for (const [uid, p] of overflow) {
      delete lobby.players[uid];
      // استرجاع المبلغ
      await addBalance(uid, p.bet).catch(() => {});
      // محاولة ابلاغ اللاعب بالخاص
      try {
      } catch {}
    }
    // تحدّيث رسالة اللوبي بعد التقليم
    await updateLobbyMessage(i, lobby, gameInfo);
  }

  // 2) تحقق الحد الادنى بعد التقليم
  const joinedPlayers = Object.entries(lobby.players);
  const readyPlayers = joinedPlayers.filter(([id, p]) => p.ready);
  if (readyPlayers.length < gameInfo.minPlayers) {
    return i.reply({
      content: `<:icons8wrong1001:1415979909825695914> تحتاج الى ${gameInfo.minPlayers} لاعبين جاهزين على الاقل لبدء اللعبة.`,
      ephemeral: true
    });
  }

  if (lobby.timeout) clearTimeout(lobby.timeout);

  await i.deferUpdate().catch(() => {});

  // حذف رسالة اللوبي بعد 2.5 ثانية
  const lobbyMessage = await i.channel.messages.fetch(lobby.messageId).catch(() => null);
  if (lobbyMessage) setTimeout(() => lobbyMessage.delete().catch(() => {}), 2500);

  // بدء اللعبة كما هو
  await gameInfo.start(i.channel.id);

  // حذف رد مؤقت ان وُجد
  setTimeout(() => {
    i.deleteReply && i.deleteReply().catch(() => {});
  }, 5000);
}

/* مودال الانضمام عند رصيد < 1000 */
async function handleForceBetModal(i, params) {
  // force_bet_modal_{userId}_{gameIdEncoded}
  const { userId, gameId } = params;
  const realGameId = decodeId(gameId);
  if (!i.isModalSubmit()) return;

  const lobby = activeLobbies[i.channel.id];
  if (!lobby || lobby.status !== "waiting") {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا اللوبي غير متاح حالياً.", ephemeral: true });
  }

  // اقرار سريع لتفادي فشل الانتراكشن
  await i.deferReply({ ephemeral: true }).catch(() => {});

  const input = i.fields.getTextInputValue("forced_bet_input");
  const betAmount = parseInt(input);
  if (isNaN(betAmount) || betAmount <= 0) {
    return i.editReply({ content: "<:icons8wrong1001:1415979909825695914> يرجى ادخال مبلغ رهان صالح." }).catch(() => {});
  }

  const balance = await getBalance(i.user.id);
  const currentBet = lobby.players[i.user.id]?.bet || 0;
  const maxAllowed = balance + currentBet;

  if (betAmount > maxAllowed) {
    return i.editReply({ content: `<:icons8wrong1001:1415979909825695914> لا تملك رصيداً كافياً. اقصى مبلغ يمكنك الرهان به هو ${maxAllowed}` }).catch(() => {});
  }

  if (!lobby.players[i.user.id]) {
    await subtractBalance(i.user.id, betAmount).catch(() => {});
    lobby.players[i.user.id] = {
      username: i.member.displayName,
      bet: betAmount,
      joinedAt: Date.now(),
      ready: true
    };
  } else {
    const oldBet = lobby.players[i.user.id].bet;
    await addBalance(i.user.id, oldBet).catch(() => {});
    await subtractBalance(i.user.id, betAmount).catch(() => {});
    lobby.players[i.user.id].bet = betAmount;
    lobby.players[i.user.id].ready = true;
  }

  const gameInfo = multiGamesMap[lobby.gameId];
  if (gameInfo) await updateLobbyMessage(i, lobby, gameInfo);

  return i.editReply({ content: "<:icons8correct1002:1415979896433278986> تم تحديث مبلغ الرهان وحالتك اصبحت جاهز." }).catch(() => {});
}

/* مودال تغيير الرهان (للاعب المنضم) */
async function handleBetModal(i, params) {
  // bet_modal_{userId}_{gameIdEncoded}
  const { userId, gameId } = params;
  const realGameId = decodeId(gameId);
  if (!i.isModalSubmit()) return;

  const lobby = activeLobbies[i.channel.id];
  if (!lobby || lobby.status !== "waiting") {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا اللوبي غير متاح حالياً.", ephemeral: true });
  }

  // اقرار سريع
  await i.deferReply({ ephemeral: true }).catch(() => {});

  const input = i.fields.getTextInputValue("forced_bet_input");
  const betAmount = parseInt(input);
  if (isNaN(betAmount) || betAmount <= 0) {
    return i.editReply({ content: "<:icons8wrong1001:1415979909825695914> يرجى ادخال مبلغ رهان صالح." }).catch(() => {});
  }

  const balance = await getBalance(i.user.id);
  const currentBet = lobby.players[i.user.id]?.bet || 0;
  const maxAllowed = balance + currentBet;

  if (betAmount > maxAllowed) {
    return i.editReply({ content: `<:icons8wrong1001:1415979909825695914> لا تملك رصيداً كافياً. اقصى مبلغ يمكنك الرهان به هو ${maxAllowed}` }).catch(() => {});
  }

  if (!lobby.players[i.user.id]) {
    await subtractBalance(i.user.id, betAmount).catch(() => {});
    lobby.players[i.user.id] = {
      username: i.member.displayName,
      bet: betAmount,
      joinedAt: Date.now(),
      ready: true
    };
  } else {
    const oldBet = lobby.players[i.user.id].bet;
    await addBalance(i.user.id, oldBet).catch(() => {});
    await subtractBalance(i.user.id, betAmount).catch(() => {});
    lobby.players[i.user.id].bet = betAmount;
    lobby.players[i.user.id].ready = true;
  }

  const gameInfo = multiGamesMap[lobby.gameId];
  if (gameInfo) await updateLobbyMessage(i, lobby, gameInfo);

  return i.editReply({ content: "<:icons8correct1002:1415979896433278986> تم تحديث مبلغ الرهان وحالتك اصبحت جاهز." }).catch(() => {});
}

/******************************************
* خريطة الالعاب الجماعية (محدثة)
******************************************/
const multiGamesMap = {
  multi_blackjack: {
    start: startMultiplayerBlackjack,
    handleInteraction: handleMultiplayerBlackjackInteraction,
    name: "بلاك جاك الجماعي",
    minPlayers: 2,
    maxPlayers: 2
  },
  multi_buckshot: {
    start: startMultiplayerBuckshot,
    name: "باكشوت الجماعي",
    minPlayers: 2,
    maxPlayers: 2
  },
  multi_kicker: {
    start: startRouletteGame,
    name: "روليت الاقصاء",
    minPlayers: 2,
    maxPlayers: 99
  },
  multi_colorwar: {
    start: startColorWar,
    handleInteraction: handleColorWarButton,
    name: "لعبة الالوان",
    minPlayers: 2,
    maxPlayers: 3
  },
  multi_time: {
    start: startTimeRoom,
    name: "غرفة الزمن",
    minPlayers: 2,
    maxPlayers: 10
  },
  multi_bomb: {
    start: startExplosionGame,
    name: "عداد الانفجار",
    minPlayers: 2,
    maxPlayers: 99
  },
  multi_xo: { // <== أضف هذا البلوك
    start: startMultiplayerXO,
    name: "اكس او",
    minPlayers: 2,
    maxPlayers: 2
  },
  multi_hide: {
    start: startHideGame,
    name: "لعبة هايد (غميمة)",
    minPlayers: 2,
    maxPlayers: 10
  }
};

/******************************************
 * 📊 احصائيات الالعاب الجماعية (جديدة) *
 ******************************************/

async function updateMultiplayerStats(userId, gameId, didWin, earned, lost) {
  const update = {
    $inc: {
      [`stats.${gameId}.gamesPlayed`]: 1,
      [`stats.${gameId}.${didWin ? "wins" : "losses"}`]: 1,
      [`stats.${gameId}.totalEarned`]: earned,
      [`stats.${gameId}.totalLost`]: lost,
    },
    $set: {
      [`stats.${gameId}.lastPlayed`]: new Date()
    }
  };

  await db.collection("multistats").updateOne(
    { userId },
    update,
    { upsert: true }
  );
}

async function showMultiplayerStats(user, interaction) {
  const userId = String(user.id);
  const doc = await db.collection("multistats").findOne({ userId });
  const allStats = doc?.stats || {};

  let totalWins = 0;
  let totalLosses = 0;
  let totalGames = 0;
  let totalEarned = 0;
  let totalLost = 0;

  for (const game of Object.values(allStats)) {
    totalWins += game.wins || 0;
    totalLosses += game.losses || 0;
    totalGames += game.gamesPlayed || 0;
    totalEarned += game.totalEarned || 0;
    totalLost += game.totalLost || 0;
  }

  const net = totalEarned - totalLost;
  const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0";

  const embed = new EmbedBuilder()
    .setTitle(` احصائيات الالعاب الجماعية لـ ${member.displayName}`)
    .addFields(
      { name: " مرات الفوز", value: `${totalWins} <:icons8trophy100:1416394314904244234> `, inline: true },
      { name: " مرات الخسارة", value: `${totalLosses} <:icons8loss100:1416394312056442980> `, inline: true },
      { name: "مجموع الجولات", value: `${totalGames}  <:icons8controller100:1407432162348634163> `, inline: true },
      { name: "نسبة الفوز", value: `${winRate}% <:icons8piechart100:1416394268716568789> `, inline: true },
      { name: "اجمالي الارباح", value: `${totalEarned.toLocaleString("en-US")} <:icons8money100:1416394266066030742> `, inline: true },
      { name: "اجمالي الخسائر", value: `${totalLost.toLocaleString("en-US")} <:icons8money100:1416394266066030742> `, inline: true },
      { name: "الصافي", value: `${net >= 0 ? `+${net.toLocaleString("en-US")} ` : net} <:icons8money100:1416394266066030742> `, inline: false }
    )
    .setColor(net >= 0 ? 0x2ecc71 : 0xe74c3c)
    .setFooter({ text: "احصائيات جميع الالعاب الجماعية حتى الآن" });

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

/******************************************
 * 🃏 Blackjack جماعي (بالصور) - نسخة مفصولة عن الاوفلاين
 * (متوافق مع الراوتر، دون تغيير المخرجات)
 ******************************************/

// خرائط الملفات
const valueMapMulti = {
  "A":"ace","J":"jack","Q":"queen","K":"king",
  "10":"ten","9":"nine","8":"eight","7":"seven",
  "6":"six","5":"five","4":"four","3":"three","2":"two"
};
const suitMapMulti  = { "♠️":"spade","♥️":"heart","♦️":"diamond","♣️":"club" };

function cardToFileMulti(card) {
  return `${valueMapMulti[card.value]}${suitMapMulti[card.suit]}.png`;
}

function drawCardMulti(ctx, card, x, y, w, h) {
  const file = cardToFileMulti(card);
  const img = assets[file];
  if (!img) {
    console.error("<:icons8wrong1001:1415979909825695914> صورة الكرت مفقودة:", file);
    if (assets["cardback.png"]) ctx.drawImage(assets["cardback.png"], x, y, w, h);
    return;
  }
  ctx.drawImage(img, x, y, w, h);
}

function createDeckMulti() {
  const suits = ['♠️','♥️','♦️','♣️'];
  const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  for (const suit of suits) for (const value of values) deck.push({ suit, value });
  return shuffleMulti(deck);
}

function shuffleMulti(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function drawFromDeckMulti(deck) { return deck.pop(); }

function calcHandMulti(hand) {
  let total = 0, aces = 0;
  for (const card of hand) {
    if (['J','Q','K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { aces++; total += 11; }
    else total += parseInt(card.value);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

// صورة حالة اللعبة لكل اللاعبين (نفس المخرجات)
async function renderBlackjackMulti(game) {
  const bg = assets.blackjack;
  if (!bg) throw new Error("Blackjack background missing");
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bg, 0, 0);

  // مواقع لاعبين (كما هو في الكود الاصلي)
  const playerPositions = [
    { x: 175, y: 100 }, // اللاعب الاول
    { x: 175, y: 625 }  // اللاعب الثاني
  ];

  let idx = 0;
  for (const playerId in game.players) {
    const player = game.players[playerId];
    const user = await client.users.fetch(playerId);
    const pos = playerPositions[idx] || playerPositions[playerPositions.length - 1];

    // كروت اللاعب
    player.hand.forEach((c, i) => drawCardMulti(ctx, c, pos.x + i * 250, pos.y, 250, 375));

    // صورة اللاعب
    try {
      const avatar = await loadUserAvatar(user);
      const offset = -110;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x + 20 + offset, pos.y + 120 + 65, 80, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, pos.x - 60 + offset, pos.y + 40 + 65, 160, 160);
      ctx.restore();
    } catch {}

    // المجموع
    const total = calcHandMulti(player.hand);
    ctx.fillStyle = "white";
    ctx.font = "bold 45px PressStart2P";
    ctx.fillText(`${member.displayName}: ${total}`, pos.x, pos.y - 40);

    idx++;
  }

  return canvas.toBuffer("image/png");
}

/******************************************
 * بدء اللعبة الجماعية
 ******************************************/
async function startMultiplayerBlackjack(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const gameInfo = multiGamesMap[lobby.gameId];
  const minPlayers = gameInfo?.minPlayers ?? 2;

  const readyPlayers = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, bet: p.bet }));

  if (readyPlayers.length < minPlayers) return;

  lobby.status = "playing";
  const deck = createDeckMulti();
  shuffleMulti(deck);

  const gameState = {
    players: {}, deck, channelId, gameId: lobby.gameId,
    gameMessageId: null
  };

  for (const player of readyPlayers) {
    gameState.players[player.id] = {
      hand: [drawFromDeckMulti(deck), drawFromDeckMulti(deck)],
      bet: player.bet,
      done: false,
      stood: false,
      userId: player.id
    };
  }

  activeGames[channelId] = gameState;
  await playNextTurnMulti(channelId);
}

/******************************************
 * الدور التالي
 ******************************************/
async function playNextTurnMulti(channelId) {
  const game = activeGames[channelId];
  if (!game) return;

  const players = Object.values(game.players);
  const remaining = players.filter(p => !p.done);

  if (remaining.length === 0) return finishGameMulti(channelId);

  const player = remaining[0];
  const total = calcHandMulti(player.hand);

  const buffer = await renderBlackjackMulti(game);
  const attachment = new AttachmentBuilder(buffer, { name: "blackjack_multi.png" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("hit").setLabel(" سحب").setStyle(ButtonStyle.Secondary).setEmoji("1407789070494597281"),
    new ButtonBuilder().setCustomId("stand").setLabel(" تثبيت").setStyle(ButtonStyle.Secondary).setEmoji("1407789061510402161"),
  );

  const channel = await client.channels.fetch(channelId);

  if (game.gameMessageId) {
    const msg = await channel.messages.fetch(game.gameMessageId).catch(() => null);
    if (msg) {
      await msg.edit({
        content: `🎴 دور <@${player.userId}> (المجموع: ${total})`,
        files: [attachment],
        components: [row]
      }).catch(() => {});
      return;
    }
  }

  const newMsg = await channel.send({
    content: `🎴 دور <@${player.userId}> (المجموع: ${total})`,
    files: [attachment],
    components: [row]
  });
  game.gameMessageId = newMsg.id;
}

/******************************************
 * التعامل مع الضغط على الازرار (عبر الراوتر)
 ******************************************/
async function handleMultiplayerBlackjackInteraction(i) {
  const game = activeGames[i.channel.id];
  if (!game) return;

  const player = game.players[i.user.id];
  if (!player) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> انت لست مشاركاً في هذه اللعبة.", ephemeral: true }).catch(() => {});
  if (player.done) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لقد انهيت دورك بالفعل.", ephemeral: true }).catch(() => {});

  const currentTurn = Object.values(game.players).find(p => !p.done);
  if (!currentTurn || currentTurn.userId !== i.user.id) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> ليس دورك حالياً!", ephemeral: true }).catch(() => {});
  }

  await i.deferUpdate().catch(() => {});

  if (i.customId === "hit") {
    const card = drawFromDeckMulti(game.deck);
    player.hand.push(card);

    const total = calcHandMulti(player.hand);

    if (total > 21) {
      // اولاً: نُحدّث صورة اللعبة لتظهر البطاقة الاخيرة
      try {
        const buffer = await renderBlackjackMulti(game);
        const attachment = new AttachmentBuilder(buffer, { name: "blackjack_multi.png" });
        const channel = await client.channels.fetch(i.channel.id);
        if (game.gameMessageId) {
          const msg = await channel.messages.fetch(game.gameMessageId).catch(() => null);
          if (msg) {
            await msg.edit({
              content: `🎴 دور <@${player.userId}> (المجموع: ${total})`,
              files: [attachment],
              components: [] // لا حاجة للازرار الآن
            }).catch(() => {});
          }
        } else {
          const newMsg = await channel.send({
            content: `🎴 دور <@${player.userId}> (المجموع: ${total})`,
            files: [attachment],
            components: []
          }).catch(() => null);
          if (newMsg) game.gameMessageId = newMsg.id;
        }
      } catch {}

      // ثانياً: ننهي اللعبة بعد اظهار البطاقة
      player.done = true;
      return finishGameMulti(i.channel.id);
    }

    return playNextTurnMulti(i.channel.id);
  }

  if (i.customId === "stand") {
    player.done = true;
    player.stood = true;
    return playNextTurnMulti(i.channel.id);
  }
}

/******************************************
 * انهاء اللعبة (نفس النصوص/المخرجات) + حذف الرسائل بعد 20s
 ******************************************/
async function finishGameMulti(channelId) {
  const game = activeGames[channelId];
  if (!game) return;

  const results = [];
  const totalPot = Object.values(game.players).reduce((sum, p) => sum + p.bet, 0);

  const bestScore = Math.max(
    ...Object.values(game.players).map(p => (calcHandMulti(p.hand) <= 21 ? calcHandMulti(p.hand) : 0))
  );

  const winners = [];

  for (const playerId in game.players) {
    const player = game.players[playerId];
    const total = calcHandMulti(player.hand);
    const handStr = player.hand.map(c => `${c.value}${c.suit}`).join(" ");

    let status = "";
    let logMsg = "";
    let reward = 0;

    if (total > 21) {
      status = "<:icons8wrong1001:1415979909825695914> خسر (تجاوز 21)";
      logMsg = "🃏 Blackjack جماعي - خسارة";
      // لا نخصم من الرصيد مرة اخرى (تم الخصم عند الانضمام)، فقط نسجل كشف حساب
      await db.collection("transactions").insertOne({
        userId: playerId, amount: -player.bet, reason: logMsg, timestamp: new Date()
      }).catch(() => {});
    } else if (total === bestScore) {
      status = total === 21 ? "<:icons8trophy100:1416394314904244234> بلاك جاك!" : `<:icons8correct1002:1415979896433278986> ${total}`;
      reward = Math.max(player.bet * 2, totalPot);
      logMsg = "🃏 Blackjack جماعي - فوز";
      // ايداع دفعة واحدة (payout) فقط وفق النظام الموحّد
      await updateBalanceWithLog(db, playerId, reward, logMsg).catch(() => {});
      await addBalance(playerId, player.bet).catch(() => {});
      winners.push(playerId);
    } else {
      status = `<:icons8wrong1001:1415979909825695914> ${total}`;
      logMsg = "🃏 Blackjack جماعي - خسارة";
      await db.collection("transactions").insertOne({
        userId: playerId, amount: -player.bet, reason: logMsg, timestamp: new Date()
      }).catch(() => {});
    }

    results.push(`<:usersolidfull:1407422287652720750> <@${playerId}> - يد: ${handStr} = ${status}`);
  }

  const channel = await client.channels.fetch(channelId);

  // حذف رسالة اللعب بعد 20 ثانية
  (async () => {
    if (game.gameMessageId) {
      try {
        const msg = await channel.messages.fetch(game.gameMessageId).catch(() => null);
        if (msg) setTimeout(() => msg.delete().catch(() => {}), 25000);
      } catch {}
    }
  })();

  // فائز واحد → صورة فائز
  if (winners.length === 1) {
    const winnerId = winners[0];
    const winnerUser = await client.users.fetch(winnerId);
    const avatar = await loadUserAvatar(winnerUser);

    const bg = assets.winnerBackground;
    const canvas = createCanvas(bg ? bg.width : 1200, bg ? bg.height : 1200);
    const ctx = canvas.getContext("2d");

    if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    const centerX = 529, centerY = 673, radius = 196;
    ctx.save();
    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.fillStyle = "#8FD6FF";
    ctx.font = "bold 64px PressStart2P";
    ctx.textAlign = "center";
    ctx.fillText(winnermember.displayName, centerX, centerY + 325);

    const buffer = canvas.toBuffer("image/png");
    const attachment = new AttachmentBuilder(buffer, { name: "winner.png" });

    const resultMsg = await channel.send({ files: [attachment] }).catch(() => {});
    if (resultMsg) setTimeout(() => resultMsg.delete().catch(() => {}), 20000);

  } else if (winners.length > 1) {
    // صورة تعادل
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext("2d");

    if (assets.drawBackground) ctx.drawImage(assets.drawBackground, 0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = "#333"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    ctx.fillStyle = "white";
  ctx.font = "bold 50px Cairo";
    ctx.textAlign = "center";
    ctx.fillText(" تعادل!", canvas.width / 2, 100);

    const buffer = canvas.toBuffer("image/png");
    const attachment = new AttachmentBuilder(buffer, { name: "draw.png" });

    const resultMsg = await channel.send({
      content: `تعادل بين: ${winners.map(id => `<@${id}>`).join(" و ")}`,
      files: [attachment]
    }).catch(() => {});
    if (resultMsg) setTimeout(() => resultMsg.delete().catch(() => {}), 20000);

  } else {
    const resultMsg = await channel.send("<:icons8wrong1001:1415979909825695914> ما فيه فائز بالجولة!").catch(() => {});
    if (resultMsg) setTimeout(() => resultMsg.delete().catch(() => {}), 40000);
  }

  delete activeGames[channelId];
}


/******************************************
 * 🎯 لعبة الالوان (Color War) - متعددة (متوافقة مع الراوتر)
 ******************************************/

// تخزين حالة كل جولة حسب channelId
const colorWarGames = {};

/******************************************
 * بدء الجولة من اللوبي
 ******************************************/
async function startColorWar(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, username: p.username, bet: p.bet }));

  if (players.length < 2) return;

  lobby.status = "playing";

  const colors = players.length === 2 ? ["🔴", "⚫"] : ["🔴", "⚫", "🔵"];
  const grid = generateColorGrid(colors);
  const assignedColors = shuffle(colors.slice());
  const currentIndex = Math.floor(Math.random() * players.length);

  const game = {
    players,
    playerColors: {},
    scores: {},
    revealed: Array(25).fill(false),
    grid,
    currentIndex,
    message: null,
    timer: null,
    timeLeft: 30,
    channelId,
    lastRenderedContent: "",
    lastRenderedGrid: ""
  };

  players.forEach((p, idx) => {
    game.playerColors[p.id] = assignedColors[idx];
    game.scores[p.id] = 0;
  });

  colorWarGames[channelId] = game;
  const channel = await client.channels.fetch(channelId);
  const message = await channel.send({ content: "🕹️ جاري تجهيز اللعبة..." });
  game.message = message;

  updateColorGameMessage(channelId);
  startColorGameTimer(channelId);
}

/******************************************
 * توليد الشبكة وتبديل العناصر
 ******************************************/
// توزيع متساوٍ + منح الخانات الزائدة عشوائياً للّون/الالوان
function generateColorGrid(colors) {
  const grid = [];
  const base = Math.floor(25 / colors.length);
  let leftovers = 25 - base * colors.length;

  // اجعل ترتيب منح الخانات الزائدة عشوائياً كي لا يُفضَّل لون ثابت
  const order = shuffle(colors.slice());

  for (const color of order) {
    const count = base + (leftovers-- > 0 ? 1 : 0);
    for (let i = 0; i < count; i++) grid.push(color);
  }
  return shuffle(grid);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/******************************************
 * المؤقّت وتحديث الرسالة
 ******************************************/
function startColorGameTimer(channelId) {
  const game = colorWarGames[channelId];
  if (!game) return;

  clearInterval(game.timer);
  game.timeLeft = 30;
  game.timer = setInterval(() => {
    game.timeLeft--;
    updateColorGameMessage(channelId);

    if (game.timeLeft <= 0) {
      clearInterval(game.timer);
      handleColorTimeout(channelId);
    }
  }, 1000);
}

function updateColorGameMessage(channelId) {
  const game = colorWarGames[channelId];
  if (!game) return;

  const { players, currentIndex, grid, revealed, playerColors } = game;
  const currentPlayer = players[currentIndex];

  const content = `🎯 دور: <@${currentPlayer.id}> | لونك: ${playerColors[currentPlayer.id]}`;
  const gridKey = revealed.map((r, i) => (r ? grid[i] : "_")).join("");

  if (content === game.lastRenderedContent && gridKey === game.lastRenderedGrid) return;
  game.lastRenderedContent = content;
  game.lastRenderedGrid = gridKey;

  const components = [];
  for (let row = 0; row < 5; row++) {
    const rowComp = new ActionRowBuilder();
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col;
      const revealedColor = revealed[idx] ? grid[idx] : "";
      const btn = new ButtonBuilder()
        .setCustomId(`color_${idx}`)
        .setLabel(revealedColor || "‎")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(revealed[idx]);
      rowComp.addComponents(btn);
    }
    components.push(rowComp);
  }

  if (game.message) {
    game.message.edit({ content, components }).catch(() => {});
  }
}

/******************************************
 * انتهاء الوقت
 ******************************************/
async function handleColorTimeout(channelId) {
  const game = colorWarGames[channelId];
  if (!game) return;

  const loser = game.players[game.currentIndex];
  const channel = client.channels.cache.get(channelId);

  if (game.players.length === 2) {
    const winner = game.players.find(p => p.id !== loser.id);
    const msg = await channel.send(`⏱️ <@${loser.id}> تاخر وتم استبعاده.\n<:icons8trophy100:1416394314904244234> الفائز: <@${winner.id}>`).catch(() => null);

    // حذف رسالة الفوز ورسالة اللعبة بعد 20 ثانية
    if (msg) setTimeout(() => msg.delete().catch(() => {}), 25000);
    if (game.message) setTimeout(() => game.message.delete().catch(() => {}), 25000);

    // انهاء صامت: تسوية مالية وتنظيف
    endColorGame(channelId, winner.id);
  } else {
    game.players.splice(game.currentIndex, 1);
    delete game.playerColors[loser.id];
    delete game.scores[loser.id];
    if (game.currentIndex >= game.players.length) game.currentIndex = 0;

    // رسالة معلومات يمكن حذفها بعد 20 ثانية (اختياري)
    const info = await channel.send(`⏱️ <@${loser.id}> تم استبعاده بسبب التاخير. اللعبة مستمرة.`).catch(() => null);
    if (info) setTimeout(() => info.delete().catch(() => {}), 25000);

    updateColorGameMessage(channelId);
    startColorGameTimer(channelId);
  }
}

/******************************************
 * معالج الازرار (عبر الراوتر)
 ******************************************/
async function handleColorWarButton(i) {
  const game = colorWarGames[i.channel.id];
  if (!game) return;

  const custom = i.customId;
  if (!custom.startsWith("color_")) return;

  const idx = parseInt(custom.slice("color_".length), 10);
  if (Number.isNaN(idx) || idx < 0 || idx > 24) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> خيار غير صالح.", ephemeral: true }).catch(() => {});
  }

  const currentPlayer = game.players[game.currentIndex];
  if (i.user.id !== currentPlayer.id) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> ليس دورك.", ephemeral: true }).catch(() => {});
  }
  if (game.revealed[idx]) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذه الخانة تم كشفها.", ephemeral: true }).catch(() => {});
  }

  await i.deferUpdate().catch(() => {});

  game.revealed[idx] = true;
  const color = game.grid[idx];
  if (color === game.playerColors[currentPlayer.id]) {
    game.scores[currentPlayer.id]++;
  }

  clearInterval(game.timer);
  game.currentIndex = (game.currentIndex + 1) % game.players.length;

  updateColorGameMessage(i.channel.id);

  if (game.revealed.every(cell => cell)) {
    finishColorGame(i.channel.id);
  } else {
    startColorGameTimer(i.channel.id);
  }
}

/******************************************
 * انهاء اللعبة بحساب النقاط المكشوفة
 ******************************************/
async function finishColorGame(channelId) {
  const game = colorWarGames[channelId];
  if (!game) return;

  let highest = -1;
  let winners = [];

  // حساب النقاط الفعلية (من الخانات المكشوفة فقط)
  for (const player of game.players) {
    const playerColor = game.playerColors[player.id];
    const actualCount = game.grid.filter((c, i) => game.revealed[i] && c === playerColor).length;
    game.scores[player.id] = actualCount;

    if (actualCount > highest) {
      highest = actualCount;
      winners = [player];
    } else if (actualCount === highest) {
      winners.push(player);
    }
  }

  const channel = client.channels.cache.get(channelId);
  let resultMsg;

  if (winners.length === 1) {
    resultMsg = await channel.send(`🎉 انتهت اللعبة!\n<:icons8trophy100:1416394314904244234> الفائز: <@${winners[0].id}> بعدد ${highest} من الخانات.`);
  } else {
    const mentionList = winners.map(p => `<@${p.id}>`).join(" و ");
    resultMsg = await channel.send(`🎉 انتهت اللعبة بالتعادل!\n🤝 الفائزون: ${mentionList} بعدد ${highest} من الخانات.`);
  }

  // تسوية مالية وفق النظام الموحّد
  const totalPot = game.players.reduce((sum, p) => sum + p.bet, 0);

  if (winners.length === 1) {
    const winner = winners[0];
    const reward = Math.max(winner.bet * 2, totalPot);
    await updateBalanceWithLog(db, winner.id, reward, "🎯 Color War - فوز").catch(() => {});
    await addBalance(winner.id, winner.bet).catch(() => {});
    for (const player of game.players) {
      if (player.id !== winner.id) {
        await db.collection("transactions").insertOne({
          userId: player.id,
          amount: -player.bet,
          reason: "🎯 Color War - خسارة",
          timestamp: new Date()
        }).catch(() => {});
      }
    }
  } else {
    const splitReward = Math.floor(totalPot / winners.length);
    for (const player of game.players) {
      const didWin = winners.some(w => w.id === player.id);
      if (didWin) {
        await updateBalanceWithLog(db, player.id, splitReward, "🎯 Color War - تعادل (فوز جزئي)").catch(() => {});
        await addBalance(player.id, player.bet).catch(() => {});
      } else {
        await db.collection("transactions").insertOne({
          userId: player.id,
          amount: -player.bet,
          reason: "🎯 Color War - خسارة",
          timestamp: new Date()
        }).catch(() => {});
      }
    }
  }

  // حذف رسالة الفوز ورسالة اللعبة بعد 20 ثانية
  if (resultMsg) setTimeout(() => resultMsg.delete().catch(() => {}), 25000);
  if (game.message) setTimeout(() => game.message.delete().catch(() => {}), 25000);

  clearInterval(game.timer);
  delete colorWarGames[channelId];
}

/******************************************
 * انهاء صامت عند الاستبعاد بالوقت (لا رسائل اضافية)
 ******************************************/
async function endColorGame(channelId, winnerId) {
  const game = colorWarGames[channelId];
  if (!game) return;

  const totalPot = game.players.reduce((sum, p) => sum + p.bet, 0);

  if (winnerId) {
    const winner = game.players.find(p => p.id === winnerId);
    const reward = Math.max(winner.bet * 2, totalPot);
    await updateBalanceWithLog(db, winnerId, reward, "🎯 Color War - فوز").catch(() => {});
    await addBalance(winnerId, winner.bet).catch(() => {});
    for (const p of game.players) {
      if (p.id !== winnerId) {
        await db.collection("transactions").insertOne({
          userId: p.id,
          amount: -p.bet,
          reason: "🎯 Color War - خسارة",
          timestamp: new Date()
        }).catch(() => {});
      }
    }
  }

  clearInterval(game.timer);
  delete colorWarGames[channelId];
}
/******************************************
 *  غرفة الزمن (Time Room) - متعددة (متوافقة مع الراوتر)
 ******************************************/

const timeRoomGames = {}; // channelId -> game

async function startTimeRoom(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, username: p.username, bet: p.bet }));

  if (players.length < 2) return;
  lobby.status = "playing";

  const explosionTime = getWeightedExplosionTime();

  const game = {
    players,                         // [{id, username, bet}]
    withdrawn: {},                   // { userId: { status:'left', multiplier, earned } | { multiplier } }
    lastCheckpoint: 1,
    startTime: Date.now(),
    checkpointMultipliers: [1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7],
    channelId,
    explosionTime,
    interval: null,
    message: null,
    secondsElapsed: 0
  };

  timeRoomGames[channelId] = game;

  // صف ازرار الانسحاب (زر لكل لاعب)
  const row = new ActionRowBuilder();
  for (const p of players) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`withdraw_${p.id}`)
        .setLabel(`${p.username}`)
        .setEmoji("1416383140338991244")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  const channel = await client.channels.fetch(channelId);
  const img = await renderTimeRoom(game);
  const msg = await channel.send({
    content: `💣 **غرفة الزمن بدات!** قاوم اطول وقت ممكن بدون ما تنفجر.\n⏱️ الوقت: 0 ثانية`,
    files: [img],
    components: [row]
  });

  game.message = msg;
  game.interval = setInterval(() => updateTimeRoom(channelId), 1000);
}

function getWeightedExplosionTime() {
  const weights = Array.from({ length: 60 }, (_, i) => {
    const s = i + 1;
    const early = Math.pow(61 - s, 1.2);
    const late = Math.pow(s, 1.2);
    return early * 0.5 + late * 0.5;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  const rand = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) return i + 1;
  }
  return 60;
}

async function renderTimeRoom(game, isFinal = false) {
  const canvas = createCanvas(assets.temproom.width, assets.temproom.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(assets.temproom, 0, 0, canvas.width, canvas.height);

  // العنوان
  ctx.font = "Bold 50px PressStart2P";
  ctx.fillStyle = "#8FD6FF";
  ctx.textAlign = "center";
  ctx.fillText("Temp Room Game", canvas.width / 2, 120);

  // الوقت
  ctx.font = "Bold 40px PressStart2P";
  ctx.fillStyle = "#CBA0E6";
  ctx.fillText(`${game.secondsElapsed} S`, canvas.width / 2, 225);

  // عدد اللاعبين المتبقين
  const stillPlaying = game.players.filter(p => !game.withdrawn[p.id] || game.withdrawn[p.id].status !== "left");
  ctx.font = "Bold 40px PressStart2P";
  ctx.fillStyle = "#8FD6FF";
  ctx.fillText(`Players: ${stillPlaying.length}`, canvas.width / 2, 325);

  // المضاعف الحالي
  ctx.font = "Bold 40px PressStart2P";
  ctx.fillStyle = "#CBA0E6";
  ctx.fillText(`Multiplier: x${game.lastCheckpoint}`, canvas.width / 2, 425);

  // الفائزين (المنسحبين بنجاح)
  const winners = Object.entries(game.withdrawn)
    .filter(([_, data]) => data.status === "left")
    .map(([id, data]) => {
      const player = game.players.find(p => p.id === id);
      return { username: player?.username || id, earned: data.earned };
    });
  ctx.font = "Bold 30px Arabic";
  ctx.fillStyle = "#8FD6FF";
  ctx.textAlign = "left";
  ctx.fillText("الفائزين:", 100, 510);
  winners.forEach((w, idx) => {
    ctx.fillText(`${w.username}: ${w.earned.toLocaleString("en-US")} SAR`, 100, 550 + idx * 50);
  });

  // الخاسرين عند النهاية فقط
  if (isFinal) {
    const losers = game.players.filter(p => !game.withdrawn[p.id] || game.withdrawn[p.id].status !== "left");
    ctx.font = "Bold 30px Arabic";
    ctx.fillStyle = "#8FD6FF";
    ctx.textAlign = "right";
    ctx.fillText("الخاسرين:", canvas.width - 550, 510);
    losers.forEach((l, idx) => {
      ctx.textAlign = "right";
      ctx.fillText(`${l.username}: -${l.bet.toLocaleString("en-US")} SAR`, canvas.width - 200, 550 + idx * 50);
    });
  }

  return new AttachmentBuilder(await canvas.encode("png"), { name: "temproom.png" });
}

async function updateTimeRoom(channelId) {
  const game = timeRoomGames[channelId];
  if (!game) return;

  game.secondsElapsed++;
  const stillPlaying = game.players.filter(p => !game.withdrawn[p.id] || game.withdrawn[p.id].status !== "left");

  // انفجار
  if (game.secondsElapsed === game.explosionTime) {
    clearInterval(game.interval);

    const losers = stillPlaying;
    const loserMentions = losers.map(p => `<@${p.id}>`).join(" و ");

    const img = await renderTimeRoom(game, true);
    const resultMsg = await game.message.edit({
      content: `💥 **انفجرت الغرفة بعد ${game.secondsElapsed} ثانية!**\nالخاسرون: ${loserMentions}`,
      files: [img],
      components: []
    });

    for (const loser of losers) {
      await db.collection("transactions").insertOne({
        userId: loser.id,
        amount: -loser.bet,
        reason: "💣 Time Room - خسارة",
        timestamp: new Date()
      });
      await updateMultiplayerStats(loser.id, "multi_time", false, 0, loser.bet);
    }

    setTimeout(() => resultMsg.delete().catch(() => {}), 15000);
    delete timeRoomGames[channelId];
    return;
  }

  // نقاط تشجيعية وتحديث المضاعف كل 5 ثوانٍ
  if (game.secondsElapsed % 5 === 0) {
    const checkpoint = Math.floor(game.secondsElapsed / 5) - 1;
    const multiplier = game.checkpointMultipliers[checkpoint] || game.lastCheckpoint;
    game.lastCheckpoint = multiplier;

    for (const p of stillPlaying) {
      if (!game.withdrawn[p.id]) {
        game.withdrawn[p.id] = { multiplier };
      } else if (game.withdrawn[p.id].status !== "left") {
        game.withdrawn[p.id].multiplier = multiplier;
      }
    }

    const img = await renderTimeRoom(game);
    await game.message.edit({
      content: `⏱️ الوقت: ${game.secondsElapsed} ثانية`,
      files: [img]
    }).catch(() => {});
  } else {
    await game.message.edit({
      content: `⏱️ الوقت: ${game.secondsElapsed} ثانية`
    }).catch(() => {});
  }
}

// زر الانسحاب عبر الراوتر: ui.buttonPrefix('withdraw_', handleTimeRoomWithdraw)
async function handleTimeRoomWithdraw(i) {
  const channelId = i.channel.id;
  const game = timeRoomGames[channelId];
  if (!game) return;

  await i.deferUpdate().catch(() => {});

  const userId = i.customId.replace("withdraw_", "");
  if (i.user.id !== userId) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> هذا الزر ليس لك!", ephemeral: true }).catch(() => {});
  }

  const player = game.players.find(p => p.id === userId);
  if (!player || (game.withdrawn[userId] && game.withdrawn[userId].status === "left")) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> انسحبت بالفعل.", ephemeral: true }).catch(() => {});
  }

  const checkpoint = game.withdrawn[userId]?.multiplier || game.lastCheckpoint || 1;
  const payout = Math.floor(player.bet * checkpoint); // الدفعة النهائية

  // ايداع دفعة واحدة فقط (بدون addBalance على اصل الرهان)
  await updateBalanceWithLog(db, userId, payout, `💣 Time Room - انسحاب ناجح`);
  await addBalance(userId, player.bet); // استرداد الرهان الاصلي
  await updateMultiplayerStats(userId, "multi_time", true, payout, 0);

  // تعليم اللاعب كمنسحب
  game.withdrawn[userId] = { status: "left", multiplier: checkpoint, earned: payout };

  // اعادة بناء الازرار للاعبين المتبقين فقط
  const row = new ActionRowBuilder();
  for (const p of game.players) {
    const stillIn = !game.withdrawn[p.id] || game.withdrawn[p.id].status !== "left";
    if (stillIn) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`withdraw_${p.id}`)
          .setLabel(`${p.username}`)
          .setEmoji("1416383140338991244")
          .setStyle(ButtonStyle.Secondary)
      );
    }
  }

  const img = await renderTimeRoom(game);
  await game.message.edit({
    content: `⏱️ الوقت: ${game.secondsElapsed} ثانية`,
    files: [img],
    components: row.components.length > 0 ? [row] : []
  }).catch(() => {});

  // ان انسحب الجميع قبل الانفجار
  const stillPlaying = game.players.filter(p => !game.withdrawn[p.id] || game.withdrawn[p.id].status !== "left");
  if (stillPlaying.length === 0) {
    const endMsg = await game.message.edit({
      content: `<:icons8correct1002:1415979896433278986> انسحب جميع اللاعبين قبل الانفجار!\nاللعبة انتهت.`,
      files: [img],
      components: []
    }).catch(() => {});
    if (endMsg) setTimeout(() => endMsg.delete().catch(() => {}), 60000);
    clearInterval(game.interval);
    delete timeRoomGames[channelId];
  }
}


/******************************************
 * 🔫 لعبة باكشوت الجماعي (Buckshot)
 ******************************************/

const buckshotMultiplayerGames = {};
const buckshotMultiItemsList = ["beer", "scope", "saw", "pills", "cuffs"];
const buckshotOneTimeItems = ["scope", "saw", "cuffs"]; // ادوات تُستخدم مرة واحدة لكل دور
const buckshotItemEmojis = {
  scope: "1407792799868522629",
  beer:  "1407792769551958046",
  saw:   "1407792789646868562",
  pills: "1407792778167058514",
  cuffs: "1407792760756506665"
};

// منطق مطابق للسولو
function consumeNextShotDouble(activeEffects, shooterId, isRealShot) {
  // يرجع 2 اذا المنشار نشط والطلقة حقيقية، والا 1
  // ويُلغى المنشار دائماً بعد "المحاولة التالية" سواء كانت فارغة او حقيقية
  let mult = 1;
  if (activeEffects.saw === shooterId) {
    mult = isRealShot ? 2 : 1;
    delete activeEffects.saw;
  }
  return mult;
}
function skipNextTurnFor(activeEffects, targetId) {
  // وضع الاصفاد على الخصم → يسقط دوره القادم مرة واحدة
  activeEffects.cuffed = targetId;
}
function shouldSkipTurn(activeEffects, targetId) {
  // هل خصم المُطلق مقيد الآن (يُسقط الدور مرة واحدة)؟
  return activeEffects.cuffed === targetId;
}
function clearCuffs(activeEffects) {
  delete activeEffects.cuffed;
}

async function startMultiplayerBuckshot(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => {
      const user = client.users.cache.get(id);
      return {
        id,
        username: p.username,
        bet: p.bet,
        health: 6,
        items: {},
        gotItemOnLowHealth: false,
        avatarURL: user ? user.displayAvatarURL({ extension: "png", size: 256 }) : null
      };
    });

  if (players.length !== 2) return;
  lobby.status = "playing";

  const game = {
    players: players.map(p => ({
      id: p.id,
      username: p.username,
      health: 6,
      bet: p.bet,
      items: {},
      gotItemOnLowHealth: false
    })),
    currentPlayerIndex: 0,
    deck: generateBuckshotDeck(),
    activeEffects: {},     // { saw: userId, cuffed: userId }
    gameMessage: null,
    channelId,
    log: "",
    usedThisTurn: {}       // الحماية لادوات once/turn
  };

  buckshotMultiplayerGames[channelId] = game;

  for (const player of game.players) giveBuckshotItems(player, 3);

  await renderMultiplayerBuckshot(channelId);

  const collector = game.gameMessage.createMessageComponentCollector({ time: 600_000 });
  collector.on("collect", async (i) => {
    const current = game.players[game.currentPlayerIndex];
    const other   = game.players[1 - game.currentPlayerIndex];
    const userId  = i.user.id;

    if (userId !== current.id) {
      return i.reply({ content: `<:icons8wrong1001:1415979909825695914> ليس دورك!`, ephemeral: true });
    }

    // استخدام اداة
    if (i.customId.startsWith("buckshot_use_")) {
      const item = i.customId.replace("buckshot_use_", "");
      const hasItem = current.items[item] && current.items[item] > 0;
      if (!hasItem) return i.reply({ content: `<:icons8wrong1001:1415979909825695914> لا تملك ${item} لاستخدامه.`, ephemeral: true });

      if (buckshotOneTimeItems.includes(item) && game.usedThisTurn[userId + "_" + item]) {
        return i.reply({ content: `<:icons8wrong1001:1415979909825695914> لا يمكنك استخدام ${item} اكثر من مرة في نفس الدور.`, ephemeral: true });
      }
      if (buckshotOneTimeItems.includes(item)) {
        game.usedThisTurn[userId + "_" + item] = true;
      }

      current.items[item]--;
      if (item === "scope") {
        const nextShot = game.deck[0];
        game.log = `استخدمت المنظار واكتشفت ان الطلقة القادمة${nextShot ? " حقيقية" : " فارغة"}`;
      } else if (item === "beer") {
        const removed = game.deck.shift();
        game.log = ` شربت البيرة وحذفت الطلقة (${removed ? " حقيقية" : " فارغة"})`;
        // اصلاح: لا نُعيد توليد الدكة هنا الا اذا فرغت تماماً
        if (game.deck.length === 0) game.deck = generateBuckshotDeck();
      } else if (item === "pills") {
        if (current.health < 6) {
          current.health++;
          game.log = `استخدمت الدواء واستعدت نقطة صحة`;
        } else {
          game.log = `حاولت استخدام الدواء لكن صحتك كاملة بالفعل`;
        }
      } else if (item === "saw") {
        game.activeEffects.saw = userId; // المنشار للطلقة التالية فقط
        game.log = `استخدمت المنشار والطلقة القادمة ستكون ضرر مضاعف`;
      } else if (item === "cuffs") {
        skipNextTurnFor(game.activeEffects, other.id); // اسقاط دور الخصم مرة واحدة
        game.log = `استخدمت الاصفاد وقيدت حركة الخصم`;
      }
      await i.deferUpdate();
      return renderMultiplayerBuckshot(channelId);
    }

    // اطلاق النار
    const shootSelf = i.customId === "buckshot_self";
    const target    = shootSelf ? current : other;

    // اصلاح: لا نُعيد توليد الدكة بسبب نفاد الطلقات الحقيقية فقط؛
    // نُعيد التوليد فقط اذا كانت الدكة فارغة قبل السحب.
    if (game.deck.length === 0) {
      game.deck = generateBuckshotDeck();
    }

    const shotIsReal = !!game.deck.shift();

    // ضرر المنشار (مثل السولو): يتضاعف فقط ان كانت الطلقة حقيقية ويُستهلك دائماً
    const dmgMult = consumeNextShotDouble(game.activeEffects, current.id, shotIsReal);
    const damage  = shotIsReal ? 1 * dmgMult : 0;

    // اصلاح: عند بقاء طلقات فارغة فقط، لن يحدث ضرر (لاننا لا نُعيد توليد الدكة قبل السحب)
    target.health -= damage;

    // السجل (كما هو)
    if (shootSelf) {
      if (shotIsReal) {
        game.log = damage === 2
          ? ` اطلق الخصم على نفسه وكانت طلقة حقيقية! نقص قلبان `
          : ` اطلق الخصم على نفسه وكانت طلقة حقيقية! نقص قلب `;
      } else {
        game.log = ` اطلقت على نفسك وكانت طلقة فارغة`;
      }
    } else {
      if (shotIsReal) {
        if (shouldSkipTurn(game.activeEffects, other.id)) {
          game.log = damage === 2
            ? `اطلقت على الخصم وكانت طلقة حقيقية! نقص قلبان والخصم مقيد `
            : `اطلقت على الخصم وكانت طلقة حقيقية! نقص قلب والخصم مقيد `;
        } else {
          game.log = damage === 2
            ? ` اطلق عليك الخصم وكانت طلقة حقيقية! نقصت قلبان `
            : ` اطلق عليك الخصم وكانت طلقة حقيقية! نقصت قلب `;
        }
      } else {
        if (shouldSkipTurn(game.activeEffects, other.id)) {
          game.log = `اطلقت على الخصم وكانت فارغة حاول مرة اخرى`;
        } else {
          game.log = ` اطلق عليك الخصم وكانت طلقة فارغة.`;
        }
      }
    }

    // اعادة توليد الدكة فقط عندما تنفد تماماً بعد السحب
    if (game.deck.length === 0) {
      game.deck = generateBuckshotDeck();
    }

    // مكافاة القلوب المنخفضة (مرّة واحدة لكل لاعب)
    for (const p of game.players) {
      if (!p.gotItemOnLowHealth && p.health <= 3) {
        p.gotItemOnLowHealth = true;
        giveBuckshotItems(p, 3);
        const enemy = game.players.find(pl => pl.id !== p.id);
        giveBuckshotItems(enemy, 2);
      }
    }

    // حسم الفوز (اصلاح الانتحار = خسارة)
    if (target.health <= 0) {
      const winner = shootSelf ? other : current;
      const loser  = shootSelf ? current : other;

      // الجائزة: الاكبر بين (رهان الفائز ×2) و(مجموع الرهانات)
      const totalPot = winner.bet + loser.bet;
      const payout   = Math.max(winner.bet * 2, totalPot);

      // مطابق للنظام الموحّد: ايداع دفعة واحدة فقط دون addBalance
      await updateBalanceWithLog(db, winner.id, payout, "🔫 Buckshot Multiplayer - فوز");
      await addBalance(winner.id, winner.bet); // استرداد رهان الفائز الاصلي
      await db.collection("transactions").insertOne({
        userId: loser.id,
        amount: -loser.bet,
        reason: "🔫 Buckshot Multiplayer - خسارة",
        timestamp: new Date()
      });

      await updateMultiplayerStats(winner.id, "multi_buckshot", true,  payout, 0);
      await updateMultiplayerStats(loser.id,  "multi_buckshot", false, 0, loser.bet);

      const resultMsg = await game.gameMessage.edit({
        content: `💀 <@${target.id}> مات! الفائز هو <@${winner.id}> 🎉`,
        embeds: [],
        components: []
      });

      setTimeout(() => resultMsg.delete().catch(() => {}), 60000);

      delete buckshotMultiplayerGames[channelId];
      collector.stop();
      return;
    }

    // منطق الاصفاد: اذا كان الخصم مقيداً → لا نقلب الدور هذه المرة
    const enemyWasCuffed = shouldSkipTurn(game.activeEffects, other.id);
    // الاصفاد تُستهلك بعد اول محاولة تالية (سواء الطلقة حقيقية او فارغة)
    clearCuffs(game.activeEffects);

    // ادوات once/turn تُصفّر مع بداية الدور الجديد
    game.usedThisTurn = {};

    // تبديل الدور:
    // - اذا اطلق على نفسه وكانت فارغة: يبقى الدور له
    // - اذا الخصم كان مقيداً: يبقى الدور للمُطلق (يسقط دور الخصم)
    // - غير ذلك: نقلب الدور
    if (!(shootSelf && !shotIsReal) && !enemyWasCuffed) {
      game.currentPlayerIndex = 1 - game.currentPlayerIndex;
    }

    await i.deferUpdate();
    await renderMultiplayerBuckshot(channelId);
  });
}

function giveBuckshotItems(player, count) {
  for (let i = 0; i < count; i++) {
    const item = buckshotMultiItemsList[Math.floor(Math.random() * buckshotMultiItemsList.length)];
    player.items[item] = (player.items[item] || 0) + 1;
  }
}

function generateBuckshotDeck() {
  let realCount, fakeCount, total;
  do {
    realCount = Math.floor(Math.random() * 8) + 1; // 1 → 8
    fakeCount = Math.floor(Math.random() * 8) + 1; // 1 → 8
    total = realCount + fakeCount;
  } while (Math.abs(realCount - fakeCount) > 3 || total > 12);
  const deck = Array(realCount).fill(true).concat(Array(fakeCount).fill(false));
  return deck.sort(() => Math.random() - 0.5);
}

async function renderMultiplayerBuckshot(channelId) {
  const game = buckshotMultiplayerGames[channelId];
  if (!game) return;

  const channel = await client.channels.fetch(channelId);
  const current = game.players[game.currentPlayerIndex];
  const other   = game.players[1 - game.currentPlayerIndex];

  const canvas = createCanvas(1152, 768);
  const ctx = canvas.getContext("2d");

  // الخلفية
  ctx.drawImage(assets.base, 0, 0, canvas.width, canvas.height);

  // القلوب (يسار) للاعب الحالي
  const currentHearts = current.health;
  const totalHearts = 6;
  for (let i = 0; i < totalHearts; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const startX = 50, startY = 190, cellW = 85, cellH = 63;
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    if (i < currentHearts) ctx.drawImage(assets.heart, x, y, 40, 40);
    else ctx.drawImage(assets.heartEmpty, x, y, 40, 40);
  }

  // الطلقات (شبكة 6×2 للعرض)
  const shuffledBullets = [...game.deck].slice(0, 12).sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffledBullets.length; i++) {
    const bullet = shuffledBullets[i];
    const icon = bullet ? assets.bulletReal : assets.bulletFake;
    const col = i % 6;
    const row = Math.floor(i / 6);
    const startX = 245, startY = 510, cellW = 120, cellH = 85;
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    ctx.drawImage(icon, x, y, 65, 65);
  }

  // الادوات (يمين)
  const toolOrder = ["beer", "scope", "saw", "pills", "cuffs"];
  for (let i = 0; i < toolOrder.length; i++) {
    let col = i % 2;
    let row = Math.floor(i / 2);
    const startX = 970, startY = 190, cellW = 85, cellH = 63;
    let x = startX + col * cellW;
    let y = startY + row * cellH;
    if (i === toolOrder.length - 1) x = startX + cellW / 2;

    const tool = toolOrder[i];
    const count = current.items[tool] || 0;
    const icon = assets[tool];
    ctx.drawImage(icon, x, y, 40, 40);

    ctx.fillStyle = "white";
  ctx.font = " 17px Cairo";
      ctx.textAlign = "center";
    ctx.fillText(`x${count}`, x + 45, y + 30);
  }

  // صورة اللاعب الحالي
  function drawCircularImage(ctx, img, centerX, centerY, radius) {
    const size = radius * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, centerX - radius, centerY - radius, size, size);
    ctx.restore();
  }
  try {
    const currentPlayer = game.players[game.currentPlayerIndex];
    const playerUser = await client.users.fetch(currentPlayer.id);
    const url = playerUser.displayAvatarURL({ extension: "png", size: 256 });
    const res = await fetch(url);
    const bufferAvatar = Buffer.from(await res.arrayBuffer());
    const avatarImg = await loadImage(bufferAvatar);
    drawCircularImage(ctx, avatarImg, 565, 300, 150);
  } catch (e) {
    console.error("<:icons8wrong1001:1415979909825695914> فشل تحميل صورة اللاعب الحالي:", e);
  }

  // سجل الاحداث
  if (game.log) {
    ctx.fillStyle = "white";
  ctx.font = "50px Cairo";
  ctx.textAlign = "center";
    ctx.fillText(game.log, canvas.width/2, 75);
  }

  const buffer = canvas.toBuffer("image/png");
  const file = new AttachmentBuilder(buffer, { name: "buckshot.png" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buckshot_self").setLabel("نفسك").setStyle(ButtonStyle.Secondary).setEmoji("1407795197760503919"),
    new ButtonBuilder().setCustomId("buckshot_enemy").setLabel("الخصم").setStyle(ButtonStyle.Secondary).setEmoji("1407795197760503919")
  );
  const row2 = new ActionRowBuilder().addComponents(
    buckshotMultiItemsList.map(t =>
      new ButtonBuilder()
        .setCustomId(`buckshot_use_${t}`)
        .setLabel(`${current.items[t] || 0}`)
        .setEmoji({ id: buckshotItemEmojis[t] })
        .setStyle(ButtonStyle.Secondary)
        .setDisabled((current.items[t] || 0) <= 0)
    )
  );

  if (!game.gameMessage) {
    const msg = await channel.send({ files: [file], components: [row, row2] });
    game.gameMessage = msg;
  } else {
    game.gameMessage.edit({ files: [file], components: [row, row2] }).catch(() => {});
  }
}

/******************************************
 * 💣 لعبة عداد الانفجار الجماعية — متوافقة مع الراوتر/الهلبِر
 ******************************************/

const explosionGames = {}; // channelId -> game

// اعداد جولة حسب رقمها (كما هو)
function getRoundSettings(round) {
  if (round === 1) return { duration: 20000, explodeAfter: 5000 };
  if (round === 2) return { duration: 15000, explodeAfter: 4000 };
  return { duration: 10000, explodeAfter: 3000 };
}

// بدء اللعبة من اللوبي
async function startExplosionGame(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, username: p.username }));

  if (players.length < 2) return;
  lobby.status = "playing";

  const game = {
    players,                 // [{id, username}]
    eliminated: [],          // [userId]
    currentHolder: null,     // userId
    holdStartTime: null,
    round: 1,
    roundStartTime: null,
    gameMessage: null,
    channelId,
    timeout: null,           // مؤقّت نهاية الجولة
    holdTimeout: null        // مؤقّت انفجار بسبب طول الامساك
  };

  explosionGames[channelId] = game;
  await startExplosionRound(channelId);
}

// بدء جولة جديدة
async function startExplosionRound(channelId) {
  const game = explosionGames[channelId];
  if (!game) return;

  const { duration, explodeAfter } = getRoundSettings(game.round);
  game.roundStartTime = Date.now();

  // اللاعبين الاحياء
  const alivePlayers = game.players.filter(p => !game.eliminated.includes(p.id));
  if (alivePlayers.length === 1) {
    // اعلان الفائز وتسوية الرهان
    return finishExplosionGame(channelId, alivePlayers[0]);
  }

  // اختيار حامل القنبلة عشوائياً من الاحياء
  game.currentHolder = alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
  game.holdStartTime = Date.now();

  // نظّف مؤقتات سابقة
  clearTimeoutSafely(game);

  // مؤقت نهاية الجولة (انفجار مؤكد عند انتهاء مدّة الجولة)
  game.timeout = setTimeout(() => bombExplodes(channelId), duration);
  // مؤقت انفجار بسبب طول الامساك
  game.holdTimeout = setTimeout(() => bombExplodes(channelId, true), explodeAfter);

  await renderExplosionGame(channelId);
}

// تمرير القنبلة (عبر الراوتر)
async function passBomb(i, targetId) {
  const game = explosionGames[i.channel.id];
  if (!game) {
    return i.reply({ content: "❌ لا توجد لعبة نشطة هنا.", ephemeral: true }).catch(() => {});
  }

  // 1. فحص إذا القنبلة مو بيده أساساً
  if (game.currentHolder !== i.user.id) {
    return i.reply({ content: "💣 القنبلة مو بيدك! فقط الشخص اللي طالعة صورته (ماسك القنبلة) يقدر يضغط الزر ويمررها.", ephemeral: true }).catch(() => {});
  }

  // دالة فحص الحياة
  const alive = id => !game.eliminated.includes(id);

  // 2. فحص إذا اللاعب انفجر وطلع من اللعبة وضغط متأخر
  if (!alive(i.user.id)) {
    return i.reply({ content: "💀 القنبلة انفجرت فيك وطلعت من اللعبة خلاص!", ephemeral: true }).catch(() => {});
  }

  // 3. فحص إذا يحاول يمررها لنفسه (حماية إضافية)
  if (targetId === i.user.id) {
    return i.reply({ content: "❌ ما تقدر تمرر القنبلة لنفسك يا ذكي!", ephemeral: true }).catch(() => {});
  }

  // 4. فحص إذا الضحية ميت أصلاً
  if (!alive(targetId)) {
    return i.reply({ content: "💀 هذا اللاعب منفجر وطالع من اللعبة، اختار شخص حي!", ephemeral: true }).catch(() => {});
  }

  // --- إذا كل الشروط سليمة، يتم التمرير بنجاح ---
  game.currentHolder = targetId;
  game.holdStartTime = Date.now();

  // إعادة ضبط مؤقت الإمساك فقط
  const { explodeAfter } = getRoundSettings(game.round);
  if (game.holdTimeout) clearTimeout(game.holdTimeout);
  game.holdTimeout = setTimeout(() => bombExplodes(i.channel.id, true), explodeAfter);

  await i.deferUpdate().catch(() => {});
  await renderExplosionGame(i.channel.id);
}
// انفجار القنبلة (انتهاء الامساك او نهاية مدّة الجولة)
async function bombExplodes(channelId, byHold = false) {
  const game = explosionGames[channelId];
  if (!game) return;

  // الضحية = حامل القنبلة الحالي
  const victimId = game.currentHolder;
  const victim = game.players.find(p => p.id === victimId);
  if (!victim) return;

  // استبعاد الضحية
  if (!game.eliminated.includes(victim.id)) game.eliminated.push(victim.id);

  // الانتقال للجولة التالية
  game.round += 1;

  // نظّف مؤقتات الجولة الحالية
  clearTimeoutSafely(game);

  await renderExplosionGame(channelId);

  // ابدا الجولة التالية بعد 3 ثوانٍ
  setTimeout(() => startExplosionRound(channelId), 3000);
}

// تسوية نهاية اللعبة واعلان الفائز (نفس المخرجات مع منطق مالي موحّد)
async function finishExplosionGame(channelId, winner) {
  const game = explosionGames[channelId];
  if (!game) return;

  const lobby = activeLobbies[channelId];
  if (!lobby) {
    // نظافة احتياطية
    clearTimeoutSafely(game);
    delete explosionGames[channelId];
    return;
  }

  // مجموع الرهانات
  const totalPot = Object.values(lobby.players).reduce((sum, p) => sum + (p.bet || 0), 0);
  const playerBet = lobby.players[winner.id]?.bet || 0;

  // الجائزة = الاكبر بين (رهان الفائز ×2) و(مجموع الرهانات)
  const payout = Math.max(playerBet * 2, totalPot);

  // الفائز: ايداع دفعة واحدة فقط (بدون addBalance اضافية)
  await updateBalanceWithLog(db, winner.id, payout, "💣 Explosion Multiplayer - فوز").catch(() => {});
  await addBalance(winner.id, playerBet).catch(() => {}); // استرداد الرهان الاصلي
  await updateMultiplayerStats(winner.id, "multi_explosion", true, payout, 0).catch(() => {});

  // الخاسرون: تسجيل -bet فقط
  for (const p of game.players) {
    if (p.id === winner.id) continue;
    const loserBet = lobby.players[p.id]?.bet || 0;
    await db.collection("transactions").insertOne({
      userId: p.id,
      amount: -loserBet,
      reason: "💣 Explosion Multiplayer - خسارة",
      timestamp: new Date()
    }).catch(() => {});
  }

  const channel = await client.channels.fetch(channelId);
  await game.gameMessage?.edit({
    content: `<:icons8trophy100:1416394314904244234> الفائز هو <@${winner.id}>! حصل على ${payout.toLocaleString("en-US")} 💰`,
    files: [],
    components: []
  }).catch(() => {});

  clearTimeoutSafely(game);
  delete explosionGames[channelId];
}

// رسم حالة اللعبة (نفس القالب والمخرجات)
async function renderExplosionGame(channelId) {
  const game = explosionGames[channelId];
  if (!game) return;

  const canvas = createCanvas(assets.explosion.width, assets.explosion.height);
  const ctx = canvas.getContext("2d");

  // الخلفية
  ctx.drawImage(assets.explosion, 0, 0, canvas.width, canvas.height);

  // العنوان
  ctx.font = "Bold 50px PressStart2P";
  ctx.fillStyle = "#8FD6FF";
  ctx.textAlign = "center";
  ctx.fillText("Explosion Game", canvas.width / 2, 100);

  // صورة حامل القنبلة
  if (game.currentHolder) {
    try {
      const avatar = await loadUserAvatar(await client.users.fetch(game.currentHolder));
      // x=501, y=670, radius=188 (كما هو)
      drawCircularImage(ctx, avatar, 501, 670, 188);
    } catch {}
  }

  const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "explosion.png" });

  // ازرار تمرير القنبلة لكل لاعب حيّ غير الحامل
  const row = new ActionRowBuilder().addComponents(
    game.players
      .filter(p => !game.eliminated.includes(p.id) && p.id !== game.currentHolder)
      .map(p => new ButtonBuilder()
        .setCustomId(`passbomb_${p.id}`)
        .setLabel(p.username)
        .setEmoji("1407818070734668058")
        .setStyle(ButtonStyle.Secondary))
  );

  const channel = await client.channels.fetch(channelId);
  if (!game.gameMessage) {
    game.gameMessage = await channel.send({ files: [attachment], components: [row] });
  } else {
    game.gameMessage.edit({ files: [attachment], components: [row] }).catch(() => {});
  }
}

// تنظيف المؤقتات
function clearTimeoutSafely(game) {
  try { if (game.timeout) clearTimeout(game.timeout); } catch {}
  try { if (game.holdTimeout) clearTimeout(game.holdTimeout); } catch {}
  game.timeout = null;
  game.holdTimeout = null;
}

/******************************************
 * ربط اللعبة مع الراوتر العام
 ******************************************/
// تمرير القنبلة
async function handleBombPass(i) {
  if (!i.isButton || !i.isButton()) return;
  if (!i.customId.startsWith("passbomb_")) return;
  const targetId = i.customId.substring("passbomb_".length);
  return passBomb(i, targetId);
}


/******************************************
 * 🎲 روليت الاقصاء الجماعية (مع GIF) — متوافقة مع الراوتر/الهلبِر
 ******************************************/

const GIFEncoder = require("gif-encoder-2");

const rouletteGames = {}; // channelId -> game
const wheelColors = ["#8FD6FF", "#91B8F5", "#A78EEB", "#CBA0E6"]


/* بدء اللعبة من اللوبي */
async function startRouletteGame(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, username: p.username }));

  if (players.length < 2) return;
  lobby.status = "playing";

  const game = {
    players,               // [{id, username}]
    eliminated: [],        // [userId]
    currentPlayer: null,   // userId (اللاعب الذي يقرر)
    roundStart: null,
    gameMessage: null,
    channelId,
    log: [],
    timeout: null          // مؤقّت الاقصاء عند عدم التفاعل
  };

  rouletteGames[channelId] = game;
  await nextRouletteTurn(channelId);
}

/* انهاء اللعبة وتوزيع الجوائز (منطق مالي موحّد) */
async function finishRouletteGame(channelId, winner) {
  const game = rouletteGames[channelId];
  if (!game) return;

  const lobby = activeLobbies[channelId];
  if (!lobby) {
    clearTimeoutSafe(game);
    delete rouletteGames[channelId];
    return;
  }

  const totalPot = Object.values(lobby.players).reduce((sum, p) => sum + (p.bet || 0), 0);
  const playerBet = lobby.players[winner.id]?.bet || 0;
  const payout = Math.max(playerBet * 2, totalPot);

  // الفائز: ايداع دفعة واحدة فقط (بدون addBalance)
  await updateBalanceWithLog(db, winner.id, payout, "🎲 Roulette - فوز").catch(() => {});
  await addBalance(winner.id, playerBet).catch(() => {}); // استرداد الرهان الاصلي
  await updateMultiplayerStats(winner.id, "roulette", true, payout, 0).catch(() => {});

  // الخاسرون: تسجيل -bet فقط
  for (const loser of game.players) {
    if (loser.id === winner.id) continue;
    const loserBet = lobby.players[loser.id]?.bet || 0;
    await db.collection("transactions").insertOne({
      userId: loser.id,
      amount: -loserBet,
      reason: "🎲 Roulette - خسارة",
      timestamp: new Date()
    }).catch(() => {});
  }

  await game.gameMessage?.edit({
    content: `<:icons8trophy100:1416394314904244234> الفائز هو <@${winner.id}>! وربح ${payout.toLocaleString("en-US")} 💰`,
    components: []
  }).catch(() => {});

  clearTimeoutSafe(game);
  delete rouletteGames[channelId];
}

/* اعداد الدور التالي */
async function nextRouletteTurn(channelId) {
  const game = rouletteGames[channelId];
  if (!game) return;

  const alivePlayers = game.players.filter(p => !game.eliminated.includes(p.id));

  if (alivePlayers.length === 1) {
    return finishRouletteGame(channelId, alivePlayers[0]);
  }

  game.currentPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
  game.roundStart = Math.floor(Date.now() / 1000);

  const cpName = game.players.find(p => p.id === game.currentPlayer)?.username;
  game.log.push(`🎯 الدور على: ${cpName}`);

  await renderRouletteGame(channelId);

  clearTimeoutSafe(game);
  // 15 ثانية ليتخذ القرار والا يُقصى تلقائياً
  game.timeout = setTimeout(() => eliminateInactive(channelId), 15000);
}

/* اقصاء غير المتفاعل */
async function eliminateInactive(channelId) {
  const game = rouletteGames[channelId];
  if (!game) return;

  game.eliminated.push(game.currentPlayer);
  const user = game.players.find(p => p.id === game.currentPlayer);
  game.log.push(`⏰ لم يتخذ ${member.displayName} قرارًا وتم اقصاؤه تلقائيًا.`);
  await renderRouletteGame(channelId);

  const remaining = game.players.filter(p => !game.eliminated.includes(p.id));
  if (remaining.length === 1) {
    return finishRouletteGame(channelId, remaining[0]);
  } else {
    setTimeout(() => nextRouletteTurn(channelId), 1000);
  }
}

/* معالجة الازرار (تحديد الاقصاء/التجاوز/العشوائي) */
async function handleRouletteAction(i, targetId) {
  const game = rouletteGames[i.channel.id];
  if (!game || game.currentPlayer !== i.user.id) return;

  const alive = game.players.filter(p => !game.eliminated.includes(p.id));

  if (targetId === "skip") {
    game.log.push(`🔄 ${i.member.displayName} قرر تجاوز الجولة دون اقصاء احد.`);
  } else if (targetId === "random") {
    const choices = alive.filter(p => p.id !== i.user.id);
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    if (chosen) {
      game.eliminated.push(chosen.id);
      game.log.push(`🎲 ${i.member.displayName} ضغط عشوائي، وتم طرد ${chosen.username}`);
    }
  } else {
    if (targetId === i.user.id) return; // لا يجوز طرد نفسك
    if (!alive.some(p => p.id === targetId)) return; // الهدف يجب ان يكون حياً
    game.eliminated.push(targetId);
    const target = game.players.find(p => p.id === targetId);
    game.log.push(`☠️ ${i.member.displayName} طرد ${target.username}`);
  }

  clearTimeoutSafe(game);
  await i.deferUpdate().catch(() => {});
  await renderRouletteGame(i.channel.id);

  const remaining = game.players.filter(p => !game.eliminated.includes(p.id));
  if (remaining.length === 1) {
    return finishRouletteGame(i.channel.id, remaining[0]);
  } else {
    setTimeout(() => nextRouletteTurn(i.channel.id), 1000);
  }
}

/* توليد GIF للعجلة */
/* توليد GIF للعجلة (مُحسّن وسريع جدًا) */
async function renderRouletteGif(game, duration = 3000) {
  // 1. تقليل الدقة للنصف لتسريع عملية الـ Encoding جداً
  const width = 576, height = 384; 
  const encoder = new GIFEncoder(width, height);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", { alpha: false }); // إلغاء الشفافية يسرع الأداء

  const alivePlayers = game.players.filter(p => !game.eliminated.includes(p.id));
  const angleStep = (2 * Math.PI) / alivePlayers.length;

  // 2. [السر] رسم العجلة مرة واحدة فقط على لوحة جانبية (Cache Canvas)
  const wheelCanvas = createCanvas(width, height);
  const wheelCtx = wheelCanvas.getContext("2d");
  
  wheelCtx.translate(width / 2, height / 2);
  alivePlayers.forEach((p, idx) => {
    const startAngle = idx * angleStep;
    const endAngle = startAngle + angleStep;

    wheelCtx.beginPath();
    wheelCtx.moveTo(0, 0);
    // تصغير القطر ليتناسب مع الدقة الجديدة
    wheelCtx.arc(0, 0, 150, startAngle, endAngle); 
    wheelCtx.closePath();
    wheelCtx.fillStyle = wheelColors[idx % wheelColors.length];
    wheelCtx.fill();

    // الأسماء
    const angle = startAngle + angleStep / 2;
    const x = Math.cos(angle) * 100;
    const y = Math.sin(angle) * 100;
    wheelCtx.save();
    wheelCtx.translate(x, y);
    wheelCtx.rotate(angle + Math.PI / 2);
    wheelCtx.font = "14px PressStart2P"; // تصغير الخط ليتناسب مع الدقة
    wheelCtx.fillStyle = "black";
    wheelCtx.textAlign = "center";
    wheelCtx.fillText(p.username, 0, 0);
    wheelCtx.restore();
  });

  // 3. إنشاء الإطارات عن طريق تدوير الصورة الجاهزة فقط (سريع جداً)
  const frames = [];
  // تقليل عدد الفريمات (15 فريم في 3 ثواني كافية جداً للخداع البصري)
  const steps = 30; 

  // رسم خلفية ديسكورد الرمادية الموحدة
  ctx.fillStyle = "#313338"; 

  for (let i = 0; i < steps; i++) {
    ctx.fillRect(0, 0, width, height); // تعبئة الخلفية

    const angleOffset = (i / steps) * Math.PI * 30; // سرعة الدوران

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angleOffset);
    ctx.translate(-width / 2, -height / 2);
    
    // رسم العجلة المخبأة مسبقاً
    ctx.drawImage(wheelCanvas, 0, 0);
    ctx.restore();

    // السهم الثابت (تم تعديل مكانه للدقة الجديدة)
    ctx.save();
    ctx.translate(width / 2 + 160, height / 2);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-15, 0);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    frames.push(ctx.getImageData(0, 0, width, height).data);
  }

  // 4. بناء الـ GIF
  encoder.start();
  encoder.setDelay(120); // 200ms لكل إطار لتتناسب مع الـ 15 خطوة
  encoder.setRepeat(0);
  encoder.setQuality(20); // جودة أقل = سرعة خيالية في الـ Encode
  for (const frame of frames) encoder.addFrame(frame, true);
  encoder.finish();
  
  return encoder.out.getData();
}
/* صورة النتيجة بين الجيف والازرار */
async function renderRouletteResult(game, winnerId) {
  const width = 1152, height = 768;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const alivePlayers = game.players.filter(p => !game.eliminated.includes(p.id));
  const angleStep = (2 * Math.PI) / alivePlayers.length;

  ctx.translate(width / 2, height / 2);

  // القطاعات
  alivePlayers.forEach((p, idx) => {
    const startAngle = idx * angleStep;
    const endAngle = startAngle + angleStep;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 300, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = wheelColors[idx % wheelColors.length];
    ctx.fill();
  });

  // دائرة وسط فاضية
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // الاسماء
  ctx.font = "28px PressStart2P";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  alivePlayers.forEach((p, idx) => {
    const angle = idx * angleStep + angleStep / 2;
    const x = Math.cos(angle) * 200;
    const y = Math.sin(angle) * 200;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(p.username, 0, 0);
    ctx.restore();
  });

  // صورة اللاعب "المختار" (هو currentPlayer) بالوسط
  const avatar = await loadUserAvatar(await client.users.fetch(winnerId));
  drawCircularImage(ctx, avatar, 0, 0, 120);

  // سهم يشير لقطاع اللاعب "المختار"
  const winnerIndex = alivePlayers.findIndex(p => p.id === winnerId);
  const winnerAngle = winnerIndex * angleStep + angleStep / 2;
  const arrowX = Math.cos(winnerAngle) * 330;
  const arrowY = Math.sin(winnerAngle) * 330;

  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(winnerAngle - Math.PI / 2);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(12, 10);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  return new AttachmentBuilder(await canvas.encode("png"), { name: "roulette_result.png" });
}

/* صورة الفوز بخلفية مخصصة */
/* صورة الفوز بخلفية مخصصة */
async function renderWinnerBackground(game, winnerId) {
  const winnerUser = await client.users.fetch(winnerId);
  const avatar = await loadUserAvatar(winnerUser);
  
  // ✅ جلب اسم اللاعب من بيانات اللعبة بدلاً من المتغير الوهمي
  const winnerPlayer = game.players.find(p => p.id === winnerId);
  const winnerName = winnerPlayer ? winnerPlayer.username : (winnerUser.globalName || winnerUser.username);

  const canvas = createCanvas(assets.winnerBackground.width, assets.winnerBackground.height);
  const ctx = canvas.getContext("2d");

  if (assets.winnerBackground) {
    ctx.drawImage(assets.winnerBackground, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const centerX = 529, centerY = 673, radius = 196;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.fillStyle = "#8FD6FF";
  ctx.font = "bold 48px PressStart2P";
  ctx.textAlign = "center";
  
  // ✅ وضعنا اسم الفائز الصحيح هنا
  ctx.fillText(winnerName, centerX, centerY + 325);

  return new AttachmentBuilder(await canvas.encode("png"), { name: "winner.png" });
}
/* عرض اللعبة (GIF -> نتيجة + ازرار) */
async function renderRouletteGame(channelId) {
  const game = rouletteGames[channelId];
  if (!game) return;

  const channel = await client.channels.fetch(channelId);
  const aliveCount = game.players.filter(p => !game.eliminated.includes(p.id)).length;

  // ان بقي لاعب واحد: صورة فائز
  if (aliveCount === 1) {
    const winner = game.players.find(p => !game.eliminated.includes(p.id));
    const resultImg = await renderWinnerBackground(game, winner.id);
    if (!game.gameMessage) {
      game.gameMessage = await channel.send({ files: [resultImg] });
    } else {
      game.gameMessage.edit({ files: [resultImg], components: [] }).catch(() => {});
    }
    return;
  }

  // GIF دوران
  const gifBuffer = await renderRouletteGif(game);
  if (!game.gameMessage) {
    game.gameMessage = await channel.send({
      files: [new AttachmentBuilder(gifBuffer, { name: "roulette.gif" })]
    });
  } else {
    await game.gameMessage.edit({
      files: [new AttachmentBuilder(gifBuffer, { name: "roulette.gif" })],
      components: []
    }).catch(() => {});
  }

  // بعد 3 ثواني: صورة النتيجة + الازرار
  setTimeout(async () => {
    const resultImg = await renderRouletteResult(game, game.currentPlayer);

    const row1 = new ActionRowBuilder().addComponents(
      game.players
        .filter(p => !game.eliminated.includes(p.id) && p.id !== game.currentPlayer)
        .map(p => new ButtonBuilder()
          .setCustomId(`roulette_${p.id}`)
          .setLabel(p.username)
          .setEmoji("1407422287652720750")
          .setStyle(ButtonStyle.Secondary))
    );

    const aliveCount2 = game.players.filter(p => !game.eliminated.includes(p.id)).length;

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("roulette_random")
        .setLabel(" عشوائي")
        .setEmoji("1408078698355232809")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(aliveCount2 === 2),
      new ButtonBuilder()
        .setCustomId("roulette_skip")
        .setLabel(" انسحاب")
        .setEmoji("1416383140338991244")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(aliveCount2 === 1)
    );

    game.gameMessage.edit({ files: [resultImg], components: [row1, row2] }).catch(() => {});
  }, 3000);
}

/* تنظيف مؤقّت الدور */
function clearTimeoutSafe(game) {
  try { if (game.timeout) clearTimeout(game.timeout); } catch {}
  game.timeout = null;
}

/******************************************
 * ربط الازرار مع الراوتر العام
 ******************************************/
async function handleRouletteButtons(i) {
  if (!i.isButton || !i.isButton()) return;
  if (!i.customId.startsWith("roulette_")) return;

  const key = i.customId.substring("roulette_".length);
  const targetId = key === "skip" ? "skip" : (key === "random" ? "random" : key);
  return handleRouletteAction(i, targetId);
}


/******************************************
 * ⚔️ X-O Multiplayer (ضد لاعب آخر)
 ******************************************/
const activeMultiXO = new Map(); // channelId -> game

async function startMultiplayerXO(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, username: p.username, bet: p.bet }));

  if (players.length !== 2) return;
  lobby.status = "playing";

  const p1 = players[0];
  const p2 = players[1];

  const game = {
    channelId,
    players: {
      [p1.id]: { symbol: 'X', ...p1 },
      [p2.id]: { symbol: 'O', ...p2 }
    },
    turn: p1.id,
    board: Array(9).fill(null),
    msgId: null
  };
  activeMultiXO.set(channelId, game);

  const embed = new EmbedBuilder()
    .setTitle(" إكس أو الجماعية")
    .setColor("#9340ff")
    .setDescription(`**اللاعبين:**\n❌ <@${p1.id}>\n⭕ <@${p2.id}>\n\nالرهان: ${p1.bet} ريال.\n\n🎮 **الدور الآن على:** <@${game.turn}>`);

  const components = buildXOGrid(game.board, `multixo_${channelId}`);
  const channel = await client.channels.fetch(channelId);
  const msg = await channel.send({ embeds: [embed], components });
  game.msgId = msg.id;
}

async function handleMultiXOButtons(i) {
  if (!i.isButton()) return;
  const parts = i.customId.split("_");
  const channelId = parts[1];
  const idx = parseInt(parts[2]);

  const game = activeMultiXO.get(channelId);
  if (!game) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> اللعبة انتهت.", ephemeral: true });

  const userId = i.user.id;
  if (!game.players[userId]) return i.reply({ content: "أنت لست من ضمن هذه اللعبة!", ephemeral: true });
  if (game.turn !== userId) return i.reply({ content: "⏳ اصبر، ليس دورك!", ephemeral: true });

  await i.deferUpdate().catch(() => {});

  const player = game.players[userId];
  game.board[idx] = player.symbol;

  const result = checkXOWin(game.board);
  let nextTurn = null;

  if (!result) {
    nextTurn = Object.keys(game.players).find(id => id !== userId);
    game.turn = nextTurn;
  }

  const embed = new EmbedBuilder().setTitle(" إكس أو الجماعية");
  const components = buildXOGrid(game.board, `multixo_${channelId}`, !!result);

  if (result) {
    activeMultiXO.delete(channelId);
    const p1 = Object.values(game.players)[0];
    const p2 = Object.values(game.players)[1];
    const totalPot = p1.bet + p2.bet;

    if (result === 'X' || result === 'O') {
      const winnerId = result === 'X' ? Object.keys(game.players).find(id => game.players[id].symbol === 'X') : Object.keys(game.players).find(id => game.players[id].symbol === 'O');
      const loserId = winnerId === p1.id ? p2.id : p1.id;
      const winner = game.players[winnerId];
      const loser = game.players[loserId];

      const payout = Math.max(winner.bet * 2, totalPot);

      await updateBalanceWithLog(db, winner.id, payout, " اكس او جماعي - فوز");
      await addBalance(winner.id, winner.bet);
      await updateMultiplayerStats(winner.id, "multi_xo", true, payout, 0);

      await db.collection("transactions").insertOne({ userId: loser.id, amount: -loser.bet, reason: " اكس او جماعي - خسارة", timestamp: new Date() });
      await updateMultiplayerStats(loser.id, "multi_xo", false, 0, loser.bet);

      embed.setColor("Green").setDescription(`<:icons8trophy100:1416394314904244234> **انتهت اللعبة!**\nالفائز هو <@${winnerId}> وربح ${payout.toLocaleString("en-US")} ريال!`);
    } else {
      // تعادل
      await updateBalanceWithLog(db, p1.id, p1.bet, " اكس او جماعي - تعادل");
      await updateBalanceWithLog(db, p2.id, p2.bet, " اكس او جماعي - تعادل");
      
      await updateMultiplayerStats(p1.id, "multi_xo", false, p1.bet, 0);
      await updateMultiplayerStats(p2.id, "multi_xo", false, p2.bet, 0);

      embed.setColor("Grey").setDescription(` **انتهت بالتعادل!**\nتم استرجاع الرهانات لكلا اللاعبين.`);
    }

    setTimeout(() => i.message.delete().catch(() => {}), 45000);
  } else {
    embed.setColor("#a45eff").setDescription(`**اللاعبين:**\n❌ <@${Object.keys(game.players).find(id => game.players[id].symbol === 'X')}>\n⭕ <@${Object.keys(game.players).find(id => game.players[id].symbol === 'O')}>\n\n🎮 **الدور الآن على:** <@${game.turn}>`);
  }

  await i.message.edit({ embeds: [embed], components }).catch(() => {});
}


/******************************************
 * 🙈 لعبة هايد (الغميمة) - نظام الأدوار (باتل رويال)
 ******************************************/

const hideGames = {}; // channelId -> game state

// بناء أزرار اللعبة (4x4)
function buildHideGrid(channelId, phase, revealedSpots = []) {
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 4; j++) {
      const idx = i * 4 + j;
      const btn = new ButtonBuilder()
        .setCustomId(`hide_${phase}_${channelId}_${idx}`)
        .setStyle(ButtonStyle.Secondary);

      if (phase === "seek" && revealedSpots.includes(idx)) {
        btn.setLabel("-").setDisabled(true).setStyle(ButtonStyle.Danger);
      } else {
        btn.setLabel("\u200B"); // مسافة مخفية
      }
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}

// 1. بدء اللعبة ومرحلة التخفي
async function startHideGame(channelId) {
  const lobby = activeLobbies[channelId];
  if (!lobby || lobby.status !== "waiting") return;

  const players = Object.entries(lobby.players)
    .filter(([_, p]) => p.ready)
    .map(([id, p]) => ({ id, username: p.username, bet: p.bet }));

  if (players.length < 2) return;
  lobby.status = "playing";

  const game = {
    channelId,
    players,
    alivePlayers: players.map(p => p.id), // قائمة بالأحياء
    hidingSpots: {}, // userId -> buttonIndex
    phase: "hide", // 'hide' or 'seek'
    currentPlayer: null, // من عليه الدور الآن
    revealed: [], // الأزرار اللي انفتحت
    msg: null,
    timer: null
  };

  hideGames[channelId] = game;

  const embed = new EmbedBuilder()
    .setTitle("🙈 لعبة هايد - مرحلة التخفي")
    .setColor("#2b2d31")
    .setDescription("معاكم **60 ثانية**! الكل يضغط على زر يختبئ وراه (عادي أكثر من شخص بنفس الزر).\n\n⚠️ اللي ما يختبئ راح ينطرد من الجولة.");

  const components = buildHideGrid(channelId, "hide");

  const channel = await client.channels.fetch(channelId);
  game.msg = await channel.send({ embeds: [embed], components });

  game.timer = setTimeout(() => {
    transitionToSeekPhase(channelId);
  }, 60000);
}

// 2. الانتقال لمرحلة البحث والأدوار
async function transitionToSeekPhase(channelId) {
  const game = hideGames[channelId];
  if (!game) return;

  if (game.timer) clearTimeout(game.timer);

  // طرد اللي ما اختاروا مكان واسترجاع فلوسهم
  const afkPlayers = game.players.filter(p => game.hidingSpots[p.id] === undefined);
  for (const afk of afkPlayers) {
    await addBalance(afk.id, afk.bet).catch(() => {});
    game.alivePlayers = game.alivePlayers.filter(id => id !== afk.id);
  }

  // تحديث قائمة اللاعبين الفعليين
  game.players = game.players.filter(p => game.hidingSpots[p.id] !== undefined);

  if (game.alivePlayers.length < 2) {
    for (const p of game.players) await addBalance(p.id, p.bet).catch(() => {});
    delete hideGames[channelId];
    return game.msg.edit({
      content: "❌ تم إلغاء اللعبة لأن عدد المختبئين غير كافٍ.",
      embeds: [],
      components: []
    }).catch(() => {});
  }

  game.phase = "seek";
  // اختيار أول لاعب عشوائياً ليبدأ الدور
  game.currentPlayer = game.alivePlayers[Math.floor(Math.random() * game.alivePlayers.length)];

  const embed = new EmbedBuilder()
    .setTitle("🕵️ لعبة هايد - مرحلة البحث")
    .setColor("#ffcc00")
    .setDescription(`انتهى وقت التخفي! وبدأ البحث.\n\n🎯 **الدور الآن على:** <@${game.currentPlayer}>\nاختار زر واحد تفتحه عشان تصيد الباقين!`);

  const components = buildHideGrid(channelId, "seek");
  await game.msg.edit({ embeds: [embed], components }).catch(() => {});

  // مؤقت الدور (20 ثانية) إذا ما لعب يطرد
  game.timer = setTimeout(() => handleTurnTimeout(channelId), 20000);
}

// دالة لمعالجة عدم تفاعل اللاعب في دوره
async function handleTurnTimeout(channelId) {
  const game = hideGames[channelId];
  if (!game) return;

  const timedOutPlayer = game.currentPlayer;
  game.alivePlayers = game.alivePlayers.filter(id => id !== timedOutPlayer);
  
  const text = `⏳ <@${timedOutPlayer}> تأخر في فتح الزر وتم استبعاده!`;

  if (game.alivePlayers.length <= 1) {
    return finishHideGame(channelId, text);
  }

  nextTurn(channelId, text);
}

// دالة لتمرير الدور للاعب التالي
function nextTurn(channelId, previousActionText) {
  const game = hideGames[channelId];
  if (!game) return;

  if (game.timer) clearTimeout(game.timer);

  // البحث عن اللاعب التالي في القائمة الأصلية بشرط يكون حي
  let currentIdx = game.players.findIndex(p => p.id === game.currentPlayer);
  let loops = 0;
  do {
    currentIdx = (currentIdx + 1) % game.players.length;
    loops++;
    if (loops > game.players.length) break; // حماية من التكرار اللانهائي
  } while (!game.alivePlayers.includes(game.players[currentIdx].id));

  game.currentPlayer = game.players[currentIdx].id;

  const embed = new EmbedBuilder()
    .setTitle("🕵️ لعبة هايد - مرحلة البحث")
    .setColor("#ffcc00")
    .setDescription(`${previousActionText}\n\n🎯 **الدور الآن على:** <@${game.currentPlayer}>\nاختار زر واحد تفتحه!`);

  const components = buildHideGrid(channelId, "seek", game.revealed);
  game.msg.edit({ embeds: [embed], components }).catch(() => {});

  game.timer = setTimeout(() => handleTurnTimeout(channelId), 20000);
}

// 3. التعامل مع ضغطات الأزرار
async function handleHideButtons(i) {
  if (!i.isButton()) return;
  const parts = i.customId.split("_"); // hide_{phase}_{channelId}_{idx}
  const phase = parts[1];
  const channelId = parts[2];
  const idx = parseInt(parts[3]);

  const game = hideGames[channelId];
  if (!game) return i.reply({ content: "❌ اللعبة انتهت أو غير موجودة.", ephemeral: true });

  const isPlaying = game.players.find(p => p.id === i.user.id);
  if (!isPlaying) return i.reply({ content: "❌ أنت لست من ضمن هذه اللعبة!", ephemeral: true });

  await i.deferUpdate().catch(() => {});

  // -------- مرحلة التخفي --------
  if (game.phase === "hide" && phase === "hide") {
    game.hidingSpots[i.user.id] = idx;
    
    // فحص إذا الكل اختار مكانه عشان نتخطى الانتظار
    if (Object.keys(game.hidingSpots).length === game.players.length) {
      transitionToSeekPhase(channelId);
    }
    return;
  }

  // -------- مرحلة البحث --------
  if (game.phase === "seek" && phase === "seek") {
    // التأكد إن الدور على اللي ضغط
    if (i.user.id !== game.currentPlayer) {
      return i.followUp({ content: "⏳ اصبر، مو دورك!", ephemeral: true });
    }

    if (game.revealed.includes(idx)) return; // الزر مضغوط مسبقاً
    
    if (game.timer) clearTimeout(game.timer);
    game.revealed.push(idx);

    // التحقق من وجود مختبئين في هذا الزر (من اللاعبين الأحياء فقط)
    const caughtPlayers = game.alivePlayers.filter(id => game.hidingSpots[id] === idx);
    let resultText = `🕵️ <@${game.currentPlayer}> فتش الزر رقم ${idx + 1}...\n`;

    if (caughtPlayers.length > 0) {
      // إخراج من تم صيدهم
      game.alivePlayers = game.alivePlayers.filter(id => !caughtPlayers.includes(id));
      
      const caughtMentions = caughtPlayers.map(id => `<@${id}>`).join(" و ");
      
      // إذا اللاعب فتش مكانه بالغلط (فضح نفسه)
      if (caughtPlayers.includes(game.currentPlayer)) {
        if (caughtPlayers.length === 1) {
          resultText += `**وصاد نفسه!** 🤦‍♂️ فضح مكانه وطلع برا اللعبة!`;
        } else {
          // إذا صاد نفسه مع الباقين وصار عدد الأحياء صفر (هو اللي سحب الزناد فيفوز)
          if (game.alivePlayers.length === 0) {
            resultText += `**وصاد نفسه مع:** ${caughtMentions}! 💥 فجر المكان باللي فيه وحسم الجيم لصالحه!`;
          } else {
            resultText += `**وصاد نفسه مع:** ${caughtMentions}! 💥 فضح مكانه وطيرهم معاه!`;
          }
        }
      } else {
        resultText += `**وصاد:** ${caughtMentions}! 🎯 طلعوا برا اللعبة!`;
      }
    } else {
      resultText += `ولقاه فاضي! 💨`;
    }

    // فحص الفوز: إذا بقى لاعب واحد فقط، أو إذا الكل ماتوا (مما يعني اللاعب الحالي فجر الكل معاه)
    if (game.alivePlayers.length <= 1) {
      // نرسل الـ currentPlayer كمعلومة إضافية عشان نتوجه كفائز لو صار "كاميكازي"
      return finishHideGame(channelId, resultText, game.currentPlayer);
    }

    // إذا ما انتهت اللعبة، ننتقل للدور اللي بعده
    nextTurn(channelId, resultText);
  }
}

// 4. إنهاء اللعبة وتوزيع الجوائز
async function finishHideGame(channelId, lastActionText, lastShooterId) {
  const game = hideGames[channelId];
  if (!game) return;

  if (game.timer) clearTimeout(game.timer);

  const totalPot = game.players.reduce((sum, p) => sum + p.bet, 0);
  const embed = new EmbedBuilder();

  let winnerId = null;

  // تحديد الفائز
  if (game.alivePlayers.length === 1) {
    winnerId = game.alivePlayers[0]; // الناجي الأخير
  } else if (game.alivePlayers.length === 0 && lastShooterId) {
    winnerId = lastShooterId; // الكل مات في آخر ضربة! اللي ضغط الزر يفوز (تدمير ذاتي تكتيكي)
  }

  if (winnerId) {
    const winner = game.players.find(p => p.id === winnerId);
    const payout = Math.max(winner.bet * 2, totalPot);

    await updateBalanceWithLog(db, winner.id, payout, "🙈 هايد جماعي - فوز");
    await addBalance(winner.id, winner.bet); // استرداد الرهان
    await updateMultiplayerStats(winner.id, "multi_hide", true, payout, 0);

    // تسجيل الخسارة للباقين
    for (const p of game.players) {
      if (p.id !== winner.id) {
        await db.collection("transactions").insertOne({ userId: p.id, amount: -p.bet, reason: "🙈 هايد جماعي - خسارة", timestamp: new Date() });
        await updateMultiplayerStats(p.id, "multi_hide", false, 0, p.bet);
      }
    }

    embed.setTitle("🏆 فائز واحد!")
         .setColor("Green")
         .setDescription(`${lastActionText}\n\nالناجي الأخير (أو اللي فجر الجميع) هو <@${winner.id}> 🎉\nربح الجائزة الكبرى: **${payout.toLocaleString("en-US")}** ريال! 💸`);
  } else {
    // حالة نادرة جداً لو الكل كانوا AFK ومافي أحد
    embed.setTitle("🤝 تعادل!")
         .setColor("Grey")
         .setDescription(`${lastActionText}\n\nالكل طلعوا من اللعبة! تم استرجاع رهانات جميع اللاعبين.`);
         
    for (const p of game.players) {
      await updateBalanceWithLog(db, p.id, p.bet, "🙈 هايد جماعي - تعادل");
      await updateMultiplayerStats(p.id, "multi_hide", false, p.bet, 0);
    }
  }

  // إظهار أماكن كل اللاعبين النهائية في الأزرار
  const finalRows = [];
  for (let i = 0; i < 4; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 4; j++) {
      const idx = i * 4 + j;
      const btn = new ButtonBuilder().setCustomId(`end_${idx}`).setDisabled(true);
      
      const playersHere = Object.entries(game.hidingSpots).filter(([_, spot]) => spot === idx).map(([id]) => id);
      if (playersHere.length > 0) {
        btn.setLabel("👀").setStyle(ButtonStyle.Success);
      } else {
        btn.setLabel("-").setStyle(ButtonStyle.Secondary);
      }
      row.addComponents(btn);
    }
    finalRows.push(row);
  }

  await game.msg.edit({ embeds: [embed], components: finalRows }).catch(() => {});
  delete hideGames[channelId];
}
////////////////////////////////////////////
// <:icons8correct1002:1415979896433278986> تريفيا - لعبة الاسئلة والاجوبة (محدثة للأسئلة والصور الجديدة)
////////////////////////////////////////////

const triviaGames = {}; // channelId -> { round, used, scores, msg, timer, currentIndex }
// تأكد أن ملف الأسئلة الجديد موجود في مجلد data واسمه questions.json
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "questions.json")));

// بدء اللعبة عند رسالة "تريفيا"
async function handleTriviaStartMessage(msg) {
  if (!msg.guild) return;
  await msg.channel.send("🎮 جاري بدء لعبة تريفيا...");
  return startTriviaGame(msg.channel, msg.author);
}

// تشغيل تريفيا على القناة مباشرة (بدون اختلاط مع اي تفاعل)
async function startTriviaGame(channel, starterUser) {
  const channelId = channel.id;

  // تنظيف اي جولة قديمة في نفس القناة
  if (triviaGames[channelId]?.timer) clearTimeout(triviaGames[channelId].timer);

  triviaGames[channelId] = {
    round: 0,
    used: new Set(),
    scores: new Map(),
    msg: null,
    timer: null,
    currentIndex: null
  };

  const bootstrap = await channel.send({ content: "🕹️ جاري التحضير..." });
  triviaGames[channelId].msg = bootstrap;

  return nextTriviaRound(channelId);
}

async function nextTriviaRound(channelId) {
  const state = triviaGames[channelId];
  if (!state) return;

  state.round += 1;
  // عدد جولات التريفيا
  if (state.round > 5) return triviaEndGame(channelId);

  if (state.used.size === questions.length) state.used.clear();

  let index;
  do {
    index = Math.floor(Math.random() * questions.length);
  } while (state.used.has(index));
  state.used.add(index);
  state.currentIndex = index;

  const questionDoc = questions[index];

  // 1. استخدام مسار الصور الجديد (المجلد: image)
  const imagePath = path.join(__dirname, "image", `question_${questionDoc.id}.png`);
  const attachment = new AttachmentBuilder(imagePath);

  // دالة لحماية الزر من تجاوز حد الديسكورد (80 حرف أقصى شيء)
  const formatLabel = (num, text) => {
    let label = `${num}- ${text}`;
    if (label.length > 80) return label.substring(0, 77) + "...";
    return label;
  };

  const round = state.round;
  
  // 2. وضع نصوص الخيارات داخل الأزرار مع ترتيبها في صفين (1-2) و (3-4)
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`trivia_answer_${round}_1`)
      .setLabel(formatLabel(1, questionDoc.options[0]))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`trivia_answer_${round}_2`)
      .setLabel(formatLabel(2, questionDoc.options[1]))
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`trivia_answer_${round}_3`)
      .setLabel(formatLabel(3, questionDoc.options[2]))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`trivia_answer_${round}_4`)
      .setLabel(formatLabel(4, questionDoc.options[3]))
      .setStyle(ButtonStyle.Secondary)
  );

  await state.msg.edit({ files: [attachment], components: [row1, row2], content: "" });

  // مؤقت 60 ثانية لانهاء اللعبة اذا لم تُجب اجابة صحيحة في هذه الجولة
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    triviaEndGame(channelId);
  }, 60000);
}
// زر اجابة: trivia_answer_{round}_{choice}
async function handleTriviaAnswerButton(i) {
  if (!i.customId.startsWith("trivia_answer_")) return;

  const parts = i.customId.split("_");
  const btnRound = parseInt(parts[2], 10);
  const choice = parseInt(parts[3], 10); // رقم الزر 1 أو 2 أو 3 أو 4

  const channelId = i.channel.id;
  const state = triviaGames[channelId];
  if (!state) return i.reply({ content: "<:icons8wrong1001:1415979909825695914> لا توجد لعبة تريفيا جارية.", ephemeral: true });

  if (btnRound !== state.round) {
    return i.reply({ content: "⌛ هذه الجولة انتهت او لم تبدا بعد.", ephemeral: true });
  }

  const questionDoc = questions[state.currentIndex];
  if (!questionDoc) {
    return i.reply({ content: "<:icons8wrong1001:1415979909825695914> حدث خطا في تحميل السؤال.", ephemeral: true });
  }

  // 🛠️ الحل: دالة تنظيف النصوص من النقاط والفواصل والمسافات الزائدة
  const cleanText = (str) => {
    return String(str)
      .trim()
      .replace(/[.،!؟?]/g, '') // مسح أي علامات ترقيم تسبب عدم التطابق
      .replace(/\s+/g, ' ');   // توحيد المسافات
  };

  // تطبيق التنظيف على خيار اللاعب والإجابة الصحيحة قبل المقارنة
  const selectedAnswerText = cleanText(questionDoc.options[choice - 1]);
  const correctAnswerText = cleanText(questionDoc.answer);

  if (selectedAnswerText === correctAnswerText) {
    // تسجيل نقطة للضاغط
    const userId = i.user.id;
    state.scores.set(userId, (state.scores.get(userId) || 0) + 1);

    await i.reply({ content: "<:icons8correct1002:1415979896433278986> اجابة صحيحة! كسبت 1000 <:ryal:1407444550863032330> 💸", ephemeral: true });
    await updateBalanceWithLog(db, userId, 1000, "🎮 تريفيا - اجابة صحيحة").catch(() => {});

    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    return nextTriviaRound(channelId);
  }

  return i.reply({ content: "<:icons8wrong1001:1415979909825695914> اجابتك غلط، حاول مرة اخرى.", ephemeral: true });
}
async function triviaEndGame(channelId) {
  const state = triviaGames[channelId];
  if (!state) return;

  if (state.timer) clearTimeout(state.timer);

  const top = [...state.scores.entries()].sort((a, b) => b[1] - a[1]);
  const winners =
    top.length > 0
      ? top.map(([id, score], i) => `**${i + 1}. <@${id}>** — ${score} اجابات صحيحة`).join("\n")
      : "لا احد اجاب 😢";

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("trivia_restart")
      .setLabel("جولة جديدة")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji({ id: "1407461810566860941", animated: true }),

    new ButtonBuilder()
      .setCustomId("trivia_end")
      .setLabel("انهاء")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1415979909825695914")
  );

  await state.msg.edit({
    content: `🏁 **انتهت اللعبة!**\n\n${winners}`,
    components: [buttons],
    files: []
  });
}

// ازرار ادارة نهاية/اعادة
async function handleTriviaControlButtons(i) {
  if (i.customId === "trivia_restart") {
    await i.deferUpdate().catch(() => {});
    return startTriviaGame(i.channel, i.user);
  }
  if (i.customId === "trivia_end") {
    await i.update({ content: " تم انهاء اللعبة.", components: [], files: [] }).catch(() => {});
    if (triviaGames[i.channel.id]?.timer) clearTimeout(triviaGames[i.channel.id].timer);
    delete triviaGames[i.channel.id];
  }
}

////////////////////////////////////////////
// 🎮 امر قمار الموحد (القائمة) — عبر الراوتر
////////////////////////////////////////////

async function handleGambleMainMenu(msg) {
const image = new AttachmentBuilder(
  path.join(__dirname, "assets", "templates", "Main_menu.png")
);  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("gamble_solo")
      .setLabel("الالعاب الفردية")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407422287652720750"),
    new ButtonBuilder()
      .setCustomId("gamble_multi")
      .setLabel(" الالعاب الجماعية")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407423118993002668")
  );

  await msg.channel.send({
    content: "<:icons8controller100:1407432162348634163> اختر نوع اللعب:",
    files: [image],
    components: [row]
  });
}

// عرض قائمة الالعاب (فردي/جماعي)
async function handleGambleCategory(i) {
  const isSolo = i.customId === "gamble_solo";

  const soloGames = [
    { label: " روليت", value: "soloroulette", emoji: { id: "1407429268350439535", animated: true } },
    { label: " مكينة السلوت", value: "soloslot", emoji: { id: "1407428069844848741", animated: true } },
    { label: " صندوق الحظ", value: "solomystery", emoji: { id: "1407431521631076412", animated: true } },
    { label: " تحدي الاوراق", value: "solobus", emoji: { id: "1407431501792149546", animated: true } },
    { label: " بلاك جاك", value: "blackjack", emoji: { id: "1407431511564619797", animated: true } },
    { label: " باكشوت", value: "buckshot", emoji: { id: "1407431387606290599", animated: true } },
    { label: " اكس او", value: "soloxo", emoji: { id: "1481411627738988674" } },
    { label: " مين أنا؟", value: "whoami", emoji: { name: "👤" } }, // <== أضف هذا السطر
  ];

  const multiGames = [
    { label: " بلاك جاك", value: "multi_blackjack", emoji: { id: "1407431511564619797", animated: true } },
    { label: " باكشوت ", value: "multi_buckshot", emoji: { id: "1407431387606290599", animated: true } },
    { label: " روليت ", value: "multi_kicker", emoji: { id: "1407429268350439535", animated: true } },
    { label: " لعبة الالوان", value: "multi_colorwar", emoji: { id: "1408209314287452292", animated: true } },
    { label: "الغرفة المؤقتة", value: "multi_time", emoji: { id: "1407436102033211562", animated: true } },
    { label: " القنبلة", value: "multi_bomb", emoji: { id: "1407436086329872488", animated: true } },
    { label: " اكس او", value: "multi_xo", emoji: { id: "1481411627738988674" } },
    { label: "الاختباء", value: "multi_hide", emoji: { id: "1482274983689322606" } } // <== أضف هذا السطر

  ];

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(isSolo ? "select_solo_game" : "select_multi_game")
      .setPlaceholder(" اختر لعبة")
      .addOptions(isSolo ? soloGames : multiGames)
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(isSolo ? "solostats" : "multi_stats")
      .setLabel(" احصائيات")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407426721619382313"),
    new ButtonBuilder()
      .setCustomId("back_to_main")
      .setLabel(" العودة")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407426312603439226")
  );

  return i.update({
    content: `<:icons8controller100:1407432162348634163> اختر اللعبة ${isSolo ? "الفردية " : "الجماعية "} التي تريدها:`,
    files: [isSolo ? "./assets/gamble_solo.png" : "./assets/gamble_multi.png"],
    components: [menu, buttons]
  });
}

// زر العودة
async function handleBackToMain(i) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("gamble_solo")
      .setLabel("الالعاب الفردية")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407422287652720750"),
    new ButtonBuilder()
      .setCustomId("gamble_multi")
      .setLabel(" الالعاب الجماعية")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("1407423118993002668")
  );

  return i.update({
    content: "<:icons8controller100:1407432162348634163> اختر نوع اللعب:",
    files: [path.join(__dirname, "assets", "templates", "Main_menu.png")],
    components: [row]
  });
}

async function handleSoloStatsButton(i) {
  try { if (!i.deferred && !i.replied) await i.deferUpdate(); } catch {}
  const embed = await getSoloStatsEmbed(i, "all");
  const sent = await i.channel.send({ embeds: [embed] });
  setTimeout(() => sent.delete().catch(() => {}), 10000);
}
async function handleMultiStatsButton(i) {
  await showMultiplayerStats(i.user, i);
}


/******************************************
 * اختصارات نصية للالعاب الفردية — عبر الراوتر
 ******************************************/
async function handleTextGameShortcut(msg, gameId) {
  const bal = await getBalance(msg.author.id);
  await showBetInterface(msg, msg.author.id, gameId, bal, 1000);
}


/******************************************
 * اوامر المحفظة والتحويل — عبر الراوتر (تفاعلي + صور)
 ******************************************/

// تحميل الافاتار/الرسم كما هو
async function loadUserAvatar(user) {
  const url = user.displayAvatarURL({ extension: "png", size: 256 });
  return await loadImage(url);
}

function drawCircularImage(ctx, img, x, y, radius) {
  const size = radius * 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x - radius, y - radius, size, size);
  ctx.restore();
}

function drawText(ctx, text, x, y, font = "100px", color = "#b0d4eb", align = "center") {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// امر "رصيد" (نفس كودك مع الصورة)
async function handleWalletMessage(msg) {
  const balance = await getBalance(msg.author.id);
  const background = await loadImage(path.join(__dirname, "صوره المحفظه.png"));
  const avatarImage = await loadUserAvatar(msg.author);

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(background, 0, 0);
  drawCircularImage(ctx, avatarImage, 294, 237, 139);
  drawText(ctx, `${balance.toLocaleString("en-US")}`, 750, 605);
  drawText(ctx, `${msg.author.id}`, 300, 950, "35px cairo");

  const buffer = canvas.toBuffer("image/png");
  const attachment = new AttachmentBuilder(buffer, { name: "wallet.png" });
  return msg.reply({ files: [attachment] });
}

// ==========================================
// نظام التحويل التفاعلي المدمج
// ==========================================
const transferState = new Map();

function buildTransferControls(options) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("bank_transfer_select_user")
    .setPlaceholder("اختر المستفيد")
    .addOptions(options);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("bank_transfer_key_1").setLabel("1").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_2").setLabel("2").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_3").setLabel("3").setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("bank_transfer_key_4").setLabel("4").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_5").setLabel("5").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_6").setLabel("6").setStyle(ButtonStyle.Secondary)
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("bank_transfer_key_7").setLabel("7").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_8").setLabel("8").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_9").setLabel("9").setStyle(ButtonStyle.Secondary)
  );
  const rowSelect = new ActionRowBuilder().addComponents(select);
  const rowCtrl = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("bank_transfer_key_مسح").setEmoji("1419791356179644588").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("bank_transfer_key_0").setLabel("0").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bank_transfer_key_تأكيد").setEmoji("1419532910070857749").setStyle(ButtonStyle.Success)
  );

  return [rowSelect, row1, row2, row3, rowCtrl];
}

// امر "تحويل" يفتح الواجهة بدلاً من الأمر النصي القديم
async function handleTransferMessage(msg) {
  const content = msg.content.trim();
  if (content !== "تحويل") return; // تجاهل أي شيء غير كلمة تحويل الصافية

  const senderId = msg.author.id;
  const walletBalance = await getBalance(senderId);

  const embed = new EmbedBuilder()
    .setTitle(`🏦 بنك ${msg.author.username}`)
    .setColor("Gold")
    .setDescription(`**الرصيد الحالي:** ${walletBalance.toLocaleString("en-US")} ريال\n`)
    .addFields(
      { name: "المبلغ الحالي", value: "—", inline: true },
      { name: "المستفيد", value: "لم يتم الاختيار", inline: true }
    );

  let options = [];
  if (msg.guild) {
    try {
      // جلب الأعضاء وتحويلهم لمصفوفة عادية لتفادي أخطاء الدوال
      const fetchedMembers = await msg.guild.members.fetch({ limit: 30 });
      const membersArray = Array.from(fetchedMembers.values());
      
      options = membersArray
        .filter(m => !m.user?.bot && m.id !== senderId)
        .map(m => ({ 
          label: String(m.displayName || m.user?.username || "مستخدم").slice(0, 50), 
          description: `ID: ${m.id}`, 
          value: m.id 
        }))
        .slice(0, 25);
    } catch (err) {
      console.error("فشل جلب الأعضاء:", err);
    }
  }

  if (options.length === 0) {
    options.push({ label: "لا يوجد أعضاء (أو فشل الجلب)", value: "none" });
  }

  const controls = buildTransferControls(options);
  transferState.set(senderId, { targetId: null, amount: "" });

  return await msg.reply({ embeds: [embed], components: controls });
}

// معالج اختيار المستفيد (القائمة المنسدلة)
async function handleTransferSelectUser(i) {
  const userId = i.user.id;
  const st = transferState.get(userId) || { targetId: null, amount: "" };
  
  st.targetId = i.values[0];
  transferState.set(userId, st);
  
  const member = i.guild.members.cache.get(st.targetId);
  const name = member ? member.displayName : "مستخدم غير معروف";

  const embed = EmbedBuilder.from(i.message.embeds[0]);
  const fields = embed.data.fields;
  const idx = fields.findIndex(f => f.name === "المستفيد");
  if (idx >= 0) fields[idx].value = `<@${st.targetId}> — **${name}**`;

  return await i.update({ embeds: [embed] }).catch(() => {});
}

// ==========================================
// قائمة الأعضاء الثابتة (لتفادي أخطاء جلب الأعضاء)
// ==========================================
const STATIC_USERS = [
  { name: "نايل", id: "532264405476573224" },
  { name: "لافندر", id: "545613574874071063" },
  { name: "شكشوكة", id: "1106288355228004372" },
  { name: "وحيدا", id: "696302530937880666" },
  { name: "سويدة", id: "1270057947334185053" },
  { name: "فيصل", id: "955228953113681970" },
  { name: "كركم", id: "1097381729007849554" },
  { name: "جبنة", id: "359427305979772938" },
  { name: "ريان", id: "1374244101205131274" },
  { name: "بريسلا", id: "830599978756997130" },
  { name: "خالد", id: "734187812236034108" }
];

// امر "تحويل" يفتح الواجهة بدلاً من الأمر النصي القديم
async function handleTransferMessage(msg) {
  const content = msg.content.trim();
  if (content !== "تحويل") return; // تجاهل أي شيء غير كلمة تحويل الصافية

  const senderId = msg.author.id;
  const walletBalance = await getBalance(senderId);

  const embed = new EmbedBuilder()
    .setTitle(`🏦 بنك ${msg.author.username}`)
    .setColor("Gold")
    .setDescription(`**الرصيد الحالي:** ${walletBalance.toLocaleString("en-US")} ريال\n`)
    .addFields(
      { name: "المبلغ الحالي", value: "—", inline: true },
      { name: "المستفيد", value: "لم يتم الاختيار", inline: true }
    );

  // استخدام القائمة الثابتة واستبعاد المرسل نفسه
  const options = STATIC_USERS
    .filter(m => m.id !== senderId)
    .map(m => ({ 
      label: m.name, 
      description: `ID: ${m.id}`, 
      value: m.id 
    }));

  if (options.length === 0) {
    options.push({ label: "لا يوجد أعضاء", value: "none" });
  }

  const controls = buildTransferControls(options);
  transferState.set(senderId, { targetId: null, amount: "" });

  return await msg.reply({ embeds: [embed], components: controls });
}

// معالج اختيار المستفيد (القائمة المنسدلة)
async function handleTransferSelectUser(i) {
  const userId = i.user.id;
  const st = transferState.get(userId) || { targetId: null, amount: "" };
  
  st.targetId = i.values[0];
  transferState.set(userId, st);
  
  // قراءة الاسم من القائمة الثابتة مباشرة
  const staticUser = STATIC_USERS.find(u => u.id === st.targetId);
  const name = staticUser ? staticUser.name : "مستخدم غير معروف";

  const embed = EmbedBuilder.from(i.message.embeds[0]);
  const fields = embed.data.fields;
  const idx = fields.findIndex(f => f.name === "المستفيد");
  if (idx >= 0) fields[idx].value = `<@${st.targetId}> — **${name}**`;

  return await i.update({ embeds: [embed] }).catch(() => {});
}

// معالج أزرار الأرقام وإصدار إيصال الصورة
async function handleTransferKeys(i) {
  const userId = i.user.id;
  const key = i.customId.replace("bank_transfer_key_", "");
  const st = transferState.get(userId) || { targetId: null, amount: "" };

  if (key === "مسح") {
    st.amount = st.amount.slice(0, -1);
  } else if (/^\d$/.test(key)) {
    if (st.amount.length < 10) st.amount += key;
  } 
  else if (key === "تأكيد") {
    const amount = parseInt(st.amount || "0");
    if (!st.targetId || st.targetId === "none") return i.reply({ content: "❌ اختر مستفيداً أولاً من القائمة.", ephemeral: true });
    if (!amount || amount <= 0) return i.reply({ content: "❌ أدخل مبلغاً صحيحاً.", ephemeral: true });

    const senderBalance = await getBalance(userId);
    if (senderBalance < amount) return i.reply({ content: "❌ رصيدك غير كافٍ.", ephemeral: true });

    // خصم وإضافة باستخدام دوالك الأساسية
    await subtractBalance(userId, amount);
    await addBalance(st.targetId, amount);

    // تسجيل العملية في الداتابيس لكشف الحساب
    try {
      await db.collection("transactions").insertMany([
        { userId: String(userId), amount: -amount, reason: `تحويل إلى <@${st.targetId}>`, timestamp: new Date() },
        { userId: String(st.targetId), amount: amount, reason: `تحويل من <@${userId}>`, timestamp: new Date() }
      ]);
    } catch(e) { console.error("Database log error:", e); }

    transferState.delete(userId); 
    await i.update({ content: "⏳ جاري إصدار الإيصال...", embeds: [], components: [] }).catch(() => {});

    // إنشاء صورة الإيصال وإرسالها
    try {
      const background = await loadImage(path.join(__dirname, "صوره التحويل.png"));
      const senderAvatar = await loadUserAvatar(i.user);
      
      let receiverAvatar;
      try {
        const receiverUser = await i.client.users.fetch(st.targetId);
        receiverAvatar = await loadUserAvatar(receiverUser);
      } catch {
        receiverAvatar = senderAvatar; // احتياطي في حال فشل جلب صورة المستفيد
      }

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0);

      // جلب الاسم من القائمة الثابتة للصورة
      const staticUser = STATIC_USERS.find(u => u.id === st.targetId);
      const nickname = staticUser ? staticUser.name : "مستخدم";

      drawCircularImage(ctx, senderAvatar, 330, 237, 160);
      drawCircularImage(ctx, receiverAvatar, 1320, 237, 160);
      drawText(ctx, `${amount.toLocaleString("en-US")}`, 850, 430, "115px");
      drawText(ctx, `${nickname}`, 850, 530, "75px Cairo", "#b0d4eb", "center");
      drawText(ctx, `${st.targetId}`, 850, 600, "25px Cairo", "#b0d4eb", "center");
      drawText(ctx, `${userId}`, 140, 1050, "35px c", "#b0d4eb", "left");

      const buffer = await canvas.encode("png");
      const attachment = new AttachmentBuilder(buffer, { name: "transfer.png" });
      
      return await i.editReply({ content: "✅ **تم التحويل بنجاح!**", files: [attachment] }).catch(() => {});
    } catch (err) {
      console.error(err);
      return await i.editReply({ content: `✅ **تم التحويل بنجاح!**\nمبلغ: ${amount.toLocaleString("en-US")} ريال إلى <@${st.targetId}>` }).catch(() => {});
    }
  }

  transferState.set(userId, st);

  // تحديث خانة المبلغ في الرسالة التفاعلية
  const embed = EmbedBuilder.from(i.message.embeds[0]);
  const fields = embed.data.fields;
  const idx = fields.findIndex(f => f.name === "المبلغ الحالي");
  if (idx >= 0) fields[idx].value = st.amount.length ? parseInt(st.amount).toLocaleString("en-US") + " ريال" : "—";
  
  return await i.update({ embeds: [embed] }).catch(() => {});
}
