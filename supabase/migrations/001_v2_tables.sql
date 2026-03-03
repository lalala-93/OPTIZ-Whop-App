-- OPTIZ V2 — New tables for server-persisted features
-- Run in Supabase SQL Editor after code is deployed

-- 1. Idempotent XP event ledger
CREATE TABLE IF NOT EXISTS xp_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES user_profiles(whop_user_id) ON DELETE CASCADE,
  source text NOT NULL,
  reference_id text NOT NULL,
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  xp_amount integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT xp_events_idempotency UNIQUE (user_id, source, reference_id, reference_date)
);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id, created_at DESC);

-- 2. Workout session logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES user_profiles(whop_user_id) ON DELETE CASCADE,
  program_id text NOT NULL,
  program_title text NOT NULL,
  session_id text NOT NULL,
  session_name text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  total_volume numeric DEFAULT 0,
  improved_sets integer DEFAULT 0,
  xp_earned integer DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS workout_logs_daily ON workout_logs(user_id, program_id, session_id, (completed_at::date));
CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(user_id, completed_at DESC);

-- 3. Individual set logs within a workout
CREATE TABLE IF NOT EXISTS workout_set_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id uuid NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  exercise_name text NOT NULL,
  set_number integer NOT NULL,
  load numeric DEFAULT 0,
  reps integer DEFAULT 0,
  rpe integer DEFAULT 8,
  set_type text DEFAULT 'N',
  is_pr boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_set_logs_workout ON workout_set_logs(workout_log_id);

-- 4. Daily steps tracking
CREATE TABLE IF NOT EXISTS steps_daily_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES user_profiles(whop_user_id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  baseline integer DEFAULT 6000,
  goal integer DEFAULT 8000,
  done integer DEFAULT 0,
  milestones_awarded jsonb DEFAULT '[]',
  goal_hit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT steps_daily_unique UNIQUE (user_id, log_date)
);

-- 5. Daily nutrition goals/tracking
CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES user_profiles(whop_user_id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  calorie_goal integer DEFAULT 2500,
  protein_goal integer DEFAULT 160,
  carbs_goal integer DEFAULT 260,
  fats_goal integer DEFAULT 80,
  water_goal_l numeric DEFAULT 2.8,
  water_in_l numeric DEFAULT 0,
  protein_goal_hit boolean DEFAULT false,
  calories_on_target boolean DEFAULT false,
  hydration_goal_hit boolean DEFAULT false,
  meal_rewards_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT nutrition_daily_unique UNIQUE (user_id, log_date)
);

-- 6. Individual meals within a nutrition day
CREATE TABLE IF NOT EXISTS nutrition_meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_log_id uuid NOT NULL REFERENCES nutrition_daily_logs(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  meal_type text NOT NULL,
  name text NOT NULL,
  calories integer DEFAULT 0,
  protein integer DEFAULT 0,
  carbs integer DEFAULT 0,
  fats integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meals_daily ON nutrition_meals(daily_log_id);

-- 7. Breathwork sessions
CREATE TABLE IF NOT EXISTS breathwork_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES user_profiles(whop_user_id) ON DELETE CASCADE,
  preset_id text,
  inhale integer NOT NULL,
  hold_sec integer NOT NULL,
  exhale integer NOT NULL,
  cycles integer NOT NULL,
  xp_earned integer DEFAULT 25,
  completed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_breathwork_user ON breathwork_sessions(user_id, completed_at DESC);

-- 8. Freestyle workout templates
CREATE TABLE IF NOT EXISTS freestyle_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES user_profiles(whop_user_id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Freestyle',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_freestyle_user ON freestyle_templates(user_id);

-- 9. Exercises within freestyle templates
CREATE TABLE IF NOT EXISTS freestyle_template_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES freestyle_templates(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  sets integer DEFAULT 3,
  reps integer DEFAULT 10,
  sort_order integer DEFAULT 0
);
