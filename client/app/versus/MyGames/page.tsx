"use client";
import React from "react";
import { useSolanaWallet } from "../../WalletProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import MyGamesComponent from "./MyGames";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const WalletProvider = useSolanaWallet();

  return (
    <WalletProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MyGamesComponent />
        <ToastContainer />
      </LocalizationProvider>
    </WalletProvider>
  );
}

export default Page;
