"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="animate-bounce mx-auto">
          <div className="bg-[#29664A]/20 p-6 rounded-full">
            <span className="text-6xl">🤖</span> {/* Robot emoji */}
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-[#29664A] to-[#3CAF7F] bg-clip-text text-transparent">
            500 Error
          </h1>
          <p className="text-2xl font-medium text-gray-300">
            Oops! Something went wrong
          </p>
          <p className="text-gray-400 max-w-lg mx-auto">
            Our team has been notified about this issue. Please try again later.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="bg-[#29664A] hover:bg-[#1e4d36] text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2"
          >
            <span>🔄</span> Try Again
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2"
          >
            <span>←</span> Go Back
          </button>
        </div>

        {/* Additional Help */}
        <p className="text-gray-500 text-sm mt-8">
          Need immediate help?{" "}
          <a
            href="mailto:support@ribbit.com"
            className="text-[#29664A] hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
