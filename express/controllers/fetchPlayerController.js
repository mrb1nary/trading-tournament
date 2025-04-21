import { Player } from "../models/playerModel.js";

export const fetchPlayerController = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const player = await Player.findOne({ player_wallet_address: address })
      .populate({
        path: "competitions_played.competition",
        select: "id start_time end_time category", // Only expose necessary competition details
        model: "Competition",
      })
      .select("-__v -createdAt -updatedAt"); // Remove internal fields

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Calculate lifetime stats
    const stats = {
      total_profit: player.total_profit,
      total_competitions: player.competitions_played.length,
      usdc_profit: player.competitions_played.reduce(
        (sum, cp) => sum + cp.profits.USDC.net,
        0
      ),
      usdt_profit: player.competitions_played.reduce(
        (sum, cp) => sum + cp.profits.USDT.net,
        0
      ),
      win_rate: player.win_rate, // From virtual
    };

    return res.status(200).json({
      success: true,
      data: {
        wallet: player.player_wallet_address,
        username: player.player_username,
        stats,
        competitions: player.competitions_played.map((cp) => ({
          competition_id: cp.competition.id,
          entry_fee: cp.entry_fee,
          profit: cp.profits.total,
          position: cp.position,
          timeframe: {
            start: cp.competition.start_time,
            end: cp.competition.end_time,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

