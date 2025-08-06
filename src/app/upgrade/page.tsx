"use client";

import { useUser, AppUser } from "@/lib/hooks/useUser";
import { useEffect, useCallback } from "react";
import Loading from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Declare Razorpay type globally
declare global {
  interface Window {
    Razorpay: new (options: any) => { open: () => void };
  }
}

async function handleUpgrade(email: string) {
  const res = await fetch("/api/pay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99900, email, purpose: "upgrade" }),
  });

  if (!res.ok) {
    console.error("Failed to create Razorpay order");
    alert("Could not start payment. Please try again.");
    return;
  }

  const { order } = await res.json();

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    amount: order.amount,
    currency: order.currency,
    name: "JyotAI",
    description: "Premium Plan Upgrade",
    order_id: order.id,
    prefill: { email },
    notes: { purpose: "upgrade" },
    handler: () => {
      window.location.href = "/dashboard?upgraded=true";
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

export default function UpgradePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const loadScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']")) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Razorpay script failed to load");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    loadScript();

    const appUser = user as AppUser | null;
    if (!loading && appUser?.plan === "premium") {
      router.push("/dashboard");
    }
  }, [user, loading, router, loadScript]);

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
      <p className="text-center text-gray-300 mb-8">Gain unlimited insights and deeper cosmic guidance.</p>

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
          onClick={() => handleUpgrade(appUser.email!)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl transition duration-200 w-full text-lg"
        >
          🚀 Upgrade to Premium – ₹999/month
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">This is a one-time payment for 30 days of access.</p>
      </div>
    </div>
  );
}
