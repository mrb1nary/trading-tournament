"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import GameList from "../components/GameList";
import "../globals.css";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";

export default function TwisterPage() {
  const { connected, publicKey } = useWallet();
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    entry_fee: 0.05,
    base_amount: 10,
    start_time: null as Dayjs | null,
    end_time: null as Dayjs | null,
    winning_amount: 0,
  });

  const PLATFORM_FEE_PERCENTAGE = 10;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  // Calculate winning amount
  useEffect(() => {
    const totalPool = formData.entry_fee * 2; // For 1v1 games
    const platformFee = totalPool * (PLATFORM_FEE_PERCENTAGE / 100);
    setFormData((prev) => ({
      ...prev,
      winning_amount: totalPool - platformFee,
    }));
  }, [formData.entry_fee]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      toast.error("Wallet not connected!");
      return;
    }

    try {
      // Validate times
      if (!formData.start_time || !formData.end_time) {
        toast.error("Please select both start and end times");
        return;
      }

      if (formData.end_time.isBefore(formData.start_time)) {
        toast.error("End time must be after start time");
        return;
      }

      const submissionData = {
        authority: publicKey.toString(),
        entry_fee: formData.entry_fee * 1000000000, // SOL → lamports
        base_amount: formData.base_amount,
        start_time: formData.start_time.unix(),
        end_time: formData.end_time.unix(),
        winning_amount: formData.winning_amount * 1000000000,
        category: "TwoPlayers",
      };

      console.log("Submitting:", submissionData);

      // Uncomment to enable actual submission
      const response = await axios.post(
        `${apiUrl}/createCompetition`,
        submissionData
      );
      console.log("API Response:", response.data);

      toast.success(
        "Game created successfully! ",
        response.data.competition_id
      );
      setShowCreateModal(false);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to create game");
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-black">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <Navbar />
      <div className="container mx-auto px-6 py-8 relative z-10 flex flex-col items-center">
        <Hero title="Twister" subtitle="Mode" />

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 px-4 max-w-5xl mx-auto">
          {/* Create a Party */}
          <div
            onClick={() => setShowCreateModal(true)}
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

        {/* Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-black">
              <h3 className="text-lg font-medium mb-4">Create 1v1 Game</h3>

              <form onSubmit={handleSubmit}>
                {/* Wallet Address */}
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={publicKey?.toString() || ""}
                    disabled
                    className="mt-1 block w-full rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Entry Fee */}
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Entry Fee (SOL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entry_fee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entry_fee: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                {/* Base Amount (USDT) - Added missing field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Base Amount (USDT)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.base_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_amount: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                {/* Date/Time Pickers */}
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Start Time
                  </label>
                  <DateTimePicker
                    value={formData.start_time}
                    onChange={(newValue) =>
                      setFormData({
                        ...formData,
                        start_time: newValue,
                      })
                    }
                    className="w-full [&_input]:text-black"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium">End Time</label>
                  <DateTimePicker
                    value={formData.end_time}
                    onChange={(newValue) =>
                      setFormData({
                        ...formData,
                        end_time: newValue,
                      })
                    }
                    //@ts-expect-error Will look into the error
                    minDateTime={formData.start_time}
                    className="w-full [&_input]:text-black"
                  />
                </div>

                {/* Winning Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium">
                    Winning Amount (SOL)
                  </label>
                  <input
                    type="text"
                    value={formData.winning_amount.toFixed(2)}
                    disabled
                    className="mt-1 block w-full rounded-md bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Game
                  </button>
                </div>
              </form>
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
            //@ts-expect-error - playerData is not undefined
            games={(playerData?.competitions_played as Competition[]) || []}
            playerData={playerData || undefined}
          />
        )}
      </div>
    </main>
  );
}
