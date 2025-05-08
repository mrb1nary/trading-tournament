import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";

export const fetchCompetitionController = async (req, res) => {
  try {
    const competition_id = req.params.competition_id || req.body.competition_id;

    // Handle single competition lookup
    if (competition_id) {
      const numericId = parseInt(competition_id, 10);
      const competition = await Competition.findOne({
        id: numericId,
        active: true,
      })
        .populate({
          path: "participants",
          select: "player_wallet_address -_id", // Only return wallet address
          model: Player,
        })
        .populate({
          path: "winner",
          select: "player_wallet_address -_id",
          model: Player,
        })
        .lean();

      if (!competition) {
        return res.status(404).json({
          error: "Competition not found or inactive",
          code: "COMPETITION_NOT_FOUND",
        });
      }

      // Transform participants to array of wallet addresses
      const participants =
        competition.participants?.map((p) => p.player_wallet_address) || [];
      const winner = competition.winner?.player_wallet_address || null;

      return res.status(200).json({
        message: "Competition details retrieved successfully",
        count: 1,
        competitions: [
          {
            ...competition,
            participants,
            winner,
          },
        ],
      });
    }

    // Handle all active competitions case
    const activeCompetitions = await Competition.find({ active: true })
      .populate({
        path: "participants",
        select: "player_wallet_address -_id",
        model: Player,
      })
      .sort({ start_time: 1 })
      .lean();

    // Transform participants in all competitions
    const transformedCompetitions = activeCompetitions.map((c) => ({
      ...c,
      participants: c.participants?.map((p) => p.player_wallet_address) || [],
      winner: c.winner?.player_wallet_address || null,
    }));

    res.status(200).json({
      message: "Active competitions retrieved successfully",
      count: transformedCompetitions.length,
      competitions: transformedCompetitions,
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({
      error: "Failed to fetch competitions",
      details: error.message,
      code: "SERVER_ERROR",
    });
  }
};
