import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TOKEN_MINTS = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  SOL: "So11111111111111111111111111111111111111112", // SOL mint address
};

const API_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;

export const fetchTransactionsForWallet = async (
  address,
  startTime,
  endTime
) => {
  let transactions = [];
  let lastError = null;

  console.log("\n🔍 Starting transaction fetch for:", address);
  console.log("⏰ Time range:", {
    start: new Date(startTime * 1000).toISOString(),
    end: new Date(endTime * 1000).toISOString(),
  });

  // Try Solscan with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`\n🔧 Attempting Solscan fetch (attempt ${attempt})`);
      transactions = await fetchSolscanTransactions(
        address,
        startTime,
        endTime
      );

      console.log(
        "✅ Solscan response sample:",
        transactions.length > 0 ? transactions[0] : "No transactions"
      );

      if (transactions.length > 0) return transactions;
    } catch (error) {
      lastError = error;
      console.log(`❌ Solscan attempt ${attempt} failed:`, {
        message: error.message,
        response: error.response?.data || "No response data",
        status: error.response?.status,
      });
      await new Promise((resolve) =>
        setTimeout(resolve, BASE_RETRY_DELAY * attempt)
      );
    }
  }

  // Fallback to Shyft
  console.log("\n🔧 Falling back to Shyft API...");
  try {
    transactions = await fetchShyftTransactions(address, startTime, endTime);
    console.log(
      "✅ Shyft response sample:",
      transactions.length > 0 ? transactions[0] : "No transactions"
    );
    return transactions;
  } catch (error) {
    lastError = error;
    console.log("❌ Shyft fetch failed:", {
      message: error.message,
      response: error.response?.data || "No response data",
      status: error.response?.status,
    });
  }

  console.error("\n💥 All transaction fetch attempts failed");
  return [];
};

const fetchSolscanTransactions = async (address, startTime, endTime) => {
  let allTransactions = [];
  let before = null;
  let shouldContinue = true;

  console.log("\n🔍 Solscan fetch started");

  while (shouldContinue) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      console.log("🔧 Solscan request params:", {
        address,
        limit: 40,
        before,
        startTime,
        endTime,
      });

      const response = await axios.get(
        "https://pro-api.solscan.io/v2.0/account/transactions",
        {
          params: { address, limit: 40, before },
          headers: {
            token: process.env.SOLSCAN_API_KEY,
            accept: "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      console.log("✅ Solscan raw response:", {
        status: response.status,
        data: response.data,
      });

      const transactions = response.data?.data || [];
      console.log("📥 Received transactions:", transactions.length);

      if (transactions.length === 0) break;

      const relevantTxns = transactions.filter(
        (tx) => tx.block_time >= startTime && tx.block_time <= endTime
      );

      console.log("🔍 Relevant transactions:", relevantTxns.length);

      allTransactions.push(
        ...relevantTxns.map(parseSolscanTransaction(address))
      );

      before = transactions[transactions.length - 1]?.tx_hash;
      shouldContinue =
        transactions.length === 40 &&
        transactions[transactions.length - 1].block_time >= startTime;
    } catch (error) {
      console.error("❌ Solscan fetch error:", {
        message: error.message,
        config: error.config,
        response: error.response?.data || "No response data",
      });
      if (error.response?.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY));
        continue;
      }
      throw error;
    }
  }

  console.log(
    "🏁 Solscan fetch completed. Total transactions:",
    allTransactions.length
  );
  return allTransactions;
};

