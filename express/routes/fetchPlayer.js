import express from "express";

import { fetchPlayerController } from "../controllers/fetchPlayerController.js";

const router = express.Router();

router.route("/fetchPlayer/:address").get(fetchPlayerController);

export default router;
