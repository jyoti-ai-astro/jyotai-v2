import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-white text-sm text-center p-4">
      <p>
        Built with 💛 by the BrahminGPT team.{" "}
        <Link href="/terms" className="underline text-celestial-gold">Terms</Link> |{" "}
        <Link href="/privacy" className="underline text-celestial-gold">Privacy</Link>
      </p>
    </footer>
  );
}
