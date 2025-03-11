// app/home/page.tsx
"use client";
import React, { useEffect, useRef } from "react";
import Navbar from "./Navbar";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { WavyBackground } from "./WavyBackground";

export default function HomePage() {
  return (
    <WavyBackground
      colors={["#00AA00", "#008800", "#006600", "#004400"]} // Darker green colors
      waveWidth={50}
      backgroundFill="black"
      blur={10}
      speed="fast" // Change from "slow" to "fast"
      waveOpacity={0.5}
    >
      <div className="relative z-10 min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="text-center py-24 px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl font-bold mb-6">
              <span className="text-white">Project</span>
              <span className="text-[#00FF00]">X</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-10">
              Trading Platform. Powered by Solana
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center gap-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link
              href="/twister"
              className="bg-[#00FF00] text-black px-8 py-3 rounded-full font-medium hover:bg-opacity-80 transition"
            >
              Get Started
            </Link>
            <Link
              href="/documentation"
              className="border border-[#00FF00] text-[#00FF00] px-8 py-3 rounded-full font-medium hover:text-black hover:bg-[#00FF00] hover:bg-opacity-10 transition"
            >
              Learn More
            </Link>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Trading Modes
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Versus",
                description:
                  "Challenge your friends in 1v1 trading competitions",
                path: "/versus",
              },
              {
                title: "Twister",
                description:
                  "Real-time trading competitions with dynamic markets",
                path: "/twister",
              },
              {
                title: "Competition",
                description:
                  "Join tournaments with multiple players and win prizes",
                path: "/competition",
              },
            ].map((mode, index) => (
              <motion.div
                key={mode.title}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={mode.path}>
                  <div
                    className="rounded-2xl p-10 text-center flex flex-col items-center justify-center hover:opacity-80 transition cursor-pointer aspect-square opacity-90"
                    style={{
                      background:
                        "linear-gradient(145deg, #1E2427 0%, #121518 100%)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <h3 className="text-white text-2xl mb-4">{mode.title}</h3>
                    <p className="text-gray-400">{mode.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { value: "$2.5M+", label: "Trading Volume" },
                { value: "10,000+", label: "Active Users" },
                { value: "24/7", label: "Market Access" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <h3 className="text-[#00FF00] text-4xl font-bold mb-2">
                    {stat.value}
                  </h3>
                  <p className="text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your Solana wallet to get started",
              },
              {
                step: "02",
                title: "Choose Mode",
                description:
                  "Select from Versus, Twister, or Competition modes",
              },
              {
                step: "03",
                title: "Start Trading",
                description: "Compete and win SOL prizes",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-[#00FF00] text-7xl font-bold opacity-30 absolute -top-10 left-4 z-20">
                  {item.step}
                </div>
                <div className="bg-[#1A2023] rounded-xl p-8 relative z-10">
                  <h3 className="text-white text-xl font-bold mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-r from-[#0A1A0A] to-[#0A0A0A]">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Start Trading?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-10">
              Join thousands of traders on ProjectX and experience the future of
              trading competitions
            </p>
            <Link
              href="/twister"
              className="bg-[#00FF00] text-black px-8 py-3 rounded-full font-medium hover:bg-opacity-80 transition"
            >
              Launch App
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-black">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#00FF00] text-2xl font-bold mb-6 md:mb-0">
              ProjectX
            </div>
            <div className="flex space-x-6">
              <Link
                href="/documentation"
                className="text-gray-400 hover:text-[#00FF00]"
              >
                Documentation
              </Link>
              <Link
                href="/about"
                className="text-gray-400 hover:text-[#00FF00]"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-400 hover:text-[#00FF00]"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="text-center text-gray-600 mt-12">
            © 2025 ProjectX. All rights reserved.
          </div>
        </footer>
      </div>
    </WavyBackground>
  );
}
