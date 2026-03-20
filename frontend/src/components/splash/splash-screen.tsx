"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BootSequence } from "./boot-sequence";

export function SplashScreen() {
  const [show, setShow] = useState(true);

  const handleComplete = useCallback(() => {
    setShow(false);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-[#0a0908]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <BootSequence onComplete={handleComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
