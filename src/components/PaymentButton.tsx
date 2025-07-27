"use client";

import { useState } from "react";
import { format } from "date-fns";

// ... (Types remain the same)
type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; };
type RazorpayOptions = { key: string; amount: string; currency: string; name: string; description: string; order_id: string; handler: (response: RazorpayResponse) => void; prefill?: { name?: string; email?: string; contact?: string; }; theme?: { color?: string; }; };
type RazorpayInstance = { open: () => void; };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance; } }

interface PaymentButtonProps {
  name: string;
  dob: string;
  query: string;
}

export function PaymentButton({ name, dob, query }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  // --- THIS IS THE UPGRADE: A new function to save everything ---
  const onPaymentSuccess = async (paymentResponse: RazorpayResponse, aiPrediction: string, userEmail: string) => {
    try {
      await fetch('/api/on-payment-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          name,
          dob: format(new Date(dob), "yyyy-MM-dd"),
          query,
          prediction: aiPrediction,
        }),
      });
      // For now, we'll just log success. Later we can show a better message.
      console.log("User data and prediction saved successfully!");
    } catch (error) {
      console.error("Failed to save user data:", error);
      alert("Your prediction was generated, but we couldn't save it to your account. Please contact support.");
    }
  };

  const getPrediction = async (paymentResponse: RazorpayResponse, userEmail: string) => {
    setIsLoading(true);
    try {
      const aiApiUrl = `${process.env.NEXT_PUBLIC_AI_BRAIN_API_URL}/api/predict`;
      const res = await fetch(aiApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, name: name, dob: format(new Date(dob), "yyyy-MM-dd") }),
      });
      if (!res.ok) throw new Error("The divine oracle is resting. Please try again.");
      const data = await res.json();
      const aiPrediction = data.prediction || "The cosmos is silent at this moment.";
      setPrediction(aiPrediction);
      
      // After getting the prediction, save everything to our database
      await onPaymentSuccess(paymentResponse, aiPrediction, userEmail);

    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const makePayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      if (!res.ok) {
      const err = await res.json();
      console.error("❌ Razorpay Order API Error:", err);
      throw new Error(err.error || "Failed to create Razorpay order");
      }
      const { order } = await res.json();
      
      const userEmail = "test.user@example.com"; // We will get this from the form later

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => { alert("Razorpay SDK failed to load."); setIsLoading(false); };
      script.onload = () => {
        if (!window.Razorpay) { alert("Razorpay SDK not available."); setIsLoading(false); return; }
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: order.amount.toString(),
          currency: order.currency,
          name: "JyotAI Divine Reading",
          description: "Instant Vedic Insight",
          order_id: order.id,
          handler: (response) => {
            // We now pass the payment response and user email to the prediction function
            getPrediction(response, userEmail);
          },
          prefill: { name: name, email: userEmail, contact: "9999999999" },
          theme: { color: "#D4AF37" },
        });
        rzp.open();
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } catch (error) {
      if (error instanceof Error) alert("Could not connect to the payment gateway.");
      setIsLoading(false);
    }
  };
  
  if (prediction) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg text-left">
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">🔮 A Message from the Cosmos:</h2>
        <p className="text-lg whitespace-pre-wrap text-white">{prediction}</p>
        <p className="text-sm mt-4 text-gray-400">A magic link to access your history has been sent to your email.</p>
      </div>
    );
  }

  return (
    <button
      onClick={makePayment}
      disabled={isLoading}
      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Preparing Portal..." : "Pay ₹499 to Reveal Your Destiny"}
    </button>
  );
}
