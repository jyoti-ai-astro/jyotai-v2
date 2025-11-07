"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import {
  getFirestore,
  collection,
  getDocs,
  query as firestoreQuery,
  orderBy,
} from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import ShareImageButton from "@/components/ShareImageButton";
import ShareWhatsAppButton from "@/components/ShareWhatsAppButton";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
  dob?: string;
}

export default function PredictionsPage() {
  const { user, loading } = useUser();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!user) {
        setFetching(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const predictionsRef = collection(db, `users/${user.uid}/predictions`);
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
        setFetching(false);
      }
    };

    fetchPredictions();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h2 className="text-xl font-semibold">You are not logged in.</h2>
        <Link href="/login" className="text-celestial-gold mt-4">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl text-white font-bold">📜 All Your Predictions</h1>
        <Link href="/dashboard" className="text-yellow-300 underline hover:text-white">
          ← Back to Dashboard
        </Link>
      </div>

      {predictions.length === 0 ? (
        <div className="text-yellow-300 text-center py-12">
          <p className="text-lg mb-4">You haven't asked anything yet.</p>
          <Link className="underline text-celestial-gold" href="/">
            Ask your first question →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((p) => {
            const preview =
              (p.prediction || "").length > 220
                ? `${p.prediction.slice(0, 220)}…`
                : p.prediction || "—";

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
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Link
                    className="text-yellow-400 underline hover:text-white"
                    href={`/predictions/${p.id}`}
                  >
                    View full
                  </Link>
                  <DownloadPdfButton predictionId={p.id} />
                  <ShareImageButton predictionId={p.id} />
                  <ShareWhatsAppButton
                    predictionId={p.id}
                    question={p.query}
                    preview={preview}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

