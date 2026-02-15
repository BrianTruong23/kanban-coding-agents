-- Task Orchestration Schema Extension for Supabase
-- Run this SQL in your Supabase SQL Editor to add orchestration features

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  estimated_effort numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table epics enable row level security;

-- Grants
grant all on table epics to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own epics" on epics;
create policy "Users can view their own epics" on epics
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own epics" on epics;
create policy "Users can insert their own epics" on epics
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own epics" on epics;
create policy "Users can update their own epics" on epics
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own epics" on epics;
create policy "Users can delete their own epics" on epics
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists epics_user_id_idx on epics(user_id);

-- Trigger for updated_at
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- TICKETS TABLE
-- =====================
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id uuid references epics(id) on delete cascade,
  title text not null,
  description text,
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  estimated_effort numeric default 0,
  status text not null default 'backlog' check (status in ('backlog', 'in-progress', 'review', 'done')),
  assigned_agent_id uuid references agents(id) on delete set null,
  definition_of_done text[] default '{}',
  test_notes text[] default '{}',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table tickets enable row level security;

-- Grants
grant all on table tickets to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own tickets" on tickets;
create policy "Users can view their own tickets" on tickets
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tickets" on tickets;
create policy "Users can insert their own tickets" on tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tickets" on tickets;
create policy "Users can update their own tickets" on tickets
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tickets" on tickets;
create policy "Users can delete their own tickets" on tickets
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists tickets_user_id_idx on tickets(user_id);
create index if not exists tickets_epic_id_idx on tickets(epic_id);
create index if not exists tickets_assigned_agent_id_idx on tickets(assigned_agent_id);
create index if not exists tickets_status_idx on tickets(status);

-- Trigger for updated_at
drop trigger if exists update_tickets_updated_at on tickets;
create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();

-- =====================
-- SUBTASKS TABLE
-- =====================
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticket_id uuid references tickets(id) on delete cascade not null,
  title text not null,
  description text,
  estimated_effort numeric default 0,
  status text not null default 'backlog' check (status in ('backlog', 'in-progress', 'review', 'done')),
  assigned_agent_id uuid references agents(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table subtasks enable row level security;

-- Grants
grant all on table subtasks to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own subtasks" on subtasks;
create policy "Users can view their own subtasks" on subtasks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own subtasks" on subtasks;
create policy "Users can insert their own subtasks" on subtasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subtasks" on subtasks;
create policy "Users can update their own subtasks" on subtasks
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own subtasks" on subtasks;
create policy "Users can delete their own subtasks" on subtasks
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists subtasks_user_id_idx on subtasks(user_id);
create index if not exists subtasks_ticket_id_idx on subtasks(ticket_id);
create index if not exists subtasks_assigned_agent_id_idx on subtasks(assigned_agent_id);

-- Trigger for updated_at
drop trigger if exists update_subtasks_updated_at on subtasks;
create trigger update_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticket_id uuid references tickets(id) on delete cascade not null,
  level text not null check (level in ('low', 'medium', 'high', 'critical')),
  description text not null,
  mitigation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table risk_flags enable row level security;

-- Grants
grant all on table risk_flags to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own risk flags" on risk_flags;
create policy "Users can view their own risk flags" on risk_flags
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own risk flags" on risk_flags;
create policy "Users can insert their own risk flags" on risk_flags
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own risk flags" on risk_flags;
create policy "Users can update their own risk flags" on risk_flags
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own risk flags" on risk_flags;
create policy "Users can delete their own risk flags" on risk_flags
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists risk_flags_ticket_id_idx on risk_flags(ticket_id);

-- =====================
-- DEPENDENCIES TABLE
-- =====================
create table if not exists dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  from_id uuid not null, -- Can reference tickets or subtasks
  to_id uuid not null,   -- Can reference tickets or subtasks
  dependency_type text not null check (dependency_type in ('blocks', 'requires', 'related')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table dependencies enable row level security;

-- Grants
grant all on table dependencies to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own dependencies" on dependencies;
create policy "Users can view their own dependencies" on dependencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dependencies" on dependencies;
create policy "Users can insert their own dependencies" on dependencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own dependencies" on dependencies;
create policy "Users can delete their own dependencies" on dependencies
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists dependencies_from_id_idx on dependencies(from_id);
create index if not exists dependencies_to_id_idx on dependencies(to_id);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('frontend', 'backend', 'database', 'devops', 'mobile', 'testing', 'design', 'ai-ml')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_skills enable row level security;

-- Grants
grant all on table agent_skills to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own agent skills" on agent_skills;
create policy "Users can view their own agent skills" on agent_skills
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent skills" on agent_skills;
create policy "Users can insert their own agent skills" on agent_skills
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent skills" on agent_skills;
create policy "Users can delete their own agent skills" on agent_skills
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null unique,
  tasks_completed integer default 0,
  tasks_in_progress integer default 0,
  average_completion_time numeric default 0,
  on_time_delivery_rate numeric default 100,
  quality_score numeric default 80,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_performance enable row level security;

-- Grants
grant all on table agent_performance to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own agent performance" on agent_performance;
create policy "Users can view their own agent performance" on agent_performance
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent performance" on agent_performance;
create policy "Users can insert their own agent performance" on agent_performance
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent performance" on agent_performance;
create policy "Users can update their own agent performance" on agent_performance
  for update using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);

-- =====================
-- MIGRATION: Add sprint field to tickets table
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tickets' and column_name = 'sprint') then
    alter table tickets add column sprint text;
  end if;
end $$;

-- =====================
-- FUNCTION: Create default agent performance for new agents
-- =====================
create or replace function create_default_agent_performance()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into agent_performance (user_id, agent_id)
  values (new.user_id, new.id);
  return new;
exception
  when others then
    raise notice 'Error creating agent performance: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to create default performance when a new agent is created
drop trigger if exists on_agent_created on agents;
create trigger on_agent_created
  after insert on agents
  for each row
  execute function create_default_agent_performance();
