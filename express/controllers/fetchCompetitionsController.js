import { Competition } from "../models/competitionModel.js";


export const fetchCompetitionController = async (req, res) => {
  try {
    const activeCompetitions = await Competition.find({ active: true }).sort({
      start_time: 1,
    });

    if (activeCompetitions.length === 0) {
      return res.status(404).json({
        message: "No active competitions found",
        competitions: [],
      });
    }

    res.status(200).json({
      message: "Active competitions retrieved successfully",
      count: activeCompetitions.length,
      competitions: activeCompetitions,
    });
  } catch (error) {
    console.error("Error fetching active competitions:", error);
    res.status(500).json({
      error: "Failed to fetch active competitions",
      details: error.message,
    });
  }
};
