"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaymentButton } from "./PaymentButton";

type FormStep = "NAME" | "DOB" | "QUERY" | "REFLECTION" | "CONVERGENCE";

export function OfferingForm() {
  const [step, setStep] = useState<FormStep>("NAME");

  const [userData, setUserData] = useState({
    name: "",
    dob: "",
    query: "",
  });

  const nextStep = () => {
    switch (step) {
      case "NAME":
        if (!userData.name) return alert("Please enter your name.");
        setStep("DOB");
        break;
      case "DOB":
        if (!userData.dob) return alert("Enter your date of birth.");
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

        {step === "DOB" && (
          <motion.div key="dob" {...cardVariants} className="space-y-6">
            <h2 className="text-3xl text-white" style={{ fontFamily: "'Marcellus', serif" }}>
              When were you born into this universe?
            </h2>
            <input
              type="date"
              value={userData.dob}
              onChange={(e) => setUserData({ ...userData, dob: e.target.value })}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
            <button
              onClick={nextStep}
              className="w-full font-bold py-3 px-8 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
            >
              Next →
            </button>
          </motion.div>
        )}

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
              Your name, birth time, and question have been recorded in the astral library.
              A divine reading shall be prepared...
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
            {/* Payment button leads to prediction & AI logic */}
            <PaymentButton />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
