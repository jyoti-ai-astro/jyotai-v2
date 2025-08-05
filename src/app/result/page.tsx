"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/ui/loading";
import html2pdf from "html2pdf.js";
import domToImage from "html-to-image";
import { useUser } from "@/lib/hooks/useUser";
import Link from "next/link";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const { user } = useUser();

  useEffect(() => {
    const stored = localStorage.getItem("last_prediction");
    if (stored) {
      setResult(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleDownloadPDF = () => {
    if (!result) return;
    const element = document.getElementById("result-section");
    if (element) {
      html2pdf().from(element).save("JyotAI_Prediction.pdf");
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById("result-section");
    if (!element) return;
    try {
      const dataUrl = await domToImage.toJpeg(element);
      const link = document.createElement("a");
      link.download = "JyotAI_Prediction.jpeg";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image download failed:", err);
    }
  };

  if (loading) return <Loading />;
  if (!result)
    return (
      <div className="text-center text-white mt-10">
        <p>No result found.</p>
        <Link href="/" className="text-celestial-gold underline mt-4 block">
          Back to Portal
        </Link>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">🔮 Your Divine Reading</h1>

      <div id="result-section" className="bg-white/5 p-6 rounded-xl border border-yellow-400 space-y-4">
        <p><strong>Name:</strong> {result.name}</p>
        <p><strong>Date of Birth:</strong> {result.dob}</p>
        <p><strong>Your Question:</strong> {result.query}</p>
        <p><strong>Prediction:</strong> {result.prediction}</p>

        {user?.plan === "premium" && (
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
                  `🔮 JyotAI Reading:\n${result.prediction}\n- ${result.name}`
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

      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={handleDownloadPDF}
          className="bg-purple-600 px-4 py-2 rounded text-white"
        >
          Download PDF
        </button>
        <button
          onClick={handleDownloadImage}
          className="bg-blue-600 px-4 py-2 rounded text-white"
        >
          Download Image
        </button>
      </div>
    </div>
  );
}
