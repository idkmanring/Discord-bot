// events/activityTracker.js
const { AuditLogEvent } = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SERVER_ID = "1182849389799149688"; 
const AFK_CHANNEL_ID = "1269523453799698453";
const FLUSH_INTERVAL = 60 * 1000; // كل 60 ثانية نرسل الدفعة

// ==========================================
// 📊 نظام جوجل شيت والـ Batching
// ==========================================
let googleDoc = null;

// الذاكرة المؤقتة (Queue) لكل الجداول اللي طلبتها
const sheetBuffers = {
  Messages: [],       // 1. الرسائل
  UserActivity: [],   // 2. نشاط المستخدمين (يُحدث دورياً)
  Voice: [],          // 3. الصوت (دخول، خروج، مدة)
  Gambling: [],       // 4. القمار والاقتصاد
  Engagement: [],     // 5. التفاعل (رياكشنز)
  Moderation: [],     // 6. الإدارة
  Events: [],         // 9. الأحداث العامة (دخول/خروج سيرفر)
  AI_Logs: []         // 8. سجل الذكاء الاصطناعي (جاهز للربط)
};

// ذواكر مؤقتة حسابية
const activeVoiceSessions = new Map(); // لحساب مدة الجلوس بالثواني
const userActivityStats = new Map();   // لتجميع نشاط المستخدمين

function getTimestamp() {
  return new Date().toISOString(); // صيغة ستاندرد ممتازة للتحليل
}

