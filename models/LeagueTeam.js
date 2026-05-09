const mongoose = require("mongoose");

const leagueDb = mongoose.connection.useDb("discord_casino", { useCache: true });

const teamMemberSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
  },
  { _id: false }
);

const leagueTeamSchema = new mongoose.Schema(
  {
    guildId: { type: String, index: true, default: null },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    teamId: { type: String, required: true },
    members: {
      type: [teamMemberSchema],
      validate: [(members) => members.length === 2, "League teams must have two members."],
      required: true,
    },
    customName: { type: String, default: "" },
    points: { type: Number, default: 0 },
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    scoreFor: { type: Number, default: 0 },
    scoreAgainst: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "league_teams" }
);

leagueTeamSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });
leagueTeamSchema.index({ tournamentId: 1, "members.userId": 1 });

module.exports =
  leagueDb.models.LeagueTeam ||
  leagueDb.model("LeagueTeam", leagueTeamSchema);
