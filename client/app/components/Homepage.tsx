"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
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
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function HomePage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [walletAddress, setWalletAddress] = useState("Not Connected");
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58());
      fetchWalletBalance();
    } else {
      setWalletAddress("Not Connected");
      setBalance(0);
    }
  }, [connected, publicKey]);

  const fetchWalletBalance = async () => {
    if (connected && publicKey && connection) {
      try {
        setIsLoading(true);
        const walletBalance = await connection.getBalance(publicKey);
        setBalance(walletBalance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const truncatedAddress = walletAddress.includes("...")
    ? walletAddress
    : connected
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "Not Connected";

  const copyWalletAddress = () => {
    if (connected && publicKey) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied to clipboard!", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative overflow-hidden ">
        {/* Green Gradient Background */}
        <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

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

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 w-full">
            {/* Left Content */}
            <div className="flex flex-col gap-8 h-full">
              {/* Game Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                {/* Versus Mode */}
                <Link href="/versus" className="block h-full">
                  <div className="mode-card flex flex-col items-center justify-between card-bg rounded-xl p-10 transition-all duration-300 h-full">
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
                  <div className="mode-card flex flex-col items-center justify-between card-bg rounded-xl p-10 transition-all duration-300 h-full">
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
                <div className="competition-card mode-card relative card-bg rounded-xl p-12 flex items-center transition-all duration-300 h-[380px]">
                  <div className="mr-10 transition-transform duration-300">
                    <Image
                      src="/assets/competitionIcon.png"
                      alt="Competition"
                      width={280}
                      height={280}
                      className="mx-auto transition-all duration-300"
                    />
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold mb-4 transition-all duration-300">
                      Mode Competition
                    </h3>
                    <p className="text-green-500 text-xl max-w-md transition-all duration-300">
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
            <aside className="bg-gradient-to-tr from-[#1e2427] to-[#121518] rounded-xl p-8">
              {/* User Info Section */}
              <div className="flex items-center justify-between mb-16">
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
                      {connected ? truncatedAddress : "Not Connected"}
                    </h3>
                    {/* Balance display */}
                    <div className="flex items-center">
                      <p className="text-gray-400 text-sm">
                        {connected
                          ? isLoading
                            ? "Loading..."
                            : `${balance.toFixed(4)} SOL`
                          : "Connect your wallet"}
                      </p>
                      {connected && (
                        <button
                          onClick={copyWalletAddress}
                          className="ml-2 text-gray-400 hover:text-green-500 hover:scale-110 transition-all duration-200"
                          title="Copy wallet address"
                        >
                          <FiCopy size={14} />
                        </button>
                      )}
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
              <div className="flex flex-col gap-6 mb-10 w-full">
                {/* First Row */}
                <div className="flex justify-between w-full">
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaWallet className="mr-2" size={20} />
                    {connected ? truncatedAddress : "Not Connected"}
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
              <div className="border border-green-500 rounded-xl p-4 text-center mb-10 animated-glow-border">
                <span className="text-2xl font-semibold text-white">
                  15,430 pts
                </span>
              </div>

              {/* Missions Section */}
              <h3 className="text-xl font-semibold mb-6 text-white">
                Missions
              </h3>
              <ul className="space-y-6">
                {[
                  { name: "Join Telegram", points: "+1200 pts" },
                  { name: "Win a game", points: "+1300 pts" },
                  { name: "Start a mode", points: "+1250 pts" },
                  { name: "Challenge a player", points: "+1000 pts" },
                ].map((mission, index) => (
                  <li
                    key={index}
                    className="bg-gray-800 bg-opacity-[30%] rounded-xl p-4 flex justify-between items-center relative overflow-hidden group transition-all duration-300 hover:bg-opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                  >
                    {/* Shine effect overlay */}
                    <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white opacity-10 group-hover:animate-shine" />

                    {/* Left side with gradient border on hover */}
                    <span className="text-lg text-white group-hover:text-green-400 transition-colors duration-300 relative">
                      {mission.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
                    </span>

                    {/* Right side with scale effect on hover */}
                    <span className="text-green-500 text-lg group-hover:scale-110 group-hover:font-bold transition-all duration-300">
                      {mission.points}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Show More Button */}
              <button
                type="button"
                className="w-full text-right text-lg mt-6 text-gray-400 hover:text-white"
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
