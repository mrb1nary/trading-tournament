import { takeSnapshot } from "../services/snapshotService.js";
import { Competition } from "../models/competitionModel.js";
import { Versus } from "../models/versusModel.js";

const getTimestamp = () => new Date().toISOString();

const log = (message, metadata = {}) => {
  console.log(`[SnapshotController] [${getTimestamp()}] ${message}`, metadata);
};

export const snapshotController = async (req, res) => {
  try {
    const { competition_id, versus_id, wallet_address } = req.body;
    log("Request received", { competition_id, versus_id, wallet_address });

    if ((!competition_id && !versus_id) || !wallet_address) {
      log("Missing parameters");
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    const gameType = versus_id ? "versus" : "competition";
    const gameId = versus_id || competition_id;

    log("Resolving game", { gameType, gameId });
    const GameModel = gameType === "versus" ? Versus : Competition;
    const game = await GameModel.findOne({ id: gameId });

    if (!game) {
      log("Game not found", { gameType, gameId });
      return res.status(404).json({
        success: false,
        message: `${gameType} not found`,
      });
    }

    log("Initiating snapshot process", { gameId: game._id });
    await takeSnapshot(wallet_address, gameType, game._id);

    return res.status(200).json({
      success: true,
      message: "Snapshot processed successfully",
      data: {
        game_type: gameType,
        game_id: gameId,
        snapshot_type: "start",
        timestamp: getTimestamp(),
      },
    });
  } catch (error) {
    log("Controller error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to process snapshot",
      error: error.message,
    });
  }
};
