import express from "express";


import { determineWinnerController } from "../controllers/determineWinnerController.js";

const router = express.Router();

router.route("/determineWinner").get(determineWinnerController);

export default router;