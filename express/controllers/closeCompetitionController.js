import { Competition } from "../models/competitionModel.js";
import dotenv from "dotenv";
dotenv.config();

export const closeCompetitionController = async (req, res) => {
  try {
    const { competition_id } = req.body;

    if (!competition_id) {
      return res.status(400).json({ error: "Competition ID is required" });
    }

    // Atomic update with conditions
    const updatedCompetition = await Competition.findOneAndUpdate(
      {
        id: Number(competition_id),
        payout_claimed: true,
        end_time: { $lte: new Date() }, // Ensure competition has ended
        active: true,
      },
      {
        $set: { active: false },
        $currentDate: { closedAt: true }, // Add audit timestamp
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCompetition) {
      return res.status(404).json({
        error: "Competition not found or doesn't meet closure criteria",
        details:
          "Either payout not claimed, competition still active, or not ended",
      });
    }

    res.status(200).json({
      message: "Competition deactivated successfully",
      competition: updatedCompetition,
    });
  } catch (error) {
    console.error("Error closing competition:", error);
    res.status(500).json({
      error: "Failed to close competition",
      details: error.message,
    });
  }
};
