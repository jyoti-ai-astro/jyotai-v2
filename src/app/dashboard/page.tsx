// src/app/dashboard/page.tsx
"use client";

// ✅ Next.js flags for client-only, dynamic rendering
//export const dynamic = "force-dynamic";
//export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SuccessMessage } from "@/components/ui/ErrorMessage";
import { useUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import UpsellPrompt from "@/components/ui/UpsellPrompt";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import ShareImageButton from "@/components/ShareImageButton";
import LimitsBanner from "@/components/dashboard/LimitsBanner";
import PredictionsSkeleton from "@/components/dashboard/PredictionsSkeleton";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "@/lib/firebase-client";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string; // ISO
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
  const [referredBy, setReferredBy] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const search = useSearchParams();
  const upgradedNow = search.get("upgraded") === "true";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setFetching(true);
      try {
        const db = getFirestore(app);

        // Fetch user profile
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const u = userSnap.data() || {};
        setReferralCode(u.referralCode || "");
        setReferredBy(u.referredBy || "");

        // Fetch latest predictions
        const snap = await getDocs(collection(db, `users/${user.uid}/predictions`));
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Prediction, "id">),
        })) as Prediction[];

        // Sort by newest first
        list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setPredictions(list);
      } catch (e) {
        console.error("Dashboard fetch failed:", e);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (user.plan === "premium") {
      const dailyTip = tips[new Date().getDate() % tips.length];
      setTip(dailyTip);
      setLuck(Math.floor(Math.random() * 10) + 1);
    }
  }, [user]);

  const referralLink = useMemo(() => {
    if (!referralCode) return "";
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://jyoti.app";
    return `${base}/?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading) return <Loading />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h2 className="text-xl font-semibold">You are not logged in.</h2>
        <Link href="/" className="text-celestial-gold mt-4">
          Return to the portal
        </Link>
      </div>
    );
  }

  const isPremium = user.plan === "premium";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {copySuccess && (
        <SuccessMessage
          message="🔗 Referral link copied!"
          onClose={() => setCopySuccess(false)}
        />
      )}

      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl text-white font-bold">📜 Your Predictions</h1>
        <Link href="/dashboard/predictions" className="text-yellow-300 underline hover:text-white">
          View all →
        </Link>
      </div>

      {upgradedNow && (
        <div className="mb-4 rounded-lg border border-emerald-700/60 bg-emerald-900/30 p-3 text-emerald-200">
          ✅ Premium activated. Enjoy deeper insights!
        </div>
      )}

      <LimitsBanner userId={user.uid} />

      {isPremium && (
        <div className="bg-yellow-100/10 border border-yellow-300 p-4 rounded-xl text-white mb-6">
          <h2 className="text-xl font-semibold text-yellow-400">🪔 Tip of the Day</h2>
          <p>{tip}</p>
          <div className="mt-2">
            <p>
              🌟 Your Luck Meter: <strong>{luck}/10</strong>
            </p>
            <div className="w-full bg-yellow-900 h-2 rounded-full overflow-hidden mt-1">
              <div className="bg-yellow-400 h-2" style={{ width: `${luck * 10}%` }} />
            </div>
          </div>
        </div>
      )}

      {referralCode && (
        <div className="bg-green-900/10 border border-green-500 text-white p-4 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-green-400">📨 Invite Friends</h2>
          <p>
            Your referral code: <code className="text-green-300">{referralCode}</code>
          </p>
          <p>They’ll get 1 free prediction. You’ll earn bonus credits when they pay.</p>
          <div className="flex gap-4 mt-3 flex-wrap">
            <button
              onClick={handleCopy}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Copy Referral Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🔮 Join JyotAI: ${referralLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-green-700 text-white px-4 py-2 rounded"
            >
              Share via WhatsApp
            </a>
          </div>
        </div>
      )}

      {referredBy && (
        <div className="mb-6 bg-blue-900/30 border border-blue-400 p-4 rounded-lg text-blue-300">
          🎁 You were referred by <strong>{referredBy}</strong>. Spread the divine karma forward!
        </div>
      )}

      {!isPremium && predictions.length >= 2 && <UpsellPrompt />}

      {fetching ? (
        PredictionsSkeleton ? (
          <PredictionsSkeleton />
        ) : (
          <p className="text-gray-400">Loading divine records...</p>
        )
      ) : predictions.length === 0 ? (
        <div className="text-yellow-300">
          You haven’t asked anything yet.{" "}
          <Link className="underline" href="/">
            Ask your first question →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.slice(0, 5).map((p) => {
            const preview =
              (p.prediction || "").length > 200
                ? `${p.prediction.slice(0, 200)}...`
                : p.prediction || "—";
            return (
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
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
                  <strong>Reading:</strong> {preview}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={`/predictions/${p.id}`}
                    className="text-yellow-300 underline hover:text-white"
                  >
                    View full
                  </Link>
                  <DownloadPdfButton predictionId={p.id} />
                  <ShareImageButton predictionId={p.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
