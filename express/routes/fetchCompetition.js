import express from "express";
import { fetchCompetitionController } from "../controllers/fetchCompetitionsController.js";

const router = express.Router();

// Handle both parameterized GET and POST requests
router
  .route("/fetchCompetition/:competition_id?")
  .get(fetchCompetitionController)
  .post(fetchCompetitionController);

export default router;
