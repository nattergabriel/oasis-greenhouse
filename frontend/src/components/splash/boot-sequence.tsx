"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const CHECKS = [
  "LIFE SUPPORT",
  "ATMOSPHERIC CONTROL",
  "HYDROPONIC ARRAY",
  "AI AGENT CORE",
  "SYNGENTA BIOLINK",
];

// Steps 1-9: terminal, step 10: title reveal, step 11: trigger fade-out
const TIMINGS = [100, 400, 600, 850, 1100, 1350, 1600, 1850, 2200, 2800, 4800];

export function BootSequence({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = TIMINGS.map((ms, i) =>
      setTimeout(() => setStep(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const showTitle = step >= 10;

  useEffect(() => {
    if (step >= 11) onComplete?.();
  }, [step, onComplete]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* CRT power-on flash */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-white"
        initial={{ opacity: 0.12 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Scan line */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4924a]/15 to-transparent"
        animate={{ y: [0, 1200] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Terminal phase */}
      <motion.div
        className="w-full max-w-lg px-8 font-mono text-sm"
        animate={
          showTitle
            ? { opacity: 0, filter: "blur(10px)", scale: 0.95 }
            : { opacity: 1, filter: "blur(0px)", scale: 1 }
        }
        transition={{ duration: 0.5 }}
      >
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-1 text-[#d4924a]"
          >
            OASIS ON MARS — GREENHOUSE MGMT v2.1.0
          </motion.div>
        )}
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 text-[#6b6560]"
          >
            INITIALIZING SYSTEMS...
          </motion.div>
        )}
        {step >= 3 && <div className="mb-4 border-t border-[#352f28]" />}

        <div className="space-y-2">
          {CHECKS.map((label, i) =>
            step >= i + 4 ? (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-3"
              >
                <span className="shrink-0 text-xs font-bold text-[#4ead6b]">
                  [ OK ]
                </span>
                <span className="shrink-0 text-[#9c9488]">{label}</span>
                <span className="min-w-0 flex-1 overflow-hidden text-xs leading-none tracking-[3px] text-[#2e2b27]">
                  {"·".repeat(30)}
                </span>
                <span className="shrink-0 text-[#4ead6b]">ONLINE</span>
              </motion.div>
            ) : null
          )}
        </div>

        {step >= 9 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 flex items-center gap-2 text-[#4ead6b]"
          >
            <span className="text-[#d4924a]">&gt;</span>
            ALL SYSTEMS NOMINAL
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              _
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {/* Title phase */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 1.08, y: 8 }}
        animate={
          showTitle
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 1.08, y: 8 }
        }
        transition={{ duration: 0.7, delay: showTitle ? 0.3 : 0 }}
      >
        <h1
          className="text-5xl font-bold tracking-wider text-[#d4924a] sm:text-6xl"
          style={{ textShadow: "0 0 60px rgba(212, 146, 74, 0.25)" }}
        >
          Oasis on Mars
        </h1>
        <div className="my-4 h-[2px] w-64 bg-gradient-to-r from-transparent via-[#d4924a]/50 to-transparent" />
        <p className="text-xl tracking-[0.35em] text-[#9c9488] sm:text-2xl">
          GREENHOUSE MANAGEMENT
        </p>
      </motion.div>
    </div>
  );
}
