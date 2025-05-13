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
      custom_entry_fee,
      custom_base_amount,
    } = req.body;

    // Convert from lamports/base units to proper decimals
    const convertUnits = {
      entry_fee: (val) => Number(val) / LAMPORTS_PER_SOL,
      base_amount: (val) => Number(val) / 1000000, // USDT has 6 decimals
      winning_amount: (val) => Number(val) / LAMPORTS_PER_SOL,
    };

    // Process values with unit conversion
    const processedValues = {
      entry_fee: convertUnits.entry_fee(custom_entry_fee ?? entry_fee),
      base_amount: convertUnits.base_amount(custom_base_amount ?? base_amount),
      winning_amount: convertUnits.winning_amount(winning_amount),
      start_time: Number(start_time),
      end_time: Number(end_time),
    };

    // Validate numeric ranges after conversion
    const validations = [
      {
        check:
          processedValues.entry_fee < 0.01 || processedValues.entry_fee > 100,
        error: "Entry fee must be between 0.01 and 100 SOL",
        code: "INVALID_ENTRY_FEE",
      },
      {
        check:
          processedValues.base_amount < 10 ||
          processedValues.base_amount > 10000,
        error: "Base amount must be between 10 and 10,000 USDT",
        code: "INVALID_BASE_AMOUNT",
      },
      {
        check:
          processedValues.winning_amount < 0.01 ||
          processedValues.winning_amount > 100000,
        error: "Winning amount must be between 0.01 and 100,000 SOL",
        code: "INVALID_WINNING_AMOUNT",
      },
    ];

    for (const validation of validations) {
      if (validation.check) {
        return res.status(400).json({
          error: validation.error,
          code: validation.code,
        });
      }
    }

    // Convert timestamps
    const startDate = new Date(processedValues.start_time);
    const endDate = new Date(processedValues.end_time);

    // Time validation
    if (startDate >= endDate) {
      return res.status(400).json({
        error: "End time must be after start time",
        code: "INVALID_TIME_RANGE",
      });
    }

    // Find or create player
    let player = await Player.findOne({ player_wallet_address: authority });

    if (!player) {
      // Generate a unique username based on wallet address
      const shortAddress = authority.substring(0, 8);
      const timestamp = Date.now().toString().substring(8);
      const randomUsername = `player_${shortAddress}_${timestamp}`;

      // Generate a temporary email
      const tempEmail = `${randomUsername}@temporary.com`;

      try {
        // Create a new player with default values
        player = await Player.create({
          player_wallet_address: authority,
          player_username: randomUsername,
          player_email: tempEmail,
          // Other fields will use their default values
        });

        console.log(`Auto-registered new player with wallet: ${authority}`);
      } catch (playerError) {
        console.error("Failed to auto-register player:", playerError);
        return res.status(500).json({
          error: "Failed to auto-register player",
          code: "PLAYER_REGISTRATION_FAILED",
          details:
            process.env.NODE_ENV === "development"
              ? playerError.message
              : undefined,
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
      participants: [player._id], // Storing Player reference
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
      player_auto_registered: player && !player.createdAt, // Indicate if player was auto-registered
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
