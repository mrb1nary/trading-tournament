import { Player } from "../models/playerModel.js";
import dotenv from "dotenv";

dotenv.config();


export const updatePlayerInfoController = async (req, res) => {
  try {
    const walletAddress =
      req.params.walletAddress || req.body.player_wallet_address;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Extract updatable fields
    const updateFields = {
      ...(req.body.player_username && {
        player_username: req.body.player_username,
      }),
      ...(req.body.twitter_handle && {
        twitter_handle: req.body.twitter_handle,
      }),
      ...(req.body.tg_username && { tg_username: req.body.tg_username }),
      ...(req.body.player_email && { player_email: req.body.player_email }),
      ...(req.body.new_wallet_address && {
        player_wallet_address: req.body.new_wallet_address,
      }),
    };

    // Validate at least one field provided
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Upsert operation (update or create)
    const updatedPlayer = await Player.findOneAndUpdate(
      { player_wallet_address: walletAddress },
      updateFields,
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true, // Important for required fields
      }
    );

    // For new players, add default values for required fields if missing
    if (!updatedPlayer.player_email) {
      updatedPlayer.player_email = `${walletAddress}@default.com`;
      await updatedPlayer.save();
    }

    return res.status(200).json({
      success: true,
      message: updatedPlayer.$isNew
        ? "Player created successfully"
        : "Player updated successfully",
      data: {
        wallet: updatedPlayer.player_wallet_address,
        username: updatedPlayer.player_username,
        email: updatedPlayer.player_email,
        twitter: updatedPlayer.twitter_handle,
        telegram: updatedPlayer.tg_username,
      },
    });
  } catch (error) {
    // Handle validation errors
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

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let fieldName = field.replace("player_", "");

      // Custom field names for error messages
      const fieldMap = {
        tg_username: "Telegram username",
        twitter_handle: "Twitter handle",
        player_email: "email address",
      };

      return res.status(400).json({
        success: false,
        message: `The ${fieldMap[field] || fieldName} is already registered`,
      });
    }

    // Generic error handling
    console.error("Error updating player information:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update player information",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
