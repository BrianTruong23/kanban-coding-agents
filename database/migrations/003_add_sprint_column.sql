-- Migration: Add sprint column to tasks table
-- This migration adds the sprint field to support sprint-based organization

-- Add sprint column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
    raise notice 'Added sprint column to tasks table';
  else
    raise notice 'Sprint column already exists in tasks table';
  end if;
end $$;
