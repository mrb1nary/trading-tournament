import { Competition } from "../models/competitionModel.js";
import dotenv from "dotenv";
dotenv.config();

export const closeCompetitionController = async (req, res) => {
  try {
    // Extract competition ID from request body
    const { competition_id } = req.body;

    // Validate competition ID
    if (!competition_id) {
      return res.status(400).json({ error: "Competition ID is required" });
    }

    // Fetch the competition details
    const competition = await Competition.findOne({
      id: Number(competition_id),
    });

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Check if the payout has been claimed
    if (!competition.payout_claimed) {
      return res.status(400).json({
        error: "Cannot close competition. Payout has not been claimed yet.",
      });
    }

    // Mark the competition as closed by deleting it or updating its status
    await Competition.deleteOne({ id: Number(competition_id) });

    // Respond with success message
    res.status(200).json({
      message: "Competition closed successfully.",
      competition_id,
    });
  } catch (error) {
    console.error("Error closing competition:", error);
    res.status(500).json({
      error: "Failed to close competition",
      details: error.message,
    });
  }
};
