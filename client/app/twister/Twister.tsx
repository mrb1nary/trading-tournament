// app/twister/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ActionCards from "../components/ActionsCards";
import GameList from "../components/GameList";
import "../globals.css";
import { useWallet } from "@solana/wallet-adapter-react";

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
  category: string;
  winner: string | null;
  payout_claimed: boolean;
  participants: {
    profit: number;
    points_earned: number;
    _id: string;
  }[];
}

interface PlayerData {
  _id: string;
  player_wallet_address: string;
  twitter_handle: string;
  player_username: string;
  player_email: string;
  total_points: number;
  total_profit: number;
  competitions_played: Competition[];
}

export default function TwisterPage() {
  const { connected, publicKey } = useWallet();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const fetchPlayerData = async (address: string) => {
    if (!address || !apiUrl) return;

    try {
      const response = await axios.get(`${apiUrl}/fetchPlayer/${address}`);
      setPlayerData(response.data.data);
    } catch (error) {
      console.error("Error fetching player data:", error);
      setPlayerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      fetchPlayerData(address);
    } else {
      setPlayerData(null);
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-black">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <Navbar />
      <div className="container mx-auto px-6 py-8 relative z-10 flex flex-col items-center">
        <Hero title="Twister" subtitle="Mode" />
        <ActionCards />
        {isLoading ? (
          <div className="w-full text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            <p className="mt-2 text-white">Loading...</p>
          </div>
        ) : !connected ? (
          <div className="w-full text-center py-8 text-white">
            Please connect your wallet to view your games.
          </div>
        ) : (
          <div className="w-full">
            <GameList
              games={(playerData?.competitions_played as Competition[]) || []}
              //@ts-expect-error - playerData is not undefined
              playerData={playerData || undefined}
            />
          </div>
        )}
      </div>
    </main>
  );
}
