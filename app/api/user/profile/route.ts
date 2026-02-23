import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * GET /api/user/profile
 * Fetch or auto-create the user profile for the current Whop user.
 */
export async function GET() {
    try {
        const { userId } = await verifyUser(await headers());
        const db = createServerSupabase();

        // Try to fetch existing profile
        let { data: profile, error } = await db
            .from("user_profiles")
            .select("*")
            .eq("whop_user_id", userId)
            .single();

        // Auto-create on first visit
        if (error && error.code === "PGRST116") {
            const { data: newProfile, error: insertErr } = await db
                .from("user_profiles")
                .insert({ whop_user_id: userId })
                .select()
                .single();

            if (insertErr) {
                return NextResponse.json({ error: insertErr.message }, { status: 500 });
            }
            profile = newProfile;
        } else if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also fetch todos, joined challenges, streak info
        const [todosRes, challengesRes, streakRes] = await Promise.all([
            db.from("todos").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
            db.from("user_challenges").select("challenge_id").eq("user_id", userId),
            db.from("streak_log").select("streak_date").eq("user_id", userId).order("streak_date", { ascending: false }).limit(30),
        ]);

        return NextResponse.json({
            profile,
            todos: todosRes.data || [],
            joinedChallengeIds: (challengesRes.data || []).map(c => c.challenge_id),
            streakDates: (streakRes.data || []).map(s => s.streak_date),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}

/**
 * PATCH /api/user/profile
 * Update user profile fields (display_name, avatar_url, locale).
 */
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await verifyUser(await headers());
        const body = await request.json();
        const db = createServerSupabase();

        const updates: {
            display_name?: string | null;
            avatar_url?: string | null;
            locale?: string | null;
            updated_at?: string | null;
        } = { updated_at: new Date().toISOString() };

        if (body.display_name !== undefined) updates.display_name = body.display_name;
        if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
        if (body.locale !== undefined) updates.locale = body.locale;

        const { data, error } = await db
            .from("user_profiles")
            .update(updates)
            .eq("whop_user_id", userId)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ profile: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
