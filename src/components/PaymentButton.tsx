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
  amount: string;
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
      console.log("User data and prediction saved successfully!");
    } catch (error) {
      console.error("Failed to save user data:", error);
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

      if (!res.ok) throw new Error("The oracle is silent. Please try again.");
      const data = await res.json();
      const aiPrediction =
        data.prediction || "The cosmos whispers in riddles today.";
      setPrediction(aiPrediction);
      await persistAfterPayment(paymentResponse, aiPrediction);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const makePayment = async () => {
    // staging/dev bypass: deliver reading without charging
    if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "false") {
      return getPrediction({
        razorpay_order_id: "test_order",
        razorpay_payment_id: "test_payment",
        razorpay_signature: "test_sig",
      });
    }

    setIsLoading(true);
    try {
      // 🍪 referral cookie (we standardize on "jyotai_referral")
      const referralCookie = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("jyotai_referral="));
      const referralCode = referralCookie ? referralCookie.split("=")[1] : "";

      // 1) create order on our server (new path)
      const orderRes = await fetch("/api/pay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: 49900, // ₹499.00 in paise
          purpose: "standard",
          ref: referralCode,
          name,
          dob: format(new Date(dob), "yyyy-MM-dd"),
          query,
        }),
      });
      if (!orderRes.ok) throw new Error("Failed to create Razorpay order");
      const { order } = await orderRes.json();

      // 2) load Razorpay SDK and open checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => {
        setError("Razorpay SDK failed to load.");
        setIsLoading(false);
      };
      script.onload = () => {
        if (!window.Razorpay) {
          setError("Razorpay SDK not available.");
          setIsLoading(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: String(order.amount),
          currency: order.currency,
          name: "JyotAI Divine Reading",
          description: "Instant Vedic Insight",
          order_id: order.id,
          handler: getPrediction, // called on success
          prefill: {
            name,
            email,
            contact: "",
          },
          notes: {
            name,
            dob,
            query,
            purpose: "standard",
            ref: referralCode,
          },
          theme: { color: "#D4AF37" },
        });

        rzp.open();
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } catch (error) {
      if (error instanceof Error) {
        setError("Could not connect to the payment gateway.");
      } else {
        setError("An unexpected error occurred.");
      }
      setIsLoading(false);
    }
  };

  if (prediction) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg text-left">
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">
          🔮 A Message from the Cosmos:
        </h2>
        <p className="text-lg whitespace-pre-wrap text-white">{prediction}</p>
        <p className="text-sm mt-4 text-gray-400">
          A magic link to access your history has been sent to <strong>{email}</strong>.
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
