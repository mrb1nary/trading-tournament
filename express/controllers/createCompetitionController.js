import { Competition } from "../models/competitionModel.js";
import dotenv from "dotenv";
dotenv.config();

export const createCompetitionController = async (req, res) => {
  try {
    // Extract competition details from the request body
    const {
      authority, // Public key of the competition creator
      entry_fee, // Entry fee in lamports
      base_amount, // Base amount in lamports
      start_time, // UNIX timestamp for start time
      end_time, // UNIX timestamp for end time
      winning_amount, // Winning amount in lamports
      category, // Competition category (e.g., "SixPlayers", "TwelvePlayers", "TwentyFivePlayers")
    } = req.body;

    // Validate required fields
    if (
      !authority ||
      !entry_fee ||
      !base_amount ||
      !start_time ||
      !end_time ||
      !winning_amount ||
      !category
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate numeric fields
    if (
      isNaN(entry_fee) ||
      isNaN(base_amount) ||
      isNaN(start_time) ||
      isNaN(end_time) ||
      isNaN(winning_amount)
    ) {
      return res.status(400).json({ error: "Invalid numeric values provided" });
    }

    // Validate category
    const validCategories = [
      "SixPlayers",
      "TwelvePlayers",
      "TwentyFivePlayers",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid competition category" });
    }

    // Generate a unique ID for the competition
    const competitionId = Math.floor(Math.random() * 1000000); // Generate a random unique ID

    // Determine max_players based on category
    let max_players;
    switch (category) {
      case "SixPlayers":
        max_players = 6;
        break;
      case "TwelvePlayers":
        max_players = 12;
        break;
      case "TwentyFivePlayers":
        max_players = 25;
        break;
      default:
        return res.status(400).json({ error: "Invalid competition category" });
    }

    // Save the competition details to MongoDB
    const newCompetition = new Competition({
      authority,
      id: competitionId, // Unique competition ID
      max_players, // Set based on category
      current_players: 0, // Initially, no players are registered
      entry_fee,
      base_amount,
      start_time: new Date(start_time * 1000), // Convert UNIX timestamp to Date
      end_time: new Date(end_time * 1000), // Convert UNIX timestamp to Date
      winning_amount,
      category,
      winner: null, // No winner initially
      payout_claimed: false, // Payout not claimed initially
      participants: [], // No participants initially
    });

    await newCompetition.save();

    // Respond with success
    res.status(201).json({
      message: "Competition created successfully",
      competition: newCompetition,
    });
  } catch (error) {
    console.error("Error creating competition:", error);

    // Handle specific errors
    if (error.code === 11000) {
      // Mongoose duplicate key error (e.g., unique `id` conflict)
      return res
        .status(400)
        .json({ error: "Competition ID already exists in the database" });
    }

    // General error response
    res.status(500).json({ error: "Failed to create competition" });
  }
};