const parseSolscanTransaction = (address) => (tx) => {
  const transfers = {
    USDC: { amount: 0, type: null },
    USDT: { amount: 0, type: null },
    SOL: { amount: 0, type: null },
  };

  console.log("\n🔍 Parsing transaction:", tx.tx_hash);
  console.log("Raw instructions:", tx.parsed_instructions);

  tx.parsed_instructions?.forEach((instr, index) => {
    console.log(`🔧 Processing instruction ${index}:`, instr);

    // Handle SPL token transfers
    if (instr.type === "transferChecked" && instr.data?.mint) {
      const token = Object.keys(TOKEN_MINTS).find(
        (k) => TOKEN_MINTS[k] === instr.data.mint
      );
      if (token) {
        const amount = parseFloat(instr.data.tokenAmount?.uiAmount || 0);
        const type = instr.data.sourceOwner === address ? "sell" : "buy";
        transfers[token] = { amount, type };
        console.log(`💰 ${token} transfer detected:`, { amount, type });
      }
    }
    // Handle native SOL transfers
    else if (instr.program === "system" && instr.type === "transfer") {
      const lamports = parseFloat(instr.data?.lamports || 0);
      const amount = lamports / 1e9;
      const type = instr.data.source === address ? "sell" : "buy";
      transfers.SOL = { amount, type };
      console.log("💰 SOL transfer detected:", { amount, type });
    }
  });

  console.log("📊 Final transfers for transaction:", transfers);
  return {
    ...tx,
    transfers,
    block_time: Number(tx.block_time),
  };
};

