"use server";

import { createServerSupabase } from "@/lib/supabase";
import { fetchWhopUserProfile } from "@/lib/authentication";
import { OPTIZ_MAX_CHALLENGE } from "@/app/components/rankSystem";
import type { Json } from "@/lib/database.types";

function normalizeTaskName(name: string): string {
    return name
        .replace(/^[^\w]+/u, "")
        .replace(/[—-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// ══════════════════════════════════════
// V2 Helpers
// ══════════════════════════════════════

function getTodayISO() {
    return new Date().toISOString().split("T")[0];
}

/** Shared streak logic — checks/inserts streak_log, returns updated streak + bonus */
async function handleStreakLogic(
    db: ReturnType<typeof createServerSupabase>,
    userId: string,
    currentStreakDays: number,
): Promise<{ streakDays: number; streakBonusXp: number; streakEarned: boolean }> {
    const now = new Date();
    const today = getTodayISO();

    const { data: existingStreak } = await db
        .from("streak_log")
        .select("id")
        .eq("user_id", userId)
        .eq("streak_date", today)
        .maybeSingle();

    if (existingStreak) {
        return { streakDays: currentStreakDays, streakBonusXp: 0, streakEarned: false };
    }

    await db.from("streak_log").insert({ user_id: userId, streak_date: today });

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: yesterdayStreak } = await db
        .from("streak_log")
        .select("id")
        .eq("user_id", userId)
        .eq("streak_date", yesterdayStr)
        .maybeSingle();

    if (yesterdayStreak || currentStreakDays === 0) {
        return { streakDays: currentStreakDays + 1, streakBonusXp: 50, streakEarned: true };
    }

    return { streakDays: 1, streakBonusXp: 0, streakEarned: false };
}

// ══════════════════════════════════════
// Server Actions — called from client with userId passed from SSR
// userId MUST come from verifyUser() in the server component, NOT from client
// ══════════════════════════════════════

/** Load full user profile + todos + challenges + streak + V2 daily data */
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
            const whopProfile = await fetchWhopUserProfile(userId);
            const { data: newProfile } = await db
                .from("user_profiles")
                .insert({
                    whop_user_id: userId,
                    display_name: whopProfile.displayName || null,
                    avatar_url: whopProfile.avatarUrl || null,
                })
                .select("total_xp, streak_days, display_name, avatar_url, locale")
                .single();
            profile = newProfile;
        } else {
            profile = data;
            if (profile && (!profile.display_name || profile.display_name === "User" || !profile.avatar_url)) {
                const whopProfile = await fetchWhopUserProfile(userId);
                const updates: Record<string, string> = {};
                if (whopProfile.displayName && (!profile.display_name || profile.display_name === "User")) {
                    updates.display_name = whopProfile.displayName;
                    profile.display_name = whopProfile.displayName;
                }
                if (whopProfile.avatarUrl && !profile.avatar_url) {
                    updates.avatar_url = whopProfile.avatarUrl;
                    profile.avatar_url = whopProfile.avatarUrl;
                }
                if (Object.keys(updates).length > 0) {
                    await db.from("user_profiles").update(updates).eq("whop_user_id", userId);
                }
            }
        }
    } catch (err) {
        console.error("[OPTIZ] Profile load error:", err);
    }

    const today = getTodayISO();

    const [
        todosRes, challengesRes, tasksRes, joinedRes, streakRes,
        completionsRes, participantsRes,
        // V2 queries
        stepsTodayRes, nutritionTodayRes, breathworkTodayRes, workoutCompletionsTodayRes,
    ] = await Promise.all([
        db.from("todos").select("id, text, completed").eq("user_id", userId).order("created_at", { ascending: false }),
        db.from("challenges").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        db.from("challenge_tasks").select("*").order("sort_order", { ascending: true }),
        db.from("user_challenges").select("challenge_id").eq("user_id", userId),
        db.from("streak_log").select("streak_date").eq("user_id", userId).order("streak_date", { ascending: false }).limit(30),
        db.from("task_completions").select("task_id").eq("user_id", userId).eq("completed_date", today),
        db.from("user_challenges").select("challenge_id"),
        // V2: steps today (+ latest row for carry-over if none today)
        db.from("steps_daily_logs").select("baseline, goal, done, milestones_awarded, goal_hit, log_date").eq("user_id", userId).order("log_date", { ascending: false }).limit(2),
        // V2: nutrition today + meals
        db.from("nutrition_daily_logs").select("*, nutrition_meals(*)").eq("user_id", userId).eq("log_date", today).maybeSingle(),
        // V2: breathwork sessions count today
        db.from("breathwork_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("completed_at", `${today}T00:00:00`).lte("completed_at", `${today}T23:59:59`),
        // V2: workout completions today
        db.from("workout_logs").select("program_id, session_id").eq("user_id", userId).eq("completed_date", today),
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
                description: "4 fixed EMOM workouts for daily execution.",
                long_desc: "Each workout follows strict EMOM logic: 1 minute = 1 exercise. One series is the full pack of exercises. Repeat the pack for the prescribed number of series, then validate and earn XP.",
                emoji: "",
                difficulty: "Hard",
                duration_days: 30,
                total_xp: 400,
                is_active: true
            }).select().single();

            if (!challengeErr && seededChallenge) {
                fetchedChallenges = [seededChallenge];
                const tasksToInsert = [
                    { id: "a0000001-0000-0000-0000-000000000001", challenge_id: seededChallenge.id, name: "Push Strength", emoji: null, xp_reward: 100, sort_order: 1 },
                    { id: "a0000001-0000-0000-0000-000000000002", challenge_id: seededChallenge.id, name: "Pull Strength", emoji: null, xp_reward: 100, sort_order: 2 },
                    { id: "a0000001-0000-0000-0000-000000000003", challenge_id: seededChallenge.id, name: "Legs & Core", emoji: null, xp_reward: 100, sort_order: 3 },
                    { id: "a0000001-0000-0000-0000-000000000004", challenge_id: seededChallenge.id, name: "Upper Density", emoji: null, xp_reward: 100, sort_order: 4 },
                ];
                const { data: seededTasks } = await db.from("challenge_tasks").insert(tasksToInsert).select();
                fetchedTasks = seededTasks || tasksToInsert;
            }
        } catch (e) {
            console.error("[OPTIZ] Auto-seed failed", e);
        }
    }

    const exerciseMap = new Map(
        OPTIZ_MAX_CHALLENGE.tasks.map(t => [normalizeTaskName(t.name), { exercises: t.exercises, color: t.color, xpReward: t.xpReward, rounds: t.rounds }])
    );

    const challenges = fetchedChallenges.map((c: Record<string, unknown>) => {
        const tasks = fetchedTasks.filter((t: Record<string, unknown>) => t.challenge_id === c.id);
        return {
            id: c.id as string,
            title: c.title as string,
            description: (c.description as string) || "",
            longDescription: (c.long_desc as string) || "",
            emoji: (c.emoji as string) || "",
            difficulty: (c.difficulty as string) || "Medium",
            durationDays: (c.duration_days as number) || 30,
            participantCount: participantCounts[c.id as string] || 0,
            totalXp: (c.total_xp as number) || 0,
            joined: joinedIds.has(c.id as string),
            tasks: tasks.map((t: Record<string, unknown>, taskIndex: number) => {
                const name = t.name as string;
                const fallback = OPTIZ_MAX_CHALLENGE.tasks[taskIndex];
                const match =
                    exerciseMap.get(normalizeTaskName(name)) ||
                    (fallback
                        ? {
                            exercises: fallback.exercises,
                            color: fallback.color,
                            xpReward: fallback.xpReward,
                            rounds: fallback.rounds,
                        }
                        : undefined);
                return {
                    id: t.id as string,
                    name,
                    emoji: (t.emoji as string) || "",
                    xpReward: match?.xpReward ?? (t.xp_reward as number) ?? 10,
                    completed: completedTaskIds.has(t.id as string),
                    rounds: match?.rounds ?? 3,
                    exercises: match?.exercises,
                    color: match?.color,
                };
            }),
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

    // V2: assemble steps today (carry over baseline/goal from last entry if no row for today)
    const stepsRows = (stepsTodayRes.data ?? []) as { baseline: number | null; goal: number | null; done: number | null; milestones_awarded: unknown; goal_hit: boolean | null; log_date: string }[];
    const todayStepsRow = stepsRows.find((r) => r.log_date === today);
    const latestStepsRow = stepsRows[0]; // most recent row (could be yesterday)
    const stepsToday = todayStepsRow
        ? {
            baseline: todayStepsRow.baseline ?? 6000,
            goal: todayStepsRow.goal ?? 8000,
            done: todayStepsRow.done ?? 0,
            milestonesAwarded: (todayStepsRow.milestones_awarded as number[]) ?? [],
            goalHit: todayStepsRow.goal_hit ?? false,
        }
        : latestStepsRow
            ? {
                // Carry over baseline & goal from previous day, reset done/milestones/goalHit
                baseline: latestStepsRow.baseline ?? 6000,
                goal: latestStepsRow.goal ?? 8000,
                done: 0,
                milestonesAwarded: [] as number[],
                goalHit: false,
            }
            : null;

    // V2: assemble nutrition today
    const nutritionRow = nutritionTodayRes.data as Record<string, unknown> | null;
    const nutritionToday = nutritionRow
        ? {
            id: nutritionRow.id as string,
            calorieGoal: (nutritionRow.calorie_goal as number) ?? 2500,
            proteinGoal: (nutritionRow.protein_goal as number) ?? 160,
            carbsGoal: (nutritionRow.carbs_goal as number) ?? 260,
            fatsGoal: (nutritionRow.fats_goal as number) ?? 80,
            waterGoalL: (nutritionRow.water_goal_l as number) ?? 2.8,
            waterInL: (nutritionRow.water_in_l as number) ?? 0,
            proteinGoalHit: (nutritionRow.protein_goal_hit as boolean) ?? false,
            caloriesOnTarget: (nutritionRow.calories_on_target as boolean) ?? false,
            hydrationGoalHit: (nutritionRow.hydration_goal_hit as boolean) ?? false,
            mealRewardsCount: (nutritionRow.meal_rewards_count as number) ?? 0,
            meals: ((nutritionRow.nutrition_meals as Record<string, unknown>[]) ?? []).map((m) => ({
                id: m.id as string,
                mealType: m.meal_type as string,
                name: m.name as string,
                calories: (m.calories as number) ?? 0,
                protein: (m.protein as number) ?? 0,
                carbs: (m.carbs as number) ?? 0,
                fats: (m.fats as number) ?? 0,
                createdAt: (m.created_at as string) ?? "",
            })),
        }
        : null;

    // V2: breathwork count
    const breathworkSessionsToday = breathworkTodayRes.count ?? 0;

    // V2: workout completions today
    const workoutCompletionsToday = (workoutCompletionsTodayRes.data || []).map((w: { program_id: string; session_id: string }) => ({
        programId: w.program_id,
        sessionId: w.session_id,
    }));

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
        // V2 fields
        stepsToday,
        nutritionToday,
        breathworkSessionsToday,
        workoutCompletionsToday,
    };
}

// ══════════════════════════════════════
// V2: Idempotent XP Event System
// ══════════════════════════════════════

/** Award XP idempotently using xp_events table. Returns { awarded, totalXp, streakDays, streakBonusXp, streakEarned } */
export async function awardXpEvent(
    userId: string,
    source: string,
    referenceId: string,
    referenceDate: string,
    xpAmount: number,
    metadata?: Record<string, unknown>,
) {
    const db = createServerSupabase();

    // Try idempotent insert
    const { data: inserted, error } = await db
        .from("xp_events")
        .insert({
            user_id: userId,
            source,
            reference_id: referenceId,
            reference_date: referenceDate,
            xp_amount: xpAmount,
            metadata: (metadata ?? {}) as unknown as Json,
        })
        .select("id")
        .maybeSingle();

    // If duplicate (conflict), return current totals without awarding
    if (error && error.code === "23505") {
        const { data: profile } = await db
            .from("user_profiles")
            .select("total_xp, streak_days")
            .eq("whop_user_id", userId)
            .single();

        return {
            awarded: false,
            totalXp: profile?.total_xp ?? 0,
            streakDays: profile?.streak_days ?? 0,
            streakBonusXp: 0,
            streakEarned: false,
        };
    }

    if (error) {
        console.error("[OPTIZ] awardXpEvent insert error:", error);
        throw error;
    }

    if (!inserted) {
        // No row returned = conflict with ON CONFLICT DO NOTHING
        const { data: profile } = await db
            .from("user_profiles")
            .select("total_xp, streak_days")
            .eq("whop_user_id", userId)
            .single();

        return {
            awarded: false,
            totalXp: profile?.total_xp ?? 0,
            streakDays: profile?.streak_days ?? 0,
            streakBonusXp: 0,
            streakEarned: false,
        };
    }

    // Insert succeeded — handle streak then atomic XP increment
    const { data: profile } = await db
        .from("user_profiles")
        .select("streak_days")
        .eq("whop_user_id", userId)
        .single();

    const streak = await handleStreakLogic(db, userId, profile?.streak_days ?? 0);
    const totalDelta = xpAmount + streak.streakBonusXp;

    // Atomic increment — no read-then-write race condition
    const { data: updated } = await db.rpc("increment_user_xp", {
        p_user_id: userId,
        p_xp_delta: totalDelta,
        p_streak_days: streak.streakDays,
    }).single();

    return {
        awarded: true,
        totalXp: updated?.total_xp ?? totalDelta,
        streakDays: updated?.streak_days ?? streak.streakDays,
        streakBonusXp: streak.streakBonusXp,
        streakEarned: streak.streakEarned,
    };
}

// ══════════════════════════════════════
// V2: Workout Actions
// ══════════════════════════════════════

export interface WorkoutLogPayload {
    programId: string;
    programTitle: string;
    sessionId: string;
    sessionName: string;
    totalVolume: number;
    improvedSets: number;
    xpEarned: number;
    exercises: Array<{
        exerciseId: string;
        exerciseName: string;
        sets: Array<{ load: number; reps: number; rpe: number; setType?: string; isPr?: boolean }>;
    }>;
}

/** Save a completed workout log + set logs + award XP */
export async function saveWorkoutLog(userId: string, payload: WorkoutLogPayload) {
  const db = createServerSupabase();
  const today = getTodayISO();

    // Insert workout log
    const { data: workoutLog, error: workoutErr } = await db
        .from("workout_logs")
        .insert({
            user_id: userId,
            program_id: payload.programId,
            program_title: payload.programTitle,
            session_id: payload.sessionId,
            session_name: payload.sessionName,
            completed_date: today,
            total_volume: payload.totalVolume,
            improved_sets: payload.improvedSets,
            xp_earned: payload.xpEarned,
        })
        .select("id")
        .single();

    if (workoutErr) {
        // Duplicate daily constraint = already completed today
        if (workoutErr.code === "23505") {
            return { success: false, duplicate: true };
        }
        throw workoutErr;
    }

    // Batch insert set logs
    const setRows = payload.exercises.flatMap((ex) =>
        ex.sets.map((s, idx) => ({
            workout_log_id: workoutLog.id,
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            set_number: idx + 1,
            load: s.load,
            reps: s.reps,
            rpe: s.rpe,
            set_type: s.setType ?? "N",
            is_pr: s.isPr ?? false,
        })),
    );

  if (setRows.length > 0) {
    await db.from("workout_set_logs").insert(setRows);
  }

  return { success: true, duplicate: false };
}

/** Get workout history */
export async function getWorkoutHistory(userId: string, limit = 50) {
    const db = createServerSupabase();
    const { data } = await db
        .from("workout_logs")
        .select("*, workout_set_logs(*)")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(limit);

    return data || [];
}

/** Get today's workout completions */
export async function getWorkoutCompletionsToday(userId: string) {
    const db = createServerSupabase();
    const today = getTodayISO();
    const { data } = await db
        .from("workout_logs")
        .select("program_id, session_id")
        .eq("user_id", userId)
        .gte("completed_at", `${today}T00:00:00`)
        .lte("completed_at", `${today}T23:59:59`);

    return (data || []).map((w) => ({ programId: w.program_id, sessionId: w.session_id }));
}

// ══════════════════════════════════════
// V2: Freestyle Template Actions
// ══════════════════════════════════════

/** Save a freestyle template */
export async function saveFreestyleTemplate(
    userId: string,
    name: string,
    rows: Array<{ exerciseId: string; sets: number; reps: number }>,
) {
    const db = createServerSupabase();

    const { data: template, error } = await db
        .from("freestyle_templates")
        .insert({ user_id: userId, name })
        .select("id")
        .single();

    if (error) throw error;

    if (rows.length > 0) {
        await db.from("freestyle_template_exercises").insert(
            rows.map((r, idx) => ({
                template_id: template.id,
                exercise_id: r.exerciseId,
                sets: r.sets,
                reps: r.reps,
                sort_order: idx,
            })),
        );
    }

    return { id: template.id };
}

/** Get all freestyle templates for a user */
export async function getFreestyleTemplates(userId: string) {
    const db = createServerSupabase();
    const { data } = await db
        .from("freestyle_templates")
        .select("*, freestyle_template_exercises(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    return (data || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        createdAt: t.created_at as string,
        rows: ((t.freestyle_template_exercises as Record<string, unknown>[]) || [])
            .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0))
            .map((e) => ({
                exerciseId: e.exercise_id as string,
                sets: (e.sets as number) ?? 3,
                reps: (e.reps as number) ?? 10,
            })),
    }));
}

