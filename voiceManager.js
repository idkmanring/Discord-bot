const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const moment = require('moment-timezone');

// إعدادات البوتات الـ 7 مع إضافة اسم المجلد الخاص بكل كوكب
const botsConfig = [
    { 
        token: process.env.MERCURY_TOKEN, 
        guildId: '1182849389799149688', 
        channelId: '1354263696364273838', 
        folderName: 'mercury', // مجلد عطارد (الإلكتروني السريع)
        statusText: 'Fast Synthwave', 
        statusType: ActivityType.Listening 
    },
    { 
        token: process.env.VENUS_TOKEN, 
        guildId: '1182849389799149688', 
        channelId: '1354263314913300612', 
        folderName: 'venus', // مجلد الزهرة (المصري)
        statusText: 'Egyptian Classics',
        statusType: ActivityType.Listening
    },
    { 
        token: process.env.EARTH_TOKEN,
        guildId: '1182849389799149688', 
        channelId: '1182849390600273925', 
        folderName: 'earth', // مجلد الأرض (الخليجي)
        statusText: 'Khaleeji Vibes', 
        statusType: ActivityType.Listening 
    },
    { 
        token: process.env.JUPITER_TOKEN,
        guildId: '1182849389799149688', 
        channelId: '1354263354298077255', 
        folderName: 'jupiter', // مجلد المشتري (الملحمي)
        statusText: 'Epic Orchestral', 
        statusType: ActivityType.Listening 
    },
    { 
        token: process.env.MARS_TOKEN,
        guildId: '1182849389799149688', 
        channelId: '1182849390600273924', 
        folderName: 'mars', // مجلد المريخ (العراقي)
        statusText: 'Iraqi Soul',
        statusType: ActivityType.Listening
    },
    { 
        token: process.env.SATURN_TOKEN,
        guildId: '1182849389799149688', 
        channelId: '1354263815793021019', 
        folderName: 'saturn', // مجلد زحل (اللو-فاي)
        statusText: 'Lo-Fi Hip Hop',
        statusType: ActivityType.Listening
    },
    { 
        token: process.env.NEPTUNE_TOKEN,
        guildId: '1182849389799149688', 
        channelId: '1354263853298487499', 
        folderName: 'neptune', // مجلد نبتون (الفضاء والأعماق)
        statusText: 'Deep Space Ambient', 
        statusType: ActivityType.Listening 
    }
];

