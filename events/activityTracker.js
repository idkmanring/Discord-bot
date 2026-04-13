// events/activityTracker.js
const { AuditLogEvent } = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SERVER_ID = "1182849389799149688"; 
const AFK_CHANNEL_ID = "1269523453799698453";
const AI_BOT_ID = "1416535705370366063"; // آيدي بوت حمودي الخارجي
const FLUSH_INTERVAL = 60 * 1000; 
const GAMBLING_INTERVAL = 5 * 60 * 1000; 
const BILLING_INTERVAL = 5 * 60 * 1000;  
const SNAPSHOT_INTERVAL = 60 * 60 * 1000; 

// أسعار Gemini Flash التقريبية بالريال السعودي لكل 1 مليون توكن
const INPUT_PRICE_1M_SAR = 0.28; 
const OUTPUT_PRICE_1M_SAR = 1.12; 

let googleDoc = null;

// 📊 ذواكر جوجل شيت
const sheetBuffers = {
  Messages: [],       
  UserActivity: [],   
  Voice: [],          
  Gambling: [],       
  Engagement: [],     
  Moderation: [],     
  Events: [],         
  AI_Logs: []         
};

// 🗄️ ذواكر المونقو وحسابات السيرفر
const messageCache = new Map(); // للمونقو (النشاط)
const voiceCache = new Map();   // للمونقو (النشاط)
const lastMessageTime = new Map();
const activeVoiceSessions = new Map(); 
const userActivityStats = new Map();   
let lastCheckedTxDate = new Date();
const lastCommand = new Map();    

