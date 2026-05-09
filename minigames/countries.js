const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fetch = require("node-fetch");
const { addGameReward } = require("../utils/economyEffects");
const updateMinigameStats = require("../utils/updateMinigameStats");

const flags = require("../data/flags.json").filter((item) => {
  const country = String(item.country || "").replace(/[إأآ]/g, "ا");
  return !country.includes("اسرائيل");
});

const imageCache = new Map();
const countryMetaCache = new Map();
const activeGames = new Map();

const COMMONS_TITLE_BLACKLIST = [
  "flag",
  "map",
  "locator",
  "coa",
  "coat of arms",
  "seal",
  "emblem",
  "logo",
  "svg",
  "blank",
  "political",
  "administrative",
  "relief map",
  "location map"
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function getCommonsImage(country, db) {
  const cached = imageCache.get(country);
  if (cached) return cached;

  const stored = await db.collection("country_commons_images").findOne({ country }).catch(() => null);
  if (stored?.url) {
    imageCache.set(country, stored.url);
    return stored.url;
  }

  const query = encodeURIComponent(`${country} location map`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrsearch=${query}&gsrlimit=10&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`;
  const res = await fetch(url, { headers: { "User-Agent": "Discord-bot2 country minigame" } });
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {});
  const found = pages
    .map((page) => page.imageinfo?.[0])
    .find((info) => info?.thumburl || info?.url);

  const imageUrl = found?.thumburl || found?.url;
  if (!imageUrl) throw new Error(`No Wikimedia image for ${country}`);

  imageCache.set(country, imageUrl);
  await db.collection("country_commons_images").updateOne(
    { country },
    { $set: { country, url: imageUrl, updatedAt: new Date() } },
    { upsert: true }
  ).catch(() => {});
  return imageUrl;
}

function extractCountryCode(flagUrl) {
  const match = String(flagUrl || "").match(/\/([a-z]{2})\.png$/i);
  return match?.[1]?.toLowerCase() || null;
}

async function getCountryMetaByCode(code) {
  if (!code) return null;
  const cached = countryMetaCache.get(code);
  if (cached) return cached;

  const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}?fields=name,capital,capitalInfo,latlng,cca2`);
  if (!res.ok) {
    throw new Error(`restcountries lookup failed for ${code}`);
  }

  const data = await res.json();
  const record = Array.isArray(data) ? data[0] : data;
  const meta = {
    code: record?.cca2 || code.toUpperCase(),
    countryEn: record?.name?.common || null,
    capitalEn: Array.isArray(record?.capital) ? record.capital[0] : null,
    capitalLatLng: Array.isArray(record?.capitalInfo?.latlng) ? record.capitalInfo.latlng : null,
    countryLatLng: Array.isArray(record?.latlng) ? record.latlng : null
  };
  countryMetaCache.set(code, meta);
  return meta;
}

function looksLikeStreetPhoto(title = "") {
  const normalized = String(title).toLowerCase();
  return !COMMONS_TITLE_BLACKLIST.some((word) => normalized.includes(word));
}

async function getCommonsGeoImage(item, db) {
  const code = extractCountryCode(item.image);
  const meta = await getCountryMetaByCode(code);
  const cached = imageCache.get(`geo:${item.country}`);
  if (cached) return cached;

  const stored = await db.collection("country_commons_geo_images").findOne({ country: item.country }).catch(() => null);
  if (stored?.url) {
    imageCache.set(`geo:${item.country}`, stored.url);
    return stored.url;
  }

  const coords = meta?.capitalLatLng || meta?.countryLatLng;
  if (!coords || coords.length < 2) {
    throw new Error(`Missing coordinates for ${item.country}`);
  }

  const [lat, lon] = coords;
  const radiusOptions = [3000, 7000, 12000, 25000];
  const candidates = [];

  for (const radius of radiusOptions) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=geosearch&ggsnamespace=6&ggsprimary=all&ggscoord=${lat}|${lon}&ggsradius=${radius}&ggslimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Discord-bot2 countries minigame" }
    });
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl && !info?.url) continue;
      if (info?.mime && !String(info.mime).startsWith("image/")) continue;
      if (!looksLikeStreetPhoto(page.title)) continue;
      candidates.push(info.thumburl || info.url);
    }
    if (candidates.length >= 5) break;
  }

  const imageUrl = candidates[Math.floor(Math.random() * candidates.length)];
  if (!imageUrl) {
    throw new Error(`No Commons geotagged image for ${item.country}`);
  }

  imageCache.set(`geo:${item.country}`, imageUrl);
  await db.collection("country_commons_geo_images").updateOne(
    { country: item.country },
    { $set: { country: item.country, url: imageUrl, updatedAt: new Date() } },
    { upsert: true }
  ).catch(() => {});
  return imageUrl;
}

async function buildStreetPhotoImage(item, imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "Discord-bot2 countries minigame" }
  });
  const buffer = Buffer.from(await res.arrayBuffer());
  const img = await loadImage(buffer);

  const width = 920;
  const height = 620;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0e1719");
  bg.addColorStop(1, "#22373a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const box = { x: 46, y: 84, w: 828, h: 460 };
  ctx.fillStyle = "#edf4ef";
  ctx.roundRect(box.x, box.y, box.w, box.h, 18);
  ctx.fill();

  const scale = Math.min(box.w / img.width, box.h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, box.x + (box.w - drawW) / 2, box.y + (box.h - drawH) / 2, drawW, drawH);

  ctx.fillStyle = "#f6fbf8";
  ctx.font = "bold 34px Cairo";
  ctx.textAlign = "center";
  ctx.fillText("اي دولة هذه؟", width / 2, 50);

  ctx.font = "20px Cairo";
  ctx.fillStyle = "#9db7b2";
  ctx.fillText("Wikimedia Commons", width / 2, 585);

  return new AttachmentBuilder(await canvas.encode("png"), { name: `country_street_${extractCountryCode(item.image) || "unknown"}.png` });
}

