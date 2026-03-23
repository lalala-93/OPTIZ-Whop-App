-- Migration 004: Fix workout_logs daily uniqueness without non-immutable index expressions
-- Safe for databases that partially applied earlier V2 SQL.

ALTER TABLE workout_logs
ADD COLUMN IF NOT EXISTS completed_date date;

UPDATE workout_logs
SET completed_date = (completed_at AT TIME ZONE 'UTC')::date
WHERE completed_date IS NULL;

ALTER TABLE workout_logs
ALTER COLUMN completed_date SET DEFAULT CURRENT_DATE;

ALTER TABLE workout_logs
ALTER COLUMN completed_date SET NOT NULL;

DROP INDEX IF EXISTS idx_workout_logs_daily;

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
ON workout_logs(user_id, completed_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workout_logs_daily'
  ) THEN
    ALTER TABLE workout_logs
    ADD CONSTRAINT workout_logs_daily
    UNIQUE (user_id, program_id, session_id, completed_date);
  END IF;
END $$;