function getTimestamp() { return new Date().toISOString(); }
function cleanText(text) {
  if (!text) return "";
  return text.replace(/[أإآ]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[ى]/g, 'ي').replace(/(.)\1+/g, '$1').replace(/\s+/g, '').trim();
}
const badWordsRegex = /(كلزق|كلخرا|ياكلب|ياحيوان|كليزق|كليخرا|زق|خرا|اهينك|غبي)/i;

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
  const activityCollection = db.collection("user_activity");
  const usersCollection = db.collection("users");
  const transactionsCollection = db.collection("transactions"); 
  const eventsCollection = db.collection("server_events");
  const dramaCollection = db.collection("drama_logs");
  const historyCol = db.collection("smart_chat_history");

  // ==========================================
  // 🔄 1. تفريغ البيانات لجوجل شيت والمونقو (كل دقيقة)
  // ==========================================
  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(SERVER_ID);
      
      // ✨ 1. حساب ثواني الصوت للمونقو وقوقل شيت (لحظياً) ✨
      if (guild) {
        guild.channels.cache.filter(c => c.isVoiceBased()).forEach(channel => {
          if (channel.id === AFK_CHANNEL_ID) return;
          channel.members.forEach(member => {
            if (member.user.bot) return;
            
            // تحديث كاش المونقو
            const currentVoice = voiceCache.get(member.id) || 0;
            voiceCache.set(member.id, currentVoice + 60);

            // تحديث إحصائيات الشيت اللحظية عشان ما يطلع 0
            const stats = userActivityStats.get(member.id) || { username: member.user.username, msgs: 0, chars: 0, voiceSecs: 0, reactions: 0 };
            stats.voiceSecs += 60;
            userActivityStats.set(member.id, stats);
          });
        });
      }

      // ✨ 2. ترحيل الرسايل وثواني الصوت للمونقو (كولكشن user_activity) مع اليوزر نيم ✨
      const operations = [];
      for (const [userId, count] of messageCache.entries()) {
        const username = client.users.cache.get(userId)?.username || "غير معروف";
        operations.push({ updateOne: { filter: { userId }, update: { $inc: { "textStats.validMessages": count }, $set: { username } }, upsert: true } });
      }
      messageCache.clear();

      for (const [userId, seconds] of voiceCache.entries()) {
        const username = client.users.cache.get(userId)?.username || "غير معروف";
        operations.push({ updateOne: { filter: { userId }, update: { $inc: { "voiceStats.totalSeconds": seconds }, $set: { username } }, upsert: true } });
      }
      voiceCache.clear();

      if (operations.length > 0) await activityCollection.bulkWrite(operations);

      // 📊 3. تفريغ بيانات جوجل شيت بحماية إضافية
      if (googleDoc) {
        for (const [sheetName, rows] of Object.entries(sheetBuffers)) {
          if (rows.length > 0) {
            const sheet = googleDoc.sheetsByTitle[sheetName];
            if (sheet) {
              const rowsToSend = [...rows];
              sheetBuffers[sheetName] = []; 
              
              sheet.addRows(rowsToSend).catch(err => {
                console.error(`❌ خطأ في رفع بيانات شيت ${sheetName}:`, err.message);
                sheetBuffers[sheetName].push(...rowsToSend); // نرجع البيانات عشان ما تضيع لو فصل الشيت
              });
            }
          }
        }
      }
    } catch (err) {
        console.error("❌ خطأ في حلقة التفريغ:", err);
    }
  }, FLUSH_INTERVAL);

  // ==========================================
  // 🔄 2. الفاتورة الحية للذكاء الاصطناعي (كل 5 دقايق)
  // ==========================================
  setInterval(async () => {
    if (!googleDoc) return;
    try {
      const billingSheet = googleDoc.sheetsByTitle['AI_Billing'];
      if (!billingSheet) return;

      const usersWithBill = await usersCollection.find({ ai_cost_sar: { $gt: 0 } }).toArray();
      if (usersWithBill.length === 0) return;

      const rowsToUpdate = [];
      for (const u of usersWithBill) {
        let username = "غير معروف";
        try {
          const discordUser = await client.users.fetch(u.userId);
          if (discordUser) username = discordUser.username;
        } catch(e) {}
        
        rowsToUpdate.push({
          user_id: u.userId,
          username: username,
          total_cost_sar: parseFloat(u.ai_cost_sar).toFixed(6) + " ريال",
          last_updated: getTimestamp()
        });
      }

      await billingSheet.clearRows();
      await billingSheet.addRows(rowsToUpdate);
    } catch (err) {}
  }, BILLING_INTERVAL);

  // ==========================================
  // 🔄 3. ملخص نشاط المستخدمين العادي (كل ساعة)
  // ==========================================
  setInterval(() => {
    // تم تصحيح المتغير هنا لـ userActivityStats
    for (const [userId, stats] of userActivityStats.entries()) {
      if (stats.msgs > 0 || stats.voiceSecs > 0 || stats.reactions > 0) {
        sheetBuffers.UserActivity.push({
          timestamp: getTimestamp(), user_id: userId, username: stats.username,
          messages_sent: stats.msgs, total_chars: stats.chars, voice_minutes: Math.floor(stats.voiceSecs / 60), reactions_given: stats.reactions
        });
      }
    }
    userActivityStats.clear();
  }, SNAPSHOT_INTERVAL);

  // ==========================================
  // 🧠 4. الرسائل (دراما + تتبع حمودي + نشاط مونقو)
  // ==========================================
  client.on("messageCreate", async (msg) => {
    if (!msg.guild || msg.guild.id !== SERVER_ID) return;

    // 🤖 تتبع حمودي 
    if ((msg.author.id === AI_BOT_ID || msg.author.id === client.user.id) && msg.reference) {
      try {
        const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId);
        if (repliedTo && !repliedTo.author.bot) {
          const userId = repliedTo.author.id;
          
          const userHistory = await historyCol.find({ userId }).toArray();
          let totalHistoryChars = 0;
          userHistory.forEach(h => { totalHistoryChars += (h.content || "").length; });

          if (totalHistoryChars === 0) totalHistoryChars = repliedTo.content.length;

          const promptTokens = Math.ceil(totalHistoryChars / 4);
          const responseTokens = Math.ceil(msg.content.length / 4);

          const inputCost = (promptTokens / 1000000) * INPUT_PRICE_1M_SAR;
          const outputCost = (responseTokens / 1000000) * OUTPUT_PRICE_1M_SAR;
          const totalCostSAR = inputCost + outputCost;

          sheetBuffers.AI_Logs.push({
            timestamp: getTimestamp(), user_id: userId, prompt_tokens: promptTokens,
            response_tokens: responseTokens, response_time_ms: 0, message_type: "chat", cost_sar: totalCostSAR.toFixed(8) 
          });

          await usersCollection.updateOne({ userId: userId }, { $inc: { ai_cost_sar: totalCostSAR } }, { upsert: true });
        }
      } catch(e) {}
      return; 
    }

    if (msg.author.bot) return;

    lastCommand.set(msg.author.id, msg.content.substring(0, 50));

    // ✨ تحديث نشاط المونقو للرسائل
    const now = Date.now();
    const lastTime = lastMessageTime.get(msg.author.id) || 0;
    if (now - lastTime >= 5000) {
      lastMessageTime.set(msg.author.id, now);
      messageCache.set(msg.author.id, (messageCache.get(msg.author.id) || 0) + 1);
    }

    const hasLink = /https?:\/\/[^\s]+/.test(msg.content);
    const hasEmoji = /<a?:.+?:\d+>|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/.test(msg.content);
    
    sheetBuffers.Messages.push({
      timestamp: getTimestamp(), channel_id: msg.channel.id, channel_name: msg.channel.name,
      user_id: msg.author.id, username: msg.author.username, message_id: msg.id,
      content_length: msg.content.length, word_count: msg.content.split(/\s+/).filter(w => w.length > 0).length,
      has_attachment: msg.attachments.size > 0, has_link: hasLink, has_emoji: hasEmoji,
      reply_to: msg.reference ? msg.reference.messageId : "null", is_thread: msg.channel.isThread(), action: "created",
      content: msg.content 
    });

    const stats = userActivityStats.get(msg.author.id) || { username: msg.author.username, msgs: 0, chars: 0, voiceSecs: 0, reactions: 0 };
    stats.msgs += 1;
    stats.chars += msg.content.length;
    userActivityStats.set(msg.author.id, stats);

    // ✨ صيد الدراما والهوشات للمونقو (للجريدة) ✨
    if (msg.reference && badWordsRegex.test(cleanText(msg.content))) {
       try {
         const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId);
         if (repliedTo && !repliedTo.author.bot) {
           dramaCollection.insertOne({
             aggressorId: msg.author.id, aggressorName: msg.author.username, aggressorMsg: msg.content,
             victimId: repliedTo.author.id, victimName: repliedTo.author.username, victimMsg: repliedTo.content,
             timestamp: new Date()
           });
         }
       } catch (err) {}
    }
  });

  client.on("messageUpdate", (oldMsg, newMsg) => {
    if (newMsg.author?.bot || newMsg.guild?.id !== SERVER_ID) return;
    if (oldMsg.content === newMsg.content) return;
    sheetBuffers.Messages.push({ timestamp: getTimestamp(), channel_id: newMsg.channel.id, user_id: newMsg.author.id, message_id: newMsg.id, action: "edited" });
  });

  client.on("messageDelete", async (msg) => {
    if (msg.author?.bot || msg.guild?.id !== SERVER_ID) return;
    sheetBuffers.Messages.push({ timestamp: getTimestamp(), channel_id: msg.channel.id, user_id: msg.author.id, message_id: msg.id, action: "deleted" });
    
    // ✨ تسجيل الحذف في المونقو مع إضافة اليوزر نيم ✨
    await activityCollection.updateOne({ userId: msg.author.id }, { $inc: { "textStats.deletedMessages": 1 }, $set: { username: msg.author.username } }, { upsert: true });
  });

  // ==========================================
  // 🎙️ 5. الصوت (شيت + مونقو)
  // ==========================================
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.guild.id !== SERVER_ID || newState.member?.user.bot) return;
    const userId = newState.member.id;
    const username = newState.member.user.username; // جبنا الاسم هنا

    // ✨ الميوت والديفن للمونقو ✨
    let incData = {};
    if (!oldState.mute && newState.mute) incData["voiceStats.mutes"] = 1;
    if (!oldState.deaf && newState.deaf) incData["voiceStats.deafens"] = 1;
    if (Object.keys(incData).length > 0) {
      await activityCollection.updateOne({ userId }, { $inc: incData, $set: { username } }, { upsert: true });
    }

    if (!oldState.mute && newState.mute) sheetBuffers.Voice.push({ timestamp: getTimestamp(), user_id: userId, action: "muted" });
    if (!oldState.deaf && newState.deaf) sheetBuffers.Voice.push({ timestamp: getTimestamp(), user_id: userId, action: "deafened" });

    if (!oldState.channelId && newState.channelId) {
      activeVoiceSessions.set(userId, { joinTime: Date.now(), channelId: newState.channelId });
      sheetBuffers.Events.push({ timestamp: getTimestamp(), event_type: "voice_join", user_id: userId, channel_id: newState.channelId });
    } 
    else if (oldState.channelId && !newState.channelId) {
      const session = activeVoiceSessions.get(userId);
      let duration = 0;
      if (session) {
        duration = Math.floor((Date.now() - session.joinTime) / 1000); 
        activeVoiceSessions.delete(userId);
      }
      
      sheetBuffers.Voice.push({ timestamp: getTimestamp(), user_id: userId, channel_id: oldState.channel.id, duration_seconds: duration, action: "leave" });

      try {
        await new Promise(r => setTimeout(r, 4000));
        const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberDisconnect });
        const disconnectLog = fetchedLogs.entries.find(e => e.target.id === userId && (Date.now() - e.createdTimestamp) < 20000);
        if (disconnectLog) {
          sheetBuffers.Moderation.push({ timestamp: getTimestamp(), user_id: userId, action_type: "voice_disconnect", moderator_id: disconnectLog.executor.id });
          // ✨ ديسكونكت للمونقو ✨
          await eventsCollection.insertOne({ type: "voice_disconnect", userId, adminId: disconnectLog.executor.id, timestamp: new Date() });
        } else {
          // ✨ خروج عادي للمونقو ✨
          await eventsCollection.insertOne({ type: "voice_leave", userId, timestamp: new Date() });
        }
      } catch (e) {
        await eventsCollection.insertOne({ type: "voice_leave", userId, timestamp: new Date() });
      }
    }
  });

  // ==========================================
  // 👍 6. التفاعل 
  // ==========================================
  client.on("messageReactionAdd", (reaction, user) => {
    if (user.bot || reaction.message.guild?.id !== SERVER_ID) return;
    
    // تحديث التفاعلات في الـ Activity Stats للشيت
    const stats = userActivityStats.get(user.id) || { username: user.username, msgs: 0, chars: 0, voiceSecs: 0, reactions: 0 };
    stats.reactions += 1;
    userActivityStats.set(user.id, stats);

    sheetBuffers.Engagement.push({ timestamp: getTimestamp(), message_id: reaction.message.id, user_id: user.id, reaction_type: reaction.emoji.name, action: "add" });
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (user.bot || reaction.message.guild?.id !== SERVER_ID) return;
    sheetBuffers.Engagement.push({ timestamp: getTimestamp(), message_id: reaction.message.id, user_id: user.id, reaction_type: reaction.emoji.name, action: "remove" });
  });

  // ==========================================
  // 🛡️ 7. الإدارة والأحداث (شيت + مونقو)
  // ==========================================
  
  // ✨ تغيير الصورة للمونقو ✨
  client.on("userUpdate", async (oldUser, newUser) => {
    if (oldUser.avatar !== newUser.avatar) {
      const guild = client.guilds.cache.get(SERVER_ID);
      if (guild && guild.members.cache.has(newUser.id)) {
        await eventsCollection.insertOne({ type: "avatar_change", userId: newUser.id, timestamp: new Date() });
      }
    }
  });

  client.on("guildMemberAdd", async member => {
    if (member.guild.id !== SERVER_ID) return;
    sheetBuffers.Events.push({ timestamp: getTimestamp(), event_type: "server_join", user_id: member.id });
    // ✨ دخول السيرفر للمونقو مع إضافة اليوزر نيم ✨
    await activityCollection.updateOne({ userId: member.id }, { $push: { "history.joins": new Date() }, $set: { username: member.user.username } }, { upsert: true });
  });

  client.on("guildMemberRemove", async member => {
    if (member.guild.id !== SERVER_ID) return;
    sheetBuffers.Events.push({ timestamp: getTimestamp(), event_type: "server_leave", user_id: member.id });
    // ✨ خروج السيرفر للمونقو مع إضافة اليوزر نيم ✨
    await activityCollection.updateOne({ userId: member.id }, { $push: { "history.leaves": new Date() }, $set: { username: member.user.username } }, { upsert: true });

    try {
      await new Promise(r => setTimeout(r, 4000));
      const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
      const kickLog = fetchedLogs.entries.find(e => e.target.id === member.id && (Date.now() - e.createdTimestamp) < 20000);
      if (kickLog) {
        sheetBuffers.Moderation.push({ timestamp: getTimestamp(), user_id: member.id, action_type: "kick", moderator_id: kickLog.executor.id });
        // ✨ تسجيل الكيك للمونقو ✨
        await eventsCollection.insertOne({ type: "kick", userId: member.id, adminId: kickLog.executor.id, timestamp: new Date() });
      } else {
        await eventsCollection.insertOne({ type: "server_leave", userId: member.id, timestamp: new Date() });
      }
    } catch (err) {
      await eventsCollection.insertOne({ type: "server_leave", userId: member.id, timestamp: new Date() });
    }
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.guild.id !== SERVER_ID) return;
    const userId = newMember.id;
    const username = newMember.user.username;

    // ✨ التايم آوت ✨
    if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
      sheetBuffers.Moderation.push({ timestamp: getTimestamp(), user_id: userId, action_type: "timeout" });
      await activityCollection.updateOne({ userId }, { $inc: { "punishments.timeouts": 1 }, $set: { username } }, { upsert: true });
      await eventsCollection.insertOne({ type: "timeout", userId, timestamp: new Date() });
    }

    // ✨ الرتب ✨
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    if (oldRoles.size < newRoles.size) {
      await activityCollection.updateOne({ userId }, { $inc: { "history.rolesAdded": 1 }, $set: { username } }, { upsert: true });
    } else if (oldRoles.size > newRoles.size) {
      await activityCollection.updateOne({ userId }, { $inc: { "history.rolesRemoved": 1 }, $set: { username } }, { upsert: true });
    }

    // ✨ تغيير الاسم ✨
    if (oldMember.nickname !== newMember.nickname) {
      await eventsCollection.insertOne({ 
        type: "nickname_change", userId, 
        oldName: oldMember.nickname || oldMember.user.username, 
        newName: newMember.nickname || newMember.user.username, 
        timestamp: new Date() 
      });
    }
  });

  client.on("guildBanAdd", async ban => {
    if (ban.guild.id !== SERVER_ID) return;
    sheetBuffers.Moderation.push({ timestamp: getTimestamp(), user_id: ban.user.id, action_type: "ban", reason: ban.reason || "null" });
    // ✨ البان للمونقو ✨
    await eventsCollection.insertOne({ type: "ban", userId: ban.user.id, reason: ban.reason, timestamp: new Date() });
  });

  // ==========================================
  // 🎰 8. نظام القمار العميق (كل 5 دقائق)
  // ==========================================
  setInterval(async () => {
    try {
      const newTxs = await transactionsCollection.find({
        timestamp: { $gt: lastCheckedTxDate }
      }).sort({ timestamp: 1 }).toArray();

      if (newTxs.length === 0) return;
      lastCheckedTxDate = new Date(); 

      const userSessions = new Map();

      newTxs.forEach(tx => {
        if (!tx.userId || !tx.amount || !tx.reason) return;
        
        if (!userSessions.has(tx.userId)) userSessions.set(tx.userId, []);
        const userTxList = userSessions.get(tx.userId);
        
        const txTime = new Date(tx.timestamp).getTime();
        const lastCluster = userTxList[userTxList.length - 1];

        if (lastCluster && (txTime - lastCluster.lastTxTime <= 30000)) {
          lastCluster.netAmount += tx.amount;
          lastCluster.lastTxTime = txTime;
          if (tx.reason && tx.reason !== "غير معروف") {
            lastCluster.gameName = tx.reason; 
          }
        } else {
          userTxList.push({
            netAmount: tx.amount,
            lastTxTime: txTime,
            gameName: tx.reason || "غير معروف"
          });
        }
      });

      for (const [userId, clusters] of userSessions.entries()) {
        let currentBalance = 0;
        try {
          const u = await usersCollection.findOne({ userId });
          if (u && u.wallet !== undefined) currentBalance = u.wallet;
        } catch(e) {}

        for (let i = clusters.length - 1; i >= 0; i--) {
          const cluster = clusters[i];
          if (cluster.netAmount === 0) continue; 

          const balanceAfter = currentBalance;
          const balanceBefore = currentBalance - cluster.netAmount;
          
          sheetBuffers.Gambling.push({
            timestamp: new Date(cluster.lastTxTime).toISOString(),
            user_id: userId,
            game_name: cluster.gameName,
            result: cluster.netAmount > 0 ? "win" : "loss",
            payout: cluster.netAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter
          });

          // ✨ أحداث القمار القوية للمونقو (الجريدة) ✨
          if (balanceBefore > 0) {
            if (balanceAfter <= 0) {
              eventsCollection.insertOne({ type: "bankrupt", userId, oldBalance: balanceBefore, newBalance: balanceAfter, reason: cluster.gameName, timestamp: new Date(cluster.lastTxTime) });
            } else if (cluster.netAmount < 0 && Math.abs(cluster.netAmount) >= (balanceBefore / 2)) {
              eventsCollection.insertOne({ type: "half_loss", userId, oldBalance: balanceBefore, newBalance: balanceAfter, lostAmount: Math.abs(cluster.netAmount), reason: cluster.gameName, timestamp: new Date(cluster.lastTxTime) });
            } else if (cluster.netAmount > 0 && balanceAfter >= (balanceBefore * 2)) {
              eventsCollection.insertOne({ type: "double_balance", userId, oldBalance: balanceBefore, newBalance: balanceAfter, wonAmount: cluster.netAmount, reason: cluster.gameName, timestamp: new Date(cluster.lastTxTime) });
            }
          }

          currentBalance = balanceBefore; 
        }
      }
    } catch (err) {}
  }, GAMBLING_INTERVAL);

  console.log("🔥 نظام تتبع البيانات المزدوج (شيت + مونقو) يعمل بنجاح!");
};
