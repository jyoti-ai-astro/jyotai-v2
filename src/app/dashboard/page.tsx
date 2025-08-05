"use client";

import { useUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import PredictionCard from "@/components/dashboard/PredictionCard";
import UpsellPrompt from "@/components/ui/UpsellPrompt";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import { differenceInDays, addDays, parseISO } from "date-fns";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
}

const tips = [
  "Trust your intuition—it’s the voice of your soul.",
  "🌿 A calm mind attracts powerful results.",
  "🪔 Recite a mantra today to align your energy.",
  "📿 Give before asking; karma listens.",
  "✨ Light a diya for clarity in decisions.",
  "🧘‍♂️ Today is perfect for silence. Listen more.",
  "🌕 Avoid ego today; humility wins rewards.",
  "🌺 Be kind without reason. Grace will follow.",
  "📖 Read one shlok for guidance. Let it sink.",
  "💎 Wear light colors. It calms your aura.",
  "🔮 Be open to surprises. The universe is playful.",
];

export default function DashboardPage() {
  const { user, loading } = useUser();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tip, setTip] = useState("");
  const [luck, setLuck] = useState(0);

  const upgradedAt = user?.upgradedAt ? parseISO(user.upgradedAt) : null;
  const premiumExpiresAt = upgradedAt ? addDays(upgradedAt, 30) : null;
  const daysLeft = premiumExpiresAt ? differenceInDays(premiumExpiresAt, new Date()) : null;

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!user) return;

      const db = getFirestore(app);
      const snap = await getDocs(collection(db, `users/${user.uid}/predictions`));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prediction[];

      setPredictions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setFetching(false);
    };

    fetchPredictions();
  }, [user]);

  useEffect(() => {
    if (user?.plan === "premium") {
      const dailyTip = tips[new Date().getDate() % tips.length];
      setTip(dailyTip);
      setLuck(Math.floor(Math.random() * 10) + 1);
    }
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

      {user.plan === "premium" && (
        <>
          {daysLeft !== null && daysLeft >= 0 && (
            <p className="text-yellow-400 mb-4">🌟 {daysLeft} days left in your Premium plan</p>
          )}

          <div className="bg-yellow-100/10 border border-yellow-300 p-4 rounded-xl text-white mb-4">
            <h2 className="text-xl font-semibold text-yellow-400">🪔 Tip of the Day</h2>
            <p>{tip}</p>
            <div className="mt-2">
              <p>🌟 Your Luck Meter: <strong>{luck}/10</strong></p>
              <div className="w-full bg-yellow-900 h-2 rounded-full overflow-hidden mt-1">
                <div className="bg-yellow-400 h-2" style={{ width: `${luck * 10}%` }}></div>
              </div>
            </div>
          </div>
        </>
      )}

      {user.plan === "standard" && predictions.length >= 2 && (
        <UpsellPrompt />
      )}

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
    </div>
  );
}
