import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * GET /api/leaderboard
 * Returns top 100 users ranked by XP, plus the current user's position.
 */
export async function GET() {
    try {
        const { userId } = await verifyUser(await headers());
        const db = createServerSupabase();

        // Query user_profiles directly (most reliable)
        const { data: users, error } = await db
            .from("user_profiles")
            .select("whop_user_id, display_name, avatar_url, total_xp, streak_days")
            .gt("total_xp", 0)
            .order("total_xp", { ascending: false })
            .limit(100);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const leaderboard = (users || []).map((u, i) => ({
            whop_user_id: u.whop_user_id,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            total_xp: u.total_xp,
            streak_days: u.streak_days,
            position: i + 1,
        }));

        // Find current user's position
        const userEntry = leaderboard.find(e => e.whop_user_id === userId);

        let userPosition = null;
        if (!userEntry) {
            const { data: userProfile } = await db
                .from("user_profiles")
                .select("total_xp")
                .eq("whop_user_id", userId)
                .single();

            if (userProfile && userProfile.total_xp) {
                const { count } = await db
                    .from("user_profiles")
                    .select("*", { count: "exact", head: true })
                    .gt("total_xp", userProfile.total_xp);

                userPosition = (count || 0) + 1;
            }
        }

        return NextResponse.json({
            leaderboard,
            userPosition: userEntry ? userEntry.position : userPosition,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
