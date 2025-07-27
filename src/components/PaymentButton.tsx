"use client";

import { useState } from "react";

// Razorpay and AI integration types
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
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function PaymentButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  const getPrediction = async () => {
    setIsLoading(true);
    try {
      const aiApiUrl = `${process.env.NEXT_PUBLIC_AI_BRAIN_API_URL}/api/predict`;

      const res = await fetch(aiApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "When will I find true love?" }),
      });

      if (!res.ok) throw new Error("The divine oracle is resting. Please try again.");

      const data = await res.json();
      setPrediction(data.prediction || "The cosmos is silent at this moment.");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred while contacting the oracle.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const makePayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create Razorpay order");
      const { order } = await res.json();

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => {
        alert("Razorpay SDK failed to load.");
        setIsLoading(false);
      };
      script.onload = () => {
        if (!window.Razorpay) {
          alert("Razorpay SDK not available.");
          setIsLoading(false);
          return;
        }

        const options: RazorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: order.amount.toString(),
          currency: order.currency,
          name: "JyotAI Divine Reading",
          description: "Instant Vedic Insight",
          order_id: order.id,
          handler: function (response: RazorpayResponse) {
            console.log("Payment successful!", response);
            getPrediction();
          },
          prefill: {
            name: "Test User",
            email: "test.user@example.com",
            contact: "9999999999",
          },
          theme: { color: "#D4AF37" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsLoading(false);
      };

      document.body.appendChild(script);
    } catch (error) {
      if (error instanceof Error) {
        alert("Could not connect to the payment gateway.\n" + error.message);
      } else {
        alert("Unknown error during payment process.");
      }
      setIsLoading(false);
    }
  };

  // UI: Show prediction or payment button
  if (prediction) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg text-left animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">🔮 A Message from the Cosmos:</h2>
        <p className="text-lg whitespace-pre-wrap text-white">{prediction}</p>
      </div>
    );
  }

  return (
    <button
      onClick={makePayment}
      disabled={isLoading}
      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Preparing Your Portal..." : "Pay ₹499 to Reveal Your Destiny"}
    </button>
  );
}
