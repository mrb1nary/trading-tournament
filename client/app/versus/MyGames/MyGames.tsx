"use client";

import React, { useEffect, useState } from "react";
import GameList from "../../components/GameList";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import Navbar from "@/app/components/Navbar";
import Hero from "@/app/components/Hero";


interface VersusGame {
  versus_id: number;
  start_time: string;
  end_time: string;
  entry_fee: number;
  base_amount: number;
  prize_pool: number;
  participants: Array<{ username: string; wallet: string }>;
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
  category: "Versus";
  winner: string | null;
  payout_claimed: boolean;
  active: boolean;
  participants: string[];
  code?: string;
}

function MyGamesComponent() {
  const [games, setGames] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchMyGames();
    }
  }, [wallet.connected, wallet.publicKey]);

  const fetchMyGames = async () => {
    try {
      setLoading(true);
      const response = await axios.post<{
        success: boolean;
        data: VersusGame[];
      }>(`${apiUrl}/fetchVersus`, {
        wallet_address: wallet.publicKey?.toString() ?? "",
      });

      if (response.data.success) {
        const transformedGames = response.data.data
          .map((game) => ({
            _id: game.versus_id.toString(),
            authority: "",
            id: game.versus_id,
            max_players: game.participants.length,
            current_players: game.participants.length,
            entry_fee: game.entry_fee,
            base_amount: game.base_amount,
            start_time: new Date(game.start_time).toISOString(),
            end_time: new Date(game.end_time).toISOString(),
            winning_amount: game.prize_pool,
            category: "Versus" as const,
            winner: game.winner,
            payout_claimed: false,
            active: game.status === "active",
            participants: game.participants.map((p) => p.wallet),
            code: game.versus_id.toString(),
          }))
          .sort(
            (a, b) =>
              new Date(b.start_time).getTime() -
              new Date(a.start_time).getTime()
          );

        setGames(transformedGames);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Error fetching your games");
    } finally {
      setLoading(false);
    }
  };

  const playerData = wallet.connected
    ? {
        _id: wallet.publicKey?.toString() ?? "",
        code: games[0]?.code,
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
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
