const mongoose = require("mongoose");

const leagueDb = mongoose.connection.useDb("discord_casino", { useCache: true });

const leagueBetSchema = new mongoose.Schema(
  {
    guildId: { type: String, index: true, default: null },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    matchId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    teamPick: { type: Number, enum: [1, 2], required: true },
    pickedTeamId: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    odds: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "won", "lost", "refunded"],
      default: "pending",
      index: true,
    },
    payout: { type: Number, default: 0 },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "league_bets" }
);

leagueBetSchema.index({ tournamentId: 1, matchId: 1, userId: 1 }, { unique: true });
leagueBetSchema.index({ tournamentId: 1, status: 1 });

module.exports =
  leagueDb.models.LeagueBet ||
  leagueDb.model("LeagueBet", leagueBetSchema);
