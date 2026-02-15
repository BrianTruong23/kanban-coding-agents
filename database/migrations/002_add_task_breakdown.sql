-- Task Breakdown and Agent Orchestration Schema
-- Migration 002: Add epics, tickets, subtasks, dependencies, and agent skills

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  objectives text[] default '{}',
  acceptance_criteria text[] default '{}',
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')) default 'medium',
  risk_notes text,
  estimated_effort integer not null default 0, -- in hours
  status text not null check (status in ('planning', 'in-progress', 'review', 'done')) default 'planning',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table epics enable row level security;

-- Grants for epics table
grant all on table epics to postgres, service_role;

-- RLS Policies for epics
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

-- Indexes for faster queries
create index if not exists epics_user_id_idx on epics(user_id);
create index if not exists epics_status_idx on epics(status);

-- Trigger for epics
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
  epic_id uuid references epics(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticket_id text not null,
  title text not null,
  description text not null,
  definition_of_done text[] default '{}',
  test_notes text[] default '{}',
  technical_notes text,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')) default 'medium',
  risk_flags text[] default '{}',
  assigned_agent_id uuid references agents(id) on delete set null,
  estimated_effort integer not null default 0, -- in hours
  actual_effort integer,
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  required_skills text[] default '{}',
  status text not null check (status in ('backlog', 'in-progress', 'review', 'done')) default 'backlog',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table tickets enable row level security;

-- Grants for tickets table
grant all on table tickets to postgres, service_role;

-- RLS Policies for tickets
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

-- Indexes for faster queries
create index if not exists tickets_user_id_idx on tickets(user_id);
create index if not exists tickets_epic_id_idx on tickets(epic_id);
create index if not exists tickets_status_idx on tickets(status);
create index if not exists tickets_assigned_agent_idx on tickets(assigned_agent_id);

-- Trigger for tickets
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
  ticket_id uuid references tickets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  assigned_agent_id uuid references agents(id) on delete set null,
  estimated_effort integer not null default 0, -- in hours
  actual_effort integer,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table subtasks enable row level security;

-- Grants for subtasks table
grant all on table subtasks to postgres, service_role;

-- RLS Policies for subtasks
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

-- Indexes for faster queries
create index if not exists subtasks_user_id_idx on subtasks(user_id);
create index if not exists subtasks_ticket_id_idx on subtasks(ticket_id);
create index if not exists subtasks_assigned_agent_idx on subtasks(assigned_agent_id);

-- Trigger for subtasks
drop trigger if exists update_subtasks_updated_at on subtasks;
create trigger update_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_id uuid not null,
  source_type text not null check (source_type in ('epic', 'ticket', 'subtask')),
  target_id uuid not null,
  target_type text not null check (target_type in ('epic', 'ticket', 'subtask')),
  dependency_type text not null check (dependency_type in ('blocks', 'blocked-by', 'relates-to')) default 'relates-to',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table task_dependencies enable row level security;

-- Grants for task_dependencies table
grant all on table task_dependencies to postgres, service_role;

-- RLS Policies for task_dependencies
drop policy if exists "Users can view their own dependencies" on task_dependencies;
create policy "Users can view their own dependencies" on task_dependencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dependencies" on task_dependencies;
create policy "Users can insert their own dependencies" on task_dependencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dependencies" on task_dependencies;
create policy "Users can update their own dependencies" on task_dependencies
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own dependencies" on task_dependencies;
create policy "Users can delete their own dependencies" on task_dependencies
  for delete using (auth.uid() = user_id);

-- Indexes for faster queries
create index if not exists task_dependencies_user_id_idx on task_dependencies(user_id);
create index if not exists task_dependencies_source_idx on task_dependencies(source_id, source_type);
create index if not exists task_dependencies_target_idx on task_dependencies(target_id, target_type);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  skill_category text not null check (skill_category in ('frontend', 'backend', 'database', 'devops', 'mobile', 'testing', 'design', 'ai-ml')),
  proficiency_level integer not null check (proficiency_level >= 1 and proficiency_level <= 5) default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(agent_id, skill_category)
);

