// src/app/api/admin/make-admin/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * POST /api/admin/make-admin
 * Body: { "email": "you@domain.com" }
 * Header required: x-setup-secret: <ADMIN_SETUP_SECRET>
 */
export async function POST(req: Request) {
  try {
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_SETUP_SECRET not set on server" },
        { status: 500 }
      );
    }

    const hdr = req.headers.get("x-setup-secret") || "";
    if (hdr !== setupSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    const target = String(email || "").trim().toLowerCase();
    if (!target) {
      return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
    }

    const user = await adminAuth.getUserByEmail(target).catch(async (e: any) => {
      if (e?.code === "auth/user-not-found") {
        return await adminAuth.createUser({ email: target, emailVerified: true });
      }
      throw e;
    });

    await adminAuth.setCustomUserClaims(user.uid, { isAdmin: true });

    // Optionally revoke to force new token issuance
    await adminAuth.revokeRefreshTokens(user.uid);

    return NextResponse.json({ ok: true, uid: user.uid, email: user.email, isAdmin: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
