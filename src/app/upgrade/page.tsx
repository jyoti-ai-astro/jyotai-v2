"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";
import { useRouter } from "next/navigation";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function handleUpgrade(email: string) {
  const res = await fetch("/api/pay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99900, email, purpose: "upgrade" }),
  });
  const { order } = await res.json();

  const rzp = new (window as any).Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    amount: order.amount,
    currency: order.currency,
    name: "JyotAI",
    description: "Premium Plan Upgrade",
    order_id: order.id,
    prefill: {
      email,
    },
    notes: {
      purpose: "upgrade",
    },
    handler: function () {
      window.location.href = "/dashboard";
    },
  });

  rzp.open();
}

export default function UpgradePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.plan === "premium") {
      router.push("/dashboard");
    }
  }, [user]);

  if (loading) return <Loading />;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-bold">You must be logged in to upgrade.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">🌟 Unlock Premium Access</h1>

      <ul className="list-disc list-inside mb-6 space-y-2">
        <li>🔮 20 Predictions / Month</li>
        <li>🗺️ Astro Map View</li>
        <li>📩 WhatsApp Delivery</li>
        <li>💎 Lucky Gem & Nakshatra Insights</li>
        <li>🧬 Life Path Summary</li>
        <li>🧭 Daily Celestial Compass</li>
      </ul>

      <button
        onClick={() => handleUpgrade(user.email)}
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl transition duration-200 w-full"
      >
        🚀 Upgrade to Premium – ₹999/month
      </button>

      <p className="text-xs text-gray-400 mt-4 text-center">Auto-renews manually each month.</p>
    </div>
  );
}
