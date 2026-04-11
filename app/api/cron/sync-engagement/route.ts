import { NextRequest, NextResponse } from "next/server";
import { whop } from "@/lib/whop-sdk";
import { createServerSupabase } from "@/lib/supabase";
import { awardEngagementXp } from "@/lib/actions";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = process.env.WHOP_COMPANY_ID;
  if (!companyId) {
    return NextResponse.json({ error: "WHOP_COMPANY_ID not set" }, { status: 500 });
  }

  // Cast to any to bypass generated types until migration 002 is applied.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServerSupabase() as any;

  // Get last sync state
  const { data: state } = await db
    .from("engagement_sync_state")
    .select("last_chat_sync, last_forum_sync")
    .eq("id", 1)
    .single();

  const lastChatSync = new Date(state?.last_chat_sync ?? 0);
  const lastForumSync = new Date(state?.last_forum_sync ?? 0);
  const nowIso = new Date().toISOString();

  let chatMessagesProcessed = 0;
  let forumPostsProcessed = 0;
  let chatXpAwarded = 0;
  let forumXpAwarded = 0;
  let chatChannelsFound = 0;
  const chatErrors: string[] = [];
  const forumErrors: string[] = [];

  // Get all registered experiences (chat + optiz app)
  const { data: experiences } = await db
    .from("app_experiences")
    .select("experience_id");

  const experienceIds: string[] = (experiences ?? []).map((e: { experience_id: string }) => e.experience_id);

  // ── CHAT MESSAGES — iterate by experience_id ──
  for (const experienceId of experienceIds) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const channel of whop.chatChannels.list({ experience_id: experienceId } as any)) {
        chatChannelsFound++;
        try {
          for await (const msg of whop.messages.list({ channel_id: channel.id })) {
            const msgDate = new Date(msg.created_at);
            if (msgDate <= lastChatSync) break;

            chatMessagesProcessed++;
            const contentLength = (msg.content ?? "").trim().length;
            const eventDate = msg.created_at.split("T")[0];

            const result = await awardEngagementXp(
              msg.user.id,
              "chat_message",
              msg.id,
              contentLength,
              eventDate,
            );
            if (result.awarded) chatXpAwarded++;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[sync-engagement] Chat channel ${channel.id} error:`, err);
          chatErrors.push(`channel ${channel.id}: ${message}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-engagement] Chat list for exp ${experienceId} error:`, err);
      chatErrors.push(`exp ${experienceId}: ${message}`);
    }
  }

  // ── FORUM POSTS — iterate by experience_id ──
  for (const experienceId of experienceIds) {
    try {
      for await (const post of whop.forumPosts.list({
        experience_id: experienceId,
      })) {
        const postDate = new Date(post.created_at);
        if (postDate <= lastForumSync) break;

        forumPostsProcessed++;
        const contentLength = ((post.content ?? "") + (post.title ?? "")).trim().length;
        const eventDate = post.created_at.split("T")[0];
        const source = post.parent_id ? "forum_comment" : "forum_post";

        const result = await awardEngagementXp(
          post.user.id,
          source,
          post.id,
          contentLength,
          eventDate,
        );
        if (result.awarded) forumXpAwarded++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-engagement] Forum exp ${experienceId} error:`, err);
      forumErrors.push(`exp ${experienceId}: ${message}`);
    }
  }

  // Update sync state
  await db.from("engagement_sync_state").update({
    last_chat_sync: nowIso,
    last_forum_sync: nowIso,
    chat_messages_synced: chatMessagesProcessed,
    forum_posts_synced: forumPostsProcessed,
    last_run_at: nowIso,
    updated_at: nowIso,
  }).eq("id", 1);

  return NextResponse.json({
    ok: true,
    stats: {
      experiences_scanned: experienceIds.length,
      chat_channels_found: chatChannelsFound,
      chat_messages_processed: chatMessagesProcessed,
      chat_xp_awarded: chatXpAwarded,
      forum_posts_processed: forumPostsProcessed,
      forum_xp_awarded: forumXpAwarded,
      last_chat_sync: lastChatSync.toISOString(),
    },
    experience_ids: experienceIds,
    chat_errors: chatErrors.length > 0 ? chatErrors : undefined,
    forum_errors: forumErrors.length > 0 ? forumErrors : undefined,
    company_id: companyId,
  });
}
