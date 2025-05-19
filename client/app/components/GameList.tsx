import React from "react";
import { toast } from "react-toastify";
import { FiClipboard } from "react-icons/fi";

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
  category:
    | "TwoPlayers"
    | "SixPlayers"
    | "TwelvePlayers"
    | "TwentyFivePlayers"
    | "Versus";
  winner: string | null; // Player ID
  payout_claimed: boolean;
  active: boolean;
  participants: string[]; // Array of Player IDs
}

interface GameListProps {
  games: Competition[];
  playerData?: {
    _id: string;
    code?: string; // Optional code property inside playerData
    [key: string]: unknown;
  };
}

const GameList: React.FC<GameListProps> = ({ games, playerData }) => {
  // Function to calculate time left
  const getTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();

    if (end < now) return "Completed";

    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ${diffHrs}h`;
    return `${diffHrs}:${diffMins.toString().padStart(2, "0")}`;
  };

  // Function to format SOL amounts
  const formatSol = (amount: number) => `SOL ${amount.toFixed(2)}`;

  // Function to format USDT amounts
  const formatUsdt = (amount: number) => `USDT ${amount.toFixed(2)}`;

  // Copy game code to clipboard and show toast
  const handleCopy = (code: number) => {
    navigator.clipboard.writeText(code.toString());
    toast.success("Game code copied to clipboard!", {
      position: "bottom-right",
    });
  };

  return (
    <div className="py-8 w-full mx-auto my-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-semibold flex items-center">
          My Games <span className="text-gray-500 ml-2">({games.length})</span>
        </h2>

        {/* Display code if it exists inside playerData */}
        {playerData?.code && (
          <div className="bg-[#262D31] rounded-xl p-4 flex flex-col items-center">
            <span className="text-gray-400 text-sm mb-1">Latest Game Code</span>
            <span className="text-white font-bold text-xl">
              {playerData.code}
            </span>
          </div>
        )}
      </div>

      <div className="bg-[#1A2023] rounded-4xl overflow-hidden z-10 relative">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                #
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Game Code
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Type
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Rank
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Cash prize
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Base amount
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Time left
              </th>
            </tr>
          </thead>
          <tbody>
            {games.length > 0 ? (
              games.map((game, index) => (
                <tr
                  key={game._id}
                  className="border-b border-gray-800 hover:bg-[#262D31] cursor-pointer"
                >
                  <td className="py-4 px-6 text-gray-400">{index + 1}</td>
                  <td className="py-4 px-6 text-green-400 font-medium flex items-center gap-2">
                    {game.id}
                    <button
                      title="Copy Game Code"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(game.id);
                      }}
                      className="ml-2 p-1 rounded hover:bg-gray-700 transition"
                      tabIndex={0}
                      aria-label="Copy game code"
                    >
                      <FiClipboard className="w-5 h-5 text-gray-300 hover:text-green-400" />
                    </button>
                  </td>
                  <td className="py-4 px-6 text-gray-400">{game.category}</td>
                  <td
                    className="py-4 px-6"
                    style={{ color: game.winner ? "#00FF00" : "#FFD600" }}
                  >
                    {game.winner
                      ? game.winner === playerData?._id
                        ? "#1"
                        : "Participated"
                      : "Not Declared"}
                  </td>
                  <td className="py-4 px-6 text-gray-400">
                    {formatSol(game.winning_amount)}
                  </td>
                  <td className="py-4 px-6 text-gray-400">
                    {formatUsdt(game.base_amount)}
                  </td>
                  <td className="py-4 px-6 text-gray-400">
                    {getTimeLeft(game.end_time)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-xl text-gray-300">
                      You are yet to play your first game. Good luck!
                    </p>
                    <button className="px-6 py-3 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition-all duration-300 transform hover:scale-105">
                      Join your first game!
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameList;
