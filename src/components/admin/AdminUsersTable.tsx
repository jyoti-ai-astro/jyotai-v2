// src/components/admin/AdminUsersTable.tsx
"use client";

import { useMemo, useState } from "react";

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

export default function AdminUsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [rows, setRows] = useState<UserRow[]>(initialUsers);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<"all" | "standard" | "premium">("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (plan !== "all" && r.plan !== plan) return false;
      if (!term) return true;
      return (
        r.email.toLowerCase().includes(term) ||
        (r.name || "").toLowerCase().includes(term) ||
        r.plan.includes(term)
      );
    });
  }, [rows, q, plan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateRow = (uid: string, patch: Partial<UserRow>) =>
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));

  const setPlanOnServer = async (uid: string, newPlan: "standard" | "premium") => {
    setBusy(uid);
    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to set plan");
      updateRow(uid, { plan: newPlan });
    } catch (e: any) {
      alert(e?.message || "Failed to update plan");
    } finally {
      setBusy(null);
    }
  };

  const addCredits = async (uid: string, amount: number) => {
    setBusy(uid);
    try {
      const res = await fetch("/api/admin/add-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to add credits");
      updateRow(uid, { credits: (rows.find((r) => r.uid === uid)?.credits || 0) + amount });
    } catch (e: any) {
      alert(e?.message || "Failed to add credits");
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => {
    const headers = ["uid", "email", "name", "plan", "credits", "createdAt", "upgradedAt", "premiumUntil"];
    const lines = filtered.map((u) =>
      [
        u.uid,
        u.email,
        u.name || "",
        u.plan,
        String(u.credits ?? 0),
        u.createdAt || "",
        u.upgradedAt || "",
        u.premiumUntil || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jyotai-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search email / name / plan…"
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-72"
        />
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value as any);
            setPage(1);
          }}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
        >
          <option value="all">All plans</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
        <button onClick={exportCsv} className="px-3 py-2 rounded bg-yellow-500 text-black text-sm">
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Plan</Th>
              <Th>Credits</Th>
              <Th>Created</Th>
              <Th>Premium Until</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {slice.map((u) => (
              <tr key={u.uid} className="bg-gray-900/40 hover:bg-gray-900/60">
                <Td className="font-mono">{u.email}</Td>
                <Td>{u.name || "—"}</Td>
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      u.plan === "premium"
                        ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                        : "bg-yellow-900/30 text-yellow-300 border border-yellow-700"
                    }`}
                  >
                    {u.plan}
                  </span>
                </Td>
                <Td>{u.credits ?? 0}</Td>
                <Td>{fmt(u.createdAt)}</Td>
                <Td>{fmt(u.premiumUntil)}</Td>
                <Td className="text-right space-x-2">
                  <Action
                    label="Promote"
                    onClick={() => setPlanOnServer(u.uid, "premium")}
                    disabled={busy === u.uid || u.plan === "premium"}
                  />
                  <Action
                    label="Downgrade"
                    variant="secondary"
                    onClick={() => setPlanOnServer(u.uid, "standard")}
                    disabled={busy === u.uid || u.plan === "standard"}
                  />
                  <Action
                    label="+5 credits"
                    variant="ghost"
                    onClick={() => addCredits(u.uid, 5)}
                    disabled={busy === u.uid}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {slice.length === 0 && (
        <p className="text-gray-400 text-sm mt-3">No users match your filters.</p>
      )}

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <div className="text-sm text-gray-300">
          Page {page} / {totalPages} · {filtered.length} users
        </div>
        <button
          className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={`px-3 py-2 text-left ${props.className || ""}`} />;
}
function Td(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={`px-3 py-3 align-top ${props.className || ""}`} />;
}
function Action({
  label,
  onClick,
  disabled,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const classes =
    variant === "primary"
      ? "bg-yellow-500 text-black hover:bg-yellow-400"
      : variant === "secondary"
      ? "bg-gray-700 hover:bg-gray-600"
      : "bg-transparent border border-gray-700 hover:bg-gray-800";
  return (
    <button disabled={disabled} onClick={onClick} className={`px-3 py-1 rounded text-xs ${classes} disabled:opacity-50`}>
      {label}
    </button>
  );
}
function fmt(d?: string) {
  if (!d) return "—";
  const n = Date.parse(d);
  if (Number.isNaN(n)) return d;
  return new Date(n).toLocaleString();
}
