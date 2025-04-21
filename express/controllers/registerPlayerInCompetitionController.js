import { Player } from "../models/playerModel.js";
import { Competition } from "../models/competitionModel.js";

export const registerPlayerInCompetitionController = async (req, res) => {
  try {
    const { competition_id, player_wallet_address } = req.body;

    // Validate required fields
    if (!competition_id || !player_wallet_address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch Competition by custom 'id' field
    const competition = await Competition.findOne({
      id: Number(competition_id),
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Check competition capacity
    if (competition.current_players >= competition.max_players) {
      return res.status(400).json({ error: "Competition is already full" });
    }

    // Find player by wallet address
    const player = await Player.findOne({ player_wallet_address });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Check existing registration
    const isAlreadyRegistered = competition.participants.some((participantId) =>
      participantId.equals(player._id)
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({ error: "Player already registered" });
    }

    // Transaction-like operations (would be better with actual MongoDB transactions)
    try {
      // Add player to competition
      competition.participants.push(player._id);
      competition.current_players += 1;
      await competition.save();

      // Add competition to player's history
      await Player.findByIdAndUpdate(
        player._id,
        {
          $push: {
            competitions_played: {
              competition: competition._id,
              entry_fee: competition.entry_fee,
              profit: 0,
              points_earned: 0,
            },
          },
        },
        { new: true }
      );
    } catch (updateError) {
      // Rollback competition registration if player update fails
      competition.participants.pull(player._id);
      competition.current_players -= 1;
      await competition.save();
      throw updateError;
    }

    res.status(200).json({
      message: "Player registered successfully",
      player: {
        _id: player._id,
        wallet: player.player_wallet_address,
        username: player.player_username,
      },
      competition: {
        id: competition.id,
        title: competition.title,
        current_players: competition.current_players,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      details: error.message,
      code: error.code || "INTERNAL_ERROR",
    });
  }
};
