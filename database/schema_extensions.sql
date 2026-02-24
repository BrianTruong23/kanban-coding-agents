-- Kanban Board Schema Extensions for Task Breakdown and Agent Orchestration
-- Run this SQL in your Supabase SQL Editor after the main schema.sql

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id text not null, -- Display ID like "EPIC-1"
  title text not null,
  description text,
  status text not null default 'planning',
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  tags text[] default '{}',
  sprint text,
  target_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Status constraint for epics
alter table epics drop constraint if exists epics_status_check;
alter table epics add constraint epics_status_check
  check (status in ('planning', 'in-progress', 'completed', 'cancelled'));

-- Enable RLS
alter table epics enable row level security;

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

-- Indexes
create index if not exists epics_user_id_idx on epics(user_id);
create index if not exists epics_status_idx on epics(status);

-- Trigger for auto-update updated_at
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
end $$;

create index if not exists tasks_epic_id_idx on tasks(epic_id);

-- =====================
-- SUBTASKS TABLE
-- =====================
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'todo',
  assigned_agent_id uuid references agents(id) on delete set null,
  definition_of_done text[] default '{}',
  test_notes text[] default '{}',
  estimated_hours numeric,
  actual_hours numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Status constraint for subtasks
alter table subtasks drop constraint if exists subtasks_status_check;
alter table subtasks add constraint subtasks_status_check
  check (status in ('todo', 'in-progress', 'done'));

-- Enable RLS
alter table subtasks enable row level security;

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

-- Indexes
create index if not exists subtasks_user_id_idx on subtasks(user_id);
create index if not exists subtasks_parent_task_id_idx on subtasks(parent_task_id);
create index if not exists subtasks_assigned_agent_idx on subtasks(assigned_agent_id);

-- Trigger
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
  subtask_id uuid references subtasks(id) on delete cascade not null,
  severity text not null,
  category text not null,
  description text not null,
  mitigation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Constraints
alter table risk_flags drop constraint if exists risk_flags_severity_check;
alter table risk_flags add constraint risk_flags_severity_check
  check (severity in ('low', 'medium', 'high', 'critical'));

alter table risk_flags drop constraint if exists risk_flags_category_check;
alter table risk_flags add constraint risk_flags_category_check
  check (category in ('technical', 'dependency', 'resource', 'timeline', 'security'));

-- Enable RLS
alter table risk_flags enable row level security;

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
create index if not exists risk_flags_subtask_id_idx on risk_flags(subtask_id);
create index if not exists risk_flags_severity_idx on risk_flags(severity);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_task_id uuid references tasks(id) on delete cascade not null,
  target_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Constraints
alter table task_dependencies drop constraint if exists task_dependencies_type_check;
alter table task_dependencies add constraint task_dependencies_type_check
  check (dependency_type in ('blocks', 'requires', 'related'));

-- Prevent self-dependencies
alter table task_dependencies drop constraint if exists task_dependencies_no_self_dep;
alter table task_dependencies add constraint task_dependencies_no_self_dep
  check (source_task_id != target_task_id);

-- Enable RLS
alter table task_dependencies enable row level security;

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
create index if not exists task_dependencies_source_idx on task_dependencies(source_task_id);
create index if not exists task_dependencies_target_idx on task_dependencies(target_task_id);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  skill_level integer not null check (skill_level >= 1 and skill_level <= 5),
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Constraints
alter table agent_skills drop constraint if exists agent_skills_category_check;
alter table agent_skills add constraint agent_skills_category_check
  check (category in ('frontend', 'backend', 'database', 'devops', 'mobile', 'testing', 'design', 'other'));

-- Enable RLS
alter table agent_skills enable row level security;

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
create index if not exists agent_skills_category_idx on agent_skills(category);

-- =====================
-- MIGRATION: Add agent metadata columns
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'availability') then
    alter table agents add column availability text default 'available';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'max_concurrent_tasks') then
    alter table agents add column max_concurrent_tasks integer default 3;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'tasks_completed') then
    alter table agents add column tasks_completed integer default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'tasks_in_progress') then
    alter table agents add column tasks_in_progress integer default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'avg_completion_time') then
    alter table agents add column avg_completion_time numeric default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'success_rate') then
    alter table agents add column success_rate numeric default 1.0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'last_active_date') then
    alter table agents add column last_active_date timestamp with time zone;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'specializations') then
    alter table agents add column specializations text[] default '{}';
  end if;
end $$;

-- Availability constraint
alter table agents drop constraint if exists agents_availability_check;
alter table agents add constraint agents_availability_check
  check (availability in ('available', 'busy', 'offline'));

-- =====================
-- MIGRATION: Add sprint column to tasks (from previous feature)
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

create index if not exists tasks_sprint_idx on tasks(sprint);
