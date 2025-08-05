import Link from "next/link";

export default function RefundPage() {
  return (
    <main className="min-h-screen p-8 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-celestial-gold mb-4">Refund Policy</h1>
        <p>
          As these are spiritual services, once your reading is delivered, no refunds shall be entertained.
        </p>
        <p>
          If you faced a technical issue, please email us within 24 hours of the reading.
        </p>
        <p>Email: <a href="mailto:oracle@jyoti.app" className="underline">oracle@jyoti.app</a></p>
        <p className="pt-4">
          Or <Link href="/" className="underline text-celestial-gold">return to the homepage</Link> and try again.
        </p>
      </div>
    </main>
  );
}
