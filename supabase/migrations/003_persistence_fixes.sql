-- Migration 003: Persistence fixes — indexes + atomic XP function
-- Applied to Supabase on 2026-03-04

-- Performance indexes for 1000+ users scale
CREATE INDEX IF NOT EXISTS idx_steps_user_date ON steps_daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_daily_user_date ON nutrition_daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_meals_user ON nutrition_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_daily_checks_user_date ON nutrition_daily_checks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON nutrition_meal_templates(user_id);

-- Atomic XP increment — eliminates read-then-write race condition
CREATE OR REPLACE FUNCTION increment_user_xp(
  p_user_id text,
  p_xp_delta integer,
  p_streak_days integer DEFAULT NULL,
  p_last_task_at timestamptz DEFAULT now()
)
RETURNS TABLE(total_xp integer, streak_days integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE user_profiles
  SET
    total_xp = COALESCE(user_profiles.total_xp, 0) + p_xp_delta,
    streak_days = COALESCE(p_streak_days, user_profiles.streak_days),
    last_task_at = p_last_task_at,
    updated_at = now()
  WHERE whop_user_id = p_user_id
  RETURNING user_profiles.total_xp, user_profiles.streak_days;
END;
$$;
