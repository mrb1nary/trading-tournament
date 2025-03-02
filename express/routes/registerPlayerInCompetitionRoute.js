import express from "express";

import { registerPlayerInCompetitionController } from "../controllers/registerPlayerInCompetitionController.js";

const router = express.Router();

router.route("/registerPlayer").post(registerPlayerInCompetitionController);

export default router;
