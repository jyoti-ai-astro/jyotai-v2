// src/app/api/razorpay/order/route.ts

import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { randomBytes } from "crypto";

// We have removed the unused 'req' parameter.
export async function POST() {
  try {
    const amount = 49900; // Amount in paise (₹499.00)
    const currency = "INR";
    
    const options = {
      amount,
      currency,
      receipt: `receipt_${randomBytes(10).toString("hex")}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}