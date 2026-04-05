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
      // Force reflow then show
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [toast?.id]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(88vw,380px)] transition-all duration-200 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="rounded-2xl border border-[#E80000]/20 bg-gray-2 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E80000]/12 border border-[#E80000]/20 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6D6D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-12 truncate">{toast.title}</p>
            {toast.subtitle ? <p className="text-[11px] text-gray-8 truncate">{toast.subtitle}</p> : null}
          </div>
          <span className="shrink-0 text-[14px] font-bold tabular-nums text-[#FF6D6D]">
            +{toast.xp} XP
          </span>
        </div>
      </div>
    </div>
  );
}
