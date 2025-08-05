"use client";

import { useUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import PredictionCard from "@/components/dashboard/PredictionCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import DailyLuck from "@/components/ui/DailyLuck";
import UpsellPrompt from "@/components/ui/UpsellPrompt";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading } = useUser();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const db = getFirestore(app);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      setCredits(userData?.credits ?? null);

      const snap = await getDocs(collection(db, `users/${user.uid}/predictions`));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prediction[];

      setPredictions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setFetching(false);
    };

    fetchUserData();
  }, [user]);

  if (loading) return <Loading />;
  if (!user)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h2 className="text-xl font-semibold">You are not logged in.</h2>
        <Link href="/" className="text-celestial-gold mt-4">
          Return to the portal.
        </Link>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl text-white font-bold mb-6">📜 Your Predictions</h1>

      {fetching ? (
        <p className="text-gray-400">Loading divine records...</p>
      ) : predictions.length === 0 ? (
        <p className="text-yellow-400">You haven’t asked anything yet.</p>
      ) : (
        <div className="space-y-4">
          {predictions.map((p) => (
            <div key={p.id} className="border border-yellow-400 p-4 rounded-xl bg-white/5 shadow-sm">
              <p className="text-sm text-yellow-300 font-semibold">
                {new Date(p.createdAt).toLocaleString()}
              </p>
              <p className="mt-1"><strong>Q:</strong> {p.query}</p>
              <p className="text-sm text-gray-300 mt-2">
                <strong>Reading:</strong> {p.prediction.slice(0, 200)}...
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Inject Daily Luck */}
      <DailyLuck />

      {/* Upsell Prompt only for Standard users with 1 credit left */}
      {credits === 1 && <UpsellPrompt />}
    </div>
  );
}
