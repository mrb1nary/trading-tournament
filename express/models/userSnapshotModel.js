import mongoose from "mongoose";

const UserSnapshotSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
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
    snapshot_timestamp: {
      type: Date,
      required: true,
    },
    assets: [
      {
        mint_address: {
          type: String,
          required: true,
          match: [
            /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
            "Invalid token mint address",
          ],
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
      },
    ],
    total_portfolio_value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for faster lookups
UserSnapshotSchema.index({
  competition: 1,
  player: 1,
  snapshot_timestamp: -1,
});

export const UserAssetSnapshot = mongoose.model(
  "UserAssetSnapshot",
  UserSnapshotSchema
);