/** Delete a freestyle template */
export async function deleteFreestyleTemplateAction(userId: string, templateId: string) {
    const db = createServerSupabase();
    await db.from("freestyle_templates").delete().eq("id", templateId).eq("user_id", userId);
}

// ══════════════════════════════════════
// V2: Steps Actions
// ══════════════════════════════════════

/** Upsert daily steps data — returns { ok } or throws */
export async function upsertDailySteps(
    userId: string,
    date: string,
    payload: { baseline: number; goal: number; done: number; milestonesAwarded: number[]; goalHit: boolean },
) {
    const db = createServerSupabase();
    const { error } = await db
        .from("steps_daily_logs")
        .upsert(
            {
                user_id: userId,
                log_date: date,
                baseline: payload.baseline,
                goal: payload.goal,
                done: payload.done,
                milestones_awarded: payload.milestonesAwarded,
                goal_hit: payload.goalHit,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,log_date" },
        );

    if (error) {
        console.error("[OPTIZ] upsertDailySteps error:", error);
        throw new Error(error.message);
    }
    return { ok: true };
}

/** Get daily steps */
export async function getDailySteps(userId: string, date: string) {
    const db = createServerSupabase();
    const { data } = await db
        .from("steps_daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", date)
        .maybeSingle();

    return data;
}

/** Get steps history for last N days */
export async function getStepsHistory(userId: string, days: number = 7) {
    const db = createServerSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startStr = startDate.toISOString().split("T")[0];

    const { data } = await db
        .from("steps_daily_logs")
        .select("log_date, done, goal")
        .eq("user_id", userId)
        .gte("log_date", startStr)
        .order("log_date", { ascending: true });

    return data ?? [];
}

// ══════════════════════════════════════
// V2: Nutrition Actions
// ══════════════════════════════════════

/** Upsert daily nutrition goals/flags */
export async function upsertDailyNutrition(
    userId: string,
    date: string,
    goals: {
        calorieGoal?: number;
        proteinGoal?: number;
        carbsGoal?: number;
        fatsGoal?: number;
        waterGoalL?: number;
        waterInL?: number;
        proteinGoalHit?: boolean;
        caloriesOnTarget?: boolean;
        hydrationGoalHit?: boolean;
        mealRewardsCount?: number;
    },
) {
    const db = createServerSupabase();
    const { data, error } = await db
        .from("nutrition_daily_logs")
        .upsert(
            {
                user_id: userId,
                log_date: date,
                calorie_goal: goals.calorieGoal,
                protein_goal: goals.proteinGoal,
                carbs_goal: goals.carbsGoal,
                fats_goal: goals.fatsGoal,
                water_goal_l: goals.waterGoalL,
                water_in_l: goals.waterInL,
                protein_goal_hit: goals.proteinGoalHit,
                calories_on_target: goals.caloriesOnTarget,
                hydration_goal_hit: goals.hydrationGoalHit,
                meal_rewards_count: goals.mealRewardsCount,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,log_date" },
        )
        .select("id")
        .single();

    if (error) {
        console.error("[OPTIZ] upsertDailyNutrition error:", error);
        throw new Error(error.message);
    }
    return data?.id ?? null;
}

/** Add a nutrition meal (ensures daily log exists) */
export async function addNutritionMeal(
    userId: string,
    date: string,
    meal: { mealType: string; name: string; calories: number; protein: number; carbs: number; fats: number },
) {
    const db = createServerSupabase();

    // Ensure daily log exists
    let dailyLogId: string | null = null;
    const { data: existing } = await db
        .from("nutrition_daily_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("log_date", date)
        .maybeSingle();

    if (existing) {
        dailyLogId = existing.id;
    } else {
        const { data: created } = await db
            .from("nutrition_daily_logs")
            .insert({ user_id: userId, log_date: date })
            .select("id")
            .single();
        dailyLogId = created?.id ?? null;
    }

    if (!dailyLogId) return null;

    const { data: newMeal, error } = await db
        .from("nutrition_meals")
        .insert({
            daily_log_id: dailyLogId,
            user_id: userId,
            meal_type: meal.mealType,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
        })
        .select("id, meal_type, name, calories, protein, carbs, fats, created_at")
        .single();

    if (error) {
        console.error("[OPTIZ] addNutritionMeal error:", error);
        return null;
    }

    return {
        id: newMeal.id,
        mealType: newMeal.meal_type,
        name: newMeal.name,
        calories: newMeal.calories ?? 0,
        protein: newMeal.protein ?? 0,
        carbs: newMeal.carbs ?? 0,
        fats: newMeal.fats ?? 0,
        createdAt: newMeal.created_at ?? "",
    };
}

/** Delete a nutrition meal */
export async function deleteNutritionMeal(userId: string, mealId: string) {
    const db = createServerSupabase();
    await db.from("nutrition_meals").delete().eq("id", mealId).eq("user_id", userId);
}

/** Get daily nutrition + meals */
export async function getDailyNutrition(userId: string, date: string) {
    const db = createServerSupabase();
    const { data } = await db
        .from("nutrition_daily_logs")
        .select("*, nutrition_meals(*)")
        .eq("user_id", userId)
        .eq("log_date", date)
        .maybeSingle();

    return data;
}

// ══════════════════════════════════════
// V2: Meal Templates & Daily Checks
// ══════════════════════════════════════

/** Get all meal templates for a user */
export async function getMealTemplates(userId: string) {
    const db = createServerSupabase();
    const { data } = await db
        .from("nutrition_meal_templates")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order")
        .order("created_at");
    return (data ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        slot: t.slot as string,
        calories: (t.calories as number) ?? 0,
        protein: (t.protein as number) ?? 0,
        carbs: (t.carbs as number) ?? 0,
        fats: (t.fats as number) ?? 0,
        sortOrder: (t.sort_order as number) ?? 0,
    }));
}

/** Create a persistent meal template */
export async function createMealTemplate(
    userId: string,
    template: { name: string; slot: string; calories: number; protein: number; carbs: number; fats: number },
) {
    const db = createServerSupabase();
    const { data, error } = await db
        .from("nutrition_meal_templates")
        .insert({
            user_id: userId,
            name: template.name,
            slot: template.slot,
            calories: template.calories,
            protein: template.protein,
            carbs: template.carbs,
            fats: template.fats,
        })
        .select("id, name, slot, calories, protein, carbs, fats, sort_order")
        .single();
    if (error) {
        console.error("[OPTIZ] createMealTemplate error:", error);
        return null;
    }
    return {
        id: data.id as string,
        name: data.name as string,
        slot: data.slot as string,
        calories: (data.calories as number) ?? 0,
        protein: (data.protein as number) ?? 0,
        carbs: (data.carbs as number) ?? 0,
        fats: (data.fats as number) ?? 0,
        sortOrder: (data.sort_order as number) ?? 0,
    };
}

/** Update a meal template (name, slot, macros) */
export async function updateMealTemplate(
    userId: string,
    templateId: string,
    updates: { name?: string; slot?: string; calories?: number; protein?: number; carbs?: number; fats?: number },
) {
    const db = createServerSupabase();
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.slot !== undefined) payload.slot = updates.slot;
    if (updates.calories !== undefined) payload.calories = updates.calories;
    if (updates.protein !== undefined) payload.protein = updates.protein;
    if (updates.carbs !== undefined) payload.carbs = updates.carbs;
    if (updates.fats !== undefined) payload.fats = updates.fats;
    await db.from("nutrition_meal_templates").update(payload).eq("id", templateId).eq("user_id", userId);
}

