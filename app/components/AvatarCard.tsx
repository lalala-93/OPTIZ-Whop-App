"use client";

import { motion } from "framer-motion";
import { Badge } from "@whop/react/components";

interface AvatarCardProps {
  id: string;
  emoji: string;
  name: string;
  level: number;
  currentXp: number;
  goalXp: number;
  streak: number;
  onComplete: (id: string) => void;
  isCompleting?: boolean;
}

export function AvatarCard({
  id,
  emoji,
  name,
  level,
  currentXp,
  goalXp,
  streak,
  onComplete,
  isCompleting = false,
}: AvatarCardProps) {
  const progressPercent = Math.min((currentXp / goalXp) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-2 hover:bg-gray-3 transition-colors rounded-2xl p-5 border border-gray-4 hover:border-gray-6 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Card top: emoji + name + badges */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-3 border border-gray-5 flex items-center justify-center text-3xl">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold tracking-tight text-gray-12 truncate">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge color="gray" variant="soft" size="1">
              LVL {level}
            </Badge>
            {streak > 0 && (
              <Badge color="orange" variant="soft" size="1">
                🔥 {streak}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-9">Progress to Lvl {level + 1}</span>
          <span className="text-gray-9 tabular-nums">
            {currentXp}{" "}
            <span className="text-gray-6">/</span> {goalXp} XP
          </span>
        </div>
        <div className="h-2 w-full bg-gray-3 rounded-full overflow-hidden border border-gray-5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full optiz-gradient-bg"
          />
        </div>
      </div>

      {/* Complete button */}
      <button
        onClick={() => onComplete(id)}
        disabled={isCompleting}
        className="mt-1 w-full active:scale-[0.98] transition-all optiz-gradient-bg text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md hover:shadow-[var(--optiz-red)]/10"
      >
        {isCompleting ? (
          <span className="animate-pulse text-sm">Tracking...</span>
        ) : (
          <>
            <span className="text-sm">Complete Workout</span>
            <span className="group-hover:translate-x-1 transition-transform text-sm">
              →
            </span>
          </>
        )}
      </button>
    </motion.div>
  );
}
