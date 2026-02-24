-- Kanban Board Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- =====================
-- AGENTS TABLE
-- =====================
create table if not exists agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  avatar text,
  avatar_color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================
-- MIGRATION: Fix missing columns (AGENTS)
-- =====================
do $$
begin
  -- description
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'description') then
    alter table agents add column description text;
  end if;

  -- avatar
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'avatar') then
    alter table agents add column avatar text;
  end if;

  -- avatar_color
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'avatar_color') then
    alter table agents add column avatar_color text;
  end if;
end $$;

-- Enable Row Level Security (RLS)
alter table agents enable row level security;

-- Grants for agents table (Important for trigger access)
grant all on table agents to postgres, service_role;

-- RLS Policies for agents
drop policy if exists "Users can view their own agents" on agents;
create policy "Users can view their own agents" on agents
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agents" on agents;
create policy "Users can insert their own agents" on agents
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agents" on agents;
create policy "Users can update their own agents" on agents
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agents" on agents;
create policy "Users can delete their own agents" on agents
  for delete using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists agents_user_id_idx on agents(user_id);

-- =====================
-- TASKS TABLE
-- =====================
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id text not null, -- Display ID like "TASK-1"
  title text not null,
  description text,
  status text not null default 'backlog',
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  tags text[] default '{}',
  comments_count integer default 0,
  attachments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================
-- MIGRATION: Fix missing columns & Constraints (TASKS)
-- =====================
do $$
begin
  -- task_id (Display ID)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'task_id') then
    alter table tasks add column task_id text not null default 'TASK-' || floor(random() * 10000)::text;
  end if;

  -- assigned_agent_id
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'assigned_agent_id') then
    alter table tasks add column assigned_agent_id uuid references agents(id) on delete set null;
  end if;

  -- priority
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'priority') then
    alter table tasks add column priority integer not null check (priority >= 1 and priority <= 5) default 3;
  end if;

  -- comments_count
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'comments_count') then
    alter table tasks add column comments_count integer default 0;
  end if;

  -- attachments_count
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'attachments_count') then
    alter table tasks add column attachments_count integer default 0;
  end if;

  -- tags
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'tags') then
    alter table tasks add column tags text[] default '{}';
  end if;
end $$;

-- Fix Status Constraint (Idempotent)
alter table tasks drop constraint if exists tasks_status_check;
alter table tasks add constraint tasks_status_check check (status in ('backlog', 'in-progress', 'review', 'done'));

-- Enable Row Level Security (RLS)
alter table tasks enable row level security;

-- Grants for tasks table
grant all on table tasks to postgres, service_role;

-- RLS Policies for tasks
drop policy if exists "Users can view their own tasks" on tasks;
create policy "Users can view their own tasks" on tasks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on tasks;
create policy "Users can insert their own tasks" on tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on tasks;
create policy "Users can update their own tasks" on tasks
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on tasks;
create policy "Users can delete their own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_status_idx on tasks(status);
create index if not exists tasks_assigned_agent_idx on tasks(assigned_agent_id);

-- =====================
-- FUNCTION: Auto-update updated_at
-- =====================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for tasks
drop trigger if exists update_tasks_updated_at on tasks;
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTION: Create default agents for new users
-- =====================
-- Updated to be robust: SET search_path, explicit columns, exception handling
create or replace function create_default_agents()
returns trigger 
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into agents (user_id, name, description, avatar_color) values
    (new.id, 'Alex Chen', 'Specializes in React, Next.js, and UI development', 'bg-blue-500'),
    (new.id, 'Sarah Johnson', 'Handles API, database, and server-side logic', 'bg-green-500'),
    (new.id, 'Mike Rodriguez', 'Works on both frontend and backend tasks', 'bg-purple-500'),
    (new.id, 'Emma Wilson', 'DevOps and infrastructure specialist', 'bg-orange-500'),
    (new.id, 'David Kim', 'Mobile app development expert', 'bg-pink-500');
  return new;
exception
  when others then
    -- Log error if possible, or just fail safely?
    -- For now, we want it to fail so we know, but if we want to allow login, we could just return new;
    -- Reraisng the error is better for debugging.
    raise notice 'Error creating agents: %', SQLERRM;
    return new; -- Allow user creation even if agents fail!
end;
$$;

-- Trigger to create default agents when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_default_agents();

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  proficiency_level integer not null check (proficiency_level >= 1 and proficiency_level <= 5) default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_skills enable row level security;

-- Grants
grant all on table agent_skills to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their agents' skills" on agent_skills;
create policy "Users can view their agents' skills" on agent_skills
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert skills for their agents" on agent_skills;
create policy "Users can insert skills for their agents" on agent_skills
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update skills for their agents" on agent_skills;
create policy "Users can update skills for their agents" on agent_skills
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete skills for their agents" on agent_skills;
create policy "Users can delete skills for their agents" on agent_skills
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_user_id_idx on agent_skills(user_id);

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  tasks_completed integer default 0,
  tasks_on_time integer default 0,
  tasks_late integer default 0,
  average_completion_time numeric default 0, -- in hours
  quality_score numeric default 100 check (quality_score >= 0 and quality_score <= 100),
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(agent_id)
);

