"use client";

import Navbar from "@/app/components/Navbar";
import { useSolanaWallet } from "@/app/WalletProvider";
import CategoryPage from "./Category";
import { useParams } from "next/navigation";

export default function Page() {
  const WalletProvider = useSolanaWallet();
  const params = useParams();

  // Type assertion for route parameter
  const id = params.id as string;

  if (!id) {
    return <div>Loading...</div>;
  }

  return (
    <WalletProvider>
      <Navbar />
      <CategoryPage params={{ id }} />
    </WalletProvider>
  );
}
