import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";
dotenv.config();

export const joinCompetitionController = async (req, res) => {
  try {
    // Extract competition ID and player wallet address from request body
    const { competition_id, wallet_address } = req.body;

    // Validate required fields
    if (!competition_id || !wallet_address) {
      return res.status(400).json({
        error:
          "Missing required fields. Both competition_id and wallet_address are required.",
      });
    }

    // Find the competition by ID
    const competition = await Competition.findOne({ id: competition_id });

    // Check if competition exists
    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Check if competition has already started
    const currentTime = new Date();
    if (currentTime >= competition.start_time) {
      return res
        .status(400)
        .json({ error: "Cannot join. Competition has already started." });
    }

    // Check if competition is full
    if (competition.current_players >= competition.max_players) {
      return res.status(400).json({ error: "Competition is already full" });
    }

    // Check if player exists in the database - using the correct field name
    let player = await Player.findOne({
      player_wallet_address: wallet_address,
    });

    // If player doesn't exist, return a message to sign up first
    if (!player) {
      return res.status(404).json({
        error: "Player not found",
        message:
          "You need to sign up on the platform before joining competitions",
      });
    }

    // Check if player is already in this competition
    const isAlreadyParticipant = competition.participants.some(
      (participant) => participant.toString() === player._id.toString()
    );

    if (isAlreadyParticipant) {
      return res
        .status(400)
        .json({ error: "Player is already registered in this competition" });
    }

    // For TwoPlayers category (versus mode), check for special conditions
    if (competition.category === "TwoPlayers") {
      // Check if the player is trying to compete against themselves
      // Note: We should compare with competition.authority (the creator's wallet address)
      if (competition.authority === wallet_address) {
        return res.status(400).json({
          error: "In versus mode, you cannot join your own competition",
        });
      }
    }

    // Add player to the competition
    competition.participants.push(player._id);
    competition.current_players += 1;
    await competition.save();

    // Check if competition is now full after adding this player
    const competitionFull =
      competition.current_players >= competition.max_players;

    // Return success response
    res.status(200).json({
      message: "Successfully joined the competition",
      competition_id: competition.id,
      current_players: competition.current_players,
      max_players: competition.max_players,
      competition_full: competitionFull,
      category: competition.category,
      start_time: competition.start_time,
      end_time: competition.end_time,
    });
  } catch (error) {
    console.error("Error joining competition:", error);
    res.status(500).json({ error: "Failed to join competition" });
  }
};
