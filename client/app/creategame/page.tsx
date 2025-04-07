"use client";
import React from "react";
import { useSolanaWallet } from "../WalletProvider";
import CreateGame from "./CreateGame";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function Page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();

  return (
    <WalletProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CreateGame />
      </LocalizationProvider>
    </WalletProvider>
  );
}

export default Page;
