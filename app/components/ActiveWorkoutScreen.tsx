"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { WorkoutSession, Exercise } from "../lib/workout-data";
import { ExerciseCard } from "./ExerciseCard";
import { RestTimer } from "./RestTimer";

interface ActiveWorkoutScreenProps {
    session: WorkoutSession;
    onBack: () => void;
    onFinishWorkout: (xpEarned: number) => void;
    onOpenInfo: (exercise: Exercise) => void;
}

export function ActiveWorkoutScreen({ session, onBack, onFinishWorkout, onOpenInfo }: ActiveWorkoutScreenProps) {
    // We need state for each specific set of each specific exercise.
    // We'll key it by `${exerciseId}-${setIndex}`
    const [setsState, setSetsState] = useState<Record<string, { kg: string; reps: string; isCompleted: boolean }>>({});

    // Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(90); // Default 1m30s rest

    // Initialize sets or load from localStorage (to persist if they close the app by accident)
    useEffect(() => {
        const saved = localStorage.getItem(`workout-in-progress-${session.id}`);
        if (saved) {
            try {
                setSetsState(JSON.parse(saved));
                return;
            } catch (e) {
                console.error("Failed to parse saved workout", e);
            }
        }

        // Default initialization
        const initial: typeof setsState = {};
        session.exercises.forEach(ex => {
            for (let i = 0; i < ex.sets; i++) {
                // Parse default target reps (e.g. "8-12" -> "8")
                const targetReps = ex.reps.split('-')[0] || "";
                initial[`${ex.id}-${i}`] = { kg: "", reps: isNaN(Number(targetReps)) ? "" : targetReps, isCompleted: false };
            }
        });
        setSetsState(initial);
    }, [session]);

    const saveState = (newState: typeof setsState) => {
        setSetsState(newState);
        localStorage.setItem(`workout-in-progress-${session.id}`, JSON.stringify(newState));
    };

    const handleSetChange = (exerciseId: string, setIndex: number, field: "kg" | "reps", value: string) => {
        const key = `${exerciseId}-${setIndex}`;
        const newState = {
            ...setsState,
            [key]: { ...setsState[key], [field]: value }
        };
        saveState(newState);
    };

    const handleSetToggle = (exerciseId: string, setIndex: number) => {
        const key = `${exerciseId}-${setIndex}`;
        const currentState = setsState[key];
        const willBeCompleted = !currentState.isCompleted;

        const newState = {
            ...setsState,
            [key]: { ...currentState, isCompleted: willBeCompleted }
        };
        saveState(newState);

        if (willBeCompleted) {
            // Trigger Rest Timer
            setTimerActive(false); // Reset it first to trigger effect 
            setTimeout(() => {
                setTimerSeconds(90);
                setTimerActive(true);
            }, 50);
        }
    };

    const calculateTotalVolume = () => {
        let vol = 0;
        Object.values(setsState).forEach(s => {
            if (s.isCompleted && s.kg && s.reps) {
                vol += Number(s.kg) * Number(s.reps);
            }
        });
        return vol;
    };

    const completedSetsCount = Object.values(setsState).filter(s => s.isCompleted).length;
    const totalSetsCount = session.exercises.reduce((acc, ex) => acc + ex.sets, 0);

    const handleFinish = () => {
        // Arbitrary XP: 10 base + 5 per completed set
        const xp = 10 + (completedSetsCount * 5);
        localStorage.removeItem(`workout-in-progress-${session.id}`);

        // Save completion date for 24h reset
        const completions = JSON.parse(localStorage.getItem('workout-completions') || '{}');
        completions[session.id] = new Date().toISOString();
        localStorage.setItem('workout-completions', JSON.stringify(completions));

        onFinishWorkout(xp);
    };

    return (
        <div className="relative min-h-screen bg-black w-full pb-32">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-black text-white italic tracking-wide uppercase">{session.name.replace(/^[^\s]+\s/, '')}</h1>
                    <p className="text-xs text-[--color-optiz-muted] font-bold">
                        {completedSetsCount} / {totalSetsCount} Sets Completed
                    </p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">
                {session.exercises.map(exercise => {
                    // Extract the array of states for this specific exercise
                    const expStates = Array.from({ length: exercise.sets }).map((_, i) => {
                        const key = `${exercise.id}-${i}`;
                        return setsState[key] || { kg: "", reps: "", isCompleted: false };
                    });

                    return (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            setStates={expStates}
                            onSetChange={(idx, field, val) => handleSetChange(exercise.id, idx, field, val)}
                            onSetToggle={(idx) => handleSetToggle(exercise.id, idx)}
                            onInfoClick={onOpenInfo}
                        />
                    );
                })}
            </div>

            {/* Floating Complete Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none flex justify-center z-20">
                <button
                    onClick={handleFinish}
                    className="pointer-events-auto w-full max-w-sm py-4 rounded-2xl font-black text-white text-lg bg-gradient-to-r from-[--color-optiz-red] to-[--color-optiz-orange] hover:shadow-[0_0_20px_rgba(240,80,48,0.4)] transition-all active:scale-[0.98]"
                >
                    {completedSetsCount === totalSetsCount ? 'Terminer & Gagner XP !' : 'Terminer (Incomplet)'}
                </button>
            </div>

            {/* Timer */}
            <RestTimer
                isActive={timerActive}
                initialSeconds={timerSeconds}
                onClose={() => setTimerActive(false)}
            />
        </div>
    );
}
