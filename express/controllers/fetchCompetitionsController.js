import { Competition } from "../models/competitionModel.js";

export const fetchCompetitionController = async (req, res) => {
  try {
    const { competition_id } = req.body;

    // Handle single competition lookup
    if (competition_id) {
      // Validate competition ID format
      if (!/^\d{6,7}$/.test(competition_id.toString())) {
        return res.status(400).json({
          error: "Invalid competition ID format - must be 6-7 numerical digits",
          code: "INVALID_ID_FORMAT",
        });
      }

      const numericId = parseInt(competition_id, 10);
      const competition = await Competition.findOne({
        id: numericId,
        active: true,
      });

      if (!competition) {
        return res.status(404).json({
          error: "Competition not found or inactive",
          code: "COMPETITION_NOT_FOUND",
        });
      }

      return res.status(200).json({
        message: "Competition details retrieved successfully",
        count: 1,
        competitions: [competition],
      });
    }

    // Handle all active competitions case
    const activeCompetitions = await Competition.find({ active: true }).sort({
      start_time: 1,
    });

    res.status(200).json({
      message: "Active competitions retrieved successfully",
      count: activeCompetitions.length,
      competitions: activeCompetitions,
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({
      error: "Failed to fetch competitions",
      details: error.message,
      code: "SERVER_ERROR",
    });
  }
};
