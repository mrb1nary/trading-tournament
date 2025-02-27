import express from "express";


import {fetchTx} from "../controllers/fetchTxController.js";

const router = express.Router();

router.route("/fetchTx/:address").get(fetchTx);

export default router;
