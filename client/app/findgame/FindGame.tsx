"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

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
  participants: unknown[];
}



function FindGame() {
  const [searchQuery, setSearchQuery] = useState(""); // State to track the search input
  const [isFocused, setIsFocused] = useState(false); // State to handle focus animation
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<
    Competition[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      filterCompetitions(searchQuery);
    }
  };

  const filterCompetitions = (query: string) => {
    if (!query.trim()) {
      setFilteredCompetitions(competitions.slice(0, 10));
      return;
    }

    const filtered = competitions.filter((competition) =>
      competition.id.toString().includes(query.trim())
    );
    setFilteredCompetitions(filtered);
  };

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fetchCompetition`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch competitions");
        }

        const data = await response.json();

        // Check if data has a competitions property
        const competitionsArray = data.competitions || [];

        setCompetitions(competitionsArray);
        setFilteredCompetitions(competitionsArray.slice(0, 10));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error fetching competitions:", err);
        setError(err.message || "Failed to load competitions");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Calculate time difference in minutes
  const getTimeDifference = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.ceil((endTime - startTime) / (1000 * 60)) + " min";
  };

  // Calculate start in time
  const getStartIn = (startTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const diff = start - now;

    if (diff <= 0) return "Started";

    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) return minutes + " min";

    const hours = Math.floor(minutes / 60);
    return hours + " hours";
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* Green circle gradient positioned off-screen */}
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      {/* Navbar and Hero */}
      <div className="relative z-10">
        <Navbar />
        <Hero title="Find a" subtitle="Game" />

        {/* Search Bar */}
        <div className="mt-6 flex justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter Game ID"
            className={`transition-all duration-300 bg-gray-800 text-white placeholder-gray-500 border border-gray-600 rounded-full py-3 px-6 text-center ${
              isFocused ? "w-96" : "w-80"
            } focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
        </div>

        {/* Competition Table */}
        <div className="mt-10">
          <div className="max-w-[1200px] mx-auto bg-[#000000] rounded-lg z-10 relative shadow-lg p-4">
            {/* Header Row */}
            <div className="grid grid-cols-[3fr_3fr_2fr_2fr_3fr] gap-x-[40px] items-center py-4 my-5 px-6 justify-center text-2xl text-white font-extrabold">
              <div>Start</div>
              <div>End</div>
              <div>Time</div>
              <div>Players</div>
              <div>Start in</div>
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
                  className={`grid grid-cols-[3fr_3fr_2fr_2fr_3fr] gap-x-[40px] items-center py-4 my-5 px-6 rounded-full bg-[#262D31]
                hover:bg-[#29664A] hover:text-white transition-all duration-300`}
                >
                  <div>{formatDate(competition.start_time)}</div>
                  <div>{formatDate(competition.end_time)}</div>
                  <div>
                    {getTimeDifference(
                      competition.start_time,
                      competition.end_time
                    )}
                  </div>
                  <div>
                    {competition.current_players}/{competition.max_players}
                  </div>
                  <div className="text-yellow-500">
                    {getStartIn(competition.start_time)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No competitions found
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default FindGame;
