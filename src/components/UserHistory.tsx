"use client";

import { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import html2pdf from "html2pdf.js";
import { toPng } from "html-to-image";

interface Prediction {
  id: string;
  query: string;
  prediction: string;
  createdAt: string;
}

export default function UserHistory() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const hiddenPDFRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
    const element = hiddenPDFRefs.current.get(id);
    if (!element) return;

    html2pdf().from(element).set({
      margin: 0.5,
      filename: `jyotai-reading-${id}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }).save();
  };

  const downloadImage = async (id: string) => {
    const element = imageRefs.current.get(id);
    if (!element) return;

    try {
      const dataUrl = await toPng(element);
      const link = document.createElement("a");
      link.download = `jyotai-image-${id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("❌ Image generation failed:", error);
    }
  };

  if (loading) return <p className="text-center text-sm text-muted">Loading divine records...</p>;

  return (
    <div className="space-y-6">
      {predictions.length === 0 ? (
        <p className="text-center text-muted">No past predictions found.</p>
      ) : (
        predictions.map((p) => (
          <div key={p.id} className="border border-yellow-500 bg-white/5 p-4 rounded-xl shadow relative">
            <div
              ref={(el) => {
                if (el) imageRefs.current.set(p.id, el);
              }}
              className="bg-gradient-to-br from-black to-gray-800 text-white p-4 rounded-lg"
            >
              <p className="text-yellow-300 text-sm font-semibold">
                {new Date(p.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-lg font-bold">🪄 {p.query}</p>
              <p className="text-sm mt-2">{p.prediction.slice(0, 280)}...</p>
              <p className="mt-4 text-right text-xs text-yellow-400">✨ JyotAI</p>
            </div>

            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => downloadPDF(p.id)}
                className="text-sm text-yellow-400 hover:underline"
              >
                📥 Download PDF
              </button>

              <button
                onClick={() => downloadImage(p.id)}
                className="text-sm text-cyan-300 hover:underline"
              >
                📸 Save as Image
              </button>
            </div>

            {/* Hidden full content for PDF only */}
            <div
              ref={(el) => {
                if (el) hiddenPDFRefs.current.set(p.id, el);
              }}
              style={{ display: "none" }}
            >
              <div style={{ padding: "20px", fontFamily: "serif" }}>
                <h2 style={{ fontSize: "20px", color: "#222" }}>🔮 JyotAI Reading</h2>
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
