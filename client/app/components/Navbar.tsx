import React, { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-background relative">
      {/* Left Section */}
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-ribbit-green text-2xl font-bold">
          ProjectX
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/home"
            className="text-text-primary hover:text-ribbit-green"
          >
            Home
          </Link>
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
            href="/my-games"
            className="text-text-primary hover:text-ribbit-green"
          >
            My games
          </Link>
          <Link
            href="/documentation"
            className="text-text-primary hover:text-ribbit-green"
          >
            Documentation
          </Link>
        </div>
      </div>

      {/* Right Section */}
      <div className="relative hidden md:block">
        <input
          type="text"
          placeholder="Search"
          className="bg-background text-text-primary rounded-md py-2 pl-3 pr-10 focus:outline-none border border-gray-800"
        />
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
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
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="flex flex-col items-start space-y-4 px-6 py-4">
          <Link
            href="/home"
            onClick={() => setIsMenuOpen(false)}
            className="text-text-primary hover:text-ribbit-green w-full"
          >
            Home
          </Link>
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
          <Link
            href="/documentation"
            onClick={() => setIsMenuOpen(false)}
            className="text-text-primary hover:text-ribbit-green w-full"
          >
            Documentation
          </Link>

          {/* Search Input for Mobile */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search"
              className="bg-background text-text-primary rounded-md py-2 pl-3 pr-10 focus:outline-none border border-gray-800 w-full"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
