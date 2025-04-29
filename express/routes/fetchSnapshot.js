import express from "express";

import { fetchSnapshotController } from "../controllers/fetchSnapshotController.js";
const router = express.Router();

router.route("/fetchSnapshot").get(fetchSnapshotController);

export default router;
