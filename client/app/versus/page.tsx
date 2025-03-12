// app/twister/page.tsx
"use client";
import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ActionCards from "../components/ActionsCards";
import GameList from "../components/GameList";

export default function VersusPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-black">
      {/* Green circle gradient positioned off-screen */}
      <div
        className="absolute w-[150vw] h-[150vw] rounded-full -right-[75vw] top-1/2 -translate-y-1/2 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,0,0.2) 0%, rgba(0,0,0,0) 70%)",
          backgroundSize: "150% 150%",
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <Hero title="Versus"/>
        <ActionCards />
        <GameList />
      </div>
    </main>
  );
}
