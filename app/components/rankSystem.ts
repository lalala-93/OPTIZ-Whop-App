// ═══════════════════════════════════════════════
// OPTIZ Rank System — 4 Tiers, 20 Levels
// ═══════════════════════════════════════════════

export interface RankTier {
    name: string;
    minLevel: number;
    maxLevel: number;
    color: string;
    colorLight: string;
    gradient: [string, string];
    glowColor: string;
    ringBg: string;
}

export const RANK_TIERS: RankTier[] = [
    { name: "Initiate", minLevel: 1, maxLevel: 5, color: "#9CA3AF", colorLight: "#E5E7EB", gradient: ["#374151", "#9CA3AF"], glowColor: "rgba(156,163,175,0.3)", ringBg: "rgba(156,163,175,0.15)" },
    { name: "Grinder", minLevel: 6, maxLevel: 10, color: "#D97706", colorLight: "#FBBF24", gradient: ["#92400E", "#FBBF24"], glowColor: "rgba(217,119,6,0.3)", ringBg: "rgba(217,119,6,0.15)" },
    { name: "Elite", minLevel: 11, maxLevel: 15, color: "#E80000", colorLight: "#FF5252", gradient: ["#7F1D1D", "#FF5252"], glowColor: "rgba(232,0,0,0.4)", ringBg: "rgba(232,0,0,0.2)" },
    { name: "Apex", minLevel: 16, maxLevel: 999, color: "#FFD700", colorLight: "#FEF08A", gradient: ["#B45309", "#FEF08A"], glowColor: "rgba(255,215,0,0.5)", ringBg: "rgba(255,215,0,0.25)" },
];

// ── XP Calculation ── (uncapped — users can go beyond level 20)
export function getXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.12, level - 1));
}

export function getLevelProgress(totalXp: number) {
    let level = 1;
    let remaining = totalXp;

    while (true) {
        const needed = getXpForLevel(level);
        if (remaining < needed) {
            return {
                level,
                currentLevelXp: remaining,
                xpForNextLevel: needed,
                progressPercent: Math.min((remaining / needed) * 100, 100),
                totalXp,
            };
        }
        remaining -= needed;
        level++;
    }
}

// ── Rank Lookup ──
export function getRankForLevel(level: number) {
    const tier = RANK_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel)
        || RANK_TIERS[RANK_TIERS.length - 1];
    return {
        tier,
        fullName: tier.name,
    };
}

// ── Types ──
export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Exercise {
    name: string;
    sets: string;
    muscles: string;
    youtubeUrl: string;
}

export interface ChallengeTask {
    id: string;
    name: string;
    emoji: string;
    xpReward: number;
    completed: boolean;
    exercises?: Exercise[];
    youtubeUrl?: string;
    color?: string;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    emoji: string;
    difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
    durationDays: number;
    participantCount: number;
    taskCount: number;
    totalXp: number;
    tasks: ChallengeTask[];
    joined: boolean;
}

// ── Task Descriptions (for TaskInfoModal) ──
export const TASK_DESCRIPTIONS: Record<string, { benefit: string; tips: string }> = {
    "push1": { benefit: "Développe la force de poussée. Cible les pectoraux, épaules et triceps.", tips: "Contrôle chaque rep. En RIR1 (1 rep en réserve)." },
    "pull1": { benefit: "Renforce le dos et les biceps. Développe le V-shape et le grip.", tips: "Tire vers la poitrine pour les tractions. Contracte bien le dos en haut." },
    "legs1": { benefit: "Renforcement global des jambes, fessiers et gainage.", tips: "Garde le dos droit. Descends le plus bas possible en squat." },
    "upper1": { benefit: "Rappel global haut du corps avec focus poussée/tirage.", tips: "Maintiens le même nombre de reps dans les EMOM. Note tes temps de Dead Hang." },
};

// ── Stable number formatting (avoids hydration mismatch) ──
export function formatNumber(n: number): string {
    if (n < 1000) return String(n);
    const parts: string[] = [];
    let remaining = n;
    while (remaining >= 1000) {
        parts.unshift(String(remaining % 1000).padStart(3, "0"));
        remaining = Math.floor(remaining / 1000);
    }
    parts.unshift(String(remaining));
    return parts.join(",");
}

