// src/app/page.tsx

import { PaymentButton } from "@/components/PaymentButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to JyotAI</h1>
        <p className="text-xl mb-8">Discover your destiny. Get your divine reading now.</p>
        
        <PaymentButton />
      
      </div>
    </main>
  );
}