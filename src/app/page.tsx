// src/app/page.tsx
"use client";

import { useState } from "react";
import { Invitation } from "@/components/Invitation";
import { OfferingForm } from "@/components/OfferingForm";

type JourneyState = "INVITATION" | "OFFERING" | "DIVINATION" | "REVELATION";

export default function Home() {
  const [journeyState, setJourneyState] = useState<JourneyState>("INVITATION");

  const beginOffering = () => {
    setJourneyState("OFFERING");

    // Smooth scroll the user to the form section on mobile – feels app-like
    if (typeof window !== "undefined") {
      const el = document.getElementById("offering-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <main className="w-full flex flex-col bg-cosmic-navy text-white">
      {/* HERO / INVITATION SECTION */}
      <section className="flex min-h-[calc(100vh-56px)] w-full flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full space-y-8 text-center">
          {/* Cosmic halo behind content */}
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
            <div className="mx-auto mt-32 h-72 w-72 rounded-full bg-gradient-to-tr from-purple-500/30 via-yellow-400/10 to-emerald-400/30 blur-3xl" />
          </div>

          {/* Main invitation (your existing component) */}
          <div className="relative mx-auto max-w-2xl">
            <Invitation onBegin={beginOffering} />
          </div>

          {/* Quick value props under the main CTA */}
          <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-white/70 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="font-semibold text-white">Vedic + AI precision</p>
              <p>Ancient jyotish, enhanced by modern intelligence.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="font-semibold text-white">Private & secure</p>
              <p>Your birth details are encrypted and never sold.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="font-semibold text-white">Actionable guidance</p>
              <p>Clear remedies, time windows, and do/don&apos;t lists.</p>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="mt-8 flex flex-col items-center justify-center text-xs uppercase tracking-[0.2em] text-white/50">
            <span>Scroll to see how JyotAI works</span>
            <span className="mt-1 animate-bounce text-lg">⌄</span>
          </div>
        </div>
      </section>

      {/* STEP FLOW / OFFERING SECTION */}
      <section
        id="offering-section"
        className="w-full border-t border-white/10 bg-gradient-to-b from-black/40 via-zinc-950 to-black px-4 py-12"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:items-start">
          {/* Explanation column */}
          <div className="md:w-2/5 space-y-4">
            <h2 className="text-left text-2xl font-semibold md:text-3xl">
              Your sacred details, captured with care.
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              JyotAI asks for only what is astrologically essential: your birth
              details, key life areas, and current concerns. This becomes the
              &quot;offering&quot; from which your reading is divined.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/65">
              <li>• Guided, step-by-step form – no confusion.</li>
              <li>• Checks for impossible dates/locations.</li>
              <li>• You stay in full control of what you share.</li>
            </ul>
          </div>

          {/* Form column */}
          <div className="md:w-3/5">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur">
              {journeyState === "OFFERING" ? (
                <OfferingForm />
              ) : (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center space-y-4 text-center text-sm text-white/70">
                  <p>
                    When you tap <span className="font-semibold">Begin Your Journey</span>{" "}
                    above, your personal intake form will appear here.
                  </p>
                  <p className="text-xs text-white/50">
                    No random chat. No generic horoscope. A ritual-like flow
                    designed for depth.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="w-full border-t border-white/10 bg-cosmic-navy px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            How JyotAI works in 3 steps
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-sm backdrop-blur">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-yellow-300/80">
                Step 1
              </p>
              <h3 className="mb-2 text-lg font-semibold">
                Offer your details
              </h3>
              <p className="text-white/70">
                Share your birth chart details and the area of life you want
                clarity on – career, love, money, spiritual path.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-sm backdrop-blur">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-yellow-300/80">
                Step 2
              </p>
              <h3 className="mb-2 text-lg font-semibold">
                JyotAI performs the reading
              </h3>
              <p className="text-white/70">
                Our engine combines classical Vedic rules, dasha periods,
                transits and your current prashna to generate a layered reading.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-sm backdrop-blur">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-yellow-300/80">
                Step 3
              </p>
              <h3 className="mb-2 text-lg font-semibold">
                Receive a clear action-plan
              </h3>
              <p className="text-white/70">
                Get timelines, risk windows, and specific remedies – not vague
                one-liners. Save each reading into your personal vault.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="w-full border-t border-white/10 bg-black px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            Built for people who are tired of vague horoscopes.
          </h2>

          <div className="grid gap-6 md:grid-cols-2 text-sm">
            <div className="rounded-2xl border border-red-400/40 bg-red-950/40 p-5">
              <h3 className="mb-3 text-lg font-semibold">
                Typical astrology apps
              </h3>
              <ul className="space-y-2 text-white/70">
                <li>• Random daily messages with no context.</li>
                <li>• Same text sent to thousands of people.</li>
                <li>• Hidden upsells, call-center style readings.</li>
                <li>• Little transparency about methods or data.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/40 p-5">
              <h3 className="mb-3 text-lg font-semibold">JyotAI approach</h3>
              <ul className="space-y-2 text-white/70">
                <li>• Chart-based readings, not generic zodiac blurbs.</li>
                <li>• Transparent logic grounded in Vedic principles.</li>
                <li>• AI used only to deepen interpretation, not replace it.</li>
                <li>• Designed with Indian users, timelines and realities.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / CTA SECTION */}
      <section className="w-full border-t border-white/10 bg-gradient-to-b from-black via-cosmic-navy to-black px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Start with one powerful question.
          </h2>
          <p className="text-sm text-white/70">
            Your first reading sets the foundation. You can then unlock deeper
            prediction modes, long-term planning and wealth/relationship tracks.
          </p>

          <div className="mx-auto max-w-md rounded-2xl border border-yellow-400/60 bg-black/70 p-6 text-left shadow-2xl backdrop-blur">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-300/80">
                  Launch Offer
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Single Deep-Dive Reading
                </h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-yellow-300">₹XXX</p>
                <p className="text-xs text-white/60 line-through">₹YYY</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• One focused question or area of life.</li>
              <li>• Detailed reading + remedies inside JyotAI.</li>
              <li>• Saved permanently in your account.</li>
            </ul>
            <p className="mt-4 text-xs text-white/50">
              * Actual pricing will reflect your chosen plan. Integrates with
              Razorpay + magic-link login.
            </p>
          </div>

          <div className="mt-6 text-sm text-white/60">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-yellow-300 underline-offset-4 hover:underline"
            >
              Log in to your vault
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black px-4 py-6 text-xs text-white/50">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <p>© {new Date().getFullYear()} JyotAI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#offering-section" className="hover:text-yellow-300">
              Get a reading
            </a>
            <a href="/admin" className="hover:text-yellow-300">
              Admin
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
