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
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed top-[84px] left-1/2 -translate-x-1/2 z-40 w-[min(92vw,420px)]"
        >
          <div className="rounded-2xl border border-gray-5/45 bg-gray-2/95 backdrop-blur-2xl px-3.5 py-2.5 shadow-[0_12px_42px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-12 truncate">{toast.title}</p>
                {toast.subtitle ? <p className="text-[11px] text-gray-8 truncate">{toast.subtitle}</p> : null}
              </div>

              <span className="shrink-0 text-[12px] font-semibold px-2 py-1 rounded-full border border-[#E80000]/35 bg-[#E80000]/14 text-[#FF7373]">
                +{toast.xp} XP
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
