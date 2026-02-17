-- Verify Database Schema
-- Run this in your Supabase SQL Editor to check if your database has all required columns

-- Check for sprint column in tasks table
select
  case
    when exists (
      select 1
      from information_schema.columns
      where table_name = 'tasks'
      and column_name = 'sprint'
    )
    then '✓ sprint column exists in tasks table'
    else '✗ MISSING: sprint column in tasks table - Run migration 001_add_sprint_column.sql'
  end as sprint_check;

-- List all columns in tasks table
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_name = 'tasks'
order by ordinal_position;

-- Check RLS policies
select
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where tablename in ('tasks', 'agents')
order by tablename, policyname;