// ── Mock Data ──
export const MOTIVATIONAL_QUOTES = [
    { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
    { text: "Be stronger than your excuses.", author: "Unknown" },
    { text: "1% better every day.", author: "OPTIZ" },
    { text: "Champions are made when nobody's watching.", author: "Unknown" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
];

export const OPTIZ_MAX_CHALLENGE: Challenge = {
    id: "optiz-max",
    title: "OPTIZ Max",
    description: "Programme Haltères / Dips / Tractions — 4 séances.",
    longDescription: "Programme complet de musculation avec haltères, dips et tractions. 4 séances par semaine : Push, Pull, Legs, Upper. Chaque exercice est filmé et expliqué. En RIR1 — donne tout !",
    emoji: "🏋️",
    difficulty: "Hard",
    durationDays: 30,
    participantCount: 847,
    taskCount: 4,
    totalXp: 200,
    joined: false,
    tasks: [
        {
            id: "push1",
            name: "🟥 Push 1 — Pecs / Épaules / Triceps",
            emoji: "🟥",
            xpReward: 50,
            completed: false,
            color: "#E80000",
            exercises: [
                { name: "Dips (en force)", sets: "3 × 4-8 reps", muscles: "Pecs, triceps, épaules avant", youtubeUrl: "https://youtube.com/shorts/MTWrCC1gTuU?si=BNHkdbUIb68KzR-q" },
                { name: "Développé militaire (haltères)", sets: "3 séries", muscles: "Épaules, triceps", youtubeUrl: "https://www.youtube.com/watch?v=5pjcqP_nqRA" },
                { name: "Écarté couché (haltères)", sets: "3 séries", muscles: "Pecs", youtubeUrl: "https://youtube.com/shorts/tekqcBETXyQ?si=qDHuJiPKkg8skkJx" },
                { name: "Skull crushers (haltères)", sets: "3 séries", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/IfNBr2zw6rw?si=Mpu7DkQ3HPq15qQf" },
                { name: "Pompes — AMRAP", sets: "1-2 séries max reps", muscles: "Pecs, triceps, gainage", youtubeUrl: "https://youtu.be/xbciD15GlPs?si=nLfZfIQ2PFegkGEF" },
            ],
        },
        {
            id: "pull1",
            name: "🟦 Pull 1 — Dos / Biceps / Épaules",
            emoji: "🟦",
            xpReward: 50,
            completed: false,
            color: "#3B82F6",
            exercises: [
                { name: "Tractions pronation (en force)", sets: "3 × 4-8 reps", muscles: "Grand dorsal, trapèzes, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Élévations latérales (haltères)", sets: "3 séries", muscles: "Épaules (faisceau moyen)", youtubeUrl: "https://www.youtube.com/watch?v=67aqcWUYw2I" },
                { name: "Rowing unilatéral \"bûcheron\" (haltère)", sets: "3 séries / bras", muscles: "Dos, biceps", youtubeUrl: "https://www.youtube.com/watch?v=67aqcWUYw2I" },
                { name: "Chin Up (supination)", sets: "3 séries", muscles: "Biceps, dorsaux", youtubeUrl: "https://youtube.com/shorts/Oi3bW9nQmGI?si=Ock9i-K6Z11rGZNZ" },
                { name: "Curl marteau (haltères)", sets: "3 séries", muscles: "Biceps, avant-bras", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
            ],
        },
        {
            id: "legs1",
            name: "🟩 Legs — Jambes / Fessiers / Gainage",
            emoji: "🟩",
            xpReward: 50,
            completed: false,
            color: "#10B981",
            exercises: [
                { name: "Goblet Squat (haltère)", sets: "3 séries", muscles: "Quadriceps, fessiers, gainage", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
                { name: "Fentes bulgares (haltères)", sets: "3 séries / jambe", muscles: "Quadriceps, fessiers", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
                { name: "Romanian Deadlift (haltères, tempo lent)", sets: "3 séries", muscles: "Ischios, fessiers, bas du dos", youtubeUrl: "https://youtube.com/shorts/XtruE8T-19Q?si=TkIpqFpQW6HJQkH0" },
                { name: "Hip Thrust unilatéral au sol", sets: "3 séries / jambe", muscles: "Fessiers", youtubeUrl: "https://www.youtube.com/watch?v=zGxR8AmuOm4" },
                { name: "Chaise contre un mur — Max Hold", sets: "1 série max hold", muscles: "Quadriceps, gainage isométrique", youtubeUrl: "https://youtube.com/shorts/EE-A7qkMOek?si=STp3jXoDD19p2xvx" },
            ],
        },
        {
            id: "upper1",
            name: "🟪 Upper — Rappel Haut du Corps",
            emoji: "🟪",
            xpReward: 50,
            completed: false,
            color: "#8B5CF6",
            exercises: [
                { name: "Développé couché au sol (haltères)", sets: "3 séries", muscles: "Pecs, triceps, épaules", youtubeUrl: "https://youtube.com/shorts/EE-A7qkMOek?si=STp3jXoDD19p2xvx" },
                { name: "Tractions pronation (volume)", sets: "3 × 8-12 reps", muscles: "Grand dorsal, trapèzes, biceps", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Dips — EMOM 10 minutes", sets: "EMOM 10 min", muscles: "Pecs, triceps, épaules", youtubeUrl: "https://youtube.com/shorts/6zISFVRhN2c?si=b3_HydHFYq-OmEcJ" },
                { name: "Extension triceps nuque (haltère)", sets: "3 séries", muscles: "Triceps", youtubeUrl: "https://youtube.com/shorts/AsUqyuzZBJA?si=WiiIfLjgyhaQmtmV" },
                { name: "Curl biceps (haltères)", sets: "3 séries", muscles: "Biceps", youtubeUrl: "https://youtu.be/MzNKcgL1lVU?si=WL4TYfS_a1BvMY2Q" },
                { name: "Dead Hang — Max Hold", sets: "3 séries max hold", muscles: "Grip, avant-bras, épaules", youtubeUrl: "https://www.youtube.com/shorts/dombLZaQIz0" },
            ],
        },
    ],
};

export const MOCK_LEADERBOARD = [
    { rank: 1, name: "Alex F.", xp: 12500, level: 18, emoji: "🥇" },
    { rank: 2, name: "Sarah M.", xp: 11200, level: 16, emoji: "🥈" },
    { rank: 3, name: "John D.", xp: 8400, level: 13, emoji: "🥉" },
    { rank: 4, name: "Emma L.", xp: 6200, level: 10, emoji: "💪" },
    { rank: 5, name: "Mike R.", xp: 5100, level: 9, emoji: "⚡" },
    { rank: 6, name: "Lisa K.", xp: 4300, level: 8, emoji: "🔥" },
    { rank: 7, name: "Tom B.", xp: 3800, level: 7, emoji: "🏃" },
    { rank: 8, name: "Nina W.", xp: 2900, level: 6, emoji: "🧘" },
];
