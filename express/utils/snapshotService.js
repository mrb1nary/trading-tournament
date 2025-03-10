import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import axios from "axios";

export const takeAssetSnapshot = async (competition, player) => {
  try {
    // Validate inputs
    if (!competition || !player) {
      throw new Error("Invalid competition or player data");
    }

    // Calculate snapshot time (1 second before competition starts)
    const snapshotTime = new Date(competition.start_time.getTime() - 1000);
    const unixTimestamp = Math.floor(snapshotTime.getTime() / 1000);

    // Fetch historical asset data at this specific timestamp
    const snapshotData = await fetchHistoricalAssets(
      player.player_wallet_address,
      unixTimestamp
    );

    // Create and save snapshot document
    const snapshot = new UserAssetSnapshot({
      competition: competition._id,
      player: player._id,
      wallet_address: player.player_wallet_address,
      snapshot_timestamp: snapshotTime,
      assets: snapshotData.assets,
      total_portfolio_value: snapshotData.totalValue,
    });

    const savedSnapshot = await snapshot.save();
    return savedSnapshot;
  } catch (error) {
    console.error("Snapshot failed:", error.message);
    throw error; // Rethrow for controller handling
  }
};

const fetchHistoricalAssets = async (walletAddress, unixTimestamp) => {
  try {
    // Use Moralis Wallet History API to get historical wallet state
    const response = await axios.get(
      `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/history`,
      {
        params: {
          chain: "sol",
          from_block: await calculateBlockNumber(unixTimestamp - 3600), // 1 hour before timestamp
          to_block: await calculateBlockNumber(unixTimestamp),
        },
        headers: {
          "X-API-Key": process.env.MORALIS_API_KEY,
        },
      }
    );

    if (!response.data || !response.data.result) {
      console.error(
        "Unexpected API response structure:",
        JSON.stringify(response.data)
      );
      throw new Error("Invalid API response structure");
    }

    // Process Moralis response to extract token balances at timestamp
    const assets = await processWalletHistory(
      response.data.result,
      unixTimestamp
    );

    // Fetch historical prices for the assets
    const historicalPrices = await fetchHistoricalPrices(assets, unixTimestamp);

    // Calculate USD values
    const processedAssets = assets.map((asset) => {
      const usdValue = calculateUSDValue(asset, historicalPrices);
      return {
        mint_address: asset.token_address,
        symbol: asset.symbol || "UNKNOWN",
        balance: asset.balance || 0,
        usd_value: isNaN(usdValue) ? 0 : usdValue,
      };
    });

    // Calculate total value safely
    const totalValue = processedAssets.reduce(
      (sum, asset) =>
        sum + (isNaN(asset.usd_value) ? 0 : Number(asset.usd_value)),
      0
    );

    return {
      assets: processedAssets,
      totalValue: totalValue,
    };
  } catch (error) {
    console.error(
      "Historical asset fetch failed:",
      error.response?.data || error.message
    );
    if (error.response) {
      console.error("API response status:", error.response.status);
      console.error("API response data:", JSON.stringify(error.response.data));
    }
    throw new Error("Failed to retrieve historical assets");
  }
};

// Helper function to calculate Solana block number from timestamp
const calculateBlockNumber = async (unixTimestamp) => {
  try {
    // Use Helius API to convert timestamp to block number
    const response = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      {
        jsonrpc: "2.0",
        id: "block-conversion",
        method: "getBlockHeight",
        params: [
          {
            commitment: "finalized",
          },
        ],
      }
    );

    // For Solana, we need to estimate the block number based on average block time
    // This is a simplified approach - in production you'd want a more accurate method
    const currentBlockHeight = response.data.result;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const averageBlockTime = 0.4; // Solana's average block time in seconds

    const blockDifference = Math.floor(
      (currentTimestamp - unixTimestamp) / averageBlockTime
    );
    return currentBlockHeight - blockDifference;
  } catch (error) {
    console.error("Block calculation failed:", error);
    throw new Error("Failed to calculate block number");
  }
};

