-- Budget and Resource Management Migration
-- This migration adds budget tracking capabilities for agent tasks

-- =====================
-- TASK_BUDGETS TABLE
-- =====================
create table if not exists task_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete set null,
  status text not null default 'active',

  -- Budget Limits (JSONB for flexibility)
  limits jsonb not null default '{}'::jsonb,

  -- Current Usage (JSONB for flexibility)
  usage jsonb not null default '{"tokens": 0, "cost": 0, "time": 0, "retries": 0, "apiCalls": 0, "fileOperations": 0}'::jsonb,

  -- Alert Configuration
  warning_thresholds jsonb default '{"tokens": 80, "cost": 80, "time": 80}'::jsonb,

  -- Auto Actions
  auto_actions_enabled boolean default true,
  auto_pause_on_exceed boolean default true,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paused_at timestamp with time zone,
  resumed_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Add status constraint
alter table task_budgets drop constraint if exists task_budgets_status_check;
alter table task_budgets add constraint task_budgets_status_check
  check (status in ('active', 'paused', 'exceeded', 'completed', 'cancelled'));

-- Enable Row Level Security
alter table task_budgets enable row level security;

-- Grants
grant all on table task_budgets to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own budgets" on task_budgets;
create policy "Users can view their own budgets" on task_budgets
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budgets" on task_budgets;
create policy "Users can insert their own budgets" on task_budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own budgets" on task_budgets;
create policy "Users can update their own budgets" on task_budgets
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own budgets" on task_budgets;
create policy "Users can delete their own budgets" on task_budgets
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists task_budgets_user_id_idx on task_budgets(user_id);
create index if not exists task_budgets_task_id_idx on task_budgets(task_id);
create index if not exists task_budgets_agent_id_idx on task_budgets(agent_id);
create index if not exists task_budgets_status_idx on task_budgets(status);

-- =====================
-- BUDGET_ALERTS TABLE
-- =====================
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references task_budgets(id) on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null,
  resource_type text not null,
  message text not null,
  threshold numeric not null,
  current_usage numeric not null,
  limit_value numeric not null,
  acknowledged boolean default false,
  acknowledged_at timestamp with time zone
);

-- Add type constraint
alter table budget_alerts drop constraint if exists budget_alerts_type_check;
alter table budget_alerts add constraint budget_alerts_type_check
  check (type in ('warning', 'critical', 'exceeded'));

-- Add resource_type constraint
alter table budget_alerts drop constraint if exists budget_alerts_resource_type_check;
alter table budget_alerts add constraint budget_alerts_resource_type_check
  check (resource_type in ('tokens', 'cost', 'time', 'retries'));

-- Enable Row Level Security
alter table budget_alerts enable row level security;

-- Grants
grant all on table budget_alerts to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own alerts" on budget_alerts;
create policy "Users can view their own alerts" on budget_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own alerts" on budget_alerts;
create policy "Users can insert their own alerts" on budget_alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own alerts" on budget_alerts;
create policy "Users can update their own alerts" on budget_alerts
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own alerts" on budget_alerts;
create policy "Users can delete their own alerts" on budget_alerts
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists budget_alerts_user_id_idx on budget_alerts(user_id);
create index if not exists budget_alerts_budget_id_idx on budget_alerts(budget_id);
create index if not exists budget_alerts_timestamp_idx on budget_alerts(timestamp desc);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);

-- =====================
-- BUDGET_HISTORY TABLE
-- =====================
create table if not exists budget_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references task_budgets(id) on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  action text not null,
  resource_snapshot jsonb not null,
  triggered_by text not null,
  notes text
);

-- Add action constraint
alter table budget_history drop constraint if exists budget_history_action_check;
alter table budget_history add constraint budget_history_action_check
  check (action in ('created', 'updated', 'paused', 'resumed', 'exceeded', 'completed', 'cancelled'));

-- Add triggered_by constraint
alter table budget_history drop constraint if exists budget_history_triggered_by_check;
alter table budget_history add constraint budget_history_triggered_by_check
  check (triggered_by in ('user', 'system', 'auto'));

-- Enable Row Level Security
alter table budget_history enable row level security;

-- Grants
grant all on table budget_history to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own budget history" on budget_history;
create policy "Users can view their own budget history" on budget_history
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own budget history" on budget_history;
create policy "Users can insert their own budget history" on budget_history
  for insert with check (auth.uid() = user_id);

-- Indexes
create index if not exists budget_history_user_id_idx on budget_history(user_id);
create index if not exists budget_history_budget_id_idx on budget_history(budget_id);
create index if not exists budget_history_timestamp_idx on budget_history(timestamp desc);

-- =====================
-- TRIGGERS
-- =====================

-- Trigger for task_budgets updated_at
drop trigger if exists update_task_budgets_updated_at on task_budgets;
create trigger update_task_budgets_updated_at
  before update on task_budgets
  for each row
  execute function update_updated_at_column();

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Function to check budget and create alerts
create or replace function check_budget_limits()
returns trigger as $$
declare
  usage_tokens numeric;
  usage_cost numeric;
  usage_time numeric;
  limit_tokens numeric;
  limit_cost numeric;
  limit_time numeric;
  threshold_tokens numeric;
  threshold_cost numeric;
  threshold_time numeric;
  percent_used numeric;
