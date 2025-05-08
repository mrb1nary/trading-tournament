import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";
dotenv.config();

export const joinCompetitionController = async (req, res) => {
  try {
    const { competition_id, wallet_address } = req.body;

    // Validate input
    if (!competition_id || !wallet_address) {
      return res.status(400).json({
        error: "Missing required fields: competition_id and wallet_address",
        code: "MISSING_FIELDS",
      });
    }

    // Find competition with populated participants
    const competition = await Competition.findOne({
      id: competition_id,
    }).populate({
      path: "participants",
      select: "player_wallet_address",
    });

    if (!competition) {
      return res.status(404).json({
        error: "Competition not found",
        code: "COMPETITION_NOT_FOUND",
      });
    }

    // Competition status checks
    const now = new Date();
    if (now >= competition.start_time) {
      return res.status(400).json({
        error: "Competition has already started",
        code: "COMPETITION_STARTED",
      });
    }

    if (competition.current_players >= competition.max_players) {
      return res.status(400).json({
        error: "Competition is full",
        code: "COMPETITION_FULL",
      });
    }

    // Player verification
    const player = await Player.findOne({
      player_wallet_address: wallet_address,
    });
    if (!player) {
      return res.status(404).json({
        error: "Player not registered",
        code: "PLAYER_NOT_FOUND",
        message: "Complete registration before joining competitions",
      });
    }

    // Check existing participation using wallet address
    const hasJoined = competition.participants.some(
      (p) => p.player_wallet_address === wallet_address
    );

    if (hasJoined) {
      return res.status(409).json({
        error: "Already joined competition",
        code: "ALREADY_JOINED",
        message: "You have already joined this competition.",
      });
    }

    // Versus mode validation
    if (
      competition.category === "TwoPlayers" &&
      competition.authority === wallet_address
    ) {
      return res.status(400).json({
        error: "Cannot compete against yourself",
        code: "SELF_COMPETITION",
      });
    }

    // Add participant (only player ID as per schema)
    competition.participants.push(player._id);
    competition.current_players += 1;

    await competition.save();

    return res.status(200).json({
      success: true,
      data: {
        competition_id: competition.id,
        current_players: competition.current_players,
        max_players: competition.max_players,
        is_full: competition.current_players >= competition.max_players,
        start_time: competition.start_time,
      },
    });
  } catch (error) {
    console.error("Join competition error:", error);
    return res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
