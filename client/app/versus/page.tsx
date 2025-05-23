"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import VersusPage from "./Versus";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();
  return (
    <WalletProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <VersusPage />
      </LocalizationProvider>
    </WalletProvider>
  );
}

export default page;
