"use client";

import { useState } from "react";
import { Badge, Tabs } from "@whop/react/components";
import { AvatarCard } from "./AvatarCard";
import { AddAvatarModal } from "./AddAvatarModal";
import { UpsellModal } from "./UpsellModal";
import { SuccessAnimation } from "./SuccessAnimation";

const INITIAL_AVATARS = [
  {
    id: "1",
    emoji: "🏃‍♂️",
    name: "Morning Run",
    level: 1,
    currentXp: 150,
    goalXp: 300,
    streak: 3,
  },
];

const FREE_AVATAR_LIMIT = 2;

export function ExperienceDashboard({ userId }: { userId: string }) {
  const [avatars, setAvatars] = useState(INITIAL_AVATARS);
  const [activeTab, setActiveTab] = useState("home");
  const [isPro] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);

  // Animation
  const [successAnim, setSuccessAnim] = useState({
    isVisible: false,
    xpEarned: 0,
  });
  const [completingId, setCompletingId] = useState<string | null>(null);

  const totalXp =
    avatars.reduce((sum, a) => sum + a.currentXp, 0) + avatars.length * 100;
  const globalLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;

  const handleComplete = (id: string) => {
    setCompletingId(id);
    setTimeout(() => {
      const xpEarned = 50;
      setAvatars((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            const newXp = a.currentXp + xpEarned;
            let newLevel = a.level;
            let newGoal = a.goalXp;
            if (newXp >= a.goalXp) {
              newLevel++;
              newGoal = Math.floor(a.goalXp * 1.5);
            }
            return {
              ...a,
              currentXp: newXp,
              level: newLevel,
              goalXp: newGoal,
              streak: a.streak + 1,
            };
          }
          return a;
        })
      );
      setCompletingId(null);
      setSuccessAnim({ isVisible: true, xpEarned });
    }, 800);
  };

  const handleAddClick = () => {
    if (!isPro && avatars.length >= FREE_AVATAR_LIMIT) {
      setIsUpsellModalOpen(true);
    } else {
      setIsAddModalOpen(true);
    }
  };

  const handleSaveAvatar = (newAvatar: {
    name: string;
    emoji: string;
    goal: number;
  }) => {
    setAvatars((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        emoji: newAvatar.emoji,
        name: newAvatar.name,
        level: 1,
        currentXp: 0,
        goalXp: 300,
        streak: 0,
      },
    ]);
  };

  const handleUpgrade = () => {
    alert("Opening Whop Checkout... (WIP)");
  };

  // Leaderboard data (mock)
  const leaderboard = [
    { rank: 1, name: "Alex F.", xp: 12500, emoji: "🥇" },
    { rank: 2, name: "Sarah M.", xp: 11200, emoji: "🥈" },
    { rank: 3, name: "John D.", xp: 8400, emoji: "💪" },
    { rank: 4, name: "You", xp: totalXp, emoji: "⚡", isMe: true },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col max-w-lg mx-auto relative">
      {/* ── Header ── */}
      <header className="px-5 pt-6 pb-3 sticky top-0 bg-gray-1/80 backdrop-blur-xl z-30 border-b border-gray-4">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full optiz-gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {globalLevel}
            </div>
            <div>
              <p className="text-[11px] text-gray-9 font-semibold tracking-widest uppercase">
                Hero Status
              </p>
              <h1 className="text-lg font-bold text-gray-12 tabular-nums">
                {totalXp.toLocaleString()} XP
              </h1>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-3 border border-gray-5 flex items-center justify-center text-gray-9 hover:bg-gray-4 hover:text-gray-11 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* ── Frosted Tabs ── */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="home">Home</Tabs.Trigger>
            <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto px-5 py-6 scroll-smooth">
        {activeTab === "home" ? (
          <div className="space-y-5 pb-20">
            {/* Section header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-12">Your Sports</h2>
              {!isPro && avatars.length >= FREE_AVATAR_LIMIT && (
                <Badge color="red" variant="soft" size="1">
                  Limit Reached
                </Badge>
              )}
            </div>

            {/* Avatar cards */}
            <div className="flex flex-col gap-3">
              {avatars.map((avatar) => (
                <AvatarCard
                  key={avatar.id}
                  {...avatar}
                  onComplete={handleComplete}
                  isCompleting={completingId === avatar.id}
                />
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={handleAddClick}
              className="w-full py-4 border-2 border-dashed border-gray-5 rounded-2xl text-gray-9 hover:text-gray-12 hover:border-gray-7 hover:bg-gray-3 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> Add Sport Avatar
            </button>
          </div>
        ) : (
          /* ── Leaderboard ── */
          <div className="space-y-3 pb-20">
            <h2 className="text-xl font-bold text-gray-12 mb-4">
              Leaderboard
            </h2>

            {leaderboard.map((user, idx) => (
              <div
                key={user.name}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                  user.isMe
                    ? "bg-gray-3 border-[var(--optiz-red)]/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                    : "bg-gray-2 border-gray-4 hover:border-gray-6"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0
                        ? "optiz-gradient-bg text-white"
                        : idx === 1
                        ? "bg-gray-5 text-gray-12"
                        : idx === 2
                        ? "bg-gray-4 text-gray-11"
                        : "bg-gray-3 text-gray-9"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xl">{user.emoji}</span>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        user.isMe ? "optiz-gradient-text" : "text-gray-12"
                      }`}
                    >
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-9">Rank {idx + 1}</p>
                  </div>
                </div>
                <span className="font-bold tabular-nums text-sm text-gray-11">
                  {user.xp.toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modals & Animations ── */}
      <AddAvatarModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveAvatar}
        isPro={isPro}
        currentCount={avatars.length}
      />

      <UpsellModal
        isOpen={isUpsellModalOpen}
        onClose={() => setIsUpsellModalOpen(false)}
        onUpgrade={handleUpgrade}
      />

      <SuccessAnimation
        isVisible={successAnim.isVisible}
        onComplete={() => setSuccessAnim({ ...successAnim, isVisible: false })}
        xpEarned={successAnim.xpEarned}
      />
    </div>
  );
}
