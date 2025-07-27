"use client";

import { useState } from "react";
import { Invitation } from "@/components/Invitation";
// We will create and import the form component in the next step
// import { OfferingForm } from "@/components/OfferingForm";

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
        // This will be our multi-step form. For now, it's a placeholder.
        <div>
          <p>The Offering Sequence Begins Here...</p>
        </div>
      )}
    </main>
  );
}