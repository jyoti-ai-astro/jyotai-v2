"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaymentButton } from "./PaymentButton";
// --- THIS IS OUR UPGRADE: We import the new calendar component and its styles ---
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
// --- END OF UPGRADE ---

type FormStep = "NAME" | "DOB" | "QUERY" | "REFLECTION" | "CONVERGENCE";

export function OfferingForm() {
  const [step, setStep] = useState<FormStep>("NAME");

  const [userData, setUserData] = useState({
    name: "",
    // --- THIS IS OUR UPGRADE: We now use a proper Date object for better control ---
    dob: new Date(),
    // --- END OF UPGRADE ---
    query: "",
  });

  const nextStep = () => {
    switch (step) {
      case "NAME":
        if (!userData.name) return alert("Please enter your name.");
        setStep("DOB");
        break;
      case "DOB":
        setStep("QUERY");
        break;
      case "QUERY":
        if (!userData.query) return alert("Enter your divine question.");
        setStep("REFLECTION");
        break;
      case "REFLECTION":
        setStep("CONVERGENCE");
        break;
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <AnimatePresence mode="wait">
        {/* The NAME step remains the same */}
        {step === "NAME" && (
          <motion.div key="name" {...cardVariants} className="space-y-6">
            <h2 className="text-3xl text-white" style={{ fontFamily: "'Marcellus', serif" }}>
              Let the cosmos know your name.
            </h2>
            <input
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              placeholder="Your Name"
            />
            <button
              onClick={nextStep}
              className="w-full font-bold py-3 px-8 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
            >
              Next →
            </button>
          </motion.div>
        )}

        {/* --- THIS IS OUR UPGRADE: We replace the ugly input with our beautiful calendar --- */}
        {step === "DOB" && (
          <motion.div key="dob" {...cardVariants} className="space-y-6 flex flex-col items-center">
            <h2 className="text-3xl text-white text-center mb-4" style={{ fontFamily: "'Marcellus', serif" }}>
              When were you born into this universe?
            </h2>
            <DayPicker
              mode="single"
              selected={userData.dob}
              onSelect={(day) => setUserData({ ...userData, dob: day || new Date() })}
              captionLayout="dropdown-buttons"
              fromYear={1920}
              toYear={new Date().getFullYear()}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-white"
            />
            <button
              onClick={nextStep}
              className="w-full font-bold py-3 px-8 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition mt-4"
            >
              Next →
            </button>
          </motion.div>
        )}
        {/* --- END OF UPGRADE --- */}

        {/* The remaining steps are the same for now */}
        {step === "QUERY" && (
          <motion.div key="query" {...cardVariants} className="space-y-6">
            <h2 className="text-3xl text-white" style={{ fontFamily: "'Marcellus', serif" }}>
              What divine insight do you seek?
            </h2>
            <textarea
              value={userData.query}
              onChange={(e) => setUserData({ ...userData, query: e.target.value })}
              rows={4}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              placeholder="E.g. When will I find true love?"
            />
            <button
              onClick={nextStep}
              className="w-full font-bold py-3 px-8 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
            >
              Next →
            </button>
          </motion.div>
        )}
        {step === "REFLECTION" && (
          <motion.div key="reflection" {...cardVariants} className="space-y-6 text-center">
            <h2 className="text-3xl text-white" style={{ fontFamily: "'Marcellus', serif" }}>
              The cosmos acknowledges your request.
            </h2>
            <p className="text-gray-300">
              Your offering has been recorded in the astral library.
            </p>
            <button
              onClick={nextStep}
              className="w-full font-bold py-3 px-8 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
            >
              Proceed to Offering →
            </button>
          </motion.div>
        )}
        {step === "CONVERGENCE" && (
          <motion.div key="convergence" {...cardVariants} className="space-y-6 text-center">
            <h2 className="text-3xl text-white" style={{ fontFamily: "'Marcellus', serif" }}>
              Make your offering to unlock divine wisdom.
            </h2>
            {/* We will upgrade this PaymentButton later to pass all the new user data */}
            <PaymentButton />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
