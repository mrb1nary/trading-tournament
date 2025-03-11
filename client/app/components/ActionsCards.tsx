// components/ActionCards.tsx
import React from "react";
import Image from "next/image";

interface ActionCardProps {
  iconSrc: string;
  title: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ iconSrc, title }) => {
  return (
    <div
      className="rounded-2xl p-10 text-center flex flex-col items-center justify-center hover:opacity-80 transition cursor-pointer aspect-square w-full max-w-sm mx-auto opacity-90"
      style={{
        background: "linear-gradient(145deg, #1E2427 0%, #121518 100%)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Image
              src={iconSrc}
              alt={title}
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h3 className="text-white text-xl font-normal">{title}</h3>
        </div>
      </div>
    </div>
  );
};

const ActionCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 px-4 max-w-5xl mx-auto">
      <ActionCard iconSrc="/assets/createIcon.png" title="Create a party" />
      <ActionCard iconSrc="/assets/joinIcon.png" title="Join a game" />
      <ActionCard iconSrc="/assets/myPartiesIcon.png" title="My parties" />
    </div>
  );
};

export default ActionCards;
