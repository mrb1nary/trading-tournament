/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const [playerData, setPlayerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const router = useRouter();
  const pathname = usePathname();

  // Modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCompetitionId, setJoinCompetitionId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

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

  const handleJoinVersus = async () => {
    setJoining(true);
    setJoinError(null);
    router.push(`/snapshot/${joinCompetitionId}`);

    // try {
    if (!publicKey) {
      throw new Error("Wallet not connected");
    }

    if (!joinCompetitionId) {
      throw new Error("Please enter a valid game code");
    }

    // const response = await axios.post(`${apiUrl}/joinVersus`, {
    //   versus_id: parseInt(joinCompetitionId),
    //   wallet_address: publicKey.toString(),
    // });

    //   if (response.data.success) {
    //     setJoinModalOpen(false);
    //     setJoinCompetitionId("");
    //     toast.success("Successfully joined versus game!");

    //     // Redirect to snapshot page

    //     // Refresh game list
    //     if (playerData) {
    //       fetchPlayerData(publicKey.toString());
    //     }
    //   }
    // } catch (err: any) {
    //   const errorMessage = err.response?.data?.error || err.message;
    //   const errorCode = err.response?.data?.code;

    //   switch (errorCode) {
    //     case "GAME_FULL":
    //       setJoinError("This game is already full");
    //       break;
    //     case "ALREADY_JOINED":
    //       setJoinError("You've already joined this game");
    //       // Add redirect for already joined players
    //       toast.info("Redirecting to game snapshot...");
    //       setJoinModalOpen(false);
    //       router.push(`/snapshot/${joinCompetitionId}`);
    //       break;
    //     case "GAME_STARTED":
    //       setJoinError("Game has already started");
    //       break;
    //     default:
    //       setJoinError(errorMessage || "Failed to join game");
    //   }

    // Only show error toast for errors other than ALREADY_JOINED
    //   if (errorCode !== "ALREADY_JOINED") {
    //     toast.error(errorMessage || "Join failed");
    //   }
    // } finally {
    //   setJoining(false);
    // }
  };

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
            {/* ...icon and tooltip... */}
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
            onClick={() => setJoinModalOpen(true)}
          >
            {/* ...icon and tooltip... */}
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
            onClick={() => router.push("/versus/MyGames")}
          >
            {/* ...icon and tooltip... */}
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

        {/* Join Game Modal */}
        {joinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-[#23272A] rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={() => setJoinModalOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-semibold text-white mb-4 text-center">
                Join a Game
              </h2>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg bg-[#181B1E] text-white mb-4 border border-gray-700 focus:border-green-400 outline-none"
                placeholder="Enter Competition ID"
                value={joinCompetitionId}
                onChange={(e) =>
                  setJoinCompetitionId(e.target.value.replace(/\D/g, ""))
                }
                maxLength={10}
                disabled={joining}
              />
              {joinError && (
                <div className="text-red-500 text-sm mb-2 text-center">
                  {joinError}
                </div>
              )}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full transition"
                  onClick={handleJoinVersus}
                  disabled={joining}
                >
                  {joining ? "Joining..." : "Join"}
                </button>
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-full transition"
                  onClick={() => setJoinModalOpen(false)}
                  disabled={joining}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
            games={(playerData?.competitions_played as any[]) || []}
            playerData={playerData || undefined}
          />
        )}
      </div>
    </main>
  );
}
