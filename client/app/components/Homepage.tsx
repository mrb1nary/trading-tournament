"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Navbar from "./Navbar";
import "../globals.css";
import GameList from "./GameList";
import { Footer } from "./Footer";

export default function HomePage() {
  const { publicKey, connected } = useWallet();
  const [walletAddress, setWalletAddress] = useState("Not Connected");
  const profit = connected ? "+42.6K%" : "0%";
  const profitAmount = connected ? "+ $1 725.4" : "$0";

  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58());
    } else {
      setWalletAddress("Not Connected");
    }
  }, [connected, publicKey]);

  const truncatedAddress = walletAddress.includes("...")
    ? walletAddress
    : connected
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "Not Connected";

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative overflow-hidden gradient-background">
        {/* Green Gradient Background */}
        <div
          className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0"
          
        />

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 relative z-10 flex flex-col items-center">
          {/* Wallet Connect Section */}
          <div className="flex justify-between w-full mb-12 space-x-4">
            {[
              { step: "1", text: "Join a game" },
              { step: "2", text: "Trade during the contest" },
              { step: "3", text: "Players with best PnL win" },
            ].map((item, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center text-center rounded-full p-6 w-full shadow-md transition-all duration-300 ${
                  index === 1
                    ? "bg-[#1a1a1a] scale-105 hover:bg-[#2a2a2a]"
                    : "bg-[#0d0d0d] hover:bg-[#1a1a1a]"
                }`}
              >
                <h3 className="text-[#39996c] text-5xl font-bold">
                  {item.step}
                </h3>
                <p className="text-[#39996c] text-2xl font-bold mt-2">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Rest of the content remains same as previous version */}
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 w-full">
            {/* Left Content */}
            <div className="flex flex-col gap-8">
              {/* Game Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Versus Mode */}
                <Link href="/versus" className="block">
                  <div className="flex flex-col items-center bg-gray-900 bg-opacity-40 rounded-xl p-10 hover:bg-opacity-60 transition-all duration-300">
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
                </Link>

                {/* Twister Mode */}
                <Link href="/twister" className="block">
                  <div className="flex flex-col items-center bg-gray-900 bg-opacity-40 rounded-xl p-10 hover:bg-opacity-60 transition-all duration-300">
                    <div className="mb-6">
                      <Image
                        src="/assets/twisterIcon.png"
                        alt="Twister"
                        width={140}
                        height={140}
                        className="mx-auto"
                      />
                    </div>
                    <h3 className="text-2xl font-semibold mt-4">
                      Mode Twister
                    </h3>
                    <p className="text-green-500 text-lg">
                      Three and more contest
                    </p>
                  </div>
                </Link>
              </div>

              {/* Competition Mode */}
              <Link href="/competition" className="block">
                <div className="relative bg-gray-900 bg-opacity-40 rounded-xl p-8 flex items-center hover:bg-opacity-60 transition-all duration-300">
                  <div className="mr-8">
                    <Image
                      src="/assets/competitionIcon.png"
                      alt="Competition"
                      width={160}
                      height={160}
                      className="mx-auto"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">
                      Mode Competition
                    </h3>
                    <p className="text-green-500 text-lg max-w-md">
                      Five to one hundred contest. Challenge traders worldwide.
                    </p>
                  </div>
                  <span className="absolute top-4 right-4 bg-green-600 text-white px-4 py-1 rounded-full text-lg">
                    Popular #1
                  </span>
                </div>
              </Link>
            </div>

            {/* Sidebar */}
            <aside className="bg-gray-900 bg-opacity-70 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <Image
                    src="/assets/userIcon.png"
                    alt="User"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <h3 className="font-semibold text-xl">
                  {connected ? truncatedAddress : "Not Connected"}
                </h3>
              </div>

              <div className="border border-green-500 rounded-xl p-4 text-center mb-6 glow-border">
                <span className="text-2xl font-semibold">15 430 pts</span>
              </div>

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
        <Footer />
      </main>
    </>
  );
}
