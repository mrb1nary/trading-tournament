/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import Hero from "../../components/Hero";
import { useSolanaWallet } from "../../WalletProvider";
import SnapshotComponent from "./SnapshotComponent";

function page() {
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />
        <div className="relative z-10">
          <Navbar />
          <Hero title="Game" subtitle="Details" />
          <SnapshotComponent />
        </div>
      </main>
    </WalletProvider>
  );
}

export default page;
