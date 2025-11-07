// src/app/api/predictions/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import satori, { SatoriOptions } from "satori";
import { Resvg } from "@resvg/resvg-js";

export const runtime = "nodejs";

// ----- helpers -----
function pickKeyInsight(text: string, max = 180) {
  if (!text) return "May clarity and strength guide your path.";
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const firstGood = lines.find((l) => l.length > 20) || lines[0] || text;
  return firstGood.length > max ? firstGood.slice(0, max - 1) + "…" : firstGood;
}

async function getUserAndPrediction(uid: string, id: string) {
  const userRef = adminDb.collection("users").doc(uid);
  const [userSnap, predSnap] = await Promise.all([
    userRef.get(),
    userRef.collection("predictions").doc(id).get(),
  ]);
  if (!userSnap.exists) throw new Error("user_not_found");
  if (!predSnap.exists) throw new Error("prediction_not_found");
  return { user: userSnap.data() || {}, pred: predSnap.data() || {} };
}

// ----- GET -> returns PNG image -----
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });

    // auth via session cookie
    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const { user, pred } = await getUserAndPrediction(uid, id);
    const quote = pickKeyInsight(String(pred.prediction || ""));

    // Build SVG via satori
    const width = 1200;
    const height = 630;
    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            width,
            height,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 48,
            background: "linear-gradient(135deg, #0b1220 0%, #121a2b 50%, #0b1220 100%)",
          } as React.CSSProperties,
          children: [
            {
              type: "div",
              props: {
                style: { color: "#D4AF37", fontSize: 36, fontWeight: 700 },
                children: "🪔 JyotAI · Divine Insight",
              },
            },
            {
              type: "div",
              props: {
                style: {
                  color: "#ffffff",
                  fontSize: 40,
                  lineHeight: 1.35,
                  whiteSpace: "pre-wrap",
                },
                children: `“${quote}”`,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#A7B1C2",
                  fontSize: 22,
                },
                children: [
                  { type: "div", props: { children: user?.name ? `— ${user.name}` : "" } },
                  { type: "div", props: { style: { color: "#D4AF37" }, children: "jyoti.app" } },
                ],
              },
            },
          ],
        },
      } as any,
      {
        width,
        height,
        // If you later host fonts, add them here. Web-safe works fine for now.
        fonts: [],
      } as SatoriOptions
    );

    // Rasterize to PNG
    const resvg = new Resvg(svg, {
      background: "rgba(0,0,0,0)",
      fitTo: { mode: "width", value: 1200 },
    });
    const png = resvg.render().asPng();

    return new NextResponse(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="jyotai-share-${id}.png"`,
        "Cache-Control": "private, max-age=0, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (e) {
    console.error("share image error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    const code =
      msg === "user_not_found" || msg === "prediction_not_found" ? 404 : 500;
    return NextResponse.json({ error: "Failed to generate share image" }, { status: code });
  }
}

// ----- POST -> returns JSON for WhatsApp button -----
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });

    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const { pred } = await getUserAndPrediction(uid, id);
    const headline = pickKeyInsight(String(pred.prediction || ""), 120);

    const origin = req.nextUrl.origin;
    const imageUrl = `${origin}/api/predictions/${id}/share`; // GET (above) returns the PNG
    const pageUrl = `${origin}/predictions/${id}`;

    return NextResponse.json({ ok: true, imageUrl, pageUrl, headline });
  } catch (e) {
    console.error("share POST error:", e);
    return NextResponse.json({ ok: false, error: "Share prepare failed" }, { status: 500 });
  }
}
