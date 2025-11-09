// src/app/api/cron/ping-brain/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const qsSecret = url.searchParams.get("secret") || "";
  const headerAuth = req.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET || "";

  const authed =
    (expected && headerAuth === `Bearer ${expected}`) ||
    (expected && qsSecret === expected);

  if (!authed) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const healthUrl =
    process.env.BRAIN_HEALTH_URL || "https://jyotai-ai-brain.onrender.com/health";

  let ok = false;
  let status = 0;
  try {
    const res = await fetch(healthUrl, { cache: "no-store" });
    status = res.status;
    ok = res.ok;
  } catch {
    ok = false;
  }

  return NextResponse.json({ ok, status });
}
