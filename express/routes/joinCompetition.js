import express from "express";

import { joinCompetitionController } from "../controllers/joinCompetitionController.js";

const router = express.Router();

router.route("/joinCompetition").post(joinCompetitionController);

export default router;
