/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Navbar from "../../components/Navbar";
import Hero from "../../components/Hero";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import axios from "axios";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface GameData {
  entry_fee: number;
  base_amount: number;
  start_time: number | null;
  end_time: number | null;
  winning_amount: number;
  custom_entry_fee: string;
  custom_base_amount: string;
}

const PLATFORM_FEE_PERCENTAGE = 10; // 10%

function CreateGame() {
  const wallet = useWallet();

  const calculateMaxWinningAmount = (entryFee: number): number => {
    try {
      const totalPlayers = 2;
      const totalPool = entryFee * totalPlayers;
      const platformFee = totalPool * (PLATFORM_FEE_PERCENTAGE / 100);
      return totalPool - platformFee;
    } catch (error) {
      console.error("Error calculating winning amount:", error);
      return 0;
    }
  };

  const initialGameState: GameData = {
    entry_fee: 0.05,
    base_amount: 10,
    start_time: null,
    end_time: null,
    winning_amount: calculateMaxWinningAmount(0.05),
    custom_entry_fee: "",
    custom_base_amount: "",
  };

  const [gameData, setGameData] = useState<GameData>(initialGameState);
  const [isCustomEntryFee, setIsCustomEntryFee] = useState(false);
  const [isCustomBaseAmount, setIsCustomBaseAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      console.log("Connected wallet:", wallet.publicKey.toString());
    }
  }, [wallet.connected, wallet.publicKey]);

  // Update winning amount when entry fee changes
  useEffect(() => {
    try {
      const maxWinningAmount = calculateMaxWinningAmount(gameData.entry_fee);
      setGameData((prevData) => ({
        ...prevData,
        winning_amount: maxWinningAmount,
      }));
    } catch (error) {
      console.error("Error updating winning amount:", error);
    }
  }, [gameData.entry_fee]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    try {
      const { name, value } = e.target;

      if (name === "entry_fee") {
        if (value === "custom") {
          setIsCustomEntryFee(true);
        } else {
          setIsCustomEntryFee(false);
          setGameData({ ...gameData, entry_fee: parseFloat(value) });
        }
      } else if (name === "custom_entry_fee") {
        setGameData({
          ...gameData,
          entry_fee: parseFloat(value),
          custom_entry_fee: value,
        });
      } else if (name === "base_amount") {
        if (value === "custom") {
          setIsCustomBaseAmount(true);
        } else {
          setIsCustomBaseAmount(false);
          setGameData({ ...gameData, base_amount: parseInt(value) });
        }
      } else if (name === "custom_base_amount") {
        setGameData({
          ...gameData,
          base_amount: parseInt(value),
          custom_base_amount: value,
        });
      } else {
        setGameData({ ...gameData, [name]: value });
      }
    } catch (error) {
      console.error("Error handling input change:", error);
    }
  };

  const handleDateChange = (name: keyof GameData, newValue: Dayjs | null) => {
    try {
      setGameData({
        ...gameData,
        [name]: newValue ? newValue.valueOf() : null, // milliseconds
      });
    } catch (error) {
      console.error("Error handling date change:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!wallet.connected) {
        toast.error("Please connect your wallet first!");
        return;
      }

      if (!gameData.start_time || !gameData.end_time) {
        toast.error("Please select both start and end times");
        return;
      }

      // Validate time difference (minimum 5 minutes)
      const minDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (gameData.end_time - gameData.start_time < minDuration) {
        toast.error("Minimum game duration is 5 minutes");
        return;
      }

      setIsSubmitting(true);

      const finalGameData = {
        authority: wallet.publicKey?.toString(),
        entry_fee: Math.floor(gameData.entry_fee * LAMPORTS_PER_SOL),
        base_amount: Math.floor(gameData.base_amount * 1e6), // USDT has 6 decimals
        start_time: gameData.start_time, // Already in milliseconds
        end_time: gameData.end_time, // Already in milliseconds
        winning_amount: Math.floor(gameData.winning_amount * LAMPORTS_PER_SOL),
      };

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const response = await axios.post(
        `${apiUrl}/createVersusParty`,
        finalGameData
      );

      if (response.data.success) {
        toast.success("Versus game created successfully!");
        console.log("Game created:", response.data);
        setGameData(initialGameState);
      } else {
        toast.error(response.data.error || "Failed to create versus game");
      }
    } catch (error) {
      console.error("Submission error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Network error");
      } else {
        toast.error("Failed to create game");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const entryFeeOptions = [
    { value: 0.05, label: "0.05 SOL" },
    { value: 0.5, label: "0.5 SOL" },
    { value: 1, label: "1 SOL" },
    { value: "custom", label: "Custom" },
  ];

  const baseAmountOptions = [
    { value: 10, label: "10 USDT" },
    { value: 25, label: "25 USDT" },
    { value: 50, label: "50 USDT" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <div className="relative z-10">
        <Navbar />
        <Hero title="Create" subtitle="Game" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8"
        >
          <form
            onSubmit={handleSubmit}
            className="max-w-6xl mx-auto bg-gray-800/50 backdrop-blur-md rounded-xl shadow-2xl p-8"
          >
            {wallet.connected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <p className="text-sm text-gray-300 mb-1">
                  Authority (Your Wallet):
                </p>
                {wallet.publicKey ? (
                  <p className="font-mono text-sm break-all">
                    {wallet.publicKey.toString()}
                  </p>
                ) : (
                  <p className="font-mono text-sm">Connect Your Wallet</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 bg-red-900/50 rounded-lg border border-red-700"
              >
                <p className="text-center text-red-200">
                  Please connect your wallet to create a game
                </p>
              </motion.div>
            )}

            {/* Entry Fee */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label
                htmlFor="entry_fee"
                className="block mb-2 text-lg font-semibold"
              >
                Entry Fee:
              </label>
              <select
                id="entry_fee"
                name="entry_fee"
                value={isCustomEntryFee ? "custom" : gameData.entry_fee}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-green-500 focus:ring focus:ring-green-500/50 transition-all duration-300"
                required
              >
                {entryFeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isCustomEntryFee && (
                <motion.input
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  type="number"
                  name="custom_entry_fee"
                  placeholder="Custom Entry Fee (SOL)"
                  value={gameData.custom_entry_fee}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-green-500 focus:ring focus:ring-green-500/50 transition-all duration-300"
                  step="0.01"
                  min="0"
                  required
                />
              )}
            </motion.div>

            {/* Base Amount */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label
                htmlFor="base_amount"
                className="block mb-2 text-lg font-semibold"
              >
                Base Amount:
              </label>
              <select
                id="base_amount"
                name="base_amount"
                value={isCustomBaseAmount ? "custom" : gameData.base_amount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-green-500 focus:ring focus:ring-green-500/50 transition-all duration-300"
                required
              >
                {baseAmountOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isCustomBaseAmount && (
                <motion.input
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  type="number"
                  name="custom_base_amount"
                  placeholder="Custom Base Amount (USDT)"
                  value={gameData.custom_base_amount}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-green-500 focus:ring focus:ring-green-500/50 transition-all duration-300"
                  step="1"
                  min="1"
                  required
                />
              )}
            </motion.div>

            {/* Category */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label
                htmlFor="category"
                className="block mb-2 text-lg font-semibold"
              >
                Category:
              </label>
              <select
                id="category"
                name="category"
                value="Versus"
                disabled
                className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-green-500 focus:ring focus:ring-green-500/50 transition-all duration-300"
              >
                <option value="Versus">Versus</option>
              </select>
            </motion.div>

            {/* Winning Amount */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label
                htmlFor="winning_amount"
                className="block mb-2 text-lg font-semibold"
              >
                Winning Amount:
              </label>
              <div className="px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600">
                <span className="text-2xl font-bold text-green-400">
                  {gameData.winning_amount.toFixed(3)} SOL
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  (Total pool minus {PLATFORM_FEE_PERCENTAGE}% platform fee)
                </p>
              </div>
            </motion.div>

            {/* Start Time */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label
                htmlFor="start_time"
                className="block mb-2 text-lg font-semibold"
              >
                Start Time:
              </label>
              <DateTimePicker
                value={gameData.start_time ? dayjs(gameData.start_time) : null}
                onChange={(newValue) =>
                  handleDateChange("start_time", newValue)
                }
                className="w-full"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    className:
                      "bg-gray-700/50 rounded-lg text-white border border-gray-600",
                    sx: {
                      "& .MuiInputBase-root": {
                        color: "white",
                        fontSize: "1rem",
                        padding: "0.5rem",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.2)",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "white",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#10b981",
                      },
                    },
                  },
                }}
              />
            </motion.div>

            {/* End Time */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label
                htmlFor="end_time"
                className="block mb-2 text-lg font-semibold"
              >
                End Time:
              </label>
              <DateTimePicker
                value={gameData.end_time ? dayjs(gameData.end_time) : null}
                onChange={(newValue) => handleDateChange("end_time", newValue)}
                className="w-full"
                //@ts-ignore
                minDateTime={
                  gameData.start_time ? dayjs(gameData.start_time) : null
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    className:
                      "bg-gray-700/50 rounded-lg text-white border border-gray-600",
                    sx: {
                      "& .MuiInputBase-root": {
                        color: "white",
                        fontSize: "1rem",
                        padding: "0.5rem",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.2)",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "white",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#10b981",
                      },
                    },
                  },
                }}
              />
            </motion.div>

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
              disabled={!wallet.connected || isSubmitting}
              whileHover={{
                scale: wallet.connected && !isSubmitting ? 1.05 : 1,
              }}
              whileTap={{ scale: wallet.connected && !isSubmitting ? 0.95 : 1 }}
            >
              {isSubmitting ? "Creating..." : "Create Versus Game"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </main>
  );
}

export default CreateGame;
