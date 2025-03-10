import express from "express";

import { snapshotController } from "../controllers/snapshotController.js";

const router = express.Router();

router.route("/snapshot").get(snapshotController);

export default router;
