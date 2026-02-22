"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RankBadge } from "./RankBadge";
import type { RankTier } from "./rankSystem";
import Image from "next/image";

interface SettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    totalXp: number;
    rankFullName: string;
    tier: RankTier;
    streakDays: number;
    tasksCompleted: number;
    challengesJoined: number;
}

export function SettingsSheet({
    isOpen,
    onClose,
    level,
    totalXp,
    rankFullName,
    tier,
    streakDays,
    tasksCompleted,
    challengesJoined,
}: SettingsSheetProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        <div className="p-6">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-5 hover:text-gray-12 transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            {/* Profile section */}
                            <div className="flex flex-col items-center mb-6">
                                <RankBadge
                                    colors={tier.gradient}
                                    glowColor={tier.glowColor}
                                    size={70}
                                />
                                <h2 className="text-lg font-bold text-gray-12 mt-3">Your Profile</h2>
                                <p className="text-sm font-semibold mt-0.5" style={{ color: tier.color }}>
                                    {rankFullName}
                                </p>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-2.5 mb-6">
                                <div className="bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold text-gray-12">{level}</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Level</p>
                                </div>
                                <div className="bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold optiz-gradient-text">{totalXp.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Total XP</p>
                                </div>
                                <div className="bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold text-gray-12">🔥 {streakDays}</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Streak</p>
                                </div>
                                <div className="bg-gray-3 rounded-xl p-3 text-center border border-gray-5">
                                    <p className="text-lg font-bold text-gray-12">{tasksCompleted}</p>
                                    <p className="text-[10px] text-gray-8 font-medium uppercase tracking-wider">Tasks Done</p>
                                </div>
                            </div>

                            {/* Settings items */}
                            <div className="space-y-1 mb-4">
                                <h3 className="text-xs font-bold text-gray-8 uppercase tracking-wider mb-2 px-1">Settings</h3>
                                {[
                                    { icon: "🔔", label: "Notifications", value: "On" },
                                    { icon: "🎨", label: "Theme", value: "Dark" },
                                    { icon: "🌍", label: "Language", value: "EN" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-3/50 border border-gray-5/50 hover:bg-gray-3 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-base">{item.icon}</span>
                                            <span className="text-sm text-gray-12 font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-xs text-gray-8 font-medium">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* About */}
                            <div className="text-center pt-4 border-t border-gray-5/50">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Image
                                        src="/Logo-optiz.png"
                                        alt="OPTIZ"
                                        width={20}
                                        height={20}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-bold text-gray-11">OPTIZ</span>
                                </div>
                                <p className="text-[10px] text-gray-7">v1.0.0 • 1% better every day</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
