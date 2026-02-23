"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs } from "@whop/react/components";
import { HomeScreen } from "./HomeScreen";
import { ChallengesScreen } from "./ChallengesScreen";
import { ChallengeProgram } from "./ChallengeProgram";
import { ChallengeDetailModal } from "./ChallengeDetailModal";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { SettingsSheet } from "./SettingsSheet";
import { TaskCompleteAnimation } from "./TaskCompleteAnimation";
import { LevelUpAnimation } from "./LevelUpAnimation";
import { InfoModal } from "./InfoModal";
import { StreakModal } from "./StreakModal";
import { XPMilestonesModal } from "./XPMilestonesModal";
import { ChallengeCompleteModal } from "./ChallengeCompleteModal";
import { AnimatedFireIcon, AnimatedBoltIcon } from "./AnimatedIcons";
import {
  getLevelProgress,
  getRankForLevel,
  OPTIZ_MAX_CHALLENGE,
  type TodoItem,
  type Challenge,
} from "./rankSystem";
import Image from "next/image";

type TabType = "home" | "challenges" | "leaderboard";

export function ExperienceDashboard({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [viewingProgram, setViewingProgram] = useState<string | null>(null);

  const [userName, setUserName] = useState("User");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const [totalXp, setTotalXp] = useState(250);
  const [streakDays, setStreakDays] = useState(3);
  const [weeklyProgress, setWeeklyProgress] = useState([true, true, true, false, false, false, false]);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(4);

  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "todo-1", text: "Drink 2L water", completed: true },
    { id: "todo-2", text: "Read 10 pages", completed: false },
    { id: "todo-3", text: "No phone before 9am", completed: false },
  ]);

  const [challenges, setChallenges] = useState<Challenge[]>([
    { ...OPTIZ_MAX_CHALLENGE },
  ]);

  const [challengeModalData, setChallengeModalData] = useState<Challenge | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [challengeCompleteData, setChallengeCompleteData] = useState<{
    visible: boolean; title: string; emoji: string; xp: number; tasks: number;
  }>({ visible: false, title: "", emoji: "", xp: 0, tasks: 0 });

  const [taskCompleteAnim, setTaskCompleteAnim] = useState({ visible: false, xp: 0 });
  const [levelUpAnim, setLevelUpAnim] = useState({ visible: false, newLevel: 0 });
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const levelData = getLevelProgress(totalXp);
  const rankData = getRankForLevel(levelData.level);

  const handleToggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const handleAddTodo = useCallback((text: string) => {
    setTodos(prev => [{ id: `todo-${Date.now()}`, text, completed: false }, ...prev]);
  }, []);

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleJoinChallenge = useCallback((challengeId: string) => {
    setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, joined: true } : c));
  }, []);

  const handleCompleteTask = useCallback((taskId: string) => {
    const challenge = challenges.find(c => c.tasks.some(t => t.id === taskId));
    if (!challenge) return;
    const task = challenge.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    setCompletingTaskId(taskId);
    setTimeout(() => {
      const prevLevel = getLevelProgress(totalXp).level;
      const newTotalXp = totalXp + task.xpReward;
      const newLevelData = getLevelProgress(newTotalXp);

      const updatedChallenges = challenges.map(c => ({
        ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
      }));
      setChallenges(updatedChallenges);
      setTotalXp(newTotalXp);
      setTotalTasksCompleted(prev => prev + 1);
      setCompletingTaskId(null);

      const today = new Date().getDay();
      const dayIdx = today === 0 ? 6 : today - 1;
      setWeeklyProgress(prev => {
        const next = [...prev];
        if (!next[dayIdx]) { next[dayIdx] = true; setStreakDays(s => s + 1); }
        return next;
      });

      setTaskCompleteAnim({ visible: true, xp: task.xpReward });

      if (newLevelData.level > prevLevel) {
        setTimeout(() => setLevelUpAnim({ visible: true, newLevel: newLevelData.level }), 2400);
      }

      const updatedChallenge = updatedChallenges.find(c => c.id === challenge.id);
      if (updatedChallenge) {
        const allDone = updatedChallenge.tasks.every(t => t.completed);
        if (allDone) {
          const totalChallengeXp = updatedChallenge.tasks.reduce((s, t) => s + t.xpReward, 0);
          setTimeout(() => {
            setChallengeCompleteData({
              visible: true, title: updatedChallenge.title, emoji: updatedChallenge.emoji,
              xp: totalChallengeXp, tasks: updatedChallenge.tasks.length,
            });
          }, newLevelData.level > prevLevel ? 6000 : 2600);
        }
      }
    }, 600);
  }, [challenges, totalXp]);

  const activeChallenge = viewingProgram ? challenges.find(c => c.id === viewingProgram) : null;
  const joinedCount = challenges.filter(c => c.joined).length;

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col w-full relative">
      {/* ── Header ── */}
      <header className="px-4 sm:px-6 pt-4 pb-3 sticky top-0 bg-gray-1/90 backdrop-blur-2xl z-30 border-b border-[var(--optiz-border)]">
        <div className="flex items-center justify-between mb-3">
          {/* Left: Logo + info — vertically centered with right counters */}
          <div className="flex items-center gap-2 h-[38px]">
            <motion.div whileTap={{ scale: 0.95 }} className="flex items-center">
              <Image
                src="/Logo-optiz.png"
                alt="OPTIZ"
                width={48}
                height={48}
                className="object-contain"
                style={{ borderRadius: 0 }}
              />
            </motion.div>
            <motion.button
              onClick={() => setIsInfoOpen(true)}
              className="w-7 h-7 rounded-full bg-gray-3/80 border border-gray-5/60 flex items-center justify-center text-gray-7 hover:text-gray-11 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.88 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </motion.button>
          </div>

          {/* Right: counters + profile — same height as left */}
          <div className="flex items-center gap-1.5 h-[38px]">
            {/* Streak counter */}
            <motion.button
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-3/80 border border-gray-5/50 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.93 }}
              whileHover={{ borderColor: "rgba(255,107,0,0.3)" }}
            >
              <AnimatedFireIcon size={15} />
              <span className="text-xs font-bold text-gray-12 tabular-nums">{streakDays}</span>
            </motion.button>

            {/* XP counter — with red "XP" label */}
            <motion.button
              onClick={() => setIsXpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-3/80 border border-gray-5/50 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.93 }}
              whileHover={{ borderColor: "rgba(232,0,0,0.3)" }}
            >
              <AnimatedBoltIcon size={15} />
              <span className="text-xs font-bold text-gray-12 tabular-nums">
                {totalXp.toLocaleString()}
              </span>
              <span className="text-[9px] font-extrabold text-[#E80000] ml-[-2px]">XP</span>
            </motion.button>

            {/* Profile icon — properly circular clipped */}
            <motion.button
              onClick={() => setIsSettingsOpen(true)}
              className="w-[38px] h-[38px] rounded-full overflow-hidden bg-gray-3/80 border border-gray-5/50 flex items-center justify-center text-gray-9 hover:brightness-125 transition-all shrink-0"
              whileTap={{ scale: 0.9 }}
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  style={{ display: "block" }}
                />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        {!viewingProgram && (
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <Tabs.List>
              <Tabs.Trigger value="home">Home</Tabs.Trigger>
              <Tabs.Trigger value="challenges">Challenges</Tabs.Trigger>
              <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        {viewingProgram && activeChallenge ? (
          <ChallengeProgram
            challengeTitle={activeChallenge.title}
            challengeEmoji={activeChallenge.emoji}
            tasks={activeChallenge.tasks}
            onCompleteTask={handleCompleteTask}
            onBack={() => setViewingProgram(null)}
            completingTaskId={completingTaskId}
          />
        ) : activeTab === "home" ? (
          <HomeScreen
            level={levelData.level}
            totalXp={totalXp}
            currentLevelXp={levelData.currentLevelXp}
            xpForNextLevel={levelData.xpForNextLevel}
            progressPercent={levelData.progressPercent}
            tier={rankData.tier}
            rankFullName={rankData.fullName}
            rankColors={rankData.tier.gradient}
            streakDays={streakDays}
            weeklyProgress={weeklyProgress}
            todos={todos}
            onToggleTodo={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
            onXpRingClick={() => setIsXpModalOpen(true)}
          />
        ) : activeTab === "challenges" ? (
          <ChallengesScreen
            challenges={challenges}
            onOpenChallenge={(c) => setChallengeModalData(c)}
            onGoToProgram={(id) => setViewingProgram(id)}
          />
        ) : (
          <LeaderboardScreen
            userXp={totalXp}
            userLevel={levelData.level}
            userName={userName}
            userPhoto={userPhoto}
          />
        )}
      </main>

      {/* ── Modals ── */}
      <ChallengeDetailModal challenge={challengeModalData} isOpen={!!challengeModalData} onClose={() => setChallengeModalData(null)} onJoin={handleJoinChallenge} />
      <SettingsSheet
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        level={levelData.level} totalXp={totalXp} rankFullName={rankData.fullName}
        tier={rankData.tier} streakDays={streakDays} tasksCompleted={totalTasksCompleted}
        challengesJoined={joinedCount} userName={userName} userPhoto={userPhoto}
        onUpdateName={setUserName} onUpdatePhoto={setUserPhoto}
      />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <StreakModal isOpen={isStreakModalOpen} onClose={() => setIsStreakModalOpen(false)} streakDays={streakDays} weeklyProgress={weeklyProgress} />
      <XPMilestonesModal isOpen={isXpModalOpen} onClose={() => setIsXpModalOpen(false)} currentLevel={levelData.level} totalXp={totalXp} />
      <ChallengeCompleteModal
        isOpen={challengeCompleteData.visible} onClose={() => setChallengeCompleteData(prev => ({ ...prev, visible: false }))}
        challengeTitle={challengeCompleteData.title} challengeEmoji={challengeCompleteData.emoji}
        totalXpEarned={challengeCompleteData.xp} tasksCompleted={challengeCompleteData.tasks}
      />
      <TaskCompleteAnimation isVisible={taskCompleteAnim.visible} onComplete={() => setTaskCompleteAnim({ ...taskCompleteAnim, visible: false })} xpEarned={taskCompleteAnim.xp} />
      <LevelUpAnimation isVisible={levelUpAnim.visible} onComplete={() => setLevelUpAnim({ ...levelUpAnim, visible: false })} newLevel={levelUpAnim.newLevel} />
    </div>
  );
}
