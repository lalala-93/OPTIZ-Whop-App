"use client";

import { useEffect, useState } from "react";

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [toast?.id]);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,400px)] transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="rounded-xl bg-[#E80000] px-4 py-2.5 shadow-[0_4px_20px_rgba(232,0,0,0.3)]">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{toast.title}</p>
            {toast.subtitle ? <p className="text-[11px] text-white/70 truncate">{toast.subtitle}</p> : null}
          </div>
          <span className="shrink-0 text-[15px] font-bold tabular-nums text-white">
            +{toast.xp} XP
          </span>
        </div>
      </div>
    </div>
  );
}
