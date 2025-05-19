"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import CompetitionComponent from "./CompetitionComponent";
import VersusComponent from "./VersusComponent";
import Hero from "@/app/components/Hero";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

function Tabs() {
  const wallet = useWallet();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  const [versusGames, setVersusGames] = useState<Competition[]>([]);
  const [loadingVersus, setLoadingVersus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"competitions" | "versus">(
    "competitions"
  );

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchVersus();
    }
    // eslint-disable-next-line
  }, [wallet.connected, wallet.publicKey]);

  const fetchVersus = async () => {
    setLoadingVersus(true);
    setError(null);
    try {
      const response = await axios.post<{ success: boolean; data: any[] }>(
        `${apiUrl}/fetchVersus`,
        {}
      );
      if (response.data.success) {
        const transformedVersus: Competition[] = (response.data.data || []).map(
          (game) => ({
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
            category: "Versus",
            winner: game.winner,
            payout_claimed: false,
            active: game.status === "active",
            participants: (game.participants || []).map((p: any) => p.wallet),
            code: game.versus_id.toString(),
          })
        );
        setVersusGames(transformedVersus);
      } else {
        setError("Failed to fetch versus games");
      }
    } catch (err) {
      setError("Error fetching versus games");
      console.error(err);
    } finally {
      setLoadingVersus(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Hero title="My" subtitle="Games" />

        <div className="mb-6 flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "competitions"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("competitions")}
          >
            Competitions
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "versus"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("versus")}
          >
            Versus
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-500 font-semibold">{error}</div>
        )}

        {activeTab === "competitions" && <CompetitionComponent />}

        {activeTab === "versus" && (
          <>
            {loadingVersus ? (
              <div className="text-center py-12 text-gray-400">
                Loading versus games...
              </div>
            ) : (
              <VersusComponent games={versusGames} />
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </main>
  );
}

export default Tabs;
