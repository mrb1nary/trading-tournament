import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";
dotenv.config();

export const createCompetitionController = async (req, res) => {
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

    // Validation checks
    const missingFields = [];
    if (!authority) missingFields.push("authority");
    if (!entry_fee) missingFields.push("entry_fee");
    if (!base_amount) missingFields.push("base_amount");
    if (!start_time) missingFields.push("start_time");
    if (!end_time) missingFields.push("end_time");
    if (!winning_amount) missingFields.push("winning_amount");
    if (!category) missingFields.push("category");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        code: "MISSING_FIELDS",
      });
    }

    // Numeric validation
    const numericFields = {
      entry_fee: Number(entry_fee),
      base_amount: Number(base_amount),
      start_time: Number(start_time),
      end_time: Number(end_time),
      winning_amount: Number(winning_amount),
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (isNaN(value) || value < 0) {
        return res.status(400).json({
          error: `Invalid value for ${field.replace("_", " ")}`,
          code: "INVALID_NUMERIC_VALUE",
        });
      }
    }

    // Category validation
    const categoryMap = {
      TwoPlayers: 2,
      SixPlayers: 6,
      TwelvePlayers: 12,
      TwentyFivePlayers: 25,
    };

    if (!categoryMap[category]) {
      return res.status(400).json({
        error: "Invalid competition category",
        validCategories: Object.keys(categoryMap),
        code: "INVALID_CATEGORY",
      });
    }

    // Generate competition ID
    const competitionId =
      (Date.now() % 1000000) + Math.floor(Math.random() * 1000);

    // Base competition object
    const competitionData = {
      authority,
      id: competitionId,
      max_players: categoryMap[category],
      entry_fee: numericFields.entry_fee,
      base_amount: numericFields.base_amount,
      start_time: new Date(numericFields.start_time * 1000),
      end_time: new Date(numericFields.end_time * 1000),
      winning_amount: numericFields.winning_amount,
      category,
      active: true,
      payout_claimed: false,
      participants: [],
      current_players: 0,
    };

    // Handle TwoPlayers special case
    if (category === "TwoPlayers") {
      const player = await Player.findOne({
        player_wallet_address: authority,
      })
        .select("_id")
        .lean();

      if (!player) {
        return res.status(404).json({
          error: "Player profile required for versus mode",
          solution: "Complete player registration first",
          code: "PLAYER_NOT_FOUND",
        });
      }

      // Add player reference directly to participants array
      competitionData.participants.push(player._id);
      competitionData.current_players = 1;
    }

    // Create competition
    const newCompetition = await Competition.create(competitionData);

    // Response structure
    const response = {
      success: true,
      competition_id: newCompetition.id,
      details: {
        entry_fee: `${numericFields.entry_fee / 1e9} SOL`,
        prize_pool: `${numericFields.base_amount / 1e9} SOL`,
        duration: `${Math.floor(
          (numericFields.end_time - numericFields.start_time) / 3600
        )} hours`,
        max_players: categoryMap[category],
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Competition creation error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Competition ID collision detected",
        solution: "Retry with new parameters",
        code: "ID_CONFLICT",
      });
    }

    res.status(500).json({
      error: "Competition creation failed",
      systemMessage: error.message,
      code: "INTERNAL_ERROR",
    });
  }
};
