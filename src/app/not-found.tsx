import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-white text-center">
      <h1 className="text-4xl font-bold mb-4">🌘 Lost in the Cosmos</h1>
      <p className="mb-4">This page doesn’t exist in this realm.</p>
      <Link href="/" className="text-celestial-gold underline">Return to your path</Link>
    </main>
  );
}
