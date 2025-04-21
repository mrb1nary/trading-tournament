import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";
dotenv.config();

export const createVersusPartyController = async (req, res) => {
  try {
    const {
      authority,
      entry_fee,
      base_amount,
      start_time,
      end_time,
      winning_amount,
      category,
    } = req.body;

    // Validate category first
    if (category !== "TwoPlayers") {
      return res.status(400).json({
        error: "This endpoint only accepts TwoPlayers competitions",
        code: "INVALID_CATEGORY",
      });
    }

    // Validate required fields
    const requiredFields = [
      "authority",
      "entry_fee",
      "base_amount",
      "start_time",
      "end_time",
      "winning_amount",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        code: "MISSING_FIELDS",
      });
    }

    // Numeric validation
    const numericValues = {
      entry_fee: Number(entry_fee),
      base_amount: Number(base_amount),
      start_time: Number(start_time),
      end_time: Number(end_time),
      winning_amount: Number(winning_amount),
    };

    for (const [field, value] of Object.entries(numericValues)) {
      if (isNaN(value) || value <= 0) {
        return res.status(400).json({
          error: `Invalid ${field.replace("_", " ")} value`,
          code: "INVALID_NUMERIC_VALUE",
        });
      }
    }

    // Verify authority is a registered player
    const player = await Player.findOne({ player_wallet_address: authority })
      .select("_id")
      .lean();

    if (!player) {
      return res.status(403).json({
        error: "Authority must be a registered player",
        solution: "Complete player registration first",
        code: "PLAYER_NOT_REGISTERED",
      });
    }

    // Generate unique competition ID
    const competitionId =
      (Date.now() % 1000000) + Math.floor(Math.random() * 1000);

    // Create competition with authority as participant
    const newCompetition = await Competition.create({
      authority,
      id: competitionId,
      max_players: 2,
      entry_fee: numericValues.entry_fee,
      base_amount: numericValues.base_amount,
      start_time: new Date(numericValues.start_time * 1000),
      end_time: new Date(numericValues.end_time * 1000),
      winning_amount: numericValues.winning_amount,
      category: "TwoPlayers",
      active: true,
      current_players: 1,
      participants: [{ player: player._id }],
      payout_claimed: false,
    });

    // Format response
    res.status(201).json({
      success: true,
      message: "TwoPlayer versus party created successfully",
      competition_id: newCompetition.id,
      enrolled_player: authority,
      details: {
        entry_fee: `${numericValues.entry_fee / 1e9} SOL`,
        prize_pool: `${numericValues.base_amount / 1e9} SOL`,
        start_time: newCompetition.start_time.toISOString(),
        end_time: newCompetition.end_time.toISOString(),
        slots: `${1}/${2}`, // Current players/Max players
      },
    });
  } catch (error) {
    console.error("Versus party creation error:", error);

    // Handle duplicate competition ID
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Competition ID conflict - please retry",
        code: "ID_CONFLICT",
      });
    }

    // General error handling
    res.status(500).json({
      error: "Versus party creation failed",
      systemMessage: error.message,
      code: "INTERNAL_ERROR",
    });
  }
};
