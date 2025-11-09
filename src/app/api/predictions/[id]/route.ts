// src/app/api/predictions/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Utility: simple SVG escape
const esc = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });
    }

    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const [userSnap, predSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("predictions").doc(id).get(),
    ]);

    if (!userSnap.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!predSnap.exists) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });

    const user = userSnap.data() || {};
    const pred = predSnap.data() || {};

    const name = user.name || "JyotAI User";
    const query = pred.query || "—";
    const body = (pred.prediction as string) || "—";

    // --- build a clean SVG (1200x630 OG style) ---
    const width = 1200;
    const height = 630;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <defs>
          <style>
            @font-face {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
                Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            }
          </style>
        </defs>
        <rect width="100%" height="100%" fill="#0B0F14"/>
        <g transform="translate(60,60)">
          <text x="0" y="0" fill="#FFC857" font-size="40" font-weight="700">🔮 JyotAI Reading</text>
          <text x="0" y="60" fill="#9AE6B4" font-size="26">for ${esc(name)}</text>

          <text x="0" y="120" fill="#2A9DF4" font-size="24" font-weight="600">Q:</text>
          <foreignObject x="40" y="90" width="${width - 160}" height="90">
            <div xmlns="http://www.w3.org/1999/xhtml"
                 style="color:#E2E8F0;font-size:24px;line-height:1.3;font-weight:600;">
              ${esc(query)}
            </div>
          </foreignObject>

          <text x="0" y="210" fill="#FFC857" font-size="22" font-weight="600">Reading:</text>
          <foreignObject x="0" y="230" width="${width - 120}" height="${height - 300}">
            <div xmlns="http://www.w3.org/1999/xhtml"
                 style="color:#CBD5E1;font-size:22px;line-height:1.45;white-space:pre-wrap;">
              ${esc(body.length > 800 ? body.slice(0, 800) + "…" : body)}
            </div>
          </foreignObject>

          <text x="0" y="${height - 140}" fill="#94A3B8" font-size="18">jyoti.app • @JyotAI</text>
        </g>
      </svg>
    `;

    // IMPORTANT: runtime import so webpack doesn’t try bundling native .node binaries
    const { Resvg } = await import("@resvg/resvg-js");

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      background: "transparent",
    });
    const pngData = resvg.render().asPng();

    return new NextResponse(pngData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("share image error:", e);
    return NextResponse.json({ error: "Failed to generate share image" }, { status: 500 });
  }
}
