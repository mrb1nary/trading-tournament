import express from "express";
import fetchTxRouter from "./routes/fetchTx.js";

const app = express();

app.use("/api", fetchTxRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
