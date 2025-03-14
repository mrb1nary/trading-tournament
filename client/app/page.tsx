"use client";
import React from "react";
import Home from "./home";
import { useSolanaWallet } from "./WalletProvider";

export default function Page() {
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <Home />
    </WalletProvider>
  );
}
