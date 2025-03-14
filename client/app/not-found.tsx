import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-400 mb-6">
        <Link href="/">
          <a className="bg-[#29664A] text-white px-6 py-3 rounded-lg hover:bg-[#1e4d36]">
            Return Home
          </a>
        </Link>
        Return Home
      </p>
    </div>
  );
}
