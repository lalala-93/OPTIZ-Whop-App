"use server";

import { createServerSupabase } from "@/lib/supabase";

// ══════════════════════════════════════
// Server Actions — called from client with userId passed from SSR
// userId MUST come from verifyUser() in the server component, NOT from client
// ══════════════════════════════════════

/** Load full user profile + todos + challenges + streak */
export async function loadUserData(userId: string) {
    const db = createServerSupabase();

    // Ensure profile exists (auto-create on first visit)
    let profile: { total_xp: number | null; streak_days: number | null; display_name: string | null; avatar_url: string | null; locale: string | null } | null = null;
    try {
        const { data, error } = await db
            .from("user_profiles")
            .select("total_xp, streak_days, display_name, avatar_url, locale")
            .eq("whop_user_id", userId)
            .single();

        if (error && error.code === "PGRST116") {
            // No row found — auto-create
            const { data: newProfile } = await db
                .from("user_profiles")
                .insert({ whop_user_id: userId })
                .select("total_xp, streak_days, display_name, avatar_url, locale")
                .single();
            profile = newProfile;
        } else {
            profile = data;
        }
    } catch (err) {
        console.error("[OPTIZ] Profile load error:", err);
    }

    // Parallel fetch with individual error handling
    const today = new Date().toISOString().split("T")[0];

    const [todosRes, challengesRes, tasksRes, joinedRes, streakRes, completionsRes, participantsRes] = await Promise.all([
        db.from("todos").select("id, text, completed").eq("user_id", userId).order("created_at", { ascending: false }),
        db.from("challenges").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        db.from("challenge_tasks").select("*").order("sort_order", { ascending: true }),
        db.from("user_challenges").select("challenge_id").eq("user_id", userId),
        db.from("streak_log").select("streak_date").eq("user_id", userId).order("streak_date", { ascending: false }).limit(30),
        db.from("task_completions").select("task_id").eq("user_id", userId).eq("completed_date", today),
        db.from("user_challenges").select("challenge_id"),
    ]);

    // Compute participant counts
    const participantCounts: Record<string, number> = {};
    (participantsRes.data || []).forEach((p: { challenge_id: string }) => {
        participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1;
    });

    const joinedIds = new Set((joinedRes.data || []).map((j: { challenge_id: string }) => j.challenge_id));
    const completedTaskIds = new Set((completionsRes.data || []).map((c: { task_id: string }) => c.task_id));

    // Auto-seed challenge if empty
    let fetchedChallenges = challengesRes.data || [];
    let fetchedTasks = tasksRes.data || [];

    if (fetchedChallenges.length === 0) {
        try {
            const { data: seededChallenge, error: challengeErr } = await db.from("challenges").insert({
                id: "optiz-max",
                title: "OPTIZ Max",
                description: "30-day elite fitness program — push your limits.",
                long_desc: "The ultimate 30-day transformation challenge. Complete daily tasks across cardio, strength, flexibility, and nutrition to earn XP, level up your rank, and compete on the global leaderboard. Designed for those who refuse to settle.",
                emoji: "🔥",
                difficulty: "Hard",
                duration_days: 30,
                total_xp: 380,
                is_active: true
            }).select().single();

            if (!challengeErr && seededChallenge) {
                fetchedChallenges = [seededChallenge];
                const tasksToInsert = [
                    { id: "t1", challenge_id: "optiz-max", name: "Morning Run — 5km", emoji: "🏃‍♂️", xp_reward: 50, sort_order: 1 },
                    { id: "t2", challenge_id: "optiz-max", name: "100 Push-ups", emoji: "💪", xp_reward: 50, sort_order: 2 },
                    { id: "t3", challenge_id: "optiz-max", name: "Yoga Session — 20min", emoji: "🧘‍♀️", xp_reward: 30, sort_order: 3 },
                    { id: "t4", challenge_id: "optiz-max", name: "Drink 3L Water", emoji: "💧", xp_reward: 20, sort_order: 4 },
                    { id: "t5", challenge_id: "optiz-max", name: "Eat Clean — No Junk", emoji: "🥗", xp_reward: 40, sort_order: 5 },
                    { id: "t6", challenge_id: "optiz-max", name: "Cold Shower", emoji: "🥶", xp_reward: 50, sort_order: 6 },
                    { id: "t7", challenge_id: "optiz-max", name: "200 Sit-ups", emoji: "🔥", xp_reward: 50, sort_order: 7 },
                    { id: "t8", challenge_id: "optiz-max", name: "10min Meditation", emoji: "🧠", xp_reward: 40, sort_order: 8 },
                    { id: "t9", challenge_id: "optiz-max", name: "Read 30 Pages", emoji: "📖", xp_reward: 50, sort_order: 9 },
                ];
                const { data: seededTasks } = await db.from("challenge_tasks").insert(tasksToInsert).select();
                fetchedTasks = seededTasks || tasksToInsert;
            }
        } catch (e) {
            console.error("[OPTIZ] Auto-seed failed", e);
        }
    }

    // Assemble challenges with tasks
    const challenges = fetchedChallenges.map((c: Record<string, unknown>) => {
        const tasks = fetchedTasks.filter((t: Record<string, unknown>) => t.challenge_id === c.id);
        return {
            id: c.id as string,
            title: c.title as string,
            description: (c.description as string) || "",
            longDescription: (c.long_desc as string) || "",
            emoji: (c.emoji as string) || "🔥",
            difficulty: (c.difficulty as string) || "Medium",
            durationDays: (c.duration_days as number) || 30,
            participantCount: participantCounts[c.id as string] || 0,
            totalXp: (c.total_xp as number) || 0,
            joined: joinedIds.has(c.id as string),
            tasks: tasks.map((t: Record<string, unknown>) => ({
                id: t.id as string,
                name: t.name as string,
                emoji: (t.emoji as string) || "⚡",
                xpReward: (t.xp_reward as number) ?? 10,
                completed: completedTaskIds.has(t.id as string),
            })),
        };
    });

    // Weekly streak progress
    const now = new Date();
    const currentDow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDow === 0 ? 6 : currentDow - 1));
    monday.setHours(0, 0, 0, 0);

    const weeklyProgress = [false, false, false, false, false, false, false];
    for (const s of (streakRes.data || []) as { streak_date: string | null }[]) {
        if (!s.streak_date) continue;
        const d = new Date(s.streak_date + "T00:00:00");
        if (d >= monday) {
            const dow = d.getDay();
            weeklyProgress[dow === 0 ? 6 : dow - 1] = true;
        }
    }

    const completedTodos = (todosRes.data || []).filter((t: { completed: boolean | null }) => t.completed).length;

    return {
        profile: profile ? {
            totalXp: profile.total_xp ?? 0,
            streakDays: profile.streak_days ?? 0,
            displayName: profile.display_name || "User",
            avatarUrl: profile.avatar_url || null,
            locale: profile.locale || null,
        } : { totalXp: 0, streakDays: 0, displayName: "User", avatarUrl: null, locale: null },
        todos: (todosRes.data || []).map((t: { id: string; text: string; completed: boolean | null }) => ({
            id: t.id,
            text: t.text,
            completed: t.completed ?? false,
        })),
        challenges,
        weeklyProgress,
        totalTasksCompleted: completedTodos,
    };
}

