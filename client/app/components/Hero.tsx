import React from "react";

interface HeroProps {
  title: string;
  subtitle: string;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center py-16">
      <h1 className="text-5xl font-bold">
        <span className="text-text-primary">{title}</span>
        <span className="text-gray-500 ml-2">{subtitle}</span>
      </h1>
      <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-sm">
        Trading Platform. Powered by Solana
      </p>
    </div>
  );
};

export default Hero;
