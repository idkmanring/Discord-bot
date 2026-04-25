// events/activityTracker.js
const { AuditLogEvent } = require('discord.js');

const SERVER_ID = "1182849389799149688"; 
const AFK_CHANNEL_ID = "1269523453799698453";
const AI_BOT_ID = "1416535705370366063"; // آيدي بوت حمودي الخارجي
const FLUSH_INTERVAL = 60 * 1000; 
const GAMBLING_INTERVAL = 5 * 60 * 1000; 

// أسعار Gemini Flash التقريبية بالريال السعودي لكل 1 مليون توكن
const INPUT_PRICE_1M_SAR = 0.28; 
const OUTPUT_PRICE_1M_SAR = 1.12; 

// 🗄️ ذواكر المونقو وحسابات السيرفر
const messageCache = new Map(); 
const channelCache = new Map(); // لتتبع أكثر روم نشاطاً
const voiceCache = new Map();  
const lastMessageTime = new Map();
const activeVoiceSessions = new Map(); 
let lastCheckedTxDate = new Date();

function cleanText(text) {
  if (!text) return "";
  return text.replace(/[أإآ]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[ى]/g, 'ي').replace(/(.)\1+/g, '$1').replace(/\s+/g, '').trim();
}
const badWordsRegex = /(كلزق|كلخرا|ياكلب|ياحيوان|كليزق|كليخرا|زق|خرا|اهينك|غبي)/i;

