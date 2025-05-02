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
        select: "id start_time end_time category max_players entry_fee winner",
        model: "Competition",
      })
      .select("-__v -createdAt -updatedAt");

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Calculate all stats directly
    const competitionsPlayed = player.competitions_played.filter(
      (cp) => cp.competition
    );
    const totalTrades = competitionsPlayed.reduce(
      (sum, cp) =>
        sum +
        cp.profits.USDC.buys +
        cp.profits.USDC.sells +
        cp.profits.USDT.buys +
        cp.profits.USDT.sells +
        cp.profits.SOL.buys +
        cp.profits.SOL.sells,
      0
    );

    const averagePosition =
      competitionsPlayed.length > 0
        ? competitionsPlayed.reduce((sum, cp) => sum + cp.position, 0) /
          competitionsPlayed.length
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        // Direct player info
        _id: player._id,
        wallet: player.player_wallet_address,
        username: player.player_username,
        email: player.player_email,
        twitter: player.twitter_handle,
        telegram: player.tg_username,

        // Stats
        total_profit: player.total_profit,
        total_points: player.total_points,
        total_competitions: competitionsPlayed.length,
        usdc_profit: competitionsPlayed.reduce(
          (sum, cp) => sum + (cp.profits?.USDC?.net || 0),
          0
        ),
        usdt_profit: competitionsPlayed.reduce(
          (sum, cp) => sum + (cp.profits?.USDT?.net || 0),
          0
        ),
        sol_profit: competitionsPlayed.reduce(
          (sum, cp) => sum + (cp.profits?.SOL?.net || 0),
          0
        ),
        win_rate: player.win_rate,

        // Historical stats
        total_trades: totalTrades,
        average_position: averagePosition,

        // Competitions array (only nested structure)
        competitions: competitionsPlayed.map((cp) => ({
          competition_id: cp.competition.id,
          category: cp.competition.category,
          entry_fee: cp.entry_fee,
          prize_pool: cp.competition.base_amount,
          max_players: cp.competition.max_players,
          position: cp.position,
          profit: cp.profits.total,
          points_earned: cp.points_earned,
          timeframe: {
            start: cp.competition.start_time,
            end: cp.competition.end_time,
          },
          winner: cp.competition.winner,
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
