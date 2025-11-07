"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ShareWhatsAppButton({
  predictionId,
  question,
  preview,
}: {
  predictionId: string;
  question: string;
  preview: string;
}) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | "ok" | "err">(null);

  const handleShare = async () => {
    try {
      setSending(true);
      setDone(null);

      const res = await fetch(`/api/predictions/${predictionId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Share API failed");
      const data = await res.json();

      const pageUrl: string = data.pageUrl || `${window.location.origin}/predictions/${predictionId}`;
      const imageUrl: string | undefined = data.imageUrl;

      // WhatsApp cannot pre-attach an image; include the image URL in the message text.
      const text =
        `🔮 *JyotAI Reading*\n` +
        `Q: ${question}\n\n` +
        `${preview}\n\n` +
        (imageUrl ? `Card: ${imageUrl}\n` : "") +
        `Full reading: ${pageUrl}`;

      const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(wa, "_blank", "noopener,noreferrer");

      setDone("ok");
    } catch (e) {
      console.error(e);
      setDone("err");
      alert("Could not open WhatsApp. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => setDone(null), 2000);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} disabled={sending}>
      {sending ? "Sharing…" : done === "ok" ? "Shared!" : "Share on WhatsApp"}
    </Button>
  );
}
