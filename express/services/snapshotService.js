import axios from "axios";
import mongoose from "mongoose";
import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";
import { Versus } from "../models/versusModel.js";

const getTimestamp = () => new Date().toISOString();

const log = (message, metadata = {}) => {
  console.log(`[SnapshotService] [${getTimestamp()}] ${message}`, metadata);
};

const fetchWithRetry = async (data, retries = 3, delay = 1000) => {
  try {
    log("Initiating Helius API call", { method: data.method });
    const response = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    if (retries > 0) {
      log(`Retrying ${data.method} (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(data, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const fetchWalletAssets = async (wallet_address) => {
  try {
    log("Fetching wallet assets", { wallet_address });

    const [solBalanceData, assetData] = await Promise.all([
      fetchWithRetry({
        jsonrpc: "2.0",
        id: "sol-balance",
        method: "getBalance",
        params: [wallet_address],
      }),
      fetchWithRetry({
        jsonrpc: "2.0",
        id: "get-assets",
        method: "getAssetsByOwner",
        params: { ownerAddress: wallet_address, page: 1, limit: 1000 },
      }),
    ]);

    const solBalance = solBalanceData.result.value / 1_000_000_000;

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

    log("Successfully fetched assets", {
      assetCount: assets.length,
      wallet: wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4),
    });

    return assets;
  } catch (error) {
    log("Failed to fetch wallet assets", {
      wallet: wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4),
      error: error.message,
    });
    throw error;
  }
};

export const takeSnapshot = async ({
  competition_id,
  versus_id,
  wallet_address,
  snapshotType = "start",
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    log(`Starting ${snapshotType} snapshot`, {
      wallet: wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4),
      gameType: competition_id ? "competition" : "versus",
    });

    // Validate game exists
    let game, gameType, gameId;
    if (competition_id) {
      game = await Competition.findById(competition_id).session(session);
      gameType = "competition";
      gameId = competition_id;
    } else if (versus_id) {
      game = await Versus.findById(versus_id).session(session);
      gameType = "versus";
      gameId = versus_id;
    } else {
      throw new Error("Must provide either competition_id or versus_id");
    }

    if (!game) {
      throw new Error(`${gameType} ${gameId} not found`);
    }

    // Validate player exists
    const user = await Player.findOne({
      player_wallet_address: wallet_address,
    }).session(session);

    if (!user) {
      throw new Error("Wallet address not registered");
    }

    // Create snapshot
    const assets = await fetchWalletAssets(wallet_address);
    const totalValue = assets.reduce(
      (sum, asset) => sum + (isNaN(asset.usd_value) ? 0 : asset.usd_value),
      0
    );

    const currentSnapshot = {
      snapshot_timestamp: new Date(),
      assets,
      total_portfolio_value: totalValue,
    };

    const update = {};
    update[`${snapshotType}Snapshot`] = currentSnapshot;

    await UserAssetSnapshot.findOneAndUpdate(
      { [gameType]: gameId, wallet_address },
      update,
      { upsert: true, session }
    );

    await session.commitTransaction();

    log(`${snapshotType} snapshot successful`, {
      gameId,
      gameType,
      wallet: wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4),
    });

    return true;
  } catch (error) {
    await session.abortTransaction();
    log(`${snapshotType} snapshot failed`, {
      error: error.message,
      wallet: wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4),
      gameId: competition_id || versus_id,
    });
    throw error;
  } finally {
    session.endSession();
  }
};
