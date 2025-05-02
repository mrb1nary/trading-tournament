/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
// import MyCompetitionTable from "../components/MyCompetitionTable";
import { useRouter } from "next/navigation";
import "../globals.css";
import { useWallet } from "@solana/wallet-adapter-react";
import GameList from "../components/GameList";

interface Competition {
  _id: string;
  authority: string;
  id: number;
  max_players: number;
  current_players: number;
  entry_fee: number;
  base_amount: number;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  winning_amount: number;
  category: "TwoPlayers" | "SixPlayers" | "TwelvePlayers" | "TwentyFivePlayers";
  winner: string | null; // Player ID
  payout_claimed: boolean;
  active: boolean;
  participants: string[]; // Array of Player IDs
}
// interface Competition {
//   id: number;
//   start: string;
//   end: string;
//   time: string;
//   players: number;
//   timeLeft: string;
// }

// interface PlayerData {
//   _id: string;
//   player_wallet_address: string;
//   twitter_handle: string;
//   player_username: string;
//   player_email: string;
//   total_points: number;
//   total_profit: number;
//   competitions_played: ApiCompetition[];
// }

interface PlayerData {
  id: string;
  player_wallet_address: string;
  twitter_handle: string;
  player_username: string;
  tg_username: string;
  player_email: string;
  total_points: number;
  total_profit: number;
  competitions_played: unknown[];
}

export default function CompetitionMode() {
  const [activeTab, setActiveTab] = useState("12 players");
  const router = useRouter();

  const [playerData, setPlayerData] = useState<null | {
    _id: string;
    wallet: string;
    username: string;
    email: string;
    twitter: string;
    telegram: string;
    total_profit: number;
    total_points: number;
    total_competitions: number;
    usdc_profit: number;
    usdt_profit: number;
    sol_profit: number;
    win_rate: number;
    total_trades: number;
    average_position: number;
    competitions: Array<{
      competition_id: string;
      category: string;
      entry_fee: number;
      prize_pool: number;
      max_players: number;
      position: number;
      profit: number;
      points_earned: number;
      timeframe: {
        start: string;
        end: string;
      };
      winner: string | null;
    }>;
  }>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  // Tabs data
  const tabs = ["Special", "6 players", "12 players", "25 players"];

  // Function to get cards based on active tab
  const getCardsForTab = (tab: string) => {
    if (tab === "6 players") {
      return [
        {
          cashPrize: "0.25 SOL",
          entryToPlay: "0.055 SOL",
          baseAmount: "10 USDT",
          route: "10",
        },
        {
          cashPrize: "0.5 SOL",
          entryToPlay: "0.1 SOL",
          baseAmount: "25 USDT",
          route: "25",
        },
        {
          cashPrize: "1 SOL",
          entryToPlay: "0.2 SOL",
          baseAmount: "50 USDT",
          route: "50",
        },
      ];
    } else if (tab === "12 players") {
      return [
        {
          cashPrize: "0.5 SOL",
          entryToPlay: "0.055 SOL",
          baseAmount: "10 USDT",
          route: "10",
        },
        {
          cashPrize: "1 SOL",
          entryToPlay: "0.1 SOL",
          baseAmount: "25 USDT",
          route: "25",
        },
        {
          cashPrize: "2 SOL",
          entryToPlay: "0.2 SOL",
          baseAmount: "50 USDT",
          route: "50",
        },
      ];
    } else {
      // Return an empty array for tabs that are not implemented
      return [];
    }
  };

  const { connected, publicKey } = useWallet();

  // Function to fetch player data from API
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

  // Fetch player data when component mounts or wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      fetchPlayerData(address);
    } else {
      setPlayerData(null);
      setIsLoading(false);
    }
  }, [connected, publicKey, apiUrl]);

  // Function to handle card click
  interface Card {
    cashPrize: string;
    entryToPlay: string;
    baseAmount: string;
    route: string;
  }

  const handleCardClick = (card: Card) => {
    let prefix = "";

    if (activeTab === "Special") {
      prefix = "special";
    } else {
      // Extract the number from the active tab (e.g., "6 players" -> "6p")
      const playerCount = activeTab.split(" ")[0];
      prefix = `${playerCount}p`;
    }

    // Navigate to the appropriate route
    router.push(`/category/${prefix}${card.route}`);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white ">
      {/* Green circle gradient positioned off-screen */}
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      {/* Navbar and Title */}
      <div className="relative z-10">
        <Navbar />
        <Hero title="Competition" subtitle="Mode" />
      </div>

      {/* Competition Content */}
      <div className="relative z-10 mt-10 max-w-5xl mx-auto px-4">
        {/* Tabs */}
        <div className="grid grid-cols-4 gap-6 mb-8 border-b-2 border-gray-700 ">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`group relative px-2 py-1 text-xl font-bold transition-all duration-300 ease-in-out transform ${
                activeTab === tab
                  ? "text-[#29664A] border-b-2 border-[#29664A]"
                  : "text-gray-400 hover:text-white hover:scale-105"
              }`}
            >
              {tab}
              {/* Animated hover underline for inactive tabs */}
              {activeTab !== tab && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:w-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === "Special" || activeTab === "25 players" ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-7xl font-extrabold animate-pulse text-gray-400 mb-4">
              🚧
            </div>
            <div className="text-5xl font-bold text-gray-400 animate-bounce mb-4">
              Coming Soon!
            </div>
            <div className="text-3xl font-medium text-gray-400 animate-fadeIn">
              Stay tuned for exciting updates!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 items-center">
            {getCardsForTab(activeTab).map((card, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(card)}
                className="bg-[linear-gradient(145deg,_#1e2427_0%,_#121518_100%)] rounded-2xl shadow-lg p-6 text-center relative flex flex-col justify-between 
h-[380px] opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105 hover:bg-[#2a2a2a] cursor-pointer"
              >
                {/* Flower SVG with Cash Prize Inside */}
                <div className="relative mx-auto mb-[-10rem] mt-[-2rem]">
                  <img
                    src="/assets/bigFlower.svg"
                    alt="Flower"
                    className="w-[300px] h-[300px] mx-auto transition-transform duration-300 hover:-rotate-[3deg]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-white text-lg font-bold">
                      Cashprize
                    </div>
                    <div className="text-yellow-400 text-xl font-bold hover:text-yellow-300 transition-colors duration-300">
                      {card.cashPrize}
                    </div>
                  </div>
                </div>

                {/* Card Content Below Flower SVG */}
                <div className="text-gray-300 text-sm space-y-2">
                  <div>
                    Entry to play:
                    <span className="font-medium"> {card.entryToPlay}</span>
                  </div>
                  <div>
                    Base Amount:
                    <span className="font-medium"> {card.baseAmount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Text */}
        <div className="mt-10 text-center text-gray-400 text-sm px-4">
          Entry to play refers to the amount you need to pay to join the game.
          Base Amount is the amount you need in your wallet to participate.
        </div>
      </div>

      <div className="w-[90%] max-w-[90%] mx-auto">
        <GameList
          games={
            playerData?.competitions?.map((comp) => ({
              _id: comp.competition_id,
              authority: "",
              id: 0,
              max_players: comp.max_players,
              current_players: 0,
              entry_fee: comp.entry_fee,
              base_amount: 0,
              start_time: comp.timeframe.start,
              end_time: comp.timeframe.end,
              winning_amount: comp.prize_pool,
              category: comp.category as Competition["category"],
              winner: comp.winner,
              payout_claimed: false,
              active: false,
              participants: [],
            })) || []
          }
          playerData={playerData || undefined}
        />
      </div>
    </main>
  );
}
