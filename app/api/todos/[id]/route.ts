import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { verifyUser } from "@/lib/authentication";
import { headers } from "next/headers";

/**
 * PATCH /api/todos/[id]
 * Toggle or update a todo.
 * Body: { completed?: boolean, text?: string }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await verifyUser(await headers());
        const { id } = await params;
        const body = await request.json();
        const db = createServerSupabase();

        const updates: { completed?: boolean | null; completed_at?: string | null; text?: string } = {};
        if (body.completed !== undefined) {
            updates.completed = body.completed;
            updates.completed_at = body.completed ? new Date().toISOString() : null;
        }
        if (body.text !== undefined) updates.text = body.text;

        const { data, error } = await db
            .from("todos")
            .update(updates)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ todo: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}

/**
 * DELETE /api/todos/[id]
 * Delete a personal todo.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await verifyUser(await headers());
        const { id } = await params;
        const db = createServerSupabase();

        const { error } = await db
            .from("todos")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
