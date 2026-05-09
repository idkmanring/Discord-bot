const mongoose = require("mongoose");

const leagueDb = mongoose.connection.useDb("discord_casino", { useCache: true });

const participantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    avatarURL: { type: String, default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leagueTournamentSchema = new mongoose.Schema(
  {
    guildId: { type: String, index: true, default: null },
    name: { type: String, default: "دوري السيرفر" },
    status: {
      type: String,
      enum: ["registration", "active", "finished"],
      default: "registration",
      index: true,
    },
    registrationMessageId: { type: String, default: null },
    registrationChannelId: { type: String, default: null },
    standingsMessageId: { type: String, default: null },
    standingsChannelId: { type: String, default: null },
    participants: { type: [participantSchema], default: [] },
    reserveParticipants: { type: [participantSchema], default: [] },
    createdBy: { type: String, default: null },
    startedBy: { type: String, default: null },
    finishedBy: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "league_tournaments" }
);

leagueTournamentSchema.index({ guildId: 1, status: 1, createdAt: -1 });

module.exports =
  leagueDb.models.LeagueTournament ||
  leagueDb.model("LeagueTournament", leagueTournamentSchema);
