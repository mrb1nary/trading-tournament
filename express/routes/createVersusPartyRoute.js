import express from "express";

import { createVersusPartyController } from "../controllers/createVersusParty.js";

const router = express.Router();

router.route("/createVersusParty").post(createVersusPartyController);

export default router;
