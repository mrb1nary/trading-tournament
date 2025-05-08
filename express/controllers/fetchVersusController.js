import { Versus } from "../models/versusModel.js";
import { Player } from "../models/playerModel.js";

export const fetchVersusController = async (req, res) => {
  try {
    const { wallet_address } = req.body;

    // Validate input
    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
        code: "MISSING_WALLET_ADDRESS",
      });
    }

    // Find player by wallet address
    const player = await Player.findOne({
      player_wallet_address: wallet_address,
    }).select("_id username");

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
        code: "PLAYER_NOT_FOUND",
      });
    }

    // Find versus games where player is a participant
    const versusGames = await Versus.find({ participants: player._id })
      .populate({
        path: "participants",
        select: "player_username player_wallet_address",
        model: Player,
      })
      .sort({ start_time: 1 })
      .lean();

    // Format response
    const formattedGames = versusGames.map((game) => ({
      versus_id: game.id,
      start_time: game.start_time,
      end_time: game.end_time,
      entry_fee: game.entry_fee,
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
