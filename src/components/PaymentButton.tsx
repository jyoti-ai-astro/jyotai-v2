"use client";

import { useState } from "react";

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

  const makePayment = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create Razorpay order");
      const { order } = await res.json();
      
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsLoading(false);
      };
      script.onload = () => {
        if (!window.Razorpay) {
          alert("Razorpay SDK not available.");
          setIsLoading(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: order.amount.toString(),
          currency: order.currency,
          name: "JyotAI Divine Reading",
          description: "Instant Vedic Insight",
          order_id: order.id,
          handler: function (response: RazorpayResponse) {
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          },
          prefill: {
            name: "Test User",
            email: "test.user@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#D4AF37",
          },
        });
        rzp.open();
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } catch (error) {
      alert("Could not connect to the payment gateway. Please try again.");
      console.error("Payment initiation error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={makePayment}
      disabled={isLoading}
      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Connecting to Gateway..." : "Pay ₹499 Now"}
    </button>
  );
}