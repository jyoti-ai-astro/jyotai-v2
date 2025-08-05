import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "JyotAI - Your Divine Celestial Journey",
  description: "Discover your destiny. Get your divine reading now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Script id="capture-referral" strategy="afterInteractive">
          {`
            (function() {
              try {
                const params = new URLSearchParams(window.location.search);
                const ref = params.get('ref');
                if (ref) {
                  document.cookie = 'jyotai_referral=' + ref + '; path=/; max-age=2592000'; // 30 days
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
