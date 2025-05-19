import { Versus } from "../models/versusModel.js";
import { Player } from "../models/playerModel.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
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
    } = req.body;

    // Convert timestamps from milliseconds to seconds (if needed)
    const convertTimestamp = (val) => {
      const timestamp = Number(val);
      return timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
    };

    // Process values with proper unit conversions
    const processedValues = {
      entry_fee: Number(entry_fee) / LAMPORTS_PER_SOL,
      base_amount: Number(base_amount) / 1e6, // USDT has 6 decimals
      winning_amount: Number(winning_amount) / LAMPORTS_PER_SOL,
      start_time: convertTimestamp(start_time),
      end_time: convertTimestamp(end_time),
    };

    // Convert to Date objects with proper handling
    const startDate = new Date(processedValues.start_time * 1000);
    const endDate = new Date(processedValues.end_time * 1000);

    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({
        error: "End time must be after start time",
        code: "INVALID_TIME_RANGE",
      });
    }

    // Additional date validation
    const currentYear = new Date().getFullYear();
    if (
      startDate.getFullYear() < currentYear - 1 ||
      endDate.getFullYear() > currentYear + 1
    ) {
      return res.status(400).json({
        error: "Invalid date range",
        code: "INVALID_DATE_RANGE",
      });
    }

    // Find or create player
    let player = await Player.findOne({ player_wallet_address: authority });

    if (!player) {
      const cleanAddress = authority.replace(/[^a-zA-Z0-9]/g, "");
      const shortAddress = cleanAddress.substring(0, 8);
      const timestamp = Date.now().toString().slice(-5);
      const randomUsername = `plr${shortAddress}${timestamp}`.substring(0, 20);
      const tempEmail = `${randomUsername}@temp.com`;

      try {
        player = await Player.create({
          player_wallet_address: authority,
          player_username: randomUsername,
          player_email: tempEmail,
        });
      } catch (playerError) {
        return res.status(400).json({
          error: "Failed to create player profile",
          code: "PLAYER_CREATION_FAILED",
        });
      }
    }

    // Generate unique versus ID
    let versusId;
    let attempts = 0;
    do {
      versusId = Math.floor(100000 + Math.random() * 900000);
      attempts++;
      if (attempts > 5) throw new Error("Failed to generate unique versus ID");
    } while (await Versus.exists({ id: versusId }));

    // Create versus game with proper values
    const newVersus = await Versus.create({
      authority,
      id: versusId,
      max_players: 2,
      entry_fee: processedValues.entry_fee,
      base_amount: processedValues.base_amount,
      start_time: startDate,
      end_time: endDate,
      winning_amount: processedValues.winning_amount,
      participants: [player._id],
      current_players: 1,
      active: true,
    });

    // Format response with human-readable values
    res.status(201).json({
      success: true,
      versus_id: versusId,
      game_code: versusId.toString().padStart(6, "0"),
      details: {
        entry_fee: `${processedValues.entry_fee.toFixed(9)} SOL`,
        base_amount: `${processedValues.base_amount.toFixed(6)} USDT`,
        prize_pool: `${processedValues.winning_amount.toFixed(9)} SOL`,
        timeframe: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        players: `${1}/2`,
      },
      player_auto_registered: !player.createdAt,
    });
  } catch (error) {
    console.error("Versus creation error:", error);
    const response = {
      error: "Failed to create versus game",
      code: "CREATION_FAILED",
    };

    if (error.code === 11000) {
      response.error = "Duplicate game ID - please try again";
      response.code = "ID_CONFLICT";
    }

    if (process.env.NODE_ENV === "development") {
      response.debug = error.message;
    }

    res.status(error.code === 11000 ? 409 : 500).json(response);
  }
};
