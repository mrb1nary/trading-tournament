import { Versus } from "../models/versusModel.js";
import { Player } from "../models/playerModel.js";

export const fetchVersusController = async (req, res) => {
  try {
    const { versus_id, wallet_address } = req.body;

    // Case 1: Both versus_id and wallet_address provided
    if (versus_id && wallet_address) {
      // First find the player by wallet address
      const player = await Player.findOne({
        player_wallet_address: wallet_address,
      }).select("_id");

      if (!player) {
        return res.status(404).json({
          success: false,
          message: "Player not found",
          code: "PLAYER_NOT_FOUND",
        });
      }

      // Then find the versus game and check if player is a participant
      const versusGame = await Versus.findOne({
        id: versus_id,
        participants: player._id,
      })
        .populate({
          path: "participants",
          select: "player_username player_wallet_address",
          model: Player,
        })
        .lean();

      if (!versusGame) {
        return res.status(404).json({
          success: false,
          message: "Versus game not found or player is not a participant",
          code: "VERSUS_NOT_FOUND_OR_NOT_PARTICIPANT",
        });
      }

      const formattedGame = {
        versus_id: versusGame.id,
        start_time: versusGame.start_time,
        end_time: versusGame.end_time,
        entry_fee: versusGame.entry_fee,
        base_amount: versusGame.base_amount, // Added base_amount
        prize_pool: versusGame.winning_amount,
        participants: versusGame.participants.map((p) => ({
          username: p.player_username,
          wallet: p.player_wallet_address,
        })),
        status: versusGame.active ? "active" : "ended",
        winner: versusGame.winner || null,
      };

      return res.status(200).json({
        success: true,
        count: 1,
        data: [formattedGame],
      });
    }

    // Case 2: Only wallet_address provided
    if (wallet_address) {
      // Find the player by wallet address
      const player = await Player.findOne({
        player_wallet_address: wallet_address,
      }).select("_id");

      if (!player) {
        return res.status(404).json({
          success: false,
          message: "Player not found",
          code: "PLAYER_NOT_FOUND",
        });
      }

      // Find all versus games where player is a participant
      const versusGames = await Versus.find({
        participants: player._id,
      })
        .populate({
          path: "participants",
          select: "player_username player_wallet_address",
          model: Player,
        })
        .sort({ start_time: 1 })
        .lean();

      const formattedGames = versusGames.map((game) => ({
        versus_id: game.id,
        start_time: game.start_time,
        end_time: game.end_time,
        entry_fee: game.entry_fee,
        base_amount: game.base_amount, // Added base_amount
        prize_pool: game.winning_amount,
        participants: game.participants.map((p) => ({
          username: p.player_username,
          wallet: p.player_wallet_address,
        })),
        status: game.active ? "active" : "ended",
        winner: game.winner || null,
      }));

      return res.status(200).json({
        success: true,
        count: formattedGames.length,
        data: formattedGames,
      });
    }

    // Case 3: Only versus_id provided
    if (versus_id) {
      const versusGame = await Versus.findOne({ id: versus_id })
        .populate({
          path: "participants",
          select: "player_username player_wallet_address",
          model: Player,
        })
        .lean();

      if (!versusGame) {
        return res.status(404).json({
          success: false,
          message: "Versus game not found",
          code: "VERSUS_NOT_FOUND",
        });
      }

      const formattedGame = {
        versus_id: versusGame.id,
        start_time: versusGame.start_time,
        end_time: versusGame.end_time,
        entry_fee: versusGame.entry_fee,
        base_amount: versusGame.base_amount, // Added base_amount
        prize_pool: versusGame.winning_amount,
        participants: versusGame.participants.map((p) => ({
          username: p.player_username,
          wallet: p.player_wallet_address,
        })),
        status: versusGame.active ? "active" : "ended",
        winner: versusGame.winner || null,
      };

      return res.status(200).json({
        success: true,
        count: 1,
        data: [formattedGame],
      });
    }

    // Case 4: Neither versus_id nor wallet_address provided
    const versusGames = await Versus.find({})
      .populate({
        path: "participants",
        select: "player_username player_wallet_address",
        model: Player,
      })
      .sort({ start_time: 1 })
      .lean();

    const formattedGames = versusGames.map((game) => ({
      versus_id: game.id,
      start_time: game.start_time,
      end_time: game.end_time,
      entry_fee: game.entry_fee,
      base_amount: game.base_amount, // Added base_amount
      prize_pool: game.winning_amount,
      participants: game.participants.map((p) => ({
        username: p.player_username,
        wallet: p.player_wallet_address,
      })),
      status: game.active ? "active" : "ended",
      winner: game.winner || null,
    }));

    return res.status(200).json({
      success: true,
      count: formattedGames.length,
      data: formattedGames,
    });
  } catch (error) {
    console.error("Error fetching versus games:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
