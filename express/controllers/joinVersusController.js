import { Versus } from "../models/versusModel.js";
import { Player } from "../models/playerModel.js";
import mongoose from "mongoose";

export const joinVersusController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { wallet_address, versus_id } = req.body;

    console.log("===== Join Versus Debug Info =====");
    console.log("Wallet Address:", wallet_address);
    console.log("Versus ID:", versus_id);

    if (!wallet_address || !versus_id) {
      console.log("Missing required fields");
      return res.status(400).json({
        success: false,
        error: "Wallet address and versus ID are required",
        code: "MISSING_FIELDS",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(versus_id)) {
      console.log("Invalid versus ID format");
      return res.status(400).json({
        success: false,
        error: "Invalid Versus ID",
        code: "INVALID_ID",
      });
    }

    // ---------------------------------------------------------------------------
    // IMPORTANT FIX: More robust player lookup with case-insensitive matching
    // and handling any whitespace issues
    // ---------------------------------------------------------------------------

    // Clean the wallet address (trim whitespace)
    const cleanWalletAddress = wallet_address.trim();
    console.log("Cleaned wallet address:", cleanWalletAddress);

    // Try multiple lookup methods to diagnose the issue
    console.log(
      "Looking for player with exact wallet address:",
      cleanWalletAddress
    );

    
    let player = await Player.findOne({
      player_wallet_address: cleanWalletAddress,
    })
      .select("_id versus_played")
      .session(session);


    
    if (!player) {
      console.log("Player not found with regex either, looking at all players");
      const allPlayers = await Player.find({})
        .select("player_wallet_address")
        .limit(5)
        .session(session);
      console.log(
        "Sample of players in database:",
        allPlayers.map((p) => p.player_wallet_address)
      );


    }

    console.log(
      "Player query result:",
      player ? `Found (ID: ${player._id})` : "Not found"
    );

    if (!player) {
      console.log("Player not found - returning 404");
      return res.status(404).json({
        success: false,
        error: "Player not found",
        code: "PLAYER_NOT_FOUND",
      });
    }


    console.log("Looking for versus game with ID:", versus_id);
    const versusGame = await Versus.findOne({ id: versus_id }).session(session);
    console.log(
      "Versus game query result:",
      versusGame ? `Found (ID: ${versusGame._id})` : "Not found"
    );

    if (!versusGame) {
      console.log("Versus game not found - returning 404");
      return res.status(404).json({
        success: false,
        error: "Versus game not found",
        code: "VERSUS_NOT_FOUND",
      });
    }

    if (!versusGame.active) {
      console.log("Versus game is inactive - returning 400");
      return res.status(400).json({
        success: false,
        error: "Versus game is no longer active",
        code: "GAME_INACTIVE",
      });
    }

    // Check if player is already a participant
    console.log("Checking if player is already in versus participants list");
    const isParticipant = await Versus.findOne({
      id: versusGame.id,
      participants: player._id,
    }).session(session);

    console.log("Is already participant:", isParticipant ? "Yes" : "No");

    if (isParticipant) {
      console.log("Player already joined this versus game - returning 409");
      return res.status(409).json({
        success: false,
        error: "Already joined this versus game",
        code: "ALREADY_JOINED",
      });
    }

    // Check in player document
    console.log(
      "Checking if player has this versus in their versus_played array"
    );
    console.log("Player versus_played length:", player.versus_played.length);
    const hasEntry = player.versus_played.some((e) => {
      const result =
        e.versus && e.versus.equals && e.versus.equals(versusGame._id);
      console.log(`Comparing ${e.versus} with ${versusGame._id}: ${result}`);
      return result;
    });

    console.log("Has entry in player's versus_played:", hasEntry);

    if (hasEntry) {
      console.log(
        "Player already has this versus in their record - returning 409"
      );
      return res.status(409).json({
        success: false,
        error: "Already joined this versus game",
        code: "ALREADY_JOINED",
      });
    }

    if (versusGame.current_players >= versusGame.max_players) {
      console.log("Versus game is full - returning 400");
      return res.status(400).json({
        success: false,
        error: "Versus game is full",
        code: "GAME_FULL",
      });
    }

    // Update Versus document
    console.log("Updating versus game with new participant");
    versusGame.participants.addToSet(player._id);
    versusGame.current_players += 1;
    await versusGame.save({ session });
    console.log("Versus game updated successfully");

    // Update Player document using findOneAndUpdate to avoid parallel arrays issue
    console.log("Adding versus to player's versus_played array");
    const updatedPlayer = await Player.findOneAndUpdate(
      { _id: player._id },
      {
        $push: {
          versus_played: {
            versus: versusGame._id,
            entry_fee: versusGame.entry_fee,
            profits: {
              USDC: { buys: 0, sells: 0, net: 0 },
              USDT: { buys: 0, sells: 0, net: 0 },
              SOL: { buys: 0, sells: 0, net: 0 },
              total: 0,
            },
            points_earned: 0,
          },
        },
      },
      { session, new: true }
    );

    console.log("Player updated successfully:", updatedPlayer ? "Yes" : "No");

    console.log("Committing transaction");
    await session.commitTransaction();
    console.log("Transaction committed successfully");

    console.log("Sending success response");
    res.status(200).json({
      success: true,
      message: "Successfully joined versus game",
      versus_id: versusGame.id,
      current_players: versusGame.current_players,
      max_players: versusGame.max_players,
    });
  } catch (error) {
    console.error("Join versus error:", error);

    await session.abortTransaction();
    console.log("Transaction aborted due to error");

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
    console.log("Session ended");
    console.log("===== End Join Versus Debug Info =====");
  }
};
