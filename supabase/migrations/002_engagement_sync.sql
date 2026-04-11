-- Track last sync timestamps for chat and forum
CREATE TABLE IF NOT EXISTS engagement_sync_state (
  id integer PRIMARY KEY DEFAULT 1,
  last_chat_sync timestamptz DEFAULT '1970-01-01'::timestamptz,
  last_forum_sync timestamptz DEFAULT '1970-01-01'::timestamptz,
  chat_messages_synced integer DEFAULT 0,
  forum_posts_synced integer DEFAULT 0,
  last_run_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT engagement_sync_state_singleton CHECK (id = 1)
);
INSERT INTO engagement_sync_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Registered experiences for the app (scan targets)
CREATE TABLE IF NOT EXISTS app_experiences (
  experience_id text PRIMARY KEY,
  company_id text,
  first_seen_at timestamptz DEFAULT now()
);

-- Period leaderboard RPC — aggregates xp_events between dates
CREATE OR REPLACE FUNCTION get_leaderboard_period(
  p_start_date date,
  p_end_date date,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  user_id text,
  display_name text,
  avatar_url text,
  period_xp bigint,
  position integer
)
LANGUAGE sql STABLE AS $$
  SELECT
    e.user_id,
    p.display_name,
    p.avatar_url,
    SUM(e.xp_amount)::bigint AS period_xp,
    RANK() OVER (ORDER BY SUM(e.xp_amount) DESC)::integer AS position
  FROM xp_events e
  LEFT JOIN user_profiles p ON p.whop_user_id = e.user_id
  WHERE e.reference_date BETWEEN p_start_date AND p_end_date
  GROUP BY e.user_id, p.display_name, p.avatar_url
  ORDER BY period_xp DESC
  LIMIT p_limit;
$$;

-- Daily engagement cap check — returns current XP accumulated for a source on a date
CREATE OR REPLACE FUNCTION check_daily_engagement_cap(
  p_user_id text,
  p_source text,
  p_date date
)
RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(xp_amount), 0)::integer
  FROM xp_events
  WHERE user_id = p_user_id
    AND source = p_source
    AND reference_date = p_date;
$$;
