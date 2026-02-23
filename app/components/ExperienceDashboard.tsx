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
import { StreakEarnedAnimation } from "./StreakEarnedAnimation";
import { AnimatedFireIcon, AnimatedBoltIcon } from "./AnimatedIcons";
import { I18nProvider, useI18n } from "./i18n";
import {
  getLevelProgress,
  getRankForLevel,
  OPTIZ_MAX_CHALLENGE,
  type TodoItem,
  type Challenge,
} from "./rankSystem";
import Image from "next/image";

type TabType = "home" | "challenges" | "leaderboard";

function DashboardInner({ userId }: { userId: string }) {
  const { t } = useI18n();
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
  const [streakAnim, setStreakAnim] = useState(false);
  const [challengeCompleteData, setChallengeCompleteData] = useState<{
    visible: boolean; title: string; emoji: string; xp: number; tasks: number;
  }>({ visible: false, title: "", emoji: "", xp: 0, tasks: 0 });

  const [taskCompleteAnim, setTaskCompleteAnim] = useState({ visible: false, xp: 0 });
  const [levelUpAnim, setLevelUpAnim] = useState({ visible: false, newLevel: 0 });
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [todoXpAnim, setTodoXpAnim] = useState<{ id: string; xp: number } | null>(null);

  const levelData = getLevelProgress(totalXp);
  const rankData = getRankForLevel(levelData.level);

  // Streak bonus: +50 XP when streak is maintained
  const handleStreakBonus = useCallback(() => {
    setStreakAnim(true);
    setTotalXp(prev => prev + 50);
  }, []);

  const handleToggleTodo = useCallback((id: string) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;

      if (!todo.completed) {
        // Completing a todo
        const TODO_XP = 3;
        const prevLevel = getLevelProgress(totalXp).level;
        const newTotalXp = totalXp + TODO_XP;
        const newLevelData = getLevelProgress(newTotalXp);

        // Streak check
        const today = new Date().getDay();
        const dayIdx = today === 0 ? 6 : today - 1;
        setWeeklyProgress(wp => {
          const next = [...wp];
          if (!next[dayIdx]) {
            next[dayIdx] = true;
            setStreakDays(s => s + 1);
            handleStreakBonus();
          }
          return next;
        });

        setTotalTasksCompleted(tc => tc + 1);
        setTotalXp(newTotalXp);

        // Trigger inline confetti + XP popup
        setTodoXpAnim({ id, xp: TODO_XP });
        setTimeout(() => setTodoXpAnim(null), 1200);

        // Level-up check
        if (newLevelData.level > prevLevel) {
          setTimeout(() => setLevelUpAnim({ visible: true, newLevel: newLevelData.level }), 1000);
        }
      }
      return prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  }, [handleStreakBonus, totalXp]);

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

      // Streak check for challenge tasks too
      const today = new Date().getDay();
      const dayIdx = today === 0 ? 6 : today - 1;
      setWeeklyProgress(prev => {
        const next = [...prev];
        if (!next[dayIdx]) {
          next[dayIdx] = true;
          setStreakDays(s => s + 1);
          handleStreakBonus();
        }
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
  }, [challenges, totalXp, handleStreakBonus]);

  const activeChallenge = viewingProgram ? challenges.find(c => c.id === viewingProgram) : null;
  const joinedCount = challenges.filter(c => c.joined).length;

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col w-full relative">
      {/* ── Header ── */}
      <header className="px-4 sm:px-6 pt-4 pb-3 sticky top-0 bg-gray-1/90 backdrop-blur-2xl z-30 border-b border-[var(--optiz-border)]">
        <div className="flex items-center justify-between mb-2.5">
          {/* Left: Logo + info — aligned to row height */}
          <div className="flex items-center gap-2.5 h-10">
            <motion.div whileTap={{ scale: 0.95 }} className="flex items-center">
              <Image
                src="/Logo-optiz.png"
                alt="OPTIZ"
                width={52}
                height={52}
                className="object-contain -mt-0.5"
                style={{ borderRadius: 0 }}
              />
            </motion.div>
            <motion.button
              onClick={() => setIsInfoOpen(true)}
              className="w-10 h-10 rounded-full bg-gray-3/80 border border-gray-5/60 flex items-center justify-center text-gray-7 hover:text-gray-11 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.88 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </motion.button>
          </div>

          {/* Right: counters + profile — same 40px height */}
          <div className="flex items-center gap-1.5 h-10">
            {/* Streak counter */}
            <motion.button
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-full bg-gray-3/80 border border-gray-5/50 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.93 }}
            >
              <AnimatedFireIcon size={22} />
              <span className="text-sm font-bold text-gray-12 tabular-nums">{streakDays}</span>
            </motion.button>

            {/* XP counter — red label */}
            <motion.button
              onClick={() => setIsXpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-full bg-gray-3/80 border border-gray-5/50 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.93 }}
            >
              <AnimatedBoltIcon size={18} />
              <span className="text-sm font-bold text-gray-12 tabular-nums">
                {totalXp.toLocaleString()}
              </span>
              <span className="text-[10px] font-extrabold text-[#E80000]">{t("xpLabel")}</span>
            </motion.button>

            {/* Profile icon — circular clipped, no red border */}
            <motion.button
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full overflow-hidden bg-gray-3/80 border border-gray-5/50 flex items-center justify-center text-gray-9 hover:brightness-125 transition-all shrink-0"
              whileTap={{ scale: 0.9 }}
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full block"
                />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {/* Tabs with more vivid red indicator */}
        {!viewingProgram && (
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <Tabs.List className="[&_[data-state=active]]:!border-b-[#E80000] [&_[data-state=active]]:!border-b-2 [&_[data-state=active]]:!text-gray-12">
              <Tabs.Trigger value="home">{t("home")}</Tabs.Trigger>
              <Tabs.Trigger value="challenges">{t("challenges")}</Tabs.Trigger>
              <Tabs.Trigger value="leaderboard">{t("leaderboard")}</Tabs.Trigger>
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
            todoXpAnim={todoXpAnim}
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

      {/* ── Modals + Animations ── */}
      <ChallengeDetailModal challenge={challengeModalData} isOpen={!!challengeModalData} onClose={() => setChallengeModalData(null)} onJoin={handleJoinChallenge} onGoToProgram={(id) => { setActiveTab("challenges"); setViewingProgram(id); }} />
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
      <StreakEarnedAnimation isVisible={streakAnim} onComplete={() => setStreakAnim(false)} />
    </div>
  );
}

export function ExperienceDashboard({ userId }: { userId: string }) {
  return (
    <I18nProvider>
      <DashboardInner userId={userId} />
    </I18nProvider>
  );
}