/** Add a new todo */
export async function addTodo(userId: string, text: string) {
    const db = createServerSupabase();
    const { data, error } = await db
        .from("todos")
        .insert({ user_id: userId, text })
        .select("id, text, completed")
        .single();

    if (error) throw new Error(error.message);
    return { id: data.id, text: data.text, completed: data.completed ?? false };
}

/** Toggle a todo's completed status */
export async function toggleTodo(userId: string, todoId: string, completed: boolean) {
    const db = createServerSupabase();
    await db
        .from("todos")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", todoId)
        .eq("user_id", userId);
}

/** Delete a todo */
export async function deleteTodo(userId: string, todoId: string) {
    const db = createServerSupabase();
    await db
        .from("todos")
        .delete()
        .eq("id", todoId)
        .eq("user_id", userId);
}

/** Award XP + handle streak logic, return updated values */
export async function awardXp(userId: string, xp: number, source: "todo" | "challenge", taskId?: string) {
    const db = createServerSupabase();

    // Get current profile
    const { data: profile } = await db
        .from("user_profiles")
        .select("total_xp, streak_days, last_task_at")
        .eq("whop_user_id", userId)
        .single();

    if (!profile) {
        console.error("[OPTIZ] awardXp: User not found", userId);
        return { totalXp: xp, streakDays: 0, streakBonusXp: 0, streakEarned: false };
    }

    const newTotalXp = (profile.total_xp ?? 0) + xp;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Streak check
    const { data: existingStreak } = await db
        .from("streak_log")
        .select("id")
        .eq("user_id", userId)
        .eq("streak_date", today)
        .single();

    let newStreakDays = profile.streak_days ?? 0;
    let streakBonusXp = 0;
    let streakEarned = false;

    if (!existingStreak) {
        await db.from("streak_log").insert({ user_id: userId, streak_date: today });

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const { data: yesterdayStreak } = await db
            .from("streak_log")
            .select("id")
            .eq("user_id", userId)
            .eq("streak_date", yesterdayStr)
            .single();

        if (yesterdayStreak || (profile.streak_days ?? 0) === 0) {
            newStreakDays = (profile.streak_days ?? 0) + 1;
            streakBonusXp = 50;
            streakEarned = true;
        } else {
            newStreakDays = 1;
        }
    }

    // Update profile
    await db
        .from("user_profiles")
        .update({
            total_xp: newTotalXp + streakBonusXp,
            streak_days: newStreakDays,
            last_task_at: now.toISOString(),
            updated_at: now.toISOString(),
        })
        .eq("whop_user_id", userId);

    // Challenge task completion
    if (source === "challenge" && taskId) {
        await db.from("task_completions").insert({
            user_id: userId,
            task_id: taskId,
            xp_earned: xp,
            completed_date: today,
        });
    }

    // Leaderboard uses direct queries so no refresh needed

    return {
        totalXp: newTotalXp + streakBonusXp,
        streakDays: newStreakDays,
        streakBonusXp,
        streakEarned,
    };
}

