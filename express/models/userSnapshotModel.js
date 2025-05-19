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
      set: (v) => Number(v.toFixed(6)),
    },
    usd_value: {
      type: Number,
      min: 0,
      set: (v) => Number(v.toFixed(2)),
    },
  },
  { _id: false }
);

const SnapshotSchema = new mongoose.Schema(
  {
    snapshot_timestamp: {
      type: Date,
      required: true,
      index: -1,
    },
    assets: {
      type: [AssetSchema],
      required: true,
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
    },
    versus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Versus",
      index: true,
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
      required: true, 
    },
    endSnapshot: {
      type: SnapshotSchema,
      required: false, 
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
  // XOR validation - exactly one game reference
  const hasCompetition = !!this.competition;
  const hasVersus = !!this.versus;

  if (hasCompetition !== hasVersus) {
    // Exactly one must be set
    next();
  } else {
    const err = new Error("Must provide exactly one of competition or versus");
    next(err);
  }
});

// Partial indexes for unique constraints
UserSnapshotSchema.index(
  { player: 1, competition: 1 },
  {
    unique: true,
    partialFilterExpression: { competition: { $exists: true } },
  }
);

UserSnapshotSchema.index(
  { player: 1, versus: 1 },
  {
    unique: true,
    partialFilterExpression: { versus: { $exists: true } },
  }
);

// TTL index (90 days)
UserSnapshotSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days in seconds
);

// Virtuals
UserSnapshotSchema.virtual("duration").get(function () {
  if (!this.startSnapshot || !this.endSnapshot) return 0;
  return (
    this.endSnapshot.snapshot_timestamp - this.startSnapshot.snapshot_timestamp
  );
});

// Methods
UserSnapshotSchema.methods.calculateProfit = function () {
  if (!this.endSnapshot) return 0;
  return Number(
    (
      this.endSnapshot.total_portfolio_value -
      this.startSnapshot.total_portfolio_value
    ).toFixed(2)
  );
};

export const UserAssetSnapshot = mongoose.model(
  "UserAssetSnapshot",
  UserSnapshotSchema
);
