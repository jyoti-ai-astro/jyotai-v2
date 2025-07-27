// src/components/PaymentButton.tsx

"use client"; // This is a client component, as it requires user interaction

import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentButton() {
  const [isLoading, setIsLoading] = useState(false);

  const makePayment = async () => {
    setIsLoading(true);

    try {
      // 1. Call our own API to create the order
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      
      if (!res.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const { order } = await res.json();

      // 2. Load the Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsLoading(false);
      };
      script.onload = async () => {
        try {
          const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount.toString(),
            currency: order.currency,
            name: "JyotAI Divine Reading",
            description: "Instant Vedic Insight",
            order_id: order.id,
            handler: function (response: any) {
              // This function is called after a successful payment
              alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
              // In our next milestone, this is where we will trigger the account creation.
            },
            prefill: {
              name: "Test User",
              email: "test.user@example.com",
              contact: "9999999999",
            },
            notes: {
              address: "JyotAI Corporate Office",
            },
            theme: {
              color: "#D4AF37", // A divine gold color from our blueprint
            },
          });

          rzp.open();
        } catch (err) {
          alert("An error occurred during payment. Please try again.");
          console.error(err);
        } finally {
          // The Razorpay modal handles its own closing, so we don't need to setIsLoading(false) here
          // unless the user closes the modal without paying. We can add that logic later.
        }
      };
      document.body.appendChild(script);

    } catch (error) {
      alert("Could not connect to the payment gateway. Please try again.");
      console.error("Payment initiation error:", error);
      setIsLoading(false);
    }
    // Note: We intentionally don't set isLoading to false here, 
    // because the Razorpay modal takes over the UI.
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