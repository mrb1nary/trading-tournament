import { Versus } from "../models/versusModel.js";
import { Player } from "../models/playerModel.js";

export const fetchVersusController = async (req, res) => {
  try {
    const { wallet_address } = req.body;

    // If no wallet address is provided, fetch all versus competitions
    if (!wallet_address) {
      const versusCompetitions = await Versus.find()
        .sort({ start_time: -1 }) // Sort by start time, newest first
        .populate("participants", "player_username player_wallet_address");

      return res.status(200).json({
        success: true,
        count: versusCompetitions.length,
        versus: versusCompetitions,
      });
    }

    // If wallet address is provided, first find the player
    const player = await Player.findOne({
      player_wallet_address: wallet_address,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found with the provided wallet address",
        code: "PLAYER_NOT_FOUND",
      });
    }

    // Find versus competitions where this player is a participant
    const versusCompetitions = await Versus.find({ participants: player._id })
      .sort({ start_time: -1 })
      .populate("participants", "player_username player_wallet_address");

    return res.status(200).json({
      success: true,
      count: versusCompetitions.length,
      versus: versusCompetitions,
    });
  } catch (error) {
    console.error("Error fetching versus competitions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch versus competitions",
      error: error.message,
      code: "INTERNAL_ERROR",
    });
  }
};
