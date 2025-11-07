// src/components/dashboard/PredictionCard.tsx
"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, orderBy, query as firestoreQuery } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import { useUser } from "@/lib/hooks/useUser";
import Link from "next/link";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import ShareImageButton from "@/components/ShareImageButton";
import ShareWhatsAppButton from "@/components/ShareWhatsAppButton";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
  dob: string;
}

export default function PredictionCard({ userId }: { userId: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const predictionsRef = collection(db, `users/${userId}/predictions`);
        const q = firestoreQuery(predictionsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Prediction, "id">),
        })) as Prediction[];

        setPredictions(data);
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [userId]);

  if (loading) {
    return <p className="text-white text-center mt-4">Loading your past predictions...</p>;
  }

  if (predictions.length === 0) {
    return <p className="text-gray-400 text-center mt-4">You have no past predictions.</p>;
  }

  return (
    <div className="space-y-4">
      {predictions.map((p) => {
        const preview =
          (p.prediction || "").length > 220 ? `${p.prediction.slice(0, 220)}…` : p.prediction || "—";

        const created =
          p.createdAt && !Number.isNaN(Date.parse(p.createdAt))
            ? new Date(p.createdAt).toLocaleString()
            : "—";

        return (
          <div
            key={p.id}
            className="border border-yellow-400 p-4 rounded-xl bg-white/5 shadow-sm"
          >
            <p className="text-sm text-yellow-300 font-semibold">{created}</p>

            <p className="mt-1">
              <strong>Q:</strong> {p.query}
            </p>

            <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
              <strong>Reading:</strong> {preview}
            </p>

            {/* Actions row */}
            <div className="mt-3 flex items-center gap-3">
              <DownloadPdfButton predictionId={p.id} />
              <ShareImageButton predictionId={p.id} />
              <ShareWhatsAppButton predictionId={p.id} question={p.query} preview={preview} />
              <Link
                className="text-yellow-400 underline hover:text-white"
                href={`/predictions/${p.id}`}
              >
                View full
              </Link>
            </div>

            {user?.plan === "premium" ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-green-300">🔮 Life Path Summary Enabled</p>
                <p className="text-blue-300">💎 Lucky Gem: Sapphire</p>
                <p className="text-purple-300">🗺️ Astro Map View: Coming Soon</p>
                <button className="text-celestial-gold underline">📩 Send to WhatsApp</button>
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-400">
                <p>Unlock more details with Premium.</p>
                <Link href="/upgrade" className="text-yellow-400 underline hover:text-white">
                  Upgrade Now →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
