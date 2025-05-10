"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import Navbar from "./Navbar";
import "../globals.css";
import GameList from "./GameList";
import { Footer } from "./Footer";
import { FaTelegram, FaWallet } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiCopy, FiSettings } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdOutlineTimer } from "react-icons/md";
import axios from "axios";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Modal from "react-modal";

export default function HomePage() {
  interface Competition {
    _id: string;
    authority: string;
    id: number;
    max_players: number;
    current_players: number;
    entry_fee: number;
    base_amount: number;
    start_time: string; // ISO date string
    end_time: string; // ISO date string
    winning_amount: number;
    category:
      | "TwoPlayers"
      | "SixPlayers"
      | "TwelvePlayers"
      | "TwentyFivePlayers";
    winner: string | null; // Player ID
    payout_claimed: boolean;
    active: boolean;
    participants: string[]; // Array of Player IDs
  }

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [walletAddress, setWalletAddress] = useState("Not Connected");
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [xUsername, setXUsername] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [playerData, setPlayerData] = useState<null | {
    _id: string;
    wallet: string;
    username: string;
    email: string;
    twitter: string;
    telegram: string;
    total_profit: number;
    total_points: number;
    total_competitions: number;
    usdc_profit: number;
    usdt_profit: number;
    sol_profit: number;
    win_rate: number;
    total_trades: number;
    average_position: number;
    competitions: Array<{
      competition_id: string;
      category: string;
      entry_fee: number;
      prize_pool: number;
      max_players: number;
      position: number;
      profit: number;
      points_earned: number;
      timeframe: {
        start: string;
        end: string;
      };
      winner: string | null;
    }>;
  }>(null);

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

  const fetchPlayerData = async (address: string) => {
    if (!address || !apiUrl) return;

    try {
      const response = await axios.get(`${apiUrl}/fetchPlayer/${address}`);
      setPlayerData(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error("Error fetching player data:", error);

      setPlayerData(null);
    } finally {
      setIsLoading(false);
      // console.log(playerData);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      setWalletAddress(address);
      fetchWalletBalance();

      // Only fetch player data if we have a valid wallet address
      if (address !== "Not Connected") {
        fetchPlayerData(address);
      }
    } else {
      setWalletAddress("Not Connected");
      setPlayerData(null);
    }
  }, [connected, publicKey, apiUrl]);

  useEffect(() => {
    if (playerData) {
      setUsername(playerData.username || "");
      setTgUsername(playerData.telegram || "");
      setXUsername(playerData.twitter || "");
    }
  }, [playerData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      Modal.setAppElement(document.body);
    }
  }, []);

  const truncatedAddress = walletAddress.includes("...")
    ? walletAddress
    : connected
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "Not Connected";

  const copyWalletAddress = () => {
    if (connected && publicKey) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied to clipboard!", {
        position: "bottom-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleConfirm = async () => {
    if (!connected || !publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      // Log the data being sent
      console.log("Updating player with:", {
        player_wallet_address: walletAddress,
        player_username: username,
        twitter_handle: xUsername, // Changed from tgUsername
        tg_username: tgUsername, // New field
      });

      // Make the API request with corrected field names
      const response = await axios.post(`${apiUrl}/updatePlayerInfo`, {
        player_wallet_address: walletAddress,
        player_username: username,
        twitter_handle: xUsername, // Should come from Twitter input
        tg_username: tgUsername, // Should come from Telegram input
      });

      // Handle successful response
      if (response.data.success) {
        toast.success("Profile updated successfully!");

        // Update local state with correct field names
        if (playerData) {
          setPlayerData({
            ...playerData,
            username: username,
            twitter: xUsername,
            telegram: tgUsername, // New field
          });
        }
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating player info:", error);

      // Improved error handling
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Handle backend validation errors
          if (error.response.data.errors) {
            error.response.data.errors.forEach((err: string) =>
              toast.error(err)
            );
          } else {
            toast.error(error.response.data.message || "Update failed");
          }
        } else {
          toast.error("Network error - please check your connection");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      closeModal();
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
          {/* <div className="flex justify-between w-full mb-12 space-x-4">
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
          </div> */}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 w-full">
            {/* Left Content */}
            <div className="flex flex-col gap-8 h-full">
              {/* Game Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                {/* Versus Mode */}
                <Link href="/versus" className="block h-full">
                  <div className="mode-card flex flex-col items-center justify-between card-bg rounded-xl p-10 transition-all duration-300 h-full relative">
                    <div className="absolute top-4 right-4 group">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-400 hover:text-green-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="absolute hidden group-hover:block right-0 bg-gray-800 text-white p-2 rounded shadow-lg z-10 w-96 text-center">
                        Versus is a 1vs1 mode Where you can challenge your
                        friend or traders from around. You can join a match or
                        create your own by setting your own rules, cashprize,
                        total Time, fees and base amount.
                      </div>
                    </div>
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
                      2 Players. 1 Winner!
                    </p>
                  </div>
                </Link>

                {/* Twister Mode */}
                <Link href="/twister" className="block h-full">
                  <div className="mode-card flex flex-col items-center justify-between card-bg rounded-xl p-10 transition-all duration-300 h-full relative">
                    <div className="absolute top-4 right-4 group">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-400 hover:text-green-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="absolute hidden group-hover:block right-0 bg-gray-800 text-white p-2 rounded shadow-lg z-10 w-96 text-center">
                        Twister is 1vs1vs1 mode Where you fan challenge two
                        others traders in a hight stake battle. You can join an
                        existing match or create your own bybsetting the rules,
                        including the cashprize, total Time, start, end and
                        entry fees.
                      </div>
                    </div>
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
                      1v1v1. Triple the fun
                    </p>
                  </div>
                </Link>

                {/* Competition Mode */}
                <Link
                  href="/competition"
                  className="block h-full md:col-span-2"
                >
                  <div className="mode-card flex flex-col items-center justify-between card-bg rounded-xl p-10 transition-all duration-300 h-full relative">
                    <div className="absolute top-4 right-4 group">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-400 hover:text-green-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="absolute hidden group-hover:block right-0 bg-gray-800 text-white p-2 rounded shadow-lg z-10 w-96 text-center">
                        Competition mode lets you face off 6 to +100 traders
                        worldwide in intense PvP compétition trading.
                      </div>
                    </div>
                    <div className="mb-6 transition-transform duration-300">
                      <Image
                        src="/assets/competitionIcon.png"
                        alt="Competition"
                        width={240}
                        height={240}
                        className="mx-auto transition-all duration-300"
                      />
                    </div>
                    <h3 className="text-2xl font-semibold mt-4 transition-all duration-300">
                      Mode Competition
                    </h3>
                    <p className="text-green-500 text-lg transition-all duration-300">
                      From 6 to 100+ players worldwide. Claim the throne!
                    </p>
                  </div>
                </Link>
              </div>
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
                    {/* Username */}
                    <h3 className="font-semibold text-xl text-white">
                      {playerData ? playerData.username : "Not Connected"}
                    </h3>
                    {/* Wallet Address */}
                    <div className="flex items-center">
                      <p className="text-gray-400 text-sm">
                        {connected
                          ? isLoading
                            ? "Loading..."
                            : truncatedAddress
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
                  </div>
                </div>

                {/* Settings Icon */}
                <button
                  type="button"
                  className="text-gray-400 hover:text-white"
                  onClick={openModal}
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
                    {connected ? `${balance} SOL` : "Not Connected"}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaXTwitter className="mr-2" size={20} />
                    {playerData ? playerData.twitter : "N/A"}
                  </div>
                </div>

                {/* Second Row */}
                <div className="flex justify-between w-full">
                  <div className="flex items-center text-gray-400 text-sm font-semibold">
                    <MdOutlineTimer className="mr-2" size={20} />
                    League: incoming
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaTelegram className="mr-2" size={20} />
                    {playerData ? playerData.username : "N/A"}
                  </div>
                </div>
              </div>

              {/* Points Section */}
              <div className="border border-green-500 rounded-xl p-4 text-center mb-10 animated-glow-border">
                <span className="text-2xl font-semibold text-white">
                  {playerData ? `${playerData.total_points} pts` : "0 pts"}
                </span>
              </div>

              {/* Missions Section */}
              <h3 className="text-xl font-semibold mb-6 text-white">
                Missions
              </h3>
              <ul className="space-y-6">
                {[
                  { name: "Join us on TG", points: "+1200 pts" },
                  { name: "Join us on X", points: "+1300 pts" },
                  { name: "Read Documentation", points: "+1250 pts" },
                  { name: "Coming Soon!", points: "+1000 pts" },
                ].map((mission, index) => (
                  <li
                    key={index}
                    className="bg-gray-800 bg-opacity-[30%] rounded-xl p-4 flex justify-between items-center relative overflow-hidden group transition-all duration-300 hover:bg-opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                  >
                    <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white opacity-10 group-hover:animate-shine" />
                    <span className="text-lg text-white group-hover:text-green-400 transition-colors duration-300 relative">
                      {mission.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
                    </span>
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
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black p-5 rounded-3xl border border-gray-700 max-w-md w-full shadow-lg animate-fadeIn"
                overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 animate-backdropBlur"
                ariaHideApp={false}
                closeTimeoutMS={300}
              >
                <div className="flex items-center justify-between mb-4 animate-slideDown">
                  <div className="flex items-center">
                    <div className="relative w-12 h-12 overflow-hidden rounded-full mr-3 border-2 border-green-500 animate-pulse">
                      <img
                        src="/assets/userIcon.png"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="animate-fadeIn">
                      <h2 className="text-xl font-bold text-white bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        {username || playerData?.username || "Enter Username"}
                      </h2>
                      <p className="text-gray-400 text-sm flex items-center">
                        {truncatedAddress}
                        <button
                          onClick={copyWalletAddress}
                          className="ml-2 text-gray-500 hover:text-green-400 transition-colors"
                        >
                          <FiCopy size={12} />
                        </button>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:rotate-90"
                  >
                    <FiSettings size={24} />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-full py-2 px-4 mb-4 text-center shadow-inner animate-glow">
                  <span className="text-white text-lg font-semibold">
                    <span className="text-green-400">
                      {playerData?.total_points || "15,346"}
                    </span>{" "}
                    points
                  </span>
                </div>

                <div className="mb-3 animate-fadeIn">
                  <div className="flex justify-evenly space-x-6 mb-1 relative">
                    <span className="text-green-500 font-semibold text-base cursor-pointer relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-green-500 after:bottom-0 after:left-0">
                      Profile
                    </span>
                    <span className="text-gray-400 text-base cursor-pointer hover:text-gray-300 transition-colors">
                      Missions
                    </span>
                  </div>
                </div>
                <div> Hey</div>

                <div className="space-y-3 animate-slideUp">
                  <div className="transform transition-all duration-300 hover:scale-102">
                    <label className="text-white mb-1 block text-sm">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-700 rounded-full py-2 px-4 text-white text-base border border-transparent focus:border-green-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="transform transition-all duration-300 hover:scale-102">
                    <label className="text-white mb-1 block text-sm">
                      TG username
                    </label>
                    <input
                      type="text"
                      value={tgUsername}
                      onChange={(e) => setTgUsername(e.target.value)}
                      className="w-full bg-gray-700 rounded-full py-2 px-4 text-white text-base border border-transparent focus:border-green-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter your Telegram username"
                    />
                  </div>
                  <div className="transform transition-all duration-300 hover:scale-102">
                    <label className="text-white mb-1 block text-sm">
                      X Username
                    </label>
                    <input
                      type="text"
                      value={xUsername}
                      onChange={(e) => setXUsername(e.target.value)}
                      className="w-full bg-gray-700 rounded-full py-2 px-4 text-white text-base border border-transparent focus:border-green-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter your X username"
                    />
                  </div>
                  <div className="opacity-70">
                    <label className="text-white mb-1 block text-sm">
                      League
                    </label>
                    <input
                      type="text"
                      value="Incoming"
                      readOnly
                      className="w-full bg-gray-700 rounded-full py-2 px-4 text-white text-base cursor-not-allowed"
                    />
                  </div>
                  <div className="opacity-70">
                    <label className="text-white mb-1 block text-sm">
                      Friends
                    </label>
                    <input
                      type="text"
                      value="Coming Soon!"
                      readOnly
                      className="w-full bg-gray-700 rounded-full py-2 px-4 text-white text-base cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-green-500 to-green-400 text-black font-semibold rounded-full py-2.5 mt-4 text-base transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 active:scale-95"
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
              </Modal>
            </aside>
          </div>

          {/* Game List */}
          <div className="w-full">
            <GameList
              games={
                playerData?.competitions?.map((comp) => ({
                  _id: comp.competition_id,
                  authority: "",
                  id: 0,
                  max_players: comp.max_players,
                  current_players: 0,
                  entry_fee: comp.entry_fee,
                  base_amount: 0,
                  start_time: comp.timeframe.start,
                  end_time: comp.timeframe.end,
                  winning_amount: comp.prize_pool,
                  category: comp.category as Competition["category"],
                  winner: comp.winner,
                  payout_claimed: false,
                  active: false,
                  participants: [],
                })) || []
              }
              playerData={playerData || undefined}
            />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
