"use client";

import { Check } from "lucide-react";

interface SetRowProps {
    setNumber: number;
    previousText?: string;
    kg: string;
    reps: string;
    isCompleted: boolean;
    onKgChange: (val: string) => void;
    onRepsChange: (val: string) => void;
    onCompleteToggle: () => void;
}

export function SetRow({
    setNumber,
    previousText = "-",
    kg,
    reps,
    isCompleted,
    onKgChange,
    onRepsChange,
    onCompleteToggle,
}: SetRowProps) {
    return (
        <div className={`grid grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_3rem] items-center gap-2 py-2 px-2 -mx-2 rounded-lg transition-colors ${isCompleted ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}>
            {/* Set Number */}
            <div className="flex items-center justify-center font-bold text-[--color-optiz-muted]">
                {setNumber}
            </div>

            {/* Previous */}
            <div className="text-sm font-medium text-[--color-optiz-muted] truncate text-center">
                {previousText}
            </div>

            {/* Kg Input */}
            <div className="flex items-center justify-center">
                <input
                    type="number"
                    value={kg}
                    onChange={(e) => onKgChange(e.target.value)}
                    disabled={isCompleted}
                    placeholder="-"
                    className="w-14 h-8 bg-black/50 border border-white/10 rounded-md text-center text-sm font-bold text-white focus:outline-none focus:border-[--color-optiz-red] disabled:opacity-50 transition-colors"
                />
            </div>

            {/* Reps Input */}
            <div className="flex items-center justify-center">
                <input
                    type="number"
                    value={reps}
                    onChange={(e) => onRepsChange(e.target.value)}
                    disabled={isCompleted}
                    placeholder="-"
                    className="w-14 h-8 bg-black/50 border border-white/10 rounded-md text-center text-sm font-bold text-white focus:outline-none focus:border-[--color-optiz-red] disabled:opacity-50 transition-colors"
                />
            </div>

            {/* Checkmark */}
            <div className="flex items-center justify-center">
                <button
                    onClick={onCompleteToggle}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isCompleted
                            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'bg-white/10 text-[--color-optiz-muted] hover:bg-white/20'
                        }`}
                >
                    <Check strokeWidth={isCompleted ? 3 : 2} className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
