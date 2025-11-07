"use client";

import { useUser, AppUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import Link from "next/link";
import { useEffect, useCallback } from "react";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string; contact?: string };
  notes?: Record<string, string>;
  handler: () => void;
  theme?: { color?: string };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

async function createOrder(params: { amount: number; email: string; purpose: string; name?: string }) {
  const res = await fetch("/api/pay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create Razorpay order");
  return res.json() as Promise<{ order: { id: string; amount: number; currency: string } }>;
}

export default function UpgradePage() {
  const { user, loading } = useUser();

  const loadRazorpay = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const existing = document.querySelector<HTMLScriptElement>(
        "script[src='https://checkout.razorpay.com/v1/checkout.js']"
      );
      if (existing) {
        existing.onload = () => resolve();
        existing.onerror = () => reject(new Error("Razorpay SDK failed to load"));
        return;
      }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(s);
    });
  }, []);

  const startUpgrade = useCallback(
    async (email: string, name?: string) => {
      try {
        await loadRazorpay();
        const { order } = await createOrder({ amount: 99900, email, purpose: "upgrade", name });

        if (!window.Razorpay) throw new Error("Razorpay SDK unavailable");

        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: order.amount,
          currency: order.currency,
          name: "JyotAI Premium",
          description: "Monthly subscription",
          order_id: order.id,
          prefill: { email, name, contact: "9999999999" },
          notes: { purpose: "upgrade", email, name: name || "" },
          theme: { color: "#D4AF37" },
          handler: () => {
            // Webhook upgrades plan + credits; we just inform and refresh later.
            window.location.href = "/dashboard?upgraded=true";
          },
        });
        rzp.open();
      } catch (e: any) {
        alert(e?.message || "Could not start payment. Please try again.");
      }
    },
    [loadRazorpay]
  );

  useEffect(() => {
    // pre-load SDK
    loadRazorpay();
  }, [loadRazorpay]);

  if (loading) return <Loading />;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-bold">You must be logged in to upgrade.</h2>
        <Link href="/login" className="text-celestial-gold underline mt-4 block">
          Login Now
        </Link>
      </div>
    );
  }

  const appUser = user as AppUser;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400 text-center">🌟 Unlock Premium Access</h1>
      <p className="text-center text-gray-300 mb-8">Gain deeper cosmic guidance and monthly benefits.</p>

      <div className="bg-slate-800 p-8 rounded-lg">
        <ul className="list-disc list-inside mb-6 space-y-2">
          <li>🔮 20 Predictions / Month</li>
          <li>🗺️ Astro Map View</li>
          <li>📩 WhatsApp Delivery</li>
          <li>💎 Lucky Gem & Nakshatra Insights</li>
          <li>🧬 Life Path Summary</li>
          <li>🧭 Daily Celestial Compass</li>
        </ul>

        <button
          onClick={() => startUpgrade(appUser.email!, appUser.name)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl transition duration-200 w-full text-lg"
        >
          🚀 Upgrade to Premium – ₹999/month
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Payment is captured by Razorpay; your plan updates automatically via webhook.
        </p>
      </div>
    </div>
  );
}
