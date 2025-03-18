import React from "react";

interface Game {
  id: number;
  type: "Competition" | "Twister" | "Versus";
  rank: string;
  cashPrize: string;
  baseAmount: string;
  timeLeft: string;
}

const games: Game[] = [
  {
    id: 1,
    type: "Competition",
    rank: "#2",
    cashPrize: "sol 1",
    baseAmount: "sol 0.15",
    timeLeft: "01:11:56",
  },
  {
    id: 2,
    type: "Twister",
    rank: "#45",
    cashPrize: "sol 1.1",
    baseAmount: "sol 0.15",
    timeLeft: "00:08:23",
  },
  {
    id: 3,
    type: "Versus",
    rank: "#6",
    cashPrize: "sol 0.8",
    baseAmount: "sol 0.75",
    timeLeft: "04:10:43",
  },
  {
    id: 4,
    type: "Twister",
    rank: "#3",
    cashPrize: "sol 1.2",
    baseAmount: "sol 0.5",
    timeLeft: "05:02:25",
  },
  {
    id: 5,
    type: "Competition",
    rank: "#12",
    cashPrize: "sol 2",
    baseAmount: "sol 0.25",
    timeLeft: "00:03:12",
  },
  {
    id: 6,
    type: "Competition",
    rank: "#1",
    cashPrize: "sol 0.2",
    baseAmount: "sol 0.10",
    timeLeft: "01:10:21",
  },
  {
    id: 7,
    type: "Versus",
    rank: "#8",
    cashPrize: "sol 1.2",
    baseAmount: "sol 0.15",
    timeLeft: "10:11:34",
  },
  {
    id: 8,
    type: "Twister",
    rank: "#2",
    cashPrize: "sol 0.7",
    baseAmount: "sol 0.25",
    timeLeft: "02:12:00",
  },
];

const GameList: React.FC = () => {
  return (
    <div className="py-8 w-full mx-auto my-32">
      <h2 className="text-4xl font-semibold mb-6 flex items-center">
        My Games <span className="text-gray-500 ml-2">(0)</span>
      </h2>

      <div className="bg-[#1A2023] rounded-4xl overflow-hidden z-10 relative">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                #
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
            {games.map((game, index) => (
              <tr
                key={game.id}
                className="border-b border-gray-800 hover:bg-[#262D31] cursor-pointer"
              >
                <td className="py-4 px-6 text-gray-400">{index + 1}</td>
                <td className="py-4 px-6 text-gray-400">{game.type}</td>
                <td className="py-4 px-6 text-[#00FF00]">{game.rank}</td>
                <td className="py-4 px-6 text-gray-400">{game.cashPrize}</td>
                <td className="py-4 px-6 text-gray-400">{game.baseAmount}</td>
                <td className="py-4 px-6 text-gray-400">{game.timeLeft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameList;
