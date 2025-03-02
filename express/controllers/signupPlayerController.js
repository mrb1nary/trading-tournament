import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";

dotenv.config();

export const signupPlayerController = async (req, res) => {
  try {
    // Extract player details from the request body
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

    // Create a new Player document
    const newPlayer = new Player({
      player_wallet_address,
      twitter_handle: twitter_handle || null, // Optional field
      player_email,
      player_username,
      current_balance: 0, // Default balance for a new player
    });

    // Save the new player to the database and handle unique validation errors
    await newPlayer
      .save()
      .then(() => {
        res.status(201).json({
          message: "Player signed up successfully",
          player: newPlayer,
        });
      })
      .catch((error) => {
        if (error.name === "ValidationError") {
          return res.status(400).json({ error: error.message });
        }
        console.error("Error signing up player:", error);
        return res.status(500).json({ error: "Failed to sign up player" });
      });
  } catch (error) {
    console.error("Error signing up player:", error);
    res.status(500).json({ error: "Failed to sign up player" });
  }
};
