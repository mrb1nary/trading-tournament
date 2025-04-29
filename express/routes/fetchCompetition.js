import express from "express";
import { fetchCompetitionController } from "../controllers/fetchCompetitionsController.js";

const router = express.Router();

router.route("/fetchCompetition").post(fetchCompetitionController);

export default router;
