// src/lib/razorpay.ts
// Server-only Razorpay client. Do NOT import from Edge or client code.

import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  // Fail fast in dev/staging if envs are missing
  throw new Error(
    "Razorpay env missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env / Vercel Project Settings."
  );
}

// Create a single instance to reuse across requests
export const razorpay = new Razorpay({
  key_id,
  key_secret,
});
