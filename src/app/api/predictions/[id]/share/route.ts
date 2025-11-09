// src/app/api/predictions/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/predictions/:id/share
 * Returns a PNG social-share image for the prediction using resvg at runtime.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });
    }

    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const predRef = userRef.collection("predictions").doc(id);
    const [userSnap, predSnap] = await Promise.all([userRef.get(), predRef.get()]);

    if (!userSnap.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!predSnap.exists) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });

    const user = userSnap.data() || {};
    const pred = predSnap.data() || {};

    const title = (pred.query as string) || "Your Question";
    const body = (pred.prediction as string) || "No reading found.";

    // Build SVG markup (safe subset)
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0B0F14"/>
            <stop offset="100%" stop-color="#1a1f29"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#g)"/>
        <g font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" fill="#F7F7F8">
          <text x="60" y="110" font-size="44" fill="#FFC857">🪔 JyotAI</text>
          <text x="60" y="170" font-size="34" fill="#2A9DF4">Q:</text>
          <foreignObject x="110" y="135" width="1030" height="130">
            <div xmlns="http://www.w3.org/1999/xhtml"
                 style="color:#F7F7F8;font-size:30px;line-height:1.25;word-wrap:break-word;">
              ${escapeHtml(title).slice(0, 220)}
            </div>
          </foreignObject>

          <text x="60" y="280" font-size="34" fill="#2A9DF4">Reading:</text>
          <foreignObject x="60" y="300" width="1080" height="260">
            <div xmlns="http://www.w3.org/1999/xhtml"
                 style="color:#D1D5DB;font-size:26px;line-height:1.35;white-space:pre-wrap;word-wrap:break-word;">
              ${escapeHtml(body).slice(0, 700)}
            </div>
          </foreignObject>

          <text x="60" y="600" font-size="22" fill="#FFC857">jyoti.app</text>
        </g>
      </svg>
    `;

    // ⬇️ Runtime import to avoid bundling .node binaries during build
    const { Resvg } = await import("@resvg/resvg-js");
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      background: "rgba(0,0,0,0)",
    });
    const png = resvg.render().asPng();

    return new NextResponse(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error("SHARE image error:", e);
    return NextResponse.json({ error: "Failed to render share image" }, { status: 500 });
  }
}

// tiny helper
function escapeHtml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
