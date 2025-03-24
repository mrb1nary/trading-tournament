import { Player } from "../models/playerModel.js";

export const fetchPlayerController = async (req, res) => {
  try {
    const { address } = req.params;

    // Validate if address is provided
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Find player by wallet address
    const player = await Player.findOne({
      player_wallet_address: address,
    }).populate("competitions_played");

    // If player not found
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found with the provided wallet address",
      });
    }

    // Return player details
    return res.status(200).json({
      data: player,
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching player details",
      error: error.message,
    });
  }
};
