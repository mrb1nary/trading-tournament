/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import { FaCreditCard, FaWallet } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import { HiCheck } from "react-icons/hi";
import { format, parse } from "date-fns";
import axios from "axios";

interface Transaction {
  signature: string;
  date: string | null;
  status: string;
}

interface Asset {
  mint: string;
  amount: number;
  decimals: number;
  price?: number;
  name?: string;
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const connection = new Connection("https://api.devnet.solana.com");

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Helper Functions
function formatDate(dateString: string): string {
  try {
    const date = parse(dateString, "M/d/yyyy, h:mm:ss a", new Date());
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${suffix} ${format(date, "MMM yyyy")}`;
  } catch (error) {
    console.error("Error in formatDate:", error);
    return "Invalid Date";
  }
}

async function fetchTokenPrices(
  mints: string[]
): Promise<{ [key: string]: number }> {
  if (!mints.length) return {};

  try {
    const response = await axios.post(
      HELIUS_RPC_URL,
      {
        jsonrpc: "2.0",
        id: "price-fetch",
        method: "getAssetBatch",
        params: { ids: mints },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HELIUS_API_KEY}`,
        },
      }
    );

    if (!response.data?.result) {
      console.error("Invalid API response format", response.data);
      return {};
    }

    return response.data.result.reduce(
      (acc: { [key: string]: number }, token: any) => {
        if (token?.id && token?.token_info?.price_info?.price_per_token) {
          acc[token.id] = token.token_info.price_info.price_per_token;
        }
        return acc;
      },
      {}
    );
  } catch (error) {
    console.error("Error fetching prices:", error);
    return {};
  }
}

