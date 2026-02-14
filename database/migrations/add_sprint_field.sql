-- Migration: Add sprint field to tasks table
-- Date: 2026-02-14
-- Description: Adds the sprint field to support sprint-based task organization

-- Add the sprint column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
    AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
    RAISE NOTICE 'Added sprint column to tasks table';
  ELSE
    RAISE NOTICE 'Sprint column already exists';
  END IF;
END $$;

-- Add index for sprint column for better query performance
CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks(sprint);

-- Verify the migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
    AND column_name = 'sprint'
  ) THEN
    RAISE NOTICE 'Sprint field migration completed successfully';
  ELSE
    RAISE EXCEPTION 'Sprint field migration failed';
  END IF;
END $$;
