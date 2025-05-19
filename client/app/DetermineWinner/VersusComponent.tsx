"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  IdentificationIcon,
  ClockIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

interface VersusGame {
  versus_id: number;
  start_time: string;
  end_time: string;
  entry_fee: number;
  base_amount: number;
  prize_pool: number;
  participants: { username: string; wallet: string }[];
  status: string;
  winner: string | null;
}

const VersusComponent: React.FC = () => {
  const [games, setGames] = useState<VersusGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [gameDetails, setGameDetails] = useState<VersusGame | null>(null);

  // Fetch all versus games on mount
  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/fetchVersus`
      );
      setGames(response.data.data || []);
    } catch (err) {
      setError("Failed to load versus games.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
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

  // Handle Declare Winner button click (open modal and fetch details)
  const handleDeclareWinner = async (game: VersusGame) => {
    setShowModal(true);
    setModalLoading(true);
    setModalError(null);
    setGameDetails(null);

    try {
      setGameDetails(game);
    } catch (err) {
      setModalError("Failed to fetch game details.");
      console.error("API error:", err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="bg-[#0d1117] min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrophyIcon className="w-8 h-8 text-yellow-400" />
            All Versus Games
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              Loading versus games...
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
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#1c2128]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IdentificationIcon className="w-4 h-4" />
                      Versus ID
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Entry Fee
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Base Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Prize Pool
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
                  <th
                    className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider"
                    style={{ minWidth: 180 }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {games.map((game) => {
                  const isEnded = new Date(game.end_time) < new Date();
                  return (
                    <tr
                      key={game.versus_id}
                      className="hover:bg-[#1c2128]/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className="font-mono bg-[#0d1117] px-2 py-1 rounded text-sm">
                          {game.versus_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {game.entry_fee} SOL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {game.base_amount} USDT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {game.prize_pool} SOL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatDate(game.start_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatDate(game.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
                            isEnded
                              ? "bg-gray-600/20 text-gray-400 border-gray-700"
                              : "bg-blue-600/20 text-blue-400 border-blue-800/50"
                          }`}
                        >
                          <ClockIcon className="w-5 h-5" />
                          {isEnded ? "Ended" : "Ongoing"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isEnded ? (
                          <button
                            onClick={() => handleDeclareWinner(game)}
                            className="inline-flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-lg border border-green-800/50 transition-all"
                          >
                            <TrophyIcon className="w-5 h-5" />
                            Declare Winner
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeclareWinner(game)}
                            className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg border border-blue-800/50 transition-all"
                          >
                            <TrophyIcon className="w-5 h-5" />
                            Details
                          </button>
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

      {/* Modal for game details and declare winner */}
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
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {modalLoading ? (
            <div>Loading game details...</div>
          ) : modalError ? (
            <div className="text-red-500">{modalError}</div>
          ) : gameDetails ? (
            <div className="space-y-3">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
                Versus Game #{gameDetails.versus_id}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Entry Fee</div>
                  <div>{gameDetails.entry_fee} SOL</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Base Amount</div>
                  <div>{gameDetails.base_amount} USDT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Prize Pool</div>
                  <div>{gameDetails.prize_pool} SOL</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Status</div>
                  <div
                    className={
                      new Date(gameDetails.end_time) < new Date()
                        ? "text-gray-400"
                        : "text-blue-400"
                    }
                  >
                    {new Date(gameDetails.end_time) < new Date()
                      ? "Ended"
                      : "Ongoing"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Start Time</div>
                  <div>{formatDate(gameDetails.start_time)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">End Time</div>
                  <div>{formatDate(gameDetails.end_time)}</div>
                </div>
              </div>
              {/* Winner Section */}
              <div className="pt-2">
                <div className="text-sm text-gray-400 mb-1">Winner</div>
                <div className="font-mono text-base">
                  {gameDetails.winner ? (
                    `${gameDetails.winner.slice(
                      0,
                      6
                    )}...${gameDetails.winner.slice(-4)}`
                  ) : (
                    <span className="text-gray-500">Not declared yet</span>
                  )}
                </div>
              </div>
              {/* Participants Section */}
              <div className="pt-2">
                <div className="text-sm text-gray-400 mb-1">Participants</div>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-[#0d1117] p-2 rounded">
                  {Array.isArray(gameDetails.participants) &&
                  gameDetails.participants.length > 0 ? (
                    gameDetails.participants.map((participant, idx) => (
                      <div key={idx} className="font-mono text-sm">
                        {participant.username
                          ? `${
                              participant.username
                            } (${participant.wallet.slice(
                              0,
                              6
                            )}...${participant.wallet.slice(-4)})`
                          : `${participant.wallet.slice(
                              0,
                              6
                            )}...${participant.wallet.slice(-4)}`}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No participants found</div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              {new Date(gameDetails.end_time) < new Date() && (
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors font-semibold"
                    onClick={() => {
                      // TODO: Call your calculate winner handler here
                      // handleCalculateWinner(gameDetails.versus_id)
                    }}
                  >
                    Calculate Winner
                  </button>
                  {!gameDetails.winner && (
                    <button
                      className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded transition-colors font-semibold"
                      onClick={() => {
                        // TODO: Call your transfer prize handler here
                        // handleTransferPrize(gameDetails.versus_id)
                      }}
                    >
                      Transfer Prize
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>No game data found.</div>
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

export default VersusComponent;
