"use client";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import MyCompetitionTable from "../components/MyCompetitionTable";

export default function CompetitionMode() {
  const [activeTab, setActiveTab] = useState("12 players");

  // Tabs data
  const tabs = ["Special", "6 players", "12 players", "25 players"];

  // Cards data
  const cards = [
    {
      cashPrize: "0.5 SOL",
      entryToPlay: "0.055 SOL",
      baseAmount: "10 USDT",
    },
    {
      cashPrize: "2 SOL",
      entryToPlay: "0.2 SOL",
      baseAmount: "50 USDT",
    },
    {
      cashPrize: "1 SOL",
      entryToPlay: "0.1 SOL",
      baseAmount: "25 USDT",
    },
  ];

  // Dummy competition data
  const dummyCompetitions = [
    {
      id: 1,
      start: "2025/03/15 10:00 AM",
      end: "2025/03/15 11:00 AM",
      time: "1 hour",
      players: 12,
      timeLeft: "00:25:13",
    },
    {
      id: 2,
      start: "2025/03/14 09:00 AM",
      end: "2025/03/14 10:30 AM",
      time: "1.5 hours",
      players: 25,
      timeLeft: "Ended",
    },
    {
      id: 3,
      start: "2025/03/16 11:30 AM",
      end: "2025/03/16 12:30 PM",
      time: "1 hour",
      players: 6,
      timeLeft: "01:55:42",
    },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* Green circle gradient positioned off-screen */}
      <div
        className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,0,0.2) 0%, rgba(0,0,0,0) 70%)",
          backgroundSize: "150% 150%",
        }}
      />

      {/* Navbar and Title */}
      <div className="relative z-10">
        <Navbar />
        <Hero title="Competition" />
      </div>

      {/* Competition Content */}
      <div className="relative z-10 mt-10 max-w-5xl mx-auto px-4">
        {/* Tabs */}
        <div className="flex justify-center space-x-8 mb-8 border-b border-gray-700 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-lg font-medium ${
                activeTab === tab
                  ? "text-[#29664A] border-b-2 border-[#29664A]"
                  : "text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 items-center">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-[#242424] rounded-2xl shadow-lg p-6 text-center relative flex flex-col justify-between ${
                index === 1 ? "h-[380px]" : "h-[330px] opacity-50"
              } transition-all duration-300 hover:scale-105 hover:shadow-xl hover:opacity-100 hover:bg-[#2a2a2a] cursor-pointer`}
            >
              {/* Flower SVG with Cash Prize Inside */}
              <div className="relative mx-auto mb-[-10rem] mt-[-2rem]">
                <img
                  src="/assets/bigFlower.svg"
                  alt="Flower"
                  className={`${
                    index === 1 ? "w-[320px] h-[320px]" : "w-[280px] h-[280px]"
                  } mx-auto transition-transform duration-300 hover:rotate-3`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[#29664A] text-lg font-bold">
                    Cashprize
                  </div>
                  <div className="text-yellow-400 text-xl font-bold hover:text-yellow-300 transition-colors duration-300">
                    {card.cashPrize}
                  </div>
                </div>
              </div>

              {/* Card Content Below Flower SVG */}
              <div className="text-gray-300 text-sm space-y-2">
                <div>
                  Entry to play:{" "}
                  <span className="font-medium">{card.entryToPlay}</span>
                </div>
                <div>
                  Base Amount:{" "}
                  <span className="font-medium">{card.baseAmount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Text */}
        <div className="mt-10 text-center text-gray-400 text-sm px-4">
          Entry to play: amount you need to pay to join the game.
          <br />
          Base Amount: amount you need in your wallet to play.
        </div>

        {/* Competition Table with dummy data */}
        <div className="mt-16">
          <MyCompetitionTable competitions={dummyCompetitions} />
        </div>
      </div>
    </main>
  );
}
