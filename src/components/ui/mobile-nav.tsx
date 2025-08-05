"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button onClick={() => setOpen(!open)} className="text-white text-xl">
        ☰
      </button>
      {open && (
        <div className="mt-2 p-4 bg-gray-900 rounded">
          <ul className="space-y-3 text-white">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/login">Login</Link></li>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
      )}
    </div>
  );
}