module.exports = function mountTracker(client, db) {
  if (!db) return;
  const activityCollection = db.collection("user_activity");
  const usersCollection = db.collection("users");
  const transactionsCollection = db.collection("transactions"); 
  const eventsCollection = db.collection("server_events");
  const dramaCollection = db.collection("drama_logs");
  const historyCol = db.collection("smart_chat_history");

  // ==========================================
  // 🔄 1. تفريغ البيانات للمونقو (كل دقيقة)
  // ==========================================
  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(SERVER_ID);
      const dayOfWeek = new Date().getDay().toString(); // 0 (الأحد) إلى 6 (السبت)
      
      // ✨ 1. حساب ثواني الصوت (لحظياً) ✨
      if (guild) {
        guild.channels.cache.filter(c => c.isVoiceBased()).forEach(channel => {
          if (channel.id === AFK_CHANNEL_ID) return;
          channel.members.forEach(member => {
            if (member.user.bot) return;
            const currentVoice = voiceCache.get(member.id) || 0;
            voiceCache.set(member.id, currentVoice + 60);
          });
        });
      }

      const operations = [];

      // ✨ 2. ترحيل الرسايل وتتبع الرومات والخبرة (XP) ✨
      for (const [userId, count] of messageCache.entries()) {
        const username = client.users.cache.get(userId)?.username || "غير معروف";
        const incData = { 
            "textStats.validMessages": count,
            "xp": count * 5, // كل رسالة تعطي 5 خبرة
            [`activityByDay.${dayOfWeek}.msgs`]: count // النشاط الأسبوعي
        };

        // تفريغ الرومات اللي شارك فيها للبحث عن "أكثر روم"
        const uChannels = channelCache.get(userId);
        if (uChannels) {
            for (const [cId, cCount] of Object.entries(uChannels)) {
                incData[`channelStats.${cId}`] = cCount;
            }
        }

        operations.push({ updateOne: { filter: { userId }, update: { $inc: incData, $set: { username } }, upsert: true } });
      }
      messageCache.clear();
      channelCache.clear();

      // ✨ 3. ترحيل ثواني الصوت والخبرة (XP) ✨
      for (const [userId, seconds] of voiceCache.entries()) {
        const username = client.users.cache.get(userId)?.username || "غير معروف";
        const incData = { 
            "voiceStats.totalSeconds": seconds,
            "xp": Math.floor(seconds / 60) * 2, // كل دقيقة تعطي 2 خبرة
            [`activityByDay.${dayOfWeek}.voiceSecs`]: seconds // النشاط الأسبوعي
        };
        operations.push({ updateOne: { filter: { userId }, update: { $inc: incData, $set: { username } }, upsert: true } });
      }
      voiceCache.clear();

      if (operations.length > 0) await activityCollection.bulkWrite(operations);

    } catch (err) {
        console.error("❌ خطأ في حلقة التفريغ للمونقو:", err);
    }
  }, FLUSH_INTERVAL);


  // ==========================================
  // 🧠 2. الرسائل (دراما + تتبع حمودي + نشاط)
  // ==========================================
  client.on("messageCreate", async (msg) => {
    if (!msg.guild || msg.guild.id !== SERVER_ID) return;

    // 🤖 تتبع حمودي (الذكاء الاصطناعي) وحساب التكلفة في المونقو مباشرة
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

          await usersCollection.updateOne({ userId: userId }, { $inc: { ai_cost_sar: totalCostSAR } }, { upsert: true });
        }
      } catch(e) {}
      return; 
    }

    if (msg.author.bot) return;

    // ✨ تحديث نشاط المونقو للرسائل (حماية من السبام 5 ثواني)
    const now = Date.now();
    const lastTime = lastMessageTime.get(msg.author.id) || 0;
    if (now - lastTime >= 5000) {
      lastMessageTime.set(msg.author.id, now);
      messageCache.set(msg.author.id, (messageCache.get(msg.author.id) || 0) + 1);

      // تتبع أكثر روم النشاط
      const uChannels = channelCache.get(msg.author.id) || {};
      uChannels[msg.channel.id] = (uChannels[msg.channel.id] || 0) + 1;
      channelCache.set(msg.author.id, uChannels);
    }

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

  client.on("messageDelete", async (msg) => {
    if (msg.author?.bot || msg.guild?.id !== SERVER_ID) return;
    await activityCollection.updateOne({ userId: msg.author.id }, { $inc: { "textStats.deletedMessages": 1 }, $set: { username: msg.author.username } }, { upsert: true });
  });

  // ==========================================
  // 🎙️ 3. الصوت والأحداث 
  // ==========================================
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.guild.id !== SERVER_ID || newState.member?.user.bot) return;
    const userId = newState.member.id;
    const username = newState.member.user.username; 

    // الميوت والديفن للمونقو
    let incData = {};
    if (!oldState.mute && newState.mute) incData["voiceStats.mutes"] = 1;
    if (!oldState.deaf && newState.deaf) incData["voiceStats.deafens"] = 1;
    if (Object.keys(incData).length > 0) {
      await activityCollection.updateOne({ userId }, { $inc: incData, $set: { username } }, { upsert: true });
    }

    if (!oldState.channelId && newState.channelId) {
      activeVoiceSessions.set(userId, { joinTime: Date.now(), channelId: newState.channelId });
    } 
    else if (oldState.channelId && !newState.channelId) {
      activeVoiceSessions.delete(userId);
      try {
        await new Promise(r => setTimeout(r, 4000));
        const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberDisconnect });
        const disconnectLog = fetchedLogs.entries.find(e => e.target.id === userId && (Date.now() - e.createdTimestamp) < 20000);
        if (disconnectLog) {
          await eventsCollection.insertOne({ type: "voice_disconnect", userId, adminId: disconnectLog.executor.id, timestamp: new Date() });
        } else {
          await eventsCollection.insertOne({ type: "voice_leave", userId, timestamp: new Date() });
        }
      } catch (e) {
        await eventsCollection.insertOne({ type: "voice_leave", userId, timestamp: new Date() });
      }
    }
  });

  // ==========================================
  // 🛡️ 4. الإدارة والأحداث 
  // ==========================================
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
    await activityCollection.updateOne({ userId: member.id }, { $push: { "history.joins": new Date() }, $set: { username: member.user.username } }, { upsert: true });
  });

  client.on("guildMemberRemove", async member => {
    if (member.guild.id !== SERVER_ID) return;
    await activityCollection.updateOne({ userId: member.id }, { $push: { "history.leaves": new Date() }, $set: { username: member.user.username } }, { upsert: true });

    try {
      await new Promise(r => setTimeout(r, 4000));
      const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
      const kickLog = fetchedLogs.entries.find(e => e.target.id === member.id && (Date.now() - e.createdTimestamp) < 20000);
      if (kickLog) {
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

    if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
      await activityCollection.updateOne({ userId }, { $inc: { "punishments.timeouts": 1 }, $set: { username } }, { upsert: true });
      await eventsCollection.insertOne({ type: "timeout", userId, timestamp: new Date() });
    }

    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    if (oldRoles.size < newRoles.size) {
      await activityCollection.updateOne({ userId }, { $inc: { "history.rolesAdded": 1 }, $set: { username } }, { upsert: true });
    } else if (oldRoles.size > newRoles.size) {
      await activityCollection.updateOne({ userId }, { $inc: { "history.rolesRemoved": 1 }, $set: { username } }, { upsert: true });
    }

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
    await eventsCollection.insertOne({ type: "ban", userId: ban.user.id, reason: ban.reason, timestamp: new Date() });
  });

  // ==========================================
  // 🎰 5. نظام القمار العميق (للأحداث القوية)
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
          userTxList.push({ netAmount: tx.amount, lastTxTime: txTime, gameName: tx.reason || "غير معروف" });
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

  console.log("🚀 نظام تتبع البيانات (MongoDB Only) يعمل بنجاح!");
};