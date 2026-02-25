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
-- SPRINT COLUMN MIGRATION
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

-- Index on sprint for faster filtering
create index if not exists tasks_sprint_idx on tasks(sprint);

-- =====================
-- EXTENDED TASK FIELDS (DoD, Test Notes, Risk Flags)
-- =====================
do $$
begin
  -- definition_of_done
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'definition_of_done') then
    alter table tasks add column definition_of_done text[];
  end if;

  -- test_notes
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'test_notes') then
    alter table tasks add column test_notes text;
  end if;

  -- risk_level
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_level') then
    alter table tasks add column risk_level text check (risk_level in ('low', 'medium', 'high', 'critical'));
  end if;

  -- risk_notes
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_notes') then
    alter table tasks add column risk_notes text;
  end if;

  -- parent_epic_id
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_epic_id') then
    alter table tasks add column parent_epic_id uuid;
  end if;

  -- parent_task_id (for subtasks)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;

  -- task_type (epic, story, subtask)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'task_type') then
    alter table tasks add column task_type text default 'story' check (task_type in ('epic', 'story', 'subtask'));
  end if;

  -- estimated_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric;
  end if;

  -- actual_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_hours') then
    alter table tasks add column actual_hours numeric;
  end if;
end $$;

-- Indexes for faster queries
create index if not exists tasks_parent_epic_idx on tasks(parent_epic_id);
create index if not exists tasks_parent_task_idx on tasks(parent_task_id);
create index if not exists tasks_task_type_idx on tasks(task_type);

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id text not null, -- Display ID like "EPIC-1"
  title text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'in-progress', 'review', 'done', 'cancelled')),
  sprint text,
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  tags text[] default '{}',
  definition_of_done text[],
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_notes text,
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
create index if not exists epics_status_idx on epics(status);

-- Trigger for updated_at
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  depends_on_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null default 'blocks' check (dependency_type in ('blocks', 'blocked-by', 'related-to')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_task_dependency unique (task_id, depends_on_task_id)
);

-- Enable RLS
alter table task_dependencies enable row level security;

-- Grants
grant all on table task_dependencies to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own task dependencies" on task_dependencies;
create policy "Users can view their own task dependencies" on task_dependencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own task dependencies" on task_dependencies;
create policy "Users can insert their own task dependencies" on task_dependencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own task dependencies" on task_dependencies;
create policy "Users can update their own task dependencies" on task_dependencies
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own task dependencies" on task_dependencies;
create policy "Users can delete their own task dependencies" on task_dependencies
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on_task_id);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  skill_level integer not null check (skill_level >= 1 and skill_level <= 5) default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_agent_skill unique (agent_id, skill_name)
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

drop policy if exists "Users can update their own agent skills" on agent_skills;
create policy "Users can update their own agent skills" on agent_skills
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent skills" on agent_skills;
create policy "Users can delete their own agent skills" on agent_skills
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_skill_name_idx on agent_skills(skill_name);

-- Trigger for updated_at
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
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  completion_time_hours numeric,
  quality_score integer check (quality_score >= 1 and quality_score <= 5),
  on_time boolean,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_agent_task_performance unique (agent_id, task_id)
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

drop policy if exists "Users can delete their own agent performance" on agent_performance;
create policy "Users can delete their own agent performance" on agent_performance
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);
create index if not exists agent_performance_task_id_idx on agent_performance(task_id);

-- =====================
-- FUNCTION: Create default agent skills
-- =====================
create or replace function create_default_agent_skills()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_user_id uuid;
begin
  v_user_id := new.user_id;

  -- Alex Chen - Frontend specialist
  if new.name = 'Alex Chen' then
    insert into agent_skills (user_id, agent_id, skill_name, skill_level) values
      (v_user_id, new.id, 'React', 5),
      (v_user_id, new.id, 'Next.js', 5),
      (v_user_id, new.id, 'TypeScript', 4),
      (v_user_id, new.id, 'CSS', 5),
      (v_user_id, new.id, 'UI/UX Design', 4);
  end if;

  -- Sarah Johnson - Backend specialist
  if new.name = 'Sarah Johnson' then
    insert into agent_skills (user_id, agent_id, skill_name, skill_level) values
      (v_user_id, new.id, 'Node.js', 5),
      (v_user_id, new.id, 'PostgreSQL', 5),
      (v_user_id, new.id, 'API Design', 5),
      (v_user_id, new.id, 'Database Design', 4),
      (v_user_id, new.id, 'TypeScript', 4);
  end if;

  -- Mike Rodriguez - Full-stack
  if new.name = 'Mike Rodriguez' then
    insert into agent_skills (user_id, agent_id, skill_name, skill_level) values
      (v_user_id, new.id, 'React', 4),
      (v_user_id, new.id, 'Node.js', 4),
      (v_user_id, new.id, 'TypeScript', 4),
      (v_user_id, new.id, 'Database Design', 3),
      (v_user_id, new.id, 'API Design', 4);
  end if;

  -- Emma Wilson - DevOps
  if new.name = 'Emma Wilson' then
    insert into agent_skills (user_id, agent_id, skill_name, skill_level) values
      (v_user_id, new.id, 'Docker', 5),
      (v_user_id, new.id, 'CI/CD', 5),
      (v_user_id, new.id, 'AWS', 4),
      (v_user_id, new.id, 'Kubernetes', 4),
      (v_user_id, new.id, 'Monitoring', 4);
  end if;

  -- David Kim - Mobile
  if new.name = 'David Kim' then
    insert into agent_skills (user_id, agent_id, skill_name, skill_level) values
      (v_user_id, new.id, 'React Native', 5),
      (v_user_id, new.id, 'iOS Development', 4),
      (v_user_id, new.id, 'Android Development', 4),
      (v_user_id, new.id, 'TypeScript', 4),
      (v_user_id, new.id, 'Mobile UI/UX', 5);
  end if;

  return new;
exception
  when others then
    raise notice 'Error creating agent skills: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to create default agent skills
drop trigger if exists on_agent_created on agents;
create trigger on_agent_created
  after insert on agents
  for each row
  execute function create_default_agent_skills();
