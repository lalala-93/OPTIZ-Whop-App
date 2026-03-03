"use client";

import { useCallback, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Tabs } from "@whop/react/components";
import Image from "next/image";
import { HomeScreen } from "./HomeScreen";
import { TrainingHubScreen } from "./TrainingHubScreen";
import { StepsScreen } from "./StepsScreen";
import { DietScreen } from "./DietScreen";
import { BreathworkScreen } from "./BreathworkScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { SettingsSheet } from "./SettingsSheet";
import { TaskCompleteAnimation } from "./TaskCompleteAnimation";
import { LevelUpAnimation } from "./LevelUpAnimation";
import { InfoModal } from "./InfoModal";
import { StreakModal } from "./StreakModal";
import { XPMilestonesModal } from "./XPMilestonesModal";
import { StreakEarnedAnimation } from "./StreakEarnedAnimation";
import { AnimatedFireIcon, AnimatedBoltIcon } from "./AnimatedIcons";
import { I18nProvider, useI18n } from "./i18n";
import { getLevelProgress, getRankForLevel } from "./rankSystem";
import {
  awardXp as serverAwardXp,
  updateProfile as serverUpdateProfile,
  deleteUserData as serverDeleteUserData,
} from "@/lib/actions";

type TabType = "home" | "training" | "steps" | "diet" | "breathwork" | "leaderboard";

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

  const handleAwardTrainingXp = useCallback(
    async (xp: number) => {
      if (xp <= 0) return;

      const previousLevel = getLevelProgress(totalXp).level;
      const optimisticTotalXp = totalXp + xp;
      const optimisticLevel = getLevelProgress(optimisticTotalXp).level;

      setTotalXp(optimisticTotalXp);
      setWorkoutsDone((prev) => prev + 1);
      setTaskCompleteAnim({ visible: true, xp });

      if (optimisticLevel > previousLevel) {
        setTimeout(() => setLevelUpAnim({ visible: true, newLevel: optimisticLevel }), 1100);
      }

      startTransition(async () => {
        try {
          const result = await serverAwardXp(userId, xp, "todo");
          setTotalXp(result.totalXp);
          setStreakDays(result.streakDays);
          if (result.streakEarned) setStreakAnim(true);
        } catch (err) {
          console.error("Failed to award training XP:", err);
          setTotalXp((prev) => Math.max(0, prev - xp));
          setWorkoutsDone((prev) => Math.max(0, prev - 1));
        }
      });
    },
    [totalXp, userId, startTransition],
  );

  return (
    <div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col w-full relative">
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
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              <span className="text-sm font-bold text-gray-12 tabular-nums">{totalXp}</span>
              <span className="text-[10px] font-extrabold text-[#E80000]">{t("xpLabel")}</span>
            </motion.button>

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
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <Tabs.List className="min-w-max [&_[data-state=active]]:!border-b-[#E80000] [&_[data-state=active]]:!border-b-2 [&_[data-state=active]]:!text-gray-12">
              <Tabs.Trigger value="home">{t("home")}</Tabs.Trigger>
              <Tabs.Trigger value="training">{t("trainingTab")}</Tabs.Trigger>
              <Tabs.Trigger value="steps">{t("stepsTab")}</Tabs.Trigger>
              <Tabs.Trigger value="diet">{t("dietTab")}</Tabs.Trigger>
              <Tabs.Trigger value="breathwork">{t("breathworkTab")}</Tabs.Trigger>
              <Tabs.Trigger value="leaderboard">{t("leaderboard")}</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
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
            rankFullName={rankData.fullName}
            rankColors={rankData.tier.gradient}
            streakDays={streakDays}
            weeklyProgress={weeklyProgress}
            onXpRingClick={() => setIsXpModalOpen(true)}
            onOpenLeaderboard={() => setActiveTab("leaderboard")}
          />
        ) : activeTab === "training" ? (
          <TrainingHubScreen userId={userId} onAwardXp={handleAwardTrainingXp} />
        ) : activeTab === "steps" ? (
          <StepsScreen userId={userId} />
        ) : activeTab === "diet" ? (
          <DietScreen userId={userId} />
        ) : activeTab === "breathwork" ? (
          <BreathworkScreen userId={userId} />
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
