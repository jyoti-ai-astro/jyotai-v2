"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase-client";

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
  "🔮 Be open to surprises. The universe is playful."
];

function calculateLuckScore(dob: string): number {
  const today = new Date();
  const dateSum = today.getDate() + today.getMonth() + 1 + today.getFullYear();

  const dobSum = dob
    .split("-")
    .map((x) => parseInt(x, 10))
    .reduce((acc, num) => acc + num, 0);

  const total = dobSum + dateSum;
  const score = (total % 10) + 1;

  return score;
}

export default function DailyLuck() {
  const [luckScore, setLuckScore] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const fetchUserDOB = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const dob = docSnap.data().dob || "1990-01-01"; // fallback
        const score = calculateLuckScore(dob);
        setLuckScore(score);

        const tipIndex = new Date().getDate() % tips.length;
        setTip(tips[tipIndex]);
      }
    };

    fetchUserDOB();
  }, []);

  if (!tip || !luckScore) return null;

  return (
    <div className="mt-10 p-5 border border-yellow-500 rounded-xl bg-white/5 text-white text-center shadow">
      <h2 className="text-xl font-bold mb-2">🔆 Lucky Tip of the Day</h2>
      <p className="italic text-yellow-300">{tip}</p>
      <div className="mt-4 text-sm text-gray-300">
        Today’s Luck Meter:{" "}
        <span className="text-2xl font-bold text-green-400">{luckScore}/10</span>
      </div>
    </div>
  );
}
