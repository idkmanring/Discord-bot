// utils/updateMinigameStats.js
const updateMinigameStats = async (db, userId, gameId, didWin = true) => {
  const collection = db.collection("minigame_stats");
  const update = {
    $inc: {
      [`games.${gameId}.played`]: 1
    }
  };
  if (didWin) {
    update.$inc[`games.${gameId}.wins`] = 1;
  }
  await collection.updateOne({ userId }, update, { upsert: true });
};

module.exports = updateMinigameStats;
