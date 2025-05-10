/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

const Navbar: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [walletAddress, setWalletAddress] = useState("Not Connected");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const openRulesModal = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsRulesModalOpen(true);
  };

  const closeRulesModal = () => {
    setIsRulesModalOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58());
    } else {
      setWalletAddress("Not Connected");
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search query:", searchQuery);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-4 bg-background relative z-50">
        {/* Left Section */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-ribbit-green text-2xl font-bold">
            Citadel
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={openRulesModal}
              className="text-text-primary hover:text-ribbit-green"
            >
              Rules
            </button>
            <Link
              href="/versus"
              className="text-text-primary hover:text-ribbit-green"
            >
              Versus
            </Link>
            <Link
              href="/twister"
              className="text-text-primary hover:text-ribbit-green"
            >
              Twister
            </Link>
            <Link
              href="/competition"
              className="text-text-primary hover:text-ribbit-green flex items-center"
            >
              Competition
              <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <Link
              href="/MyGames"
              className="text-text-primary hover:text-ribbit-green"
            >
              My games
            </Link>

            {/* Search */}
            <div className="relative flex items-center">
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Invite Code"
                  className="bg-background text-text-primary rounded-lg py-2 pl-3 pr-10 focus:outline-none border border-gray-800 w-68"
                />
                <button
                  type="submit"
                  className="absolute right-3 text-gray-500 hover:text-ribbit-green"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="relative hidden md:block">
          <WalletMultiButton className="wallet-adapter-button" />
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-text-primary focus:outline-none z-50"
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        <div
          className={`absolute top-full left-0 w-full bg-background shadow-lg z-40 transform transition-transform duration-300 ${
            isMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col items-start space-y-4 px-6 py-4">
            <button
              onClick={(e) => {
                openRulesModal(e);
                setIsMenuOpen(false);
              }}
              className="text-text-primary hover:text-ribbit-green w-full"
            >
              Rules
            </button>
            <Link
              href="/versus"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-primary hover:text-ribbit-green w-full"
            >
              Versus
            </Link>
            <Link
              href="/twister"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-primary hover:text-ribbit-green w-full"
            >
              Twister
            </Link>
            <Link
              href="/competition"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-primary hover:text-ribbit-green flex items-center w-full"
            >
              Competition
              <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <Link
              href="/my-games"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-primary hover:text-ribbit-green w-full"
            >
              My games
            </Link>

            {/* Search Input for Mobile */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-background text-text-primary rounded-md py-2 pl-3 pr-10 focus:outline-none border border-gray-800 w-full"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </button>
            </form>

            {/* Wallet Connect for Mobile */}
            <div className="mt-4 w-full">
              <WalletMultiButton className="wallet-adapter-button w-full" />
            </div>
          </div>
        </div>
      </nav>

      {/* Rules Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-primary">Rules</h2>
              <button
                onClick={closeRulesModal}
                className="text-gray-500 hover:text-ribbit-green"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-text-primary">
              {/* Content will go here */}
              The Rule Book shall be displayed here
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeRulesModal}
                className="px-4 py-2 bg-ribbit-green text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
