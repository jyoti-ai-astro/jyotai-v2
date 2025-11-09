// src/app/api/pay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rl = rateLimit(`order:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      email,
      amount = 49900,
      purpose = "standard",
      name = "",
      dob = "",
      query = "",
    } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    const amt = Number(amount);
    if (!Number.isInteger(amt) || amt < 100) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // referral cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const refMatch = cookieHeader.match(/(?:^|;\s*)jyotai_referral=([^;]+)/);
    const ref = refMatch?.[1] || "";

    const options = {
      amount: amt, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        email: email.trim().toLowerCase(),
        purpose,
        ref,
        name: String(name || "").slice(0, 100),
        dob: String(dob || "").slice(0, 50),
        query: String(query || "").slice(0, 500),
      },
    } as const;

    const order = await razorpay.orders.create(options);
    // explicit shape for client
    return NextResponse.json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        notes: order.notes,
      },
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
    });
  } catch (error: any) {
    // Razorpay SDK throws with statusCode/description/response
    console.error("❌ create-order error:", {
      message: error?.message,
      statusCode: error?.statusCode,
      description: error?.error?.description,
      response: error?.response,
    });
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: Number(error?.statusCode) || 500 }
    );
  }
}
