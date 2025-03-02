import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";

const PlayerSchema = new mongoose.Schema(
  {
    player_wallet_address: {
      type: String, // PublicKey as a string
      required: true,
    },
    twitter_handle: {
      type: String, // Twitter handle of the player
      unique: true,
      maxlength: 15,
    },
    player_email: {
      type: String, // Email address of the player
      required: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address", // Validation for email format
      ],
    },
    player_username: {
      type: String, // Username of the player
      required: true,
      unique: true,
      maxlength: 20,
      match: [
        /^[a-zA-Z0-9]*$/,
        "Username can only contain alphanumeric characters", // Validation for alphanumeric characters
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Apply the uniqueValidator plugin to PlayerSchema
PlayerSchema.plugin(mongooseUniqueValidator, {
  message: "{PATH} must be unique.",
});

export const Player = mongoose.model("Player", PlayerSchema);
