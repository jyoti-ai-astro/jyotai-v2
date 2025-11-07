// ✅ File: src/app/api/pay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";

// Use Node runtime (SDK & env)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    
    const rateLimitResult = rateLimit(`order:${ip}`, 10, 60_000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const {
      email,
      amount = 49900,
      purpose = "standard", // "standard" | "premium"
      name = "",
      dob = "",
      query = "",
    } = await req.json();

    // Input validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 🍪 Read referral from cookie if present (standardized key)
    const cookieHeader = req.headers.get("cookie") || "";
    const refMatch = cookieHeader.match(/(?:^|;\s*)jyotai_referral=([^;]+)/);
    const ref = refMatch?.[1] || "";

    const options = {
      amount, // in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        email: email.trim().toLowerCase(),
        purpose, // keep consistent with webhook logic below
        ref,
        name: String(name || "").trim().substring(0, 100),
        dob: String(dob || "").trim().substring(0, 50),
        query: String(query || "").trim().substring(0, 500),
      },
    } as const;

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
