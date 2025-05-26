import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { defineJobs } from "./services/schedulerService.js";

// Load environment variables first
dotenv.config();

// Database and Agenda configuration
import { dbConnect } from "./config/dbConfig.js";
import { initializeAgenda } from "./config/agenda.js";

// Models and Services
import { Competition } from "./models/competitionModel.js";
import { Versus } from "./models/versusModel.js";
import {
  scheduleCompetitionSnapshots,
  scheduleVersusSnapshots,
} from "./services/schedulerService.js";

// API Routes
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
import fetchVersusRoute from "./routes/fetchVersusRoute.js";
import joinVersusRoute from "./routes/joinVersusRoute.js";

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("🔧 Server initialization started...");

// =====================
//   Enhanced CORS Setup
// =====================
const allowedOrigins =
  NODE_ENV === "production"
    ? ["https://citadelv1.netlify.app"]
    : ["http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// =====================
//  Global Error Handlers
// =====================
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("🔥 Unhandled Rejection:", reason);
  process.exit(1);
});

// =====================
//  Database Connection
// =====================
dbConnect();

// =====================
//  Scheduler Initialization
// =====================
const initializeScheduler = async (agenda) => {
  try {
    console.log("🔍 Fetching active competitions and versus...");
    const [competitions, versus] = await Promise.all([
      Competition.find({ end_time: { $gt: new Date() } }),
      Versus.find({ end_time: { $gt: new Date() } }),
    ]);

    console.log(
      `🔁 Rescheduling ${competitions.length} competitions and ${versus.length} versus games`
    );

    await Promise.all([
      ...competitions.map((comp) => scheduleCompetitionSnapshots(comp)),
      ...versus.map((vs) => scheduleVersusSnapshots(vs)),
    ]);

    console.log("✅ Scheduler initialization complete");
  } catch (error) {
    console.error("❌ Scheduler initialization failed:", error);
    throw error;
  }
};

// =====================
//  Main Initialization Flow
// =====================
mongoose.connection.once("open", async () => {
  console.log("✅ MongoDB connection established");

  try {
    // 1. Initialize Agenda (without starting)
    console.log("⚡ Initializing Agenda...");
    const agenda = await initializeAgenda();
    console.log("✅ Agenda instance created");

    // 2. Define jobs
    console.log("📝 Defining jobs...");
    defineJobs(agenda);
    console.log(`✅ Registered ${agenda._definitions.size} job types`);

    // 3. Start Agenda processing
    console.log("🚀 Starting Agenda...");
    await agenda.start();
    console.log("📅 Agenda processing started");

    // 4. Initialize Scheduler
    console.log("⏳ Initializing scheduler...");
    await initializeScheduler(agenda);
    console.log("✅ Scheduler ready");

    // 5. Register Routes
    console.log("🔄 Registering API routes...");
    app.use("/api", fetchTxRouter);
    app.use("/api", fetchCompetition);
    app.use("/api", fetchPlayer);
    app.use("/api", updatePlayerInfo);
    app.use("/api", determineWinnerRouter);
    app.use("/api", createCompetitionRouter);
    app.use("/api", joinCompetitionRouter);
    app.use("/api", closeCompetitionRouter);
    app.use("/api", signupPlayerRoute);
    app.use("/api", fetchVersusRoute);
    app.use("/api", joinVersusRoute);
    app.use("/api", createVersusParty);
    app.use("/api", registerPlayerRoute);
    app.use("/api", fetchSnapshotRouter);
    app.use("/api", snapshotRoute);
    app.use("/api", endSnapshotRoute);

    // Health check endpoint
    app.get("/api/ping", (req, res) => {
      console.log("🩺 Health check received");
      res.status(200).send("pong");
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      if (err.message === "Not allowed by CORS") {
        console.warn(`⚠️ CORS violation from: ${req.headers.origin}`);
        return res.status(403).json({
          success: false,
          message: "CORS policy violation",
          error: err.message,
        });
      }
      console.error("💥 Server Error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });

    // 6. Start Server
    console.log(`🚀 Starting server on port ${PORT}...`);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running in ${NODE_ENV} mode`);
      console.log(`🌐 Access URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("💥 Critical initialization failure:", error);
    process.exit(1);
  }
});
