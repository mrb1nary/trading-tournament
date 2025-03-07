import { Player } from "../models/playerModel.js";
import { Competition } from "../models/competitionModel.js";
import {
  fetchTransactionsForWallet,
  calculateProfit,
} from "../utils/transactionsFetcher.js";

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

    // Check if the competition is at least 50% full
    const { current_players, max_players } = competition;
    if (current_players < Math.ceil(max_players / 2)) {
      return res
        .status(400)
        .json({ error: "The competition wasn't at least half full" });
    }

    // Extract relevant data from the competition
    const { start_time, end_time, participants, entry_fee } = competition;

    if (!participants || participants.length === 0) {
      return res
        .status(400)
        .json({ error: "No players registered in this competition" });
    }

    // Initialize an array to store player profits
    const playerProfits = [];

    // Iterate over all participants and fetch their transaction details
    for (const player of participants) {
      try {
        // Convert start_time and end_time to UNIX timestamps (seconds)
        const startTimestamp = Math.floor(start_time.getTime() / 1000);
        const endTimestamp = Math.floor(end_time.getTime() / 1000);

        console.log(
          `Using timestamp range: ${startTimestamp} to ${endTimestamp}`
        );
        console.log(
          `Start time: ${new Date(startTimestamp * 1000).toISOString()}`
        );
        console.log(`End time: ${new Date(endTimestamp * 1000).toISOString()}`);

        // Use our utility function that handles API selection
        const transactions = await fetchTransactionsForWallet(
          player.player_wallet_address,
          startTimestamp,
          endTimestamp
        );

        console.log(
          `Transactions for wallet ${player.player_wallet_address}:`,
          transactions.length
        );

        // Calculate profit using our utility function
        const profit = calculateProfit(transactions);

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
          `Error processing transactions for wallet ${player.player_wallet_address}:`,
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

    // Calculate the financial distribution
    // Total pool is the entry fee multiplied by the number of participants
    const totalParticipants = participants.length;
    const totalPool = entry_fee * totalParticipants;

    // Platform fee is one player's entry fee
    const platformFee = entry_fee;

    // Winner's prize is the total pool minus the platform fee
    const winnerPrize = totalPool - platformFee;

    // Update the competition with the winner's wallet address and financial details
    competition.winner = winner.player_wallet_address;
    competition.winning_amount = winnerPrize;
    await competition.save();

    // Respond with the winner details and financial information
    res.status(200).json({
      message: "Winner determined successfully",
      winner,
      competition_id,
      financial_details: {
        total_pool: totalPool,
        platform_fee: platformFee,
        winner_prize: winnerPrize,
      },
    });
  } catch (error) {
    console.error("Error determining winner:", error);
    res
      .status(500)
      .json({ error: "Failed to determine winner", details: error.message });
  }
};
