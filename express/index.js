import express from "express";
import fetchTxRouter from "./routes/fetchTx.js";
import determineWinnerRouter from "./routes/determineWinner.js";
import createCompetitionRouter from "./routes/createCompetition.js";
import joinCompetitionRouter from "./routes/joinCompetition.js";
import closeCompetitionRouter from "./routes/closeCompetition.js";
import signupPlayerRoute from "./routes/signupPlayer.js";
import registerPlayerRoute from "./routes/registerPlayerInCompetitionRoute.js"
import { dbConnect } from "./config/dbConfig.js";

const app = express();
dbConnect();
app.use(express.json());
app.use("/api", fetchTxRouter);
app.use("/api", determineWinnerRouter);
app.use("/api", createCompetitionRouter);
app.use("/api", joinCompetitionRouter);
app.use("/api", closeCompetitionRouter);
app.use("/api", signupPlayerRoute)
app.use("/api", registerPlayerRoute)

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
