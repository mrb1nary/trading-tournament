import { Player } from "../models/playerModel.js";
import { Competition } from "../models/competitionModel.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const determineWinnerController = async (req, res) => {
  try {
    // Extract competition ID from request body
    const { competition_id } = req.body;

    // Validate competition ID
    if (!competition_id) {
      return res.status(400).json({ error: "Competition ID is required" });
    }

    // Fetch the competition details
    const competition = await Competition.findOne({
      id: Number(competition_id),
    }).populate("participants");
    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Extract start and end times for the competition
    const { start_time, end_time, participants } = competition;

    if (!participants || participants.length === 0) {
      return res
        .status(400)
        .json({ error: "No players registered in this competition" });
    }

    // Initialize an array to store player profits
    const playerProfits = [];

    // Helper function to fetch transactions for a wallet
    const fetchTransactions = async (
      address,
      contestStartTime,
      contestEndTime
    ) => {
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
      return allTransactions.filter(
        (transaction) =>
          transaction.block_time >= contestStartTime &&
          transaction.block_time <= contestEndTime
      );
    };

    // Iterate over all participants and fetch their transaction details
    for (const player of participants) {
      try {
        const transactions = await fetchTransactions(
          player.player_wallet_address,
          Math.floor(new Date(start_time).getTime() / 1000), // Convert to UNIX timestamp
          Math.floor(new Date(end_time).getTime() / 1000)
        );

        console.log(
          `Transactions for wallet ${player.player_wallet_address}:`,
          transactions
        );

        // Calculate profit for the player based on transactions
        let profit = 0;
        transactions.forEach((txn) => {
          console.log(`Processing transaction ${txn.tx_hash}:`, txn);
          //For each transaction, give profit if it was success, take profit if failed
          if (txn.status === "Success") {
            profit += txn.fee;
          } else {
            profit -= txn.fee;
          }
        });

        console.log(
          `Profit for wallet ${player.player_wallet_address}: ${profit}`
        );

        // Push the player's profit to the array
        playerProfits.push({
          player_wallet_address: player.player_wallet_address,
          player_username: player.player_username,
          profit,
        });
      } catch (error) {
        console.error(
          `Error fetching transactions for wallet ${player.player_wallet_address}:`,
          error.message
        );
      }
    }

    // Determine the winner based on the highest profit
    const winner = playerProfits.reduce(
      (max, player) => (player.profit > max.profit ? player : max),
      { profit: -Infinity }
    );

    if (!winner || winner.profit === -Infinity) {
      return res
        .status(400)
        .json({ error: "No valid transactions found to determine a winner" });
    }

    // Update the competition with the winner's wallet address
    competition.winner = winner.player_wallet_address;
    await competition.save();

    // Respond with the winner details
    res.status(200).json({
      message: "Winner determined successfully",
      winner,
      competition_id,
    });
  } catch (error) {
    console.error("Error determining winner:", error);
    res
      .status(500)
      .json({ error: "Failed to determine winner", details: error.message });
  }
};
