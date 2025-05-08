import mongoose from "mongoose";

const VersusSchema = new mongoose.Schema({
  authority: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v),
      message: "Invalid Solana wallet address format",
    },
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
    min: 100000,
    max: 999999,
  },
  max_players: {
    type: Number,
    required: true,
    min: 2,
    max: 25,
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
    min: 0.01,
    max: 100,
  },
  base_amount: {
    type: Number,
    required: true,
    min: 10,
    max: 10000,
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
    validate: {
      validator: function (v) {
        return v > this.start_time;
      },
      message: "End time must be after start time",
    },
  },
  winning_amount: {
    type: Number,
    required: true,
    min: 0.01,
    max: 100000,
  },
  category: {
    type: String,
    enum: ["Versus"],
    required: true,
    default: "Versus",
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
  participants: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    validate: {
      validator: function (arr) {
        return new Set(arr.map((id) => id.toString())).size === arr.length;
      },
      message: "Duplicate players in competition",
    },
  },
});

// Optimized indexes
VersusSchema.index({ start_time: 1, end_time: 1 });
VersusSchema.index({ category: 1, winning_amount: 1 });
VersusSchema.index({ participants: 1 });

export const Versus = mongoose.model("Versus", VersusSchema);
