import express from "express";

import { snapshotController } from "../controllers/snapshotController.js";

const router = express.Router();

router.route("/snapshot").post(snapshotController);

export default router;
