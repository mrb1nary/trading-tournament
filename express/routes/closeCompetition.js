import express from "express";

import { closeCompetitionController } from "../controllers/closeCompetitionController.js";

const router = express.Router();

router.route("/closeCompetition").post(closeCompetitionController);

export default router;
