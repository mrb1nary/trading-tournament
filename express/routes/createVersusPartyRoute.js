import express from "express";
import cors from "cors"; 
import { createVersusPartyController } from "../controllers/createVersusParty.js";

const router = express.Router();

router.options("/createVersusParty", cors());
router.route("/createVersusParty").post(createVersusPartyController);

export default router;
