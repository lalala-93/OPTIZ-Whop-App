"use client";

import { motion } from "framer-motion";
import { XPRing } from "./XPRing";
import { StreakDisplay } from "./StreakDisplay";
import { useState, useMemo } from "react";
import type { RankTier, TodoItem } from "./rankSystem";
import { MOTIVATIONAL_QUOTES } from "./rankSystem";

interface HomeScreenProps {
    level: number;
    totalXp: number;
    currentLevelXp: number;
    xpForNextLevel: number;
    progressPercent: number;
    tier: RankTier;
    rankFullName: string;
    rankColors: [string, string];
    streakDays: number;
    weeklyProgress: boolean[];
    todos: TodoItem[];
    onToggleTodo: (id: string) => void;
    onAddTodo: (text: string) => void;
    onDeleteTodo: (id: string) => void;
}

export function HomeScreen({
    level,
    totalXp,
    currentLevelXp,
    xpForNextLevel,
    progressPercent,
    tier,
    rankFullName,
    rankColors,
    streakDays,
    weeklyProgress,
    todos,
    onToggleTodo,
    onAddTodo,
    onDeleteTodo,
}: HomeScreenProps) {
    const [newTodo, setNewTodo] = useState("");
    const [showInput, setShowInput] = useState(false);

    const quote = useMemo(() => {
        const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length;
        return MOTIVATIONAL_QUOTES[dayIndex];
    }, []);

    const handleAddTodo = () => {
        if (!newTodo.trim()) return;
        onAddTodo(newTodo.trim());
        setNewTodo("");
        setShowInput(false);
    };

    return (
        <div className="flex flex-col items-center gap-6 pb-8 px-1">
            {/* ── XP Ring + Level ── */}
            <motion.div
                className="flex flex-col items-center pt-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <XPRing
                    progressPercent={progressPercent}
                    currentXp={currentLevelXp}
                    xpForNextLevel={xpForNextLevel}
                    tier={tier}
                    rankColors={rankColors}
                    size={190}
                />

                <motion.div
                    className="text-center mt-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-3xl font-black text-gray-12 tracking-tight">
                        Level <span style={{ color: rankColors[1] }}>{level}</span>
                    </h2>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: rankColors[0] }}>
                        {rankFullName}
                    </p>
                </motion.div>
            </motion.div>

            {/* ── Streak Display ── */}
            <div className="w-full">
                <StreakDisplay streakDays={streakDays} weeklyProgress={weeklyProgress} />
            </div>

            {/* ── Motivational Quote ── */}
            <motion.div
                className="w-full rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-gray-3/40 border border-gray-5/50"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                {/* Left accent bar */}
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full optiz-gradient-bg" />

                <div className="flex items-start gap-3 pl-3">
                    <div>
                        <p className="text-[13px] text-gray-11 italic leading-relaxed">
                            &ldquo;{quote.text}&rdquo;
                        </p>
                        <p className="text-[11px] text-gray-7 mt-1.5 font-medium">
                            — {quote.author}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ── Simple Todo List ── */}
            <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-12">My To-do</h3>
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-3 border border-gray-5 text-gray-11 hover:bg-gray-4 hover:border-gray-6 transition-all active:scale-95"
                    >
                        + Add
                    </button>
                </div>

                {/* Add input */}
                {showInput && (
                    <motion.div
                        className="flex gap-2 mb-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                            placeholder="What needs to be done?"
                            autoFocus
                            className="flex-1 bg-gray-3 border border-gray-5 rounded-xl px-3.5 py-2.5 text-sm text-gray-12 placeholder:text-gray-8 focus:outline-none focus:border-[var(--optiz-red)]/50 focus:ring-1 focus:ring-[var(--optiz-red)]/20 transition-all"
                        />
                        <button
                            onClick={handleAddTodo}
                            disabled={!newTodo.trim()}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold optiz-gradient-bg text-white disabled:opacity-30 transition-all active:scale-95 shrink-0"
                        >
                            Add
                        </button>
                    </motion.div>
                )}

                {/* Todo items */}
                <div className="space-y-2">
                    {todos.length === 0 && !showInput && (
                        <p className="text-center text-sm text-gray-8 py-6">
                            No tasks yet. Tap + Add to get started.
                        </p>
                    )}
                    {todos.map((todo, i) => (
                        <motion.div
                            key={todo.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all group ${todo.completed
                                ? "bg-gray-2 opacity-50"
                                : "optiz-surface hover:bg-[var(--optiz-surface-hover)]"
                                }`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                            layout
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => onToggleTodo(todo.id)}
                                className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${todo.completed
                                    ? "bg-[#E80000] border-[#E80000]"
                                    : "border-gray-6 hover:border-gray-8"
                                    }`}
                            >
                                {todo.completed && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>

                            {/* Text */}
                            <span className={`flex-1 text-sm ${todo.completed
                                ? "line-through text-gray-7"
                                : "text-gray-12"
                                }`}>
                                {todo.text}
                            </span>

                            {/* Delete */}
                            <button
                                onClick={() => onDeleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-8 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-500/10"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
