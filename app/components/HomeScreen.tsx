"use client";

import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from "framer-motion";
import { XPRing } from "./XPRing";
import { StreakDisplay } from "./StreakDisplay";
import { useState, useMemo, useCallback } from "react";
import type { RankTier, TodoItem } from "./rankSystem";
import { MOTIVATIONAL_QUOTES } from "./rankSystem";
import { useI18n } from "./i18n";

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
    onXpRingClick?: () => void;
    todoXpAnim?: { id: string; xp: number } | null;
}

// Helper: detect if we're on a touch device (mobile/phone only)
function useIsTouchPhone() {
    if (typeof window === "undefined") return false;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isPhone = window.innerWidth < 640; // sm breakpoint — phone only
    return isTouch && isPhone;
}

function SwipeableTodoItem({
    todo, onToggle, onDelete, enableSwipe, showConfetti, xpAmount,
}: {
    todo: TodoItem; onToggle: () => void; onDelete: () => void; enableSwipe: boolean;
    showConfetti?: boolean; xpAmount?: number;
}) {
    const x = useMotionValue(0);
    const deleteBg = useTransform(x, [-100, -40, 0], [
        "rgba(200,30,30,0.25)", "rgba(200,30,30,0.1)", "transparent",
    ]);
    const deleteTextOpacity = useTransform(x, [-90, -40, 0], [1, 0.5, 0]);
    const [isSwiping, setIsSwiping] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, height: 0, marginTop: 0 }}
            transition={{ layout: { type: "spring", stiffness: 350, damping: 30 }, opacity: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-xl"
        >
            {/* Delete underlay — phone only */}
            {enableSwipe && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-end px-4 rounded-xl"
                    style={{ backgroundColor: deleteBg }}
                >
                    <motion.div style={{ opacity: deleteTextOpacity }} className="flex items-center gap-1 text-red-400/80">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" />
                        </svg>
                        <span className="text-[10px] font-semibold">Delete</span>
                    </motion.div>
                </motion.div>
            )}

            {/* Swipeable foreground */}
            <motion.div
                className={`flex items-center gap-3 p-3 rounded-xl relative z-10 group ${todo.completed
                    ? "bg-gray-3/25 border border-gray-5/20"
                    : "bg-gray-3/30 border border-gray-5/40"
                    }`}
                style={enableSwipe ? { x, touchAction: "pan-y" } : {}}
                drag={enableSwipe ? "x" : false}
                dragConstraints={enableSwipe ? { left: -100, right: 0 } : undefined}
                dragElastic={0.1}
                onDragStart={() => setIsSwiping(true)}
                onDragEnd={(_, info) => {
                    setIsSwiping(false);
                    if (info.offset.x < -65) onDelete();
                }}
            >
                {/* Checkbox */}
                <div className="relative">
                    <motion.button
                        onClick={() => { if (!isSwiping) onToggle(); }}
                        className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${todo.completed
                                ? "bg-[#E80000] border-[#E80000]"
                                : "border-gray-6 hover:border-gray-8"
                            }`}
                        whileTap={{ scale: 0.8 }}
                    >
                        {todo.completed && (
                            <motion.svg
                                width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </motion.svg>
                        )}
                    </motion.button>

                    {/* Inline confetti particles */}
                    <AnimatePresence>
                        {showConfetti && (
                            <>
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const angle = (i / 6) * Math.PI * 2;
                                    const dist = 18 + Math.random() * 12;
                                    return (
                                        <motion.div
                                            key={`confetti-${i}`}
                                            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
                                            style={{ background: i % 3 === 0 ? "#E80000" : i % 3 === 1 ? "#FFD700" : "#FF6B00" }}
                                            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                                            animate={{
                                                x: Math.cos(angle) * dist,
                                                y: Math.sin(angle) * dist,
                                                opacity: [0, 1, 0],
                                                scale: [0, 1.2, 0],
                                            }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        />
                                    );
                                })}
                                {/* Floating +XP label */}
                                <motion.span
                                    className="absolute -top-1 left-4 text-[10px] font-extrabold text-[#E80000] whitespace-nowrap pointer-events-none"
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: [0, 1, 1, 0], y: -20 }}
                                    transition={{ duration: 0.9, ease: "easeOut" }}
                                >
                                    +{xpAmount || 3} XP
                                </motion.span>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Text — completed tasks readable, not invisible */}
                <span className={`flex-1 text-sm transition-colors duration-300 ${todo.completed ? "line-through text-gray-8" : "text-gray-12"
                    }`}>
                    {todo.text}
                </span>

                {/* Desktop/tablet delete: X button on hover */}
                {!enableSwipe && (
                    <motion.button
                        onClick={onDelete}
                        className="opacity-0 group-hover:opacity-100 text-gray-7 hover:text-red-400 transition-all p-1"
                        whileTap={{ scale: 0.75 }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                )}
            </motion.div>
        </motion.div>
    );
}

export function HomeScreen({
    level, totalXp, currentLevelXp, xpForNextLevel, progressPercent,
    tier, rankFullName, rankColors, streakDays, weeklyProgress,
    todos, onToggleTodo, onAddTodo, onDeleteTodo, onXpRingClick, todoXpAnim,
}: HomeScreenProps) {
    const { t } = useI18n();
    const [newTodo, setNewTodo] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(() =>
        Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length
    );

    const isPhone = useIsTouchPhone();
    const quote = MOTIVATIONAL_QUOTES[quoteIndex];

    const handleAddTodo = useCallback(() => {
        if (!newTodo.trim()) return;
        onAddTodo(newTodo.trim());
        setNewTodo("");
    }, [newTodo, onAddTodo]);

    const refreshQuote = useCallback(() => {
        setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, []);

    const sortedTodos = useMemo(() => {
        return [...todos].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });
    }, [todos]);

    return (
        <div className="flex flex-col items-center gap-6 pb-8 px-1">
            {/* XP Ring + Level */}
            <motion.div
                className="flex flex-col items-center pt-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <XPRing
                    progressPercent={progressPercent}
                    currentXp={currentLevelXp}
                    xpForNextLevel={xpForNextLevel}
                    tier={tier}
                    rankColors={rankColors}
                    size={190}
                    onClick={onXpRingClick}
                />
                <motion.div
                    className="text-center mt-3"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-3xl font-black text-gray-12 tracking-tight">
                        {t("level")} <span style={{ color: rankColors[1] }}>{level}</span>
                    </h2>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: rankColors[0] }}>
                        {rankFullName}
                    </p>
                </motion.div>
            </motion.div>

            {/* Streak */}
            <div className="w-full">
                <StreakDisplay streakDays={streakDays} weeklyProgress={weeklyProgress} />
            </div>

            {/* Quote */}
            <motion.div
                className="w-full rounded-2xl overflow-hidden bg-gray-3/30 border border-gray-5/40"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ borderColor: "rgba(232,0,0,0.15)" }}
            >
                <div className="flex items-start gap-3 p-4">
                    <div className="w-[2.5px] shrink-0 self-stretch rounded-full optiz-gradient-bg opacity-60" />
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={quoteIndex}
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="text-[13px] text-gray-11 italic leading-relaxed">
                                    &ldquo;{quote.text}&rdquo;
                                </p>
                                <p className="text-[10px] text-gray-7 mt-1 font-medium">
                                    {t("quoteBy")} {quote.author}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <motion.button
                        onClick={refreshQuote}
                        className="w-7 h-7 rounded-lg bg-gray-4/50 border border-gray-5/40 flex items-center justify-center text-gray-7 hover:text-gray-11 hover:bg-gray-4 transition-all shrink-0 mt-0.5"
                        whileTap={{ scale: 0.85, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                            <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        </svg>
                    </motion.button>
                </div>
            </motion.div>

            {/* Todos */}
            <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-12">{t("myTodo")}</h3>
                    <motion.button
                        onClick={() => { setShowInput(!showInput); if (showInput) setNewTodo(""); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${showInput
                            ? "bg-gray-4 border-gray-6 text-gray-12"
                            : "bg-gray-3 border-gray-5 text-gray-11 hover:bg-gray-4"
                            }`}
                        whileTap={{ scale: 0.92 }}
                    >
                        {showInput ? t("closeBtn") : t("addBtn")}
                    </motion.button>
                </div>

                <AnimatePresence>
                    {showInput && (
                        <motion.div
                            className="flex gap-2 mb-3 overflow-hidden"
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                            <input
                                type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                                placeholder={t("todoPlaceholder")} autoFocus
                                className="flex-1 bg-gray-3 border border-gray-5 rounded-xl px-3.5 py-2.5 text-sm text-gray-12 placeholder:text-gray-8 focus:outline-none focus:border-[#E80000]/30 focus:ring-1 focus:ring-[#E80000]/10 transition-all"
                            />
                            <motion.button
                                onClick={handleAddTodo} disabled={!newTodo.trim()}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold optiz-gradient-bg text-white disabled:opacity-30 transition-all shrink-0"
                                whileTap={{ scale: 0.93 }}
                            >
                                {t("addTodo")}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <LayoutGroup>
                    <div className="space-y-1.5">
                        <AnimatePresence mode="popLayout">
                            {sortedTodos.length === 0 && !showInput && (
                                <motion.p key="empty" className="text-center text-sm text-gray-8 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {t("noTasks")}
                                </motion.p>
                            )}
                            {sortedTodos.map((todo) => (
                                <SwipeableTodoItem
                                    key={todo.id}
                                    todo={todo}
                                    onToggle={() => onToggleTodo(todo.id)}
                                    onDelete={() => onDeleteTodo(todo.id)}
                                    enableSwipe={isPhone}
                                    showConfetti={todoXpAnim?.id === todo.id}
                                    xpAmount={todoXpAnim?.xp}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </LayoutGroup>

                {/* Mobile hint — phone only */}
                {sortedTodos.length > 0 && isPhone && (
                    <p className="text-[9px] text-gray-6 text-center mt-3">
                        ← Swipe to delete
                    </p>
                )}
            </motion.div>
        </div>
    );
}
