/* eslint-disable @typescript-eslint/no-unused-vars */
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

import { FaTelegram, FaWallet } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import { FiCopy, FiSettings } from "react-icons/fi";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { MdOutlineTimer } from "react-icons/md";

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
        <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0" />

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
            <div className="flex flex-col gap-8 h-full">
              {/* Game Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                {/* Versus Mode */}
                <Link href="/versus" className="block h-full">
                  <div className="mode-card flex flex-col items-center justify-between bg-[#0c0c0c] rounded-xl p-10 transition-all duration-300 h-full">
                    <div className="mb-6 transition-transform duration-300">
                      <Image
                        src="/assets/versusIcon.png"
                        alt="Versus"
                        width={240}
                        height={240}
                        className="mx-auto transition-all duration-300"
                      />
                    </div>
                    <h3 className="text-2xl font-semibold mt-4 transition-all duration-300">
                      Mode Versus
                    </h3>
                    <p className="text-green-500 text-lg transition-all duration-300">
                      One versus One contest
                    </p>
                  </div>
                </Link>

                {/* Twister Mode */}
                <Link href="/twister" className="block h-full">
                  <div className="mode-card flex flex-col items-center justify-between bg-[#0c0c0c]rounded-xl p-10 transition-all duration-300 h-full">
                    <div className="mb-6 transition-transform duration-300">
                      <Image
                        src="/assets/twisterIcon.png"
                        alt="Twister"
                        width={240}
                        height={240}
                        className="mx-auto transition-all duration-300"
                      />
                    </div>
                    <h3 className="text-2xl font-semibold mt-4 transition-all duration-300">
                      Mode Twister
                    </h3>
                    <p className="text-green-500 text-lg transition-all duration-300">
                      Three and more contest
                    </p>
                  </div>
                </Link>
              </div>

              {/* Competition Mode */}
              <Link href="/competition" className="block">
                <div className="competition-card relative bg-[#0c0c0c] rounded-xl p-8 flex items-center transition-all duration-300">
                  <div className="mr-8 transition-transform duration-300">
                    <Image
                      src="/assets/competitionIcon.png"
                      alt="Competition"
                      width={160}
                      height={160}
                      className="mx-auto transition-all duration-300"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 transition-all duration-300">
                      Mode Competition
                    </h3>
                    <p className="text-green-500 text-lg max-w-md transition-all duration-300">
                      Five to one hundred contest. Challenge traders worldwide.
                    </p>
                  </div>
                  <span className="absolute top-4 right-4 bg-green-600 text-white px-4 py-1 rounded-full text-lg transition-all duration-300">
                    Popular #1
                  </span>
                </div>
              </Link>
            </div>

            {/* Sidebar */}
            <aside className="bg-[#151718] rounded-xl p-15">
              {/* User Info Section */}
              <div className="flex items-center justify-between mb-6">
                {/* Avatar and User Info */}
                <div className="flex items-center">
                  <Image
                    src="/assets/userIcon.png"
                    alt="User"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                  <div className="ml-4">
                    {/* Wallet Address */}
                    <h3 className="font-semibold text-xl text-white">
                      tSg5...2eqd
                    </h3>
                    {/* Username with Copy Icon */}
                    <div className="flex items-center">
                      <p className="text-gray-400 text-sm">7DGa66</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("7DGa66");
                          toast.success("Username copied to clipboard!", {
                            position: "top-right",
                            autoClose: 4000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                          });
                        }}
                        className="ml-2 text-gray-400 hover:text-green-500 hover:scale-110 transition-all duration-200"
                        title="Copy to clipboard"
                      >
                        <FiCopy size={14} />
                      </button>
                    </div>

                    {/* Toast Container */}
                    <ToastContainer />
                  </div>
                </div>

                {/* Settings Icon */}
                <button
                  type="button"
                  className="text-gray-400 hover:text-white"
                >
                  <FiSettings size={24} />
                </button>
              </div>

              {/* Additional Information Section */}
              <div className="flex flex-col gap-4 mb-6 w-full">
                {/* First Row */}
                <div className="flex justify-between w-full">
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaWallet className="mr-2" size={20} />
                    Hb44...Xby
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaXTwitter className="mr-2" size={20} />
                    Jonh_BBUD
                  </div>
                </div>

                {/* Second Row */}
                <div className="flex justify-between w-full">
                  <div className="flex items-center text-red-500 text-sm font-semibold">
                    <MdOutlineTimer className="mr-2" size={20} />
                    League: incoming
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaTelegram className="mr-2" size={20} />
                    Jonh_Bud
                  </div>
                </div>
              </div>

              {/* Points Section */}
              <div className="border border-green-500 rounded-xl p-4 text-center mb-6 glow-border">
                <span className="text-2xl font-semibold text-white">
                  15,430 pts
                </span>
              </div>

              {/* Missions Section */}
              <h3 className="text-xl font-semibold mb-4 text-white">
                Missions
              </h3>
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
                    <span className="text-lg text-white">{mission.name}</span>
                    <span className="text-green-500 text-lg">
                      {mission.points}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Show More Button */}
              <button
                type="button"
                className="w-full text-right text-lg mt-3 text-gray-400 hover:text-white"
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
