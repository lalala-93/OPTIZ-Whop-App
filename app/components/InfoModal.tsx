"use client";

import Image from "next/image";
import { Zap, Trophy, Flame, BarChart3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "./i18n";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
    const { t } = useI18n();

    const features = [
        { icon: Zap, title: t("earnXp"), desc: t("earnXpDesc") },
        { icon: Trophy, title: t("rankUp"), desc: t("rankUpDesc") },
        { icon: Flame, title: t("buildStreaks"), desc: t("buildStreaksDesc") },
        { icon: BarChart3, title: t("compete"), desc: t("competeDesc") },
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
                    <DialogHeader className="items-center mb-6">
                        <Image src="/Logo-optiz.png" alt="OPTIZ" width={80} height={80} className="object-contain" style={{ borderRadius: 0 }} />
                        <DialogTitle className="text-xl font-black text-gray-12 mt-4 tracking-tight">
                            {t("whatIsOptiz")}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mb-6">
                        <DialogDescription className="text-sm text-gray-11 leading-relaxed text-center">
                            {t("aboutOptizDesc")}
                        </DialogDescription>

                        <div className="grid grid-cols-2 gap-2.5">
                            {features.map((item) => (
                                <Card key={item.title} className="bg-gray-3 rounded-xl p-3 border-gray-5/60 text-center shadow-none">
                                    <item.icon className="w-5 h-5 mx-auto mb-1 text-gray-11" />
                                    <p className="text-[11px] font-bold text-gray-12 mb-0.5">{item.title}</p>
                                    <p className="text-[10px] text-gray-8 leading-tight">{item.desc}</p>
                                </Card>
                            ))}
                        </div>

                        <p className="text-xs text-gray-7 text-center italic">
                            &ldquo;{t("aboutQuote")}&rdquo; — OPTIZ
                        </p>
                    </div>

                    <Button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-bold text-sm optiz-gradient-bg text-white hover:opacity-90 transition-all active:scale-[0.98] h-auto"
                    >
                        {t("letsGo")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