async function initGoogleSheets() {
  try {
    if (!process.env.SHEET_CLIENT_EMAIL || !process.env.SHEET_PRIVATE_KEY || !process.env.SHEET_ID) return;
    const auth = new JWT({ email: process.env.SHEET_CLIENT_EMAIL, key: process.env.SHEET_PRIVATE_KEY.replace(/\\n/g, '\n'), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    googleDoc = new GoogleSpreadsheet(process.env.SHEET_ID, auth);
    await googleDoc.loadInfo();
    console.log(`📊 Data Tracker Connected: [${googleDoc.title}]`);
  } catch (err) { console.error("❌ Google Sheets Error:", err.message); }
}
initGoogleSheets();

module.exports = function mountTracker(client, db) {
  if (!db) return;
  const usersCollection = db.collection("users");
  const transactionsCollection = db.collection("transactions"); 

  // ==========================================
  // 🔄 نظام تفريغ البيانات (Batch Processing)
  // ==========================================
  setInterval(async () => {
    if (!googleDoc) return;
    try {
      // تفريغ الـ Buffers في الشيت
      for (const [sheetName, rows] of Object.entries(sheetBuffers)) {
        if (rows.length > 0) {
          const sheet = googleDoc.sheetsByTitle[sheetName];
          if (sheet) {
            // نأخذ نسخة ونفرغ الذاكرة فوراً عشان ما نضيع بيانات جديدة وقت الإرسال
            const rowsToSend = [...rows];
            sheetBuffers[sheetName] = []; 
            await sheet.addRows(rowsToSend);
          }
        }
      }
    } catch (err) { console.error("Batch Flush Error:", err); }
  }, FLUSH_INTERVAL);

  // ==========================================
  // 1️⃣ جدول الرسائل (Messages)
  // ==========================================
  client.on("messageCreate", async (msg) => {
    if (msg.author.bot || !msg.guild || msg.guild.id !== SERVER_ID) return;

    const hasLink = /https?:\/\/[^\s]+/.test(msg.content);
    const hasEmoji = /<a?:.+?:\d+>|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/.test(msg.content);
    
    sheetBuffers.Messages.push({
      timestamp: getTimestamp(),
      channel_id: msg.channel.id,
      channel_name: msg.channel.name,
      user_id: msg.author.id,
      username: msg.author.username,
      message_id: msg.id,
      content_length: msg.content.length,
      word_count: msg.content.split(/\s+/).filter(w => w.length > 0).length,
      has_attachment: msg.attachments.size > 0,
      has_link: hasLink,
      has_emoji: hasEmoji,
      reply_to: msg.reference ? msg.reference.messageId : "null",
      is_thread: msg.channel.isThread()
    });

    // تحديث نشاط المستخدم محلياً
    const stats = userActivityStats.get(msg.author.id) || { msgs: 0, chars: 0 };
    stats.msgs += 1;
    stats.chars += msg.content.length;
    userActivityStats.set(msg.author.id, stats);
  });

  // ==========================================
  // 3️⃣ جدول الصوت (Voice) + حساب المدة
  // ==========================================
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.guild.id !== SERVER_ID || newState.member?.user.bot) return;
    const userId = newState.member.id;
    const username = newState.member.user.username;

    // حالة الميوت والديفن (Moderation / Voice)
    if (!oldState.mute && newState.mute) sheetBuffers.Voice.push({ timestamp: getTimestamp(), user_id: userId, action: "muted" });
    if (!oldState.deaf && newState.deaf) sheetBuffers.Voice.push({ timestamp: getTimestamp(), user_id: userId, action: "deafened" });

    // حساب الجلسات الصوتية (الدخول والخروج)
    if (!oldState.channelId && newState.channelId) {
      // دخل الروم
      activeVoiceSessions.set(userId, { joinTime: Date.now(), channelId: newState.channelId });
      sheetBuffers.Events.push({ timestamp: getTimestamp(), event_type: "voice_join", user_id: userId, channel_id: newState.channelId });
    } 
    else if (oldState.channelId && !newState.channelId) {
      // غادر الروم
      const session = activeVoiceSessions.get(userId);
      let duration = 0;
      if (session) {
        duration = Math.floor((Date.now() - session.joinTime) / 1000); // ثواني
        activeVoiceSessions.delete(userId);
      }
      
      sheetBuffers.Voice.push({
        timestamp: getTimestamp(),
        user_id: userId,
        channel_id: oldState.channel.id,
        duration_seconds: duration,
        action: "leave"
      });

      // هل هو طرد إداري؟ (ننتظر ثواني ونتأكد من الـ Audit Log)
      try {
        await new Promise(r => setTimeout(r, 4000));
        const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberDisconnect });
        const disconnectLog = fetchedLogs.entries.find(e => e.target.id === userId && (Date.now() - e.createdTimestamp) < 20000);
        if (disconnectLog) {
          sheetBuffers.Moderation.push({
            timestamp: getTimestamp(), user_id: userId, action_type: "voice_disconnect",
            moderator_id: disconnectLog.executor.id
          });
        }
      } catch (e) {}
    }
  });

  // ==========================================
  // 5️⃣ جدول التفاعل (Engagement)
  // ==========================================
  client.on("messageReactionAdd", (reaction, user) => {
    if (user.bot || reaction.message.guild?.id !== SERVER_ID) return;
    sheetBuffers.Engagement.push({
      timestamp: getTimestamp(),
      message_id: reaction.message.id,
      user_id: user.id,
      reaction_type: reaction.emoji.name,
      action: "add"
    });
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (user.bot || reaction.message.guild?.id !== SERVER_ID) return;
    sheetBuffers.Engagement.push({
      timestamp: getTimestamp(),
      message_id: reaction.message.id,
      user_id: user.id,
      reaction_type: reaction.emoji.name,
      action: "remove"
    });
  });

  // ==========================================
  // 6️⃣ & 9️⃣ الإدارة والأحداث (Moderation & Events)
  // ==========================================
  client.on("guildMemberAdd", member => {
    if (member.guild.id !== SERVER_ID) return;
    sheetBuffers.Events.push({ timestamp: getTimestamp(), event_type: "server_join", user_id: member.id });
  });

  client.on("guildMemberRemove", async member => {
    if (member.guild.id !== SERVER_ID) return;
    sheetBuffers.Events.push({ timestamp: getTimestamp(), event_type: "server_leave", user_id: member.id });
    
    // فحص الكيك
    try {
      await new Promise(r => setTimeout(r, 4000));
      const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
      const kickLog = fetchedLogs.entries.find(e => e.target.id === member.id && (Date.now() - e.createdTimestamp) < 20000);
      if (kickLog) {
        sheetBuffers.Moderation.push({
          timestamp: getTimestamp(), user_id: member.id, action_type: "kick", moderator_id: kickLog.executor.id
        });
      }
    } catch (err) {}
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.guild.id !== SERVER_ID) return;
    if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
      sheetBuffers.Moderation.push({
        timestamp: getTimestamp(), user_id: newMember.id, action_type: "timeout"
      });
    }
  });

  client.on("guildBanAdd", ban => {
    if (ban.guild.id !== SERVER_ID) return;
    sheetBuffers.Moderation.push({
      timestamp: getTimestamp(), user_id: ban.user.id, action_type: "ban", reason: ban.reason || "null"
    });
  });

  // ==========================================
  // 4️⃣ جدول القمار / الألعاب (Gambling) 
  // ==========================================
  const economyCache = new Map();
  usersCollection.find({}).toArray().then(users => {
    users.forEach(u => { if (u.userId && u.wallet !== undefined) economyCache.set(u.userId, u.wallet); });
  });

  const changeStream = usersCollection.watch([{ $match: { operationType: 'update' } }], { fullDocument: 'updateLookup' });
  changeStream.on('change', async (change) => {
    try {
      const doc = change.fullDocument;
      if (!doc || !doc.userId || doc.wallet === undefined) return;
      
      const userId = doc.userId;
      const newBalance = doc.wallet;
      const oldBalance = economyCache.get(userId) || newBalance;
      
      if (oldBalance === newBalance) return;
      const diff = newBalance - oldBalance;
      
      await new Promise(r => setTimeout(r, 1200)); // انتظار الفاتورة
      let gameName = "غير معروف";
      try {
        const matchTx = await transactionsCollection.find({ userId, amount: diff, timestamp: { $gt: new Date(Date.now() - 5000) } }).sort({ timestamp: -1 }).limit(1).toArray();
        if (matchTx.length > 0) gameName = matchTx[0].reason;
      } catch (e) {}

      sheetBuffers.Gambling.push({
        timestamp: getTimestamp(),
        user_id: userId,
        game_name: gameName,
        result: diff > 0 ? "win" : "loss",
        payout: diff,
        balance_before: oldBalance,
        balance_after: newBalance
      });

      economyCache.set(userId, newBalance);
    } catch (err) {}
  });

  console.log("🔥 نظام تتبع البيانات العملاق (Big Data Tracker) يعمل بنجاح!");
};

// ==========================================
// 8️⃣ طريقة دمج جدول الذكاء الاصطناعي (AI)
// ==========================================
// استدعِ هذه الدالة في ملف جيميناي حقك (gemini.js) بعد ما يخلص الرد
module.exports.logAiUsage = function(userId, promptTokens, responseTokens, responseTimeMs, messageType) {
  sheetBuffers.AI_Logs.push({
    timestamp: getTimestamp(),
    user_id: userId,
    prompt_tokens: promptTokens,
    response_tokens: responseTokens,
    response_time_ms: responseTimeMs,
    message_type: messageType
  });
};