async function buildCountryImage(country, imageUrl) {
  const res = await fetch(imageUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  const img = await loadImage(buffer);

  const width = 820;
  const height = 560;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#101b1d");
  bg.addColorStop(1, "#23383a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const box = { x: 54, y: 88, w: 712, h: 392 };
  ctx.fillStyle = "#f4f7f2";
  ctx.roundRect(box.x, box.y, box.w, box.h, 18);
  ctx.fill();

  const scale = Math.min(box.w / img.width, box.h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, box.x + (box.w - drawW) / 2, box.y + (box.h - drawH) / 2, drawW, drawH);

  ctx.fillStyle = "#f6fbf8";
  ctx.font = "bold 34px Cairo";
  ctx.textAlign = "center";
  ctx.fillText("ما اسم الدولة؟", width / 2, 54);

  ctx.font = "20px Cairo";
  ctx.fillStyle = "#9db7b2";
  ctx.fillText("Wikimedia Commons", width / 2, 520);

  return new AttachmentBuilder(await canvas.encode("png"), { name: `country_${country}.png` });
}

module.exports = async function startCountriesGame(interaction, db) {
  const gameId = interaction.id;
  if (activeGames.has(gameId)) {
    return interaction.reply({ content: "<:icons8wrong1001:1415979909825695914> هناك لعبة جارية بالفعل.", ephemeral: true });
  }

  let round = 0;
  const scores = new Map();
  const gameMessage = await interaction.reply({ content: "🕹️ جاري بدء لعبة دول ...", fetchReply: true });
  activeGames.set(gameId, true);
  let lastRoundMessage = gameMessage;

  async function nextRound() {
    if (round >= 5) return endGame();
    round++;

    const choices = shuffle([...flags]).slice(0, 4);
    const correctIndex = Math.floor(Math.random() * choices.length);
    const correct = choices[correctIndex];

    let attachment;
    try {
      const imageUrl = await getCommonsGeoImage(correct, db);
      attachment = await buildStreetPhotoImage(correct, imageUrl);
    } catch (err) {
      console.error("Countries street photo error:", err.message);
      try {
        const imageUrl = await getCommonsImage(correct.country, db);
        attachment = await buildCountryImage(correct.country, imageUrl);
      } catch (fallbackErr) {
        console.error("Countries Wikimedia error:", fallbackErr.message);
        attachment = correct.image;
      }
    }

    const buttons = new ActionRowBuilder().addComponents(
      choices.map((country, idx) =>
        new ButtonBuilder()
          .setCustomId(`country_${round}_${idx}`)
          .setLabel(String(country.country).slice(0, 80))
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const roundMsg = await interaction.followUp({
      content: `🌍 (${round}/5)\nاختر اسم الدولة:`,
      files: [attachment],
      components: [buttons],
      embeds: []
    });

    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => toDelete.delete().catch(() => {}), 10_000);
    }
    lastRoundMessage = roundMsg;

    const collector = roundMsg.createMessageComponentCollector({ time: 30_000 });
    let answered = false;

    collector.on("collect", async (btn) => {
      await btn.deferUpdate().catch(() => {});
      if (answered) return;

      const pickedIndex = Number(btn.customId.split("_")[2]);
      if (pickedIndex === correctIndex) {
        answered = true;
        const userId = btn.user.id;
        const prev = scores.get(userId) || { points: 0, username: btn.user.username };
        prev.points += 1;
        scores.set(userId, prev);

        const reward = await addGameReward(userId, 1000, db);
        await db.collection("transactions").insertOne({
          userId,
          amount: reward.finalAmount,
          reason: "ربح من لعبة دول",
          timestamp: new Date()
        });
        await updateMinigameStats(db, userId, "countries", true);

        const winMsg = await interaction.followUp({ content: `${btn.user.username} جاوب صح! وكسب 1000 ريال + نقطة` });
        setTimeout(() => winMsg.delete().catch(() => {}), 10_000);
        collector.stop();
        nextRound();
      }
    });

    collector.on("end", () => {
      if (!answered) nextRound();
    });
  }

  async function endGame() {
    activeGames.delete(gameId);
    const ranking = [...scores.entries()]
      .sort((a, b) => b[1].points - a[1].points)
      .map(([id, data], idx) => `**${idx + 1}. ${data.username}** - ${data.points} نقطة (💰 ${data.points * 1000})`)
      .join("\n");

    const endMsg = await interaction.followUp({
      content: `🏁 انتهت لعبة دول!\n\n${ranking || "<:icons8wrong1001:1415979909825695914> لم يجب أحد"}\n\n🥇 الفائز: ${ranking ? ranking.split("\n")[0] : "لا يوجد"}`,
      components: [],
      embeds: [],
      files: []
    });

    if (lastRoundMessage) {
      const toDelete = lastRoundMessage;
      setTimeout(() => toDelete.delete().catch(() => {}), 10_000);
    }
    setTimeout(() => endMsg.delete().catch(() => {}), 25_000);
    return endMsg;
  }

  return nextRound();
};
