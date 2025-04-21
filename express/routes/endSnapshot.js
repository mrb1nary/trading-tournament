import express from "express";

import { endSnapshotController } from "../controllers/endSnapshotController.js";

const router = express.Router();

router.route("/endSnapshot").get(endSnapshotController);

export default router;
