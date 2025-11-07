"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/lib/hooks/useUser";

export default function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = async () => {
    try {
      setBusy(true);
      await fetch("/api/auth/login/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="w-full border-b border-white/10 bg-black/30 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-white" aria-label="Main navigation">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg text-celestial-gold" aria-label="JyotAI Home">
            JyotAI
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm hover:text-celestial-gold transition">
              Dashboard
            </Link>
            <Link href="/dashboard/predictions" className="text-sm hover:text-celestial-gold transition">
              My Predictions
            </Link>
            {user?.isAdmin && (
              <Link href="/admin" className="text-sm hover:text-celestial-gold transition">
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <span className="text-xs text-gray-300" aria-live="polite">Loading…</span>
            ) : user ? (
              <>
                <span className="text-xs text-gray-300" aria-label={`Logged in as ${user.email}`}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  disabled={busy}
                  className="text-sm bg-yellow-400 text-black px-3 py-1.5 rounded hover:bg-yellow-300 disabled:opacity-60 transition"
                  aria-label="Logout"
                >
                  {busy ? "…" : "Logout"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-yellow-400 text-black px-3 py-1.5 rounded hover:bg-yellow-300 transition"
                aria-label="Login"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="text-sm hover:text-celestial-gold transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/predictions"
              className="text-sm hover:text-celestial-gold transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Predictions
            </Link>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="text-sm hover:text-celestial-gold transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            {user ? (
              <>
                <div className="text-xs text-gray-300 py-2 border-t border-white/10 mt-2">
                  {user.email}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  disabled={busy}
                  className="text-sm bg-yellow-400 text-black px-3 py-1.5 rounded hover:bg-yellow-300 disabled:opacity-60 transition text-left"
                >
                  {busy ? "…" : "Logout"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-yellow-400 text-black px-3 py-1.5 rounded hover:bg-yellow-300 transition text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
