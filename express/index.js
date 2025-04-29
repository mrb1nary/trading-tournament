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
import endSnapshotRoute from "./routes/endSnapshot.js";
import updatePlayerInfo from "./routes/updatePlayerInfo.js";
import fetchPlayer from "./routes/fetchPlayer.js";
import fetchCompetition from "./routes/fetchCompetition.js";
import createVersusParty from "./routes/createVersusPartyRoute.js";
import fetchSnapshotRouter from "./routes/fetchSnapshot.js";
import { dbConnect } from "./config/dbConfig.js";

import dotenv from "dotenv";
dotenv.config();


console.log(
  "MongoDB URI:",
  process.env.MONGODB_CONNECTION_STRING ? "Loaded" : "Not set"
);



const app = express();
const PORT = process.env.PORT || 3001;

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
app.use("/api", createVersusParty);
app.use("/api", registerPlayerRoute);
app.use("/api", fetchSnapshotRouter);
app.use("/api", snapshotRoute);
app.use("/api", endSnapshotRoute);

app.listen(PORT, () => {
  console.log(`Server is running on ${process.env.SERVER_URL}:${PORT}`);
});
