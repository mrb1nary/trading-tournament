"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import GameList from "../components/GameList";
import "../globals.css";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function VersusPage() {
  const { connected, publicKey } = useWallet();
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const router = useRouter();
  const pathname = usePathname();

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
      fetchPlayerData(publicKey.toBase58());
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
        <Hero title="Versus" subtitle="Mode" />

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 px-4 max-w-5xl mx-auto">
          {/* Create a Party */}
          <div
            onClick={() => router.push(`${pathname}/createGame`)}
            className="rounded-2xl p-10 text-center flex flex-col items-center justify-center hover:opacity-80 transition cursor-pointer aspect-square w-full max-w-sm mx-auto opacity-90 relative"
            style={{
              background: "linear-gradient(145deg, #1E2427 0%, #121518 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Help icon with tooltip */}
            <div className="absolute top-4 right-4 group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400 hover:text-green-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute hidden group-hover:block right-0 bg-gray-800 text-white p-2 rounded shadow-lg z-10 w-64 text-center">
                Enter details to create a party
              </div>
            </div>

            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="mb-6">
                  <Image
                    src="/assets/createIcon.png"
                    alt="Create a party"
                    width={320}
                    height={320}
                    className="object-contain"
                  />
                </div>
                <h3 className="text-white text-xl font-normal">
                  Create a party
                </h3>
              </div>
            </div>
          </div>

          {/* Join a Game */}
          <div
            className="rounded-2xl p-10 text-center flex flex-col items-center justify-center hover:opacity-80 transition cursor-pointer aspect-square w-full max-w-sm mx-auto opacity-90 relative"
            style={{
              background: "linear-gradient(145deg, #1E2427 0%, #121518 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Help icon with tooltip */}
            <div className="absolute top-4 right-4 group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400 hover:text-green-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute hidden group-hover:block right-0 bg-gray-800 text-white p-2 rounded shadow-lg z-10 w-64 text-center">
                Someone shared a invite code with you? Enter it here!
              </div>
            </div>

            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="mb-6">
                  <Image
                    src="/assets/joinIcon.png"
                    alt="Join a game"
                    width={320}
                    height={320}
                    className="object-contain"
                  />
                </div>
                <h3 className="text-white text-xl font-normal">Join a game</h3>
              </div>
            </div>
          </div>

          {/* My Parties */}
          <div
            className="rounded-2xl p-10 text-center flex flex-col items-center justify-center hover:opacity-80 transition cursor-pointer aspect-square w-full max-w-sm mx-auto opacity-90 relative"
            style={{
              background: "linear-gradient(145deg, #1E2427 0%, #121518 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Help icon with tooltip */}
            <div className="absolute top-4 right-4 group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400 hover:text-green-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute hidden group-hover:block right-0 bg-gray-800 text-white p-2 rounded shadow-lg z-10 w-64 text-center">
                A list of all the parties you have joined
              </div>
            </div>

            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="mb-6">
                  <Image
                    src="/assets/myPartiesIcon.png"
                    alt="My parties"
                    width={320}
                    height={320}
                    className="object-contain"
                  />
                </div>
                <h3 className="text-white text-xl font-normal">My parties</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Loading or Game List */}
        {isLoading ? (
          <div className="w-full text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-transparent border-b-transparent border-white"></div>
            Loading...
          </div>
        ) : !connected ? (
          <div className="w-full text-center py-8 text-white">
            Please connect your wallet to view your games.
          </div>
        ) : (
          <GameList
            //@ts-expect-error - playerData is not undefined
            games={(playerData?.competitions_played as Competition[]) || []}
            playerData={playerData || undefined}
          />
        )}
      </div>
    </main>
  );
}
