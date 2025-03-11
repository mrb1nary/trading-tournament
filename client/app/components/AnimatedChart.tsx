// components/AnimatedChart.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const generateChartData = () => {
  const labels = Array.from({ length: 20 }, (_, i) => `${i}`);

  // Generate random data for multiple lines
  const datasets = [
    {
      label: "SOL",
      data: Array.from({ length: 20 }, () => Math.random() * 100),
      borderColor: "#00FF00",
      backgroundColor: "rgba(0, 255, 0, 0.1)",
      tension: 0.4,
    },
    {
      label: "BTC",
      data: Array.from({ length: 20 }, () => Math.random() * 100),
      borderColor: "#3F8CFF",
      backgroundColor: "rgba(63, 140, 255, 0.1)",
      tension: 0.4,
    },
  ];

  return { labels, datasets };
};

const AnimatedChart = () => {
  const chartData = generateChartData();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  return (
    <div className="h-screen w-screen">
      <motion.div
        className="h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <Line data={chartData} options={options} />
      </motion.div>
    </div>
  );
};

export default AnimatedChart;
