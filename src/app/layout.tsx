import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import Navbar from "@/components/ui/navbar";

export const metadata: Metadata = {
  title: "JyotAI - Your Divine Celestial Journey",
  description: "Discover your destiny. Get your divine reading now.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Marcellus&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-cosmic-navy text-white min-h-screen">
        <Navbar />
        <div className="min-h-[calc(100vh-56px)]">{children}</div>

        {/* Capture ?ref= for referrals (30 days) */}
        <Script id="capture-referral" strategy="afterInteractive">
          {`
            (function() {
              try {
                const params = new URLSearchParams(window.location.search);
                const ref = params.get('ref');
                if (ref) {
                  document.cookie = 'jyotai_referral=' + ref + '; path=/; max-age=2592000';
                }
              } catch (e) {
                console.error('Referral capture failed:', e);
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
