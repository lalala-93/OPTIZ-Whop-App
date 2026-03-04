"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatNumber, type RankTier } from "./rankSystem";
import { useI18n, type Locale } from "./i18n";
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
    challengesJoined: number;
    userName: string;
    userPhoto: string | null;
    onUpdateName: (name: string) => void;
    onUpdatePhoto: (url: string | null) => void;
    onDeleteData: () => Promise<void>;
    deletingData: boolean;
}

const LANGUAGE_OPTIONS: { code: Locale; label: string; shortLabel: string }[] = [
    { code: "en", label: "English", shortLabel: "EN" },
    { code: "fr", label: "Français", shortLabel: "FR" },
];

export function SettingsSheet({
    isOpen, onClose, level, totalXp, rankFullName, tier,
    streakDays, challengesJoined, userName, userPhoto,
    onUpdateName, onUpdatePhoto, onDeleteData, deletingData,
}: SettingsSheetProps) {
    const { t, locale, setLocale } = useI18n();
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveName = () => {
        if (tempName.trim()) onUpdateName(tempName.trim());
        setEditingName(false);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Compress image to max 256px and JPEG quality 0.7 to keep data URL small
        const img = document.createElement("img");
        img.onload = () => {
            const max = 256;
            let w = img.width, h = img.height;
            if (w > max || h > max) {
                const ratio = Math.min(max / w, max / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.7);
            onUpdatePhoto(compressed);
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    };

    const currentLang = LANGUAGE_OPTIONS.find(l => l.code === locale) || LANGUAGE_OPTIONS[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>

                        <div className="p-6">
                            <motion.button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-4 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-5 hover:text-gray-12 transition-all"
                                whileTap={{ scale: 0.85 }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>

                            {/* Profile */}
                            <div className="flex flex-col items-center mb-5">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-16 h-16 rounded-full bg-gray-3 border border-gray-5 flex items-center justify-center overflow-hidden mb-3 group"
                                >
                                    {userPhoto ? (
                                        <img src={userPhoto} alt={t("profileAlt")} className="w-full h-full object-cover rounded-full block" />
                                    ) : (
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-8">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                        </svg>
                                    )}
                                    {/* Camera badge — always visible */}
                                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#E80000] border-2 border-gray-2 flex items-center justify-center">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                </button>

                                {editingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()} autoFocus
                                            className="bg-gray-3 border border-gray-5 rounded-lg px-3 py-1.5 text-sm text-gray-12 text-center focus:outline-none focus:border-gray-6 w-32"
                                        />
                                        <button onClick={handleSaveName} className="text-xs font-semibold text-[#E80000]">{t("save")}</button>
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
                                <p className="text-xs font-medium mt-1" style={{ color: tier.color }}>{rankFullName}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {[
                                    { label: t("level"), value: String(level) },
                                    { label: t("totalXP"), value: formatNumber(totalXp) },
                                    { label: t("streak"), value: `${streakDays} ${streakDays === 1 ? t("day") : t("days")}` },
                                    { label: t("workoutsDone"), value: String(challengesJoined) },
                                ].map((s) => (
                                    <div key={s.label} className="bg-gray-3/60 rounded-xl p-3 text-center border border-gray-5/40">
                                        <p className="text-base font-bold text-gray-12">{s.value}</p>
                                        <p className="text-[9px] text-gray-8 font-medium uppercase tracking-wider">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Settings */}
                            <div className="space-y-1 mb-4">
                                <h3 className="text-[10px] font-bold text-gray-7 uppercase tracking-wider mb-2 px-1">{t("settings")}</h3>

                                {/* Theme */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-3/40 border border-gray-5/30">
                                    <div className="flex items-center gap-2.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-8">
                                            <circle cx="13.5" cy="6.5" r="2.5" />
                                            <circle cx="19" cy="11" r="2" />
                                            <circle cx="16.5" cy="17.5" r="2.5" />
                                            <circle cx="8" cy="18" r="2" />
                                            <path d="M6 10.5a6.5 6.5 0 1 1 0 0Z" />
                                        </svg>
                                        <span className="text-sm text-gray-12 font-medium">{t("theme")}</span>
                                    </div>
                                    <span className="text-xs text-gray-8">{t("dark")}</span>
                                </div>

                                {/* Language — interactive picker */}
                                <div className="relative">
                                    <motion.button
                                        onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-3/40 border border-gray-5/30 w-full cursor-pointer hover:bg-gray-3/60 transition-all"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-8">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M2 12h20" />
                                                <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z" />
                                            </svg>
                                            <span className="text-sm text-gray-12 font-medium">{t("language")}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-gray-5/45 bg-gray-4/40 text-gray-8">
                                                {currentLang.shortLabel}
                                            </span>
                                            <span className="text-xs text-gray-8 font-medium">{currentLang.label}</span>
                                            <svg
                                                width="10" height="10" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                className={`text-gray-7 transition-transform duration-200 ${showLanguagePicker ? "rotate-180" : ""}`}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </motion.button>

                                    <AnimatePresence>
                                        {showLanguagePicker && (
                                            <motion.div
                                                className="mt-1 rounded-xl bg-gray-3 border border-gray-5/50 overflow-hidden shadow-lg"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                                {LANGUAGE_OPTIONS.map((lang) => (
                                                    <motion.button
                                                        key={lang.code}
                                                        onClick={() => { setLocale(lang.code); setShowLanguagePicker(false); }}
                                                        className={`flex items-center justify-between w-full px-3.5 py-2.5 transition-all ${locale === lang.code
                                                            ? "bg-[#E80000]/8 text-gray-12"
                                                            : "text-gray-10 hover:bg-gray-4/50"
                                                            }`}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-gray-5/45 bg-gray-4/40 text-gray-8">
                                                                {lang.shortLabel}
                                                            </span>
                                                            <span className="text-sm font-medium">{lang.label}</span>
                                                        </div>
                                                        {locale === lang.code && (
                                                            <motion.svg
                                                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                                stroke="#E80000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                transition={{ type: "spring", stiffness: 400 }}
                                                            >
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </motion.svg>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-3 rounded-xl border border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6666] text-sm font-semibold hover:bg-[#E80000]/14 transition-colors"
                                >
                                    {t("deleteMyData")}
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-3 border-t border-gray-5/30">
                                <Image src="/Logo-optiz.png" alt="OPTIZ" width={22} height={22} className="mx-auto object-contain" style={{ borderRadius: 0 }} />
                                <p className="text-[9px] text-gray-7 mt-1">v1.0.0</p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                                        className="relative w-full max-w-xs rounded-2xl border border-gray-5/40 bg-gray-2 p-4"
                                    >
                                        <h4 className="text-sm font-semibold text-gray-12 mb-1">{t("deleteDataTitle")}</h4>
                                        <p className="text-xs text-gray-8 leading-relaxed mb-4">{t("deleteDataBody")}</p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-2 rounded-lg border border-gray-5/35 bg-gray-3/35 text-xs font-semibold text-gray-10"
                                            >
                                                {t("cancel")}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={deletingData}
                                                onClick={async () => {
                                                    await onDeleteData();
                                                    setShowDeleteConfirm(false);
                                                }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
                                                    deletingData
                                                        ? "bg-[#E80000]/45 text-white/70 cursor-not-allowed"
                                                        : "bg-[#E80000] text-white"
                                                }`}
                                            >
                                                {deletingData ? t("deleting") : t("deleteConfirm")}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
