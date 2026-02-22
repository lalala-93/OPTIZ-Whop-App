"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";

interface ChallengeCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    challengeTitle: string;
    challengeEmoji: string;
    totalXpEarned: number;
    tasksCompleted: number;
}

const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: -200 + Math.random() * 400,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    size: 4 + Math.random() * 8,
    color: ["#E80000", "#FF2D2D", "#FFD700", "#FF6D00", "#FFFFFF", "#00CED1", "#B46EFF"][Math.floor(Math.random() * 7)],
    rotation: Math.random() * 1080,
}));

const SPARKLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    angle: (i / 16) * 360,
    delay: i * 0.05,
    distance: 80 + Math.random() * 60,
    size: 2 + Math.random() * 3,
}));

export function ChallengeCompleteModal({
    isOpen,
    onClose,
    challengeTitle,
    challengeEmoji,
    totalXpEarned,
    tasksCompleted,
}: ChallengeCompleteModalProps) {
    const badgeRef = useRef<HTMLDivElement>(null);

    const handleShare = useCallback(async () => {
        // Create a canvas-based badge for sharing
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Dark gradient background
        const gradient = ctx.createLinearGradient(0, 0, 600, 400);
        gradient.addColorStop(0, "#0A0A0A");
        gradient.addColorStop(1, "#1A0000");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);

        // Red accent line at top
        const lineGrad = ctx.createLinearGradient(0, 0, 600, 0);
        lineGrad.addColorStop(0, "#E80000");
        lineGrad.addColorStop(1, "#FF2D2D");
        ctx.fillStyle = lineGrad;
        ctx.fillRect(0, 0, 600, 4);

        // Emoji
        ctx.font = "64px serif";
        ctx.textAlign = "center";
        ctx.fillText(challengeEmoji, 300, 120);

        // Title
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 28px -apple-system, sans-serif";
        ctx.fillText("CHALLENGE COMPLETE!", 300, 180);

        // Challenge name
        ctx.fillStyle = "#E80000";
        ctx.font = "bold 22px -apple-system, sans-serif";
        ctx.fillText(challengeTitle, 300, 220);

        // XP
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 36px -apple-system, sans-serif";
        ctx.fillText(`+${totalXpEarned} XP`, 300, 280);

        // Tasks
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "16px -apple-system, sans-serif";
        ctx.fillText(`${tasksCompleted} tasks completed`, 300, 320);

        // Branding
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "bold 14px -apple-system, sans-serif";
        ctx.fillText("OPTIZ — Level up your fitness", 300, 375);

        try {
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
            if (!blob) return;

            if (navigator.share) {
                const file = new File([blob], `optiz-${challengeTitle.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" });
                const shareData = {
                    title: `I completed ${challengeTitle} on OPTIZ!`,
                    text: `I just completed the ${challengeTitle} challenge and earned ${totalXpEarned} XP! 🔥`,
                    files: [file],
                };
                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                    // Fallback: download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `optiz-${challengeTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } else {
                // Fallback: download
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `optiz-${challengeTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch {
            // User cancelled share
        }
    }, [challengeTitle, challengeEmoji, totalXpEarned, tasksCompleted]);

    useEffect(() => {
        if (isOpen) {
            // Auto-dismiss after 8 seconds if user doesn't interact
            const timer = setTimeout(onClose, 8000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Confetti */}
                    {CONFETTI.map((c) => (
                        <motion.div
                            key={c.id}
                            className="absolute rounded-sm"
                            style={{
                                width: c.size,
                                height: c.size,
                                background: c.color,
                                left: "50%",
                                top: "50%",
                            }}
                            initial={{ opacity: 0, y: 0, x: 0, rotate: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                y: [0, -120, 300],
                                x: c.x,
                                rotate: c.rotation,
                                scale: [0, 1.2, 0.8],
                            }}
                            transition={{
                                duration: c.duration,
                                delay: 0.2 + c.delay,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                    <div ref={badgeRef} className="relative z-10 flex flex-col items-center px-6">
                        {/* Sparkle ring */}
                        {SPARKLES.map((s) => {
                            const rad = (s.angle * Math.PI) / 180;
                            return (
                                <motion.div
                                    key={s.id}
                                    className="absolute rounded-full bg-[#FFD700]"
                                    style={{ width: s.size, height: s.size }}
                                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        x: Math.cos(rad) * s.distance,
                                        y: Math.sin(rad) * s.distance,
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 1,
                                        delay: 0.4 + s.delay,
                                        ease: "easeOut",
                                    }}
                                />
                            );
                        })}

                        {/* Glow rings */}
                        <motion.div
                            className="absolute w-32 h-32 rounded-full"
                            style={{ boxShadow: "0 0 60px rgba(232, 0, 0, 0.4), 0 0 120px rgba(232, 0, 0, 0.2), 0 0 200px rgba(255, 215, 0, 0.1)" }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 2, 1.5], opacity: [0, 0.8, 0.4] }}
                            transition={{ duration: 1.2, delay: 0.2 }}
                        />

                        {/* Badge */}
                        <motion.div
                            className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#E80000] to-[#FF2D2D] flex items-center justify-center shadow-[0_0_50px_rgba(232,0,0,0.4)]"
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: [0, 1.3, 1], rotate: [-30, 10, 0] }}
                            transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
                        >
                            <span className="text-5xl">{challengeEmoji}</span>
                        </motion.div>

                        {/* Text */}
                        <motion.div
                            className="text-center mt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <motion.p
                                className="text-xs font-bold uppercase tracking-[0.25em] text-gray-9 mb-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                Challenge Complete!
                            </motion.p>

                            <motion.h2
                                className="text-3xl font-black text-gray-12 mb-1"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
                            >
                                {challengeTitle}
                            </motion.h2>

                            <motion.p
                                className="text-2xl font-black mt-2 tabular-nums"
                                style={{ color: "#FFD700" }}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1.1, type: "spring" }}
                            >
                                +{totalXpEarned} XP
                            </motion.p>

                            <motion.p
                                className="text-xs text-gray-8 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                            >
                                {tasksCompleted} tasks crushed • You&apos;re unstoppable
                            </motion.p>
                        </motion.div>

                        {/* Buttons */}
                        <motion.div
                            className="flex gap-3 mt-8 w-full max-w-xs"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                        >
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white/10 border border-white/10 text-gray-11 hover:bg-white/15 transition-all active:scale-[0.98]"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex-1 py-3 rounded-xl font-bold text-sm optiz-gradient-bg text-white transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(232,0,0,0.2)] flex items-center justify-center gap-2"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                                Share
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
