const mongoose = require("mongoose");

const leagueDb = mongoose.connection.useDb("discord_casino", { useCache: true });

const leagueMatchSchema = new mongoose.Schema(
  {
    guildId: { type: String, index: true, default: null },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    matchId: { type: String, required: true },
    team1Id: { type: String, required: true },
    team2Id: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "ready_check", "postponed", "game_selection", "active", "finished"],
      default: "pending",
      index: true,
    },
    selectedGame: { type: String, default: "" },
    readyUserIds: { type: [String], default: [] },
    readyStartedAt: { type: Date, default: null },
    threadId: { type: String, default: null },
    channelId: { type: String, default: null },
    messageId: { type: String, default: null },
    winnerTeamId: { type: String, default: null },
    isDraw: { type: Boolean, default: false },
    resultBy: { type: String, default: null },
    result: {
      team1Score: { type: Number, default: null },
      team2Score: { type: Number, default: null },
    },
    odds: {
      team1: { type: Number, default: 1.9 },
      team2: { type: Number, default: 1.9 },
    },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "league_matches" }
);

leagueMatchSchema.index({ tournamentId: 1, matchId: 1 }, { unique: true });
leagueMatchSchema.index({ tournamentId: 1, status: 1 });
leagueMatchSchema.index({ tournamentId: 1, team1Id: 1, team2Id: 1 });

module.exports =
  leagueDb.models.LeagueMatch ||
  leagueDb.model("LeagueMatch", leagueMatchSchema);
