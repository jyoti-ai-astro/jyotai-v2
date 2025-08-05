"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="text-white p-4 flex justify-between">
      <Link href="/" className="font-bold text-lg">JyotAI</Link>
      <div className="space-x-4">
        <Link href="/" className={pathname === "/" ? "underline" : ""}>Home</Link>
        <Link href="/login" className={pathname === "/login" ? "underline" : ""}>Login</Link>
        <Link href="/dashboard" className={pathname === "/dashboard" ? "underline" : ""}>Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