-- Enable RLS
alter table agent_performance enable row level security;

-- Grants
grant all on table agent_performance to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their agents' performance" on agent_performance;
create policy "Users can view their agents' performance" on agent_performance
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert performance for their agents" on agent_performance;
create policy "Users can insert performance for their agents" on agent_performance
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update performance for their agents" on agent_performance;
create policy "Users can update performance for their agents" on agent_performance
  for update using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);
create index if not exists agent_performance_user_id_idx on agent_performance(user_id);

-- =====================
-- MIGRATION: Add task hierarchy fields
-- =====================
do $$
begin
  -- task_type
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'task_type') then
    alter table tasks add column task_type text not null default 'task' check (task_type in ('epic', 'task', 'subtask'));
  end if;

  -- parent_task_id
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;

  -- epic_id
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references tasks(id) on delete cascade;
  end if;

  -- estimated_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric;
  end if;

  -- actual_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_hours') then
    alter table tasks add column actual_hours numeric;
  end if;

  -- sprint (already exists based on memory, but ensuring it's here for completeness)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

-- Additional indexes for hierarchy
create index if not exists tasks_parent_task_id_idx on tasks(parent_task_id);
create index if not exists tasks_epic_id_idx on tasks(epic_id);
create index if not exists tasks_task_type_idx on tasks(task_type);
create index if not exists tasks_sprint_idx on tasks(sprint);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  dependent_task_id uuid references tasks(id) on delete cascade not null,
  depends_on_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null default 'blocks' check (dependency_type in ('blocks', 'related', 'prerequisite')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table task_dependencies enable row level security;

-- Grants
grant all on table task_dependencies to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their task dependencies" on task_dependencies;
create policy "Users can view their task dependencies" on task_dependencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their task dependencies" on task_dependencies;
create policy "Users can insert their task dependencies" on task_dependencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their task dependencies" on task_dependencies;
create policy "Users can delete their task dependencies" on task_dependencies
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists task_dependencies_dependent_idx on task_dependencies(dependent_task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on_task_id);
create index if not exists task_dependencies_user_id_idx on task_dependencies(user_id);

-- =====================
-- DEFINITION OF DONE TABLE
-- =====================
create table if not exists definition_of_done (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  completed boolean default false,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table definition_of_done enable row level security;

-- Grants
grant all on table definition_of_done to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their DoD items" on definition_of_done;
create policy "Users can view their DoD items" on definition_of_done
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their DoD items" on definition_of_done;
create policy "Users can insert their DoD items" on definition_of_done
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their DoD items" on definition_of_done;
create policy "Users can update their DoD items" on definition_of_done
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their DoD items" on definition_of_done;
create policy "Users can delete their DoD items" on definition_of_done
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists definition_of_done_task_id_idx on definition_of_done(task_id);
create index if not exists definition_of_done_user_id_idx on definition_of_done(user_id);

-- =====================
-- TEST NOTES TABLE
-- =====================
create table if not exists test_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  test_type text not null default 'manual' check (test_type in ('unit', 'integration', 'e2e', 'manual')),
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table test_notes enable row level security;

-- Grants
grant all on table test_notes to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their test notes" on test_notes;
create policy "Users can view their test notes" on test_notes
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their test notes" on test_notes;
create policy "Users can insert their test notes" on test_notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their test notes" on test_notes;
create policy "Users can update their test notes" on test_notes
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their test notes" on test_notes;
create policy "Users can delete their test notes" on test_notes
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists test_notes_task_id_idx on test_notes(task_id);
create index if not exists test_notes_user_id_idx on test_notes(user_id);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  description text not null,
  mitigation text,
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table risk_flags enable row level security;

-- Grants
grant all on table risk_flags to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their risk flags" on risk_flags;
create policy "Users can view their risk flags" on risk_flags
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their risk flags" on risk_flags;
create policy "Users can insert their risk flags" on risk_flags
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their risk flags" on risk_flags;
create policy "Users can update their risk flags" on risk_flags
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their risk flags" on risk_flags;
create policy "Users can delete their risk flags" on risk_flags
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists risk_flags_task_id_idx on risk_flags(task_id);
create index if not exists risk_flags_user_id_idx on risk_flags(user_id);
create index if not exists risk_flags_resolved_idx on risk_flags(resolved);

-- Trigger for risk_flags
drop trigger if exists update_risk_flags_updated_at on risk_flags;
create trigger update_risk_flags_updated_at
  before update on risk_flags
  for each row
  execute function update_updated_at_column();
