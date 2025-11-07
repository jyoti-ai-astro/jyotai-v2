"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url?: string }) {
  const [copied, setCopied] = useState(false);
  const href = url || (typeof window !== "undefined" ? window.location.href : "");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-sm border border-white/20 rounded px-3 py-1.5 hover:bg-white/10"
      title="Copy link"
    >
      {copied ? "✓ Copied" : "Copy Link"}
    </button>
  );
}
