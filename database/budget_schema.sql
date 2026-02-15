-- Budget and Resource Management Schema for Supabase
-- Run this SQL in your Supabase SQL Editor after the main schema.sql

-- =====================
-- BUDGETS TABLE
-- =====================
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  -- Budget limits (nullable means unlimited)
  max_cost numeric(10, 2), -- In dollars
  max_tokens bigint, -- Token count
  max_time integer, -- In minutes
  max_retries integer default 3,

  -- Current usage
  current_cost numeric(10, 2) default 0 not null,
  current_tokens bigint default 0 not null,
  current_time integer default 0 not null,
  current_retries integer default 0 not null,

  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'exceeded', 'completed')),
  paused_reason text,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one budget per task
  unique(task_id)
);

-- Enable Row Level Security (RLS)
alter table budgets enable row level security;

-- Grants for budgets table
grant all on table budgets to postgres, service_role;

-- RLS Policies for budgets
drop policy if exists "Users can view their own budgets" on budgets;
create policy "Users can view their own budgets" on budgets
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budgets" on budgets;
create policy "Users can insert their own budgets" on budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own budgets" on budgets;
create policy "Users can update their own budgets" on budgets
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own budgets" on budgets;
create policy "Users can delete their own budgets" on budgets
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists budgets_user_id_idx on budgets(user_id);
create index if not exists budgets_task_id_idx on budgets(task_id);
create index if not exists budgets_status_idx on budgets(status);

-- Trigger for budgets updated_at
drop trigger if exists update_budgets_updated_at on budgets;
create trigger update_budgets_updated_at
  before update on budgets
  for each row
  execute function update_updated_at_column();

-- =====================
-- BUDGET_USAGE TABLE
-- =====================
create table if not exists budget_usage (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Usage details
  cost numeric(10, 2) default 0 not null,
  tokens bigint default 0 not null,
  time integer default 0 not null, -- In minutes

  -- Operation details
  operation text not null,
  agent_id uuid references agents(id) on delete set null,

  -- Metadata
  metadata jsonb default '{}'::jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table budget_usage enable row level security;

-- Grants for budget_usage table
grant all on table budget_usage to postgres, service_role;

-- RLS Policies for budget_usage
drop policy if exists "Users can view their own budget usage" on budget_usage;
create policy "Users can view their own budget usage" on budget_usage
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget usage" on budget_usage;
create policy "Users can insert their own budget usage" on budget_usage
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own budget usage" on budget_usage;
create policy "Users can update their own budget usage" on budget_usage
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own budget usage" on budget_usage;
create policy "Users can delete their own budget usage" on budget_usage
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists budget_usage_budget_id_idx on budget_usage(budget_id);
create index if not exists budget_usage_task_id_idx on budget_usage(task_id);
create index if not exists budget_usage_user_id_idx on budget_usage(user_id);
create index if not exists budget_usage_timestamp_idx on budget_usage(timestamp);

-- =====================
-- BUDGET_ALERTS TABLE
-- =====================
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Alert details
  type text not null check (type in ('warning', 'critical', 'exceeded')),
  category text not null check (category in ('cost', 'tokens', 'time', 'retries')),
  message text not null,

  -- Threshold information
  threshold integer not null, -- Percentage of budget used
  current_value numeric(10, 2) not null,
  max_value numeric(10, 2) not null,

  -- Metadata
  acknowledged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
create index if not exists budget_alerts_budget_id_idx on budget_alerts(budget_id);
create index if not exists budget_alerts_task_id_idx on budget_alerts(task_id);
create index if not exists budget_alerts_user_id_idx on budget_alerts(user_id);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);

-- =====================
-- FUNCTION: Auto-update budget status on usage insert
-- =====================
create or replace function update_budget_on_usage()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  budget_record record;
  usage_percent numeric;
begin
  -- Get the budget record
  select * into budget_record from budgets where id = new.budget_id;

  -- Update the budget current values
  update budgets set
    current_cost = current_cost + new.cost,
    current_tokens = current_tokens + new.tokens,
    current_time = current_time + new.time
  where id = new.budget_id;

  -- Check for budget limits and create alerts
  -- Cost check
  if budget_record.max_cost is not null then
    usage_percent := ((budget_record.current_cost + new.cost) / budget_record.max_cost) * 100;

    if usage_percent >= 100 then
      -- Budget exceeded
      update budgets set status = 'exceeded', paused_reason = 'Cost budget exceeded' where id = new.budget_id;
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'exceeded', 'cost',
              'Cost budget exceeded', 100, budget_record.current_cost + new.cost, budget_record.max_cost);
    elsif usage_percent >= 90 then
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'critical', 'cost',
              'Cost budget at 90%', 90, budget_record.current_cost + new.cost, budget_record.max_cost)
      on conflict do nothing;
    elsif usage_percent >= 75 then
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'warning', 'cost',
              'Cost budget at 75%', 75, budget_record.current_cost + new.cost, budget_record.max_cost)
      on conflict do nothing;
    end if;
  end if;

  -- Tokens check
  if budget_record.max_tokens is not null then
    usage_percent := ((budget_record.current_tokens + new.tokens)::numeric / budget_record.max_tokens) * 100;

    if usage_percent >= 100 then
      update budgets set status = 'exceeded', paused_reason = 'Token budget exceeded' where id = new.budget_id;
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'exceeded', 'tokens',
              'Token budget exceeded', 100, budget_record.current_tokens + new.tokens, budget_record.max_tokens);
    elsif usage_percent >= 90 then
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'critical', 'tokens',
              'Token budget at 90%', 90, budget_record.current_tokens + new.tokens, budget_record.max_tokens)
      on conflict do nothing;
    elsif usage_percent >= 75 then
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'warning', 'tokens',
              'Token budget at 75%', 75, budget_record.current_tokens + new.tokens, budget_record.max_tokens)
      on conflict do nothing;
    end if;
  end if;

  -- Time check
  if budget_record.max_time is not null then
    usage_percent := ((budget_record.current_time + new.time)::numeric / budget_record.max_time) * 100;

    if usage_percent >= 100 then
      update budgets set status = 'exceeded', paused_reason = 'Time budget exceeded' where id = new.budget_id;
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'exceeded', 'time',
              'Time budget exceeded', 100, budget_record.current_time + new.time, budget_record.max_time);
    elsif usage_percent >= 90 then
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'critical', 'time',
              'Time budget at 90%', 90, budget_record.current_time + new.time, budget_record.max_time)
      on conflict do nothing;
    elsif usage_percent >= 75 then
      insert into budget_alerts (budget_id, task_id, user_id, type, category, message, threshold, current_value, max_value)
      values (new.budget_id, new.task_id, new.user_id, 'warning', 'time',
              'Time budget at 75%', 75, budget_record.current_time + new.time, budget_record.max_time)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- Trigger to update budget on usage insert
drop trigger if exists update_budget_on_usage_insert on budget_usage;
create trigger update_budget_on_usage_insert
  after insert on budget_usage
  for each row
  execute function update_budget_on_usage();