// Process wallet history to determine token balances at specific timestamp
const processWalletHistory = async (transactions, targetTimestamp) => {
  // Group transactions by token
  const tokenBalances = {};

  transactions.forEach((tx) => {
    const txTimestamp = Math.floor(
      new Date(tx.block_timestamp).getTime() / 1000
    );

    // Only consider transactions before or at our target timestamp
    if (txTimestamp <= targetTimestamp) {
      // Process token transfers
      if (tx.token_transfers && tx.token_transfers.length > 0) {
        tx.token_transfers.forEach((transfer) => {
          const tokenAddress = transfer.token_address;

          if (!tokenBalances[tokenAddress]) {
            tokenBalances[tokenAddress] = {
              token_address: tokenAddress,
              symbol: transfer.symbol,
              decimals: transfer.decimals,
              balance: 0,
            };
          }

          // Add to balance if receiving
          if (
            transfer.to_address.toLowerCase() === walletAddress.toLowerCase()
          ) {
            tokenBalances[tokenAddress].balance += Number(transfer.value);
          }

          // Subtract from balance if sending
          if (
            transfer.from_address.toLowerCase() === walletAddress.toLowerCase()
          ) {
            tokenBalances[tokenAddress].balance -= Number(transfer.value);
          }
        });
      }

      // Handle native SOL transfers
      if (tx.value && tx.value !== "0") {
        const solAddress = "So11111111111111111111111111111111111111112";

        if (!tokenBalances[solAddress]) {
          tokenBalances[solAddress] = {
            token_address: solAddress,
            symbol: "SOL",
            decimals: 9,
            balance: 0,
          };
        }

        // Add to balance if receiving
        if (tx.to_address.toLowerCase() === walletAddress.toLowerCase()) {
          tokenBalances[solAddress].balance += Number(tx.value);
        }

        // Subtract from balance if sending
        if (tx.from_address.toLowerCase() === walletAddress.toLowerCase()) {
          tokenBalances[solAddress].balance -= Number(tx.value);
        }
      }
    }
  });

  return Object.values(tokenBalances);
};

// Fetch historical prices for tokens
const fetchHistoricalPrices = async (assets, unixTimestamp) => {
  const prices = {};

  try {
    // Use CoinGecko API to get historical prices
    for (const asset of assets) {
      if (asset.symbol === "USDC" || asset.symbol === "USDT") {
        prices[asset.token_address] = 1.0; // Stablecoins
        continue;
      }

      try {
        // Format date for CoinGecko API
        const date = new Date(unixTimestamp * 1000).toISOString().split("T")[0];

        // For SOL, use a special case
        if (asset.symbol === "SOL") {
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/solana/history`,
            {
              params: {
                date: date,
                localization: false,
              },
            }
          );

          if (
            response.data &&
            response.data.market_data &&
            response.data.market_data.current_price
          ) {
            prices[asset.token_address] =
              response.data.market_data.current_price.usd;
          } else {
            // Fallback to recent price data
            prices[asset.token_address] = 143.36; // Recent SOL price as of March 2025
          }
        } else {
          // For other tokens, try to get by contract address
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/solana/contract/${asset.token_address}/market_chart/range`,
            {
              params: {
                vs_currency: "usd",
                from: unixTimestamp - 3600, // 1 hour before
                to: unixTimestamp,
              },
            }
          );

          if (
            response.data &&
            response.data.prices &&
            response.data.prices.length > 0
          ) {
            prices[asset.token_address] = response.data.prices[0][1];
          } else {
            prices[asset.token_address] = 1.0; // Default fallback price
          }
        }
      } catch (error) {
        console.warn(`Failed to get price for ${asset.symbol}:`, error.message);
        prices[asset.token_address] = 1.0; // Default fallback price
      }
    }
  } catch (error) {
    console.error("Price fetch failed:", error);
  }

  return prices;
};

const calculateUSDValue = (asset, historicalPrices) => {
  // Check if asset has valid balance
  if (!asset.balance || isNaN(asset.balance)) return 0;

  // For stablecoins return the balance directly
  if (asset.symbol === "USDC" || asset.symbol === "USDT") {
    return Number(asset.balance) / Math.pow(10, asset.decimals || 6);
  }

  // For other tokens, use historical price
  const price = historicalPrices[asset.token_address] || 1.0;
  return (Number(asset.balance) / Math.pow(10, asset.decimals || 9)) * price;
};
