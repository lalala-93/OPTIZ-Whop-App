"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

interface RestTimerProps {
    isActive: boolean;
    initialSeconds: number;
    onClose: () => void;
}

export function RestTimer({ isActive, initialSeconds, onClose }: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);

    // When timer starts or is reset
    useEffect(() => {
        if (isActive) {
            setTimeLeft(initialSeconds);
        }
    }, [isActive, initialSeconds]);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Format MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const adjustTime = (amount: number) => {
        setTimeLeft((prev) => Math.max(0, prev + amount));
    };

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-8 pt-4 pointer-events-none flex justify-center"
                >
                    <div className="pointer-events-auto bg-[--color-optiz-card] border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm px-4 py-3 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-[--color-optiz-muted] font-bold uppercase tracking-wider">Rest Timer</span>
                            <span className={`text-2xl font-mono font-bold ${timeLeft === 0 ? 'text-[--color-optiz-red] animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => adjustTime(-15)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                title="-15s"
                            >
                                <Minus size={18} />
                            </button>
                            <button
                                onClick={() => adjustTime(15)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                                title="+15s"
                            >
                                <Plus size={18} />
                            </button>
                            <div className="w-px h-8 bg-white/10 mx-1" />
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-[--color-optiz-red]/20 text-[--color-optiz-red] hover:bg-[--color-optiz-red]/30 flex items-center justify-center transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
