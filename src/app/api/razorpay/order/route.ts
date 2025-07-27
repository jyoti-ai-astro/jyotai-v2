import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST() {
  try {
    const options = {
      amount: 49900, // ₹499 in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ order });
  } catch (error) {
    console.error("❌ Razorpay Order Creation Failed:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