-- Enable Row Level Security (RLS)
alter table agent_skills enable row level security;

-- Grants for agent_skills table
grant all on table agent_skills to postgres, service_role;

-- RLS Policies for agent_skills
drop policy if exists "Users can view their own agent skills" on agent_skills;
create policy "Users can view their own agent skills" on agent_skills
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent skills" on agent_skills;
create policy "Users can insert their own agent skills" on agent_skills
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent skills" on agent_skills;
create policy "Users can update their own agent skills" on agent_skills
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent skills" on agent_skills;
create policy "Users can delete their own agent skills" on agent_skills
  for delete using (auth.uid() = user_id);

-- Indexes for faster queries
create index if not exists agent_skills_user_id_idx on agent_skills(user_id);
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_category_idx on agent_skills(skill_category);

-- Trigger for agent_skills
drop trigger if exists update_agent_skills_updated_at on agent_skills;
create trigger update_agent_skills_updated_at
  before update on agent_skills
  for each row
  execute function update_updated_at_column();

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  tasks_completed integer default 0,
  average_completion_time numeric(10,2) default 0, -- in hours
  quality_score integer default 100 check (quality_score >= 0 and quality_score <= 100),
  on_time_delivery numeric(5,2) default 100 check (on_time_delivery >= 0 and on_time_delivery <= 100),
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table agent_performance enable row level security;

-- Grants for agent_performance table
grant all on table agent_performance to postgres, service_role;

-- RLS Policies for agent_performance
drop policy if exists "Users can view their own agent performance" on agent_performance;
create policy "Users can view their own agent performance" on agent_performance
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent performance" on agent_performance;
create policy "Users can insert their own agent performance" on agent_performance
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent performance" on agent_performance;
create policy "Users can update their own agent performance" on agent_performance
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent performance" on agent_performance;
create policy "Users can delete their own agent performance" on agent_performance
  for delete using (auth.uid() = user_id);

-- Indexes for faster queries
create index if not exists agent_performance_user_id_idx on agent_performance(user_id);
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);

-- =====================
-- FUNCTION: Initialize default agent skills
-- =====================
create or replace function init_default_agent_skills()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Initialize performance record
  insert into agent_performance (agent_id, user_id, tasks_completed, quality_score, on_time_delivery)
  values (new.id, new.user_id, 0, 100, 100);

  -- Set default skills based on agent description
  -- This is a simple rule-based approach, could be enhanced with AI
  if new.description ilike '%frontend%' or new.description ilike '%ui%' or new.description ilike '%react%' then
    insert into agent_skills (agent_id, user_id, skill_category, proficiency_level)
    values (new.id, new.user_id, 'frontend', 5);
  end if;

  if new.description ilike '%backend%' or new.description ilike '%api%' or new.description ilike '%server%' then
    insert into agent_skills (agent_id, user_id, skill_category, proficiency_level)
    values (new.id, new.user_id, 'backend', 5);
  end if;

  if new.description ilike '%database%' then
    insert into agent_skills (agent_id, user_id, skill_category, proficiency_level)
    values (new.id, new.user_id, 'database', 5);
  end if;

  if new.description ilike '%devops%' or new.description ilike '%infrastructure%' then
    insert into agent_skills (agent_id, user_id, skill_category, proficiency_level)
    values (new.id, new.user_id, 'devops', 5);
  end if;

  if new.description ilike '%mobile%' then
    insert into agent_skills (agent_id, user_id, skill_category, proficiency_level)
    values (new.id, new.user_id, 'mobile', 5);
  end if;

  return new;
exception
  when others then
    raise notice 'Error creating agent skills: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to initialize skills when a new agent is created
drop trigger if exists on_agent_created on agents;
create trigger on_agent_created
  after insert on agents
  for each row
  execute function init_default_agent_skills();
