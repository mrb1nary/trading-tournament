/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

interface Competition {
  authority: string;
  category: string;
  winner: string;
  payout_claimed: string;
  participants: string[];
  _id: string;
  id: number;
  name?: string;
  start_time: string;
  end_time: string;
  max_players: number;
  current_players: number;
  entry_fee?: number;
}

const ADMIN_WALLET1 = "tSg5Ugo5CVuL374natxs6DL8zxXbaBvowqs9Htd2eqd";
const ADMIN_WALLET2 = "4SZeDRxVPTGZJLjYXbcqKCJWdLvf23C8d3cJYdKJ3bx1";

const WinnerComponent = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [competitionDetails, setCompetitionDetails] =
    useState<Competition | null>(null);

  const { publicKey } = useWallet();
  const isAdmin = publicKey?.toString() === ADMIN_WALLET1 || ADMIN_WALLET2;

  // Fetch all competitions on mount
  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
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
    // eslint-disable-next-line
  }, []);

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

  // Handle Declare Winner button click
  const handleDeclareWinner = async (competition: Competition) => {
    setShowModal(true);
    setModalLoading(true);
    setModalError(null);
    setCompetitionDetails(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/fetchCompetition`,
        { competition_id: competition.id }
      );

      // Check if the response has competitions array and extract the first item
      if (response.data.competitions && response.data.competitions.length > 0) {
        setCompetitionDetails(response.data.competitions[0]);
      } else {
        // Fallback to direct competition property if available
        setCompetitionDetails(response.data.competition || null);
      }
    } catch (err) {
      setModalError("Failed to fetch competition details.");
      console.error("API error:", err);
    } finally {
      setModalLoading(false);
    }
  };

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
                            onClick={() => handleDeclareWinner(competition)}
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

      {/* Modal for competition details */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#161b22",
            color: "white",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            minWidth: 400,
            maxWidth: "90vw",
          }}
        >
          {modalLoading ? (
            <div>Loading competition details...</div>
          ) : modalError ? (
            <div className="text-red-500">{modalError}</div>
          ) : competitionDetails ? (
            <div className="space-y-3">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
                Competition #{competitionDetails.id}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Authority</div>
                  <div className="font-mono text-sm">
                    {competitionDetails.authority
                      ? `${competitionDetails.authority.slice(
                          0,
                          6
                        )}...${competitionDetails.authority.slice(-4)}`
                      : "..."}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Category</div>
                  <div>{competitionDetails.category || "Unknown"}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Start Time</div>
                  <div>{formatDate(competitionDetails.start_time)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">End Time</div>
                  <div>{formatDate(competitionDetails.end_time)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Entry Fee</div>
                  <div>
                    {((competitionDetails.entry_fee || 0) / 1000000).toFixed(2)}{" "}
                    SOL
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Players</div>
                  <div>
                    {competitionDetails.current_players}/
                    {competitionDetails.max_players}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Payout Claimed</div>
                  <div
                    className={
                      competitionDetails.payout_claimed
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {competitionDetails.payout_claimed ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {/* Winners Section */}
              <div className="pt-2">
                <div className="text-sm text-gray-400 mb-1">Winner</div>
                <div className="font-mono text-base">
                  {competitionDetails.winner ? (
                    `${competitionDetails.winner.slice(
                      0,
                      6
                    )}...${competitionDetails.winner.slice(-4)}`
                  ) : (
                    <span className="text-gray-500">Not declared yet</span>
                  )}
                </div>
              </div>

              {/* Participants Section */}
              <div className="pt-2">
                <div className="text-sm text-gray-400 mb-1">Participants</div>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-[#0d1117] p-2 rounded">
                  {Array.isArray(competitionDetails.participants) &&
                  competitionDetails.participants.length > 0 ? (
                    competitionDetails.participants.map(
                      (participant: string, index: number) => (
                        <div key={index} className="font-mono text-sm">
                          {participant && typeof participant === "string"
                            ? `${participant.slice(0, 6)}...${participant.slice(
                                -4
                              )}`
                            : "Invalid participant"}
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-gray-500">No participants found</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors font-semibold"
                  onClick={() => {
                    // TODO: Call your calculate winner handler here
                    // handleCalculateWinner(competitionDetails.id)
                  }}
                >
                  Calculate Winner
                </button>
                {!competitionDetails.payout_claimed && (
                  <button
                    className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded transition-colors font-semibold"
                    onClick={() => {
                      // TODO: Call your transfer prize handler here
                      // handleTransferPrize(competitionDetails.id)
                    }}
                  >
                    Transfer Prize
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>No competition data found.</div>
          )}

          <button
            className="mt-6 w-full px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
        </Box>
      </Modal>
    </div>
  );
};

export default WinnerComponent;
