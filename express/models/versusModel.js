import mongoose from "mongoose";

const VersusSchema = new mongoose.Schema(
  {
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
          // Only allow deactivation after end_time
          return v === true || (this.end_time && this.end_time < new Date());
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
      index: true,
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
          return v <= this.max_players && v >= 0;
        },
        message: "Current players cannot exceed max players",
      },
    },
    entry_fee: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100,
      set: (v) => Number(v.toFixed(2)), // Monetary precision
    },
    base_amount: {
      type: Number,
      required: true,
      min: 10,
      max: 10000,
      set: (v) => Number(v.toFixed(2)),
    },
    start_time: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return this.end_time && v < this.end_time;
        },
        message: "Start time must be before end time",
      },
    },
    end_time: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return this.start_time && v > this.start_time;
        },
        message: "End time must be after start time",
      },
    },
    winning_amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100000,
      set: (v) => Number(v.toFixed(2)),
    },
    category: {
      type: String,
      enum: ["Versus"],
      required: true,
      default: "Versus",
      index: true,
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
          // Ensure no duplicate players
          return new Set(arr.map((id) => id.toString())).size === arr.length;
        },
        message: "Duplicate players in competition",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
VersusSchema.index({ start_time: 1, end_time: 1 });
VersusSchema.index({ category: 1, winning_amount: 1 });
VersusSchema.index({ participants: 1 });
VersusSchema.index({ active: 1, end_time: 1 });
VersusSchema.index({ current_players: 1, max_players: 1 });

// Pre-save hook to auto-deactivate after end_time
VersusSchema.pre("save", function (next) {
  if (this.end_time && this.end_time < new Date()) {
    this.active = false;
  }
  next();
});

export const Versus = mongoose.model("Versus", VersusSchema);
