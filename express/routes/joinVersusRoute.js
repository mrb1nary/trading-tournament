import express from "express";

import { joinVersusController } from "../controllers/joinVersusController.js";

const router = express.Router();

router.route("/joinVersus").post(joinVersusController);

export default router;
