import dotenv from "dotenv";
import axios from "axios";
import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";

dotenv.config();

export const snapshotController = async (req, res) => {
  try {
    const { competition_id, wallet_address } = req.body;

    if (!competition_id || !wallet_address) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: competition_id and wallet_address",
      });
    }

    // Check if competition exists
    const competition = await Competition.findOne({ id: competition_id });
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    // Check if wallet address is registered on the platform
    const user = await Player.findOne({
      player_wallet_address: wallet_address,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Wallet address not registered on the platform",
      });
    }

    // Function to fetch data with retry logic using axios
    const fetchWithRetry = async (data, retries = 3, delay = 1000) => {
      try {
        const response = await axios.post(
          `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
          data,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        return response.data;
      } catch (error) {
        if (retries > 0) {
          console.log(
            `Request failed, retrying in ${delay}ms... (${retries} retries left)`
          );
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

    const solBalance = solBalanceData.result.value / 1000000000; // Convert lamports to SOL

    // Get token assets
    const assetData = await fetchWithRetry({
      jsonrpc: "2.0",
      id: "get-assets",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: wallet_address,
        page: 1,
        limit: 1000,
      },
    });

    // Format assets for our schema
    const assets = [];

    // Add SOL balance
    assets.push({
      mint_address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      balance: solBalance,
      usd_value: solBalance * 143.36,
    });

    // Add token assets
    if (assetData.result && assetData.result.items) {
      assetData.result.items.forEach((asset) => {
        let usdValue = 0;
        const symbol =
          asset.content?.metadata?.symbol || asset.symbol || "UNKNOWN";
        const balance = asset.tokenAmount || asset.amount || 1;

        if (symbol === "USDC" || symbol === "USDT") {
          usdValue = parseFloat(balance);
        } else {
          usdValue = parseFloat(balance) * 1.0;
        }

        assets.push({
          mint_address: asset.id,
          symbol: symbol,
          balance: balance,
          usd_value: usdValue,
        });
      });
    }

    // Calculate total portfolio value
    const totalValue = assets.reduce(
      (sum, asset) =>
        sum + (isNaN(asset.usd_value) ? 0 : Number(asset.usd_value)),
      0
    );

    // Create snapshot object
    const currentSnapshot = {
      snapshot_timestamp: new Date(),
      assets: assets,
      total_portfolio_value: totalValue,
    };

    // Check if a snapshot already exists for this wallet and competition
    const existingSnapshot = await UserAssetSnapshot.findOne({
      competition: competition._id,
      player: user._id,
      wallet_address: wallet_address,
    });

    let savedSnapshot;

    if (existingSnapshot) {
      // Update existing snapshot with startSnapshot only
      existingSnapshot.startSnapshot = currentSnapshot;

      savedSnapshot = await existingSnapshot.save();
      console.log(`Updated start snapshot with ID: ${savedSnapshot._id}`);
    } else {
      // Create new snapshot document with startSnapshot only
      const snapshotData = {
        competition: competition._id,
        player: user._id,
        wallet_address: wallet_address,
        startSnapshot: currentSnapshot,
        endSnapshot: {
          snapshot_timestamp: new Date(),
          assets: [],
          total_portfolio_value: 0,
        },
      };

      const snapshot = new UserAssetSnapshot(snapshotData);
      savedSnapshot = await snapshot.save();
      console.log(`Created new start snapshot with ID: ${savedSnapshot._id}`);
    }

    return res.status(200).json({
      success: true,
      message: existingSnapshot
        ? "Start snapshot updated successfully"
        : "Start snapshot created successfully",
      data: {
        snapshot_id: savedSnapshot._id,
        snapshot_type: "start",
        timestamp: savedSnapshot.startSnapshot.snapshot_timestamp,
        asset_count: savedSnapshot.startSnapshot.assets.length,
        total_value: savedSnapshot.startSnapshot.total_portfolio_value,
      },
    });
  } catch (error) {
    console.error("Snapshot failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create wallet snapshot",
      error: error.message,
    });
  }
};
