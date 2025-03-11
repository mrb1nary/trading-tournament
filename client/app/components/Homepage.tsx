"use client";
import Image from "next/image";
import { useState } from "react";
import Navbar from "./Navbar";
import "../globals.css";
import GameList from "./GameList";

export default function HomePage() {
  const [points, setPoints] = useState(15430);
  const userId = "7DGa6...827";
  const profit = "+42.6K%";
  const profitAmount = "+ $1 725.4";

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative overflow-hidden bg-black">
        {/* Enhanced Green Gradient from the Left */}
        <div
          className="absolute w-[200vw] h-[200vw] rounded-full -left-[50vw] top-1/2 -translate-y-1/2 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.35) 10%, rgba(0,0,0,0.1) 70%)",
            backgroundSize: "200% 200%",
          }}
        />
        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 relative z-10 flex flex-col items-center">
          {/* Wallet Address Bar */}
          <div className="flex items-center mb-8 bg-gray-900 bg-opacity-40 rounded-xl p-6 w-full">
            <div className="bg-transparent rounded-full mr-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-black text-3xl">🐸</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between w-full">
              <div>
                <h2 className="text-3xl font-semibold">{userId}</h2>
                <span className="text-gray-400 text-lg">10.58</span>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-lg">{profit}</div>
                <div className="text-green-500 text-lg">{profitAmount}</div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 w-full">
            {/* Left Content */}
            <div className="flex flex-col gap-8">
              {/* Game Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Versus Mode */}
                <div className="flex flex-col items-center bg-gray-900 bg-opacity-40 rounded-xl p-10">
                  <div className="mb-6">
                    <Image
                      src="/assets/versusIcon.png"
                      alt="Versus"
                      width={140}
                      height={140}
                      className="mx-auto"
                    />
                  </div>
                  <h3 className="text-2xl font-semibold mt-4">Mode Versus</h3>
                  <p className="text-green-500 text-lg">
                    One versus One contest
                  </p>
                </div>

                {/* Twister Mode */}
                <div className="flex flex-col items-center bg-gray-900 bg-opacity-40 rounded-xl p-10">
                  <div className="mb-6">
                    <Image
                      src="/assets/twisterIcon.png"
                      alt="Twister"
                      width={140}
                      height={140}
                      className="mx-auto"
                    />
                  </div>
                  <h3 className="text-2xl font-semibold mt-4">Mode Twister</h3>
                  <p className="text-green-500 text-lg">
                    Three and more contest
                  </p>
                </div>
              </div>

              {/* Competition Mode */}
              <div className="relative bg-gray-900 bg-opacity-40 rounded-xl p-8 flex items-center">
                {/* Icon on the Left */}
                <div className="mr-8">
                  <Image
                    src="/assets/competitionIcon.png"
                    alt="Competition"
                    width={160}
                    height={160}
                    className="mx-auto"
                  />
                </div>

                {/* Text on the Right */}
                <div>
                  <h3 className="text-2xl font-semibold mb-4">
                    Mode Competition
                  </h3>
                  <p className="text-green-500 text-lg max-w-md">
                    Five to one hundred contest. Challenge traders from around
                    the world and win incredible cash prizes.
                  </p>
                </div>

                {/* Popular Badge */}
                <span className="absolute top-4 right-4 bg-green-600 text-white px-4 py-1 rounded-full text-lg">
                  Popular #1
                </span>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="bg-gray-900 bg-opacity-70 rounded-xl p-6">
              {/* User Info */}
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <Image
                    src="/assets/userIcon.png"
                    alt=""
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <h3 className="font-semibold text-xl">7DGa6...827</h3>
              </div>

              {/* Points */}
              <div className="border border-green-500 rounded-xl p-4 text-center mb-6 glow-border">
                <span className="text-2xl font-semibold">15 430 pts</span>
              </div>

              {/* Missions */}
              <h3 className="text-xl font-semibold mb-4">Missions</h3>
              <ul className="space-y-4">
                {[
                  { name: "Join Telegram", points: "+1200 pts" },
                  { name: "Win a game", points: "+1300 pts" },
                  { name: "Start a mode", points: "+1250 pts" },
                  { name: "Challenge a player", points: "+1000 pts" },
                ].map((mission, index) => (
                  <li
                    key={index}
                    className="bg-gray-800 bg-opacity-[30%] rounded-xl p-4 flex justify-between items-center"
                  >
                    <span className="text-lg">{mission.name}</span>
                    <span className="text-green-500 text-lg">
                      {mission.points}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="w-full text-right text-lg mt-3 text-gray-400"
              >
                + Show more
              </button>
            </aside>
          </div>

          {/* Game List */}
          <div className="w-full">
            <GameList />
          </div>
        </div>
      </main>
    </>
  );
}
