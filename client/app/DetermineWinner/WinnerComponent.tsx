"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

interface Competition {
  _id: string;
  id: number;
  start_time: string;
  end_time: string;
  max_players: number;
  current_players: number;
}

const ADMIN_WALLET = "tSg5Ugo5CVuL374natxs6DL8zxXbaBvowqs9Htd2eqd";

const WinnerComponent = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitions = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/fetchCompetition`
      );
      setCompetitions(response.data.competitions);
    } catch (err) {
      console.error("Failed to fetch competitions:", err);
      setError("Failed to load competitions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const { publicKey } = useWallet();
  const isAdmin = publicKey?.toString() === ADMIN_WALLET;

  if (!isAdmin) {
    return (
      <div className="bg-[#0d1117] min-h-screen text-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-gray-400 mb-4">
            This page is restricted to authorized administrators only.
          </p>
          {publicKey && (
            <div className="bg-[#1c2128] p-4 rounded-lg">
              <p className="text-sm font-mono text-gray-400">
                Connected wallet: {publicKey.toString().slice(0, 6)}...
                {publicKey.toString().slice(-4)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  return (
    <div className="bg-[#0d1117] min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrophyIcon className="w-8 h-8 text-green-500" />
            Active Tournaments
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              Loading tournaments...
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 p-6 rounded-lg border border-red-800/50">
            <p className="text-red-500 flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              {error}
            </p>
          </div>
        ) : (
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1c2128]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IdentificationIcon className="w-4 h-4" />
                      Competition ID
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4" />
                      Players
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Start Time (Local)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    End Time (Local)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {competitions.map((competition) => {
                  const isEnded = new Date(competition.end_time) < new Date();

                  return (
                    <tr
                      key={competition._id}
                      className="hover:bg-[#1c2128]/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className="font-mono bg-[#0d1117] px-2 py-1 rounded text-sm">
                          {competition.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">
                            {competition.current_players}
                          </span>
                          <span className="text-gray-500">/</span>
                          <span>{competition.max_players}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatDate(competition.start_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatDate(competition.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isEnded ? (
                          <button
                            onClick={() =>
                              console.log(
                                `Declare winner for ${competition._id}`
                              )
                            }
                            disabled={
                              competition.current_players !==
                              competition.max_players
                            }
                            className={`inline-flex items-center gap-2 ${
                              competition.current_players ===
                              competition.max_players
                                ? "bg-green-600/20 hover:bg-green-600/30 text-green-400"
                                : "bg-gray-600/20 text-gray-400 cursor-not-allowed"
                            } px-4 py-2 rounded-lg border border-green-800/50 transition-all`}
                          >
                            <TrophyIcon className="w-5 h-5" />
                            Declare Winner
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-800/50">
                            <ClockIcon className="w-5 h-5" />
                            Ongoing
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WinnerComponent;
