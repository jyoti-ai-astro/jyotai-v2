import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen p-8 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-celestial-gold mb-4">Contact Us</h1>
        <p>
          If you have any questions, doubts, or revelations, please reach out to us.
        </p>
        <p>Email: <a href="mailto:oracle@jyoti.app" className="underline">oracle@jyoti.app</a></p>
        <p className="pt-4">
          You can also return to the <Link href="/" className="underline text-celestial-gold">main portal</Link> anytime.
        </p>
      </div>
    </main>
  );
}
