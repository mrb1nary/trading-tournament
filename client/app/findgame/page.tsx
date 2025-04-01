/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import FindGame from "./FindGame";

function page() {
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <FindGame />
    </WalletProvider>
  );
}

export default page;
