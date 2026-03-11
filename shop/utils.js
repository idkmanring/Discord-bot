// 📁 /shop/utils.js

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
  recordTransaction
};
