"use client";

import { useCallback, useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Info, MessageSquare, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HomeScreen } from "./HomeScreen";
import { TrainingHubScreen } from "./TrainingHubScreen";
import { StepsScreen } from "./StepsScreen";
import { DietScreen } from "./DietScreen";
import { BreathworkScreen } from "./BreathworkScreen";
import { SettingsSheet } from "./SettingsSheet";
import { TaskCompleteAnimation } from "./TaskCompleteAnimation";
import { LevelUpAnimation } from "./LevelUpAnimation";
import { InfoModal } from "./InfoModal";
import { StreakModal } from "./StreakModal";
import { XPMilestonesModal } from "./XPMilestonesModal";
import { StreakEarnedAnimation } from "./StreakEarnedAnimation";
import { AnimatedFireIcon, AnimatedBoltIcon } from "./AnimatedIcons";
import { I18nProvider, useI18n } from "./i18n";
import { getLevelProgress, getRankForLevel, getRankNameKey } from "./rankSystem";
import {
  awardXpEvent as serverAwardXpEvent,
  updateProfile as serverUpdateProfile,
  deleteUserData as serverDeleteUserData,
} from "@/lib/actions";

type TabType = "home" | "training" | "steps" | "diet" | "breathwork";

export interface InitialData {
  profile: {
    totalXp: number;
    streakDays: number;
    displayName: string;
    avatarUrl: string | null;
    locale: string | null;
  };
  todos: {
    id: string;
    text: string;
    completed: boolean;
  }[];
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
  // V2 fields
  stepsToday: {
    baseline: number;
    goal: number;
    done: number;
    milestonesAwarded: number[];
    goalHit: boolean;
  } | null;
  nutritionToday: {
    id: string;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
    waterGoalL: number;
    waterInL: number;
    proteinGoalHit: boolean;
    caloriesOnTarget: boolean;
    hydrationGoalHit: boolean;
    mealRewardsCount: number;
    meals: {
      id: string;
      mealType: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      createdAt: string;
    }[];
  } | null;
  breathworkSessionsToday: number;
  workoutCompletionsToday: { programId: string; sessionId: string }[];
}

