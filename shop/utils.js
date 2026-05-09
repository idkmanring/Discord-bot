// 📁 /shop/utils.js

const {
  activateEffect,
  addGameReward,
  getAdjustedReward,
  getProtectedDebit,
  hasActiveEffect,
  refundLossProtection,
  subtractGameLoss,
} = require("../utils/economyEffects");

const SHOP_CUSTOM_ID_PREFIXES = [
  "shop_nickname_modal_target",
  "shop_nickname_modal_self",
  "confirm_privileges_purchase",
  "confirm_roles_purchase",
  "confirm_mention_jail",
  "confirm_mention_bail",
  "confirm_rename_member",
  "confirm_timeout",
  "confirm_visit",
  "confirm_mute",
  "confirm_steal",
  "shop_section_select",
  "shop_target_select",
  "shop_target_prev",
  "shop_target_next",
  "privileges_menu",
  "punishments_menu",
  "roles_menu",
  "jail_menu",
  "gambling_menu",
  "shop_back",
].sort((a, b) => b.length - a.length);

function makeShopCustomId(baseId, ownerId, ...extraParts) {
  return [baseId, ownerId, ...extraParts].filter(Boolean).join("_");
}

function parseShopCustomId(customId = "") {
  const id = String(customId || "");
  for (const baseId of SHOP_CUSTOM_ID_PREFIXES) {
    if (id === baseId) return { baseId, ownerId: null, extra: [] };
    const prefix = `${baseId}_`;
    if (id.startsWith(prefix)) {
      const parts = id.slice(prefix.length).split("_").filter(Boolean);
      return { baseId, ownerId: parts[0] || null, extra: parts.slice(1) };
    }
  }
  return { baseId: id, ownerId: null, extra: [] };
}

async function assertShopOwner(interaction) {
  const parsed = parseShopCustomId(interaction.customId);
  const ownerId = parsed.ownerId || interaction.user?.id;

  interaction.shopBaseId = parsed.baseId;
  interaction.shopOwnerId = ownerId;
  interaction.shopCustomExtra = parsed.extra;

  if (parsed.ownerId && interaction.user?.id !== parsed.ownerId) {
    await interaction.reply({
      content: "هذه رسالة متجر خاصة بصاحبها فقط.",
      ephemeral: true,
    }).catch(() => {});
    return null;
  }

  return ownerId;
}

function getShopBaseId(interaction) {
  return interaction.shopBaseId || parseShopCustomId(interaction.customId).baseId;
}

function getShopOwnerId(interaction) {
  return interaction.shopOwnerId || parseShopCustomId(interaction.customId).ownerId || interaction.user?.id;
}

function getShopCustomExtra(interaction) {
  return interaction.shopCustomExtra || parseShopCustomId(interaction.customId).extra;
}

function validateNickname(rawName) {
  const nickname = String(rawName || "").trim();

  if (nickname.length < 1) {
    return { ok: false, reason: "اكتب اسمًا من حرف واحد على الأقل." };
  }

  if (nickname.length > 32) {
    return { ok: false, reason: "نك نيم ديسكورد لا يزيد عن 32 حرفًا." };
  }

  if (/[\r\n\t]/.test(nickname)) {
    return { ok: false, reason: "الاسم لا يقبل أسطرًا أو رموز تحكم." };
  }

  return { ok: true, nickname };
}

// ✅ جلب الأغراض من قسم معين
async function getShopItems(section, db) {
  return await db.collection("shop_items").find({ section }).toArray();
}

// ✅ جلب مخزون المستخدم
async function getUserInventory(userId, db) {
  const uid = String(userId);
  const user = await db.collection("user_items").findOne({ userId: uid });
  return user?.items || {};
}

// ✅ التحقق من إمكانية الشراء
async function canBuyItem(userId, item, db) {
  const balance = await getBalance(userId, db);
  if (balance < item.price) return { ok: false, reason: " رصيدك لا يكفي.<:icons8wrong1001:1415979909825695914>" };
  if (item.stock <= 0) return { ok: false, reason: " الغرض غير متوفر حالياً.<:icons8wrong1001:1415979909825695914>" };

  const inventory = await getUserInventory(userId, db);
  const owned = inventory[item.itemId] || 0;
  if (owned >= item.maxPerUser) return { ok: false, reason: " لا يمكنك شراء أكثر من نسخة.<:icons8wrong1001:1415979909825695914>" };

  return { ok: true };
}

// ✅ تنفيذ الشراء
async function buyItem(userId, item, db) {
  const uid = String(userId);
  await subtractBalance(uid, item.price, db);
  await db.collection("shop_items").updateOne(
    { itemId: item.itemId },
    { $inc: { stock: -1 } }
  );
  await db.collection("user_items").updateOne(
    { userId: uid },
    { $inc: { [`items.${item.itemId}`]: 1 } },
    { upsert: true }
  );
}

// ✅ جلب الرصيد
async function getBalance(userId, db) {
  const uid = String(userId);
  const user = await db.collection("users").findOne({ userId: uid });
  if (!user) return 0;
  return user.wallet || 0;
}

// ✅ خصم الرصيد
async function subtractBalance(userId, amount, db) {
  const uid = String(userId);
  await db.collection("users").updateOne(
    { userId: uid },
    { $inc: { wallet: -Math.abs(amount) } },
    { upsert: true }
  );
}

// ✅ سجل عملية مالية في MongoDB ضمن مجموعة transactions
// ملاحظات التوافق:
// - الحقول userName / targetName اختيارية لعرض الأسماء في كشف الحساب.
// - يُنصح بتمرير userName كـ displayName || globalName || username من جهة الاستدعاء.
// - يمكن تمرير targetId/targetName في العمليات التي لها طرف ثانٍ (مثل السجن/الكفالة/المتجر).
async function recordTransaction(db, {
  userId,
  amount,                 // موجب للإيداع، سالب للخصم
  reason,                 // نص مختصر للسبب (يظهر في كشف الحساب)
  guildId = null,
  channelId = null,
  ref = null,             // كائن مرجعي: { type, itemId, roleId, ... }
  balanceAfter = null,
  userName = null,        // اسم المنفّذ (displayName/globalName/username) - اختياري
  targetId = null,        // معرف الطرف الآخر - اختياري
  targetName = null       // اسم الطرف الآخر - اختياري
}) {
  const doc = {
    userId: String(userId),
    amount: Number(amount),
    reason: String(reason || "عملية"),
    timestamp: new Date(),
    guildId,
    channelId,
    ref,
    balanceAfter,
    // لقطات أسماء اختيارية لعرض أنظف في كشف الحساب
    userName: userName ? String(userName) : undefined,
    targetId: targetId ? String(targetId) : (ref?.targetId ? String(ref.targetId) : undefined),
    targetName: targetName ? String(targetName) : undefined
  };

  await db.collection("transactions").insertOne(doc);
  return doc;
}

module.exports = {
  getShopItems,
  getUserInventory,
  canBuyItem,
  buyItem,
  getBalance,
  subtractBalance,
  recordTransaction,
  activateEffect,
  addGameReward,
  assertShopOwner,
  getAdjustedReward,
  getProtectedDebit,
  getShopBaseId,
  getShopCustomExtra,
  getShopOwnerId,
  hasActiveEffect,
  makeShopCustomId,
  parseShopCustomId,
  refundLossProtection,
  subtractGameLoss,
  validateNickname
};
