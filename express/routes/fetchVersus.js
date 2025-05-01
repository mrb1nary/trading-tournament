import express from "express";

import { fetchVersusController } from "../controllers/fetchVersusParty.js";

const router = express.Router();

router.route("/fetchVersus").post(fetchVersusController);

export default router;
