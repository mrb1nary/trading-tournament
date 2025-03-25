"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import VersusPage from "./Versus";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <VersusPage />
    </WalletProvider>
  );
}

export default page;
