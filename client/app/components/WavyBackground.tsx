/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

interface WavyBackgroundProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
}

export const WavyBackground: React.FC<WavyBackgroundProps> = ({
  children,
  className,
  colors,
  waveWidth = 50,
  backgroundFill = "black",
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const noise = createNoise3D();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  let w: number, h: number, nt: number;
  let ctx: CanvasRenderingContext2D | null | undefined;

  const getSpeed = (): number => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  const init = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    if (!ctx) return;

    w = ctx.canvas.width = window.innerWidth;
    h = ctx.canvas.height = window.innerHeight;
    ctx.filter = `blur(${blur}px)`;
    nt = 0;

    window.onresize = () => {
      w = ctx!.canvas.width = window.innerWidth;
      h = ctx!.canvas.height = window.innerHeight;
      ctx!.filter = `blur(${blur}px)`;
    };

    render();
  };

  const waveColors: string[] = colors ?? [
    "#00FF00",
    "#00AA00",
    "#008800",
    "#006600",
    "#004400",
  ];

  const drawWave = (n: number) => {
    if (!ctx) return;

    nt += getSpeed();
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth;
      ctx.strokeStyle = waveColors[i % waveColors.length];

      for (let x = 0; x < w; x += 5) {
        const y = noise(x / 800, i * 0.3, nt) * h * (waveOpacity || 0.5); // Adjusted height scaling
        ctx.lineTo(x, y + h * 0.5);
      }

      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId: number;

  const render = () => {
    if (!ctx) return;

    ctx.fillStyle = backgroundFill;
    ctx.globalAlpha = waveOpacity;
    ctx.fillRect(0, 0, w, h);
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();

    return () => {
      cancelAnimationFrame(animationId);
      window.onresize = null; // Clean up resize listener
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`min-h-screen w-full ${className || ""}`}>
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        id="canvas"
      ></canvas>
      <div className="relative z-10" {...props}>
        {children}
      </div>
    </div>
  );
};
