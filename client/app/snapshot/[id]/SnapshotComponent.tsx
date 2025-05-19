/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

type PlayerRegistrationStatus =
  | "loading"
  | "registered"
  | "not_registered"
  | "party_full";

export default function SnapshotComponent() {
  const params = useParams();
  const competitionId = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const wallet = useWallet();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "players">("summary");
  const [playerAddresses, setPlayerAddresses] = useState<string[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playerRegistrationStatus, setPlayerRegistrationStatus] =
    useState<PlayerRegistrationStatus>("loading");

  // Fetch competition or versus data
  useEffect(() => {
    if (!competitionId || !apiUrl) return;

    const fetchCompetition = async () => {
      try {
        // Try to fetch as competition first
        const response = await axios.get<{ competitions: Competition[] }>(
          `${apiUrl}/fetchCompetition/${competitionId}`
        );
        if (response.data?.competitions?.length > 0) {
          setCompetition(response.data.competitions[0]);
        } else {
          // No competition found, try versus fallback
          await tryFetchVersus();
        }
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          await tryFetchVersus();
        } else {
          toast.error(
            axios.isAxiosError(error)
              ? error.response?.data?.message || "Failed to fetch competition"
              : "Failed to fetch competition"
          );
        }
      }
    };

    const tryFetchVersus = async () => {
      try {
        const versusResponse = await axios.post(`${apiUrl}/fetchVersus`, {
          versus_id: competitionId,
        });
        const data = versusResponse.data?.data?.[0];
        if (data) {
          const now = new Date();
          const startDate = new Date(data.start_time);
          const endDate = new Date(data.end_time);
          let start_time, end_time;
          if (startDate.getFullYear() === 1970 || isNaN(startDate.getTime())) {
            start_time = now.toISOString();
          } else {
            start_time = data.start_time;
          }
          if (endDate.getFullYear() === 1970 || isNaN(endDate.getTime())) {
            const futureDate = new Date(now);
            futureDate.setHours(futureDate.getHours() + 3);
            end_time = futureDate.toISOString();
          } else {
            end_time = data.end_time;
          }
          if (new Date(end_time) <= new Date(start_time)) {
            const startDateObj = new Date(start_time);
            const newEndDate = new Date(startDateObj);
            newEndDate.setHours(startDateObj.getHours() + 3);
            end_time = newEndDate.toISOString();
          }
          setCompetition({
            id: data.versus_id,
            category: "Versus",
            start_time: start_time,
            end_time: end_time,
            max_players: 2, // Versus games are typically 2 players
            current_players: data.participants.length,
            participants: data.participants.map((p: any) => p.wallet),
            entry_fee: data.entry_fee,
            base_amount: data.base_amount || 0,
            winning_amount: data.prize_pool,
            authority: data.authority || "",
          });
        } else {
          setCompetition(null);
          toast.error("Competition or Versus game not found");
        }
      } catch (versusError) {
        setCompetition(null);
        toast.error("Failed to fetch competition details");
        console.log(versusError);
      }
    };

    fetchCompetition();
  }, [competitionId, apiUrl]);

  // Registration status check
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!wallet.connected || !wallet.publicKey || !competitionId || !apiUrl) {
        setPlayerRegistrationStatus("loading");
        return;
      }
      setPlayerRegistrationStatus("loading");
      try {
        // Try to fetch as participant
        const response = await axios.post(`${apiUrl}/fetchVersus`, {
          versus_id: competitionId,
          wallet_address: wallet.publicKey.toString(),
        });
        if (response.data?.success) {
          setPlayerRegistrationStatus("registered");
          return;
        }
      } catch (error) {
        // Not registered or not found
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 404 &&
          error.response?.data?.code === "VERSUS_NOT_FOUND_OR_NOT_PARTICIPANT"
        ) {
          // Check if party is full
          try {
            const versusResponse = await axios.post(`${apiUrl}/fetchVersus`, {
              versus_id: competitionId,
            });
            const versusData = versusResponse.data?.data?.[0];
            if (
              versusData &&
              versusData.participants.length >= (competition?.max_players || 0)
            ) {
              setPlayerRegistrationStatus("party_full");
            } else {
              setPlayerRegistrationStatus("not_registered");
            }
          } catch (versusError) {
            setPlayerRegistrationStatus("not_registered");
          }
        } else {
          setPlayerRegistrationStatus("not_registered");
        }
      }
    };
    checkRegistrationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wallet.connected,
    wallet.publicKey?.toString(),
    competitionId,
    apiUrl,
    competition?.max_players,
  ]);

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

  // Registration handler
  const handleRegisterButton = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        toast.error("Wallet not connected");
        return;
      }
      if (!competitionId || !apiUrl) {
        toast.error("Invalid competition ID");
        return;
      }
      const response = await axios.post(`${apiUrl}/joinVersus`, {
        wallet_address: wallet.publicKey.toString(),
        versus_id: competitionId,
      });
      toast.success("Successfully registered for the game!");
      setPlayerRegistrationStatus("registered");
      if (competition?.category === "Versus") {
        // Refresh competition data
        const versusResponse = await axios.post(`${apiUrl}/fetchVersus`, {
          versus_id: competitionId,
        });
        const data = versusResponse.data?.data?.[0];
        if (data) {
          setCompetition((prev) => ({
            ...prev!,
            current_players: data.participants.length,
            participants: data.participants.map((p: any) => p.wallet),
          }));
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to register";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
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
      const reqBody: any = {
        wallet_address: wallet.publicKey.toString(),
      };
      if (competition?.category === "Versus") {
        reqBody.versus_id = competitionId;
      } else {
        reqBody.competition_id = competitionId;
      }
      const response = await axios.post(`${apiUrl}/snapshot`, reqBody, {
        headers: { "Content-Type": "application/json" },
      });
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

  // Helper functions
  const formatSol = (lamports: number | undefined) =>
    lamports ? `${lamports.toFixed(3)} SOL` : "0.000 SOL";
  const formatUSDT = (amount: number | undefined) =>
    amount ? `${amount} USDT` : "0 USDT";
  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() === 1970) {
      return "Date pending";
    }
    return parsedDate.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };
  const getDuration = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) return "N/A";
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      startDate.getFullYear() === 1970 ||
      endDate.getFullYear() === 1970
    ) {
      return "Duration pending";
    }
    const ms = endDate.getTime() - startDate.getTime();
    if (ms <= 0) return "Invalid duration";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
                    competition?.max_players || 2
                  }`}
                  sub="Registered players / maximum slots"
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

        {compStatus.status === "not_started" && (
          <>
            {playerRegistrationStatus === "registered" ? (
              <div className="bg-green-500 text-white text-center rounded-xl py-4 text-xl font-semibold">
                Good luck! You are already joined{" "}
                {compStatus.countdown && (
                  <span className="text-white text-lg font-normal ml-2">
                    ({compStatus.countdown} left)
                  </span>
                )}
              </div>
            ) : (
              <div
                onClick={handleRegisterButton}
                className="bg-blue-500 text-white text-center rounded-xl py-4 text-xl font-semibold cursor-pointer hover:bg-blue-600 transition-colors"
              >
                Join Competition{" "}
                {compStatus.countdown && (
                  <span className="text-black text-lg font-normal ml-2">
                    ({compStatus.countdown} left)
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {compStatus.status === "started" && (
          <>
            {playerRegistrationStatus === "loading" && (
              <div className="bg-gray-500 text-white text-center rounded-xl py-4 text-xl font-semibold">
                Checking registration status...
              </div>
            )}
            {playerRegistrationStatus === "registered" && (
              <div
                onClick={handleSnapshotButton}
                className="bg-green-500 text-white text-center rounded-xl py-4 text-xl font-semibold cursor-pointer hover:bg-green-600 transition-colors"
              >
                Submit snapshot & Begin 🚀
              </div>
            )}
            {playerRegistrationStatus === "not_registered" && (
              <div className="bg-red-500 text-white text-center rounded-xl py-4 text-xl font-semibold">
                Game has started 🚫
              </div>
            )}
            {playerRegistrationStatus === "party_full" && (
              <div className="bg-red-500 text-white text-center rounded-xl py-4 text-xl font-semibold">
                Party Full 🚫
              </div>
            )}
          </>
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
