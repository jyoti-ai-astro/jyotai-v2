"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import { useUser } from "@/lib/hooks/useUser";

export default function PredictionForm() {
  const { user } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/on-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dob,
          query,
          email: user?.email,
          userId: user?.uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      localStorage.setItem("last_prediction", JSON.stringify(data));
      router.push("/result");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto text-white space-y-6">
      {error && <p className="text-red-400">{error}</p>}

      <div>
        <label className="block mb-1 text-sm">Your Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 rounded bg-white/10 text-white border border-white/20"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-1 text-sm">Date of Birth</label>
        <input
          type="date"
          className="w-full px-3 py-2 rounded bg-white/10 text-white border border-white/20"
          value={dob}
          required
          onChange={(e) => setDob(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-1 text-sm">What do you want to ask?</label>
        <textarea
          className="w-full px-3 py-2 rounded bg-white/10 text-white border border-white/20"
          rows={4}
          value={query}
          required
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="bg-celestial-gold text-black px-6 py-2 rounded font-semibold hover:bg-yellow-500"
      >
        🔮 Reveal My Reading
      </button>
    </form>
  );
}
