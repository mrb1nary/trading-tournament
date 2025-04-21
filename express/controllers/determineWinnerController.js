import { Player } from "../models/playerModel.js";
import { Competition } from "../models/competitionModel.js";
import {
  fetchTransactionsForWallet,
  calculateProfit,
} from "../utils/transactionsFetcher.js";

export const determineWinnerController = async (req, res) => {
  try {
    const { competition_id } = req.body;
    console.log("\n🚀 STARTING WINNER DETERMINATION PROCESS");

    // Validate input
    if (!competition_id) {
      return res.status(400).json({ error: "Competition ID is required" });
    }

    // Fetch competition with population
    const competition = await Competition.findOne({
      id: Number(competition_id),
    })
      .populate({
        path: "participants",
        select: "player_wallet_address player_username competitions_played",
        model: "Player",
      })
      .lean();

    if (!competition) {
      return res.status(404).json({ error: "Competition not found" });
    }

    // Validate participants
    if (!Array.isArray(competition.participants)) {
      return res.status(400).json({ error: "Invalid participants data" });
    }

    console.log(
      `\n🎯 Processing ${competition.participants.length} participants`
    );

    const { start_time, end_time, participants, entry_fee } = competition;
    const playerProfits = [];
    const competitionStart = Math.floor(start_time.getTime() / 1000);
    const competitionEnd = Math.floor(end_time.getTime() / 1000);

    // Process each participant
    for (const player of participants) {
      try {
        if (!player?.player_wallet_address) {
          console.log("⚠️ Skipping invalid player structure");
          continue;
        }

        console.log(`\n🔍 Processing ${player.player_wallet_address}`);

        // Find or create competition entry
        let competitionStats = player.competitions_played.find(
          (cp) => cp.competition.toString() === competition._id.toString()
        );

        if (!competitionStats) {
          console.log("⚡ Creating new competition entry");
          competitionStats = {
            competition: competition._id,
            entry_fee: competition.entry_fee,
            profits: {
              USDC: { buys: 0, sells: 0, net: 0 },
              USDT: { buys: 0, sells: 0, net: 0 },
              SOL: { buys: 0, sells: 0, net: 0 }, // Added SOL tracking
              total: 0,
            },
            points_earned: 0,
          };
          player.competitions_played.push(competitionStats);
        }

        // Fetch and process transactions
        console.log(
          `⏳ Fetching transactions (${new Date(
            competitionStart * 1000
          ).toISOString()} - ${new Date(competitionEnd * 1000).toISOString()})`
        );

        const transactions = await fetchTransactionsForWallet(
          player.player_wallet_address,
          competitionStart,
          competitionEnd
        );

        console.log(`📊 Found ${transactions.length} transactions`);

        const profit = calculateProfit(transactions);
        console.log("💰 Profit breakdown:", JSON.stringify(profit, null, 2));

        // Update player stats with token-specific profits
        competitionStats.profits = {
          USDC: profit.USDC,
          USDT: profit.USDT,
          SOL: profit.SOL, // Added SOL profits
          total: profit.total,
        };

        const updatedPlayer = await Player.findByIdAndUpdate(
          player._id,
          { $set: { competitions_played: player.competitions_played } },
          { new: true }
        );

        playerProfits.push({
          playerId: updatedPlayer._id,
          wallet: updatedPlayer.player_wallet_address,
          username: updatedPlayer.player_username,
          profit: profit.total,
          details: profit,
        });
      } catch (error) {
        console.error(`❌ Error processing player: ${error.message}`);
        if (error.response) console.error("API Error:", error.response.data);
      }
    }

    // Determine winner
    if (playerProfits.length === 0) {
      return res.status(400).json({ error: "No valid transactions found" });
    }

    const winner = playerProfits.reduce(
      (max, current) => (current.profit > max.profit ? current : max),
      { profit: -Infinity }
    );

    // Update competition
    const updatedCompetition = await Competition.findByIdAndUpdate(
      competition._id,
      {
        winner: winner.playerId,
        winning_amount: entry_fee * participants.length - entry_fee,
        payout_claimed: false,
      },
      { new: true }
    );

    console.log("\n🏆 FINAL RESULTS");
    console.log({
      Winner: winner.wallet,
      "Total Profit": winner.profit,
      "Winning Amount": updatedCompetition.winning_amount,
      "Profit Breakdown": winner.details,
    });

    res.status(200).json({
      message: "Winner determined successfully",
      winner: {
        wallet: winner.wallet,
        username: winner.username,
        total_profit: winner.profit,
        profit_breakdown: {
          USDC: winner.details.USDC,
          USDT: winner.details.USDT,
          SOL: winner.details.SOL, // Added SOL breakdown
        },
      },
      financials: {
        total_pool: entry_fee * participants.length,
        platform_fee: entry_fee,
        winner_prize: updatedCompetition.winning_amount,
      },
    });
  } catch (error) {
    console.error("\n💥 CRITICAL ERROR:", error);
    res.status(500).json({
      error: "Winner determination failed",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Check server logs",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};
