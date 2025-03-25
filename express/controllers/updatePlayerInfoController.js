import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";

dotenv.config();

export const updatePlayerInfoController = async (req, res) => {
  try {
    // Extract the wallet address from request parameters or body
    const walletAddress =
      req.params.walletAddress || req.body.player_wallet_address;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required to identify the player",
      });
    }

    // Extract only the allowed fields from the request body
    const {
      player_username,
      twitter_handle,
      player_email,
      x_handle,
      // We can also allow updating the wallet address itself if needed
      new_wallet_address,
    } = req.body;

    // Create an object with only the fields that are provided
    const updateFields = {};

    if (player_username !== undefined)
      updateFields.player_username = player_username;
    if (twitter_handle !== undefined)
      updateFields.twitter_handle = twitter_handle;
    if (player_email !== undefined) updateFields.player_email = player_email;
    if (x_handle !== undefined) updateFields.x_handle = x_handle;
    if (new_wallet_address !== undefined)
      updateFields.player_wallet_address = new_wallet_address;

    // If no fields to update, return an error
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Find the player by wallet address and update with the new fields
    const updatedPlayer = await Player.findOneAndUpdate(
      { player_wallet_address: walletAddress },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedPlayer) {
      return res.status(404).json({
        success: false,
        message: "Player not found with the provided wallet address",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Player information updated successfully",
      data: updatedPlayer,
    });
  } catch (error) {
    // Handle validation errors separately
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors (unique constraints)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `The ${field} is already taken`,
      });
    }

    console.error("Error updating player information:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update player information",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};
