// src/app/admin/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import AdminUsersTable from "@/components/admin/AdminUsersTable";

export const runtime = "nodejs";
export const revalidate = 0;

type UserRow = {
  uid: string;
  email: string;
  name?: string;
  plan: "standard" | "premium";
  credits: number;
  createdAt?: string;
  upgradedAt?: string;
  premiumUntil?: string;
};

export default async function AdminDashboard() {
  // Auth gate
  const session = cookies().get("session")?.value;
  if (!session) return notAllowed();
  const decoded = await adminAuth.verifySessionCookie(session, true);
  if (decoded.isAdmin !== true) return notAllowed();

  // Load users (cap to 500)
  const snap = await adminDb.collection("users").orderBy("createdAt", "desc").limit(500).get();
  const users: UserRow[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      uid: d.id,
      email: String(data.email || ""),
      name: data.name || "",
      plan: (data.plan as "standard" | "premium") || "standard",
      credits: Number(data.credits ?? 0),
      createdAt: data.createdAt,
      upgradedAt: data.upgradedAt,
      premiumUntil: data.premiumUntil,
    };
  });

  const totalUsers = users.length;
  const totalPredictions = await countPredictions(users.map((u) => u.uid));
  const premiumUsers = users.filter((u) => u.plan === "premium").length;
  const creditsOutstanding = users.reduce((s, u) => s + (u.credits || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-white">
      <h1 className="text-4xl font-bold mb-6 text-yellow-400">JyotAI Command Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={String(totalUsers)} />
        <StatCard label="Premium Users" value={String(premiumUsers)} />
        <StatCard label="Predictions Delivered" value={String(totalPredictions)} />
        <StatCard label="Credits Outstanding" value={String(creditsOutstanding)} />
      </div>

      <AdminUsersTable initialUsers={users} />

      <div className="mt-8">
        <Link href="/" className="text-celestial-gold underline">← Back to app</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

async function countPredictions(uids: string[]) {
  let total = 0;
  await Promise.all(
    uids.map(async (uid) => {
      const snap = await adminDb.collection("users").doc(uid).collection("predictions").get();
      total += snap.size;
    })
  );
  return total;
}

function notAllowed() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-white">
      <h1 className="text-2xl font-semibold mb-2">Not allowed</h1>
      <p>You need admin privileges.</p>
      <p className="mt-4">
        <Link href="/login" className="text-yellow-300 underline">Get magic link</Link>
      </p>
    </main>
  );
}
