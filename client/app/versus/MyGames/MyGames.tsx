"use client";

import React, { useEffect, useState } from "react";
import GameList from "../../components/GameList";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import Navbar from "@/app/components/Navbar";
import Hero from "@/app/components/Hero";

interface Participant {
  username: string;
  wallet: string;
}

interface VersusGame {
  versus_id: number;
  start_time: string;
  end_time: string;
  entry_fee: number;
  base_amount: number;
  prize_pool: number;
  participants: Participant[];
  status: string;
  winner: string | null;
}

interface Competition {
  _id: string;
  authority: string;
  id: number;
  max_players: number;
  current_players: number;
  entry_fee: number;
  base_amount: number;
  start_time: string;
  end_time: string;
  winning_amount: number;
  category:
    | "TwoPlayers"
    | "SixPlayers"
    | "TwelvePlayers"
    | "TwentyFivePlayers"
    | "Versus";
  winner: string | null;
  payout_claimed: boolean;
  active: boolean;
  participants: string[];
  code?: string;
}

interface PlayerData {
  _id: string;
  code?: string;
  [key: string]: unknown; // Add index signature to match GameListProps
}

function MyGamesComponent() {
  const [games, setGames] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const wallet = useWallet();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    // Only fetch games if wallet is connected
    if (wallet.connected && wallet.publicKey) {
      fetchMyGames();
    }
  }, [wallet.connected, wallet.publicKey]);

  const fetchMyGames = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await axios.post<{
        success: boolean;
        data: VersusGame[];
      }>(`${apiUrl}/fetchVersus`, {
        wallet_address: wallet.publicKey?.toString() ?? "",
      });

      if (response.data.success) {
        // Transform the versus data to match the Competition interface
        const transformedGames: Competition[] = response.data.data.map(
          (game) => {
            // Fix date handling
            const fixDate = (dateStr: string): string => {
              const date = new Date(dateStr);
              // If year is 1970, create a new date
              if (date.getFullYear() === 1970) {
                const now = new Date();
                return now.toISOString();
              }
              return dateStr;
            };

            // Set start time to now and end time to 3 minutes later if dates are from 1970
            const startTime = fixDate(game.start_time);
            let endTime = fixDate(game.end_time);

            // Ensure end time is after start time
            if (new Date(endTime) <= new Date(startTime)) {
              const startDate = new Date(startTime);
              const endDate = new Date(startDate);
              endDate.setMinutes(startDate.getMinutes() + 3);
              endTime = endDate.toISOString();
            }

            return {
              _id: game.versus_id.toString(),
              authority: "",
              id: game.versus_id,
              max_players: game.participants.length,
              current_players: game.participants.length,
              entry_fee: game.entry_fee * 1000000, // Convert SOL to lamports
              base_amount: game.base_amount, // Use the base_amount from response (in USDT)
              start_time: startTime,
              end_time: endTime,
              winning_amount: game.prize_pool * 1000000, // Convert SOL to lamports
              category: "Versus", // Use "Versus" instead of "TwoPlayers"
              winner: game.winner,
              payout_claimed: false,
              active: game.status === "active",
              participants: game.participants.map((p) => p.wallet),
              code: game.versus_id.toString(), // Add the versus_id as a code property
            };
          }
        );

        setGames(transformedGames);
      } else {
        toast.error("Failed to fetch games");
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Error fetching your games");
    } finally {
      setLoading(false);
    }
  };

  // Create player data object with current wallet
  const playerData: PlayerData | undefined = wallet.connected
    ? {
        _id: wallet.publicKey?.toString() ?? "",
        code: games.length > 0 ? games[0].code : undefined, // Optionally include the code from the first game
      }
    : undefined;

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <div className="relative z-10">
        <Navbar />
        <Hero title="My" subtitle="Games" />
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <GameList games={games} playerData={playerData} />
          )}
        </div>
      </div>
    </main>
  );
}

export default MyGamesComponent;
