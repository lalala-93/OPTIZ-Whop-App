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

export function AddAvatarModal({
  isOpen,
  onClose,
  onSave,
  isPro,
  currentCount,
}: AddAvatarModalProps) {
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet / Dialog */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md bg-gray-2 border border-gray-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle (iOS sheet style) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-6" />
          </div>

          {canAdd ? (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-12 text-center">
                New Sport Avatar
              </h2>

              <div className="space-y-5">
                {/* Emoji picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-9 mb-2">
                    Select Emoji
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setSelectedEmoji(e)}
                        className={`text-2xl p-3 rounded-xl transition-all ${
                          selectedEmoji === e
                            ? "bg-[var(--optiz-red)]/15 border-2 border-[var(--optiz-red)] shadow-sm"
                            : "bg-gray-3 border-2 border-transparent hover:bg-gray-4"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name input */}
                <div>
                  <label className="block text-sm font-medium text-gray-9 mb-2">
                    Avatar Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Morning Run..."
                    className="w-full bg-gray-3 border border-gray-5 rounded-xl px-4 py-3 text-gray-12 placeholder:text-gray-8 focus:outline-none focus:border-[var(--optiz-red)] focus:ring-1 focus:ring-[var(--optiz-red)]/20 transition-all text-sm"
                  />
                </div>

                {/* Weekly goal slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-9 mb-2">
                    Weekly Goal: <span className="text-gray-12 font-bold">{goal} days</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-4 rounded-lg appearance-none cursor-pointer accent-[var(--optiz-red)]"
                  />
                  <div className="flex justify-between text-xs text-gray-8 mt-1.5 px-0.5">
                    <span>1</span>
                    <span>7</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gray-4 hover:bg-gray-5 text-gray-11 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed optiz-gradient-bg text-white shadow-sm hover:shadow-md text-sm"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upsell inline when limit reached */
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 optiz-gradient-bg rounded-full flex items-center justify-center text-3xl mb-5 shadow-[var(--optiz-glow)]">
                ⭐
              </div>
              <h2 className="text-xl font-bold text-gray-12 mb-2">
                LevelUp Pro Required
              </h2>
              <p className="text-gray-9 mb-6 text-sm leading-relaxed">
                You&apos;ve reached the free limit of 2 sport avatars.
                Upgrade to unlock unlimited avatars and more.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-gray-12 bg-gray-4 hover:bg-gray-5 transition-colors text-sm border border-gray-5"
              >
                View Plans (Coming Soon)
              </button>
              <button
                onClick={onClose}
                className="mt-3 text-sm text-gray-8 hover:text-gray-11 transition-colors"
              >
                Maybe later
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
