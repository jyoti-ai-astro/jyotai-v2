import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}