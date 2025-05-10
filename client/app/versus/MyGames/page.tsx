"use client";
import React from "react";
import { useSolanaWallet } from "../../WalletProvider";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import MyGamesComponent from "./MyGames";

function Page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();

  return (
    <WalletProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MyGamesComponent />
      </LocalizationProvider>
    </WalletProvider>
  );
}

export default Page;
