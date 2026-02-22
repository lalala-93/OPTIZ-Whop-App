"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  xpEarned: number;
}

// Particle positions for celebration effect
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: (i / 8) * 360,
  delay: i * 0.05,
}));

export function SuccessAnimation({
  isVisible,
  onComplete,
  xpEarned,
}: SuccessAnimationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Expanding ring effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute w-28 h-28 rounded-full border-2 border-[var(--optiz-red)]"
            />

            {/* Particles */}
            {PARTICLES.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              return (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(rad) * 80,
                    y: Math.sin(rad) * 80,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + p.delay,
                    ease: "easeOut",
                  }}
                  className="absolute w-2 h-2 rounded-full optiz-gradient-bg"
                />
              );
            })}

            {/* Fire icon */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{
                scale: [0.3, 1.15, 1],
                opacity: 1,
              }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 250,
                damping: 18,
              }}
              className="w-28 h-28 optiz-gradient-bg rounded-full flex items-center justify-center text-5xl shadow-[var(--optiz-glow-strong)] border-2 border-white/15"
            >
              🔥
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-5 text-center"
            >
              <h2 className="text-2xl font-black text-gray-12 tracking-wide uppercase">
                Great Job!
              </h2>
              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
                className="text-xl font-bold optiz-gradient-text mt-1.5 tabular-nums"
              >
                +{xpEarned} XP
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
