-- Migration: Add sprint column to tasks table
-- Date: 2026-02-14
-- Description: Adds the sprint column to support sprint filtering in the Kanban board

-- Add sprint column if it doesn't exist
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'tasks'
    and column_name = 'sprint'
  ) then
    alter table tasks add column sprint text;
    raise notice 'Added sprint column to tasks table';
  else
    raise notice 'Sprint column already exists in tasks table';
  end if;
end $$;
