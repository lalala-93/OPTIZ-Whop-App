-- Migration: Meal templates + daily checks for new nutrition tracking system
-- Run this in Supabase SQL Editor

-- 1. Persistent meal templates (user-created, persist across days)
CREATE TABLE IF NOT EXISTS nutrition_meal_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  slot text NOT NULL DEFAULT 'midi',
  calories integer DEFAULT 0,
  protein integer DEFAULT 0,
  carbs integer DEFAULT 0,
  fats integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON nutrition_meal_templates(user_id);

-- 2. Daily check marks (which meals were eaten on which day — resets daily)
CREATE TABLE IF NOT EXISTS nutrition_daily_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  template_id uuid NOT NULL REFERENCES nutrition_meal_templates(id) ON DELETE CASCADE,
  date date NOT NULL,
  CONSTRAINT daily_check_unique UNIQUE (user_id, template_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_checks_user_date ON nutrition_daily_checks(user_id, date);

-- 3. RLS policies — permissive (server actions use service_role which bypasses RLS,
--    but if RLS is enabled without policies, anon/user JWT access is blocked)
ALTER TABLE nutrition_meal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_templates" ON nutrition_meal_templates;
CREATE POLICY "allow_all_templates" ON nutrition_meal_templates FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE nutrition_daily_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_checks" ON nutrition_daily_checks;
CREATE POLICY "allow_all_checks" ON nutrition_daily_checks FOR ALL USING (true) WITH CHECK (true);

-- 4. Fix RLS on existing nutrition tables (may fix persistence issues)
ALTER TABLE nutrition_daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_logs" ON nutrition_daily_logs;
CREATE POLICY "allow_all_logs" ON nutrition_daily_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_meals" ON nutrition_meals;
CREATE POLICY "allow_all_meals" ON nutrition_meals FOR ALL USING (true) WITH CHECK (true);
