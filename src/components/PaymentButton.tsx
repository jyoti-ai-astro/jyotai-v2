// src/components/PaymentButton.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
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

interface PaymentButtonProps {
  name: string;
  dob: string;
  query: string;
  email: string;
}

export function PaymentButton({ name, dob, query, email }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persistAfterPayment = async (
    paymentResponse: RazorpayResponse,
    aiPrediction: string
  ) => {
    try {
      await fetch("/api/on-payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: email,
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          name,
          dob: format(new Date(dob), "yyyy-MM-dd"),
          query,
          prediction: aiPrediction,
        }),
      });
      console.log("✅ Prediction saved & email sent (if configured).");
    } catch (e) {
      console.error("❌ Failed to persist after payment:", e);
      setError("Prediction saved, but email failed. Contact support if needed.");
    }
  };

  const getPrediction = async (paymentResponse: RazorpayResponse) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AI_BRAIN_API_URL}/api/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: query,
            name,
            dob: format(new Date(dob), "yyyy-MM-dd"),
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`AI error (${res.status}): ${t || "try again"}`);
      }
      const data = await res.json();
      const aiPrediction = data.prediction || "The cosmos whispers in riddles today.";
      setPrediction(aiPrediction);
      await persistAfterPayment(paymentResponse, aiPrediction);
    } catch (e: any) {
      console.error("❌ Prediction error:", e);
      setError(e?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRzp = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(s);
    });

  const makePayment = async () => {
    if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "false") {
      return getPrediction({
        razorpay_order_id: "test_order",
        razorpay_payment_id: "test_payment",
        razorpay_signature: "test_sig",
      });
    }

    setIsLoading(true);
    setError(null);
    try {
      // referral cookie
      const referralCookie = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("jyotai_referral="));
      const referralCode = referralCookie ? referralCookie.split("=")[1] : "";

      // 1) create order
      const orderRes = await fetch("/api/pay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: 49900,
          purpose: "standard",
          ref: referralCode,
          name,
          dob: format(new Date(dob), "yyyy-MM-dd"),
          query,
        }),
      });

      if (!orderRes.ok) {
        const t = await orderRes.text().catch(() => "");
        console.error("❌ /create-order failed:", orderRes.status, t);
        throw new Error("Payment setup failed. Please refresh and try again.");
      }

      const { order, key } = await orderRes.json();
      if (!key) throw new Error("Missing Razorpay key (client)");

      // 2) load checkout SDK
      await loadRzp();
      if (!window.Razorpay) throw new Error("Razorpay SDK not available");

      // 3) open checkout (do NOT pass amount if order_id is used)
      const rzp = new window.Razorpay({
        key,
        currency: order.currency,
        name: "JyotAI Divine Reading",
        description: "Instant Vedic Insight",
        order_id: order.id,
        handler: getPrediction,
        prefill: { name, email, contact: "" },
        notes: { name, dob, query, purpose: "standard", ref: referralCode },
        theme: { color: "#D4AF37" },
      });

      rzp.open();
    } catch (e: any) {
      console.error("❌ makePayment error:", e);
      setError(e?.message || "Could not connect to the payment gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  if (prediction) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg text-left">
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">🔮 A Message from the Cosmos:</h2>
        <p className="text-lg whitespace-pre-wrap text-white">{prediction}</p>
        <p className="text-sm mt-4 text-gray-400">
          A magic link has been sent to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      <button
        onClick={makePayment}
        disabled={isLoading}
        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isLoading ? "Processing payment" : "Pay ₹499 to reveal your destiny"}
      >
        {isLoading ? "Preparing Portal..." : "Pay ₹499 to Reveal Your Destiny"}
      </button>
    </div>
  );
}
