import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
import { Versus } from "../models/versusModel.js";

dotenv.config();

// Initialize indexes with explicit names
const initializeIndexes = async () => {
  try {
    // Drop existing conflicting indexes if they exist
    try {
      await UserAssetSnapshot.collection.dropIndex("player_1_competition_1");
      await UserAssetSnapshot.collection.dropIndex("player_1_versus_1");
    } catch (dropError) {
      console.log("Indexes already removed or not present");
    }

    // Create new partial indexes
    await UserAssetSnapshot.collection.createIndex(
      { player: 1, competition: 1 },
      {
        unique: true,
        name: "partial_player_competition_unique",
        partialFilterExpression: { competition: { $exists: true } },
      }
    );

    await UserAssetSnapshot.collection.createIndex(
      { player: 1, versus: 1 },
      {
        unique: true,
        name: "partial_player_versus_unique",
        partialFilterExpression: { versus: { $exists: true } },
      }
    );

    console.log("Indexes initialized successfully");
  } catch (error) {
    console.error("Index initialization error:", error.message);
  }
};

// Call this during application startup
initializeIndexes();

export const snapshotController = async (req, res) => {
  try {
    const { competition_id, versus_id, wallet_address } = req.body;

    console.log("[INPUT]", { competition_id, versus_id, wallet_address });

    if ((!competition_id && !versus_id) || !wallet_address) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: either competition_id or versus_id, and wallet_address",
      });
    }

    let game, gameId, gameType;
    if (versus_id) {
      game = await Versus.findOne({ id: versus_id });
      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Versus game not found" });
      }
      gameId = game._id;
      gameType = "versus";
    } else {
      game = await Competition.findOne({ id: competition_id });
      if (!game) {
        return res
          .status(404)
          .json({ success: false, message: "Competition not found" });
      }
      gameId = game._id;
      gameType = "competition";
    }

    console.log(`[GAME] Resolved ${gameType} game with ID ${gameId}`);

    const user = await Player.findOne({
      player_wallet_address: wallet_address,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Wallet address not registered on the platform",
      });
    }

    console.log(`[PLAYER] Found player ID ${user._id}`);

    const fetchWithRetry = async (data, retries = 3, delay = 1000) => {
      try {
        const response = await axios.post(
          `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
          data,
          { headers: { "Content-Type": "application/json" } }
        );
        return response.data;
      } catch (error) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(data, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    // Get SOL balance
    const solBalanceData = await fetchWithRetry({
      jsonrpc: "2.0",
      id: "sol-balance",
      method: "getBalance",
      params: [wallet_address],
    });
    const solBalance = solBalanceData.result.value / 1_000_000_000;

    // Get token assets
    const assetData = await fetchWithRetry({
      jsonrpc: "2.0",
      id: "get-assets",
      method: "getAssetsByOwner",
      params: { ownerAddress: wallet_address, page: 1, limit: 1000 },
    });

    const assets = [
      {
        mint_address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        balance: solBalance,
        usd_value: solBalance * 143.36,
      },
    ];

    if (assetData.result?.items) {
      assetData.result.items.forEach((asset) => {
        const symbol =
          asset.content?.metadata?.symbol || asset.symbol || "UNKNOWN";
        const balance = asset.tokenAmount || asset.amount || 1;
        const usdValue = ["USDC", "USDT"].includes(symbol)
          ? parseFloat(balance)
          : parseFloat(balance) * 1.0;

        assets.push({
          mint_address: asset.id,
          symbol,
          balance,
          usd_value: usdValue,
        });
      });
    }

    const totalValue = assets.reduce(
      (sum, asset) => sum + (isNaN(asset.usd_value) ? 0 : asset.usd_value),
      0
    );

    const currentSnapshot = {
      snapshot_timestamp: new Date(),
      assets,
      total_portfolio_value: totalValue,
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query = {
        player: user._id,
        wallet_address,
        ...(gameType === "competition"
          ? { competition: gameId }
          : { versus: gameId }),
      };

      console.log("[QUERY] Finding existing snapshot with:", query);

      let existingSnapshot = await UserAssetSnapshot.findOne(query).session(
        session
      );
      let savedSnapshot;

      if (existingSnapshot) {
        console.log("[UPDATE] Existing snapshot found:", existingSnapshot._id);
        existingSnapshot.startSnapshot = currentSnapshot;
        savedSnapshot = await existingSnapshot.save({ session });
      } else {
        const snapshotData = {
          player: user._id,
          wallet_address,
          startSnapshot: currentSnapshot,
          [gameType]: gameId,
        };

        console.log("[INSERT] Snapshot data to be saved:", snapshotData);
        const snapshot = new UserAssetSnapshot(snapshotData);
        savedSnapshot = await snapshot.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: existingSnapshot
          ? "Start snapshot updated successfully"
          : "Start snapshot created successfully",
        data: {
          snapshot_id: savedSnapshot._id,
          game_type: gameType,
          game_id: gameType === "competition" ? competition_id : versus_id,
          snapshot_type: "start",
          timestamp: savedSnapshot.startSnapshot.snapshot_timestamp,
          asset_count: savedSnapshot.startSnapshot.assets.length,
          total_value: savedSnapshot.startSnapshot.total_portfolio_value,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("❌ Snapshot failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create wallet snapshot",
      error: error.message,
    });
  }
};
