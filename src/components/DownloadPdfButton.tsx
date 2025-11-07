// src/components/DownloadPdfButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DownloadPdfButtonProps {
  predictionId: string;
}

export default function DownloadPdfButton({ predictionId }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/predictions/${predictionId}/pdf`);
      if (!res.ok) throw new Error("Failed to fetch PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prediction-${predictionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? "Preparing..." : "Download PDF"}
    </Button>
  );
}
