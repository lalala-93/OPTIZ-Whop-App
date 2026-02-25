"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ChallengeTask, Exercise } from "./rankSystem";
import { useI18n } from "./i18n";

interface ChallengeProgramProps {
    challengeTitle: string;
    challengeEmoji: string;
    tasks: ChallengeTask[];
    onCompleteTask: (taskId: string) => void;
    onBack: () => void;
    completingTaskId: string | null;
}

// ══════════════════════════════════════════
// REST TIMER — Sticky bottom bar
// ══════════════════════════════════════════
function RestTimer({ isActive, onClose }: { isActive: boolean; onClose: () => void }) {
    const [timeLeft, setTimeLeft] = useState(90);

    useEffect(() => {
        if (isActive) setTimeLeft(90);
    }, [isActive]);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 flex justify-center pointer-events-none"
                >
                    <div className="pointer-events-auto bg-gray-2 border border-gray-5/50 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] rounded-2xl px-5 py-3 flex items-center justify-between w-full max-w-sm">
                        <div>
                            <span className="text-[10px] font-bold text-gray-7 uppercase tracking-wider block">Repos</span>
                            <span className={`text-2xl font-mono font-black ${timeLeft === 0 ? "text-[#E80000] animate-pulse" : "text-gray-12"}`}>
                                {fmt(timeLeft)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTimeLeft(p => Math.max(0, p - 15))} className="w-9 h-9 rounded-full bg-gray-4/60 text-gray-9 hover:text-gray-12 flex items-center justify-center text-lg font-bold transition-colors">−</button>
                            <button onClick={() => setTimeLeft(p => p + 15)} className="w-9 h-9 rounded-full bg-gray-4/60 text-gray-9 hover:text-gray-12 flex items-center justify-center text-lg font-bold transition-colors">+</button>
                            <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#E80000]/15 text-[#E80000] hover:bg-[#E80000]/25 flex items-center justify-center transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ══════════════════════════════════════════
// EXERCISE INFO SHEET — YouTube + muscles
// ══════════════════════════════════════════
function ExerciseInfoSheet({ exercise, isOpen, onClose }: { exercise: Exercise | null; isOpen: boolean; onClose: () => void }) {
    if (!isOpen || !exercise) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
                <motion.div
                    initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-gray-6" /></div>
                    <div className="px-5 pt-4 pb-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-12">{exercise.name}</h3>
                            <motion.button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-4 flex items-center justify-center text-gray-9" whileTap={{ scale: 0.85 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </motion.button>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-gray-3/40 border border-gray-5/30 rounded-xl p-3">
                                <span className="text-[10px] text-gray-7 font-bold uppercase tracking-wider">Muscles ciblés</span>
                                <p className="text-sm text-gray-12 font-medium mt-1">{exercise.muscles}</p>
                            </div>
                            <div className="bg-gray-3/40 border border-gray-5/30 rounded-xl p-3">
                                <span className="text-[10px] text-gray-7 font-bold uppercase tracking-wider">Séries</span>
                                <p className="text-sm text-gray-12 font-medium mt-1">{exercise.sets}</p>
                            </div>
                            <a href={exercise.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 hover:bg-red-500/15 transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-12">Voir la démo</span>
                                    <span className="text-[10px] text-gray-7 block">Ouvrir sur YouTube</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ══════════════════════════════════════════
// SET ROW — Single set input row
// ══════════════════════════════════════════
function SetRow({ setNum, kg, reps, done, prevKg, prevReps, onKg, onReps, onToggle }: {
    setNum: number; kg: string; reps: string; done: boolean;
    prevKg: string; prevReps: string;
    onKg: (v: string) => void; onReps: (v: string) => void; onToggle: () => void;
}) {
    return (
        <div className={`grid grid-cols-[2.2rem_1fr_3.5rem_3.5rem_2.2rem] items-center gap-1.5 py-1.5 rounded-lg transition-colors ${done ? "bg-emerald-500/8" : ""}`}>
            <span className="text-center text-[11px] font-bold text-gray-7">{setNum}</span>
            <span className="text-center text-[10px] text-gray-6 truncate">{prevKg && prevReps ? `${prevKg} kg × ${prevReps}` : "—"}</span>
            <input type="number" inputMode="decimal" value={kg} onChange={e => onKg(e.target.value)} disabled={done} placeholder="—"
                className="w-full h-7 bg-gray-3/50 border border-gray-5/40 rounded-md text-center text-[11px] font-bold text-gray-12 focus:outline-none focus:border-[#E80000]/60 disabled:opacity-40 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <input type="number" inputMode="numeric" value={reps} onChange={e => onReps(e.target.value)} disabled={done} placeholder="—"
                className="w-full h-7 bg-gray-3/50 border border-gray-5/40 rounded-md text-center text-[11px] font-bold text-gray-12 focus:outline-none focus:border-[#E80000]/60 disabled:opacity-40 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <div className="flex justify-center">
                <motion.button onClick={onToggle} whileTap={{ scale: 0.8 }}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${done ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]" : "bg-gray-4/60 hover:bg-gray-5/60"}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={done ? "white" : "currentColor"} strokeWidth={done ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round" className={done ? "" : "text-gray-7"}>
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </motion.button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// EXERCISE TRACKER CARD — Full tracking
// ══════════════════════════════════════════
interface SetState { kg: string; reps: string; done: boolean; }

function ExerciseTrackerCard({ exercise, accentColor, setsState, onSetChange, onSetToggle, onInfoClick }: {
    exercise: Exercise; accentColor: string;
    setsState: SetState[];
    onSetChange: (i: number, f: "kg" | "reps", v: string) => void;
    onSetToggle: (i: number) => void;
    onInfoClick: () => void;
}) {
    const completedCount = setsState.filter(s => s.done).length;
    const allDone = completedCount === setsState.length;

    return (
        <div className={`bg-gray-3/20 border rounded-2xl overflow-hidden transition-colors ${allDone ? "border-emerald-500/30" : "border-gray-5/30"}`}>
            {/* Header */}
            <div className="flex items-stretch">
                <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: allDone ? "#10B981" : accentColor }} />
                <div className="flex-1 px-3.5 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-0.5">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-gray-12 leading-snug truncate">{exercise.name}</h4>
                            <p className="text-[9px] text-gray-7 mt-0.5">{exercise.muscles}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[9px] font-bold text-gray-6 tabular-nums">{completedCount}/{setsState.length}</span>
                            <motion.button onClick={onInfoClick} whileTap={{ scale: 0.85 }}
                                className="w-6 h-6 rounded-full bg-gray-4/50 flex items-center justify-center text-gray-7 hover:text-gray-11 transition-colors">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>

                    {/* Table header */}
                    <div className="grid grid-cols-[2.2rem_1fr_3.5rem_3.5rem_2.2rem] items-center gap-1.5 mt-2 mb-1">
                        <span className="text-center text-[8px] font-bold text-gray-6 uppercase">Set</span>
                        <span className="text-center text-[8px] font-bold text-gray-6 uppercase">Précédent</span>
                        <span className="text-center text-[8px] font-bold text-gray-6 uppercase">kg</span>
                        <span className="text-center text-[8px] font-bold text-gray-6 uppercase">Reps</span>
                        <span className="text-center text-[8px] font-bold text-gray-6 uppercase">✓</span>
                    </div>

                    {/* Rows */}
                    {setsState.map((s, i) => (
                        <SetRow key={i} setNum={i + 1} kg={s.kg} reps={s.reps} done={s.done}
                            prevKg="" prevReps="" onKg={v => onSetChange(i, "kg", v)} onReps={v => onSetChange(i, "reps", v)} onToggle={() => onSetToggle(i)} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// ACTIVE WORKOUT VIEW — Full session tracker
// ══════════════════════════════════════════
function ActiveWorkoutView({ task, accentColor, onFinish, onBack }: {
    task: ChallengeTask; accentColor: string;
    onFinish: () => void; onBack: () => void;
}) {
    const exercises = task.exercises || [];
    const storageKey = `optiz-session-${task.id}`;

    // Parse # of sets from the exercise.sets text
    const parseSetsCount = (setsText: string): number => {
        const m = setsText.match(/^(\d+)/);
        if (m) return parseInt(m[1]);
        if (/emom/i.test(setsText)) return 10;
        if (/max/i.test(setsText) || /amrap/i.test(setsText)) return 2;
        return 3;
    };

    // Parse default reps from exercise.sets
    const parseDefaultReps = (setsText: string): string => {
        const m = setsText.match(/(\d+)[-–](\d+)\s*reps/i);
        if (m) return m[1];
        if (/max/i.test(setsText) || /amrap/i.test(setsText)) return "";
        return "";
    };

    const [allSets, setAllSets] = useState<Record<string, SetState[]>>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate it has all exercises
                if (exercises.every(ex => parsed[ex.name])) return parsed;
            }
        } catch { }
        const init: Record<string, SetState[]> = {};
        exercises.forEach(ex => {
            const count = parseSetsCount(ex.sets);
            const defReps = parseDefaultReps(ex.sets);
            init[ex.name] = Array.from({ length: count }, () => ({ kg: "", reps: defReps, done: false }));
        });
        return init;
    });

    const [timerActive, setTimerActive] = useState(false);
    const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const elapsedRef = useRef<NodeJS.Timeout | null>(null);

    // Elapsed time
    useEffect(() => {
        elapsedRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
    }, []);

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(allSets));
    }, [allSets, storageKey]);

    const handleSetChange = (exName: string, i: number, f: "kg" | "reps", v: string) => {
        setAllSets(prev => ({
            ...prev,
            [exName]: prev[exName].map((s, idx) => idx === i ? { ...s, [f]: v } : s)
        }));
    };

    const handleSetToggle = (exName: string, i: number) => {
        const current = allSets[exName][i];
        const willComplete = !current.done;
        setAllSets(prev => ({
            ...prev,
            [exName]: prev[exName].map((s, idx) => idx === i ? { ...s, done: willComplete } : s)
        }));
        if (willComplete) {
            setTimerActive(false);
            setTimeout(() => setTimerActive(true), 50);
        }
    };

    const totalSets = Object.values(allSets).reduce((a, sets) => a + sets.length, 0);
    const doneSets = Object.values(allSets).reduce((a, sets) => a + sets.filter(s => s.done).length, 0);
    const progressPct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;
    const fmtElapsed = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`;

    const handleFinish = () => {
        localStorage.removeItem(storageKey);
        // Mark 24h completion
        const completions = JSON.parse(localStorage.getItem("optiz-completions") || "{}");
        completions[task.id] = new Date().toISOString();
        localStorage.setItem("optiz-completions", JSON.stringify(completions));
        onFinish();
    };

    return (
        <div className="pb-28">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-gray-1/95 backdrop-blur-xl border-b border-gray-5/30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4">
                <div className="flex items-center justify-between">
                    <motion.button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-8 hover:text-gray-12 transition-colors" whileTap={{ scale: 0.95 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Retour
                    </motion.button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-7 tabular-nums">⏱ {fmtElapsed}</span>
                        <span className="text-[10px] font-bold text-gray-7 tabular-nums">{doneSets}/{totalSets} sets</span>
                    </div>
                </div>
                {/* Mini progress bar */}
                <div className="h-[3px] w-full bg-gray-4/30 rounded-full mt-2 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: accentColor }}
                        animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
                </div>
            </div>

            {/* Session Title */}
            <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-12 leading-tight">{task.name.replace(/^[🟥🟦🟩🟪]\s*/, "")}</h2>
                <p className="text-[10px] text-gray-7 mt-1">{exercises.length} exercices · +{task.xpReward} XP · En RIR1</p>
            </div>

            {/* Exercise Cards */}
            <div className="space-y-3">
                {exercises.map((ex, i) => (
                    <motion.div key={ex.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                        <ExerciseTrackerCard
                            exercise={ex} accentColor={accentColor}
                            setsState={allSets[ex.name] || []}
                            onSetChange={(idx, f, v) => handleSetChange(ex.name, idx, f, v)}
                            onSetToggle={(idx) => handleSetToggle(ex.name, idx)}
                            onInfoClick={() => setInfoExercise(ex)}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Finish Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/90 to-transparent pointer-events-none flex justify-center z-20">
                <motion.button onClick={handleFinish} whileTap={{ scale: 0.97 }}
                    className="pointer-events-auto w-full max-w-sm py-3.5 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ background: doneSets === totalSets ? accentColor : undefined, opacity: doneSets === totalSets ? 1 : 0.6, backgroundColor: doneSets !== totalSets ? "var(--gray-4)" : undefined }}>
                    {doneSets === totalSets ? `Terminer · +${task.xpReward} XP` : `Terminer (${doneSets}/${totalSets})`}
                </motion.button>
            </div>

            {/* Timer */}
            <RestTimer isActive={timerActive} onClose={() => setTimerActive(false)} />
            {/* Info Sheet */}
            <ExerciseInfoSheet exercise={infoExercise} isOpen={!!infoExercise} onClose={() => setInfoExercise(null)} />
        </div>
    );
}

// ══════════════════════════════════════════
// CHALLENGE PROGRAM — Main export
// ══════════════════════════════════════════
export function ChallengeProgram({
    challengeTitle, challengeEmoji, tasks, onCompleteTask, onBack, completingTaskId,
}: ChallengeProgramProps) {
    const { t } = useI18n();
    const [activeTask, setActiveTask] = useState<ChallengeTask | null>(null);
    const [completions, setCompletions] = useState<Record<string, string>>({});

    // Load 24h completions
    useEffect(() => {
        try { setCompletions(JSON.parse(localStorage.getItem("optiz-completions") || "{}")); } catch { }
    }, []);

    const isCompletedToday = (taskId: string) => {
        const d = completions[taskId];
        if (!d) return false;
        return (Date.now() - new Date(d).getTime()) < 24 * 60 * 60 * 1000;
    };

    const completed = tasks.filter(t => t.completed || isCompletedToday(t.id)).length;
    const total = tasks.length;
    const progressPercent = total > 0 ? (completed / total) * 100 : 0;
    const totalXpEarned = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xpReward, 0);
    const totalXpPossible = tasks.reduce((sum, t) => sum + t.xpReward, 0);

    // If tracking a workout
    if (activeTask) {
        return (
            <ActiveWorkoutView
                task={activeTask}
                accentColor={activeTask.color || "#E80000"}
                onBack={() => setActiveTask(null)}
                onFinish={() => {
                    onCompleteTask(activeTask.id);
                    setActiveTask(null);
                    // Reload completions
                    try { setCompletions(JSON.parse(localStorage.getItem("optiz-completions") || "{}")); } catch { }
                }}
            />
        );
    }

    return (
        <div className="pb-8">
            <motion.button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-8 hover:text-gray-12 transition-colors mb-4"
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                {t("back")}
            </motion.button>

            {/* Header with Challenge Image */}
            <motion.div className="rounded-2xl overflow-hidden mb-5 border border-gray-5/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="relative h-36 w-full">
                    <Image src="/Challenge1.jpeg" alt={challengeTitle} fill className="object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--gray-2)] via-[var(--gray-2)]/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-lg font-bold text-white">{challengeTitle}</h2>
                        <p className="text-[10px] text-white/60 font-medium">Programme Haltères / Dips / Tractions · 4 séances</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-3/30">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-8">{t("progress")}</span>
                        <span className="text-gray-11 font-bold tabular-nums">{completed}/{total} séances</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-4/50 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full optiz-gradient-bg" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-8">
                        <span>⚡</span>
                        <span className="font-bold text-gray-11 tabular-nums">{totalXpEarned}</span>
                        <span>/ {totalXpPossible} {t("xpLabel")}</span>
                    </div>
                </div>
            </motion.div>

            {/* Session Cards */}
            <h3 className="text-[10px] font-bold text-gray-7 mb-3 uppercase tracking-widest">Séances</h3>
            <motion.div className="space-y-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {tasks.map((task, i) => {
                    const exercises = task.exercises || [];
                    const accentColor = task.color || "#E80000";
                    const doneToday = isCompletedToday(task.id) || task.completed;

                    return (
                        <motion.div key={task.id}
                            className={`rounded-2xl overflow-hidden transition-all cursor-pointer ${doneToday ? "opacity-50" : "hover:scale-[1.01]"}`}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                            onClick={() => { if (!doneToday) setActiveTask(task); }}
                            whileTap={doneToday ? undefined : { scale: 0.98 }}>
                            <div className="bg-gray-3/30 border border-gray-5/30 rounded-2xl overflow-hidden">
                                <div className="flex items-stretch">
                                    <div className="w-1.5 shrink-0" style={{ background: doneToday ? "#10B981" : accentColor }} />
                                    <div className="flex-1 p-3.5">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2.5">
                                                {doneToday ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: `${accentColor}15`, border: `1.5px solid ${accentColor}30` }}>
                                                        {task.emoji}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-[13px] font-bold text-gray-12 leading-tight">{task.name.replace(/^[🟥🟦🟩🟪]\s*/, "")}</h4>
                                                    <p className="text-[10px] text-gray-7 mt-0.5">{exercises.length} exercices</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {doneToday && (
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Fait ✓</span>
                                                )}
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                                                    style={{ background: doneToday ? "var(--gray-3)" : `${accentColor}10`, color: doneToday ? "var(--gray-6)" : accentColor, border: `1px solid ${doneToday ? "var(--gray-4)" : `${accentColor}20`}` }}>
                                                    +{task.xpReward} XP
                                                </span>
                                                {!doneToday && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-6"><polyline points="9 18 15 12 9 6" /></svg>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {exercises.slice(0, 3).map((ex, j) => (
                                                <span key={j} className="text-[9px] text-gray-8 bg-gray-4/40 px-2 py-0.5 rounded-md font-medium">{ex.name.split("(")[0].trim()}</span>
                                            ))}
                                            {exercises.length > 3 && <span className="text-[9px] text-gray-6 bg-gray-4/30 px-2 py-0.5 rounded-md font-medium">+{exercises.length - 3}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {completed === total && total > 0 && (
                <motion.div className="mt-6 text-center py-5 rounded-2xl bg-gray-3/20 border border-gray-5/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <span className="text-3xl block mb-2">🎉</span>
                    <h3 className="text-sm font-bold text-gray-12">{t("allDone")}</h3>
                    <p className="text-[11px] text-gray-8 mt-1">{t("xpEarned", { n: totalXpEarned })}</p>
                </motion.div>
            )}
        </div>
    );
}
