import { Player } from "../models/playerModel.js";
import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import { Competition } from "../models/competitionModel.js";
import {
  fetchTransactionsForWallet,
  calculateProfit,
} from "../utils/transactionsFetcher.js";
import { takeAssetSnapshot } from "../utils/snapshotService.js"; // Add this import

export const determineWinnerController = async (req, res) => {
  try {
    const { competition_id } = req.body;

    if (!competition_id) {
      return res.status(400).json({ error: "Competition ID is required" });
    }

    const competition = await Competition.findOne({
      id: Number(competition_id),
    }).populate("participants");

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    const { current_players, max_players } = competition;
    if (current_players < Math.ceil(max_players / 2)) {
      return res
        .status(400)
        .json({ error: "The competition wasn't at least half full" });
    }

    const { start_time, end_time, participants, entry_fee } = competition;

    if (!participants || participants.length === 0) {
      return res
        .status(400)
        .json({ error: "No players registered in this competition" });
    }

    const playerProfits = [];

    // Process transactions and calculate profits
    console.log("\nProcessing transactions:");
    for (const player of participants) {
      try {
        const startTimestamp = Math.floor(start_time.getTime() / 1000);
        const endTimestamp = Math.floor(end_time.getTime() / 1000);

        console.log(`\nProcessing ${player.player_wallet_address}:`);
        console.log(
          `Timeframe: ${new Date(
            startTimestamp * 1000
          ).toISOString()} - ${new Date(endTimestamp * 1000).toISOString()}`
        );

        const transactions = await fetchTransactionsForWallet(
          player.player_wallet_address,
          startTimestamp,
          endTimestamp
        );

        console.log(`Found ${transactions.length} transactions`);
        const profit = calculateProfit(transactions);
        console.log(`Calculated profit: ${profit}`);

        playerProfits.push({
          player_wallet_address: player.player_wallet_address,
          player_username: player.player_username,
          profit,
        });
      } catch (error) {
        console.error(
          `Error processing ${player.player_wallet_address}:`,
          error.message
        );
      }
    }

    const winner = playerProfits.reduce(
      (max, player) => (player.profit > max.profit ? player : max),
      { profit: -Infinity }
    );

    if (!winner || winner.profit === -Infinity) {
      return res
        .status(400)
        .json({ error: "No valid transactions found to determine a winner" });
    }

    const totalParticipants = participants.length;
    const totalPool = entry_fee * totalParticipants;
    const platformFee = entry_fee;
    const winnerPrize = totalPool - platformFee;

    competition.winner = winner.player_wallet_address;
    competition.winning_amount = winnerPrize;
    await competition.save();

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
