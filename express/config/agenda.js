// config/agenda.js
import Agenda from "agenda";
import mongoose from "mongoose";

let agenda;

const gracefulShutdown = async () => {
  if (agenda) {
    console.log("🛑 Stopping Agenda...");
    await agenda.stop();
    console.log("✅ Agenda stopped");
  }
  process.exit(0);
};

// config/agenda.js
export const initializeAgenda = async () => {
  if (agenda) return agenda;

  try {
    console.log("⚙️ Initializing Agenda...");
    
    // 1. Get native MongoDB instance with explicit database name
    const mongoDb = mongoose.connection.getClient().db("Ceercle");
    console.log("🔗 Connected to database:", mongoDb.databaseName);

    // 2. Create Agenda instance (DON'T start yet)
    agenda = new Agenda({
      processEvery: "30 seconds",
      mongo: mongoDb,
      db: { collection: "scheduledJobs" },
      maxConcurrency: 20,
      lockLimit: 20,
      defaultLockLifetime: 60000
    });

    // 3. Handle connection events
    let isReady = false;
    await new Promise((resolve, reject) => {
      agenda.once("ready", () => {
        isReady = true;
        resolve();
      });
      agenda.once("error", reject);
      
      // Manual check if already connected
      if (agenda._mdb) resolve();
    });

    // 4. Clear stuck jobs
    const { modifiedCount } = await agenda._collection.updateMany(
      { lockedAt: { $ne: null } },
      { $set: { lockedAt: null } }
    );
    console.log(`🔓 Reset ${modifiedCount} locked jobs`);

    return agenda;
  } catch (error) {
    console.error("💥 Agenda initialization failed:", error.message);
    await gracefulShutdown();
    throw error;
  }
};


// Signal handling remains the same
