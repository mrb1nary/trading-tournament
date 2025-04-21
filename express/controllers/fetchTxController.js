import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SOLSCAN_API_URL = "https://pro-api.solscan.io/v2.0/account/transactions";
const SHYFT_API_URL =
  "https://api.shyft.to/sol/v1/wallet/parsed_transaction_history";
const MAX_RETRIES = 3;
const API_TIMEOUT = 15000; // 15 seconds
const TOKEN_MINTS = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  SOL: "So11111111111111111111111111111111111111112",
};

export const fetchTx = async (req, res) => {
  const { address } = req.params;
  const { contestStartTime, contestEndTime } = req.body;

  try {
    // Try Solscan first
    let transactions = await fetchSolscanTransactions(
      address,
      contestStartTime,
      contestEndTime
    );

    // Fallback to Shyft if no transactions found
    if (transactions.length === 0) {
      console.log("Falling back to Shyft API...");
      transactions = await fetchShyftTransactions(
        address,
        contestStartTime,
        contestEndTime
      );
    }

    const formatted = formatTransactions(
      transactions,
      contestStartTime,
      contestEndTime
    );

    res.json({
      success: true,
      count: formatted.length,
      transactions: formatted,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Transaction fetch failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const formatTransactions = (txns, start, end) => {
  return txns
    .filter((tx) => {
      const txTime = Number(tx.block_time);
      return txTime >= start && txTime <= end;
    })
    .map((txn, index) => ({
      index: index + 1,
      tx_hash: txn.tx_hash || txn.signatures?.[0],
      block_time: new Date(Number(txn.block_time) * 1000).toISOString(),
      fee: txn.fee,
      status: txn.status === 1 ? "Success" : "Failed",
      signer: txn.signer,
      instructions:
        txn.parsed_instructions?.map((instr) => instr.type).join(", ") || "N/A",
      transfers: txn.transfers, // Include transfer details
    }));
};

const fetchSolscanTransactions = async (address, startTime, endTime) => {
  let allTransactions = [];
  let before = null;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await axios.get(SOLSCAN_API_URL, {
        params: { address, limit: 40, before },
        headers: { Authorization: `Bearer ${process.env.SOLSCAN_API_KEY}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const transactions =
        response.data?.data?.map(parseSolscanTransaction(address)) || [];
      if (transactions.length === 0) break;

      allTransactions.push(...transactions);
      before = transactions[transactions.length - 1]?.tx_hash;

      // Stop if we've passed the contest period
      const lastTxTime = transactions[transactions.length - 1]?.block_time;
      if (lastTxTime < startTime) break;

      retries = 0;
    } catch (error) {
      if (error.response?.status === 401)
        throw new Error("Invalid Solscan API key");
      if (error.code === "ECONNABORTED") {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
        continue;
      }
      break;
    }
  }

  return allTransactions;
};

const parseSolscanTransaction = (address) => (tx) => {
  const transfers = {
    USDC: { amount: 0, type: null },
    USDT: { amount: 0, type: null },
    SOL: { amount: 0, type: null },
  };

  tx.parsed_instructions?.forEach((instr) => {
    // Handle SPL tokens
    if (instr.type === "transferChecked" && instr.data?.mint) {
      const token = Object.keys(TOKEN_MINTS).find(
        (k) => TOKEN_MINTS[k] === instr.data.mint
      );
      if (token) {
        const amount = parseFloat(instr.data.tokenAmount?.uiAmount || 0);
        const type = instr.data.sourceOwner === address ? "sell" : "buy";
        transfers[token] = { amount, type };
      }
    }
    // Handle native SOL transfers
    else if (instr.program === "system" && instr.type === "transfer") {
      const lamports = parseFloat(instr.data?.lamports || 0);
      const amount = lamports / 1e9; // Convert to SOL
      const type = instr.data.source === address ? "sell" : "buy";
      transfers.SOL = { amount, type };
    }
  });

  return {
    ...tx,
    transfers,
    block_time: Number(tx.block_time),
  };
};

const fetchShyftTransactions = async (address, startTime, endTime) => {
  let allTransactions = [];
  let beforeSignature = null;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await axios.get(SHYFT_API_URL, {
        params: {
          network: "mainnet-beta",
          account: address,
          tx_num: 50,
          before_signature: beforeSignature,
        },
        headers: { "x-api-key": process.env.SHYFT_API_KEY },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const transactions =
        response.data?.result?.map(parseShyftTransaction(address)) || [];
      const filtered = transactions.filter(
        (tx) => tx.block_time >= startTime && tx.block_time <= endTime
      );

      allTransactions.push(...filtered);
      beforeSignature = transactions[transactions.length - 1]?.signatures?.[0];
      retries = 0;
    } catch (error) {
      if (error.response?.status === 429) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        continue;
      }
      break;
    }
  }

  return allTransactions;
};

const parseShyftTransaction = (address) => (tx) => {
  const transfers = {
    USDC: { amount: 0, type: null },
    USDT: { amount: 0, type: null },
    SOL: { amount: 0, type: null },
  };

  tx.events?.forEach((event) => {
    if (event.type === "token_transfer") {
      // Handle SPL tokens
      const token = Object.keys(TOKEN_MINTS).find(
        (k) => TOKEN_MINTS[k] === event.info.mint
      );
      if (token) {
        const amount = parseFloat(event.info.amount?.uiAmount || 0);
        const type = event.info.from === address ? "sell" : "buy";
        transfers[token] = { amount, type };
      }
      // Handle native SOL transfers
      else if (event.info.mint === TOKEN_MINTS.SOL) {
        const amount = parseFloat(event.info.amount?.uiAmount || 0);
        const type = event.info.from === address ? "sell" : "buy";
        transfers.SOL = { amount, type };
      }
    }
  });

  return {
    ...tx,
    transfers,
    block_time: Math.floor(new Date(tx.timestamp).getTime() / 1000),
  };
};

export const calculateProfit = (transactions) => {
  const sanitize = (num) => Number(num.toFixed(8));
  const totals = {
    USDC: { buys: 0, sells: 0 },
    USDT: { buys: 0, sells: 0 },
    SOL: { buys: 0, sells: 0 },
  };

  transactions.forEach((tx) => {
    Object.entries(tx.transfers).forEach(([token, transfer]) => {
      if (typeof transfer.amount !== "number") return;
      totals[token][transfer.type === "buy" ? "buys" : "sells"] +=
        transfer.amount;
    });
  });

  return {
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
      net: sanitize(totals.SOL.sells - totals.SOL.buys),
    },
    total: sanitize(
      totals.USDC.sells +
        totals.USDT.sells +
        totals.SOL.sells -
        (totals.USDC.buys + totals.USDT.buys + totals.SOL.buys)
    ),
  };
};
