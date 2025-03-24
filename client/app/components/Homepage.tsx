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
    start_time: string;
    end_time: string;
    winning_amount: number;
    category: string;
    winner: string | null;
    payout_claimed: boolean;
    participants: {
      profit: number;
      points_earned: number;
      _id: string;
    }[];
  }

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [walletAddress, setWalletAddress] = useState("Not Connected");
  const [balance, setBalance] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [playerData, setPlayerData] = useState<null | {
    _id: string;
    player_wallet_address: string;
    twitter_handle: string;
    player_username: string;
    player_email: string;
    total_points: number;
    total_profit: number;
    competitions_played: unknown[];
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
    } catch (error) {
      console.error("Error fetching player data:", error);

      setPlayerData(null);
    } finally {
      setIsLoading(false);
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
  console.log(playerData);

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
                    {/* Username */}
                    <h3 className="font-semibold text-xl text-white">
                      {playerData
                        ? playerData.player_username
                        : "Not Connected"}
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
                    {playerData ? playerData.twitter_handle : "N/A"}
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
                    {playerData ? playerData.player_username : "N/A"}
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
                  { name: "Join Telegram", points: "+1200 pts" },
                  { name: "Win a game", points: "+1300 pts" },
                  { name: "Start a mode", points: "+1250 pts" },
                  { name: "Challenge a player", points: "+1000 pts" },
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
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black p-6 rounded-3xl border border-gray-700 max-w-md w-full shadow-lg"
                overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50"
                ariaHideApp={false}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <img
                      src="/assets/userIcon.png"
                      alt="User"
                      className="w-14 h-14 rounded-full mr-4"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {playerData?.player_username || "Paul"}
                      </h2>
                      <p className="text-gray-400 text-base">
                        {truncatedAddress}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiSettings size={28} />
                  </button>
                </div>

                <div className="bg-gray-800 rounded-full py-3 px-4 mb-6 text-center">
                  <span className="text-white text-xl font-semibold">
                    {playerData?.total_points || "15,346"} points
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-evenly space-x-6 mb-2">
                    <span className="text-green-500 font-semibold text-lg">
                      Profile
                    </span>
                    <span className="text-gray-400 text-lg">Missions</span>
                  </div>
                  {/* <hr className="border-green-500 border-t-2 w-1/4" /> */}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-white mb-1 block text-lg">
                      TG username
                    </label>
                    <input
                      type="text"
                      value={playerData?.twitter_handle || "Ribbitdotfun"}
                      readOnly
                      className="w-full bg-gray-700 rounded-full py-3 px-4 text-white text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-white mb-1 block text-lg">
                      X Username
                    </label>
                    <input
                      type="text"
                      value={playerData?.twitter_handle || "Ribbitdotfun"}
                      readOnly
                      className="w-full bg-gray-700 rounded-full py-3 px-4 text-white text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-white mb-1 block text-lg">
                      League
                    </label>
                    <input
                      type="text"
                      value="Incoming"
                      readOnly
                      className="w-full bg-gray-700 rounded-full py-3 px-4 text-white text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-white mb-1 block text-lg">
                      Friends
                    </label>
                    <input
                      type="text"
                      value="Coming Soon!"
                      readOnly
                      className="w-full bg-gray-700 rounded-full py-3 px-4 text-white text-lg"
                    />
                  </div>
                </div>

                <button className="w-full bg-green-500 text-black font-semibold rounded-full py-3 mt-6 text-lg">
                  Confirm
                </button>
              </Modal>
            </aside>
          </div>

          {/* Game List */}
          <div className="w-full">
            <GameList
              games={(playerData?.competitions_played as Competition[]) || []}
              playerData={playerData || undefined}
            />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
