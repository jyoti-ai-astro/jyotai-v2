// src/components/ShareImageButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ShareImageButton({ predictionId }: { predictionId: string }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/predictions/${predictionId}/share`);
      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // download
      const a = document.createElement("a");
      a.href = url;
      a.download = `jyotai-share-${predictionId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Could not generate image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={loading}>
      {loading ? "Preparing…" : "Share Image"}
    </Button>
  );
}
