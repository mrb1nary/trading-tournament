import axios from "axios";
import * as web3 from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

export const determineWinnerController = async (req, res) => {
  res.json({ message: "Hello from determine winner function" });
};
