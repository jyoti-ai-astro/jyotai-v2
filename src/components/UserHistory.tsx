"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase-client";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
}

export default function UserHistory() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const snap = await getDocs(collection(db, `users/${user.uid}/predictions`));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Prediction[];

      setPredictions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-center text-sm text-muted">Loading divine records...</p>;

  return (
    <div className="space-y-4">
      {predictions.length === 0 ? (
        <p className="text-center text-muted">No past predictions found.</p>
      ) : (
        predictions.map((p) => (
          <div key={p.id} className="border border-yellow-500 bg-white/5 p-4 rounded-xl shadow">
            <p className="text-sm text-yellow-200 font-semibold">🧿 {new Date(p.createdAt).toLocaleString()}</p>
            <p className="text-base mt-2"><strong>Q:</strong> {p.query}</p>
            <p className="text-sm mt-1 text-gray-300"><strong>Reading:</strong> {p.prediction.slice(0, 200)}...</p>
          </div>
        ))
      )}
    </div>
  );
}