/** Join a challenge */
export async function joinChallenge(userId: string, challengeId: string) {
    const db = createServerSupabase();
    await db
        .from("user_challenges")
        .upsert({ user_id: userId, challenge_id: challengeId }, { onConflict: "user_id,challenge_id" });
}

/** Get leaderboard data */
export async function getLeaderboard(userId: string) {
    try {
        const db = createServerSupabase();

        const { data: users } = await db
            .from("user_profiles")
            .select("whop_user_id, display_name, avatar_url, total_xp, streak_days")
            .gt("total_xp", 0)
            .order("total_xp", { ascending: false })
            .limit(100);

        const leaderboard = (users || []).map((u, i) => ({
            whop_user_id: u.whop_user_id,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            total_xp: u.total_xp,
            streak_days: u.streak_days,
            position: i + 1,
        }));

        // Find user's position — use maybeSingle to avoid crash on no rows
        const userEntry = leaderboard.find(e => e.whop_user_id === userId);
        let userPosition = userEntry?.position ?? null;

        if (!userEntry) {
            const { data: userProfile } = await db
                .from("user_profiles")
                .select("total_xp")
                .eq("whop_user_id", userId)
                .maybeSingle();

            if (userProfile && (userProfile.total_xp ?? 0) > 0) {
                const { count } = await db
                    .from("user_profiles")
                    .select("*", { count: "exact", head: true })
                    .gt("total_xp", userProfile.total_xp ?? 0);
                userPosition = (count || 0) + 1;
            }
        }

        return { leaderboard, userPosition };
    } catch (err) {
        console.error("[OPTIZ] getLeaderboard error:", err);
        return { leaderboard: [], userPosition: null };
    }
}

/** Update profile fields */
export async function updateProfile(userId: string, fields: { display_name?: string; avatar_url?: string; locale?: string }) {
    const db = createServerSupabase();
    await db
        .from("user_profiles")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("whop_user_id", userId);
}
