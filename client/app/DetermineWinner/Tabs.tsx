"use client";

import React, { useState } from "react";
import CompetitionComponent from "./CompetitionComponent";
import VersusComponent from "./VersusComponent";
import Hero from "@/app/components/Hero";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Tabs() {
  const [activeTab, setActiveTab] = useState<"competitions" | "versus">(
    "competitions"
  );

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0 gradient-background" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Hero title="My" subtitle="Games" />

        <div className="mb-6 flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "competitions"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("competitions")}
          >
            Competitions
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "versus"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("versus")}
          >
            Versus
          </button>
        </div>

        {activeTab === "competitions" && <CompetitionComponent />}

        {activeTab === "versus" && <>{<VersusComponent />}</>}
      </div>
      <ToastContainer />
    </main>
  );
}

export default Tabs;