// --- Shyft API fetch and parser with logging ---
export const fetchShyftTransactions = async (address, startTime, endTime) => {
  let allTransactions = [];
  let beforeSignature = null;
  let retries = 0;
  let hasMore = true;

  console.log("\n🔍 Shyft fetch started");

  while (hasMore && retries < MAX_RETRIES) {
    try {
      // Add mandatory delay between requests
      if (beforeSignature) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      console.log("🔧 Shyft request params:", {
        network: "mainnet-beta",
        account: address,
        tx_num: 10, // API limit of 10 transactions per request
        ...(beforeSignature && { before_signature: beforeSignature }),
      });

      const response = await axios.get(
        "https://api.shyft.to/sol/v1/wallet/parsed_transaction_history",
        {
          params: {
            network: "mainnet-beta",
            account: address,
            tx_num: 10,
            ...(beforeSignature && { before_signature: beforeSignature }),
          },
          headers: { "x-api-key": process.env.SHYFT_API_KEY },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Handle empty response immediately
      if (!response.data?.result || response.data.result.length === 0) {
        console.log("🏁 No more transactions found");
        break;
      }

      const transactions = response.data.result
        .map(parseShyftTransaction(address))
        .filter((tx) => tx.status === "Success"); // Only process successful transactions

      console.log("📥 Received transactions:", transactions.length);

      // Process each transaction and check time boundaries
      for (const tx of transactions) {
        if (tx.block_time < startTime) {
          console.log("⏰ Reached transactions older than competition start");
          hasMore = false;
          break;
        }

        if (tx.block_time <= endTime) {
          allTransactions.push(tx);
        }
      }

      // Update pagination marker
      beforeSignature = transactions[transactions.length - 1]?.signatures?.[0];

      // Stop if we received fewer transactions than requested
      if (transactions.length < 10) {
        console.log("🏁 Reached end of transactions");
        hasMore = false;
      }

      retries = 0;
    } catch (error) {
      console.error("❌ Shyft fetch error:", error.message);
      if (error.response?.status === 429) {
        retries++;
        const delay = Math.min(2000 * retries, 10000); // Max 10s delay
        console.log(`⌛ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }

  console.log(
    "🏁 Shyft fetch completed. Total transactions:",
    allTransactions.length
  );
  return allTransactions;
};



const parseShyftTransaction = (address) => (tx) => {
  const transfers = {
    USDC: { amount: 0, type: null },
    USDT: { amount: 0, type: null },
    SOL: { amount: 0, type: null },
  };

  if (tx.status !== "Success") {
    console.log(`⚠️ Skipping failed transaction: ${tx.signatures?.[0]}`);
    return { ...tx, transfers };
  }

  tx.actions?.forEach((action) => {
    // SOL transfers
    if (action.type === "SOL_TRANSFER") {
      const amount = parseFloat(action.info?.amount || 0);
      if (action.info.sender === address) {
        transfers.SOL.amount += amount;
        transfers.SOL.type = "sell";
      } else if (action.info.receiver === address) {
        transfers.SOL.amount += amount;
        transfers.SOL.type = "buy";
      }
    }

    // Token transfers
    if (action.type === "TOKEN_TRANSFER") {
      const token = Object.keys(TOKEN_MINTS).find(
        (k) => TOKEN_MINTS[k] === action.info.token_address
      );
      if (token) {
        const amount = parseFloat(action.info?.amount || 0);
        if (action.info.sender === address) {
          transfers[token].amount += amount;
          transfers[token].type = "sell";
        } else if (action.info.receiver === address) {
          transfers[token].amount += amount;
          transfers[token].type = "buy";
        }
      }
    }

    // Swaps - Critical Fix
    if (action.type === "SWAP") {
      action.info.swaps?.forEach((swap) => {
        const inAmount = parseFloat(swap.in?.amount || 0);
        const outAmount = parseFloat(swap.out?.amount || 0);

        // Track SOL received from any swap
        if (swap.out.token_address === TOKEN_MINTS.SOL) {
          transfers.SOL.amount += outAmount;
          transfers.SOL.type = "buy";
          console.log(`🔄 SWAP: Received ${outAmount} SOL`);
        }

        // Track SOL spent in any swap
        if (swap.in.token_address === TOKEN_MINTS.SOL) {
          transfers.SOL.amount += inAmount;
          transfers.SOL.type = "sell";
          console.log(`🔄 SWAP: Sold ${inAmount} SOL`);
        }
      });
    }
  });

  return {
    ...tx,
    transfers,
    block_time: Math.floor(new Date(tx.timestamp).getTime() / 1000),
  };
};




export const calculateProfit = (transactions) => {
  console.log(
    "\n🧮 Calculating profit from transactions:",
    transactions.length
  );

  const sanitize = (num) => Number(num.toFixed(8));
  const totals = {
    USDC: { buys: 0, sells: 0 },
    USDT: { buys: 0, sells: 0 },
    SOL: { buys: 0, sells: 0 },
  };

  transactions.forEach((tx) => {
    // Skip failed transactions
    if (tx.status !== "Success" && tx.status !== 1) return;

    console.log(`\n🔍 Processing TX ${tx.tx_hash || tx.signatures?.[0]}`);
    console.log("Transfers:", tx.transfers);

    Object.entries(tx.transfers).forEach(([token, transfer]) => {
      if (!transfer.type || typeof transfer.amount !== "number") {
        console.log(`⚠️ Invalid ${token} transfer:`, transfer);
        return;
      }

      const operation = transfer.type.toLowerCase();
      if (operation === "buy") {
        totals[token].buys += transfer.amount;
        console.log(`📈 ${token} BUY ${transfer.amount}`);
      } else if (operation === "sell") {
        totals[token].sells += transfer.amount;
        console.log(`📈 ${token} SELL ${transfer.amount}`);
      }
    });
  });

  console.log("🔢 Final totals before sanitization:", totals);

  // Calculate net profits (negative values allowed)
  const result = {
    USDC: {
      buys: sanitize(totals.USDC.buys),
      sells: sanitize(totals.USDC.sells),
      net: sanitize(totals.USDC.sells - totals.USDC.buys),
    },
    USDT: {
      buys: sanitize(totals.USDT.buys),
      sells: sanitize(totals.USDT.sells),
      net: sanitize(totals.USDT.sells - totals.USDT.buys),
    },
    SOL: {
      buys: sanitize(totals.SOL.buys),
      sells: sanitize(totals.SOL.sells),
      net: sanitize(totals.SOL.sells - totals.SOL.buys), // sells - buys
    },
    total: sanitize(
      totals.USDC.sells +
        totals.USDT.sells +
        totals.SOL.sells -
        (totals.USDC.buys + totals.USDT.buys + totals.SOL.buys)
    ),
  };

  console.log("🏁 Final profit calculation:", result);
  return result;
};



// Helper function for token-specific calculations
const calculateTokenProfit = (tokenTotals) => {
  const sanitize = (num) => Number(num.toFixed(8));
  return {
    buys: sanitize(tokenTotals.buys),
    sells: sanitize(tokenTotals.sells),
    net: sanitize(tokenTotals.sells - tokenTotals.buys),
  };
};

