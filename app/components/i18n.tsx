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
        dayStreak: "{n} day streak",
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
        streakRule1: "Complete at least 1 task every 24 hours to keep your streak alive.",
        streakRule2: "Miss a day? Your streak resets to 0. No exceptions.",
        streakRule3: "Longer streaks unlock special badges and recognition on the leaderboard.",
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
        tasks: "Tasks",
        back: "Back",

        // Info modal
        aboutOptiz: "About OPTIZ",

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
        dayStreak: "{n} jours consécutifs",
        streakSubtitle: "Complète une tâche toutes les 24h",
        onFire: "En feu",
        myTodo: "Mes tâches",
        addBtn: "+ Ajouter",
        closeBtn: "Fermer",
        addTodo: "Ajouter",
        todoPlaceholder: "Que faut-il faire ?",
        noTasks: "Aucune tâche. Appuie sur + Ajouter.",
        quoteBy: "—",

        // Streak modal
        currentStreak: "Série actuelle",
        day: "jour",
        days: "jours",
        thisWeek: "Cette semaine",
        howStreaksWork: "Comment ça marche",
        streakRule1: "Complète au moins 1 tâche toutes les 24h pour garder ta série.",
        streakRule2: "Tu rates un jour ? Ta série repart à 0. Sans exception.",
        streakRule3: "Les séries longues débloquent des badges spéciaux et de la reconnaissance.",
        gotIt: "Compris",
        streakEarned: "Série maintenue ! +50 XP",

        // Milestones
        rankMilestones: "Paliers de rang",
        xpTotal: "{n} XP au total",
        youAreHere: "Tu es ici",
        lvl: "Niv",

        // Challenges
        challengesTitle: "Défis",
        challengesSub: "Rejoins un défi, accomplis les tâches, gagne de l'XP.",
        joined: "inscrits",
        done: "fait",
        open: "Ouvrir →",
        join: "Rejoindre →",
        moreComingSoon: "D'autres défis arrivent bientôt",
        members: "membres",

        // Leaderboard
        leaderboardTitle: "Classement",
        today: "Aujourd'hui",
        week: "Semaine",
        allTime: "Tout le temps",

        // Settings
        settings: "Paramètres",
        editProfile: "Modifier le profil",
        notifications: "Notifications",
        theme: "Thème",
        language: "Langue",
        on: "Activé",
        dark: "Sombre",

        // Challenge program
        tasks: "Tâches",
        back: "Retour",

        // Info modal
        aboutOptiz: "À propos d'OPTIZ",

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
