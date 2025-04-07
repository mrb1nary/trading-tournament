"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import MyGames from "./MyGames";
import Navbar from "../components/Navbar";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <Navbar />
      <MyGames />
    </WalletProvider>
  );
}

export default page;
