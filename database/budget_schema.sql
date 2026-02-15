-- Budget and Resource Management Schema
-- Run this SQL in your Supabase SQL Editor after running the main schema.sql

-- =====================
-- TASK BUDGETS TABLE
-- =====================
create table if not exists task_budgets (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  max_cost numeric(10, 2), -- Max cost in dollars
  max_tokens integer, -- Max tokens allowed
  max_time integer, -- Max time in seconds
  current_cost numeric(10, 2) default 0.00, -- Current spent cost
  current_tokens integer default 0, -- Current used tokens
  current_time integer default 0, -- Current used time in seconds
  retry_count integer default 0, -- Number of retries attempted
  max_retries integer default 3, -- Max retries allowed
  status text not null default 'active' check (status in ('active', 'paused', 'exceeded', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_task_budget unique(task_id)
);

-- Enable Row Level Security (RLS)
alter table task_budgets enable row level security;

-- Grants for task_budgets table
grant all on table task_budgets to postgres, service_role;

-- RLS Policies for task_budgets
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

-- =====================
-- BUDGET USAGE LOGS TABLE
-- =====================
create table if not exists budget_usage_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  cost numeric(10, 2) default 0.00,
  tokens integer default 0,
  time_spent integer default 0, -- in seconds
  operation text not null, -- e.g., "api_call", "retry", "completion"
  notes text
);

-- Enable Row Level Security (RLS)
alter table budget_usage_logs enable row level security;

-- Grants for budget_usage_logs table
grant all on table budget_usage_logs to postgres, service_role;

-- RLS Policies for budget_usage_logs
drop policy if exists "Users can view their own budget logs" on budget_usage_logs;
create policy "Users can view their own budget logs" on budget_usage_logs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget logs" on budget_usage_logs;
create policy "Users can insert their own budget logs" on budget_usage_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own budget logs" on budget_usage_logs;
create policy "Users can delete their own budget logs" on budget_usage_logs
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists budget_usage_logs_task_id_idx on budget_usage_logs(task_id);
create index if not exists budget_usage_logs_user_id_idx on budget_usage_logs(user_id);
create index if not exists budget_usage_logs_timestamp_idx on budget_usage_logs(timestamp);

-- =====================
-- PROJECT BUDGETS TABLE
-- =====================
create table if not exists project_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  total_budget numeric(10, 2) not null default 0.00, -- Total budget in dollars
  spent_budget numeric(10, 2) default 0.00, -- Spent budget in dollars
  total_tokens integer, -- Total token limit
  used_tokens integer default 0, -- Used tokens
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone,
  status text not null default 'active' check (status in ('active', 'completed', 'exceeded')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table project_budgets enable row level security;

-- Grants for project_budgets table
grant all on table project_budgets to postgres, service_role;

-- RLS Policies for project_budgets
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
create index if not exists project_budgets_status_idx on project_budgets(status);

-- =====================
-- BUDGET ALERTS TABLE
-- =====================
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade,
  project_id uuid references project_budgets(id) on delete cascade,
  type text not null check (type in ('warning', 'critical', 'exceeded')),
  threshold integer not null, -- Percentage threshold (e.g., 80 for 80%)
  message text not null,
  triggered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  acknowledged boolean default false
);

-- Enable Row Level Security (RLS)
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

-- Indexes
create index if not exists budget_alerts_user_id_idx on budget_alerts(user_id);
create index if not exists budget_alerts_task_id_idx on budget_alerts(task_id);
create index if not exists budget_alerts_project_id_idx on budget_alerts(project_id);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);

-- =====================
-- TRIGGERS
-- =====================

-- Trigger for task_budgets updated_at
drop trigger if exists update_task_budgets_updated_at on task_budgets;
create trigger update_task_budgets_updated_at
  before update on task_budgets
  for each row
  execute function update_updated_at_column();

-- Trigger for project_budgets updated_at
drop trigger if exists update_project_budgets_updated_at on project_budgets;
create trigger update_project_budgets_updated_at
  before update on project_budgets
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTIONS
-- =====================

-- Function to check budget limits and create alerts
create or replace function check_budget_limits()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_cost_percentage numeric;
  v_token_percentage numeric;
  v_time_percentage numeric;
  v_max_percentage numeric := 0;
  v_alert_type text;
  v_message text;
begin
  -- Calculate percentages
  if new.max_cost is not null and new.max_cost > 0 then
    v_cost_percentage := (new.current_cost / new.max_cost) * 100;
    v_max_percentage := greatest(v_max_percentage, v_cost_percentage);
  end if;

  if new.max_tokens is not null and new.max_tokens > 0 then
    v_token_percentage := (new.current_tokens::numeric / new.max_tokens::numeric) * 100;
    v_max_percentage := greatest(v_max_percentage, v_token_percentage);
  end if;

  if new.max_time is not null and new.max_time > 0 then
    v_time_percentage := (new.current_time::numeric / new.max_time::numeric) * 100;
    v_max_percentage := greatest(v_max_percentage, v_time_percentage);
  end if;

  -- Determine alert type and create alert if necessary
  if v_max_percentage >= 100 then
    v_alert_type := 'exceeded';
    v_message := format('Budget exceeded: %.1f%% of limits reached', v_max_percentage);
    new.status := 'exceeded';

    insert into budget_alerts (user_id, task_id, type, threshold, message)
    values (new.user_id, new.task_id, v_alert_type, 100, v_message)
    on conflict do nothing;
  elsif v_max_percentage >= 90 then
    v_alert_type := 'critical';
    v_message := format('Critical: %.1f%% of budget limits reached', v_max_percentage);

    insert into budget_alerts (user_id, task_id, type, threshold, message)
    values (new.user_id, new.task_id, v_alert_type, 90, v_message)
    on conflict do nothing;
  elsif v_max_percentage >= 75 then
    v_alert_type := 'warning';
    v_message := format('Warning: %.1f%% of budget limits reached', v_max_percentage);

    insert into budget_alerts (user_id, task_id, type, threshold, message)
    values (new.user_id, new.task_id, v_alert_type, 75, v_message)
    on conflict do nothing;
  end if;

  return new;
exception
  when others then
    raise notice 'Error checking budget limits: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to check budget limits on update
drop trigger if exists check_task_budget_limits on task_budgets;
create trigger check_task_budget_limits
  before update on task_budgets
  for each row
  when (new.current_cost <> old.current_cost or new.current_tokens <> old.current_tokens or new.current_time <> old.current_time)
  execute function check_budget_limits();
