import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";

const ProfitSchema = new mongoose.Schema(
  {
    buys: { type: Number, default: 0, min: 0 },
    sells: { type: Number, default: 0, min: 0 },
    net: {
      type: Number,
      default: 0,
      set: (v) => Number(v.toFixed(2)),
    },
  },
  { _id: false }
);

const ContestPlayedSchema = new mongoose.Schema(
  {
    entry_fee: {
      type: Number,
      required: true,
      set: (v) => Number(v.toFixed(2)),
    },
    transaction_signature: {
      type: String,
      validate: {
        validator: (v) => /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(v),
        message: "Invalid Solana transaction signature",
      },
      sparse: true,
    },
  },
  { _id: false, timestamps: true }
);

const CompetitionPlayedSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true, // Index for frequent lookups
    },
    profits: {
      USDC: { type: ProfitSchema, default: () => ({}) },
      USDT: { type: ProfitSchema, default: () => ({}) },
      SOL: { type: ProfitSchema, default: () => ({}) },
      total: {
        type: Number,
        default: 0,
        set: (v) => Number(v.toFixed(2)),
      },
    },
    position: {
      type: Number,
      min: 1,
      index: true,
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
      index: true,
    },
    profits: {
      USDC: { type: ProfitSchema, default: () => ({}) },
      USDT: { type: ProfitSchema, default: () => ({}) },
      SOL: { type: ProfitSchema, default: () => ({}) },
      total: {
        type: Number,
        default: 0,
        set: (v) => Number(v.toFixed(2)),
      },
    },
    position: {
      type: Number,
      min: 1,
      index: true,
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
      validate: {
        validator: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v),
        message: "Invalid Solana wallet address",
      },
      index: true,
    },
    twitter_handle: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      maxlength: 15,
    },
    player_email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    player_username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 20,
      match: [/^[a-zA-Z0-9]*$/, "Username can only contain alphanumerics"],
    },
    tg_username: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^@[a-zA-Z0-9_]{5,32}$/, "Invalid Telegram handle"],
    },
    total_profit: {
      type: Number,
      default: 0,
      set: (v) => Number(v.toFixed(2)),
      index: -1, // Descending index
    },
    total_points: {
      type: Number,
      default: 0,
      index: -1,
    },
    competitions_played: {
      type: [CompetitionPlayedSchema],
      select: false,
    },
    versus_played: {
      type: [VersusPlayedSchema],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.competitions_played;
        delete ret.versus_played;
        return ret;
      },
    },
  }
);

// Optimized Virtuals
PlayerSchema.virtual("win_rate").get(function () {
  if (!this.competitions_played?.length) return 0;
  const wins = this.competitions_played.filter((c) => c.position === 1).length;
  return Number(((wins / this.competitions_played.length) * 100).toFixed(2));
});

PlayerSchema.virtual("competition_count").get(function () {
  return this.competitions_played?.length || 0;
});

// Compound Indexes
PlayerSchema.index({
  total_profit: -1,
  total_points: -1,
});

PlayerSchema.index({
  player_wallet_address: 1,
  updatedAt: -1,
});

// Query Optimization
PlayerSchema.statics.findByWallet = function (wallet) {
  return this.findOne({ player_wallet_address: wallet }).select(
    "+competitions_played +versus_played"
  );
};

PlayerSchema.plugin(mongooseUniqueValidator);

export const Player = mongoose.model("Player", PlayerSchema);
