// src/app/predictions/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import ShareImageButton from "@/components/ShareImageButton";
import ShareWhatsAppButton from "@/components/ShareWhatsAppButton";
import CopyLinkButton from "@/components/CopyLinkButton";

type Pred = {
  id: string;
  query: string;
  prediction: string;
  createdAt?: string;
  dob?: string;
};

export default function PredictionDetails({ params }: { params: { id: string } }) {
  const { user, loading } = useUser();
  const [pred, setPred] = useState<Pred | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (!user) return;
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, `users/${user.uid}/predictions/${params.id}`));
        if (!snap.exists()) {
          setErr("Prediction not found.");
          return;
        }
        setPred({ id: snap.id, ...(snap.data() as Omit<Pred, "id">) });
      } catch (e) {
        console.error(e);
        setErr("Failed to load prediction.");
      }
    };
    run();
  }, [user, params.id]);

  if (loading) return <div className="p-8 text-white">Loading…</div>;

  if (!user) {
    return (
      <div className="p-8 text-white">
        You are not logged in.{" "}
        <Link className="text-yellow-300 underline" href="/login">
          Login
        </Link>
      </div>
    );
  }

  if (err) return <div className="p-8 text-red-400">{err}</div>;
  if (!pred) return null;

  const created =
    pred.createdAt && !Number.isNaN(Date.parse(pred.createdAt))
      ? new Date(pred.createdAt).toLocaleString()
      : "—";

  const preview =
    (pred.prediction || "").length > 220
      ? `${pred.prediction.slice(0, 220)}…`
      : pred.prediction || "—";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-white">🪔 Your Reading</h1>
        <Link href="/dashboard/predictions" className="text-yellow-300 underline hover:text-white">
          ← Back to My Predictions
        </Link>
      </div>

      <div className="rounded-2xl border border-yellow-400/60 bg-white/5 p-5 shadow">
        <div className="text-sm text-yellow-300">{created}</div>

        <div className="mt-3">
          <div className="text-gray-300">
            <span className="font-semibold text-white">Question:</span> {pred.query}
          </div>
          {pred.dob && (
            <div className="text-gray-400 mt-1">
              <span className="font-semibold text-white">DOB:</span> {pred.dob}
            </div>
          )}
        </div>

        <div className="mt-5 whitespace-pre-wrap leading-relaxed text-gray-100">
          {pred.prediction}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <DownloadPdfButton predictionId={pred.id} />
          <ShareImageButton predictionId={pred.id} />
          <ShareWhatsAppButton predictionId={pred.id} question={pred.query} preview={preview} />
          <CopyLinkButton />
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-yellow-400/60 px-3 py-2 text-yellow-300 hover:bg-yellow-400/10"
          >
            Ask another question
          </Link>
        </div>
      </div>
    </div>
  );
}
