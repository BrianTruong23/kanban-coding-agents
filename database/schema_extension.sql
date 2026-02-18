-- =====================================================
-- SCHEMA EXTENSION FOR ISSUE #8
-- Automated Task Breakdown and Agent Orchestration
-- =====================================================

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
create index if not exists agent_skills_user_id_idx on agent_skills(user_id);

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  tasks_completed integer default 0,
  tasks_in_progress integer default 0,
  average_completion_time numeric default 0,
  on_time_delivery_rate numeric default 100,
  quality_score numeric default 100,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_performance enable row level security;

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
create index if not exists agent_performance_user_id_idx on agent_performance(user_id);

-- =====================
-- EXTEND AGENTS TABLE
-- =====================
do $$
begin
  -- availability
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'availability') then
    alter table agents add column availability text default 'available' check (availability in ('available', 'busy', 'offline'));
  end if;

  -- max_concurrent_tasks
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'max_concurrent_tasks') then
    alter table agents add column max_concurrent_tasks integer default 3;
  end if;

  -- preferred_task_types (array of strings)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'preferred_task_types') then
    alter table agents add column preferred_task_types text[] default '{}';
  end if;
end $$;

-- =====================
-- EXTEND TASKS TABLE
-- =====================
do $$
begin
  -- type (epic, story, task, subtask, bug)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'type') then
    alter table tasks add column type text default 'task' check (type in ('epic', 'story', 'task', 'subtask', 'bug'));
  end if;

  -- parent_task_id (for hierarchical tasks)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;

  -- epic_id (link to parent epic)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references tasks(id) on delete set null;
  end if;

  -- estimated_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric;
  end if;

  -- actual_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_hours') then
    alter table tasks add column actual_hours numeric;
  end if;

  -- story_points
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'story_points') then
    alter table tasks add column story_points integer;
  end if;

  -- sprint (already exists, but ensure it's there)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

-- Indexes
create index if not exists tasks_parent_task_id_idx on tasks(parent_task_id);
create index if not exists tasks_epic_id_idx on tasks(epic_id);
create index if not exists tasks_type_idx on tasks(type);

-- =====================
-- DEFINITION OF DONE TABLE
-- =====================
create table if not exists definition_of_done (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table definition_of_done enable row level security;

-- RLS Policies
drop policy if exists "Users can view their own DoD items" on definition_of_done;
create policy "Users can view their own DoD items" on definition_of_done
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own DoD items" on definition_of_done;
create policy "Users can insert their own DoD items" on definition_of_done
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own DoD items" on definition_of_done;
create policy "Users can update their own DoD items" on definition_of_done
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own DoD items" on definition_of_done;
create policy "Users can delete their own DoD items" on definition_of_done
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists dod_task_id_idx on definition_of_done(task_id);
create index if not exists dod_user_id_idx on definition_of_done(user_id);

-- =====================
-- TEST NOTES TABLE
-- =====================
create table if not exists test_notes (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  test_type text not null check (test_type in ('unit', 'integration', 'e2e', 'manual')),
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table test_notes enable row level security;

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
create index if not exists test_notes_task_id_idx on test_notes(task_id);
create index if not exists test_notes_user_id_idx on test_notes(user_id);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  level text not null check (level in ('low', 'medium', 'high', 'critical')),
  mitigation_strategy text,
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
create index if not exists risk_flags_task_id_idx on risk_flags(task_id);
create index if not exists risk_flags_user_id_idx on risk_flags(user_id);
create index if not exists risk_flags_level_idx on risk_flags(level);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  dependent_task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'blocked-by', 'relates-to')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, dependent_task_id, dependency_type)
);

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
create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_dependent_task_id_idx on task_dependencies(dependent_task_id);
create index if not exists task_dependencies_user_id_idx on task_dependencies(user_id);

-- =====================
-- FUNCTIONS AND TRIGGERS
-- =====================

-- Function to update agent performance when task status changes
create or replace function update_agent_performance()
returns trigger as $$
declare
  v_agent_id uuid;
  v_user_id uuid;
begin
  -- Get agent_id and user_id
  if TG_OP = 'UPDATE' then
    v_agent_id := new.assigned_agent_id;
    v_user_id := new.user_id;
  elsif TG_OP = 'DELETE' then
    v_agent_id := old.assigned_agent_id;
    v_user_id := old.user_id;
  end if;

  -- Update performance if agent is assigned
  if v_agent_id is not null then
    insert into agent_performance (agent_id, user_id, tasks_completed, tasks_in_progress, last_updated)
    values (
      v_agent_id,
      v_user_id,
      (select count(*) from tasks where assigned_agent_id = v_agent_id and status = 'done'),
      (select count(*) from tasks where assigned_agent_id = v_agent_id and status = 'in-progress'),
      timezone('utc'::text, now())
    )
    on conflict (agent_id) do update set
      tasks_completed = (select count(*) from tasks where assigned_agent_id = v_agent_id and status = 'done'),
      tasks_in_progress = (select count(*) from tasks where assigned_agent_id = v_agent_id and status = 'in-progress'),
      last_updated = timezone('utc'::text, now());
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to update agent performance
drop trigger if exists update_agent_performance_trigger on tasks;
create trigger update_agent_performance_trigger
  after update of status, assigned_agent_id on tasks
  for each row
  execute function update_agent_performance();

-- =====================
-- SAMPLE DATA UPDATES
-- =====================
-- Update existing default agents with new fields
do $$
begin
  -- This will run without error if agents don't exist yet
  update agents set
    availability = 'available',
    max_concurrent_tasks = 3,
    preferred_task_types = array['task', 'story']
  where availability is null;
exception
  when others then
    null; -- Ignore errors if table doesn't exist yet
end $$;
