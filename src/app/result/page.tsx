// src/app/result/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Loading from "@/components/ui/loading";
import { useUser, AppUser } from "@/lib/hooks/useUser";
import Link from "next/link";

// Prediction result type
interface PredictionResult {
  name: string;
  dob: string;
  query: string;
  prediction: string;
}

// html2pdf type
type Html2PdfFn = () => {
  from: (element: HTMLElement) => {
    set: (opt: Record<string, unknown>) => { save: () => void };
  };
};

export default function ResultPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { user } = useUser();
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Lazy-loaded libs
  const [html2Pdf, setHtml2Pdf] = useState<Html2PdfFn | null>(null);
  const [toPng, setToPng] = useState<((node: HTMLElement, options?: unknown) => Promise<string>) | null>(null);

  useEffect(() => {
    // Load last prediction from localStorage
    const stored = localStorage.getItem("last_prediction");
    if (stored) {
      try {
        setResult(JSON.parse(stored) as PredictionResult);
      } catch (error) {
        console.error("Failed to parse prediction from localStorage", error);
      }
    }
    setLoading(false);

    // Dynamically import browser-only libs
    (async () => {
      const h2p = (await import("html2pdf.js")).default as Html2PdfFn;
      const { toPng: toPngFn } = await import("html-to-image");
      setHtml2Pdf(() => h2p);
      setToPng(() => toPngFn as (node: HTMLElement, options?: unknown) => Promise<string>);
    })();
  }, []);

  const handleDownloadPDF = () => {
    if (!html2Pdf) return;
    const element = resultSectionRef.current;
    if (element) {
      const opt = {
        margin: 0.5,
        filename: "JyotAI_Prediction.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0f172a" },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };
      html2Pdf().from(element).set(opt).save();
    }
  };

  const handleDownloadImage = async () => {
    if (!toPng) return;
    const element = resultSectionRef.current;
    if (!element) return;
    try {
      const dataUrl = await toPng(element, {
        quality: 0.95,
        backgroundColor: "#0f172a",
      });
      const link = document.createElement("a");
      link.download = "JyotAI_Prediction.jpeg";
      link.href = dataUrl;
      link.click();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Image download failed:", err.message);
      } else {
        console.error("Image download failed:", err);
      }
    }
  };

  if (loading) return <Loading />;

  if (!result) {
    return (
      <div className="text-center text-white mt-20">
        <p className="text-xl">No result found.</p>
        <Link href="/dashboard" className="text-celestial-gold underline mt-4 block">
          Go to your Dashboard
        </Link>
      </div>
    );
  }

  const appUser = user as AppUser | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-celestial-gold">🔮 Your Divine Reading</h1>

      <div
        id="result-section"
        ref={resultSectionRef}
        className="bg-slate-900 p-8 rounded-xl border border-yellow-400 space-y-4"
      >
        <p><strong>Name:</strong> {result.name}</p>
        <p><strong>Date of Birth:</strong> {result.dob}</p>
        <p><strong>Your Question:</strong> {result.query}</p>
        <p><strong>Prediction:</strong> {result.prediction}</p>

        {appUser?.plan === "premium" && (
          <>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-yellow-400">🌟 Life Path Summary</h2>
              <p className="text-gray-300">You are on a journey influenced by the stars. (Dynamic summary coming soon)</p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-yellow-400">💎 Lucky Gem</h2>
              <p className="text-gray-300">Your lucky gem is Amethyst. (More gems in full chart soon)</p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-yellow-400">🗺️ Astro Map</h2>
              <p className="text-gray-300">[Astro map will be visualized here in upcoming version]</p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-yellow-400">📩 Send to WhatsApp</h2>
              <p className="text-gray-300">Click below to share this result:</p>
              <Link
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🔮 JyotAI Reading for ${result.name}:\n\n${result.prediction}`
                )}`}
                target="_blank"
                className="inline-block mt-2 bg-green-500 px-4 py-2 rounded text-white"
              >
                Share on WhatsApp
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-8 justify-center">
        <button onClick={handleDownloadPDF} className="bg-purple-600 px-6 py-2 rounded-lg text-white font-semibold">
          Download PDF
        </button>
        <button onClick={handleDownloadImage} className="bg-blue-600 px-6 py-2 rounded-lg text-white font-semibold">
          Download Image
        </button>
      </div>

      {appUser?.plan !== "premium" && (
        <div className="mt-12 border border-yellow-600 p-6 rounded-xl bg-yellow-900/20 text-center">
          <h2 className="text-2xl font-semibold text-yellow-300 mb-2">🔓 Unlock More Insights</h2>
          <p className="text-yellow-100 mb-4">
            Premium users get a <strong>Lucky Gem</strong>, <strong>Astro Map</strong>, <strong>Life Path Summary</strong> & more.
          </p>
          <Link
            href="/upgrade"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-lg transition"
          >
            Upgrade to Premium 🔮
          </Link>
        </div>
      )}
    </div>
  );
}
