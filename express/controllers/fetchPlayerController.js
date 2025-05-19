import { Player } from "../models/playerModel.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

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
        select:
          "id start_time end_time category max_players entry_fee winner base_amount",
        model: "Competition",
      })
      .select("-__v -createdAt -updatedAt")
      .lean();

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Add fallback for undefined competitions_played
    const validCompetitions = (player.competitions_played || []).filter(
      (cp) => cp.competition && cp.competition._id
    );

    // Helper function for currency formatting
    const formatCurrency = (value, decimals) =>
      parseFloat(value.toFixed(decimals));

    // Calculate statistics using validCompetitions
    const stats = {
      totalTrades: validCompetitions.reduce(
        (sum, cp) =>
          sum +
          (cp.profits?.USDC?.buys || 0) +
          (cp.profits?.USDC?.sells || 0) +
          (cp.profits?.USDT?.buys || 0) +
          (cp.profits?.USDT?.sells || 0) +
          (cp.profits?.SOL?.buys || 0) +
          (cp.profits?.SOL?.sells || 0),
        0
      ),

      averagePosition:
        validCompetitions.length > 0
          ? formatCurrency(
              validCompetitions.reduce((sum, cp) => sum + cp.position, 0) /
                validCompetitions.length,
              2
            )
          : 0,

      winRate:
        validCompetitions.length > 0
          ? formatCurrency(
              (validCompetitions.filter((cp) => cp.position === 1).length /
                validCompetitions.length) *
                100,
              2
            )
          : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        _id: player._id.toString(),
        wallet: player.player_wallet_address,
        username: player.player_username,
        email: player.player_email,
        twitter: player.twitter_handle,
        telegram: player.tg_username,

        total_profit: formatCurrency(player.total_profit || 0, 2),
        total_points: player.total_points || 0,
        total_competitions: validCompetitions.length,
        usdc_profit: formatCurrency(
          validCompetitions.reduce(
            (sum, cp) => sum + (cp.profits?.USDC?.net || 0),
            0
          ),
          2
        ),
        usdt_profit: formatCurrency(
          validCompetitions.reduce(
            (sum, cp) => sum + (cp.profits?.USDT?.net || 0),
            0
          ),
          2
        ),
        sol_profit: formatCurrency(
          validCompetitions.reduce(
            (sum, cp) => sum + (cp.profits?.SOL?.net || 0),
            0
          ),
          9
        ),
        win_rate: stats.winRate,

        total_trades: stats.totalTrades,
        average_position: stats.averagePosition,

        competitions: validCompetitions.map((cp) => ({
          competition_id: cp.competition.id,
          category: cp.competition.category,
          entry_fee: formatCurrency((cp.entry_fee || 0) / LAMPORTS_PER_SOL, 9),
          prize_pool: formatCurrency(
            (cp.competition.base_amount || 0) / LAMPORTS_PER_SOL,
            9
          ),
          max_players: cp.competition.max_players,
          position: cp.position,
          profit: formatCurrency(cp.profits?.total || 0, 2),
          points_earned: cp.points_earned || 0,
          timeframe: {
            start: cp.competition.start_time?.toISOString(),
            end: cp.competition.end_time?.toISOString(),
          },
          winner: cp.competition.winner?.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
        stack: error.stack,
      }),
    });
  }
};