/** Delete a meal template */
export async function deleteMealTemplate(userId: string, templateId: string) {
    const db = createServerSupabase();
    await db.from("nutrition_meal_templates").delete().eq("id", templateId).eq("user_id", userId);
}

/** Mark a meal as eaten for a given date */
export async function checkMealToday(userId: string, templateId: string, date: string) {
    const db = createServerSupabase();
    await db.from("nutrition_daily_checks").upsert(
        { user_id: userId, template_id: templateId, date },
        { onConflict: "user_id,template_id,date" },
    );
}

/** Unmark a meal for a given date */
export async function uncheckMealToday(userId: string, templateId: string, date: string) {
    const db = createServerSupabase();
    await db.from("nutrition_daily_checks").delete()
        .eq("user_id", userId)
        .eq("template_id", templateId)
        .eq("date", date);
}

/** Get checked template IDs for a given date */
export async function getDailyChecks(userId: string, date: string) {
    const db = createServerSupabase();
    const { data } = await db
        .from("nutrition_daily_checks")
        .select("template_id")
        .eq("user_id", userId)
        .eq("date", date);
    return (data ?? []).map((d: Record<string, unknown>) => d.template_id as string);
}

/** Get weekly checks + water data for a date range */
export async function getWeeklyNutritionData(userId: string, startDate: string, endDate: string) {
    const db = createServerSupabase();
    const [checksRes, logsRes] = await Promise.all([
        db.from("nutrition_daily_checks")
            .select("template_id, date")
            .eq("user_id", userId)
            .gte("date", startDate)
            .lte("date", endDate),
        db.from("nutrition_daily_logs")
            .select("log_date, water_in_l")
            .eq("user_id", userId)
            .gte("log_date", startDate)
            .lte("log_date", endDate),
    ]);
    return {
        checks: (checksRes.data ?? []).map((d: Record<string, unknown>) => ({
            templateId: d.template_id as string,
            date: d.date as string,
        })),
        waterLogs: (logsRes.data ?? []).map((d: Record<string, unknown>) => ({
            date: d.log_date as string,
            waterInL: (d.water_in_l as number) ?? 0,
        })),
    };
}