function startVoiceBots() {
    let allPlayers = []; 
    let isGloballyPaused = false;

    const checkInitialState = () => {
        const now = moment().tz('Asia/Riyadh');
        if (now.day() === 5 && now.hour() >= 8 && now.hour() < 20) {
            console.log('[الجمعة] البوت اشتغل في وقت توقف الجمعة، سيتم كتم الصوتيات فوراً.');
            isGloballyPaused = true;
        }
    };
    checkInitialState(); 

    const pauseAll = () => {
        console.log('[توقيت] تم إيقاف الصوتيات.');
        isGloballyPaused = true;
        allPlayers.forEach(p => p.pause());
    };
    
    const resumeAll = () => {
        console.log('[توقيت] تم استئناف الصوتيات.');
        isGloballyPaused = false;
        allPlayers.forEach(p => p.unpause());
    };

    botsConfig.forEach(config => {
        const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
        allPlayers.push(player);

        const playAudio = () => {
            const folderPath = path.join(__dirname, 'audio', config.folderName);
            
            // التأكد من وجود المجلد
            if (!fs.existsSync(folderPath)) {
                console.log(`[خطأ مسار] المجلد ${config.folderName} غير موجود داخل مجلد audio!`);
                return;
            }

            // قراءة كل الملفات بصيغة mp3 من المجلد
            const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.mp3'));

            if (files.length === 0) {
                console.log(`[مجلد فارغ] لا توجد ملفات mp3 في مجلد ${config.folderName}`);
                return;
            }

            // اختيار ملف عشوائي من القائمة
            const randomFile = files[Math.floor(Math.random() * files.length)];
            const audioPath = path.join(folderPath, randomFile);

            try {
                // التحكم بالصوت (0.25 تعني 25%)
                const resource = createAudioResource(audioPath, { inlineVolume: true });
                resource.volume.setVolume(0.025); 
                player.play(resource);
                console.log(`[${config.statusText}] يتم الآن تشغيل: ${randomFile}`);
            } catch (err) {
                console.error(`[خطأ تشغيل في ${config.folderName}]:`, err.message);
            }
        };

        player.on(AudioPlayerStatus.Idle, () => {
            // بمجرد انتهاء المقطع، الدالة راح تشتغل وتختار ملف عشوائي جديد
            setTimeout(playAudio, 1000); 
        });

        player.on('error', error => {
            console.error(`[خطأ صوتي]: ${error.message}`);
            setTimeout(playAudio, 2000);
        });

        const connectAndPlay = () => {
            const guild = client.guilds.cache.get(config.guildId);
            if (!guild) return;

            const connection = joinVoiceChannel({
                channelId: config.channelId,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
                group: client.user.id 
            });

            connection.subscribe(player);
            
            if (player.state.status === AudioPlayerStatus.Idle) {
                playAudio();
            }

            if (isGloballyPaused) {
                player.pause();
            }
        };

        client.once('ready', () => {
            console.log(`[صوت] البوت ${client.user.tag} جاهز!`);
            
            // تعيين الحالة
            client.user.setActivity(config.statusText, { type: config.statusType });
            client.user.setStatus('online');

            connectAndPlay();
        });

        client.on('voiceStateUpdate', (oldState, newState) => {
            if (oldState.member.user.id === client.user.id && !newState.channelId) {
                console.log(`[طرد] البوت ${client.user.tag} طلع من الروم، جاري إعادته...`);
                setTimeout(connectAndPlay, 5000);
            }
        });

        client.login(config.token).catch(err => console.log(`[خطأ توكن]:`, err.message));
    });

    // ==========================================
    // نظام التوقيت (الجمعة والصلوات الذكي)
    // ==========================================
    cron.schedule('0 8 * * 5', () => {
        console.log('[الجمعة] إيقاف الصوتيات...');
        pauseAll();
    }, { timezone: 'Asia/Riyadh' });

    cron.schedule('0 20 * * 5', () => {
        console.log('[الجمعة] استئناف الصوتيات...');
        resumeAll();
    }, { timezone: 'Asia/Riyadh' });

    const schedulePrayers = async () => {
        try {
            const date = moment().tz('Asia/Riyadh').format('DD-MM-YYYY');
            const [resEast, resWest] = await Promise.all([
                axios.get(`http://api.aladhan.com/v1/timingsByCity?city=Dammam&country=SA&method=4&date=${date}`),
                axios.get(`http://api.aladhan.com/v1/timingsByCity?city=Jeddah&country=SA&method=4&date=${date}`)
            ]);

            const timingsEast = resEast.data.data.timings;
            const timingsWest = resWest.data.data.timings;
            const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
            
            prayers.forEach(prayer => {
                const pauseTime = moment.tz(`${date} ${timingsEast[prayer]}`, 'DD-MM-YYYY HH:mm', 'Asia/Riyadh').subtract(10, 'minutes');
                const resumeTime = moment.tz(`${date} ${timingsWest[prayer]}`, 'DD-MM-YYYY HH:mm', 'Asia/Riyadh').add(30, 'minutes');
                const now = moment().tz('Asia/Riyadh');

                if (now.isAfter(pauseTime) && now.isBefore(resumeTime)) {
                    isGloballyPaused = true;
                    pauseAll();
                }

                if (pauseTime.isAfter(now)) {
                    setTimeout(() => pauseAll(), pauseTime.diff(now));
                }

                if (resumeTime.isAfter(now)) {
                    setTimeout(() => {
                        const currentHour = moment().tz('Asia/Riyadh').hour();
                        const isFriday = moment().tz('Asia/Riyadh').day() === 5;
                        if (isFriday && currentHour >= 8 && currentHour < 20) return;
                        resumeAll();
                    }, resumeTime.diff(now));
                }
            });
        } catch (error) {
            console.error('[خطأ] فشل في سحب أوقات الصلاة:', error.message);
        }
    };

    cron.schedule('1 0 * * *', schedulePrayers, { timezone: 'Asia/Riyadh' });
    schedulePrayers();
}

// هذا السطر يسمح بتشغيل الملف كعملية منفصلة تماماً
if (require.main === module) {
    startVoiceBots();
} else {
    module.exports = startVoiceBots;
}
