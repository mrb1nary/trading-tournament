"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

interface GameData {
  entry_fee: number;
  base_amount: number;
  start_time: number | null;
  end_time: number | null;
  winning_amount: number;
  category: string;
  custom_entry_fee: string;
  custom_base_amount: string;
}

function CreateGame() {
  const wallet = useWallet();
  const PLATFORM_FEE_PERCENTAGE = 10; // 10%

  // Map category to number of players
  const categoryToPlayers: Record<string, number> = {
    TwoPlayers: 2,
    FourPlayers: 4,
    SixPlayers: 6,
    TwelvePlayers: 12,
    TwentyFivePlayers: 25,
  };

  const calculateMaxWinningAmount = (
    entryFee: number,
    category: string
  ): number => {
    try {
      const totalPlayers = categoryToPlayers[category];
      const totalPool = entryFee * totalPlayers;
      const platformFee = totalPool * (PLATFORM_FEE_PERCENTAGE / 100);
      return totalPool - platformFee;
    } catch (error) {
      console.error("Error calculating winning amount:", error);
      return 0;
    }
  };

  const [gameData, setGameData] = useState<GameData>({
    entry_fee: 0.05,
    base_amount: 10,
    start_time: null,
    end_time: null,
    winning_amount: calculateMaxWinningAmount(0.05, "SixPlayers"),
    category: "SixPlayers",
    custom_entry_fee: "",
    custom_base_amount: "",
  });

  const [isCustomEntryFee, setIsCustomEntryFee] = useState(false);
  const [isCustomBaseAmount, setIsCustomBaseAmount] = useState(false);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      console.log("Connected wallet:", wallet.publicKey.toString());
    }
  }, [wallet.connected, wallet.publicKey]);

  // Update winning amount when entry fee or category changes
  useEffect(() => {
    try {
      const maxWinningAmount = calculateMaxWinningAmount(
        gameData.entry_fee,
        gameData.category
      );
      setGameData((prevData) => ({
        ...prevData,
        winning_amount: maxWinningAmount,
      }));
    } catch (error) {
      console.error("Error updating winning amount:", error);
    }
  }, [gameData.entry_fee, gameData.category]);

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
        [name]: newValue ? newValue.unix() : null,
      });
    } catch (error) {
      console.error("Error handling date change:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

      const finalGameData = {
        authority: wallet.publicKey?.toString(),
        entry_fee: gameData.entry_fee,
        base_amount: gameData.base_amount,
        start_time: gameData.start_time,
        end_time: gameData.end_time,
        winning_amount: parseFloat(gameData.winning_amount.toFixed(3)),
        category: gameData.category,
      };

      console.log(finalGameData);
      toast.success("Game created successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while creating the game.");
    }
  };

  const categoryOptions = [
    { value: "TwoPlayers", label: "2 Players" },
    { value: "FourPlayers", label: "4 Players" },
    { value: "SixPlayers", label: "6 Players" },
    { value: "TwelvePlayers", label: "12 Players" },
    { value: "TwentyFivePlayers", label: "25 Players" },
  ];

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
                value={gameData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-green-500 focus:ring focus:ring-green-500/50 transition-all duration-300"
                required
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </motion.div>

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
                value={
                  gameData.start_time ? dayjs.unix(gameData.start_time) : null
                }
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
                value={gameData.end_time ? dayjs.unix(gameData.end_time) : null}
                onChange={(newValue) => handleDateChange("end_time", newValue)}
                className="w-full"
                //@ts-expect-error IDK I will fix it later
                minDateTime={
                  gameData.start_time ? dayjs.unix(gameData.start_time) : null
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
              disabled={!wallet.connected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Game
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
