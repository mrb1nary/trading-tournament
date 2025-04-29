/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { Dropdown, DropdownItem } from "flowbite-react";
import { FaSearch } from "react-icons/fa";
import axios from "axios";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [activeTimeFilter, setActiveTimeFilter] = useState("All");
  const [activeBaseAmountFilter, setActiveBaseAmountFilter] = useState("All");
  const [activeCashPrizeFilter, setActiveCashPrizeFilter] = useState("All");

  const [searchFiltered, setSearchFiltered] = useState<Competition[]>([]);

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      filterCompetitionsBySearch(searchQuery);
    }
  };

  const filterCompetitionsBySearch = (query: string) => {
    if (!query.trim()) {
      setSearchQuery("");
      return;
    }

    const searchFiltered = filteredCompetitions.filter((competition) =>
      competition.id.toString().includes(query.trim())
    );
    setSearchFiltered(searchFiltered);
  };

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/fetchCompetition`
        );

        const data = response.data;
        const competitionsArray = data.competitions || [];
        setCompetitions(competitionsArray);
        setSearchFiltered([]);
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

  // Calculate time difference in hours
  const getTimeDifferenceInHours = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.ceil((endTime - startTime) / (1000 * 60 * 60));
  };

  // Calculate time difference for display
  const getTimeDifference = (start: string, end: string) => {
    const hours = getTimeDifferenceInHours(start, end);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
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

  // Filter competitions based on all active filters
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      // Time filter
      if (activeTimeFilter !== "All") {
        const hours = parseInt(activeTimeFilter.replace("h", ""));
        const compHours = getTimeDifferenceInHours(
          comp.start_time,
          comp.end_time
        );
        if (compHours !== hours) return false;
      }

      // Base amount filter
      if (activeBaseAmountFilter !== "All") {
        const amount = parseInt(activeBaseAmountFilter.replace(" USDT", ""));
        if (comp.base_amount !== amount) return false;
      }

      // Cash prize filter
      if (activeCashPrizeFilter !== "All") {
        const prize = parseFloat(activeCashPrizeFilter.replace(" SOL", ""));
        if (comp.winning_amount !== prize) return false;
      }

      return true;
    });
  }, [
    activeTimeFilter,
    activeBaseAmountFilter,
    activeCashPrizeFilter,
    competitions,
  ]);

  // Determine which competitions to display
  const displayedCompetitions = useMemo(() => {
    if (searchQuery && searchFiltered.length > 0) {
      return searchFiltered;
    }
    return filteredCompetitions;
  }, [searchQuery, searchFiltered, filteredCompetitions]);

  // Reset all filters
  const resetFilters = () => {
    setActiveTimeFilter("All");
    setActiveBaseAmountFilter("All");
    setActiveCashPrizeFilter("All");
    setSearchQuery("");
    setSearchFiltered([]);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <div className="relative z-10">
        <Navbar />
        <Hero title="Find a" subtitle="Game" />

        {/* Search Bar */}
        <div className="mt-6 flex justify-center">
          <div className="relative">
            <FaSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-full w-6 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter Game ID"
              className={`transition-all duration-300 bg-gray-800 text-white placeholder-gray-500 border border-gray-600 rounded-full py-3 pl-12 pr-6 text-center ${
                isFocused ? "w-306 h-20" : "w-256 h-15"
              } focus:outline-none focus:border-green-500 focus:shadow-[0_0_20px_2px_rgba(34,197,94,0.5)] hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:border-green-400`}
            />
          </div>
        </div>

        {/* Filter Section */}
        <div className="mt-8 max-w-[1200px] mx-auto flex justify-center space-x-6 flex-wrap">
          {/* Time Filter Dropdown */}
          <div className="mb-4">
            <Dropdown
              className="z-50"
              dismissOnClick={true}
              renderTrigger={() => (
                <button className="px-4 py-2 bg-gray-800 text-white rounded-full transition-all duration-300 hover:bg-gray-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-2 focus:ring-green-500">
                  Time: {activeTimeFilter}
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:rotate-180">
                    ▼
                  </span>
                </button>
              )}
            >
              {["All", "1h", "3h", "6h", "12h", "24h"].map((option) => (
                <DropdownItem
                  key={`time-${option}`}
                  onClick={() => {
                    setActiveTimeFilter(option);
                    setSearchFiltered([]);
                  }}
                  className="hover:bg-green-500 hover:text-black transition-colors duration-300"
                >
                  {option}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          {/* Base Amount Filter Dropdown */}
          <div className="mb-4">
            <Dropdown
              className="z-50"
              dismissOnClick={true}
              renderTrigger={() => (
                <button className="px-4 py-2 bg-gray-800 text-white rounded-full transition-all duration-300 hover:bg-gray-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-2 focus:ring-green-500">
                  Base Amount: {activeBaseAmountFilter}
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:rotate-180">
                    ▼
                  </span>
                </button>
              )}
            >
              {["All", "10 USDT", "25 USDT", "50 USDT"].map((option) => (
                <DropdownItem
                  key={`base-${option}`}
                  onClick={() => {
                    setActiveBaseAmountFilter(option);
                    setSearchFiltered([]);
                  }}
                  className="hover:bg-green-500 hover:text-black transition-colors duration-300"
                >
                  {option}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          {/* Cash Prize Filter Dropdown */}
          <div className="mb-4">
            <Dropdown
              className="z-50"
              dismissOnClick={true}
              renderTrigger={() => (
                <button className="px-4 py-2 bg-gray-800 text-white rounded-full transition-all duration-300 hover:bg-gray-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-2 focus:ring-green-500">
                  Cash Prize: {activeCashPrizeFilter}
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:rotate-180">
                    ▼
                  </span>
                </button>
              )}
            >
              {["All", "0.5 SOL", "1 SOL", "2 SOL"].map((option) => (
                <DropdownItem
                  key={`prize-${option}`}
                  onClick={() => {
                    setActiveCashPrizeFilter(option);
                    setSearchFiltered([]);
                  }}
                  className="hover:bg-green-500 hover:text-black transition-colors duration-300"
                >
                  {option}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          {/* Reset Filters Button */}
          <div className="mb-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-red-600 text-white rounded-full transition-all duration-300 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Competition Table */}
        <div className="mt-12">
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
            ) : displayedCompetitions.length > 0 ? (
              displayedCompetitions.map((competition, index) => (
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
                {searchQuery
                  ? "No competitions found matching your search"
                  : "No competitions found matching your filters"}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default FindGame;
