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
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  proficiency integer check (proficiency >= 1 and proficiency <= 5) default 3,
  performance_score integer default 0, -- Track performance over time
  tasks_completed integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_skills enable row level security;

-- Grants
grant all on table agent_skills to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view skills for their agents" on agent_skills;
create policy "Users can view skills for their agents" on agent_skills
  for select using (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert skills for their agents" on agent_skills;
create policy "Users can insert skills for their agents" on agent_skills
  for insert with check (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update skills for their agents" on agent_skills;
create policy "Users can update skills for their agents" on agent_skills
  for update using (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete skills for their agents" on agent_skills;
create policy "Users can delete skills for their agents" on agent_skills
  for delete using (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

-- Index
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id text not null,
  title text not null,
  description text,
  status text not null default 'planning',
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
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

-- Index
create index if not exists epics_user_id_idx on epics(user_id);

-- Trigger for updated_at
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- MIGRATION: Add epic_id to tasks
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references epics(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'task_type') then
    alter table tasks add column task_type text not null default 'task';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'definition_of_done') then
    alter table tasks add column definition_of_done text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'test_notes') then
    alter table tasks add column test_notes text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_level') then
    alter table tasks add column risk_level text default 'low';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours integer;
  end if;
end $$;

-- Add constraint for task_type
alter table tasks drop constraint if exists tasks_task_type_check;
alter table tasks add constraint tasks_task_type_check check (task_type in ('epic', 'task', 'subtask'));

-- Add constraint for risk_level
alter table tasks drop constraint if exists tasks_risk_level_check;
alter table tasks add constraint tasks_risk_level_check check (risk_level in ('low', 'medium', 'high', 'critical'));

-- Index for epic_id
create index if not exists tasks_epic_id_idx on tasks(epic_id);
create index if not exists tasks_parent_task_id_idx on tasks(parent_task_id);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  depends_on_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null default 'blocks', -- blocks, related, parent-child
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint no_self_dependency check (task_id != depends_on_task_id)
);

-- Enable RLS
alter table task_dependencies enable row level security;

-- Grants
grant all on table task_dependencies to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view dependencies for their tasks" on task_dependencies;
create policy "Users can view dependencies for their tasks" on task_dependencies
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert dependencies for their tasks" on task_dependencies;
create policy "Users can insert dependencies for their tasks" on task_dependencies
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete dependencies for their tasks" on task_dependencies;
create policy "Users can delete dependencies for their tasks" on task_dependencies
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on_task_id);

-- Constraint for dependency_type
alter table task_dependencies drop constraint if exists task_dependencies_type_check;
alter table task_dependencies add constraint task_dependencies_type_check check (dependency_type in ('blocks', 'related', 'parent-child'));
