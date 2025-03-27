import express from "express";
import { fetchCompetitionController } from "../controllers/fetchCompetitionsController.js";

const router = express.Router();

router.route("/fetchCompetition").get(fetchCompetitionController);

export default router;
