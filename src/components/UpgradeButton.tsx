"use client";

import { useState } from "react";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function UpgradeButton({ email, name }: { email: string; name?: string }) {
  const [busy, setBusy] = useState(false);

  const handler = async (_resp: RazorpayResponse) => {
    // Nothing else needed here; your webhook upgrades plan + adds credits.
    alert("✅ Payment captured. Your account will upgrade shortly.");
  };

  const start = async () => {
    try {
      setBusy(true);
      // create order for ₹999.00 (paise)
      const res = await fetch("/api/pay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount: 99900, purpose: "upgrade", name }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      const { order } = await res.json();

      // load SDK
      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Razorpay SDK failed to load"));
        document.body.appendChild(s);
      });

      if (!window.Razorpay) throw new Error("Razorpay SDK unavailable");

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: order.amount,
        currency: order.currency,
        name: "JyotAI Premium",
        description: "Monthly subscription",
        order_id: order.id,
        handler,
        prefill: { email, name, contact: "9999999999" },
        notes: { email, purpose: "upgrade", name: name || "" },
        theme: { color: "#D4AF37" },
      });
      rzp.open();
    } catch (e: any) {
      alert(e?.message || "Payment failed to start");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={busy}
      className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-300 disabled:opacity-60"
    >
      {busy ? "Starting…" : "Upgrade to Premium – ₹999"}
    </button>
  );
}
