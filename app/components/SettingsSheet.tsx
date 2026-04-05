"use client";

import { formatNumber, type RankTier } from "./rankSystem";
import { useI18n, type Locale } from "./i18n";
import Image from "next/image";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { User, Pencil, Palette, Globe, Trash2, X, Check, ChevronDown } from "lucide-react";

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
        <>
            <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DrawerContent className="bg-gray-2 border-gray-4">
                    <DrawerHeader className="relative pb-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-gray-4 border border-gray-5 text-gray-9 hover:bg-gray-5 hover:text-gray-12"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <DrawerTitle className="sr-only">{t("settings")}</DrawerTitle>
                    </DrawerHeader>

                    <div className="px-6 pb-6">
                        {/* Profile */}
                        <div className="flex flex-col items-center mb-5">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="relative mb-3 group"
                            >
                                <Avatar className="h-16 w-16 border border-gray-5">
                                    {userPhoto ? (
                                        <AvatarImage src={userPhoto} alt={t("profileAlt")} />
                                    ) : null}
                                    <AvatarFallback className="bg-gray-3">
                                        <User className="h-7 w-7 text-gray-8" />
                                    </AvatarFallback>
                                </Avatar>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </button>

                            {editingName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                        autoFocus
                                        className="bg-gray-3 border-gray-5 text-sm text-gray-12 text-center w-32 h-8 focus-visible:ring-[#E80000]/30"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSaveName}
                                        className="text-xs font-semibold text-[#E80000] hover:text-[#E80000] hover:bg-[#E80000]/10 h-8 px-2"
                                    >
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        {t("save")}
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setTempName(userName); setEditingName(true); }}
                                    className="text-base font-bold text-gray-12 hover:text-gray-11 transition-colors flex items-center gap-1.5"
                                >
                                    {userName}
                                    <Pencil className="h-2.5 w-2.5 text-gray-8" />
                                </button>
                            )}
                            <Badge
                                variant="outline"
                                className="mt-1 border-transparent text-xs font-medium"
                                style={{ color: tier.color }}
                            >
                                {rankFullName}
                            </Badge>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {[
                                { label: t("level"), value: String(level) },
                                { label: t("totalXP"), value: formatNumber(totalXp) },
                                { label: t("streak"), value: `${streakDays} ${streakDays === 1 ? t("day") : t("days")}` },
                                { label: t("workoutsDone"), value: String(challengesJoined) },
                            ].map((s) => (
                                <Card key={s.label} className="bg-gray-3/60 border-gray-5/40 p-3 text-center">
                                    <p className="text-base font-bold text-gray-12">{s.value}</p>
                                    <p className="text-[9px] text-gray-8 font-medium uppercase tracking-wider">{s.label}</p>
                                </Card>
                            ))}
                        </div>

                        <Separator className="bg-gray-5/30 mb-4" />

                        {/* Settings */}
                        <div className="space-y-1 mb-4">
                            <h3 className="text-[10px] font-bold text-gray-7 uppercase tracking-wider mb-2 px-1">{t("settings")}</h3>

                            {/* Theme */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-3/40 border border-gray-5/30">
                                <div className="flex items-center gap-2.5">
                                    <Palette className="h-3.5 w-3.5 text-gray-8" />
                                    <span className="text-sm text-gray-12 font-medium">{t("theme")}</span>
                                </div>
                                <span className="text-xs text-gray-8">{t("dark")}</span>
                            </div>

                            {/* Language */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                                    className="flex items-center justify-between p-3 rounded-xl bg-gray-3/40 border border-gray-5/30 w-full h-auto hover:bg-gray-3/60"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Globe className="h-3.5 w-3.5 text-gray-8" />
                                        <span className="text-sm text-gray-12 font-medium">{t("language")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[10px] font-semibold border-gray-5/45 bg-gray-4/40 text-gray-8 px-1.5 py-0.5">
                                            {currentLang.shortLabel}
                                        </Badge>
                                        <span className="text-xs text-gray-8 font-medium">{currentLang.label}</span>
                                        <ChevronDown className={cn(
                                            "h-2.5 w-2.5 text-gray-7 transition-transform duration-200",
                                            showLanguagePicker && "rotate-180"
                                        )} />
                                    </div>
                                </Button>

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
                                                <Button
                                                    key={lang.code}
                                                    variant="ghost"
                                                    onClick={() => { setLocale(lang.code); setShowLanguagePicker(false); }}
                                                    className={cn(
                                                        "flex items-center justify-between w-full px-3.5 py-2.5 h-auto rounded-none",
                                                        locale === lang.code
                                                            ? "bg-[#E80000]/8 text-gray-12"
                                                            : "text-gray-10 hover:bg-gray-4/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Badge variant="outline" className="text-[10px] font-semibold border-gray-5/45 bg-gray-4/40 text-gray-8 px-1.5 py-0.5">
                                                            {lang.shortLabel}
                                                        </Badge>
                                                        <span className="text-sm font-medium">{lang.label}</span>
                                                    </div>
                                                    {locale === lang.code && (
                                                        <Check className="h-3.5 w-3.5 text-[#E80000]" />
                                                    )}
                                                </Button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Delete data */}
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full mb-4 py-3 h-auto rounded-xl border-[#E80000]/35 bg-[#E80000]/10 text-[#FF6666] text-sm font-semibold hover:bg-[#E80000]/14 hover:text-[#FF6666]"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            {t("deleteMyData")}
                        </Button>

                        {/* Footer */}
                        <Separator className="bg-gray-5/30 mb-3" />
                        <div className="text-center">
                            <Image src="/Logo-optiz.png" alt="OPTIZ" width={22} height={22} className="mx-auto object-contain" style={{ borderRadius: 0 }} />
                            <p className="text-[9px] text-gray-7 mt-1">v1.0.0</p>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="bg-gray-2 border-gray-5/40 max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold text-gray-12">{t("deleteDataTitle")}</DialogTitle>
                        <DialogDescription className="text-xs text-gray-8 leading-relaxed">{t("deleteDataBody")}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2 h-auto rounded-lg border-gray-5/35 bg-gray-3/35 text-xs font-semibold text-gray-10 hover:bg-gray-4"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deletingData}
                            onClick={async () => {
                                await onDeleteData();
                                setShowDeleteConfirm(false);
                            }}
                            className={cn(
                                "flex-1 py-2 h-auto rounded-lg text-xs font-semibold",
                                deletingData
                                    ? "bg-[#E80000]/45 text-white/70 cursor-not-allowed"
                                    : "bg-[#E80000] text-white hover:bg-[#E80000]/90"
                            )}
                        >
                            {deletingData ? t("deleting") : t("deleteConfirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
