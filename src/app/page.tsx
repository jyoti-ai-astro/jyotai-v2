"use client";

import { useState } from "react";
import { Invitation } from "@/components/Invitation";
import { OfferingForm } from "@/components/OfferingForm"; // This line is the crucial fix

// This defines the "states" of our journey
type JourneyState = "INVITATION" | "OFFERING" | "DIVINATION" | "REVELATION";

export default function Home() {
  const [journeyState, setJourneyState] = useState<JourneyState>("INVITATION");

  const beginOffering = () => {
    setJourneyState("OFFERING");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {journeyState === "INVITATION" && (
        <Invitation onBegin={beginOffering} />
      )}
      
      {journeyState === "OFFERING" && (
        // We are now rendering our beautiful, animated form, not the old placeholder
        <OfferingForm />
      )}
    </main>
  );
}