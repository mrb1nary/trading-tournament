import express from "express";

import { signupPlayerController } from "../controllers/signupPlayerController.js";

const router = express.Router();

router.route("/signupPlayer").post(signupPlayerController);

export default router;
