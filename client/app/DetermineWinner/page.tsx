"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import WinnerComponent from "./WinnerComponent";
import Navbar from "../components/Navbar";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <Navbar />
      <WinnerComponent />
    </WalletProvider>
  );
}

export default page;
