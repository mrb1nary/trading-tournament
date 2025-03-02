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
    }); // Explicitly query by 'id'
    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Check if the competition has space for more players
    if (competition.current_players >= competition.max_players) {
      return res.status(400).json({ error: "Competition is already full" });
    }

    // Fetch Player by wallet address
    const player = await Player.findOne({ player_wallet_address });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Check if Player is already registered
    const isAlreadyRegistered = competition.participants.some(
      (participantId) => participantId.toString() === player._id.toString()
    );
    if (isAlreadyRegistered) {
      return res
        .status(400)
        .json({ error: "Player is already registered in this competition" });
    }

    // Register Player
    competition.participants.push(player._id);
    competition.current_players += 1;
    await competition.save();

    res.status(200).json({
      message: "Player successfully registered in the competition",
      player,
      competition,
    });
  } catch (error) {
    console.error("Error registering player in competition:", error);
    res
      .status(500)
      .json({
        error: "Failed to register player in competition",
        details: error.message,
      });
  }
};
