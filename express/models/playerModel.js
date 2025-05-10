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
      // Removed index from here as it causes the parallel array issue
    },
    profits: {
      USDC: { type: ProfitSchema, default: () => ({}) },
      USDT: { type: ProfitSchema, default: () => ({}) },
      SOL: { type: ProfitSchema, default: () => ({}) },
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

const VersusPlayedSchema = new mongoose.Schema(
  {
    versus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Versus",
      required: true,
      // Removed index from here as it causes the parallel array issue
    },
    profits: {
      USDC: { type: ProfitSchema, default: () => ({}) },
      USDT: { type: ProfitSchema, default: () => ({}) },
      SOL: { type: ProfitSchema, default: () => ({}) },
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
      unique: true,
      sparse: true, // Ensures no duplicate wallet addresses
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
    tg_username: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        /^@[a-zA-Z0-9_]{5,32}$/,
        "Telegram username must start with @ and contain 5-32 letters, numbers or underscores",
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
    versus_played: [VersusPlayedSchema],
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

// Virtual properties for win rate calculations
PlayerSchema.virtual("win_rate").get(function () {
  if (!this.competitions_played?.length) return 0;
  const totalProfit = this.competitions_played.reduce(
    (sum, comp) => sum + (comp.profits?.total || 0),
    0
  );
  return parseFloat((totalProfit / this.competitions_played.length).toFixed(2));
});

PlayerSchema.virtual("versus_win_rate").get(function () {
  if (!this.versus_played?.length) return 0;
  const totalProfit = this.versus_played.reduce(
    (sum, vs) => sum + (vs.profits?.total || 0),
    0
  );
  return parseFloat((totalProfit / this.versus_played.length).toFixed(2));
});

// Create necessary indexes for unique fields
PlayerSchema.index({
  player_wallet_address: 1,
});

PlayerSchema.index({
  twitter_handle: 1,
});

PlayerSchema.index({
  player_email: 1,
});

PlayerSchema.index({
  player_username: 1,
});

PlayerSchema.index({
  tg_username: 1,
});

// IMPORTANT: Fix for parallel array indexing issue
// Only index one of the arrays, not both
// Choose the one that's most frequently queried
PlayerSchema.index({
  "competitions_played.competition": 1,
});

// Remove this index to solve the parallel array indexing error
// PlayerSchema.index({
//   "versus_played.versus": 1,
// });

PlayerSchema.plugin(mongooseUniqueValidator, {
  message: "{PATH} must be unique.",
});

export const Player = mongoose.model("Player", PlayerSchema);
