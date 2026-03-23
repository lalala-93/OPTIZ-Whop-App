"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface XPToastData {
  id: string;
  title: string;
  subtitle?: string;
  xp: number;
}

interface XPToastProps {
  toast: XPToastData | null;
}

export function XPToast({ toast }: XPToastProps) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+24px)] left-1/2 -translate-x-1/2 z-40 w-[min(88vw,380px)]"
        >
          <div className="rounded-2xl border border-[#E80000]/25 bg-gray-2/95 backdrop-blur-xl px-4 py-3 shadow-[0_8px_32px_rgba(232,0,0,0.12),0_16px_48px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3">
              {/* XP icon */}
              <div className="w-9 h-9 rounded-xl bg-[#E80000]/12 border border-[#E80000]/20 flex items-center justify-center shrink-0">
                <motion.svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6D6D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </motion.svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-12 truncate">{toast.title}</p>
                {toast.subtitle ? <p className="text-[11px] text-gray-8 truncate">{toast.subtitle}</p> : null}
              </div>

              <motion.span
                className="shrink-0 text-[14px] font-bold tabular-nums text-[#FF6D6D]"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.15 }}
              >
                +{toast.xp} XP
              </motion.span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
