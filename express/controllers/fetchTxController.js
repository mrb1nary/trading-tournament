import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const fetchTx = async (req, res) => {
  const address = req.params.address;
  const contestStartTime = req.body.contestStartTime;
  const contestEndTime = req.body.contestEndTime;
  let allTransactions = [];
  let before = null;
  let shouldContinueFetching = true;

  try {
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

      if (response.data && response.data.data) {
        const transactions = response.data.data;

        if (transactions.length === 0) {
          break; // No more transactions, exit loop
        }

        // Check the timestamp of the last transaction
        const lastTransaction = transactions[transactions.length - 1];
        const lastTransactionTime = lastTransaction.block_time;

        if (lastTransactionTime <= contestEndTime) {
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
    allTransactions = allTransactions.filter(
      (transaction) =>
        transaction.block_time >= contestStartTime &&
        transaction.block_time <= contestEndTime
    );

    console.log(
      allTransactions.map((txn, index) => ({
        index: index + 1,
        tx_hash: txn.tx_hash,
        block_time: new Date(txn.block_time * 1000).toISOString(), // Convert UNIX timestamp to readable date
        fee: txn.fee,
        status: txn.status,
        signer: txn.signer,
        instructions: txn.parsed_instructions
          .map((instr) => instr.type)
          .join(", "), // List instruction types
      }))
    );

    res.json({ transactions: allTransactions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching transactions");
  }
};
