import { takeSnapshot } from "./snapshotService.js";
import { Competition } from "../models/competitionModel.js";
import { Versus } from "../models/versusModel.js";

// Utility function for consistent logging
const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);

/**
 * Define all agenda jobs.
 * Must be called after Agenda initialization.
 * @param {Agenda} agenda - Initialized Agenda instance
 */
export const defineJobs = (agenda) => {
  if (!agenda) {
    throw new Error("Agenda instance required");
  }

  // Competition Start Snapshot Job
  agenda.define("take start snapshot", async (job) => {
    const { competitionId } = job.attrs.data;
    log(`🏁 STARTING start snapshots for competition ${competitionId}`);

    try {
      const competition = await Competition.findById(competitionId).populate(
        "participants",
        "player_wallet_address"
      );

      if (!competition) {
        throw new Error(`Competition ${competitionId} not found`);
      }

      log(`📊 Processing ${competition.participants.length} participants`);

      const results = await Promise.allSettled(
        competition.participants.map(async (participant) => {
          try {
            await takeSnapshot({
              competition_id: competitionId,
              wallet_address: participant.player_wallet_address,
              snapshotType: "start",
            });
            return { success: true, wallet: participant.player_wallet_address };
          } catch (error) {
            return {
              success: false,
              wallet: participant.player_wallet_address,
              error: error.message,
            };
          }
        })
      );

      const successCount = results.filter((r) => r.value?.success).length;
      const errorCount = results.filter((r) => !r.value?.success).length;

      log(
        `✅ START SNAPSHOTS COMPLETE: ${successCount} success, ${errorCount} errors`
      );
      if (errorCount > 0) {
        log(
          `❌ Failed wallets:`,
          results.filter((r) => !r.value?.success).map((r) => r.value?.wallet)
        );
      }
    } catch (error) {
      log(`💥 CRITICAL ERROR in start snapshot job:`, error.message);
      throw error;
    }
  });

  // Competition End Snapshot Job
  agenda.define("take end snapshot", async (job) => {
    const { competitionId } = job.attrs.data;
    log(`🏁 STARTING end snapshots for competition ${competitionId}`);

    try {
      const competition = await Competition.findById(competitionId).populate(
        "participants",
        "player_wallet_address"
      );

      if (!competition) {
        throw new Error(`Competition ${competitionId} not found`);
      }

      log(`📊 Processing ${competition.participants.length} participants`);

      const results = await Promise.allSettled(
        competition.participants.map(async (participant) => {
          try {
            await takeSnapshot({
              competition_id: competitionId,
              wallet_address: participant.player_wallet_address,
              snapshotType: "end",
            });
            return { success: true, wallet: participant.player_wallet_address };
          } catch (error) {
            return {
              success: false,
              wallet: participant.player_wallet_address,
              error: error.message,
            };
          }
        })
      );

      const successCount = results.filter((r) => r.value?.success).length;
      const errorCount = results.filter((r) => !r.value?.success).length;

      log(
        `✅ END SNAPSHOTS COMPLETE: ${successCount} success, ${errorCount} errors`
      );
      if (errorCount > 0) {
        log(
          `❌ Failed wallets:`,
          results.filter((r) => !r.value?.success).map((r) => r.value?.wallet)
        );
      }
    } catch (error) {
      log(`💥 CRITICAL ERROR in end snapshot job:`, error.message);
      throw error;
    }
  });

  // Versus Start Snapshot Job
  agenda.define("take versus start snapshot", async (job) => {
    const { versusId } = job.attrs.data;
    log(`🏁 STARTING VERSUS start snapshots for ${versusId}`);

    try {
      const versus = await Versus.findById(versusId).populate(
        "participants",
        "player_wallet_address"
      );

      if (!versus) {
        throw new Error(`Versus ${versusId} not found`);
      }

      log(`📊 Processing ${versus.participants.length} versus participants`);

      const results = await Promise.allSettled(
        versus.participants.map(async (participant) => {
          try {
            await takeSnapshot({
              versus_id: versusId,
              wallet_address: participant.player_wallet_address,
              snapshotType: "start",
            });
            return { success: true, wallet: participant.player_wallet_address };
          } catch (error) {
            return {
              success: false,
              wallet: participant.player_wallet_address,
              error: error.message,
            };
          }
        })
      );

      const successCount = results.filter((r) => r.value?.success).length;
      const errorCount = results.filter((r) => !r.value?.success).length;

      log(
        `✅ VERSUS START SNAPSHOTS COMPLETE: ${successCount} success, ${errorCount} errors`
      );
      if (errorCount > 0) {
        log(
          `❌ Failed versus wallets:`,
          results.filter((r) => !r.value?.success).map((r) => r.value?.wallet)
        );
      }
    } catch (error) {
      log(`💥 CRITICAL ERROR in versus start snapshot job:`, error.message);
      throw error;
    }
  });

  // Versus End Snapshot Job
  agenda.define("take versus end snapshot", async (job) => {
    const { versusId } = job.attrs.data;
    log(`🏁 STARTING VERSUS end snapshots for ${versusId}`);

    try {
      const versus = await Versus.findById(versusId).populate(
        "participants",
        "player_wallet_address"
      );

      if (!versus) {
        throw new Error(`Versus ${versusId} not found`);
      }

      log(`📊 Processing ${versus.participants.length} versus participants`);

      const results = await Promise.allSettled(
        versus.participants.map(async (participant) => {
          try {
            await takeSnapshot({
              versus_id: versusId,
              wallet_address: participant.player_wallet_address,
              snapshotType: "end",
            });
            return { success: true, wallet: participant.player_wallet_address };
          } catch (error) {
            return {
              success: false,
              wallet: participant.player_wallet_address,
              error: error.message,
            };
          }
        })
      );

      const successCount = results.filter((r) => r.value?.success).length;
      const errorCount = results.filter((r) => !r.value?.success).length;

      log(
        `✅ VERSUS END SNAPSHOTS COMPLETE: ${successCount} success, ${errorCount} errors`
      );
      if (errorCount > 0) {
        log(
          `❌ Failed versus wallets:`,
          results.filter((r) => !r.value?.success).map((r) => r.value?.wallet)
        );
      }
    } catch (error) {
      log(`💥 CRITICAL ERROR in versus end snapshot job:`, error.message);
      throw error;
    }
  });
};

