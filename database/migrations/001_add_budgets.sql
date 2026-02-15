-- Budget Management System Migration
-- This adds support for cost/token/time budgets for agent tasks

-- =====================
-- TASK BUDGETS TABLE
-- =====================
create table if not exists task_budgets (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Budget limits (nullable means no limit)
  max_tokens bigint,
  max_cost numeric(10, 4), -- USD with 4 decimal places
  max_time_minutes integer,
  max_retries integer,

  -- Current usage
  tokens_used bigint default 0 not null,
  cost_used numeric(10, 4) default 0 not null,
  time_used_minutes integer default 0 not null,
  retries_used integer default 0 not null,

  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'exceeded', 'completed')),
  paused_reason text,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Unique constraint: one budget per task
  constraint task_budgets_task_id_unique unique (task_id)
);

-- Enable Row Level Security (RLS)
alter table task_budgets enable row level security;

-- Grants
grant all on table task_budgets to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own task budgets" on task_budgets;
create policy "Users can view their own task budgets" on task_budgets
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own task budgets" on task_budgets;
create policy "Users can insert their own task budgets" on task_budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own task budgets" on task_budgets;
create policy "Users can update their own task budgets" on task_budgets
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own task budgets" on task_budgets;
create policy "Users can delete their own task budgets" on task_budgets
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists task_budgets_task_id_idx on task_budgets(task_id);
create index if not exists task_budgets_user_id_idx on task_budgets(user_id);
create index if not exists task_budgets_status_idx on task_budgets(status);

-- Trigger for auto-updating updated_at
drop trigger if exists update_task_budgets_updated_at on task_budgets;
create trigger update_task_budgets_updated_at
  before update on task_budgets
  for each row
  execute function update_updated_at_column();

-- =====================
-- BUDGET USAGE LOGS TABLE
-- =====================
create table if not exists budget_usage_logs (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references task_budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Usage details
  tokens_used bigint default 0 not null,
  cost_incurred numeric(10, 4) default 0 not null,
  time_spent_minutes integer default 0 not null,

  -- Event details
  event_type text not null check (event_type in ('execution', 'retry', 'pause', 'resume', 'manual_adjustment')),
  description text,
  agent_id uuid references agents(id) on delete set null,

  -- Metadata
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table budget_usage_logs enable row level security;

-- Grants
grant all on table budget_usage_logs to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own budget logs" on budget_usage_logs;
create policy "Users can view their own budget logs" on budget_usage_logs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget logs" on budget_usage_logs;
create policy "Users can insert their own budget logs" on budget_usage_logs
  for insert with check (auth.uid() = user_id);

-- Indexes
create index if not exists budget_usage_logs_budget_id_idx on budget_usage_logs(budget_id);
create index if not exists budget_usage_logs_task_id_idx on budget_usage_logs(task_id);
create index if not exists budget_usage_logs_user_id_idx on budget_usage_logs(user_id);
create index if not exists budget_usage_logs_timestamp_idx on budget_usage_logs(timestamp desc);

-- =====================
-- PROJECT BUDGETS TABLE
-- =====================
create table if not exists project_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,

  -- Aggregate limits (optional)
  max_tokens bigint,
  max_cost numeric(10, 4),
  max_time_minutes integer,

  -- Current totals
  total_tokens_used bigint default 0 not null,
  total_cost_used numeric(10, 4) default 0 not null,
  total_time_used_minutes integer default 0 not null,
  total_tasks_completed integer default 0 not null,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table project_budgets enable row level security;

-- Grants
grant all on table project_budgets to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own project budgets" on project_budgets;
create policy "Users can view their own project budgets" on project_budgets
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own project budgets" on project_budgets;
create policy "Users can insert their own project budgets" on project_budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own project budgets" on project_budgets;
create policy "Users can update their own project budgets" on project_budgets
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own project budgets" on project_budgets;
create policy "Users can delete their own project budgets" on project_budgets
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists project_budgets_user_id_idx on project_budgets(user_id);

-- Trigger for auto-updating updated_at
drop trigger if exists update_project_budgets_updated_at on project_budgets;
create trigger update_project_budgets_updated_at
  before update on project_budgets
  for each row
  execute function update_updated_at_column();

-- =====================
-- BUDGET ALERTS TABLE
-- =====================
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references task_budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,

  alert_type text not null check (alert_type in ('warning', 'critical', 'exceeded')),
  resource_type text not null check (resource_type in ('tokens', 'cost', 'time', 'retries')),
  threshold integer not null, -- percentage (e.g., 80 for 80%)
  message text not null,

  acknowledged boolean default false not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table budget_alerts enable row level security;

-- Grants
grant all on table budget_alerts to postgres, service_role;

-- RLS Policies
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

-- Indexes
create index if not exists budget_alerts_budget_id_idx on budget_alerts(budget_id);
create index if not exists budget_alerts_user_id_idx on budget_alerts(user_id);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);
create index if not exists budget_alerts_timestamp_idx on budget_alerts(timestamp desc);

-- =====================
-- MIGRATION: Add sprint column to tasks (if missing)
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;
