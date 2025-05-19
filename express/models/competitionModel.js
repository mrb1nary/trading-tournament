import mongoose from "mongoose";

const CompetitionSchema = new mongoose.Schema(
  {
    // Solana Program Connection
    on_chain_id: {
      type: String,
      required: true,
      unique: true,
      match: [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address"],
      index: true,
    },
    authority: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v),
        message: "Invalid Solana wallet address",
      },
      index: true,
    },

    // Competition State Management
    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
      index: true,
    },
    version: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Competition Parameters
    max_players: {
      type: Number,
      required: true,
      min: 2,
      validate: {
        validator: function (v) {
          return this.category === "TwoPlayers"
            ? v === 2
            : this.category === "SixPlayers"
            ? v === 6
            : this.category === "TwelvePlayers"
            ? v === 12
            : v === 25; // TwentyFivePlayers
        },
        message: "Max players must match category",
      },
    },
    current_players: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return v <= this.max_players && v >= 0;
        },
        message: "Invalid player count",
      },
    },

    // Financial Parameters
    entry_fee: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => parseFloat(v.toFixed(2)), // Ensure 2 decimal places
    },
    base_amount: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => parseFloat(v.toFixed(2)),
    },
    platform_fee_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10,
    },
    prize_distribution: [
      {
        rank: { type: Number, required: true, min: 1 },
        percentage: { type: Number, required: true, min: 0, max: 100 },
      },
    ],

    // Time Management
    start_time: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v < this.end_time && v > new Date();
        },
        message: "Start time must be future date before end time",
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

    // Relationships
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        validate: {
          validator: function (arr) {
            return new Set(arr.map((id) => id.toString())).size === arr.length;
          },
          message: "Duplicate participants not allowed",
        },
      },
    ],

    // Payout Tracking
    payout_claimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for Common Query Patterns
CompetitionSchema.index({
  category: 1,
  status: 1,
  end_time: -1,
});
CompetitionSchema.index({
  "prize_distribution.percentage": -1,
});

// Pre-save Hooks
CompetitionSchema.pre("save", function (next) {
  // Auto-update status
  if (this.current_players >= this.max_players) {
    this.status = "active";
  }

  if (this.end_time < new Date()) {
    this.status = "ended";
  }

  // Versioning for optimistic concurrency
  this.version++;
  next();
});

export const Competition = mongoose.model("Competition", CompetitionSchema);
