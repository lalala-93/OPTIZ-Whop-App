"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AddAvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (avatar: { name: string; emoji: string; goal: number }) => void;
    isPro: boolean;
    currentCount: number;
}

const EMOJIS = ["🏋️", "🏃‍♂️", "🧘‍♀️", "🚴‍♂️", "🏊‍♂️", "🥊", "🧗‍♀️", "🏄‍♂️"];

export function AddAvatarModal({ isOpen, onClose, onSave, isPro, currentCount }: AddAvatarModalProps) {
    const [name, setName] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
    const [goal, setGoal] = useState(3);

    const canAdd = isPro || currentCount < 2;

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name, emoji: selectedEmoji, goal });
        setName("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[--color-optiz-card] border border-[--color-optiz-border] rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {canAdd ? (
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6 text-white text-center">New Sport Avatar</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-[--color-optiz-muted] mb-2">Select Emoji</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {EMOJIS.map((e) => (
                                            <button
                                                key={e}
                                                onClick={() => setSelectedEmoji(e)}
                                                className={`text-3xl p-3 rounded-2xl transition-all ${selectedEmoji === e
                                                        ? "bg-[--color-optiz-red]/20 border-2 border-[--color-optiz-red]"
                                                        : "bg-black border-2 border-transparent hover:bg-white/10"
                                                    }`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[--color-optiz-muted] mb-2">Avatar Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Morning Run..."
                                        className="w-full bg-black border border-[--color-optiz-border] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[--color-optiz-red] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[--color-optiz-muted] mb-2">Weekly Goal: {goal} days</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="7"
                                        value={goal}
                                        onChange={(e) => setGoal(Number(e.target.value))}
                                        className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-[--color-optiz-red]"
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-1 px-1">
                                        <span>1</span>
                                        <span>7</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!name.trim()}
                                        className="flex-1 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[--color-optiz-red] to-[--color-optiz-orange] text-white"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-[--color-optiz-red] to-[--color-optiz-orange] rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(240,80,48,0.4)]">
                                ⭐
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">LevelUp Pro Required</h2>
                            <p className="text-[--color-optiz-muted] mb-8 leading-relaxed">
                                You've reached the free limit of 2 sport avatars. Upgrade to LevelUp Pro to unlock unlimited avatars and advanced features!
                            </p>

                            <button
                                // We'll hook this up to Whop SDK's openCheckout later
                                onClick={onClose}
                                className="w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                            >
                                View Plans (Coming Soon)
                            </button>
                            <button onClick={onClose} className="mt-4 text-sm text-[--color-optiz-muted] hover:text-white transition-colors">
                                Maybe later
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
