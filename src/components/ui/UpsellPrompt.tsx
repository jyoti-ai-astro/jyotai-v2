"use client";

import Link from "next/link";

export default function UpsellPrompt() {
  return (
    <div className="border border-yellow-500 bg-yellow-100/10 p-4 rounded-xl mt-6 text-white text-center shadow-md">
      <h2 className="text-xl font-bold text-yellow-300 mb-2">🌟 Unlock Full Cosmic Access</h2>
      <p className="text-sm mb-4">
        You're almost out of divine questions. Upgrade to <strong>Premium</strong> for:
      </p>
      <ul className="text-sm list-disc list-inside mb-4 text-yellow-100 text-left max-w-md mx-auto">
        <li>20 sacred predictions/month</li>
        <li>Life Path Summary</li>
        <li>Astro Map & Palm Analysis</li>
        <li>Daily Celestial Guidance</li>
        <li>WhatsApp delivery</li>
      </ul>
      <Link
        href="/upgrade"
        className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-full font-semibold hover:bg-yellow-500 transition"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
