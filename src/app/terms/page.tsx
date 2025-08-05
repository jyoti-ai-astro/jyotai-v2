import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen p-8 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-celestial-gold mb-4">Terms of Service</h1>
        <p>
          By using JyotAI, you agree to our sacred mission and all associated
          spiritual protocols. No misuse, misinterpretation, or rebirth
          complaints accepted.
        </p>
        <p>
          This platform is for spiritual guidance only. We make no material
          guarantees. Please use with reverence.
        </p>
        <p className="pt-4">
          For full details, email{" "}
          <a href="mailto:oracle@jyoti.app" className="underline">oracle@jyoti.app</a> or return to the{" "}
          <Link href="/" className="text-celestial-gold underline">main page</Link>.
        </p>
      </div>
    </main>
  );
}
