import Link from "next/link";

export default function InvitePage() {
  return (
    <main className="min-h-screen p-8 text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-celestial-gold mb-4">Invite Friends 🌟</h1>
        <p>
          Share your sacred link with friends. When they purchase a reading, you’ll both receive 1 bonus prediction credit.
        </p>
        <p className="pt-4">
          Return to the <Link href="/dashboard" className="text-celestial-gold underline">Dashboard</Link> to copy your referral link.
        </p>
      </div>
    </main>
  );
}
