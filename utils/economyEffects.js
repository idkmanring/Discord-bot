const EFFECT_DURATION_MS = 60 * 60 * 1000;

const EFFECTS = {
  double_money: "effects.doubleMoneyUntil",
  loss_protection: "effects.lossProtectionUntil",
};

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isActive(value, now = Date.now()) {
  const date = toDate(value);
  return Boolean(date && date.getTime() > now);
}

async function getUserEffects(userId, db) {
  const user = await db.collection("users").findOne(
    { userId: String(userId) },
    { projection: { effects: 1 } }
  );

  return user?.effects || {};
}

async function hasActiveEffect(userId, effectKey, db) {
  const effects = await getUserEffects(userId, db);
  if (effectKey === "double_money") return isActive(effects.doubleMoneyUntil);
  if (effectKey === "loss_protection") return isActive(effects.lossProtectionUntil);
  return false;
}

async function activateEffect(userId, effectKey, db, durationMs = EFFECT_DURATION_MS) {
  const field = EFFECTS[effectKey];
  if (!field) throw new Error(`Unknown economy effect: ${effectKey}`);

  const effects = await getUserEffects(userId, db);
  const currentUntil =
    effectKey === "double_money"
      ? toDate(effects.doubleMoneyUntil)
      : toDate(effects.lossProtectionUntil);

  const now = new Date();
  const startsAt = currentUntil && currentUntil > now ? currentUntil : now;
  const expiresAt = new Date(startsAt.getTime() + durationMs);

  await db.collection("users").updateOne(
    { userId: String(userId) },
    { $set: { [field]: expiresAt } },
    { upsert: true }
  );

  return expiresAt;
}

async function getAdjustedReward(userId, amount, db) {
  const baseAmount = Math.max(0, Number(amount) || 0);
  const doubled = await hasActiveEffect(userId, "double_money", db);
  return {
    baseAmount,
    finalAmount: doubled ? baseAmount * 2 : baseAmount,
    doubled,
  };
}

async function addGameReward(userId, amount, db) {
  const reward = await getAdjustedReward(userId, amount, db);
  if (reward.finalAmount > 0) {
    await db.collection("users").updateOne(
      { userId: String(userId) },
      { $inc: { wallet: reward.finalAmount } },
      { upsert: true }
    );
  }
  return reward;
}

async function getProtectedDebit(userId, amount, db) {
  const baseAmount = Math.max(0, Math.abs(Number(amount) || 0));
  const protectedLoss = await hasActiveEffect(userId, "loss_protection", db);
  return {
    baseAmount,
    finalAmount: protectedLoss ? Math.ceil(baseAmount / 2) : baseAmount,
    protected: protectedLoss,
  };
}

async function subtractGameLoss(userId, amount, db) {
  const debit = await getProtectedDebit(userId, amount, db);
  if (debit.finalAmount > 0) {
    await db.collection("users").updateOne(
      { userId: String(userId) },
      { $inc: { wallet: -debit.finalAmount } },
      { upsert: true }
    );
  }
  return debit;
}

async function refundLossProtection(userId, lossAmount, db, reason = "Loss protection refund") {
  const baseAmount = Math.max(0, Math.abs(Number(lossAmount) || 0));
  const protectedLoss = await hasActiveEffect(userId, "loss_protection", db);
  const refundAmount = protectedLoss ? Math.floor(baseAmount / 2) : 0;

  if (refundAmount > 0) {
    await db.collection("users").updateOne(
      { userId: String(userId) },
      { $inc: { wallet: refundAmount } },
      { upsert: true }
    );
    await db.collection("transactions").insertOne({
      userId: String(userId),
      amount: refundAmount,
      reason,
      timestamp: new Date(),
      ref: { type: "loss_protection_refund", lossAmount: baseAmount },
    });
  }

  return { baseAmount, refundAmount, protected: protectedLoss };
}

module.exports = {
  EFFECT_DURATION_MS,
  activateEffect,
  addGameReward,
  getAdjustedReward,
  getProtectedDebit,
  hasActiveEffect,
  refundLossProtection,
  subtractGameLoss,
};
