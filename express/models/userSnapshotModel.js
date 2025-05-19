import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
  {
    mint_address: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v),
        message: "Invalid Solana token mint address",
      },
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Number(v.toFixed(6)), // Precision for tokens
    },
    usd_value: {
      type: Number,
      min: 0,
      set: (v) => Number(v.toFixed(2)), // Monetary precision
    },
  },
  { _id: false }
);

const SnapshotSchema = new mongoose.Schema(
  {
    snapshot_timestamp: {
      type: Date,
      required: true,
      index: -1, // Descending index
    },
    assets: {
      type: [AssetSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one asset required",
      },
    },
    total_portfolio_value: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Number(v.toFixed(2)),
    },
  },
  { _id: false }
);

const UserSnapshotSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      index: true,
      validate: {
        validator: function (v) {
          return !v || this.versus; // XOR validation in pre-hook
        },
        message: "Cannot set both competition and versus",
      },
    },
    versus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Versus",
      index: true,
      validate: {
        validator: function (v) {
          return !v || this.competition; // XOR validation in pre-hook
        },
        message: "Cannot set both versus and competition",
      },
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    wallet_address: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v),
        message: "Invalid Solana wallet address",
      },
      index: true,
    },
    startSnapshot: {
      type: SnapshotSchema,
      required: function () {
        return !!this.endSnapshot; // Required if endSnapshot exists
      },
    },
    endSnapshot: {
      type: SnapshotSchema,
      required: function () {
        return !!this.startSnapshot; // Required if startSnapshot exists
      },
    },
    calculation_method: {
      type: String,
      enum: ["time-weighted", "simple"],
      default: "simple",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Enhanced Validation
UserSnapshotSchema.pre("validate", function (next) {
  // XOR validation
  if (!this.competition !== !this.versus) {
    next();
  } else {
    this.invalidate(
      "competition",
      "Exactly one of competition or versus must be provided"
    );
    next(new Error("Must provide either competition or versus"));
  }
});

// Index Optimization
UserSnapshotSchema.index({
  wallet_address: 1,
  "startSnapshot.snapshot_timestamp": -1,
});

UserSnapshotSchema.index({
  "startSnapshot.assets.mint_address": 1,
  "endSnapshot.assets.mint_address": 1,
});

// TTL for snapshots (90 days retention)
UserSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Virtuals
UserSnapshotSchema.virtual("duration").get(function () {
  if (!this.startSnapshot || !this.endSnapshot) return 0;
  return (
    this.endSnapshot.snapshot_timestamp - this.startSnapshot.snapshot_timestamp
  );
});

// Methods
UserSnapshotSchema.methods.calculateProfit = function () {
  if (!this.startSnapshot || !this.endSnapshot) return 0;
  return Number(
    (
      this.endSnapshot.total_portfolio_value -
      this.startSnapshot.total_portfolio_value
    ).toFixed(2)
  );
};

// Static Query Helpers
UserSnapshotSchema.statics.findByCompetition = function (competitionId) {
  return this.find({ competition: competitionId })
    .sort({ "startSnapshot.snapshot_timestamp": -1 })
    .populate("player", "player_wallet_address total_profit");
};

export const UserAssetSnapshot = mongoose.model(
  "UserAssetSnapshot",
  UserSnapshotSchema
);
