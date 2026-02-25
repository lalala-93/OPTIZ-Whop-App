"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "fr";

const translations = {
  en: {
    home: "Home",
    challenges: "Workouts",
    leaderboard: "Leaderboard",

    xpLabel: "XP",

    level: "Level",
    dayStreak: "{n}-day streak",
    streakSubtitle: "Complete at least one task every 24h",
    onFire: "On fire",
    myTodo: "My To-do",
    addBtn: "+ Add",
    closeBtn: "Close",
    addTodo: "Add",
    todoPlaceholder: "What needs to get done today?",
    noTasks: "No tasks yet. Tap + Add to start your day.",
    quoteBy: "—",

    currentStreak: "Current Streak",
    day: "day",
    days: "days",
    thisWeek: "This Week",
    howStreaksWork: "How Streaks Work",
    streakRule1: "Finish at least 1 task every 24h to keep your streak alive.",
    streakRule2: "Miss one day and your streak resets to 0.",
    streakRule3: "Long streaks build your rank and social momentum.",
    gotIt: "Got it",
    streakEarned: "Streak secured! +50 XP",

    rankMilestones: "Rank Milestones",
    xpTotal: "{n} XP total",
    youAreHere: "You are here",
    lvl: "Lvl",

    challengesTitle: "Challenges",
    challengesSub: "Train daily, stack XP, move up.",
    joined: "joined",
    done: "done",
    open: "Open →",
    join: "Join →",
    moreComingSoon: "More programs dropping soon",
    members: "members",
    tasks: "Tasks",

    workoutsTitle: "Daily Workouts",
    workoutsSub: "Each card is one workout session. Complete it once per day to earn XP.",
    dailyResetHint: "Completed workouts reset tomorrow so you can train and earn again.",
    reward: "Reward",
    exercises: "exercises",
    minutesShort: "min",
    ready: "Ready",
    doneToday: "Done today",
    resetsTomorrow: "Resets tomorrow",
    openWorkoutHint: "Customize sets, reps, and pace before starting.",
    workoutLockedUntilTomorrow: "Locked until tomorrow reset",
    reviewWorkout: "Review",
    startWorkout: "Start Workout",
    sessionLabel: "Session",
    workoutPushTitle: "Push Strength",
    workoutPullTitle: "Pull Strength",
    workoutLegsTitle: "Legs & Core",
    workoutUpperTitle: "Upper Performance",
    workoutPushFocus: "Chest, shoulders, triceps",
    workoutPullFocus: "Back, biceps, rear delts",
    workoutLegsFocus: "Quads, glutes, core",
    workoutUpperFocus: "Full upper body",

    sets: "sets",
    reps: "reps",
    rest: "rest",
    sound: "Sound",
    currentExercise: "Current exercise",
    timeLeftInRound: "Time left in round",
    completeWorkoutCta: "Complete Workout",
    completeWorkoutProgress: "Complete ({done}/{total})",
    savingWorkout: "Saving...",
    exerciseName: "Exercise name",
    targetMuscles: "Target muscles",
    workoutPrescription: "Prescription",
    watchDemo: "Watch demo",
    roundDuration: "Round duration",
    roundDurationHint: "One round = one set block in EMOM mode.",
    totalSets: "total sets",
    reset: "Reset",
    setLabel: "Set {current}/{total}",

    leaderboardTitle: "Leaderboard",
    today: "Today",
    week: "Week",
    allTime: "All Time",

    settings: "Settings",
    editProfile: "Edit Profile",
    notifications: "Notifications",
    theme: "Theme",
    language: "Language",
    on: "On",
    dark: "Dark",

    back: "Back",
    progress: "Progress",
    dailyProgram: "Daily Program",
    todaysTasks: "Today's Tasks",
    allDone: "All workouts complete",
    xpEarned: "+{n} XP earned. Reset happens tomorrow.",

    difficulty: "Difficulty",
    closeCta: "Close",
    joinChallenge: "Join Challenge",

    whatIsOptiz: "What is OPTIZ?",
    aboutOptizDesc:
      "OPTIZ is a performance-first fitness app that turns consistency into visible progression.",
    earnXp: "Earn XP",
    earnXpDesc: "Complete tasks and workouts every day",
    rankUp: "Rank Up",
    rankUpDesc: "4 tiers, 20 levels, unlimited progression",
    buildStreaks: "Build Streaks",
    buildStreaksDesc: "Stay consistent to protect momentum",
    compete: "Compete",
    competeDesc: "Climb real rankings and outperform",
    aboutQuote: "1% better every day.",
    letsGo: "Let's Go",

    totalXP: "Total XP",
    streak: "Streak",
    tasksDone: "Tasks Done",
    workoutsDone: "Workouts Done",
    deleteMyData: "Delete my data",
    deleteDataTitle: "Delete all personal data?",
    deleteDataBody: "This permanently deletes your profile, tasks, streak, and workout history.",
    deleteConfirm: "Delete",
    deleting: "Deleting...",
    cancel: "Cancel",
  },
  fr: {
    home: "Accueil",
    challenges: "Workouts",
    leaderboard: "Classement",

    xpLabel: "XP",

    level: "Niveau",
    dayStreak: "Série de {n} jours",
    streakSubtitle: "Termine au moins une tâche toutes les 24h",
    onFire: "En feu",
    myTodo: "Mes tâches",
    addBtn: "+ Ajouter",
    closeBtn: "Fermer",
    addTodo: "Ajouter",
    todoPlaceholder: "Qu'est-ce que tu dois finir aujourd'hui ?",
    noTasks: "Aucune tâche. Appuie sur + Ajouter pour lancer ta journée.",
    quoteBy: "—",

    currentStreak: "Série actuelle",
    day: "jour",
    days: "jours",
    thisWeek: "Cette semaine",
    howStreaksWork: "Comment fonctionne la série",
    streakRule1: "Termine au moins 1 tâche toutes les 24h pour garder ta série.",
    streakRule2: "Si tu rates un jour, ta série revient à 0.",
    streakRule3: "Les longues séries renforcent ton rang et ta visibilité.",
    gotIt: "Compris",
    streakEarned: "Série validée ! +50 XP",

    rankMilestones: "Paliers de rang",
    xpTotal: "{n} XP total",
    youAreHere: "Tu es ici",
    lvl: "Niv",

    challengesTitle: "Défis",
    challengesSub: "Entraîne-toi chaque jour, cumule de l'XP, monte en rang.",
    joined: "inscrits",
    done: "fait",
    open: "Ouvrir →",
    join: "Rejoindre →",
    moreComingSoon: "D'autres programmes arrivent bientôt",
    members: "membres",
    tasks: "Tâches",

    workoutsTitle: "Workouts du jour",
    workoutsSub: "Chaque carte = une séance. Termine-la une fois par jour pour gagner de l'XP.",
    dailyResetHint: "Les workouts complétés se réinitialisent demain pour que tu puisses regagner de l'XP.",
    reward: "Récompense",
    exercises: "exercices",
    minutesShort: "min",
    ready: "Prêt",
    doneToday: "Fait aujourd'hui",
    resetsTomorrow: "Reset demain",
    openWorkoutHint: "Personnalise séries, reps et rythme avant de lancer.",
    workoutLockedUntilTomorrow: "Verrouillé jusqu'au reset de demain",
    reviewWorkout: "Revoir",
    startWorkout: "Lancer le workout",
    sessionLabel: "Séance",
    workoutPushTitle: "Push Force",
    workoutPullTitle: "Pull Force",
    workoutLegsTitle: "Jambes & Core",
    workoutUpperTitle: "Upper Performance",
    workoutPushFocus: "Pectoraux, épaules, triceps",
    workoutPullFocus: "Dos, biceps, arrière d'épaules",
    workoutLegsFocus: "Quadriceps, fessiers, gainage",
    workoutUpperFocus: "Haut du corps complet",

    sets: "séries",
    reps: "reps",
    rest: "repos",
    sound: "Son",
    currentExercise: "Exercice en cours",
    timeLeftInRound: "Temps restant",
    completeWorkoutCta: "Valider le workout",
    completeWorkoutProgress: "Valider ({done}/{total})",
    savingWorkout: "Enregistrement...",
    exerciseName: "Nom de l'exercice",
    targetMuscles: "Muscles ciblés",
    workoutPrescription: "Prescription",
    watchDemo: "Voir la démo",
    roundDuration: "Durée d'un round",
    roundDurationHint: "Un round = un bloc de série en mode EMOM.",
    totalSets: "séries totales",
    reset: "Réinitialiser",
    setLabel: "Série {current}/{total}",

    leaderboardTitle: "Classement",
    today: "Aujourd'hui",
    week: "Semaine",
    allTime: "Global",

    settings: "Paramètres",
    editProfile: "Modifier le profil",
    notifications: "Notifications",
    theme: "Thème",
    language: "Langue",
    on: "Activé",
    dark: "Sombre",

    back: "Retour",
    progress: "Progression",
    dailyProgram: "Programme du jour",
    todaysTasks: "Tâches du jour",
    allDone: "Tous les workouts sont terminés",
    xpEarned: "+{n} XP gagnés. Réinitialisation demain.",

    difficulty: "Difficulté",
    closeCta: "Fermer",
    joinChallenge: "Rejoindre",

    whatIsOptiz: "C'est quoi OPTIZ ?",
    aboutOptizDesc:
      "OPTIZ est une app fitness orientée performance qui transforme ta régularité en progression visible.",
    earnXp: "Gagne de l'XP",
    earnXpDesc: "Termine tes tâches et workouts chaque jour",
    rankUp: "Monte en rang",
    rankUpDesc: "4 tiers, 20 niveaux, progression illimitée",
    buildStreaks: "Protège ta série",
    buildStreaksDesc: "Reste constant pour garder ton momentum",
    compete: "Affronte les autres",
    competeDesc: "Grimpe un classement réel et dépasse les autres",
    aboutQuote: "1% meilleur chaque jour.",
    letsGo: "C'est parti",

    totalXP: "XP total",
    streak: "Série",
    tasksDone: "Tâches faites",
    workoutsDone: "Workouts terminés",
    deleteMyData: "Supprimer mes données",
    deleteDataTitle: "Supprimer toutes les données ?",
    deleteDataBody: "Cette action supprime définitivement ton profil, tes tâches, ta série et ton historique workouts.",
    deleteConfirm: "Supprimer",
    deleting: "Suppression...",
    cancel: "Annuler",
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
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("optiz-locale") as Locale) || "en";
    }
    return "en";
  });

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("optiz-locale", nextLocale);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let str: string = translations[locale]?.[key] || translations.en[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          str = str.replace(`{${paramKey}}`, String(value));
        });
      }
      return str;
    },
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
