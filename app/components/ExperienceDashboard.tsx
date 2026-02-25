"use client";

import { useState, useCallback, useTransition, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Tabs } from "@whop/react/components";
import { HomeScreen } from "./HomeScreen";
import { ChallengesScreen, type WorkoutCardItem, type WorkoutVariant } from "./ChallengesScreen";
import { ChallengeProgram } from "./ChallengeProgram";
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
  type TodoItem,
  type Challenge,
} from "./rankSystem";
import Image from "next/image";
import {
  addTodo as serverAddTodo,
  toggleTodo as serverToggleTodo,
  deleteTodo as serverDeleteTodo,
  awardXp as serverAwardXp,
  updateProfile as serverUpdateProfile,
  deleteUserData as serverDeleteUserData,
} from "@/lib/actions";

type TabType = "home" | "challenges" | "leaderboard";

function classifyWorkoutVariant(taskId: string, taskName: string, index: number): WorkoutVariant {
  const normalized = `${taskId} ${taskName}`.toLowerCase();
  if (normalized.includes("push")) return "push";
  if (normalized.includes("pull")) return "pull";
  if (normalized.includes("leg")) return "legs";
  if (normalized.includes("upper")) return "upper";
  const fallback: WorkoutVariant[] = ["push", "pull", "legs", "upper"];
  return fallback[index % fallback.length];
}

/** Shape of SSR-loaded initial data from lib/actions.ts loadUserData() */
export interface InitialData {
  profile: {
    totalXp: number;
    streakDays: number;
    displayName: string;
    avatarUrl: string | null;
    locale: string | null;
  };
  todos: TodoItem[];
  challenges: {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    emoji: string;
    difficulty: string;
    durationDays: number;
    participantCount: number;
    totalXp: number;
    joined: boolean;
    tasks: {
      id: string;
      name: string;
      emoji: string;
      xpReward: number;
      completed: boolean;
      rounds?: number;
      color?: string;
      exercises?: { name: string; sets: string; muscles: string; youtubeUrl: string }[];
    }[];
  }[];
  weeklyProgress: boolean[];
  totalTasksCompleted: number;
}

