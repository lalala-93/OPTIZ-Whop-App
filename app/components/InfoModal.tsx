"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, Target } from "lucide-react";
import { Exercise } from "../lib/workout-data";

interface InfoModalProps {
    exercise: Exercise | null;
    onClose: () => void;
}

export function InfoModal({ exercise, onClose }: InfoModalProps) {
    if (!exercise) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-[--color-optiz-card] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[--color-optiz-red] to-[--color-optiz-orange] p-6 pb-8 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <h2 className="text-2xl font-black text-white italic tracking-wide uppercase mt-4">
                            {exercise.name}
                        </h2>
                    </div>

                    <div className="p-6 -mt-4 relative bg-[--color-optiz-card] rounded-t-3xl">
                        <div className="space-y-6">

                            {/* Muscle Groups */}
                            <div>
                                <h3 className="text-[--color-optiz-muted] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Target size={14} /> Muscles Ciblés
                                </h3>
                                <p className="text-white font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                                    {exercise.muscleGroups}
                                </p>
                            </div>

                            {/* Notes */}
                            {exercise.notes && (
                                <div>
                                    <h3 className="text-[--color-optiz-muted] text-xs font-bold uppercase tracking-wider mb-2">
                                        Notes
                                    </h3>
                                    <p className="text-white text-sm bg-white/5 p-3 rounded-xl border border-white/5 whitespace-pre-line">
                                        {exercise.notes}
                                    </p>
                                </div>
                            )}

                            {/* Action */}
                            <a
                                href={exercise.videoLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2"
                            >
                                <PlayCircle size={20} />
                                Regarder la vidéo
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
