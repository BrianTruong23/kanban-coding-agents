-- Migration: Add sprint column to tasks table
-- This migration adds the missing sprint column that was introduced in the UI
-- but was not properly added to the database schema.
--
-- Run this in your Supabase SQL Editor to fix the issue where newly added tasks
-- do not appear on the Kanban board.

-- Add sprint column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
    raise notice 'Sprint column added successfully';
  else
    raise notice 'Sprint column already exists';
  end if;
end $$;

-- Add index for sprint column for better query performance
create index if not exists tasks_sprint_idx on tasks(sprint);
