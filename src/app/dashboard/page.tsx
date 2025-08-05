"use client";

import { useUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import PredictionCard from "@/components/dashboard/PredictionCard";
import UpsellPrompt from "@/components/ui/UpsellPrompt";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase-client";

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
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const db = getFirestore(app);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const refCode = userDoc.data()?.referralCode || "";
      setReferralCode(refCode);

      const snap = await getDocs(collection(db, `users/${user.uid}/predictions`));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prediction[];

      setPredictions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setFetching(false);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (user?.plan === "premium") {
      const dailyTip = tips[new Date().getDate() % tips.length];
      setTip(dailyTip);
      setLuck(Math.floor(Math.random() * 10) + 1);
    }
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://jyoti.app/?ref=${referralCode}`);
    alert("🔗 Referral link copied!");
  };

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

      {/* Premium Meter */}
      {user.plan === "premium" && (
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
      )}

      {/* Referral Block */}
      {referralCode && (
        <div className="bg-green-900/10 border border-green-500 text-white p-4 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-green-400">📨 Invite Friends</h2>
          <p>Your referral code: <code className="text-green-300">{referralCode}</code></p>
          <p>They’ll get 1 free prediction. You’ll earn bonus credits when they pay.</p>
          <div className="flex gap-4 mt-3 flex-wrap">
            <button onClick={handleCopy} className="bg-green-600 text-white px-4 py-2 rounded">Copy Referral Link</button>
            <a
              href={`https://wa.me/?text=🔮 Join JyotAI: https://jyoti.app/?ref=${referralCode}`}
              target="_blank"
              className="bg-green-700 text-white px-4 py-2 rounded"
            >
              Share via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Upsell for Standard */}
      {user.plan === "standard" && predictions.length >= 2 && (
        <UpsellPrompt />
      )}

      {/* Predictions */}
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
