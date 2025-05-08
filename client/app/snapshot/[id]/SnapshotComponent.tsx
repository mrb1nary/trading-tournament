"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { useWallet } from "@solana/wallet-adapter-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Competition {
  id: number;
  category: string;
  start_time: string;
  end_time: string;
  max_players: number;
  current_players: number;
  participants: string[];
  entry_fee: number;
  base_amount: number;
  winning_amount: number;
  authority: string;
}

interface CompetitionStatus {
  status: "loading" | "finished" | "not_started" | "started";
  countdown?: string;
}

export default function SnapshotComponent() {
  const params = useParams();
  const competitionId = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const wallet = useWallet();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "players">("summary");
  const [playerAddresses, setPlayerAddresses] = useState<string[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Fetch competition data
  useEffect(() => {
    if (!competitionId || !apiUrl) return;

    const fetchCompetition = async () => {
      try {
        const response = await axios.get<{ competitions: Competition[] }>(
          `${apiUrl}/fetchCompetition/${competitionId}`
        );
        setCompetition(response.data?.competitions?.[0] || null);
      } catch (error) {
        console.error("Error fetching competition:", error);
        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.message || "Failed to fetch competition"
          );
        }
      }
    };

    fetchCompetition();
  }, [competitionId, apiUrl]);

  // Handle players tab click
  const handlePlayersTab = async () => {
    setActiveTab("players");
    setLoadingPlayers(true);

    try {
      if (!competitionId || !apiUrl) return;

      if (competition?.participants) {
        setPlayerAddresses(competition.participants);
      } else {
        const response = await axios.get<{ competitions: Competition[] }>(
          `${apiUrl}/fetchCompetition/${competitionId}`
        );
        const comp = response.data?.competitions?.[0];
        setPlayerAddresses(comp?.participants || []);
      }
    } catch (error) {
      console.error("Failed to fetch player addresses:", error);
      toast.error("Failed to fetch player addresses");
      setPlayerAddresses([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Snapshot button handler
  const handleSnapshotButton = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        toast.error("Wallet not connected");
        return;
      }

      if (!competitionId || !apiUrl) {
        toast.error("Invalid competition ID");
        return;
      }

      const response = await axios.post(
        `${apiUrl}/snapshot`,
        {
          competition_id: competitionId,
          wallet_address: wallet.publicKey.toString(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Snapshot successful:", response.data);
      toast.success("Portfolio snapshot captured!");
    } catch (error) {
      console.error("Snapshot error:", error);
      let errorMessage = "Failed to capture snapshot";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    }
  };

  // Competition status calculator
  const getCompetitionStatus = (): CompetitionStatus => {
    if (!competition?.start_time || !competition?.end_time) {
      return { status: "loading" };
    }

    const now = new Date();
    const start = new Date(competition.start_time);
    const end = new Date(competition.end_time);

    if (now > end) return { status: "finished" };
    if (now < start) {
      const diffMs = start.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      return {
        status: "not_started",
        countdown: `${days}d ${hours}h ${mins}m ${secs}s`,
      };
    }
    return { status: "started" };
  };

  // Helper functions with proper null checks
  const formatSol = (lamports: number | undefined) =>
    lamports ? `${(lamports / 1e9).toFixed(3)} SOL` : "0.000 SOL";

  const formatUSDT = (amount: number | undefined) =>
    amount ? `${amount} USDT` : "0 USDT";

  const formatDate = (date: string | undefined) =>
    date ? new Date(date).toLocaleString() : "N/A";

  const getDuration = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) return "N/A";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return ms > 0 ? `${Math.floor(ms / (1000 * 60 * 60))} hour(s)` : "N/A";
  };

  const compStatus = getCompetitionStatus();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-5">
      {/* Tabs */}
      <div className="flex w-full max-w-3xl mb-6">
        <div
          className={`flex-1 text-center py-2 border-b-2 font-semibold cursor-pointer ${
            activeTab === "summary"
              ? "border-green-400 text-green-400"
              : "border-gray-700 text-gray-400"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </div>
        <div
          className={`flex-1 text-center py-2 border-b-2 font-semibold cursor-pointer ${
            activeTab === "players"
              ? "border-green-400 text-green-400"
              : "border-gray-700 text-gray-400"
          }`}
          onClick={handlePlayersTab}
        >
          Players
        </div>
      </div>

      {activeTab === "summary" && (
        <div className="flex flex-row w-full max-w-6xl bg-[#23272A] rounded-2xl shadow-lg p-8 gap-8">
          {/* Left: Information */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Information
            </h2>
            <div className="bg-[#181B1E] rounded-xl p-6">
              <div className="flex flex-col gap-4">
                <InfoRow
                  label="Mode"
                  value={competition?.category || "Competition"}
                />
                <InfoRow
                  label="Cash Prize"
                  value={formatSol(competition?.winning_amount)}
                  sub="Amount awarded to the winner(s)"
                />
                <InfoRow
                  label="Entry Fee"
                  value={formatSol(competition?.entry_fee)}
                  sub="Amount required to participate"
                />
                <InfoRow
                  label="Base Amount"
                  value={formatUSDT(competition?.base_amount)}
                  sub="Base amount to hold in your wallet"
                />
                <InfoRow
                  label="Start"
                  value={formatDate(competition?.start_time)}
                  sub="Time when the game starts"
                />
                <InfoRow
                  label="End"
                  value={formatDate(competition?.end_time)}
                  sub="Time when the game ends"
                />
                <InfoRow
                  label="Duration"
                  value={getDuration(
                    competition?.start_time,
                    competition?.end_time
                  )}
                  sub="Total game duration"
                />
                <InfoRow
                  label="Players"
                  value={`${competition?.current_players || 0}/${
                    competition?.max_players || 0
                  }`}
                  sub="Registered players / total"
                />
              </div>
            </div>
          </div>

          {/* Right: Game Code */}
          <div className="flex flex-col items-center justify-center w-80">
            <div className="bg-[#181B1E] rounded-xl p-10 flex flex-col items-center mb-4">
              <span className="text-gray-400 mb-2">Game Code</span>
              <div className="bg-[#23272A] text-3xl font-bold text-white rounded-lg px-8 py-4 mb-2">
                {competition?.id || "N/A"}
              </div>
              <span className="text-gray-400 text-center">
                Share this code with friends
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "players" && (
        <div className="w-full max-w-2xl bg-[#23272A] rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">
            Player Wallet Addresses
          </h2>
          {loadingPlayers ? (
            <div className="text-gray-400">Loading players...</div>
          ) : playerAddresses.length > 0 ? (
            <ul className="text-green-400">
              {playerAddresses.map((addr) => (
                <li key={addr} className="py-2 border-b border-gray-700">
                  {addr}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">No players found.</div>
          )}
        </div>
      )}

      {/* Status Bar */}
      <div className="mt-10 w-full max-w-4xl">
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        {compStatus.status === "finished" && (
          <div className="bg-red-500 text-white text-center rounded-xl py-4 text-xl font-semibold">
            Competition has finished 🏁
          </div>
        )}
        {compStatus.status === "not_started" && compStatus.countdown && (
          <div className="bg-yellow-400 text-black text-center rounded-xl py-4 text-xl font-semibold">
            Starts in {compStatus.countdown} ⏳
          </div>
        )}
        {compStatus.status === "started" && (
          <div
            onClick={handleSnapshotButton}
            className="bg-green-500 text-white text-center rounded-xl py-4 text-xl font-semibold cursor-pointer hover:bg-green-600 transition-colors"
          >
            Submit snapshot & Begin 🚀
          </div>
        )}
        {compStatus.status === "loading" && (
          <div className="bg-gray-500 text-white text-center rounded-xl py-4 text-xl font-semibold">
            Loading competition data...
          </div>
        )}
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  sub?: string;
}

function InfoRow({ label, value, sub }: InfoRowProps) {
  return (
    <div className="flex flex-col mb-2">
      <div className="flex justify-between text-white">
        <span className="font-medium">{label}</span>
        <span>{value}</span>
      </div>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}
