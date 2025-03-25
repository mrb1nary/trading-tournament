import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";

const PlayerSchema = new mongoose.Schema(
  {
    player_wallet_address: {
      type: String,
      required: true,
      index: true, // Added index for faster queries
    },
    twitter_handle: {
      type: String,
      unique: true,
      maxlength: 15,
    },
    x_handle: {
      type: String,
      unique: true,
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
      min: 0, // Prevent negative values
    },
    total_points: {
      type: Number,
      default: 0,
      min: 0,
    },
    competitions_played: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Competition",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Enable virtuals when converting to JSON
    toObject: { virtuals: true },
  }
);

// Virtual for lifetime win rate
PlayerSchema.virtual("win_rate").get(function () {
  return this.competitions_played.length > 0
    ? (this.total_profit / this.competitions_played.length).toFixed(2)
    : 0;
});

PlayerSchema.plugin(mongooseUniqueValidator, {
  message: "{PATH} must be unique.",
});

export const Player = mongoose.model("Player", PlayerSchema);
