"use client";

import { motion, AnimatePresence } from "framer-motion";

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const FEATURES = [
  { emoji: "♾️", title: "Unlimited Avatars", desc: "Track more than 2 sports at once" },
  { emoji: "📊", title: "Advanced Analytics", desc: "Deep dive into your performance" },
  { emoji: "👑", title: "Pro Badge", desc: "Stand out on the leaderboard" },
];

export function UpsellModal({ isOpen, onClose, onUpgrade }: UpsellModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm bg-gray-2 border border-[var(--optiz-border)] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Icon + Title */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-[#E80000]/10 border border-[#E80000]/20 flex items-center justify-center text-2xl mx-auto mb-3">
                  🚀
                </div>
                <h2 className="text-lg font-bold text-gray-12">
                  LevelUp Pro
                </h2>
                <p className="text-sm text-gray-9 mt-1">
                  Unleash your full potential.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-5">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--optiz-surface)] border border-[var(--optiz-border)]"
                  >
                    <span className="text-lg shrink-0">{f.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-12">{f.title}</p>
                      <p className="text-xs text-gray-9">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={onUpgrade}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#E80000] hover:bg-[#FF2D2D] active:scale-[0.98] transition-all shadow-sm hover:shadow-[0_0_20px_rgba(232,0,0,0.2)]"
              >
                Unlock Pro — $9.99/mo
              </button>

              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-xs font-medium text-gray-9 hover:text-gray-11 transition-colors"
              >
                No thanks
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
