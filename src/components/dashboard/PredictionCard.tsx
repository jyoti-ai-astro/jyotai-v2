"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import { useUser } from "@/lib/hooks/useUser";
import Image from "next/image";
import Link from "next/link";

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
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, `users/${userId}/predictions`));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prediction[];

      setPredictions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    };

    fetchPredictions();
  }, [userId]);

  if (loading) return <p className="text-white">Loading predictions...</p>;

  return (
    <div className="space-y-4">
      {predictions.map((p) => (
        <div
          key={p.id}
          className="border border-yellow-400 p-4 rounded-xl bg-white/5 shadow-sm"
        >
          <p className="text-sm text-yellow-300 font-semibold">
            {new Date(p.createdAt).toLocaleString()}
          </p>
          <p className="mt-1">
            <strong>Q:</strong> {p.query}
          </p>
          <p className="text-sm text-gray-300 mt-2">
            <strong>Reading:</strong> {p.prediction.slice(0, 200)}...
          </p>

          {/* --- Premium-Only Features --- */}
          {user?.plan === "premium" ? (
            <div className="mt-4 space-y-2">
              <p className="text-green-300">🔮 Life Path Summary Enabled</p>
              <p className="text-blue-300">💎 Lucky Gem: Sapphire</p>
              <p className="text-purple-300">🗺️ Astro Map View: Coming Soon</p>
              <button className="text-celestial-gold underline">📩 Send to WhatsApp</button>
            </div>
          ) : (
            <div className="mt-4 text-sm text-red-300">
              <p>This is a Premium feature.</p>
              <Link
                href="/upgrade"
                className="text-yellow-400 underline hover:text-white"
              >
                Upgrade to Premium →
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
