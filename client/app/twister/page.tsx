"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import TwisterPage from "./Twister";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <TwisterPage />
    </WalletProvider>
  );
}

export default page;
