"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ChallengeTask, Exercise } from "./rankSystem";
import { useI18n } from "./i18n";
import {
    DumbbellIcon, PullUpIcon, DipIcon, PushUpIcon, SquatIcon,
    LungeIcon, DeadliftIcon, PlankIcon, TimerIcon,
    PlayIcon, PauseIcon, SkipIcon, ResetIcon,
} from "./SportIcons";
import {
    playBeepSound, playStartSound, playCompleteSound, playFinishSound,
    isSoundEnabled, setSoundEnabled,
} from "./sounds";

// ── Helpers ──

function getExerciseIcon(name: string, size = 18, className = "") {
    const n = name.toLowerCase();
    if (n.includes("dip")) return <DipIcon size={size} className={className} />;
    if (n.includes("traction") || n.includes("pull") || n.includes("chin")) return <PullUpIcon size={size} className={className} />;
    if (n.includes("pompe") || n.includes("push")) return <PushUpIcon size={size} className={className} />;
    if (n.includes("squat") || n.includes("goblet")) return <SquatIcon size={size} className={className} />;
    if (n.includes("fente") || n.includes("bulgare") || n.includes("lunge")) return <LungeIcon size={size} className={className} />;
    if (n.includes("deadlift") || n.includes("romanian") || n.includes("hip thrust")) return <DeadliftIcon size={size} className={className} />;
    if (n.includes("chaise") || n.includes("hang") || n.includes("hold") || n.includes("plank") || n.includes("gainage")) return <PlankIcon size={size} className={className} />;
    if (n.includes("emom")) return <TimerIcon size={size} className={className} />;
    return <DumbbellIcon size={size} className={className} />;
}

function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Props ──

interface ChallengeProgramProps {
    challengeTitle: string;
    challengeEmoji: string;
    tasks: ChallengeTask[];
    onCompleteTask: (taskId: string) => void;
    onBack: () => void;
    completingTaskId: string | null;
}

// ═══════════════════════════════════════════════
// EXERCISE INFO SHEET — Clean bottom sheet
// ═══════════════════════════════════════════════

