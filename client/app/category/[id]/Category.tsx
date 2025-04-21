"use client";

import { useState, useMemo, useEffect } from "react";
import "../../globals.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWallet } from "@solana/wallet-adapter-react";


interface Competition {
  _id: string;
  authority: string;
  active: boolean;
  id: number;
  max_players: number;
  current_players: number;
  entry_fee: number;
  base_amount: number;
  start_time: string;
  end_time: string;
  winning_amount: number;
  category: string;
  winner: null | string;
  payout_claimed: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
}

interface CompetitionFilter {
  id: number;
  start: string;
  end: string;
  date: string;
  time: string;
  players: string;
  startIn: string;
  canJoin: boolean;
  isFull: boolean;
  hasStarted: boolean;
  isJoined: boolean;
}
interface Params {
  id: string;
}
export default function CategoryPage({ params }: { params: Params }) {
  const { id } = params;

  const [activeFilter, setActiveFilter] = useState("All");
  const [apiCompetitions, setApiCompetitions] = useState<Competition[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningCompetition, setJoiningCompetition] = useState<number | null>(
    null
  );
  const { publicKey } = useWallet();

  // Adjust competition details based on endpoint
  const competitionDetails = useMemo(() => {
    switch (id) {
      // 12-player tournaments
      case "12p10":
        return {
          cashPrize: "0.5 SOL",
          players: 12,
          entryFee: "0.055 SOL",
          baseAmount: "10 USDT",
        };
      case "12p25":
        return {
          cashPrize: "1 SOL",
          players: 12,
          entryFee: "0.1 SOL",
          baseAmount: "25 USDT",
        };
      case "12p50":
        return {
          cashPrize: "2 SOL",
          players: 12,
          entryFee: "0.2 SOL",
          baseAmount: "50 USDT",
        };
      // 6-player tournaments
      case "6p10":
        return {
          cashPrize: "0.25 SOL",
          players: 6,
          entryFee: "0.055 SOL",
          baseAmount: "10 USDT",
        };
      case "6p25":
        return {
          cashPrize: "0.5 SOL",
          players: 6,
          entryFee: "0.1 SOL",
          baseAmount: "25 USDT",
        };
      case "6p50":
        return {
          cashPrize: "1 SOL",
          players: 6,
          entryFee: "0.2 SOL",
          baseAmount: "50 USDT",
        };
      default:
        return {
          cashPrize: "0.25 SOL",
          players: 6,
          entryFee: "0.055 SOL",
          baseAmount: "10 USDT",
        };
    }
  }, [id]);

  // Fetch competitions from API
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fetchCompetition`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.competitions) {
          throw new Error("Invalid API response format");
        }

        // Extract filter parameters safely
        const [maxPlayers, baseAmount] = id.split("p").map(Number);
        if (isNaN(maxPlayers) || isNaN(baseAmount)) {
          throw new Error("Invalid competition category format");
        }

        // Filter competitions based on category
        const filtered = data.competitions.filter(
          (comp: Competition) =>
            comp.max_players === maxPlayers && comp.base_amount === baseAmount
        );

        // Add `isJoined` property to each competition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedCompetitions = filtered.map((comp: { participants: any[]; }) => ({
          ...comp,
          isJoined: comp.participants.some(
            (participant: { player: { player_wallet_address: string | undefined; }; }) =>
              participant.player?.player_wallet_address ===
              publicKey?.toString()
          ),
        }));

        setApiCompetitions(enrichedCompetitions);
        setError(null);
      } catch (err) {
        console.error("Fetch competitions failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load competitions"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [id, publicKey]); // Add publicKey as a dependency

  // Join competition function
  const handleJoinCompetition = async (competitionId: number) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setJoiningCompetition(competitionId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/joinCompetition`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            competition_id: competitionId,
            wallet_address: publicKey.toString(),
          }),
        }
      );

      const data = await response.json();
      console.log("Join response:", data);

      if (!response.ok) {
        if (response.status === 409) {
          toast.info("You have already joined this competition.");
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Update competitions safely
      setApiCompetitions((prev) =>
        prev.map((comp) => {
          if (comp.id === competitionId) {
            return { ...comp, isJoined: true };
          }
          return comp;
        })
      );

      toast.success("Successfully joined the competition!");
    } catch (err) {
      console.error("Join competition failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to join competition"
      );
    } finally {
      setJoiningCompetition(null);
    }
  };

  // Convert API data to UI format
  const allCompetitions: CompetitionFilter[] = useMemo(() => {
    if (apiCompetitions.length === 0) {
      return [];
    }

    return apiCompetitions.map((comp): CompetitionFilter => {
      const startDate = new Date(comp.start_time);
      const endDate = new Date(comp.end_time);
      const now = new Date();
      console.log(comp);

      // Calculate duration in hours
      const durationHours = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      );

      // Calculate time until start
      const timeUntilStart = startDate.getTime() - now.getTime();
      let startIn = "Starting soon";

      if (timeUntilStart > 0) {
        const minutes = Math.floor(timeUntilStart / (1000 * 60)) % 60;
        const seconds = Math.floor(timeUntilStart / 1000) % 60;
        startIn = `${minutes}min${seconds}sec`;
      }

      // Check if competition can be joined
      const canJoin =
        timeUntilStart > 0 && comp.current_players < comp.max_players;
      const isFull = comp.current_players >= comp.max_players;
      const hasStarted = timeUntilStart <= 0;

      // Check if the current wallet has already joined this competition
      const isJoined = comp.participants.some(
        (participant) =>
          participant.player?.player_wallet_address === publicKey?.toString()
      );
      return {
        id: comp.id,
        start:
          startDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) + " UTC+1",
        end:
          endDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) + " UTC+1",
        date: startDate
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "/"),
        time: `${durationHours} hour`,
        players: `${comp.current_players}/${comp.max_players}`,
        startIn,
        canJoin,
        isFull,
        hasStarted,
        isJoined,
      };
    });
  }, [apiCompetitions, publicKey]);

  // Filter competitions based on active filter
  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "All") {
      return allCompetitions;
    }

    // Extract the number from filter (e.g., "1h" const WalletProvider = useSolanaWallet();-> "1")
    const hours = parseInt(activeFilter.replace("h", ""));

    return allCompetitions.filter((comp) => {
      const compHours = parseInt(comp.time.split(" ")[0]);
      return compHours === hours;
    });
  }, [activeFilter, allCompetitions]);

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Main Content */}
      <main className="px-6 py-8 gradient-background">
        {/* Competition Info */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold">
            Cashprize{" "}
            <span className="text-green-500">
              {competitionDetails.cashPrize}
            </span>{" "}
            /{" "}
            <span className="text-green-500">{competitionDetails.players}</span>{" "}
            players
          </h2>
          <p className="text-2xl mt-4">
            Entry Fee:{" "}
            <span className="text-green-500">
              {competitionDetails.entryFee}
            </span>{" "}
            | Base Amount:{" "}
            <span className="text-green-500">
              {competitionDetails.baseAmount}
            </span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-8 border-b border-gray-700 pb-2">
          <button className="text-green-500 border-b-2 border-green-500 px-4 py-2">
            Inscription
          </button>
          <button className="text-gray-400 hover:text-white px-4 py-2">
            Live
          </button>
          <button className="text-gray-400 hover:text-white px-4 py-2">
            Ended
          </button>
        </div>

        {/* Filters */}
        <div className="flex justify-center space-x-4 mb-8">
          {["All", "1h", "3h", "6h", "12h", "24h"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded ${
                filter === activeFilter
                  ? "bg-green-500 text-black"
                  : "bg-gray-800 text-white"
              } hover:bg-green-600`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Redesigned Table Using Divs */}
        <div className="max-w-[1200px] mx-auto bg-[#000000] rounded-lg z-10 relative shadow-lg p-4">
          {/* Header Row */}
          <div className="grid grid-cols-[3fr_3fr_2fr_2fr_3fr_2fr] gap-x-[40px] items-center py-4 my-5 px-6 justify-center text-2xl text-white font-extrabold">
            <div>Start</div>
            <div>End</div>
            <div>Time</div>
            <div>Players</div>
            <div>Start in</div>
            <div>Action</div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading competitions...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((competition, index) => (
              <div
                key={index}
                className={`grid grid-cols-[3fr_3fr_2fr_2fr_3fr_2fr] gap-x-[40px] items-center py-4 my-5 px-6 rounded-full bg-[#262D31]
                  hover:bg-[#29664A] hover:text-white transition-all duration-300`}
              >
                <div>
                  {competition.start} {competition.date}
                </div>
                <div>
                  {competition.end} {competition.date}
                </div>
                <div>{competition.time}</div>
                <div>{competition.players}</div>
                <div className="text-yellow-500">{competition.startIn}</div>
                <div>
                  {competition.isJoined ? (
                    <button
                      disabled
                      className="px-6 py-3 rounded-full bg-yellow-400 text-black font-bold shadow-lg cursor-not-allowed"
                    >
                      Joined
                    </button>
                  ) : competition.canJoin ? (
                    <button
                      onClick={() => handleJoinCompetition(competition.id)}
                      disabled={joiningCompetition === competition.id}
                      className={`px-6 py-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-black font-bold shadow-lg hover:from-green-500 hover:to-green-700 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        joiningCompetition === competition.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {joiningCompetition === competition.id
                        ? "Joining..."
                        : "Join"}
                    </button>
                  ) : competition.isFull ? (
                    <span className="text-red-500">Full</span>
                  ) : competition.hasStarted ? (
                    <span className="text-yellow-500">Started</span>
                  ) : (
                    <span className="text-gray-500">Unavailable</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No competitions found for {id.split("p")[0]} players with{" "}
              {id.split("p")[1]} USDT base amount
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