begin
  -- Extract values from JSONB
  usage_tokens := (new.usage->>'tokens')::numeric;
  usage_cost := (new.usage->>'cost')::numeric;
  usage_time := (new.usage->>'time')::numeric;

  limit_tokens := (new.limits->>'tokens')::numeric;
  limit_cost := (new.limits->>'cost')::numeric;
  limit_time := (new.limits->>'time')::numeric;

  threshold_tokens := coalesce((new.warning_thresholds->>'tokens')::numeric, 80);
  threshold_cost := coalesce((new.warning_thresholds->>'cost')::numeric, 80);
  threshold_time := coalesce((new.warning_thresholds->>'time')::numeric, 80);

  -- Check tokens
  if limit_tokens is not null and usage_tokens is not null then
    percent_used := (usage_tokens / limit_tokens) * 100;

    if percent_used >= 100 and new.status != 'exceeded' then
      -- Budget exceeded
      if new.auto_pause_on_exceed then
        new.status := 'exceeded';
        new.paused_at := timezone('utc'::text, now());
      end if;

      insert into budget_alerts (user_id, budget_id, type, resource_type, message, threshold, current_usage, limit_value)
      values (
        new.user_id,
        new.id,
        'exceeded',
        'tokens',
        'Token budget exceeded',
        100,
        usage_tokens,
        limit_tokens
      );
    elsif percent_used >= threshold_tokens then
      -- Warning threshold
      insert into budget_alerts (user_id, budget_id, type, resource_type, message, threshold, current_usage, limit_value)
      values (
        new.user_id,
        new.id,
        'warning',
        'tokens',
        'Token budget at ' || round(percent_used) || '%',
        threshold_tokens,
        usage_tokens,
        limit_tokens
      )
      on conflict do nothing;
    end if;
  end if;

  -- Check cost
  if limit_cost is not null and usage_cost is not null then
    percent_used := (usage_cost / limit_cost) * 100;

    if percent_used >= 100 and new.status != 'exceeded' then
      if new.auto_pause_on_exceed then
        new.status := 'exceeded';
        new.paused_at := timezone('utc'::text, now());
      end if;

      insert into budget_alerts (user_id, budget_id, type, resource_type, message, threshold, current_usage, limit_value)
      values (
        new.user_id,
        new.id,
        'exceeded',
        'cost',
        'Cost budget exceeded',
        100,
        usage_cost,
        limit_cost
      );
    elsif percent_used >= threshold_cost then
      insert into budget_alerts (user_id, budget_id, type, resource_type, message, threshold, current_usage, limit_value)
      values (
        new.user_id,
        new.id,
        'warning',
        'cost',
        'Cost budget at ' || round(percent_used) || '%',
        threshold_cost,
        usage_cost,
        limit_cost
      )
      on conflict do nothing;
    end if;
  end if;

  -- Check time
  if limit_time is not null and usage_time is not null then
    percent_used := (usage_time / limit_time) * 100;

    if percent_used >= 100 and new.status != 'exceeded' then
      if new.auto_pause_on_exceed then
        new.status := 'exceeded';
        new.paused_at := timezone('utc'::text, now());
      end if;

      insert into budget_alerts (user_id, budget_id, type, resource_type, message, threshold, current_usage, limit_value)
      values (
        new.user_id,
        new.id,
        'exceeded',
        'time',
        'Time budget exceeded',
        100,
        usage_time,
        limit_time
      );
    elsif percent_used >= threshold_time then
      insert into budget_alerts (user_id, budget_id, type, resource_type, message, threshold, current_usage, limit_value)
      values (
        new.user_id,
        new.id,
        'warning',
        'time',
        'Time budget at ' || round(percent_used) || '%',
        threshold_time,
        usage_time,
        limit_time
      )
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to check budget limits on update
drop trigger if exists check_budget_limits_trigger on task_budgets;
create trigger check_budget_limits_trigger
  before update on task_budgets
  for each row
  when (old.usage is distinct from new.usage)
  execute function check_budget_limits();

-- Function to log budget history
create or replace function log_budget_history()
returns trigger as $$
declare
  action_type text;
  triggered_by_val text := 'system';
begin
  if tg_op = 'INSERT' then
    action_type := 'created';
  elsif tg_op = 'UPDATE' then
    if old.status != new.status then
      action_type := new.status;
      if new.status = 'paused' or new.status = 'exceeded' then
        triggered_by_val := case
          when new.auto_pause_on_exceed and new.status = 'exceeded' then 'auto'
          else 'user'
        end;
      end if;
    else
      action_type := 'updated';
    end if;
  end if;

  insert into budget_history (user_id, budget_id, timestamp, action, resource_snapshot, triggered_by)
  values (
    new.user_id,
    new.id,
    timezone('utc'::text, now()),
    action_type,
    new.usage,
    triggered_by_val
  );

  return new;
end;
$$ language plpgsql;

-- Trigger to log budget history
drop trigger if exists log_budget_history_trigger on task_budgets;
create trigger log_budget_history_trigger
  after insert or update on task_budgets
  for each row
  execute function log_budget_history();
