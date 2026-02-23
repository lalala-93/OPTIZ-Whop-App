"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RankBadge } from "./RankBadge";
import type { RankTier } from "./rankSystem";
import Image from "next/image";
import { useState, useRef } from "react";

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
    userName: string;
    userPhoto: string | null;
    onUpdateName: (name: string) => void;
    onUpdatePhoto: (url: string | null) => void;
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
    userName,
    userPhoto,
    onUpdateName,
    onUpdatePhoto,
}: SettingsSheetProps) {
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveName = () => {
        if (tempName.trim()) {
            onUpdateName(tempName.trim());
        }
        setEditingName(false);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onUpdatePhoto(url);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        <div className="p-6">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-5 hover:text-gray-12 transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            {/* Profile section with photo edit */}
                            <div className="flex flex-col items-center mb-5">
                                {/* Photo */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-16 h-16 rounded-full bg-gray-3 border border-gray-5 flex items-center justify-center overflow-hidden mb-3 group"
                                >
                                    {userPhoto ? (
                                        <Image
                                            src={userPhoto}
                                            alt="Profile"
                                            width={64}
                                            height={64}
                                            className="rounded-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-8">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </button>

                                {/* Name — editable */}
                                {editingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                            autoFocus
                                            className="bg-gray-3 border border-gray-5 rounded-lg px-3 py-1.5 text-sm text-gray-12 text-center focus:outline-none focus:border-gray-6 w-32"
                                        />
                                        <button onClick={handleSaveName} className="text-xs font-semibold text-[#E80000]">Save</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setTempName(userName); setEditingName(true); }}
                                        className="text-base font-bold text-gray-12 hover:text-gray-11 transition-colors flex items-center gap-1.5"
                                    >
                                        {userName}
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-8">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                )}
                                <p className="text-xs font-medium mt-1" style={{ color: tier.color }}>
                                    {rankFullName}
                                </p>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {[
                                    { label: "Level", value: String(level) },
                                    { label: "Total XP", value: totalXp.toLocaleString() },
                                    { label: "Streak", value: `🔥 ${streakDays}` },
                                    { label: "Tasks Done", value: String(tasksCompleted) },
                                ].map((s) => (
                                    <div key={s.label} className="bg-gray-3/60 rounded-xl p-3 text-center border border-gray-5/40">
                                        <p className="text-base font-bold text-gray-12">{s.value}</p>
                                        <p className="text-[9px] text-gray-8 font-medium uppercase tracking-wider">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Settings */}
                            <div className="space-y-1 mb-4">
                                <h3 className="text-[10px] font-bold text-gray-7 uppercase tracking-wider mb-2 px-1">Settings</h3>
                                {[
                                    { icon: "🔔", label: "Notifications", value: "On" },
                                    { icon: "🎨", label: "Theme", value: "Dark" },
                                    { icon: "🌍", label: "Language", value: "EN" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-3/40 border border-gray-5/30 cursor-pointer">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-sm">{item.icon}</span>
                                            <span className="text-sm text-gray-12 font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-xs text-gray-8">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer — logo only */}
                            <div className="text-center pt-3 border-t border-gray-5/30">
                                <Image src="/Logo-optiz.png" alt="OPTIZ" width={22} height={22} className="mx-auto object-contain" style={{ borderRadius: 0 }} />
                                <p className="text-[9px] text-gray-7 mt-1">v1.0.0</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