function DashboardInner({ userId, initialData }: { userId: string; initialData: InitialData }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [, startTransition] = useTransition();

  const [userName, setUserName] = useState(initialData.profile.displayName);
  const [userPhoto, setUserPhoto] = useState<string | null>(initialData.profile.avatarUrl);
  const [totalXp, setTotalXp] = useState(initialData.profile.totalXp);
  const [streakDays, setStreakDays] = useState(initialData.profile.streakDays);
  const [weeklyProgress] = useState(initialData.weeklyProgress);
  const [workoutsDone, setWorkoutsDone] = useState(initialData.totalTasksCompleted);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [streakAnim, setStreakAnim] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  const [taskCompleteAnim, setTaskCompleteAnim] = useState({ visible: false, xp: 0 });
  const [levelUpAnim, setLevelUpAnim] = useState({ visible: false, newLevel: 0 });

  const levelData = getLevelProgress(totalXp);
  const rankData = getRankForLevel(levelData.level);

  const handleUpdateName = useCallback(
    (name: string) => {
      setUserName(name);
      startTransition(async () => {
        try {
          await serverUpdateProfile(userId, { display_name: name });
        } catch (err) {
          console.error("Failed to update name:", err);
        }
      });
    },
    [userId, startTransition],
  );

  const handleUpdatePhoto = useCallback(
    (photo: string | null) => {
      setUserPhoto(photo);
      if (!photo) return;

      startTransition(async () => {
        try {
          await serverUpdateProfile(userId, { avatar_url: photo });
        } catch (err) {
          console.error("Failed to update photo:", err);
        }
      });
    },
    [userId, startTransition],
  );

  const handleDeleteMyData = useCallback(async () => {
    if (deletingData) return;

    setDeletingData(true);
    try {
      await serverDeleteUserData(userId);
      setTotalXp(0);
      setStreakDays(0);
      setWorkoutsDone(0);
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

  /** V2 XP handler — uses idempotent awardXpEvent */
  const handleAwardXpEvent = useCallback(
    async (source: string, referenceId: string, xpAmount: number) => {
      if (xpAmount <= 0) return;
      const isWorkout = source.startsWith("workout");

      // Use functional update to avoid stale closure
      setTotalXp((prev) => {
        const previousLevel = getLevelProgress(prev).level;
        const optimistic = prev + xpAmount;
        const optimisticLevel = getLevelProgress(optimistic).level;

        if (optimisticLevel > previousLevel) {
          setTimeout(
            () => setLevelUpAnim({ visible: true, newLevel: optimisticLevel }),
            isWorkout ? 1100 : 700,
          );
        }

        return optimistic;
      });

      if (isWorkout) {
        setWorkoutsDone((prev) => prev + 1);
        setTaskCompleteAnim({ visible: true, xp: xpAmount });
      }

      startTransition(async () => {
        try {
          const today = new Date().toISOString().split("T")[0];
          const result = await serverAwardXpEvent(userId, source, referenceId, today, xpAmount);
          if (!result.awarded) {
            // Duplicate — sync to server truth
            setTotalXp(result.totalXp);
            if (isWorkout) {
              setWorkoutsDone((prev) => Math.max(0, prev - 1));
            }
          } else {
            // Server is the source of truth
            setTotalXp(result.totalXp);
            setStreakDays(result.streakDays);
            if (result.streakEarned) setStreakAnim(true);
          }
        } catch (err) {
          console.error("Failed to award XP event:", err);
          setTotalXp((prev) => Math.max(0, prev - xpAmount));
          if (isWorkout) {
            setWorkoutsDone((prev) => Math.max(0, prev - 1));
          }
        }
      });
    },
    [userId, startTransition],
  );

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col w-full relative">
      <header className={cn(
        "px-4 sm:px-6 pt-2 pb-1 sticky top-0 z-30 border-b border-[var(--optiz-border)]",
        "bg-gray-1/95 backdrop-blur-lg isolate"
      )}>
        <div className="flex items-center justify-between mb-1">
          {/* Left: Logo + Info */}
          <div className="flex items-center gap-1.5">
            <motion.div whileTap={{ scale: 0.95 }} className="flex items-center">
              <Image
                src="/Logo-optiz.png"
                alt="OPTIZ"
                width={40}
                height={40}
                className="object-contain"
                style={{ borderRadius: 0 }}
                priority
              />
            </motion.div>

            <motion.div whileTap={{ scale: 0.88 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsInfoOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-3/80 border border-gray-5/60 text-gray-7 hover:text-gray-11 hover:bg-gray-4"
              >
                <Info className="w-[14px] h-[14px]" strokeWidth={2.5} />
              </Button>
            </motion.div>
          </div>

          {/* Right: Badges + Actions */}
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-gray-3/80 border-gray-5/50 hover:bg-gray-4 transition-all cursor-pointer"
            >
              <AnimatedFireIcon size={16} />
              <span className="text-[12px] font-bold text-gray-12 tabular-nums leading-none">{streakDays}</span>
            </Badge>

            <Badge
              variant="outline"
              onClick={() => setIsXpModalOpen(true)}
              className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-gray-3/80 border-gray-5/50 hover:bg-gray-4 transition-all cursor-pointer"
            >
              <AnimatedBoltIcon size={16} />
              <span className="text-[12px] font-bold text-gray-12 tabular-nums">{totalXp}</span>
              <span className="text-[9px] font-extrabold text-[#E80000]">{t("xpLabel")}</span>
            </Badge>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="w-8 h-8 rounded-full bg-gray-3/80 border border-gray-5/50 text-gray-7 hover:text-gray-11 hover:bg-gray-4 shrink-0"
              >
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSclDqS1cdg0S_bFSyOf_0xP5MDVYAt2LBmvgKHhQP2BqJXYbw/viewform?usp=dialog"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="w-[14px] h-[14px]" strokeWidth={2} />
                </a>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 rounded-full p-0 overflow-hidden bg-gray-3/80 border border-gray-5/50 hover:brightness-125 shrink-0"
              >
                <Avatar className="w-8 h-8">
                  {userPhoto ? (
                    <AvatarImage src={userPhoto} alt={t("profileAlt")} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-transparent text-gray-9">
                    <User className="w-[15px] h-[15px]" strokeWidth={2} />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Underline-style Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="w-full bg-transparent h-auto p-0 gap-0 overflow-x-auto">
            {(
              [
                { value: "home", label: t("home") },
                { value: "training", label: t("trainingTab") },
                { value: "steps", label: t("stepsTab") },
                { value: "diet", label: t("dietTab") },
                { value: "breathwork", label: t("breathworkTab") },
              ] as const
            ).map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex-1 rounded-none px-3 py-2 text-[11px] font-semibold transition-all",
                  "data-[state=inactive]:text-gray-9 data-[state=inactive]:hover:text-gray-11",
                  "data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-12 data-[state=active]:border-b-2 data-[state=active]:border-[#E80000]"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-2 pb-4 scroll-smooth">
        {activeTab === "home" ? (
          <HomeScreen
            userId={userId}
            userName={userName}
            userPhoto={userPhoto}
            level={levelData.level}
            totalXp={totalXp}
            currentLevelXp={levelData.currentLevelXp}
            xpForNextLevel={levelData.xpForNextLevel}
            progressPercent={levelData.progressPercent}
            tier={rankData.tier}
            rankFullName={t(getRankNameKey(rankData.tier.name) as Parameters<typeof t>[0])}
            rankColors={rankData.tier.gradient}
            streakDays={streakDays}
            weeklyProgress={weeklyProgress}
            onXpRingClick={() => setIsXpModalOpen(true)}
          />
        ) : activeTab === "training" ? (
          <TrainingHubScreen
            userId={userId}
            onAwardXpEvent={handleAwardXpEvent}
            initialCompletionsToday={initialData.workoutCompletionsToday}
          />
        ) : activeTab === "steps" ? (
          <StepsScreen
            userId={userId}
            onAwardXpEvent={handleAwardXpEvent}
            initialData={initialData.stepsToday}
          />
        ) : activeTab === "diet" ? (
          <DietScreen
            userId={userId}
            onAwardXpEvent={handleAwardXpEvent}
            initialData={initialData.nutritionToday}
          />
        ) : (
          <BreathworkScreen
            userId={userId}
            initialSessionsToday={initialData.breathworkSessionsToday}
          />
        )}
      </main>

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        level={levelData.level}
        totalXp={totalXp}
        rankFullName={rankData.fullName}
        tier={rankData.tier}
        streakDays={streakDays}
        challengesJoined={workoutsDone}
        userName={userName}
        userPhoto={userPhoto}
        onUpdateName={handleUpdateName}
        onUpdatePhoto={handleUpdatePhoto}
        onDeleteData={handleDeleteMyData}
        deletingData={deletingData}
      />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
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
