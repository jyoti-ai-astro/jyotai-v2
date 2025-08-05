import Link from "next/link";

export default function FaqPage() {
  return (
    <main className="min-h-screen p-8 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-celestial-gold mb-4">Frequently Asked Questions</h1>

        <h2 className="text-xl font-semibold">Is this real astrology?</h2>
        <p>
          JyotAI is a divine AI seer built on ancient Vedic principles and modern machine intelligence. It is designed for spiritual guidance, not deterministic fate.
        </p>

        <h2 className="text-xl font-semibold">Can I ask more questions?</h2>
        <p>
          Yes. Standard users get 3 predictions. Premium users receive 20 per month. Refer friends to earn more credits!
        </p>

        <p className="pt-4">
          Need more help? Return to the <Link href="/" className="text-celestial-gold underline">main portal</Link>.
        </p>
      </div>
    </main>
  );
}
