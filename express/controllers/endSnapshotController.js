import dotenv from "dotenv";
import axios from "axios";
import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import { Competition } from "../models/competitionModel.js";
import { Player } from "../models/playerModel.js";

dotenv.config();

export const endSnapshotController = async (req, res) => {
  try {
    const { competition_id, wallet_address } = req.body;

    // Validate input
    if (!competition_id || !wallet_address) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: competition_id and wallet_address",
      });
    }

    // Check competition exists
    const competition = await Competition.findOne({ id: competition_id });
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    // Check player exists
    const user = await Player.findOne({
      player_wallet_address: wallet_address,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Wallet address not registered",
      });
    }

    // Get competition end time as timestamp
    const endTimestamp = Math.floor(competition.end_time.getTime() / 1000);

    // Build the Helius RPC URL
    const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

    // Prepare the getAssetsByOwner request (no historical slot support for tokens, so this is current snapshot)
    const assetReq = {
      jsonrpc: "2.0",
      id: "get-assets",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: wallet_address,
        page: 1,
        limit: 1000,
      },
    };

    // Get all SPL token assets
    const assetResponse = await axios.post(url, assetReq, {
      headers: { "Content-Type": "application/json" },
    });

    // Get SOL balance (current)
    const solReq = {
      jsonrpc: "2.0",
      id: "sol-balance",
      method: "getBalance",
      params: [wallet_address],
    };
    const solResponse = await axios.post(url, solReq, {
      headers: { "Content-Type": "application/json" },
    });

    // Format assets
    const assets = [];
    if (assetResponse.data.result && assetResponse.data.result.items) {
      assetResponse.data.result.items.forEach((asset) => {
        const symbol =
          asset.content?.metadata?.symbol || asset.symbol || "UNKNOWN";
        const balance = asset.tokenAmount || asset.amount || 1;
        assets.push({
          mint_address: asset.id,
          symbol: symbol,
          balance: balance,
          usd_value: null, // Placeholder, you can add price logic if you want
        });
      });
    }

    // Add SOL balance
    const solBalanceLamports = solResponse.data.result.value;
    const solBalance = solBalanceLamports / 1e9;
    assets.push({
      mint_address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      balance: solBalance,
      usd_value: null, // Placeholder
    });

    // Calculate total portfolio value (if you want to add price logic)
    const totalValue = assets.reduce(
      (sum, asset) =>
        sum + (isNaN(asset.usd_value) ? 0 : Number(asset.usd_value)),
      0
    );

    // // Update or create snapshot (DB code commented as requested)
    // const existingSnapshot = await UserAssetSnapshot.findOne({
    //   competition: competition._id,
    //   wallet_address: wallet_address,
    // });

    // let savedSnapshot;
    // const snapshotData = {
    //   assets,
    //   total_portfolio_value: totalValue,
    //   snapshot_timestamp: competition.end_time,
    // };

    // if (existingSnapshot) {
    //   savedSnapshot = await UserAssetSnapshot.findByIdAndUpdate(
    //     existingSnapshot._id,
    //     snapshotData,
    //     { new: true }
    //   );
    // } else {
    //   savedSnapshot = await UserAssetSnapshot.create({
    //     ...snapshotData,
    //     competition: competition._id,
    //     player: user._id,
    //     wallet_address: wallet_address,
    //   });
    // }

    res.status(200).json({
      success: true,
      // message: existingSnapshot ? "Snapshot updated" : "Snapshot created",
      // data: {
      //   snapshot_id: savedSnapshot._id,
      //   timestamp: savedSnapshot.snapshot_timestamp,
      //   asset_count: savedSnapshot.assets.length,
      //   total_value: savedSnapshot.total_portfolio_value,
      // },
      message: "Snapshot fetched successfully",
      data: {
        competition_id,
        wallet_address,
        timestamp: competition.end_time,
        asset_count: assets.length,
        assets,
      },
    });
  } catch (error) {
    console.error("Snapshot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create snapshot",
      error: error.message,
    });
  }
};