// ══════════════════════════════════════
// V2: Breathwork Actions
// ══════════════════════════════════════

/** Complete a breathwork session */
export async function completeBreathworkSession(
    userId: string,
    payload: { presetId?: string; inhale: number; holdSec: number; exhale: number; cycles: number },
) {
    const db = createServerSupabase();
    const today = getTodayISO();

    await db.from("breathwork_sessions").insert({
        user_id: userId,
        preset_id: payload.presetId ?? null,
        inhale: payload.inhale,
        hold_sec: payload.holdSec,
        exhale: payload.exhale,
        cycles: payload.cycles,
        xp_earned: 25,
    });

    // Award XP — use timestamp to allow multiple sessions per day
    const refId = `breathwork-${today}-${Date.now()}`;
    const xpResult = await awardXpEvent(userId, "breathwork", refId, today, 25);

    return xpResult;
}

// ══════════════════════════════════════
// Existing Actions (V1 — kept for backward compatibility)
// ══════════════════════════════════════

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

/** Award XP + handle streak logic (legacy V1 — still used for todo/challenge) */
export async function awardXp(userId: string, xp: number, source: "todo" | "challenge", taskId?: string) {
    const db = createServerSupabase();

    const { data: profile } = await db
        .from("user_profiles")
        .select("streak_days")
        .eq("whop_user_id", userId)
        .single();

    if (!profile) {
        console.error("[OPTIZ] awardXp: User not found", userId);
        return { totalXp: xp, streakDays: 0, streakBonusXp: 0, streakEarned: false };
    }

    const streak = await handleStreakLogic(db, userId, profile.streak_days ?? 0);
    const totalDelta = xp + streak.streakBonusXp;

    // Atomic increment — no race condition
    const { data: updated } = await db.rpc("increment_user_xp", {
        p_user_id: userId,
        p_xp_delta: totalDelta,
        p_streak_days: streak.streakDays,
    }).single();

    if (source === "challenge" && taskId) {
        const today = getTodayISO();
        await db.from("task_completions").insert({
            user_id: userId,
            task_id: taskId,
            xp_earned: xp,
            completed_date: today,
        });
    }

    return {
        totalXp: updated?.total_xp ?? totalDelta,
        streakDays: updated?.streak_days ?? streak.streakDays,
        streakBonusXp: streak.streakBonusXp,
        streakEarned: streak.streakEarned,
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
            .order("total_xp", { ascending: false });

        const leaderboard = (users || []).map((u, i) => ({
            whop_user_id: u.whop_user_id,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            total_xp: u.total_xp,
            streak_days: u.streak_days,
            position: i + 1,
        }));

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

/** Delete all user data (profile + activity + V2 tables) */
export async function deleteUserData(userId: string) {
    const db = createServerSupabase();

    // V2 tables (cascade handles nested, but explicit is safer)
    await db.from("xp_events").delete().eq("user_id", userId);
    await db.from("workout_logs").delete().eq("user_id", userId);
    await db.from("nutrition_daily_checks").delete().eq("user_id", userId);
    await db.from("nutrition_meal_templates").delete().eq("user_id", userId);
    await db.from("nutrition_daily_logs").delete().eq("user_id", userId);
    await db.from("steps_daily_logs").delete().eq("user_id", userId);
    await db.from("breathwork_sessions").delete().eq("user_id", userId);
    await db.from("freestyle_templates").delete().eq("user_id", userId);

    // V1 tables
    await db.from("task_completions").delete().eq("user_id", userId);
    await db.from("streak_log").delete().eq("user_id", userId);
    await db.from("todos").delete().eq("user_id", userId);
    await db.from("user_challenges").delete().eq("user_id", userId);
    await db.from("user_profiles").delete().eq("whop_user_id", userId);

    return { success: true };
}
