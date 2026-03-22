"use client";

import { motion } from "framer-motion";
import { Check, RotateCcw, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AnimatedFireIcon } from "./AnimatedIcons";
import { useI18n } from "./i18n";

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakDays: number;
    weeklyProgress: boolean[];
}

export function StreakModal({ isOpen, onClose, streakDays, weeklyProgress }: StreakModalProps) {
    const { t } = useI18n();
    const dayLabels = [
        t("dayShortMon"),
        t("dayShortTue"),
        t("dayShortWed"),
        t("dayShortThu"),
        t("dayShortFri"),
        t("dayShortSat"),
        t("dayShortSun"),
    ];
    const day = new Date().getDay();
    const todayIndex = day === 0 ? 6 : day - 1;

    const ruleIcons = [
        { icon: Check, text: t("streakRule1") },
        { icon: RotateCcw, text: t("streakRule2") },
        { icon: Trophy, text: t("streakRule3") },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={cn(
                "bg-gray-2 border-gray-4 text-gray-12 max-w-md rounded-3xl p-0 gap-0",
                "[&>button]:hidden"
            )}>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 w-7 h-7 rounded-full bg-gray-4/80 border border-gray-5/50 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-gray-5 transition-all z-10"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
                <div className="p-6 pt-8">
                    {/* Giant animated flame */}
                    <DialogHeader className="items-center mb-5">
                        <motion.div
                            className="mb-2"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            style={{ filter: "drop-shadow(0 0 16px rgba(255, 100, 0, 0.4))" }}
                        >
                            <AnimatedFireIcon size={64} />
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: "spring" }}
                        >
                            <Badge className="bg-[#E80000]/15 text-[#FF4444] border-[#E80000]/30 hover:bg-[#E80000]/20 text-3xl font-black px-4 py-1.5 tabular-nums">
                                {streakDays} {streakDays === 1 ? t("day") : t("days")}
                            </Badge>
                        </motion.div>

                        <DialogTitle className="text-sm text-gray-9 mt-1 font-medium">
                            {t("currentStreak")}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Weekly progress */}
                    <Card className="bg-gray-3 rounded-2xl p-4 border-gray-5 mb-5 shadow-none">
                        <p className="text-xs font-bold text-gray-10 uppercase tracking-wider mb-3">{t("thisWeek")}</p>
                        <div className="flex items-center justify-between gap-1">
                            {dayLabels.map((dayLabel, i) => {
                                const isDone = weeklyProgress[i];
                                const isToday = i === todayIndex;
                                return (
                                    <div key={dayLabel} className="flex flex-col items-center gap-1.5 flex-1">
                                        <span className={cn(
                                            "text-[10px] font-semibold",
                                            isToday ? "text-gray-12" : "text-gray-8"
                                        )}>
                                            {dayLabel}
                                        </span>
                                        <motion.div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                isDone
                                                    ? "bg-[#E80000] text-white shadow-[0_0_12px_rgba(232,0,0,0.35)]"
                                                    : isToday
                                                        ? "border-2 border-[#E80000]/50 bg-[#E80000]/10 text-gray-11"
                                                        : "bg-gray-4 text-gray-7 border border-gray-5"
                                            )}
                                            initial={isDone ? { scale: 0 } : {}}
                                            animate={isDone ? { scale: 1 } : {}}
                                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: i * 0.05 }}
                                        >
                                            {isDone ? "✓" : ""}
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* How it works */}
                    <div className="space-y-3 mb-5">
                        <h3 className="text-sm font-bold text-gray-12">{t("howStreaksWork")}</h3>
                        {ruleIcons.map((item) => (
                            <div key={item.text} className="flex items-start gap-2.5">
                                <item.icon className="mt-0.5 shrink-0 w-4 h-4 text-gray-9" />
                                <p className="text-xs text-gray-10 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="w-full py-3 rounded-xl font-bold text-sm bg-gray-4 border-gray-5 text-gray-12 hover:bg-gray-5 transition-all h-auto active:scale-[0.97]"
                    >
                        {t("gotIt")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
