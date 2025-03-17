"use client";

import dynamic from "next/dynamic";
import { use, useState, useMemo } from "react";

// Dynamically import Navbar with SSR disabled
const Navbar = dynamic(() => import("@/app/components/Navbar"), { ssr: false });

interface Params {
  id: string;
}

export default function CategoryPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params) as { id: string }; // Access the dynamic route parameter (e.g., 6p, 12p, etc.)
  const [activeFilter, setActiveFilter] = useState("All");

  // Example data for competitions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allCompetitions = [
    {
      start: "7PM UTC+1",
      end: "8PM UTC+1",
      date: "17/01/2025",
      time: "3 hour",
      players: "0/6",
      startIn: "54min04sec",
    },
    {
      start: "7PM UTC+1",
      end: "8PM UTC+1",
      date: "17/01/2025",
      time: "12 hour",
      players: "0/6",
      startIn: "54min04sec",
    },
    {
      start: "7PM UTC+1",
      end: "8PM UTC+1",
      date: "17/01/2025",
      time: "1 hour",
      players: "0/6",
      startIn: "54min04sec",
    },
    {
      start: "7PM UTC+1",
      end: "8PM UTC+1",
      date: "17/01/2025",
      time: "3 hour",
      players: "0/6",
      startIn: "54min04sec",
    },
    {
      start: "7PM UTC+1",
      end: "8PM UTC+1",
      date: "17/01/2025",
      time: "12 hour",
      players: "0/6",
      startIn: "54min04sec",
    },
  ];

  // Filter competitions based on active filter
  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "All") {
      return allCompetitions;
    }

    // Extract the number from filter (e.g., "1h" -> "1")
    const hours = parseInt(activeFilter.replace("h", ""));

    return allCompetitions.filter((comp) => {
      const compHours = parseInt(comp.time.split(" ")[0]);
      return compHours === hours;
    });
  }, [activeFilter, allCompetitions]);

  console.log(id);

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Competition Info */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-green-500">
            Cashprize 0.25 SOL / 6 players
          </h2>
          <p>Entry : 0.055 SOL | Base Amount : 10 USDT</p>
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
          <div className="grid grid-cols-[3fr_3fr_2fr_2fr_3fr] gap-x-[40px] items-center py-4 my-5 px-6 justify-center text-2xl text-white font-extrabold">
            <div>Start</div>
            <div>End</div>
            <div>Time</div>
            <div>Players</div>
            <div>Start in</div>
          </div>

          {/* Data Rows */}
          {filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((competition, index) => (
              <div
                key={index}
                className={`grid grid-cols-[3fr_3fr_2fr_2fr_3fr] gap-x-[40px] items-center py-4 my-5 px-6 rounded-full bg-[#262D31]
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
                <div className="text-yellow">{competition.startIn}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No competitions found for {activeFilter} duration
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
