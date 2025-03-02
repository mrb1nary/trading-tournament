import { Player } from "../models/playerModel.js";
import { Competition } from "../models/competitionModel.js";
import dotenv from "dotenv";

dotenv.config();

export const signupPlayerController = async (req, res) => {
  try {
    // Extract player details from the request body
    const {
      competition_id,
      player_wallet_address,
      twitter_handle,
      player_email,
      player_username,
    } = req.body;

    // Validate required fields
    if (!player_wallet_address || !player_email || !player_username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate competition_id if provided
    if (competition_id) {
      const competition = await Competition.findById(competition_id);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }

      // Check if the competition has space for more players
      if (competition.current_players >= competition.max_players) {
        return res.status(400).json({ error: "Competition is already full" });
      }
    }

    // Check if a player with the same wallet address or username already exists
    const existingPlayer = await Player.findOne({
      $or: [{ player_wallet_address }, { player_username }, { player_email }],
    });
    if (existingPlayer) {
      return res
        .status(400)
        .json({
          error: "Player already exists with this wallet, email, or username",
        });
    }

    // Create a new Player document
    const newPlayer = new Player({
      competition_id: competition_id || null,
      player_wallet_address,
      twitter_handle: twitter_handle || null, // Optional field
      player_email,
      player_username,
      current_balance: 0, // Default balance for a new player
    });

    // Save the new player to the database
    await newPlayer.save();

    // If the player is signing up for a specific competition, update the competition's current_players count
    if (competition_id) {
      await Competition.findByIdAndUpdate(competition_id, {
        $inc: { current_players: 1 },
        $push: { participants: player_wallet_address }, // Add player's wallet address to participants array
      });
    }

    // Respond with success and the new player's details
    res.status(201).json({
      message: "Player signed up successfully",
      player: newPlayer,
    });
  } catch (error) {
    console.error("Error signing up player:", error);

    // General error response
    res.status(500).json({ error: "Failed to sign up player" });
  }
};
