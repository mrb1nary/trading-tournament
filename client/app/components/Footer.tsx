// components/Footer.tsx
import React from "react";
import { FaTelegramPlane, FaTwitter } from "react-icons/fa";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const Footer: React.FC = () => {
  return (
    <footer className={`bg-[#295232] text-white py-10 ${roboto.className}`}>
      <div className="max-w-6xl mx-auto flex flex-wrap justify-center text-center">
        {/* Left Section */}
        <div className="flex-1 min-w-[300px] mb-5">
          <h3 className="text-4xl font-bold mb-3">klash.fun</h3>
          <p className="text-sm font-normal mb-5">
            Solana&apos;s first CryptoTrading Competition platform
          </p>
          <button className="px-4 py-2 bg-white text-[#29664A] rounded-md font-medium">
            POWERED BY SOLSCAN
          </button>
        </div>

        {/* Middle Section */}
        <div className="flex-1 min-w-[300px] mb-5">
          <h4 className="text-lg font-bold mb-3">Resource</h4>
          <ul className="list-none space-y-2 text-sm font-normal">
            <li>Contact</li>
            <li>Documentation</li>
            <li>Press</li>
            <li>Roadmap</li>
            <li>Term of Service</li>
            <li>Privacy</li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="flex-1 min-w-[300px] mb-5">
          <h4 className="text-lg font-bold mb-3">Follow us</h4>
          <div className="flex justify-center space-x-4 mb-3">
            {/* Icons for social links */}
            <FaTelegramPlane size={24} className="text-white cursor-pointer" />
            <FaTwitter size={24} className="text-white cursor-pointer" />
          </div>
          <p className="text-xs font-normal">
            For any support: contact@ribbit.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
