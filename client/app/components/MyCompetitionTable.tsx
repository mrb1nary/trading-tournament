// components/MyCompetitionTable.tsx
import React from "react";

interface Competition {
  id: number;
  start: string;
  end: string;
  time: string;
  players: number;
  timeLeft: string;
}

interface MyCompetitionTableProps {
  competitions: Competition[];
}

const MyCompetitionTable: React.FC<MyCompetitionTableProps> = ({
  competitions,
}) => {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Title */}
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        My competitions{" "}
        <span className="text-gray-500 ml-2">({competitions.length})</span>
      </h2>

      {/* Table Container */}
      <div className="bg-[#1A2023] rounded-lg overflow-hidden z-10 relative">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-800">
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                #
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Start
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                End
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Time
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Players
              </th>
              <th className="py-4 px-6 text-left text-gray-500 font-normal">
                Time left
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {competitions && competitions.length > 0 ? (
              competitions.map((competition, index) => (
                <tr
                  key={competition.id}
                  className="border-b border-gray-800 hover:bg-[#262D31] cursor-pointer"
                >
                  <td className="py-4 px-6 text-gray-400">{index + 1}</td>
                  <td className="py-4 px-6 text-gray-400">
                    {competition.start}
                  </td>
                  <td className="py-4 px-6 text-gray-400">{competition.end}</td>
                  <td className="py-4 px-6 text-gray-400">
                    {competition.time}
                  </td>
                  <td className="py-4 px-6 text-gray-400">
                    {competition.players}
                  </td>
                  <td className="py-4 px-6 text-gray-400">
                    {competition.timeLeft}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-10 px-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-gray-400 text-lg mb-2">No games yet</p>
                    <p className="text-green-500 font-medium">
                      Good luck on your first competition!
                    </p>
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

export default MyCompetitionTable;
