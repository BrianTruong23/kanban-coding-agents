-- Budget and Resource Management Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- =====================
-- BUDGETS TABLE
-- =====================
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  -- Budget limits
  max_cost numeric(10, 2), -- in dollars
  max_tokens bigint, -- total tokens
  max_time integer, -- in minutes

  -- Current usage
  current_cost numeric(10, 2) default 0 not null,
  current_tokens bigint default 0 not null,
  current_time integer default 0 not null,

  -- Retry management
  max_retries integer default 3 not null,
  current_retries integer default 0 not null,

  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'exceeded', 'completed')),
  paused_reason text,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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

-- Indexes for faster queries
create index if not exists budgets_user_id_idx on budgets(user_id);
create index if not exists budgets_task_id_idx on budgets(task_id);
create index if not exists budgets_status_idx on budgets(status);

-- Trigger for budgets
drop trigger if exists update_budgets_updated_at on budgets;
create trigger update_budgets_updated_at
  before update on budgets
  for each row
  execute function update_updated_at_column();

-- =====================
-- BUDGET USAGE ENTRIES TABLE
-- =====================
create table if not exists budget_usage_entries (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  -- Usage details
  cost_incurred numeric(10, 2) default 0 not null,
  tokens_used bigint default 0 not null,
  time_spent integer default 0 not null, -- in minutes

  -- Execution details
  agent_id uuid references agents(id) on delete set null,
  operation text not null,
  success boolean default true not null,
  error_message text,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table budget_usage_entries enable row level security;

-- Grants for budget_usage_entries table
grant all on table budget_usage_entries to postgres, service_role;

-- RLS Policies for budget_usage_entries (inherit from budget)
drop policy if exists "Users can view their own budget usage entries" on budget_usage_entries;
create policy "Users can view their own budget usage entries" on budget_usage_entries
  for select using (
    exists (
      select 1 from budgets
      where budgets.id = budget_usage_entries.budget_id
      and budgets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert their own budget usage entries" on budget_usage_entries;
create policy "Users can insert their own budget usage entries" on budget_usage_entries
  for insert with check (
    exists (
      select 1 from budgets
      where budgets.id = budget_usage_entries.budget_id
      and budgets.user_id = auth.uid()
    )
  );

-- Indexes for faster queries
create index if not exists budget_usage_entries_budget_id_idx on budget_usage_entries(budget_id);
create index if not exists budget_usage_entries_task_id_idx on budget_usage_entries(task_id);
create index if not exists budget_usage_entries_agent_id_idx on budget_usage_entries(agent_id);
create index if not exists budget_usage_entries_created_at_idx on budget_usage_entries(created_at);

-- =====================
-- BUDGET ALERTS TABLE
-- =====================
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  alert_type text not null check (alert_type in ('warning', 'critical', 'exceeded')),
  budget_type text not null check (budget_type in ('cost', 'tokens', 'time')),
  message text not null,

  -- Threshold details
  threshold numeric(5, 2) not null, -- percentage (e.g., 80.00 for 80%)
  current_usage numeric(10, 2) not null,
  limit_value numeric(10, 2) not null,

  acknowledged boolean default false not null,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table budget_alerts enable row level security;

-- Grants for budget_alerts table
grant all on table budget_alerts to postgres, service_role;

-- RLS Policies for budget_alerts (inherit from budget)
drop policy if exists "Users can view their own budget alerts" on budget_alerts;
create policy "Users can view their own budget alerts" on budget_alerts
  for select using (
    exists (
      select 1 from budgets
      where budgets.id = budget_alerts.budget_id
      and budgets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own budget alerts" on budget_alerts;
create policy "Users can update their own budget alerts" on budget_alerts
  for update using (
    exists (
      select 1 from budgets
      where budgets.id = budget_alerts.budget_id
      and budgets.user_id = auth.uid()
    )
  );

-- Indexes for faster queries
create index if not exists budget_alerts_budget_id_idx on budget_alerts(budget_id);
create index if not exists budget_alerts_task_id_idx on budget_alerts(task_id);
create index if not exists budget_alerts_alert_type_idx on budget_alerts(alert_type);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);

-- =====================
-- FUNCTION: Auto-update budget when usage is added
-- =====================
create or replace function update_budget_usage()
returns trigger
language plpgsql
as $$
declare
  v_budget record;
  v_max_cost numeric;
  v_max_tokens bigint;
  v_max_time integer;
  v_exceeded boolean := false;
begin
  -- Get the current budget
  select * into v_budget from budgets where id = new.budget_id;

  -- Update budget usage
  update budgets set
    current_cost = current_cost + new.cost_incurred,
    current_tokens = current_tokens + new.tokens_used,
    current_time = current_time + new.time_spent,
    current_retries = case when new.success = false then current_retries + 1 else current_retries end
  where id = new.budget_id
  returning max_cost, max_tokens, max_time into v_max_cost, v_max_tokens, v_max_time;

  -- Check if any budget limit is exceeded
  if v_max_cost is not null and (v_budget.current_cost + new.cost_incurred) > v_max_cost then
    v_exceeded := true;
    -- Create exceeded alert for cost
    insert into budget_alerts (budget_id, task_id, alert_type, budget_type, message, threshold, current_usage, limit_value)
    values (
      new.budget_id,
      new.task_id,
      'exceeded',
      'cost',
      'Cost budget exceeded',
      100.00,
      v_budget.current_cost + new.cost_incurred,
      v_max_cost
    );
  end if;

  if v_max_tokens is not null and (v_budget.current_tokens + new.tokens_used) > v_max_tokens then
    v_exceeded := true;
    -- Create exceeded alert for tokens
    insert into budget_alerts (budget_id, task_id, alert_type, budget_type, message, threshold, current_usage, limit_value)
    values (
      new.budget_id,
      new.task_id,
      'exceeded',
      'tokens',
      'Token budget exceeded',
      100.00,
      v_budget.current_tokens + new.tokens_used,
      v_max_tokens
    );
  end if;

  if v_max_time is not null and (v_budget.current_time + new.time_spent) > v_max_time then
    v_exceeded := true;
    -- Create exceeded alert for time
    insert into budget_alerts (budget_id, task_id, alert_type, budget_type, message, threshold, current_usage, limit_value)
    values (
      new.budget_id,
      new.task_id,
      'exceeded',
      'time',
      'Time budget exceeded',
      100.00,
      v_budget.current_time + new.time_spent,
      v_max_time
    );
  end if;

  -- Update status to exceeded if any limit is exceeded
  if v_exceeded then
    update budgets set
      status = 'exceeded',
      paused_reason = 'Budget limit exceeded'
    where id = new.budget_id;
  end if;

  return new;
end;
$$;

-- Trigger to update budget usage
drop trigger if exists on_budget_usage_entry_created on budget_usage_entries;
create trigger on_budget_usage_entry_created
  after insert on budget_usage_entries
  for each row
  execute function update_budget_usage();
