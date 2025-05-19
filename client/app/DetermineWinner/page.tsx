"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import Navbar from "../components/Navbar";
import Tabs from "./Tabs";

function Page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <Navbar />
      <Tabs />
    </WalletProvider>
  );
}

export default Page;
