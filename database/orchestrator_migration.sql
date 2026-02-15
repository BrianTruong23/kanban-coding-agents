-- Task Orchestrator Migration
-- This migration adds all necessary tables and columns for the automated task breakdown
-- and agent orchestration features

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  hierarchy text not null default 'epic' check (hierarchy = 'epic'),
  acceptance_criteria jsonb default '[]'::jsonb, -- Array of criteria strings
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

-- Index for faster queries
create index if not exists epics_user_id_idx on epics(user_id);

-- Trigger for auto-update updated_at
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- EXTEND TASKS TABLE FOR ORCHESTRATOR
-- =====================
do $$
begin
  -- epic_id: Link tasks to epics
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references epics(id) on delete set null;
  end if;

  -- required_skills: Array of required skills for the task
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'required_skills') then
    alter table tasks add column required_skills text[] default '{}';
  end if;

  -- estimated_hours: Effort estimation in hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours integer;
  end if;

  -- hierarchy: ticket or subtask
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'hierarchy') then
    alter table tasks add column hierarchy text default 'ticket' check (hierarchy in ('ticket', 'subtask'));
  end if;

  -- parent_task_id: For subtasks linking to parent ticket
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;
end $$;

-- Create indexes for new columns
create index if not exists tasks_epic_id_idx on tasks(epic_id);
create index if not exists tasks_hierarchy_idx on tasks(hierarchy);
create index if not exists tasks_parent_task_id_idx on tasks(parent_task_id);

-- =====================
-- DEFINITION OF DONE TABLE
-- =====================
create table if not exists definition_of_done (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  completed boolean default false not null,
  verification_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table definition_of_done enable row level security;

-- Grants
grant all on table definition_of_done to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own dod items" on definition_of_done;
create policy "Users can view their own dod items" on definition_of_done
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dod items" on definition_of_done;
create policy "Users can insert their own dod items" on definition_of_done
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dod items" on definition_of_done;
create policy "Users can update their own dod items" on definition_of_done
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own dod items" on definition_of_done;
create policy "Users can delete their own dod items" on definition_of_done
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists dod_user_id_idx on definition_of_done(user_id);
create index if not exists dod_task_id_idx on definition_of_done(task_id);

-- Trigger
drop trigger if exists update_dod_updated_at on definition_of_done;
create trigger update_dod_updated_at
  before update on definition_of_done
  for each row
  execute function update_updated_at_column();

-- =====================
-- TEST NOTES TABLE
-- =====================
create table if not exists test_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  type text not null check (type in ('unit', 'integration', 'e2e', 'manual', 'performance', 'security')),
  description text not null,
  expected_outcome text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table test_notes enable row level security;

-- Grants
grant all on table test_notes to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own test notes" on test_notes;
create policy "Users can view their own test notes" on test_notes
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own test notes" on test_notes;
create policy "Users can insert their own test notes" on test_notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own test notes" on test_notes;
create policy "Users can update their own test notes" on test_notes
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own test notes" on test_notes;
create policy "Users can delete their own test notes" on test_notes
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists test_notes_user_id_idx on test_notes(user_id);
create index if not exists test_notes_task_id_idx on test_notes(task_id);
create index if not exists test_notes_type_idx on test_notes(type);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  level text not null check (level in ('low', 'medium', 'high', 'critical')),
  description text not null,
  mitigation text,
  impact text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
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
create index if not exists risk_flags_user_id_idx on risk_flags(user_id);
create index if not exists risk_flags_task_id_idx on risk_flags(task_id);
create index if not exists risk_flags_level_idx on risk_flags(level);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  depends_on uuid references tasks(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'blocked-by', 'relates-to')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
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
create index if not exists task_deps_user_id_idx on task_dependencies(user_id);
create index if not exists task_deps_task_id_idx on task_dependencies(task_id);
create index if not exists task_deps_depends_on_idx on task_dependencies(depends_on);
create index if not exists task_deps_type_idx on task_dependencies(dependency_type);

-- =====================
-- AGENT EXTENDED DATA TABLE
-- =====================
create table if not exists agent_extended_data (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Skills stored as JSONB
  skills jsonb default '[]'::jsonb,

  -- Specializations array
  specializations text[] default '{}',

  -- Performance metrics as JSONB
  performance_metrics jsonb default '{
    "tasksCompleted": 0,
    "tasksInProgress": 0,
    "averageCompletionTime": 0,
    "onTimeDeliveryRate": 100,
    "qualityScore": 75,
    "collaborationScore": 80,
    "lastUpdated": 0
  }'::jsonb,

  -- Availability as JSONB
  availability jsonb default '{
    "status": "available",
    "currentWorkload": 0,
    "maxCapacity": 5,
    "hoursPerWeek": 40
  }'::jsonb,

  -- Preferences as JSONB
  preferences jsonb default '{}'::jsonb,

  -- Assignment history as JSONB array
  assignment_history jsonb default '[]'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table agent_extended_data enable row level security;

-- Grants
grant all on table agent_extended_data to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own agent extended data" on agent_extended_data;
create policy "Users can view their own agent extended data" on agent_extended_data
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent extended data" on agent_extended_data;
create policy "Users can insert their own agent extended data" on agent_extended_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent extended data" on agent_extended_data;
create policy "Users can update their own agent extended data" on agent_extended_data
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent extended data" on agent_extended_data;
create policy "Users can delete their own agent extended data" on agent_extended_data
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_ext_agent_id_idx on agent_extended_data(agent_id);
create index if not exists agent_ext_user_id_idx on agent_extended_data(user_id);

-- Trigger
drop trigger if exists update_agent_ext_updated_at on agent_extended_data;
create trigger update_agent_ext_updated_at
  before update on agent_extended_data
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTION: Create default extended data for new agents
-- =====================
create or replace function create_default_agent_extended_data()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into agent_extended_data (agent_id, user_id)
  values (new.id, new.user_id);
  return new;
exception
  when others then
    raise notice 'Error creating agent extended data: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to create default extended data when a new agent is created
drop trigger if exists on_agent_created on agents;
create trigger on_agent_created
  after insert on agents
  for each row
  execute function create_default_agent_extended_data();
