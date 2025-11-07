// src/app/qa/smoke/page.tsx
"use client";

import { useState } from "react";

export default function Smoke() {
  const [out, setOut] = useState<string>("");

  const createFake = async () => {
    setOut("Creating fake prediction…");
    const res = await fetch("/api/qa/create-fake-prediction", { method: "POST" });
    const j = await res.json();
    setOut(JSON.stringify(j, null, 2));
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-white">
      <h1 className="text-2xl font-bold mb-4">QA · Smoke Test</h1>
      <ol className="list-decimal ml-5 space-y-2">
        <li>Open <code>/</code>, fill the form, pay (Test mode), receive magic link.</li>
        <li>Click the magic link → you should land on <code>/dashboard</code>.</li>
        <li>Use this page to insert a <em>fake prediction</em> for your account to test the history/UI quickly.</li>
      </ol>
      <button
        className="mt-6 bg-yellow-400 text-black px-4 py-2 rounded"
        onClick={createFake}
      >
        Insert fake prediction
      </button>

      {out && (
        <pre className="mt-4 bg-black/50 p-3 rounded whitespace-pre-wrap text-xs">
          {out}
        </pre>
      )}
    </main>
  );
}
