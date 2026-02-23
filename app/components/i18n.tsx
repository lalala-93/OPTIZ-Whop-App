"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "fr";

const translations = {
    en: {
        // Navigation
        home: "Home",
        challenges: "Challenges",
        leaderboard: "Leaderboard",

        // Header / counters
        xpLabel: "XP",

        // Home
        level: "Level",
        dayStreak: "{n}-day streak",
        streakSubtitle: "Complete a task every 24h",
        onFire: "On fire",
        myTodo: "My To-do",
        addBtn: "+ Add",
        closeBtn: "Close",
        addTodo: "Add",
        todoPlaceholder: "What needs to be done?",
        noTasks: "No tasks yet. Tap + Add to get started.",
        quoteBy: "—",

        // Streak modal
        currentStreak: "Current Streak",
        day: "day",
        days: "days",
        thisWeek: "This Week",
        howStreaksWork: "How Streaks Work",
        streakRule1: "Complete at least 1 task every 24h to keep your streak alive.",
        streakRule2: "Miss a day? Your streak resets to 0. No exceptions.",
        streakRule3: "Longer streaks unlock badges and leaderboard recognition.",
        gotIt: "Got it",
        streakEarned: "Streak kept! +50 XP",

        // Milestones
        rankMilestones: "Rank Milestones",
        xpTotal: "{n} XP total",
        youAreHere: "You are here",
        lvl: "Lvl",

        // Challenges
        challengesTitle: "Challenges",
        challengesSub: "Join a challenge, crush tasks, earn XP.",
        joined: "joined",
        done: "done",
        open: "Open →",
        join: "Join →",
        moreComingSoon: "More challenges coming soon",
        members: "members",
        tasks: "Tasks",

        // Leaderboard
        leaderboardTitle: "Leaderboard",
        today: "Today",
        week: "Week",
        allTime: "All Time",

        // Settings
        settings: "Settings",
        editProfile: "Edit Profile",
        notifications: "Notifications",
        theme: "Theme",
        language: "Language",
        on: "On",
        dark: "Dark",

        // Challenge program
        back: "Back",
        progress: "Progress",
        dailyProgram: "Daily Program",
        todaysTasks: "Today's Tasks",
        allDone: "All Tasks Complete!",
        xpEarned: "+{n} XP earned. Come back tomorrow!",

        // Challenge detail modal
        difficulty: "Difficulty",
        closeCta: "Close",
        joinChallenge: "Join Challenge",

        // Info modal
        whatIsOptiz: "What is OPTIZ?",
        aboutOptizDesc: "OPTIZ is a gamified fitness platform that transforms your workouts into a progression journey.",
        earnXp: "Earn XP",
        earnXpDesc: "Complete tasks to gain XP",
        rankUp: "Rank Up",
        rankUpDesc: "Iron to Legend — 10 tiers",
        buildStreaks: "Build Streaks",
        buildStreaksDesc: "Stay consistent every day",
        compete: "Compete",
        competeDesc: "Climb the leaderboard",
        aboutQuote: "1% better every day.",
        letsGo: "Let's Go!",

        // Stats
        totalXP: "Total XP",
        streak: "Streak",
        tasksDone: "Tasks Done",
    },
    fr: {
        // Navigation
        home: "Accueil",
        challenges: "Défis",
        leaderboard: "Classement",

        // Header / counters
        xpLabel: "XP",

        // Home
        level: "Niveau",
        dayStreak: "{n}j de série",
        streakSubtitle: "1 tâche / 24h",
        onFire: "En feu",
        myTodo: "Mes tâches",
        addBtn: "+ Ajouter",
        closeBtn: "Fermer",
        addTodo: "Ajouter",
        todoPlaceholder: "À faire…",
        noTasks: "Rien pour l'instant. Appuie sur + Ajouter.",
        quoteBy: "—",

        // Streak modal
        currentStreak: "Série actuelle",
        day: "jour",
        days: "jours",
        thisWeek: "Cette semaine",
        howStreaksWork: "Comment ça marche",
        streakRule1: "Fais au moins 1 tâche par 24h pour garder ta série.",
        streakRule2: "Tu rates un jour ? Retour à 0. Aucune exception.",
        streakRule3: "Les longues séries débloquent des badges et du prestige.",
        gotIt: "Compris",
        streakEarned: "Série gardée ! +50 XP",

        // Milestones
        rankMilestones: "Paliers de rang",
        xpTotal: "{n} XP au total",
        youAreHere: "Tu es ici",
        lvl: "Niv",

        // Challenges
        challengesTitle: "Défis",
        challengesSub: "Rejoins un défi, gagne de l'XP.",
        joined: "inscrits",
        done: "fait",
        open: "Ouvrir →",
        join: "Rejoindre →",
        moreComingSoon: "D'autres défis arrivent bientôt",
        members: "membres",
        tasks: "Tâches",

        // Leaderboard
        leaderboardTitle: "Classement",
        today: "Aujourd'hui",
        week: "Semaine",
        allTime: "Global",

        // Settings
        settings: "Paramètres",
        editProfile: "Modifier le profil",
        notifications: "Notifs",
        theme: "Thème",
        language: "Langue",
        on: "Activé",
        dark: "Sombre",

        // Challenge program
        back: "Retour",
        progress: "Progrès",
        dailyProgram: "Programme du jour",
        todaysTasks: "Tâches du jour",
        allDone: "Tout est fait !",
        xpEarned: "+{n} XP gagnés. Reviens demain !",

        // Challenge detail modal
        difficulty: "Difficulté",
        closeCta: "Fermer",
        joinChallenge: "Rejoindre",

        // Info modal
        whatIsOptiz: "C'est quoi OPTIZ ?",
        aboutOptizDesc: "OPTIZ transforme tes séances en un parcours de progression gamifié.",
        earnXp: "Gagne de l'XP",
        earnXpDesc: "Fais des tâches, gagne de l'XP",
        rankUp: "Monte en rang",
        rankUpDesc: "Fer à Légende — 10 paliers",
        buildStreaks: "Séries",
        buildStreaksDesc: "Sois régulier chaque jour",
        compete: "Classement",
        competeDesc: "Grimpe les rangs",
        aboutQuote: "1% de mieux chaque jour.",
        letsGo: "C'est parti !",

        // Stats
        totalXP: "XP total",
        streak: "Série",
        tasksDone: "Tâches faites",
    },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
    locale: "en",
    setLocale: () => { },
    t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("optiz-locale") as Locale) || "en";
        }
        return "en";
    });

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        if (typeof window !== "undefined") {
            localStorage.setItem("optiz-locale", l);
        }
    }, []);

    const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
        let str: string = translations[locale]?.[key] || translations.en[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
