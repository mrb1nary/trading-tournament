import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
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
      category, // Competition category
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
      "TwoPlayers",
      "SixPlayers",
      "TwelvePlayers",
      "TwentyFivePlayers",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid competition category" });
    }

    // Generate a unique ID for the competition
    const competitionId = Math.floor(Math.random() * 1000000);

    // Determine max_players based on category
    let max_players;
    switch (category) {
      case "TwoPlayers":
        max_players = 2;
        break;
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

    // Initialize competition object
    const newCompetition = new Competition({
      authority,
      id: competitionId,
      max_players,
      current_players: 0, // Will be updated for TwoPlayers after finding player
      entry_fee,
      base_amount,
      start_time: new Date(start_time * 1000),
      end_time: new Date(end_time * 1000),
      winning_amount,
      category,
      winner: null,
      payout_claimed: false,
      participants: [], // Will be updated for TwoPlayers after finding player
    });

    // For TwoPlayers category, add the creator as the first participant
    if (category === "TwoPlayers") {
      // Find the player by wallet address
      const player = await Player.findOne({ player_wallet_address: authority });

      // If player doesn't exist, return error
      if (!player) {
        return res.status(404).json({
          error: "Player not found",
          message:
            "You need to sign up on the platform before creating a competition",
        });
      }

      // Add the player to participants and increment the counter
      newCompetition.participants.push(player._id);
      newCompetition.current_players = 1;
    }

    // Save the competition to the database
    await newCompetition.save();

    // Prepare response object
    const responseData = {
      message: "Competition created successfully",
      competition: newCompetition,
    };

    // Add competition_id to response for TwoPlayers category (versus mode)
    if (category === "TwoPlayers") {
      responseData.competition_id = competitionId;
    }

    // Respond with success
    res.status(201).json(responseData);
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
