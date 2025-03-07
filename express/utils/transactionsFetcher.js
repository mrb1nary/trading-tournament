import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Attempts to fetch transactions using the Solscan API first, and falls back to Shyft API if necessary
 * @param {string} address - The wallet address to fetch transactions for
 * @param {number} startTime - The UNIX timestamp for the start of the period
 * @param {number} endTime - The UNIX timestamp for the end of the period
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const fetchTransactionsForWallet = async (
  address,
  startTime,
  endTime
) => {
  try {
    // Try Solscan API first
    const solscanTransactions = await fetchSolscanTransactions(
      address,
      startTime,
      endTime
    );
    return solscanTransactions;
  } catch (error) {
    console.log(
      `Solscan API failed: ${error.message}. Falling back to Shyft API...`
    );
    // Fall back to Shyft API if Solscan fails
    return await fetchShyftTransactions(address, startTime, endTime);
  }
};

/**
 * Fetches transactions using the Solscan API
 * @param {string} address - The wallet address to fetch transactions for
 * @param {number} startTime - The UNIX timestamp for the start of the period
 * @param {number} endTime - The UNIX timestamp for the end of the period
 * @returns {Promise<Array>} - Array of transaction objects
 */
const fetchSolscanTransactions = async (address, startTime, endTime) => {
  let allTransactions = [];
  let before = null;
  let shouldContinueFetching = true;

  while (shouldContinueFetching) {
    const requestOptions = {
      method: "get",
      url: "https://pro-api.solscan.io/v2.0/account/transactions",
      params: {
        address: address,
        limit: "40",
        ...(before && { before }),
      },
      headers: {
        token: process.env.SOLSCAN_API_KEY,
      },
    };

    const response = await axios.request(requestOptions);

    // Check for error responses that might indicate API limit reached
    if (response.status !== 200 || (response.data && response.data.error)) {
      throw new Error(
        `Solscan API error: ${response.data?.error || response.statusText}`
      );
    }

    if (response.data && response.data.data) {
      const transactions = response.data.data;

      if (transactions.length === 0) {
        break; // No more transactions, exit loop
      }

      // Check the timestamp of the last transaction
      const lastTransaction = transactions[transactions.length - 1];
      const lastTransactionTime = lastTransaction.block_time;

      if (lastTransactionTime <= endTime) {
        // Continue fetching only if the last transaction is within the contest period
        allTransactions = [...allTransactions, ...transactions];
        before = lastTransaction.tx_hash;

        if (transactions.length < 40) {
          shouldContinueFetching = false; // Less than 40 transactions, likely the end
        }
      } else {
        // Last transaction exceeds contest end time, stop fetching
        shouldContinueFetching = false;
      }
    } else {
      break;
    }
  }

  // Filter transactions based on start and end times
  return allTransactions.filter(
    (transaction) =>
      transaction.block_time >= startTime && transaction.block_time <= endTime
  );
};

/**
 * Fetches transactions using the Shyft API
 * @param {string} address - The wallet address to fetch transactions for
 * @param {number} startTime - The UNIX timestamp for the start of the period
 * @param {number} endTime - The UNIX timestamp for the end of the period
 * @returns {Promise<Array>} - Array of transaction objects formatted similarly to Solscan API
 */
const fetchShyftTransactions = async (address, startTime, endTime) => {
  let allTransactions = [];
  let beforeSignature = null;
  let hasMoreTransactions = true;
  const txNum = 10; // Maximum number of transactions per request
  const maxRetries = 3; // Maximum number of retries
  let retryDelay = 1000; // Initial delay in milliseconds

  console.log(
    `Fetching Shyft transactions for ${address} between timestamps ${startTime} and ${endTime}`
  );
  console.log(
    `Date range: ${new Date(startTime * 1000).toISOString()} to ${new Date(
      endTime * 1000
    ).toISOString()}`
  );

  while (hasMoreTransactions) {
    try {
      // Build URL with pagination if needed
      const params = {
        network: "mainnet-beta",
        account: address,
        tx_num: txNum,
      };

      if (beforeSignature) {
        params.before_signature = beforeSignature;
      }

      const response = await axios({
        method: "get",
        url: "https://api.shyft.to/sol/v1/wallet/parsed_transaction_history",
        params: params,
        headers: {
          accept: "application/json",
          "x-api-key": process.env.SHYFT_API_KEY,
        },
      });

      if (!response.data || !response.data.success) {
        console.error("API response error:", response.data);
        throw new Error(
          `Shyft API error: ${response.data?.message || "Unknown error"}`
        );
      }

      const transactions = response.data.result || [];
      console.log(`Fetched batch of ${transactions.length} transactions`);

      if (transactions.length === 0) {
        break; // No more transactions
      }

      // Process each transaction
      for (const tx of transactions) {
        // Convert ISO timestamp to UNIX timestamp (seconds)
        const txTime = Math.floor(new Date(tx.timestamp).getTime() / 1000);

        // Check if transaction is within our time range
        if (txTime >= startTime && txTime <= endTime) {
          console.log(
            `Transaction ${tx.signatures[0]} in time range (${txTime})`
          );
          allTransactions.push({
            tx_hash: tx.signatures[0],
            block_time: txTime,
            status: tx.status,
            fee: tx.fee || 0,
            // Add other fields as needed
          });
        } else if (txTime < startTime) {
          console.log(
            `Transaction ${tx.signatures[0]} before start time (${txTime} < ${startTime})`
          );
          hasMoreTransactions = false;
          break;
        } else {
          console.log(
            `Transaction ${tx.signatures[0]} after end time (${txTime} > ${endTime})`
          );
        }
      }

      // Set up pagination for next request if needed
      if (transactions.length === txNum && hasMoreTransactions) {
        beforeSignature = transactions[transactions.length - 1].signatures[0];
        console.log(
          `Setting up pagination with before_signature: ${beforeSignature}`
        );
      } else {
        hasMoreTransactions = false;
      }
    } catch (error) {
      console.error(`Error fetching Shyft transactions: ${error.message}`);
      if (error.response) {
        console.error(`Response data:`, error.response.data);
        console.error(`Response status:`, error.response.status);

        // Check for rate limit error (429) and implement retry logic
        if (error.response.status === 429) {
          console.log(`Rate limit hit. Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          if (retryDelay < 10000) {
            retryDelay *= 2; // Exponential backoff, up to 10 seconds
          }
          continue; // Retry the request
        }
      }
      hasMoreTransactions = false; // Exit loop on other errors
    }
    break; // Break out of the while loop if successful
  }

  console.log(
    `Total transactions found for ${address}: ${allTransactions.length}`
  );
  return allTransactions;
};


/**
 * Processes transactions to calculate profit
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} - The calculated profit
 */
export const calculateProfit = (transactions) => {
  let profit = 0;

  transactions.forEach((txn) => {
    // Include only successful transactions in profit calculation
    if (txn.status === "Success") {
      profit += txn.fee; // Add fee as part of profit calculation (if applicable)
    }
  });

  return profit;
};
