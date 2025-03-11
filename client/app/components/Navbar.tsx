import React from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const Navbar: React.FC = () => {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-background">
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-ribbit-green text-2xl font-bold">
          ProjectX
        </Link>

        <div className="flex items-center space-x-6">
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

      <div className="relative">
        <input
          type="text"
          placeholder="Search"
          className="bg-background text-text-primary rounded-md py-2 pl-3 pr-10 focus:outline-none border border-gray-800"
        />
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
    </nav>
  );
};

export default Navbar;
