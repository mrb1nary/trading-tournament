import express from "express";

import { createCompetitionController } from "../controllers/createCompetitionController.js";

const router = express.Router();

router.route("/createCompetition").post(createCompetitionController);

export default router;


