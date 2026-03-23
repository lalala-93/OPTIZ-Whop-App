"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedFireIcon } from "./AnimatedIcons";
import { useI18n } from "./i18n";

interface StreakEarnedAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export function StreakEarnedAnimation({ isVisible, onComplete }: StreakEarnedAnimationProps) {
    const { t } = useI18n();

    useEffect(() => {
        if (!isVisible) return;
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed top-4 left-0 right-0 z-[90] flex justify-center pointer-events-none px-4"
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
