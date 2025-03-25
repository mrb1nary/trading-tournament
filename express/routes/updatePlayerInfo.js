import express from "express";

import { updatePlayerInfoController } from "../controllers/updatePlayerInfoController.js";

const router = express.Router();

router.route("/updatePlayerInfo").post(updatePlayerInfoController);

export default router;