/**
 * Schedule competition snapshots
 * @param {Object} competition - Competition document
 * @param {Agenda} agenda - Initialized Agenda instance
 */
export const scheduleCompetitionSnapshots = async (competition, agenda) => {
  if (!agenda) {
    throw new Error("Agenda instance required");
  }

  try {
    await agenda.schedule(competition.start_time, "take start snapshot", {
      competitionId: competition._id,
    });

    await agenda.schedule(competition.end_time, "take end snapshot", {
      competitionId: competition._id,
    });

    log(
      `📅 Scheduled snapshots for competition ${competition._id}\n` +
        `   Start: ${competition.start_time.toISOString()}\n` +
        `   End: ${competition.end_time.toISOString()}`
    );
  } catch (error) {
    log(
      `❌ Failed to schedule snapshots for competition ${competition._id}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Schedule versus snapshots
 * @param {Object} versus - Versus document
 * @param {Agenda} agenda - Initialized Agenda instance
 */
export const scheduleVersusSnapshots = async (versus, agenda) => {
  if (!agenda) {
    throw new Error("Agenda instance required");
  }

  try {
    await agenda.schedule(versus.start_time, "take versus start snapshot", {
      versusId: versus._id,
    });

    await agenda.schedule(versus.end_time, "take versus end snapshot", {
      versusId: versus._id,
    });

    log(
      `📅 VERSUS: Scheduled snapshots for ${versus._id}\n` +
        `   Start: ${versus.start_time.toISOString()}\n` +
        `   End: ${versus.end_time.toISOString()}`
    );
  } catch (error) {
    log(
      `❌ Failed to schedule versus snapshots for ${versus._id}:`,
      error.message
    );
    throw error;
  }
};
