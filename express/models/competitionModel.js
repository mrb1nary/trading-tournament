import mongoose from "mongoose";

const CompetitionSchema = new mongoose.Schema({
  authority: {
    type: String,
    required: true,
    index: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
    validate: {
      validator: function (v) {
        return v === true || this.end_time < new Date();
      },
      message: "Competition can only be deactivated after end time",
    },
  },
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  max_players: {
    type: Number,
    required: true,
    min: 2,
  },
  current_players: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        return v <= this.max_players;
      },
      message: "Current players cannot exceed max players",
    },
  },
  entry_fee: {
    type: Number,
    required: true,
    min: 0,
  },
  base_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  start_time: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v < this.end_time;
      },
      message: "Start time must be before end time",
    },
  },
  end_time: {
    type: Date,
    required: true,
  },
  winning_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ["TwoPlayers", "SixPlayers", "TwelvePlayers", "TwentyFivePlayers"],
    required: true,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    default: null,
  },
  payout_claimed: {
    type: Boolean,
    default: false,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],
});

// Indexes
CompetitionSchema.index({ start_time: 1, end_time: 1 });
CompetitionSchema.index({ category: 1, winning_amount: 1 });
CompetitionSchema.index({ participants: 1 }); // New index for player lookups

export const Competition = mongoose.model("Competition", CompetitionSchema);

