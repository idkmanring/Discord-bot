const cron = require('node-cron');

// إعدادات السيرفر والرتب
const GUILD_ID = '1182849389799149688';

// ضع آيديات الرتب هنا بناءً على اللفل
const LEVEL_ROLES = {
    5: '1355327467446866060',
    10: '1497232346372378725',
    15: '1355034326651109537',
    20: '1353548527413760021',
    25: '1381407700642041957'
};

// فصلنا منطق الفحص في دالة مستقلة عشان نقدر نشغلها في أي وقت
async function checkAndAssignRoles(client, db) {
    try {
        const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
        if (!guild) return console.log('[خطأ] لم يتم العثور على السيرفر.');

        // جلب بيانات كل الأعضاء من قاعدة البيانات
        const activities = await db.collection("user_activity").find({}).toArray();

        for (const activity of activities) {
            const userId = activity.userId;
            const msgsCount = activity.textStats?.validMessages || 0;
            const voiceSeconds = activity.voiceStats?.totalSeconds || 0;

            // نفس معادلة اللفل بالضبط
            const voiceMinutes = Math.floor(voiceSeconds / 60);
            const totalXP = Math.floor((msgsCount * 5) + (voiceMinutes * 2));
            const currentLevel = Math.floor(Math.pow(totalXP / 100, 0.5)) + 1;

            // نظام تراكم الرتب: جمع كل الرتب اللي وصل لها العضو أو تجاوزها
            const rolesToAdd = [];
            for (const [levelThreshold, roleId] of Object.entries(LEVEL_ROLES)) {
                if (currentLevel >= parseInt(levelThreshold)) {
                    rolesToAdd.push(roleId);
                }
            }

            // إذا اللفل أقل من 5، ما عنده أي رتبة يستحقها، نتخطاه
            if (rolesToAdd.length === 0) continue;

            try {
                // جلب العضو من السيرفر
                const member = await guild.members.fetch(userId).catch(() => null);
                if (!member) continue; // العضو غادر السيرفر

                // الفحص الصامت: تصفية الرتب اللي العضو يمتلكها مسبقاً
                const missingRoles = rolesToAdd.filter(roleId => !member.roles.cache.has(roleId));

                // إذا كان فيه رتب ناقصة (يعني توه وصل للفل المطلوب أو البوت توه يشتغل)
                if (missingRoles.length > 0) {
                    await member.roles.add(missingRoles);
                    console.log(`[ترقية] تم إعطاء الرتبة بنجاح للعضو ${member.user.tag} (لفل ${currentLevel})`);
                    
                    // حماية البوت: تأخير 1.5 ثانية بين كل عضو وعضو عشان ديسكورد ما يعطي البوت باند
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (err) {
                console.error(`[خطأ] تعذر إعطاء الرتب للعضو ${userId}:`, err.message);
            }
        }
        console.log('[نظام الرتب] تم الانتهاء من فحص وتوزيع الرتب بنجاح!');
        
    } catch (error) {
        console.error('[خطأ عام] في نظام فحص الرتب:', error);
    }
}

module.exports = function startLevelRolesCron(client, db) {
    // 1. الفحص الفوري لمرة واحدة (تأخير 5 ثواني لضمان اتصال ديسكورد)
    setTimeout(() => {
        console.log('[نظام الرتب] بدء الفحص الفوري (عند تشغيل البوت)...');
        checkAndAssignRoles(client, db);
    }, 5000); 

    // 2. الكرون جوب يشتغل كل يوم الساعة 12:00 منتصف الليل بتوقيت الرياض
    cron.schedule('0 0 * * *', () => {
        console.log('[نظام الرتب] بدء الفحص اليومي المجدول...');
        checkAndAssignRoles(client, db);
    }, { timezone: 'Asia/Riyadh' });
};