function DashboardInner({ userId, initialData }: { userId: string; initialData: InitialData }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [activeWorkout, setActiveWorkout] = useState<{ challengeId: string; taskId: string } | null>(null);
  const [, startTransition] = useTransition();

  // Profile state — initialized from SSR data
  const [userName, setUserName] = useState(initialData.profile.displayName);
  const [userPhoto, setUserPhoto] = useState<string | null>(initialData.profile.avatarUrl);

  // XP and streak — from SSR
  const [totalXp, setTotalXp] = useState(initialData.profile.totalXp);
  const [streakDays, setStreakDays] = useState(initialData.profile.streakDays);
  const [weeklyProgress] = useState(initialData.weeklyProgress);

  // Todos — from SSR
  const [todos, setTodos] = useState<TodoItem[]>(initialData.todos);

  // Challenges — from SSR
  const [challenges, setChallenges] = useState<Challenge[]>(
    initialData.challenges.map(c => ({
      ...c,
      difficulty: c.difficulty as Challenge["difficulty"],
      taskCount: c.tasks.length,
    }))
  );

  // UI state
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
  const [deletingData, setDeletingData] = useState(false);
  const [todoXpAnim, setTodoXpAnim] = useState<{ id: string; xp: number } | null>(null);

  const levelData = getLevelProgress(totalXp);
  const rankData = getRankForLevel(levelData.level);

  // ═══════════════════════════════════════
  // HANDLERS — Server Action backed mutations
  // ═══════════════════════════════════════

  // Guard against rapid concurrent toggles on the same todo
  const pendingTodoIds = useRef<Set<string>>(new Set());

  const handleToggleTodo = useCallback((id: string) => {
    // Prevent concurrent toggles on the same todo
    if (pendingTodoIds.current.has(id)) return;

    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // Only allow checking (completing), not unchecking
    if (todo.completed) return;

    pendingTodoIds.current.add(id);

    const TODO_XP = 3;
    const prevLevel = getLevelProgress(totalXp).level;
    const newTotalXp = totalXp + TODO_XP;
    const newLevelData = getLevelProgress(newTotalXp);

    // Optimistic UI update
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    setTotalXp(newTotalXp);
    setTodoXpAnim({ id, xp: TODO_XP });
    setTimeout(() => setTodoXpAnim(null), 1200);

    if (newLevelData.level > prevLevel) {
      setTimeout(() => setLevelUpAnim({ visible: true, newLevel: newLevelData.level }), 1000);
    }

    // Server: toggle todo + award XP
    startTransition(async () => {
      try {
        await serverToggleTodo(userId, id, true);
        const result = await serverAwardXp(userId, TODO_XP, "todo");
        // Sync server values
        setTotalXp(result.totalXp);
        setStreakDays(result.streakDays);
        if (result.streakEarned) {
          setStreakAnim(true);
        }
      } catch (err) {
        console.error("Failed to toggle todo:", err);
        // Revert optimistic update on failure
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: false } : t));
        setTotalXp((prev) => prev - TODO_XP);
      } finally {
        pendingTodoIds.current.delete(id);
      }
    });
  }, [totalXp, userId, todos]);

  const handleAddTodo = useCallback((text: string) => {
    startTransition(async () => {
      try {
        const newTodo = await serverAddTodo(userId, text);
        setTodos(prev => [{ id: newTodo.id, text: newTodo.text, completed: newTodo.completed }, ...prev]);
      } catch (err) {
        console.error("Failed to add todo:", err);
      }
    });
  }, [userId]);

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    startTransition(async () => {
      try {
        await serverDeleteTodo(userId, id);
      } catch (err) {
        console.error("Failed to delete todo:", err);
        // We could revert the optimistic delete here if needed, but for delete it's usually fine
      }
    });
  }, [userId]);

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
      setCompletingTaskId(null);

      // Before showing task complete, dismiss others
      setLevelUpAnim(prev => ({ ...prev, visible: false }));
      setStreakAnim(false);
      setTaskCompleteAnim({ visible: true, xp: task.xpReward });

      // Server: award XP
      startTransition(async () => {
        try {
          const result = await serverAwardXp(userId, task.xpReward, "challenge", taskId);
          setTotalXp(result.totalXp);
          setStreakDays(result.streakDays);
          if (result.streakEarned) setStreakAnim(true);
        } catch (err) {
          console.error("Failed to complete task:", err);
        }
      });

      // Level up delay: 2000ms (task anim) + 100ms buffer = 2100ms
      if (newLevelData.level > prevLevel) {
        setTimeout(() => {
          setTaskCompleteAnim(prev => ({ ...prev, visible: false }));
          setLevelUpAnim({ visible: true, newLevel: newLevelData.level });
        }, 2100);
      }

      const updatedChallenge = updatedChallenges.find(c => c.id === challenge.id);
      if (updatedChallenge) {
        const allDone = updatedChallenge.tasks.every(t => t.completed);
        if (allDone) {
          const totalChallengeXp = updatedChallenge.tasks.reduce((s, t) => s + t.xpReward, 0);
          setTimeout(() => {
            setTaskCompleteAnim(prev => ({ ...prev, visible: false }));
            setLevelUpAnim(prev => ({ ...prev, visible: false }));
            setChallengeCompleteData({
              visible: true, title: updatedChallenge.title, emoji: updatedChallenge.emoji,
              xp: totalChallengeXp, tasks: updatedChallenge.tasks.length,
            });
          }, newLevelData.level > prevLevel ? 4200 : 2200);
        }
      }
    }, 600);
  }, [challenges, totalXp, userId]);

  const handleUpdateName = useCallback((name: string) => {
    setUserName(name);
    startTransition(async () => {
      try {
        await serverUpdateProfile(userId, { display_name: name });
      } catch (err) {
        console.error("Failed to update name:", err);
      }
    });
  }, [userId]);

  const handleUpdatePhoto = useCallback((photo: string | null) => {
    setUserPhoto(photo);
    if (photo) {
      startTransition(async () => {
        try {
          await serverUpdateProfile(userId, { avatar_url: photo });
        } catch (err) {
          console.error("Failed to update photo:", err);
        }
      });
    }
  }, [userId]);

  const handleDeleteMyData = useCallback(async () => {
    if (deletingData) return;

    setDeletingData(true);
    try {
      await serverDeleteUserData(userId);
      setTodos([]);
      setChallenges((prev) =>
        prev.map((challenge) => ({
          ...challenge,
          tasks: challenge.tasks.map((task) => ({ ...task, completed: false })),
        }))
      );
      setTotalXp(0);
      setStreakDays(0);
      setActiveWorkout(null);
      setIsSettingsOpen(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("optiz-locale");
      }
    } catch (err) {
      console.error("Failed to delete user data:", err);
    } finally {
      setDeletingData(false);
    }
  }, [deletingData, userId]);

  const workoutCards = useMemo<WorkoutCardItem[]>(() => {
    return challenges.flatMap((challenge) =>
      challenge.tasks.map((task, index) => {
        const variant = classifyWorkoutVariant(task.id, task.name, index);
        const defaultTitleByVariant: Record<WorkoutVariant, string> = {
          push: t("workoutPushTitle"),
          pull: t("workoutPullTitle"),
          legs: t("workoutLegsTitle"),
          upper: t("workoutUpperTitle"),
        };
        const defaultFocusByVariant: Record<WorkoutVariant, string> = {
          push: t("workoutPushFocus"),
          pull: t("workoutPullFocus"),
          legs: t("workoutLegsFocus"),
          upper: t("workoutUpperFocus"),
        };

        const title = defaultTitleByVariant[variant];
        const focus = defaultFocusByVariant[variant];
        const exerciseCount = task.exercises?.length ?? 5;
        const rounds = task.rounds ?? 4;
        const estimatedMinutes = Math.max(10, exerciseCount * rounds);

        return {
          id: task.id,
          title,
          subtitle: `${t("sessionLabel")} ${index + 1}`,
          focus,
          xpReward: task.xpReward,
          exerciseCount,
          roundCount: rounds,
          estimatedMinutes,
          completed: task.completed,
          variant,
        };
      })
    );
  }, [challenges, t]);

  const selectedWorkout = useMemo(() => {
    if (!activeWorkout) return null;
    const challenge = challenges.find((c) => c.id === activeWorkout.challengeId);
    const workoutTask = challenge?.tasks.find((task) => task.id === activeWorkout.taskId);
    if (!challenge || !workoutTask) return null;
    const card = workoutCards.find((w) => w.id === workoutTask.id);
    return { challenge, workoutTask, displayName: card?.title ?? workoutTask.name, displayFocus: card?.focus ?? "" };
  }, [activeWorkout, challenges, workoutCards]);

  const completedWorkouts = challenges.reduce((sum, challenge) => {
    return sum + challenge.tasks.filter((task) => task.completed).length;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col w-full relative">
      {/* ── Header ── */}
      <header className="px-4 sm:px-6 pt-4 pb-3 sticky top-0 bg-gray-1/90 backdrop-blur-2xl z-30 border-b border-[var(--optiz-border)]">
        <div className="flex items-center justify-between mb-2.5">
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

          <div className="flex items-center gap-1.5 h-10">
            <motion.button
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-full bg-gray-3/80 border border-gray-5/50 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.93 }}
            >
              <AnimatedFireIcon size={22} />
              <span className="text-sm font-bold text-gray-12 tabular-nums">{streakDays}</span>
            </motion.button>

            <motion.button
              onClick={() => setIsXpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-full bg-gray-3/80 border border-gray-5/50 hover:bg-gray-4 transition-all"
              whileTap={{ scale: 0.93 }}
            >
              <AnimatedBoltIcon size={18} />
              <span className="text-sm font-bold text-gray-12 tabular-nums">
                {totalXp}
              </span>
              <span className="text-[10px] font-extrabold text-[#E80000]">{t("xpLabel")}</span>
            </motion.button>

            <motion.button
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full overflow-hidden bg-gray-3/80 border border-gray-5/50 flex items-center justify-center text-gray-9 hover:brightness-125 transition-all shrink-0"
              whileTap={{ scale: 0.9 }}
            >
              {userPhoto ? (
                <img src={userPhoto} alt="Profile" className="w-full h-full object-cover rounded-full block" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {!activeWorkout && (
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <Tabs.List className="[&_[data-state=active]]:!border-b-[#E80000] [&_[data-state=active]]:!border-b-2 [&_[data-state=active]]:!text-gray-12">
              <Tabs.Trigger value="home">{t("home")}</Tabs.Trigger>
              <Tabs.Trigger value="challenges">{t("challenges")}</Tabs.Trigger>
              <Tabs.Trigger value="leaderboard">{t("leaderboard")}</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        {selectedWorkout ? (
          <ChallengeProgram
            key={selectedWorkout.workoutTask.id}
            challengeTitle={selectedWorkout.challenge.title}
            workoutTask={selectedWorkout.workoutTask}
            workoutDisplayName={selectedWorkout.displayName}
            workoutFocus={selectedWorkout.displayFocus}
            onCompleteTask={handleCompleteTask}
            onBack={() => setActiveWorkout(null)}
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
            workouts={workoutCards}
            onOpenWorkout={(taskId) => {
              const challenge = challenges.find((c) => c.tasks.some((task) => task.id === taskId));
              if (!challenge) return;
              setActiveWorkout({ challengeId: challenge.id, taskId });
            }}
          />
        ) : (
          <LeaderboardScreen
            userId={userId}
            userXp={totalXp}
            userLevel={levelData.level}
            userName={userName}
            userPhoto={userPhoto}
          />
        )}
      </main>

      <SettingsSheet
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        level={levelData.level} totalXp={totalXp} rankFullName={rankData.fullName}
        tier={rankData.tier} streakDays={streakDays}
        challengesJoined={completedWorkouts} userName={userName} userPhoto={userPhoto}
        onUpdateName={handleUpdateName} onUpdatePhoto={handleUpdatePhoto}
        onDeleteData={handleDeleteMyData}
        deletingData={deletingData}
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

export function ExperienceDashboard({ userId, initialData }: { userId: string; initialData: InitialData }) {
  return (
    <I18nProvider>
      <DashboardInner userId={userId} initialData={initialData} />
    </I18nProvider>
  );
}
