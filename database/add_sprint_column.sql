-- Migration: Add sprint column to tasks table
-- This migration adds the missing sprint column that is required for the application to work correctly.
-- Run this in your Supabase SQL Editor if you're experiencing issues with tasks not appearing after creation.

-- Add sprint column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
    RAISE NOTICE 'Sprint column added successfully to tasks table';
  ELSE
    RAISE NOTICE 'Sprint column already exists in tasks table';
  END IF;
END $$;
