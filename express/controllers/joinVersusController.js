import { Versus } from "../models/versusModel.js";
import { Player } from "../models/playerModel.js";
import mongoose from "mongoose";

export const joinVersusController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { wallet_address, versus_id } = req.body;

    // Validate input
    if (!wallet_address || !versus_id) {
      return res.status(400).json({
        success: false,
        error: "Wallet address and versus ID are required",
        code: "MISSING_FIELDS",
      });
    }

    // Find player with versus_played data
    const player = await Player.findOne({
      player_wallet_address: wallet_address,
    })
      .select("_id versus_played")
      .session(session);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: "Player not found",
        code: "PLAYER_NOT_FOUND",
      });
    }

    // Find versus game
    const versusGame = await Versus.findOne({ id: versus_id }).session(session);

    if (!versusGame) {
      return res.status(404).json({
        success: false,
        error: "Versus game not found",
        code: "VERSUS_NOT_FOUND",
      });
    }

    // Game status checks
    const now = new Date();
    // if (now >= versusGame.end_time) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "Versus game has already ended",
    //     code: "GAME_ENDED",
    //   });
    // }

    if (!versusGame.active) {
      return res.status(400).json({
        success: false,
        error: "Versus game is no longer active",
        code: "GAME_INACTIVE",
      });
    }

    // Check existing participation
    const isParticipant = versusGame.participants.some((p) =>
      p.equals(player._id)
    );
    const hasEntry = player.versus_played.some((e) =>
      e.versus.equals(versusGame._id)
    );

    if (isParticipant || hasEntry) {
      return res.status(409).json({
        success: false,
        error: "Already joined this versus game",
        code: "ALREADY_JOINED",
      });
    }

    // Check available slots
    if (versusGame.current_players >= versusGame.max_players) {
      return res.status(400).json({
        success: false,
        error: "Versus game is full",
        code: "GAME_FULL",
      });
    }

    // Update versus game
    versusGame.participants.push(player._id);
    versusGame.current_players += 1;
    await versusGame.save({ session });

    // Update player record
    player.versus_played.push({
      versus: versusGame._id,
      entry_fee: versusGame.entry_fee,
      profits: { USDC: {}, USDT: {}, SOL: {}, total: 0 },
      points_earned: 0,
      position: null,
    });
    await player.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Successfully joined versus game",
      versus_id: versusGame.id,
      current_players: versusGame.current_players,
      max_players: versusGame.max_players,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Join versus error:", error);

    const response = {
      success: false,
      error: "Failed to join versus game",
      code: "JOIN_FAILED",
    };

    if (error.code === 11000) {
      response.error = "Duplicate entry detected";
      response.code = "DUPLICATE_ENTRY";
    }

    if (process.env.NODE_ENV === "development") {
      response.details = error.message;
    }

    res.status(error.code === 11000 ? 409 : 500).json(response);
  } finally {
    session.endSession();
  }
};
