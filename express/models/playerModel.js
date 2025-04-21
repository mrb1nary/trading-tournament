import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";

const ProfitSchema = new mongoose.Schema(
  {
    buys: { type: Number, default: 0, min: 0 },
    sells: { type: Number, default: 0, min: 0 },
    net: { type: Number, default: 0 },
  },
  { _id: false }
);

const CompetitionPlayedSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true,
    },
    profits: {
      USDC: { type: ProfitSchema, default: () => ({}) },
      USDT: { type: ProfitSchema, default: () => ({}) },
      SOL: { type: ProfitSchema, default: () => ({}) }, // Added SOL tracking
      total: { type: Number, default: 0 },
    },
    points_earned: {
      type: Number,
      default: 0,
      min: 0,
    },
    position: {
      type: Number,
      min: 1,
    },
    entry_fee: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const PlayerSchema = new mongoose.Schema(
  {
    player_wallet_address: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    twitter_handle: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: 15,
    },
    player_email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    player_username: {
      type: String,
      required: true,
      unique: true,
      maxlength: 20,
      match: [
        /^[a-zA-Z0-9]*$/,
        "Username can only contain alphanumeric characters",
      ],
    },
    total_profit: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_points: {
      type: Number,
      default: 0,
      min: 0,
    },
    competitions_played: [CompetitionPlayedSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for lifetime win rate using total profits
PlayerSchema.virtual("win_rate").get(function () {
  if (!this.competitions_played || this.competitions_played.length === 0)
    return 0;

  const totalProfit = this.competitions_played.reduce(
    (sum, comp) => sum + (comp.profits?.total || 0),
    0
  );

  return parseFloat((totalProfit / this.competitions_played.length).toFixed(2));
});

// Compound index for efficient lookups
PlayerSchema.index({
  player_wallet_address: 1,
  "competitions_played.competition": 1,
});

PlayerSchema.plugin(mongooseUniqueValidator, {
  message: "{PATH} must be unique.",
});

export const Player = mongoose.model("Player", PlayerSchema);
