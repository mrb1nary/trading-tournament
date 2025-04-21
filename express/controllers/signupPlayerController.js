import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";

dotenv.config();

export const signupPlayerController = async (req, res) => {
  try {
    const {
      player_wallet_address,
      twitter_handle,
      player_email,
      player_username,
    } = req.body;

    // Validate required fields
    if (!player_wallet_address || !player_email || !player_username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create new player with proper handling
    const newPlayer = new Player({
      player_wallet_address,
      twitter_handle: twitter_handle?.trim() || undefined,
      player_email,
      player_username,
      // current_balance: 0,
    });

    await newPlayer.save();
    res.status(201).json({
      message: "Player signed up successfully",
      player: newPlayer,
    });
  } catch (error) {
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      const fieldMapping = {
        player_wallet_address: "wallet address",
        player_email: "email",
        player_username: "username",
        twitter_handle: "Twitter handle",
      };

      return res.status(400).json({
        error: `This ${
          fieldMapping[duplicateField] || duplicateField
        } is already registered`,
        field: duplicateField,
        value: error.keyValue[duplicateField],
      });
    }

    // Handle other errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Error signing up player:", error);
    res.status(500).json({ error: "Failed to sign up player" });
  }
};


