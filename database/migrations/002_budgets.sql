-- =====================
-- BUDGETS TABLE
-- =====================
-- Stores budget limits and current usage for tasks
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  -- Budget limits (nullable means no limit set)
  token_limit integer,
  cost_limit integer, -- in USD cents
  time_limit integer, -- in minutes

  -- Current usage
  tokens_used integer not null default 0,
  cost_used integer not null default 0, -- in USD cents
  time_used integer not null default 0, -- in minutes

  -- Retry configuration
  max_retries integer not null default 3,
  retries_used integer not null default 0,

  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'exceeded', 'completed')),
  is_paused boolean not null default false,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paused_at timestamp with time zone,
  completed_at timestamp with time zone,

  -- Constraints
  unique(task_id) -- One budget per task
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
-- BUDGET_USAGES TABLE
-- =====================
-- Tracks individual usage entries for budgets
create table if not exists budget_usages (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  -- Usage details
  tokens integer not null default 0,
  cost integer not null default 0, -- in USD cents
  time_spent integer not null default 0, -- in minutes

  -- Context
  agent_id uuid references agents(id) on delete set null,
  operation text not null, -- e.g., "task_execution", "retry", "refinement"
  success boolean not null default false,
  error_message text,

  -- Metadata (JSONB for flexible data storage)
  metadata jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table budget_usages enable row level security;

-- Grants for budget_usages table
grant all on table budget_usages to postgres, service_role;

-- RLS Policies for budget_usages (inherit from budget's user_id)
drop policy if exists "Users can view their own budget usages" on budget_usages;
create policy "Users can view their own budget usages" on budget_usages
  for select using (
    exists (
      select 1 from budgets
      where budgets.id = budget_usages.budget_id
      and budgets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert their own budget usages" on budget_usages;
create policy "Users can insert their own budget usages" on budget_usages
  for insert with check (
    exists (
      select 1 from budgets
      where budgets.id = budget_usages.budget_id
      and budgets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own budget usages" on budget_usages;
create policy "Users can update their own budget usages" on budget_usages
  for update using (
    exists (
      select 1 from budgets
      where budgets.id = budget_usages.budget_id
      and budgets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own budget usages" on budget_usages;
create policy "Users can delete their own budget usages" on budget_usages
  for delete using (
    exists (
      select 1 from budgets
      where budgets.id = budget_usages.budget_id
      and budgets.user_id = auth.uid()
    )
  );

-- Indexes for faster queries
create index if not exists budget_usages_budget_id_idx on budget_usages(budget_id);
create index if not exists budget_usages_task_id_idx on budget_usages(task_id);
create index if not exists budget_usages_agent_id_idx on budget_usages(agent_id);
create index if not exists budget_usages_created_at_idx on budget_usages(created_at desc);

-- =====================
-- BUDGET_ALERTS TABLE
-- =====================
-- Stores alerts when budgets approach or exceed limits
create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references budgets(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,

  -- Alert details
  type text not null check (type in ('warning', 'critical', 'exceeded')),
  message text not null,
  threshold integer not null, -- percentage (e.g., 75 for 75%)

  current_usage integer not null,
  limit_value integer not null,
  budget_type text not null check (budget_type in ('tokens', 'cost', 'time')),

  -- Acknowledgment
  acknowledged boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  acknowledged_at timestamp with time zone
);

-- Enable Row Level Security (RLS)
alter table budget_alerts enable row level security;

-- Grants for budget_alerts table
grant all on table budget_alerts to postgres, service_role;

-- RLS Policies for budget_alerts (inherit from budget's user_id)
drop policy if exists "Users can view their own budget alerts" on budget_alerts;
create policy "Users can view their own budget alerts" on budget_alerts
  for select using (
    exists (
      select 1 from budgets
      where budgets.id = budget_alerts.budget_id
      and budgets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert their own budget alerts" on budget_alerts;
create policy "Users can insert their own budget alerts" on budget_alerts
  for insert with check (
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

drop policy if exists "Users can delete their own budget alerts" on budget_alerts;
create policy "Users can delete their own budget alerts" on budget_alerts
  for delete using (
    exists (
      select 1 from budgets
      where budgets.id = budget_alerts.budget_id
      and budgets.user_id = auth.uid()
    )
  );

-- Indexes for faster queries
create index if not exists budget_alerts_budget_id_idx on budget_alerts(budget_id);
create index if not exists budget_alerts_task_id_idx on budget_alerts(task_id);
create index if not exists budget_alerts_acknowledged_idx on budget_alerts(acknowledged);
create index if not exists budget_alerts_created_at_idx on budget_alerts(created_at desc);

-- =====================
-- FUNCTIONS: Budget Management
-- =====================

-- Function to check budget and create alerts if needed
create or replace function check_budget_limits()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_token_percent integer;
  v_cost_percent integer;
  v_time_percent integer;
  v_needs_warning boolean := false;
  v_needs_critical boolean := false;
  v_is_exceeded boolean := false;
begin
  -- Calculate percentages for each budget type
  if new.token_limit is not null and new.token_limit > 0 then
    v_token_percent := (new.tokens_used * 100) / new.token_limit;
    if v_token_percent >= 100 then
      v_is_exceeded := true;
    elsif v_token_percent >= 90 then
      v_needs_critical := true;
    elsif v_token_percent >= 75 then
      v_needs_warning := true;
    end if;
  end if;

  if new.cost_limit is not null and new.cost_limit > 0 then
    v_cost_percent := (new.cost_used * 100) / new.cost_limit;
    if v_cost_percent >= 100 then
      v_is_exceeded := true;
    elsif v_cost_percent >= 90 then
      v_needs_critical := true;
    elsif v_cost_percent >= 75 then
      v_needs_warning := true;
    end if;
  end if;

  if new.time_limit is not null and new.time_limit > 0 then
    v_time_percent := (new.time_used * 100) / new.time_limit;
    if v_time_percent >= 100 then
      v_is_exceeded := true;
    elsif v_time_percent >= 90 then
      v_needs_critical := true;
    elsif v_time_percent >= 75 then
      v_needs_warning := true;
    end if;
  end if;

  -- Update status if exceeded
  if v_is_exceeded and new.status != 'exceeded' then
    new.status := 'exceeded';
    new.is_paused := true;
    new.paused_at := timezone('utc'::text, now());
  end if;

  -- Create alerts (would be done in application logic for better control)
  -- For now, just update the status

  return new;
end;
$$;

-- Trigger to check budget limits on update
drop trigger if exists check_budget_limits_trigger on budgets;
create trigger check_budget_limits_trigger
  before update on budgets
  for each row
  execute function check_budget_limits();

-- Function to update budget usage
create or replace function update_budget_usage()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Update the budget totals when a new usage is recorded
  update budgets
  set
    tokens_used = tokens_used + new.tokens,
    cost_used = cost_used + new.cost,
    time_used = time_used + new.time_spent,
    updated_at = timezone('utc'::text, now())
  where id = new.budget_id;

  return new;
end;
$$;

-- Trigger to update budget when usage is added
drop trigger if exists update_budget_usage_trigger on budget_usages;
create trigger update_budget_usage_trigger
  after insert on budget_usages
  for each row
  execute function update_budget_usage();