function ExerciseInfoSheet({ exercise, isOpen, onClose }: { exercise: Exercise | null; isOpen: boolean; onClose: () => void }) {
    if (!exercise) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-gray-6" />
                        </div>
                        <div className="px-5 pt-3 pb-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-3 border border-gray-5/40 flex items-center justify-center text-gray-11">
                                        {getExerciseIcon(exercise.name, 20)}
                                    </div>
                                    <h3 className="text-base font-bold text-gray-12">{exercise.name}</h3>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-4 flex items-center justify-center text-gray-9 hover:text-gray-12 transition-colors"
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-3/50 border border-gray-5/30 rounded-xl p-4">
                                    <span className="text-[10px] text-gray-7 font-bold uppercase tracking-wider block mb-1">Muscles ciblés</span>
                                    <p className="text-sm text-gray-12 font-medium">{exercise.muscles}</p>
                                </div>
                                <div className="bg-gray-3/50 border border-gray-5/30 rounded-xl p-4">
                                    <span className="text-[10px] text-gray-7 font-bold uppercase tracking-wider block mb-1">Objectif</span>
                                    <p className="text-sm text-gray-12 font-medium">{exercise.sets}</p>
                                </div>
                                <a
                                    href={exercise.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-gray-3/50 border border-gray-5/30 rounded-xl p-4 hover:bg-gray-4/50 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#E80000]/10 border border-[#E80000]/20 flex items-center justify-center group-hover:bg-[#E80000]/15 transition-colors">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#E80000">
                                            <polygon points="9.5,7 9.5,17 18,12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-12 block">Voir la démo</span>
                                        <span className="text-[10px] text-gray-7">Ouvrir sur YouTube</span>
                                    </div>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-gray-6">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════════
// CIRCULAR TIMER — Central EMOM countdown ring
// ═══════════════════════════════════════════════

function CircularTimer({ timeLeft, totalTime, isPaused }: { timeLeft: number; totalTime: number; isPaused: boolean }) {
    const radius = 72;
    const stroke = 5;
    const center = radius + stroke + 4;
    const svgSize = center * 2;
    const circumference = 2 * Math.PI * radius;
    const progress = totalTime > 0 ? (timeLeft / totalTime) : 1;
    const offset = circumference * (1 - progress);

    return (
        <div className="relative flex items-center justify-center">
            <svg width={svgSize} height={svgSize} className="transform -rotate-90">
                {/* Background ring */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--gray-4)" strokeWidth={stroke} opacity={0.4} />
                {/* Progress ring */}
                <motion.circle
                    cx={center} cy={center} r={radius} fill="none"
                    stroke={timeLeft <= 3 ? "#E80000" : "var(--gray-11)"}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s ease" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className={`text-5xl font-mono font-black tracking-tighter ${timeLeft <= 3 ? "text-[#E80000]" : "text-gray-12"}`}
                    animate={timeLeft <= 3 && !isPaused ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    {fmt(timeLeft)}
                </motion.span>
                {isPaused && (
                    <motion.span
                        className="text-[10px] font-bold text-gray-7 uppercase tracking-widest mt-1"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    >
                        En pause
                    </motion.span>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════
// EMOM WORKOUT — Full single-screen workout tracker
// ═══════════════════════════════════════════════

interface EMOMConfig {
    roundDuration: number; // seconds per exercise (default 60)
    exercises: { name: string; sets: string; reps: string; muscles: string; youtubeUrl: string }[];
}

function EMOMWorkout({ task, onFinish, onBack }: {
    task: ChallengeTask;
    onFinish: () => void;
    onBack: () => void;
}) {
    const exercises = task.exercises || [];
    const [config, setConfig] = useState<EMOMConfig>(() => ({
        roundDuration: 60,
        exercises: exercises.map(ex => ({ ...ex, reps: ex.sets })),
    }));

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [elapsed, setElapsed] = useState(0); // total elapsed seconds
    const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
    const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastBeepRef = useRef(-1);

    const totalDuration = config.exercises.length * config.roundDuration;
    const currentExIndex = Math.min(Math.floor(elapsed / config.roundDuration), config.exercises.length - 1);
    const timeInCurrentRound = elapsed % config.roundDuration;
    const timeLeftInRound = config.roundDuration - timeInCurrentRound;
    const isWorkoutDone = elapsed >= totalDuration;

    // Timer tick
    useEffect(() => {
        if (isRunning && !isWorkoutDone) {
            intervalRef.current = setInterval(() => {
                setElapsed(prev => {
                    const next = prev + 1;
                    if (next >= totalDuration) {
                        setIsRunning(false);
                        playFinishSound();
                    }
                    return Math.min(next, totalDuration);
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, isWorkoutDone, totalDuration]);

    // Sound effects on transitions
    useEffect(() => {
        if (!isRunning || !hasStarted) return;
        // 3-2-1 countdown beeps
        if (timeLeftInRound <= 3 && timeLeftInRound > 0 && lastBeepRef.current !== elapsed) {
            lastBeepRef.current = elapsed;
            playBeepSound();
        }
        // New exercise start
        if (timeInCurrentRound === 0 && elapsed > 0 && elapsed < totalDuration) {
            playStartSound();
        }
    }, [elapsed, isRunning, hasStarted, timeLeftInRound, timeInCurrentRound, totalDuration]);

    const handleStart = () => {
        setIsRunning(true);
        setHasStarted(true);
        setIsEditing(false);
        playStartSound();
    };

    const handlePause = () => setIsRunning(false);
    const handleResume = () => { setIsRunning(true); playStartSound(); };

    const handleReset = () => {
        setIsRunning(false);
        setElapsed(0);
        setHasStarted(false);
        setCompletedExercises(new Set());
        lastBeepRef.current = -1;
    };

    const handleSkip = () => {
        const nextStart = (currentExIndex + 1) * config.roundDuration;
        if (nextStart < totalDuration) {
            setElapsed(nextStart);
            playStartSound();
        }
    };

    const handleCheckExercise = (index: number) => {
        setCompletedExercises(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else { next.add(index); playCompleteSound(); }
            return next;
        });
    };

    const handleFinish = () => {
        // Mark 24h completion
        const completions = JSON.parse(localStorage.getItem("optiz-completions") || "{}");
        completions[task.id] = new Date().toISOString();
        localStorage.setItem("optiz-completions", JSON.stringify(completions));
        playFinishSound();
        onFinish();
    };

    const handleToggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSoundEnabled(next);
    };

    const handleRoundDurationChange = (delta: number) => {
        setConfig(prev => ({
            ...prev,
            roundDuration: Math.max(30, Math.min(120, prev.roundDuration + delta)),
        }));
    };

    // ── Editing mode: pre-workout setup ──
    if (isEditing) {
        return (
            <div className="pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <motion.button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 transition-colors"
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Retour
                    </motion.button>
                    <span className="text-xs font-bold text-gray-7 uppercase tracking-wider">Configurer l&apos;EMOM</span>
                </div>

                {/* Round duration */}
                <div className="bg-gray-3/30 border border-gray-5/30 rounded-2xl p-4 mb-4">
                    <span className="text-[10px] font-bold text-gray-7 uppercase tracking-wider block mb-3">Durée par exercice</span>
                    <div className="flex items-center justify-between">
                        <motion.button
                            onClick={() => handleRoundDurationChange(-10)}
                            className="w-10 h-10 rounded-xl bg-gray-4/60 flex items-center justify-center text-gray-9 hover:text-gray-12 transition-colors"
                            whileTap={{ scale: 0.9 }}
                        >
                            <span className="text-lg font-bold">−</span>
                        </motion.button>
                        <div className="text-center">
                            <span className="text-3xl font-mono font-black text-gray-12">{config.roundDuration}</span>
                            <span className="text-xs text-gray-7 block mt-0.5">secondes</span>
                        </div>
                        <motion.button
                            onClick={() => handleRoundDurationChange(10)}
                            className="w-10 h-10 rounded-xl bg-gray-4/60 flex items-center justify-center text-gray-9 hover:text-gray-12 transition-colors"
                            whileTap={{ scale: 0.9 }}
                        >
                            <span className="text-lg font-bold">+</span>
                        </motion.button>
                    </div>
                </div>

                {/* Exercise list */}
                <span className="text-[10px] font-bold text-gray-7 uppercase tracking-wider block mb-3">Exercices ({config.exercises.length})</span>
                <div className="space-y-2">
                    {config.exercises.map((ex, i) => (
                        <div key={i} className="bg-gray-3/30 border border-gray-5/30 rounded-xl p-3.5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-4/50 flex items-center justify-center text-gray-9">
                                {getExerciseIcon(ex.name, 16)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-gray-12 truncate">{ex.name}</p>
                                <p className="text-[10px] text-gray-7">{ex.muscles}</p>
                            </div>
                            <input
                                type="text"
                                value={ex.reps}
                                onChange={e => {
                                    setConfig(prev => ({
                                        ...prev,
                                        exercises: prev.exercises.map((exr, j) =>
                                            j === i ? { ...exr, reps: e.target.value } : exr
                                        ),
                                    }));
                                }}
                                className="w-20 h-8 bg-gray-4/50 border border-gray-5/40 rounded-lg text-center text-[11px] font-bold text-gray-12 focus:outline-none focus:border-[#E80000]/50 transition-colors"
                                placeholder="Reps"
                            />
                        </div>
                    ))}
                </div>

                {/* Total duration info */}
                <div className="mt-4 text-center">
                    <span className="text-xs text-gray-7">Durée totale : </span>
                    <span className="text-xs font-bold text-gray-11">{fmt(config.exercises.length * config.roundDuration)}</span>
                </div>

                {/* Start button */}
                <motion.button
                    onClick={handleStart}
                    className="w-full mt-5 py-3.5 rounded-xl font-bold text-sm text-white optiz-gradient-bg transition-all"
                    whileTap={{ scale: 0.97 }}
                >
                    Lancer l&apos;EMOM
                </motion.button>
            </div>
        );
    }

    // ── Pre-start screen (not editing, not started) ──
    if (!hasStarted) {
        const sessionName = task.name.replace(/^[🟥🟦🟩🟪]\s*/, "");

        return (
            <div className="pb-8">
                {/* Back */}
                <motion.button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 transition-colors mb-5"
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Retour
                </motion.button>

                {/* Session header */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                        style={{ background: `${task.color || "#E80000"}12`, border: `1.5px solid ${task.color || "#E80000"}25` }}>
                        <DumbbellIcon size={28} className="text-gray-11" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-12">{sessionName}</h2>
                    <p className="text-xs text-gray-7 mt-1.5">
                        {exercises.length} exercices · {fmt(exercises.length * config.roundDuration)} · +{task.xpReward} XP
                    </p>
                </motion.div>

                {/* Exercise preview list */}
                <div className="space-y-2 mb-6">
                    {exercises.map((ex, i) => (
                        <motion.div
                            key={i}
                            className="bg-gray-3/30 border border-gray-5/25 rounded-xl p-3.5 flex items-center gap-3"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + i * 0.04 }}
                        >
                            <div className="w-9 h-9 rounded-xl bg-gray-4/40 flex items-center justify-center text-gray-9 shrink-0">
                                {getExerciseIcon(ex.name, 18)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-12 truncate">{ex.name}</p>
                                <p className="text-[10px] text-gray-7 mt-0.5">{ex.sets} · {ex.muscles}</p>
                            </div>
                            <motion.button
                                onClick={() => setInfoExercise(ex)}
                                className="w-8 h-8 rounded-full bg-gray-4/40 flex items-center justify-center text-gray-7 hover:text-gray-11 transition-colors shrink-0"
                                whileTap={{ scale: 0.85 }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {/* Actions */}
                <motion.div
                    className="space-y-2.5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                >
                    <motion.button
                        onClick={handleStart}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] text-white optiz-gradient-bg flex items-center justify-center gap-2.5 transition-all"
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.01 }}
                    >
                        <PlayIcon size={18} />
                        Lancer l&apos;EMOM
                    </motion.button>
                    <motion.button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3.5 rounded-2xl font-semibold text-sm text-gray-11 bg-gray-3/50 border border-gray-5/40 hover:bg-gray-4/60 flex items-center justify-center gap-2 transition-all"
                        whileTap={{ scale: 0.97 }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Modifier le programme
                    </motion.button>
                </motion.div>

                <ExerciseInfoSheet exercise={infoExercise} isOpen={!!infoExercise} onClose={() => setInfoExercise(null)} />
            </div>
        );
    }

    // ── Active EMOM workout ──
    const currentEx = config.exercises[currentExIndex];
    const allChecked = completedExercises.size === config.exercises.length;

    return (
        <div className="pb-28 -mx-4 sm:-mx-6">
            {/* Sticky header */}
            <div className="sticky top-0 z-20 bg-gray-1/95 backdrop-blur-xl border-b border-gray-5/20 px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between">
                    <motion.button
                        onClick={() => { handleReset(); }}
                        className="flex items-center gap-1 text-sm text-gray-8 hover:text-gray-12 transition-colors"
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Arrêter
                    </motion.button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-7 tabular-nums">
                            {currentExIndex + 1}/{config.exercises.length}
                        </span>
                        <motion.button
                            onClick={handleToggleSound}
                            className="w-8 h-8 rounded-full bg-gray-3/60 flex items-center justify-center text-gray-7 hover:text-gray-11 transition-colors"
                            whileTap={{ scale: 0.85 }}
                        >
                            {soundOn ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                                    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            )}
                        </motion.button>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="h-[3px] w-full bg-gray-4/30 rounded-full mt-2.5 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full optiz-gradient-bg"
                        animate={{ width: `${(elapsed / totalDuration) * 100}%` }}
                        transition={{ duration: 0.3, ease: "linear" }}
                    />
                </div>
            </div>

            <div className="px-4 sm:px-6">
                {/* Timer section */}
                <motion.div
                    className="flex flex-col items-center pt-6 pb-4"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                >
                    {isWorkoutDone ? (
                        <motion.div
                            className="text-center"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="w-36 h-36 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-12">Terminé !</h3>
                            <p className="text-xs text-gray-7 mt-1">+{task.xpReward} XP</p>
                        </motion.div>
                    ) : (
                        <>
                            <CircularTimer
                                timeLeft={timeLeftInRound}
                                totalTime={config.roundDuration}
                                isPaused={!isRunning}
                            />

                            {/* Current exercise name */}
                            <motion.div
                                className="mt-4 text-center"
                                key={currentExIndex}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <div className="text-gray-9">
                                        {getExerciseIcon(currentEx.name, 16)}
                                    </div>
                                    <h3 className="text-[15px] font-bold text-gray-12">{currentEx.name}</h3>
                                </div>
                                <p className="text-[11px] text-gray-7">{currentEx.reps || currentEx.sets}</p>
                            </motion.div>

                            {/* Controls */}
                            <div className="flex items-center gap-4 mt-5">
                                <motion.button
                                    onClick={handleReset}
                                    className="w-11 h-11 rounded-full bg-gray-3/60 border border-gray-5/30 flex items-center justify-center text-gray-8 hover:text-gray-12 transition-colors"
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <ResetIcon size={16} />
                                </motion.button>
                                <motion.button
                                    onClick={isRunning ? handlePause : handleResume}
                                    className="w-14 h-14 rounded-full optiz-gradient-bg flex items-center justify-center text-white shadow-lg"
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {isRunning ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
                                </motion.button>
                                <motion.button
                                    onClick={handleSkip}
                                    className="w-11 h-11 rounded-full bg-gray-3/60 border border-gray-5/30 flex items-center justify-center text-gray-8 hover:text-gray-12 transition-colors"
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <SkipIcon size={16} />
                                </motion.button>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Divider */}
                <div className="h-px bg-gray-5/20 my-3" />

                {/* Exercise list */}
                <div className="space-y-1.5">
                    {config.exercises.map((ex, i) => {
                        const isCurrent = i === currentExIndex && !isWorkoutDone;
                        const isDone = completedExercises.has(i);
                        const isPast = !isWorkoutDone && i < currentExIndex;

                        return (
                            <motion.div
                                key={i}
                                className={`rounded-xl p-3 flex items-center gap-3 transition-all ${
                                    isCurrent
                                        ? "bg-gray-3/50 border border-gray-5/40"
                                        : isDone
                                            ? "bg-emerald-500/5 border border-emerald-500/15"
                                            : "border border-transparent"
                                }`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: isPast && !isDone ? 0.4 : 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                {/* Check button */}
                                <motion.button
                                    onClick={() => handleCheckExercise(i)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                        isDone
                                            ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : isCurrent
                                                ? "bg-gray-4/60 border border-gray-5/40"
                                                : "bg-gray-4/30"
                                    }`}
                                    whileTap={{ scale: 0.8 }}
                                >
                                    {isDone ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-6">{i + 1}</span>
                                    )}
                                </motion.button>

                                {/* Exercise info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] font-semibold truncate ${isDone ? "text-emerald-400 line-through" : "text-gray-12"}`}>
                                        {ex.name}
                                    </p>
                                    <p className="text-[10px] text-gray-7 mt-0.5">{ex.reps || ex.sets}</p>
                                </div>

                                {/* Info button */}
                                <motion.button
                                    onClick={() => setInfoExercise(exercises[i])}
                                    className="w-7 h-7 rounded-full bg-gray-4/30 flex items-center justify-center text-gray-7 hover:text-gray-11 transition-colors shrink-0"
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--gray-1)] via-[var(--gray-1)]/95 to-transparent pointer-events-none flex justify-center z-20">
                <motion.button
                    onClick={handleFinish}
                    className={`pointer-events-auto w-full max-w-sm py-3.5 rounded-xl font-bold text-sm transition-all ${
                        isWorkoutDone || allChecked
                            ? "optiz-gradient-bg text-white"
                            : "bg-gray-3 border border-gray-5/40 text-gray-8"
                    }`}
                    whileTap={{ scale: 0.97 }}
                >
                    {isWorkoutDone || allChecked
                        ? `Terminer · +${task.xpReward} XP`
                        : `Terminer (${completedExercises.size}/${config.exercises.length})`
                    }
                </motion.button>
            </div>

            <ExerciseInfoSheet exercise={infoExercise} isOpen={!!infoExercise} onClose={() => setInfoExercise(null)} />
        </div>
    );
}

// ═══════════════════════════════════════════════
// CHALLENGE PROGRAM — Main export
// ═══════════════════════════════════════════════

export function ChallengeProgram({
    challengeTitle, challengeEmoji, tasks, onCompleteTask, onBack, completingTaskId,
}: ChallengeProgramProps) {
    const { t } = useI18n();
    const [activeTask, setActiveTask] = useState<ChallengeTask | null>(null);
    const [completions, setCompletions] = useState<Record<string, string>>({});

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

    // Active workout view
    if (activeTask) {
        return (
            <EMOMWorkout
                task={activeTask}
                onBack={() => setActiveTask(null)}
                onFinish={() => {
                    onCompleteTask(activeTask.id);
                    setActiveTask(null);
                    try { setCompletions(JSON.parse(localStorage.getItem("optiz-completions") || "{}")); } catch { }
                }}
            />
        );
    }

    // ── Program overview ──
    const accentColors = ["#E80000", "#3B82F6", "#10B981", "#8B5CF6"];

    return (
        <div className="pb-8">
            {/* Back */}
            <motion.button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-gray-8 hover:text-gray-12 transition-colors mb-5"
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.95 }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                {t("back")}
            </motion.button>

            {/* Hero card */}
            <motion.div
                className="rounded-2xl overflow-hidden mb-6 border border-gray-5/20"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
                <div className="relative h-32 w-full">
                    <Image src="/Challenge1.jpeg" alt={challengeTitle} fill className="object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--gray-2)] via-[var(--gray-2)]/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-lg font-bold text-white">{challengeTitle}</h2>
                        <p className="text-[10px] text-white/50 font-medium mt-0.5">
                            Programme Haltères / Dips / Tractions · {total} séances
                        </p>
                    </div>
                </div>
                <div className="p-4 bg-gray-3/20">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-7 font-medium">{t("progress")}</span>
                        <span className="text-gray-11 font-bold tabular-nums">{completed}/{total} séances</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-4/40 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full optiz-gradient-bg"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E80000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" />
                        </svg>
                        <span className="text-[11px] font-bold text-gray-11 tabular-nums">{totalXpEarned}</span>
                        <span className="text-[11px] text-gray-7">/ {totalXpPossible} {t("xpLabel")}</span>
                    </div>
                </div>
            </motion.div>

            {/* Session cards */}
            <span className="text-[10px] font-bold text-gray-7 uppercase tracking-widest block mb-3">Séances</span>
            <div className="space-y-2.5">
                {tasks.map((task, i) => {
                    const exercises = task.exercises || [];
                    const accent = task.color || accentColors[i % accentColors.length];
                    const doneToday = isCompletedToday(task.id) || task.completed;
                    const sessionName = task.name.replace(/^[🟥🟦🟩🟪]\s*/, "");

                    return (
                        <motion.div
                            key={task.id}
                            className={`rounded-2xl overflow-hidden transition-all ${doneToday ? "opacity-50" : "hover:scale-[1.005]"}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: doneToday ? 0.5 : 1, y: 0 }}
                            transition={{ delay: 0.08 + i * 0.06 }}
                            onClick={() => { if (!doneToday) setActiveTask(task); }}
                            whileTap={doneToday ? undefined : { scale: 0.98 }}
                            style={{ cursor: doneToday ? "default" : "pointer" }}
                        >
                            <div className="bg-gray-3/20 border border-gray-5/20 rounded-2xl overflow-hidden">
                                <div className="flex items-stretch">
                                    <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: doneToday ? "#10B981" : accent }} />
                                    <div className="flex-1 p-3.5">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                    doneToday ? "bg-emerald-500/10" : "bg-gray-4/40"
                                                }`}>
                                                    {doneToday ? (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    ) : (
                                                        <DumbbellIcon size={18} className="text-gray-9" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-bold text-gray-12 leading-tight">{sessionName}</h4>
                                                    <p className="text-[10px] text-gray-7 mt-0.5">{exercises.length} exercices</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {doneToday && (
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/8 px-2 py-1 rounded-md border border-emerald-500/15">Fait</span>
                                                )}
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                                                    style={{
                                                        background: doneToday ? "var(--gray-3)" : `${accent}08`,
                                                        color: doneToday ? "var(--gray-6)" : accent,
                                                        border: `1px solid ${doneToday ? "var(--gray-4)" : `${accent}15`}`,
                                                    }}>
                                                    +{task.xpReward} XP
                                                </span>
                                                {!doneToday && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-6">
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {exercises.slice(0, 3).map((ex, j) => (
                                                <span key={j} className="text-[9px] text-gray-8 bg-gray-4/30 px-2 py-0.5 rounded-md font-medium">
                                                    {ex.name.split("(")[0].trim()}
                                                </span>
                                            ))}
                                            {exercises.length > 3 && (
                                                <span className="text-[9px] text-gray-6 bg-gray-4/20 px-2 py-0.5 rounded-md font-medium">
                                                    +{exercises.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* All done */}
            {completed === total && total > 0 && (
                <motion.div
                    className="mt-6 text-center py-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/15"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-12">{t("allDone")}</h3>
                    <p className="text-[11px] text-gray-8 mt-1">{t("xpEarned", { n: totalXpEarned })}</p>
                </motion.div>
            )}
        </div>
    );
}
