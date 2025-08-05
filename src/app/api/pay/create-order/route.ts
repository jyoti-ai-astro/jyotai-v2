// ✅ File: src/app/api/pay/create-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { email, amount = 49900, purpose = "standard" } = await req.json();

    // 🧠 Read referral from cookie (if exists)
    const cookieHeader = req.headers.get("cookie") || "";
    const refMatch = cookieHeader.match(/jyotai_referral=([^;]+)/);
    const ref = refMatch?.[1] || "";

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        email,
        purpose,
        ref,
      },
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
