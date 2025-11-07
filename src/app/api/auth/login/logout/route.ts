// src/app/api/auth/login/logout/route.ts
import { NextResponse } from "next/server";

// Node runtime
export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ status: "success" });
  res.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    secure: true,
    maxAge: 0, // expire immediately
    path: "/",
    sameSite: "lax",
  });
  return res;
}
