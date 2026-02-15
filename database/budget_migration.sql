-- Budget Management Migration
-- This migration adds budget tracking fields to the tasks table

-- =====================
-- MIGRATION: Add Budget Tracking Fields to Tasks
-- =====================
do $$
begin
  -- estimated_cost (decimal for dollar amounts)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_cost') then
    alter table tasks add column estimated_cost decimal(10, 2);
  end if;

  -- actual_cost
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_cost') then
    alter table tasks add column actual_cost decimal(10, 2) default 0 not null;
  end if;

  -- max_cost
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'max_cost') then
    alter table tasks add column max_cost decimal(10, 2);
  end if;

  -- estimated_tokens (bigint for large token counts)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_tokens') then
    alter table tasks add column estimated_tokens bigint;
  end if;

  -- actual_tokens
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_tokens') then
    alter table tasks add column actual_tokens bigint default 0 not null;
  end if;

  -- max_tokens
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'max_tokens') then
    alter table tasks add column max_tokens bigint;
  end if;

  -- estimated_time (bigint for milliseconds)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_time') then
    alter table tasks add column estimated_time bigint;
  end if;

  -- actual_time
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_time') then
    alter table tasks add column actual_time bigint default 0 not null;
  end if;

  -- max_time
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'max_time') then
    alter table tasks add column max_time bigint;
  end if;

  -- retry_count
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'retry_count') then
    alter table tasks add column retry_count integer default 0 not null;
  end if;

  -- max_retries
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'max_retries') then
    alter table tasks add column max_retries integer default 3 not null;
  end if;

  -- budget_status
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'budget_status') then
    alter table tasks add column budget_status text default 'within-budget' not null;
  end if;

  -- is_paused
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'is_paused') then
    alter table tasks add column is_paused boolean default false not null;
  end if;

  -- pause_reason
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'pause_reason') then
    alter table tasks add column pause_reason text;
  end if;

  -- started_at (when task execution started)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'started_at') then
    alter table tasks add column started_at timestamp with time zone;
  end if;

  -- budget_last_updated_at
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'budget_last_updated_at') then
    alter table tasks add column budget_last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
  end if;
end $$;

-- Add constraint for budget_status
alter table tasks drop constraint if exists tasks_budget_status_check;
alter table tasks add constraint tasks_budget_status_check
  check (budget_status in ('within-budget', 'warning', 'exceeded', 'paused'));

-- Create index for budget queries
create index if not exists tasks_budget_status_idx on tasks(budget_status);
create index if not exists tasks_is_paused_idx on tasks(is_paused);

-- =====================
-- BUDGET ALERTS TABLE
-- =====================
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  task_title text not null,
  alert_type text not null check (alert_type in ('warning', 'exceeded', 'paused')),
  message text not null,
  acknowledged boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for budget_alerts
alter table budget_alerts enable row level security;

-- Grants for budget_alerts table
grant all on table budget_alerts to postgres, service_role;

-- RLS Policies for budget_alerts
drop policy if exists "Users can view their own budget alerts" on budget_alerts;
create policy "Users can view their own budget alerts" on budget_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget alerts" on budget_alerts;
create policy "Users can insert their own budget alerts" on budget_alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own budget alerts" on budget_alerts;
create policy "Users can update their own budget alerts" on budget_alerts
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own budget alerts" on budget_alerts;
create policy "Users can delete their own budget alerts" on budget_alerts
  for delete using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists budget_alerts_user_id_idx on budget_alerts(user_id);
create index if not exists budget_alerts_task_id_idx on budget_alerts(task_id);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);
