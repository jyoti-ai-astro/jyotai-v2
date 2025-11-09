// src/app/api/predictions/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tiny SVG template (keep simple to avoid bundler surprises)
function svgTemplate(title: string, body: string) {
  const safeTitle = (title || "").replace(/[<&>]/g, "");
  const safeBody = (body || "").replace(/[<&>]/g, "");
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#0B0F14"/>
        <stop offset="1" stop-color="#1b2230"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="60" y="120" font-family="Inter, ui-sans-serif" font-weight="700" font-size="40" fill="#FFC857">
      JyotAI — Divine Reading
    </text>
    <text x="60" y="190" font-family="Inter, ui-sans-serif" font-size="28" fill="#E6E6E6">
      ${safeTitle}
    </text>
    <foreignObject x="60" y="230" width="1080" height="360">
      <div xmlns="http://www.w3.org/1999/xhtml"
           style="font-family: Inter, ui-sans-serif; font-size: 22px; color: #cfd8e3; white-space: pre-wrap; line-height: 1.45;">
        ${safeBody.slice(0, 600)}
      </div>
    </foreignObject>
  </svg>`;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) return new NextResponse("Missing id", { status: 400 });

    // auth
    const session = req.cookies.get("session")?.value;
    if (!session) return new NextResponse("Not authenticated", { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    // fetch prediction
    const predSnap = await adminDb
      .collection("users").doc(uid)
      .collection("predictions").doc(id)
      .get();

    if (!predSnap.exists) return new NextResponse("Prediction not found", { status: 404 });

    const pred = predSnap.data() || {};
    const title = pred.query || "Your Question";
    const body = pred.prediction || "—";

    // Build SVG then rasterize with resvg — loaded at runtime only
    const markup = svgTemplate(title, body);

    // IMPORTANT: dynamic import so Next doesn't bundle native .node binaries
    const { Resvg } = await import("@resvg/resvg-js"); // runtime load
    const png = new Resvg(markup, {
      fitTo: { mode: "width", value: 1200 },
      background: "transparent",
    }).render().asPng();

    return new NextResponse(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("share image error:", err);
    return new NextResponse("Failed to generate", { status: 500 });
  }
}
