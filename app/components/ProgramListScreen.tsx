"use client";

import { motion } from "framer-motion";
import { WORKOUT_PROGRAM } from "../lib/workout-data";
import { Play } from "lucide-react";

interface ProgramListScreenProps {
    onSelectSession: (sessionId: string) => void;
    lastCompletedDates: Record<string, string>; // Maps sessionId to ISO date
}

export function ProgramListScreen({ onSelectSession, lastCompletedDates }: ProgramListScreenProps) {
    const isCompletedToday = (sessionId: string) => {
        const lastDate = lastCompletedDates[sessionId];
        if (!lastDate) return false;

        // Check if within the last 24h for today's reset
        const now = new Date();
        const completedDate = new Date(lastDate);
        const diffMs = now.getTime() - completedDate.getTime();
        return diffMs < 24 * 60 * 60 * 1000;
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto w-full pb-20">
            <div>
                <h2 className="text-2xl font-black text-white italic tracking-wide uppercase mb-1">
                    Ton Programme
                </h2>
                <p className="text-[--color-optiz-muted] text-sm font-medium">
                    Dips, Tractions, Haltères • 4 Séances / semaine
                </p>
            </div>

            <div className="space-y-4">
                {WORKOUT_PROGRAM.map((session, index) => {
                    const completed = isCompletedToday(session.id);

                    return (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelectSession(session.id)}
                            className={`relative overflow-hidden group cursor-pointer border rounded-3xl p-5 ${completed
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-[--color-optiz-card] border-[--color-optiz-border] hover:border-white/20'
                                } transition-colors`}
                        >
                            {completed && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded-md">
                                        Terminé aujourd'hui
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                                    style={{ background: `linear-gradient(135deg, ${session.color}80, ${session.color})` }}
                                >
                                    <span className="text-2xl font-black text-white italic">{session.name.split(' ')[0]}</span>
                                </div>

                                <div className="flex-1 pr-16">
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {session.name.replace(/^[^\s]+\s/, '')}
                                    </h3>
                                    <p className="text-xs text-[--color-optiz-muted] line-clamp-2 leading-relaxed">
                                        {session.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between">
                                <span className="text-xs font-bold text-[--color-optiz-muted]">
                                    {session.exercises.length} EXERCICES
                                </span>

                                <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${completed ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}>
                                    {completed ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ) : (
                                        <Play size={18} className="translate-x-[1px]" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
