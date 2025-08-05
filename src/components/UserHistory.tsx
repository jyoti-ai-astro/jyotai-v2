"use client";

import { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import html2pdf from "html2pdf.js";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
}

export default function UserHistory() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const hiddenRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const snap = await getDocs(collection(db, `users/${user.uid}/predictions`));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prediction[];

      setPredictions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    });
  }, []);

  const downloadPDF = (id: string) => {
    const element = hiddenRefs.current.get(id);
    if (!element) return;

    html2pdf().from(element).set({
      margin: 0.5,
      filename: `jyotai-reading-${id}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }).save();
  };

  if (loading) return <p className="text-center text-sm text-muted">Loading divine records...</p>;

  return (
    <div className="space-y-6">
      {predictions.length === 0 ? (
        <p className="text-center text-muted">No past predictions found.</p>
      ) : (
        predictions.map((p) => (
          <div key={p.id} className="border border-yellow-500 bg-white/5 p-4 rounded-xl shadow relative">
            <p className="text-sm text-yellow-300 font-semibold">
              {new Date(p.createdAt).toLocaleString()}
            </p>
            <p className="mt-1"><strong>Q:</strong> {p.query}</p>
            <p className="text-sm text-gray-300 mt-2">
              <strong>Reading:</strong> {p.prediction.slice(0, 300)}...
            </p>
            <button
              onClick={() => downloadPDF(p.id)}
              className="mt-4 text-sm text-yellow-400 hover:underline"
            >
              📥 Download Full PDF
            </button>

            {/* Hidden PDF content */}
            <div
              ref={(el) => el && hiddenRefs.current.set(p.id, el)}
              style={{ display: "none" }}
            >
              <div style={{ padding: "20px", fontFamily: "serif" }}>
                <h2 style={{ fontSize: "20px", color: "#222" }}>
                  🔮 JyotAI Reading
                </h2>
                <p><strong>Date:</strong> {new Date(p.createdAt).toLocaleString()}</p>
                <p><strong>Query:</strong> {p.query}</p>
                <hr style={{ margin: "12px 0" }} />
                <p>{p.prediction}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
