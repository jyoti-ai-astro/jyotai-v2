import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const healthUrl =
    process.env.BRAIN_HEALTH_URL || "https://jyotai-ai-brain.onrender.com/health";

  let ok = false;
  let status = 0;
  try {
    const res = await fetch(healthUrl, { cache: "no-store" });
    status = res.status;
    ok = res.ok;
  } catch (e) {
    ok = false;
  }

  return NextResponse.json({ ok, status });
}
