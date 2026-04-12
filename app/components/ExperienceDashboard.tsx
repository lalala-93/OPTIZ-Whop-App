"use client";

import { useCallback, useState, useTransition } from "react";
import Image from "next/image";
import { Home, Dumbbell, Footprints, Apple, Wind, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { HomeScreen } from "./HomeScreen";
import { TrainingHubScreen } from "./TrainingHubScreen";
import { StepsScreen } from "./StepsScreen";
import { DietScreen } from "./DietScreen";
import { BreathworkScreen } from "./BreathworkScreen";
import { SettingsSheet } from "./SettingsSheet";
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

export interface ExperienceDashboardProps {
  userId: string;
  initialData: InitialData;
  initialEngagementStats?: {
    chatMessages: number;
    forumPosts: number;
    forumComments: number;
    totalEngagementXp: number;
  };
}

function DashboardInner({ userId, initialData, initialEngagementStats }: ExperienceDashboardProps) {
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
      {/* ── Header ── */}
      <header className="px-4 sm:px-6 pt-3.5 pb-3 sticky top-0 z-30 bg-gray-1/80 backdrop-blur-xl border-b border-white/[0.04]" style={{ WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <button onClick={() => setIsInfoOpen(true)} className="active:scale-95 transition-transform">
              <Image
                src="/Logo-optiz.png"
                alt="OPTIZ"
                width={38}
                height={38}
                className="object-contain"
                style={{ borderRadius: 0 }}
                priority
              />
            </button>
          </div>

          {/* Right: Streak + XP + Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors active:scale-95"
            >
              <AnimatedFireIcon size={20} />
              <span className="text-[13px] font-bold text-gray-12 tabular-nums">{streakDays}</span>
            </button>


            <button
              onClick={() => setIsXpModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors active:scale-95"
            >
              <AnimatedBoltIcon size={18} />
              <span className="text-[13px] font-bold text-gray-12 tabular-nums">{totalXp}</span>
              <span className="text-[9px] font-extrabold text-[#E80000]">XP</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:brightness-125 shrink-0 active:scale-95 transition-all"
            >
              <Avatar className="w-9 h-9">
                {userPhoto ? (
                  <AvatarImage src={userPhoto} alt={t("profileAlt")} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-transparent text-gray-9">
                  <User className="w-4 h-4" strokeWidth={2} />
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-28 scroll-smooth">
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
            onStartTraining={() => setActiveTab("training")}
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

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-gray-1/80 backdrop-blur-xl border-t border-white/[0.06]" style={{ WebkitBackdropFilter: "blur(20px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch justify-around h-[60px] max-w-lg mx-auto">
          {([
            { value: "home" as TabType, icon: Home, label: t("home") },
            { value: "training" as TabType, icon: Dumbbell, label: t("trainingTab") },
            { value: "steps" as TabType, icon: Footprints, label: t("stepsTab") },
            { value: "diet" as TabType, icon: Apple, label: t("dietTab") },
            { value: "breathwork" as TabType, icon: Wind, label: t("breathworkTab") },
          ]).map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
                  active ? "text-[#E80000]" : "text-gray-7"
                )}
              >
                <tab.icon size={22} strokeWidth={active ? 2 : 1.6} />
                <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
      <LevelUpAnimation
        isVisible={levelUpAnim.visible}
        onComplete={() => setLevelUpAnim({ ...levelUpAnim, visible: false })}
        newLevel={levelUpAnim.newLevel}
      />
      <StreakEarnedAnimation isVisible={streakAnim} onComplete={() => setStreakAnim(false)} />
    </div>
  );
}

export function ExperienceDashboard({ userId, initialData, initialEngagementStats }: ExperienceDashboardProps) {
  return (
    <I18nProvider>
      <DashboardInner userId={userId} initialData={initialData} initialEngagementStats={initialEngagementStats} />
    </I18nProvider>
  );
}
