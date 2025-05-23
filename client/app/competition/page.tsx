"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import CompetitionMode from "./Competition";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <CompetitionMode />
    </WalletProvider>
  );
}

export default page;
