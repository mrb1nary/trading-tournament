// components/ParticleBackground.tsx
"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

const ParticleBackground = () => {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  useEffect(() => {
    // Generate initial particles
    const initialParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      color: Math.random() > 0.5 ? "#00FF00" : "#FFFFFF",
      duration: Math.random() * 20 + 10,
    }));

    setParticles(initialParticles);

    // Add new particles periodically
    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: Math.random() * 100,
          y: -10, // Start from top
          size: Math.random() * 4 + 1,
          color: Math.random() > 0.5 ? "#00FF00" : "#FFFFFF",
          duration: Math.random() * 20 + 10,
        },
      ]);
    }, 2000);

    // Clean up particles that are out of view
    const cleanup = setInterval(() => {
      setParticles((prev) => prev.filter((p) => p.y < 110).slice(-30));
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
          }}
          initial={{ opacity: 0.1 }}
          animate={{
            y: "110vh",
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: particle.duration,
            ease: "linear",
            repeat: 0,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;
