"use client";

import { useEffect, useState } from "react";
import { AnimatedFireIcon } from "./AnimatedIcons";
import { useI18n } from "./i18n";

interface StreakEarnedAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export function StreakEarnedAnimation({ isVisible, onComplete }: StreakEarnedAnimationProps) {
    const { t } = useI18n();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!isVisible) { setShow(false); return; }
        requestAnimationFrame(() => setShow(true));
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 transition-all duration-300 ease-out ${
                show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
            }`}
        >
            <div className="pointer-events-auto bg-gray-2 border border-gray-5/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl px-5 py-3 flex items-center gap-3 max-w-xs">
                <div className="shrink-0">
                    <AnimatedFireIcon size={28} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-12">{t("streakMaintainedTitle")}</p>
                    <p className="text-[10px] text-gray-7 font-medium">{t("streakMaintainedSubtitle")}</p>
                </div>
            </div>
        </div>
    );
}
