"use client";

import { useState, useCallback, useEffect } from "react";
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
  // ── Navigation ──
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [viewingProgram, setViewingProgram] = useState<string | null>(null);

  // ── User Progress ──
  const [totalXp, setTotalXp] = useState(250);
  const [streakDays, setStreakDays] = useState(3);
  const [weeklyProgress, setWeeklyProgress] = useState([true, true, true, false, false, false, false]);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(4);

  // ── Todos (no XP) ──
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "todo-1", text: "Drink 2L water", completed: true },
    { id: "todo-2", text: "Read 10 pages", completed: false },
    { id: "todo-3", text: "No phone before 9am", completed: false },
  ]);

  // ── Challenges ──
  const [challenges, setChallenges] = useState<Challenge[]>([
    { ...OPTIZ_MAX_CHALLENGE },
  ]);

  // ── Modals ──
  const [challengeModalData, setChallengeModalData] = useState<Challenge | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [challengeCompleteData, setChallengeCompleteData] = useState<{
    visible: boolean;
    title: string;
    emoji: string;
    xp: number;
    tasks: number;
  }>({ visible: false, title: "", emoji: "", xp: 0, tasks: 0 });

  // ── Animations ──
  const [taskCompleteAnim, setTaskCompleteAnim] = useState({ visible: false, xp: 0 });
  const [levelUpAnim, setLevelUpAnim] = useState({ visible: false, newLevel: 0 });
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // ── Derived ──
  const levelData = getLevelProgress(totalXp);
  const rankData = getRankForLevel(levelData.level);

  // ── Todo handlers ──
  const handleToggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  const handleAddTodo = useCallback((text: string) => {
    setTodos(prev => [...prev, {
      id: `todo-${Date.now()}`,
      text,
      completed: false,
    }]);
  }, []);

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Challenge handlers ──
  const handleJoinChallenge = useCallback((challengeId: string) => {
    setChallenges(prev =>
      prev.map(c => c.id === challengeId ? { ...c, joined: true } : c)
    );
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

      // Update challenge task
      const updatedChallenges = challenges.map(c => ({
        ...c,
        tasks: c.tasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        ),
      }));
      setChallenges(updatedChallenges);

      setTotalXp(newTotalXp);
      setTotalTasksCompleted(prev => prev + 1);
      setCompletingTaskId(null);

      // Update streak
      const today = new Date().getDay();
      const dayIdx = today === 0 ? 6 : today - 1;
      setWeeklyProgress(prev => {
        const next = [...prev];
        if (!next[dayIdx]) {
          next[dayIdx] = true;
          setStreakDays(s => s + 1);
        }
        return next;
      });

      // Show task complete animation
      setTaskCompleteAnim({ visible: true, xp: task.xpReward });

      // Check level up
      if (newLevelData.level > prevLevel) {
        setTimeout(() => {
          setLevelUpAnim({ visible: true, newLevel: newLevelData.level });
        }, 2400);
      }

      // Check all-tasks-complete for this challenge
      const updatedChallenge = updatedChallenges.find(c => c.id === challenge.id);
      if (updatedChallenge) {
        const allDone = updatedChallenge.tasks.every(t => t.completed);
        if (allDone) {
          const totalChallengeXp = updatedChallenge.tasks.reduce((s, t) => s + t.xpReward, 0);
          setTimeout(() => {
            setChallengeCompleteData({
              visible: true,
              title: updatedChallenge.title,
              emoji: updatedChallenge.emoji,
              xp: totalChallengeXp,
              tasks: updatedChallenge.tasks.length,
            });
          }, newLevelData.level > prevLevel ? 6000 : 2600);
        }
      }
    }, 600);
  }, [challenges, totalXp]);

  // ── Active challenge program ──
  const activeChallenge = viewingProgram
    ? challenges.find(c => c.id === viewingProgram)
    : null;

  // ── Challenge join count ──
  const joinedCount = challenges.filter(c => c.joined).length;

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col w-full relative">
      {/* ══════════════════════════════════════════ */}
      {/* ── Sticky Header ──                       */}
      {/* ══════════════════════════════════════════ */}
      <header className="px-4 sm:px-6 pt-4 pb-3 sticky top-0 bg-gray-1/85 backdrop-blur-xl z-30 border-b border-[var(--optiz-border)]">
        <div className="flex items-center justify-between mb-3">
          {/* Logo only — no text */}
          <div className="flex items-center gap-2">
            <Image
              src="/Logo-optiz.png"
              alt="OPTIZ"
              width={36}
              height={36}
              className="rounded-xl"
            />
            {/* Info button */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="w-7 h-7 rounded-full bg-gray-3 border border-gray-5 flex items-center justify-center text-gray-8 hover:text-gray-12 hover:bg-gray-4 transition-all active:scale-95"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>

          {/* Right counters + profile */}
          <div className="flex items-center gap-1.5">
            {/* Streak counter — tappable */}
            <button
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-3 border border-gray-5 hover:bg-gray-4 hover:border-gray-6 transition-all active:scale-95"
            >
              <span className="text-sm optiz-flame-flicker">🔥</span>
              <span className="text-xs font-bold text-gray-12 tabular-nums">{streakDays}</span>
            </button>

            {/* XP counter — tappable, WHITE text */}
            <button
              onClick={() => setIsXpModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-3 border border-gray-5 hover:bg-gray-4 hover:border-gray-6 transition-all active:scale-95"
            >
              <span className="text-sm optiz-bolt-pulse">⚡</span>
              <span className="text-xs font-bold text-gray-12 tabular-nums">
                {totalXp.toLocaleString()}
              </span>
            </button>

            {/* Profile button — matching counter size */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-[34px] h-[34px] rounded-full bg-gray-3 border border-gray-5 flex items-center justify-center overflow-hidden hover:bg-gray-4 hover:border-gray-6 transition-all active:scale-95"
            >
              <Image
                src={`https://ui-avatars.com/api/?name=${userId.slice(0, 2)}&background=E80000&color=fff&size=68&bold=true&format=svg`}
                alt="Profile"
                width={34}
                height={34}
                className="rounded-full object-cover"
                unoptimized
              />
            </button>
          </div>
        </div>

        {/* ── Frosted Tabs ── */}
        {!viewingProgram && (
          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
          >
            <Tabs.List>
              <Tabs.Trigger value="home">Home</Tabs.Trigger>
              <Tabs.Trigger value="challenges">Challenges</Tabs.Trigger>
              <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        )}
      </header>

      {/* ══════════════════════════════════════════ */}
      {/* ── Content ──                             */}
      {/* ══════════════════════════════════════════ */}
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
          />
        )}
      </main>

      {/* ══════════════════════════════════════════ */}
      {/* ── Modals & Animations ──                 */}
      {/* ══════════════════════════════════════════ */}
      <ChallengeDetailModal
        challenge={challengeModalData}
        isOpen={!!challengeModalData}
        onClose={() => setChallengeModalData(null)}
        onJoin={handleJoinChallenge}
      />

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        level={levelData.level}
        totalXp={totalXp}
        rankFullName={rankData.fullName}
        tier={rankData.tier}
        streakDays={streakDays}
        tasksCompleted={totalTasksCompleted}
        challengesJoined={joinedCount}
      />

      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakDays={streakDays}
        weeklyProgress={weeklyProgress}
      />

      <XPMilestonesModal
        isOpen={isXpModalOpen}
        onClose={() => setIsXpModalOpen(false)}
        currentLevel={levelData.level}
        totalXp={totalXp}
      />

      <ChallengeCompleteModal
        isOpen={challengeCompleteData.visible}
        onClose={() => setChallengeCompleteData(prev => ({ ...prev, visible: false }))}
        challengeTitle={challengeCompleteData.title}
        challengeEmoji={challengeCompleteData.emoji}
        totalXpEarned={challengeCompleteData.xp}
        tasksCompleted={challengeCompleteData.tasks}
      />

      <TaskCompleteAnimation
        isVisible={taskCompleteAnim.visible}
        onComplete={() => setTaskCompleteAnim({ ...taskCompleteAnim, visible: false })}
        xpEarned={taskCompleteAnim.xp}
      />

      <LevelUpAnimation
        isVisible={levelUpAnim.visible}
        onComplete={() => setLevelUpAnim({ ...levelUpAnim, visible: false })}
        newLevel={levelUpAnim.newLevel}
      />
    </div>
  );
}
