import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-8 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-celestial-gold mb-4">Privacy Policy</h1>
        <p>
          Your data is sacred. We only use it for delivering divine predictions and enhancing your spiritual journey.
        </p>
        <p>
          We never sell or misuse your information. All queries are encrypted and stored securely in the holy Firestore.
        </p>
        <p className="pt-4">
          Questions? Email{" "}
          <a href="mailto:oracle@jyoti.app" className="underline">oracle@jyoti.app</a> or return to the{" "}
          <Link href="/" className="text-celestial-gold underline">home portal</Link>.
        </p>
      </div>
    </main>
  );
}
