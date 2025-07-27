"use client";

import { motion } from "framer-motion";

// This is a "prop" that will allow us to tell the main page when the user clicks the button.
interface InvitationProps {
  onBegin: () => void;
}

export function Invitation({ onBegin }: InvitationProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-4xl sm:text-5xl md:text-6xl text-starlight-white mb-6"
        style={{ fontFamily: "'Marcellus', serif" }}
      >
        The cosmos holds a message for you.
      </motion.h1>
      
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px #FFD700" }}
        whileTap={{ scale: 0.95 }}
        onClick={onBegin}
        className="bg-celestial-gold text-cosmic-navy font-bold py-4 px-10 rounded-lg text-xl shadow-lg"
        style={{ color: '#0d1117', backgroundColor: '#FFD700' }}
      >
        Begin Your Journey
      </motion.button>
    </div>
  );
}