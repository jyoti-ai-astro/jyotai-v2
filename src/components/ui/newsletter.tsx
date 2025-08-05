"use client";

import { useState } from "react";
import Link from "next/link";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter logic here (future phase)
    setEmail("");
  };

  return (
    <section className="p-6 bg-gray-800 text-white rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-2">🧘 Join the JyotAI Circle</h2>
      <p className="mb-4">Get astrological insights, Vedic wisdom, and divine updates directly in your inbox.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="p-2 rounded bg-gray-700 text-white w-full sm:w-2/3"
        />
        <button type="submit" className="bg-celestial-gold text-cosmic-navy font-bold py-2 px-4 rounded w-full sm:w-auto">
          Subscribe
        </button>
      </form>
      <p className="text-xs mt-3">
        View our <Link href="/privacy" className="underline text-celestial-gold">Privacy Policy</Link>.
      </p>
    </section>
  );
}