function MyGames() {
  const { publicKey } = useWallet();

  const [activeTab, setActiveTab] = useState<"wallet" | "activity">("wallet");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [loadingTxns, setLoadingTxns] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!publicKey) return;

      try {
        setLoadingAssets(true);

        const solBalanceLamports = await connection.getBalance(publicKey);
        const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          }
        );

        const splTokens = tokenAccounts.value.map((account) => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount || 0,
            decimals: info.tokenAmount.decimals || 0,
          };
        });

        const combinedAssets = [
          { mint: SOL_MINT, amount: solBalance, decimals: 9 },
          ...splTokens,
        ];

        const prices = await fetchTokenPrices(
          combinedAssets.map((a) => a.mint)
        );

        const assetsWithPrices = combinedAssets.map((asset) => ({
          ...asset,
          price: prices[asset.mint] || 0,
          name:
            asset.mint === SOL_MINT ? "SOL" : asset.mint.slice(0, 4) + "...",
        }));

        setAssets(assetsWithPrices);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
        setError("Failed to load assets.");
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, [publicKey]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey) return;

      try {
        setLoadingTxns(true);

        const response = await connection.getSignaturesForAddress(publicKey, {
          limit: 10,
        });

        const txList: Transaction[] = response.map((tx) => ({
          signature: tx.signature,
          date: tx.blockTime
            ? new Date(tx.blockTime * 1000).toLocaleString()
            : null,
          status: tx.confirmationStatus || "unknown",
        }));

        setTransactions(txList);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
        setError("Failed to load transactions.");
      } finally {
        setLoadingTxns(false);
      }
    };

    fetchTransactions();
  }, [publicKey]);
  return (
    <div className="bg-[#0d1117] min-h-screen text-white">
      {/* Main Content */}
      <main className="px-6 py-5 max-w-6xl mx-auto">
        {/* Top Section */}
        <div className="flex justify-between items-start mb-5">
          {/* Left: Cashprize Info */}
          <div>
            <p className="text-gray-400 text-sm">Cashprize</p>
            <h2 className="text-2xl font-bold">0.00 $US</h2>
          </div>

          {/* Right: Ranking + Button Group */}
          <div className="flex items-center gap-3">
            {/* Ranking Badge */}
            <div className="ranking-badge">
              <span className="label">Ranking</span>
              <span className="value">3/12</span>
            </div>
            {/* Button Group */}
            <div className="bg-[#1c2128] rounded-lg flex p-1">
              <button className="bg-[#2d333b] text-white rounded-md px-4 py-1 text-sm">
                Competition
              </button>
              <button className="text-gray-400 px-4 py-1 text-sm">
                Versus
              </button>
              <button className="text-gray-400 px-4 py-1 text-sm">
                Twitter
              </button>
            </div>
          </div>
        </div>

        {/* Timer Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="border border-[#30363d] rounded-md py-2 px-3 bg-[#0d1117]">
            <p className="text-xs text-gray-400">
              Base amount: <span className="text-white">0.001</span>
            </p>
          </div>
          {/*Wallet Section*/}
          <div className="border border-[#30363d] rounded-md py-2 px-3 bg-[#0d1117]">
            <p className="text-xs text-gray-400">
              Wallet Balance:{" "}
              <span className="text-white">
                {assets.find((a) => a.mint === SOL_MINT)?.amount.toFixed(4) ||
                  "0.0000"}{" "}
                SOL
              </span>
            </p>
          </div>
          <div className="border border-[#30363d] rounded-md py-2 px-3 bg-[#0d1117]">
            <p className="text-xs text-gray-400">
              Start: <span className="text-white">6:30PM UTC +1</span>
            </p>
          </div>
          <div className="border border-[#30363d] rounded-md py-2 px-3 bg-[#0d1117]">
            <p className="text-xs text-gray-400">
              End: <span className="text-white">7:30PM UTC +1</span>
            </p>
          </div>
          <div className="border border-[#30363d] rounded-md py-2 px-3 bg-[#0d1117]">
            <p className="text-xs text-gray-400">
              Time left:{" "}
              <span className="text-red-500 font-mono">00:00:00</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#30363d] mb-6">
          <div className="flex">
            <button className="py-2 px-6 text-white border-b-2 border-green-500">
              Overall
            </button>
            <button className="py-2 px-6 text-gray-400">Trade</button>
            <button className="py-2 px-6 text-gray-400">Dashboard</button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Profile Details */}
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-900/30 overflow-hidden flex items-center justify-center text-green-400 font-bold text-xl">
              P
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <p className="text-white">Paul</p>
                <HiCheck className="ml-2 text-gray-400" />
                <FiExternalLink className="ml-2 text-gray-400" />
              </div>
              <div className="flex items-center">
                <p className="text-gray-400 text-xs">7aeoZL</p>
                <div className="ml-1 w-2 h-2 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
          {/* Right: Compare Button */}
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition">
            Compare
          </button>
        </div>

        {/* Performance and Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Performance Section */}
          <div className="border border-[#30363d] rounded-lg p-4 bg-[#0d1117]">
            <h3 className="text-lg font-medium mb-2">Performance</h3>
            <p className="text-gray-400 text-sm">
              7D Realized PnL: <span className="text-white">$2180</span>
            </p>
            <div className="flex items-baseline mt-1">
              <h2 className="text-green-400 text-2xl font-bold">500$</h2>
              <span className="ml-2 text-green-400">+ 67%</span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm flex justify-between">
                <span className="text-gray-400">Total PnL</span>
                <span className="text-green-400">+$2.8M (+13.24%)</span>
              </p>
              <p className="text-sm flex justify-between">
                <span className="text-gray-400">Unrealized Profits</span>
                <span className="text-red-400">-$710.7K</span>
              </p>
            </div>
          </div>

          {/* Distribution Section */}
          <div className="border border-[#30363d] rounded-lg p-4 bg-[#0d1117]">
            <h3 className="text-lg font-medium mb-3">Distribution</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                <span className="text-sm text-gray-300">&gt; 500%</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-600 mr-2"></span>
                <span className="text-sm text-gray-300">200% - 500%</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-700 mr-2"></span>
                <span className="text-sm text-gray-300">0% - 200%</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-700 mr-2"></span>
                <span className="text-sm text-gray-300">0% - -50%</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-sm text-gray-300">&lt; -50%</span>
              </li>
            </ul>
            <div className="h-1 bg-gradient-to-r from-red-500 via-green-700 to-green-400 mt-4 rounded"></div>
            <div className="flex items-center justify-center mt-2">
              <span className="w-2 h-2 rounded-full bg-white mr-1"></span>
              <span className="text-xs text-gray-400">Show me all</span>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`pb-1 border-b ${
                activeTab === "wallet"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400"
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-1 border-b ${
                activeTab === "activity"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400"
              }`}
            >
              Activity
            </button>
          </div>

          {/* Tab Content */}
          <div className="border border-[#30363d] rounded-lg p-4 bg-[#0d1117] shadow-lg hover:shadow-green-500/20 transition-shadow duration-300">
            {activeTab === "wallet" && (
              <>
                {/* Wallet Content */}
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center">
                    <FaWallet className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-400">
                    {/* <span className="">
                      {assets
                        .find((a) => a.mint === SOL_MINT)
                        ?.amount.toFixed(4) || "0.0000"}{" "}
                      SOL
                    </span> */}
                    $50
                  </h3>
                </div>
                <div className="grid grid-cols-4 text-gray-400 text-sm pb-2 px-2">
                  <span className="text-left">ASSET</span>
                  <span className="text-right">BALANCE</span>
                  <span className="text-right">PRICE (USD)</span>
                  <span className="text-right">VALUE (USD)</span>
                </div>
                <div className="border-t border-[#30363d] mt-1"></div>

                {/* Display fetched assets */}
                {assets.length > 0 ? (
                  assets.map((asset, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 items-center text-gray-300 text-sm py-2 px-2 rounded-md hover:bg-[#1c2128] hover:scale-[1.02] transition-all duration-200"
                    >
                      <span className="text-left font-medium">
                        {asset.name || asset.mint.slice(0, 4) + "..."}
                      </span>
                      <span className="text-right font-semibold">
                        {asset.amount.toFixed(4)}
                      </span>
                      <span className="text-right font-semibold">
                        ${(asset.price || 0).toFixed(2)}
                      </span>
                      <span className="text-right font-semibold">
                        ${((asset.price || 0) * asset.amount).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center text-gray-500">
                    No assets to display
                  </div>
                )}
              </>
            )}

            {/* Activity Content */}
            {activeTab === "activity" && (
              <>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center animate-bounce">
                    <FaCreditCard className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-400">
                    Activity · Recent Transactions
                  </h3>
                </div>

                {/* Header Grid */}
                <div className="grid grid-cols-3 text-gray-400 text-sm pb-2 px-2">
                  <span className="text-left">DATE</span>
                  <span className="text-center">TRANSACTION</span>
                  <span className="text-right">STATUS</span>
                </div>

                <div className="border-t border-[#30363d] mt-1"></div>

                {loadingTxns ? (
                  <div className="h-24 flex items-center justify-center text-gray-500 animate-pulse">
                    Loading transactions...
                  </div>
                ) : error ? (
                  <div className="h-24 flex items-center justify-center text-red-500">
                    {error}
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    // Transaction Row Grid
                    <div
                      key={index}
                      className="grid grid-cols-3 items-center text-gray-300 text-sm py-2 px-2 rounded-md hover:bg-[#1c2128] hover:scale-[1.02] transition-all duration-200"
                    >
                      {/* Date */}
                      <span className="text-left">
                        {tx.date ? formatDate(tx.date) : "N/A"}
                      </span>

                      {/* Transaction Signature */}
                      <a
                        href={`https://solscan.io/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-green-400 truncate text-center w-full"
                      >
                        {tx.signature.slice(0, 10)}...{tx.signature.slice(-10)}
                      </a>

                      {/* Status */}
                      <span
                        className={`text-right ${
                          tx.status === "confirmed"
                            ? "text-green-400"
                            : tx.status === "finalized"
                            ? "text-blue-400"
                            : "text-gray-400"
                        }`}
                      >
                        {tx.status || "finalized"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center text-gray-500">
                    No transactions found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyGames;
