import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema({
  mint_address: {
    type: String,
    required: true,
    match: [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid token mint address"],
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
  usd_value: {
    type: Number,
    required: false,
    min: 0,
  },
});

const SnapshotSchema = new mongoose.Schema({
  snapshot_timestamp: {
    type: Date,
    required: true,
  },
  assets: [AssetSchema],
  total_portfolio_value: {
    type: Number,
    required: true,
    min: 0,
  },
});

const UserSnapshotSchema = new mongoose.Schema(
  {
    // Modified: Made competition optional
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: false, // Changed from true to false
      index: true,
    },
    // Added: Versus reference
    versus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Versus",
      required: false,
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
      match: [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address"],
      index: true,
    },
    startSnapshot: {
      type: SnapshotSchema,
      required: false,
    },
    endSnapshot: {
      type: SnapshotSchema,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Added validation to ensure either competition or versus is provided
UserSnapshotSchema.pre("validate", function (next) {
  if (!this.competition && !this.versus) {
    this.invalidate(
      "competition",
      "Either competition or versus must be provided"
    );
    this.invalidate("versus", "Either competition or versus must be provided");
  }
  next();
});

// Modified: Compound index for competition lookups
UserSnapshotSchema.index({
  competition: 1,
  player: 1,
  "startSnapshot.snapshot_timestamp": 1,
  "endSnapshot.snapshot_timestamp": -1,
});

// Added: Compound index for versus lookups
UserSnapshotSchema.index({
  versus: 1,
  player: 1,
  "startSnapshot.snapshot_timestamp": 1,
  "endSnapshot.snapshot_timestamp": -1,
});

// Added: Ensure uniqueness for player-competition and player-versus combinations
UserSnapshotSchema.index(
  { player: 1, competition: 1 },
  { unique: true, sparse: true }
);
UserSnapshotSchema.index(
  { player: 1, versus: 1 },
  { unique: true, sparse: true }
);

export const UserAssetSnapshot = mongoose.model(
  "UserAssetSnapshot",
  UserSnapshotSchema
);
