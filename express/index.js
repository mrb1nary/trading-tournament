import express from "express";
import cors from "cors";
import fetchTxRouter from "./routes/fetchTx.js";
import determineWinnerRouter from "./routes/determineWinner.js";
import createCompetitionRouter from "./routes/createCompetition.js";
import joinCompetitionRouter from "./routes/joinCompetition.js";
import closeCompetitionRouter from "./routes/closeCompetition.js";
import signupPlayerRoute from "./routes/signupPlayer.js";
import registerPlayerRoute from "./routes/registerPlayerInCompetitionRoute.js";
import snapshotRoute from "./routes/snapshot.js";
import updatePlayerInfo from "./routes/updatePlayerInfo.js";
import fetchPlayer from "./routes/fetchPlayer.js";
import fetchCompetition from "./routes/fetchCompetition.js";
import { dbConnect } from "./config/dbConfig.js";

const app = express();
dbConnect();
app.use(cors());
app.use(express.json());
app.use("/api", fetchTxRouter);
app.use("/api", fetchCompetition);
app.use("/api", fetchPlayer);
app.use("/api", updatePlayerInfo);
app.use("/api", determineWinnerRouter);
app.use("/api", createCompetitionRouter);
app.use("/api", joinCompetitionRouter);
app.use("/api", closeCompetitionRouter);
app.use("/api", signupPlayerRoute);
app.use("/api", registerPlayerRoute);
app.use("/api", snapshotRoute);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
