-- Enhanced Schema for Task Breakdown and Agent Orchestration
-- This extends the existing schema with new tables and columns

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('frontend', 'backend', 'database', 'devops', 'testing', 'mobile', 'design', 'architecture')),
  proficiency_level integer not null check (proficiency_level >= 1 and proficiency_level <= 5),
  years_of_experience integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_skills enable row level security;

-- RLS Policies
create policy "Users can view skills for their agents" on agent_skills
  for select using (
    exists (select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can insert skills for their agents" on agent_skills
  for insert with check (
    exists (select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can update skills for their agents" on agent_skills
  for update using (
    exists (select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can delete skills for their agents" on agent_skills
  for delete using (
    exists (select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid())
  );

-- Indexes
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_category_idx on agent_skills(category);

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  agent_id uuid references agents(id) on delete cascade primary key,
  tasks_completed integer default 0,
  tasks_in_progress integer default 0,
  average_completion_time numeric default 0, -- in hours
  on_time_delivery_rate numeric default 0 check (on_time_delivery_rate >= 0 and on_time_delivery_rate <= 1),
  code_quality_score numeric default 0 check (code_quality_score >= 0 and code_quality_score <= 100),
  bug_rate numeric default 0, -- bugs per 100 tasks
  collaboration_score numeric default 0 check (collaboration_score >= 0 and collaboration_score <= 100),
  last_active timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_performance enable row level security;

-- RLS Policies
create policy "Users can view performance for their agents" on agent_performance
  for select using (
    exists (select 1 from agents where agents.id = agent_performance.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can insert performance for their agents" on agent_performance
  for insert with check (
    exists (select 1 from agents where agents.id = agent_performance.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can update performance for their agents" on agent_performance
  for update using (
    exists (select 1 from agents where agents.id = agent_performance.agent_id and agents.user_id = auth.uid())
  );

-- Index
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);

-- =====================
-- AGENT AVAILABILITY TABLE
-- =====================
create table if not exists agent_availability (
  agent_id uuid references agents(id) on delete cascade primary key,
  status text not null default 'available' check (status in ('available', 'busy', 'offline')),
  current_load integer default 0,
  max_load integer default 5,
  available_from timestamp with time zone,
  working_hours_start integer check (working_hours_start >= 0 and working_hours_start <= 23),
  working_hours_end integer check (working_hours_end >= 0 and working_hours_end <= 23),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_availability enable row level security;

-- RLS Policies
create policy "Users can view availability for their agents" on agent_availability
  for select using (
    exists (select 1 from agents where agents.id = agent_availability.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can insert availability for their agents" on agent_availability
  for insert with check (
    exists (select 1 from agents where agents.id = agent_availability.agent_id and agents.user_id = auth.uid())
  );

create policy "Users can update availability for their agents" on agent_availability
  for update using (
    exists (select 1 from agents where agents.id = agent_availability.agent_id and agents.user_id = auth.uid())
  );

-- Index
create index if not exists agent_availability_agent_id_idx on agent_availability(agent_id);
create index if not exists agent_availability_status_idx on agent_availability(status);

-- =====================
-- MIGRATION: Add new columns to tasks table
-- =====================
do $$
begin
  -- type (epic, ticket, subtask)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'type') then
    alter table tasks add column type text not null default 'ticket' check (type in ('epic', 'ticket', 'subtask'));
  end if;

  -- parent_id (for hierarchical tasks)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_id') then
    alter table tasks add column parent_id uuid references tasks(id) on delete cascade;
  end if;

  -- estimated_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric;
  end if;

  -- actual_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_hours') then
    alter table tasks add column actual_hours numeric;
  end if;

  -- completed_at
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'completed_at') then
    alter table tasks add column completed_at timestamp with time zone;
  end if;

  -- sprint column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

-- Index for parent-child relationships
create index if not exists tasks_parent_id_idx on tasks(parent_id);
create index if not exists tasks_type_idx on tasks(type);

-- =====================
-- DEFINITION OF DONE TABLE
-- =====================
create table if not exists definition_of_done (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  completed boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table definition_of_done enable row level security;

-- RLS Policies
create policy "Users can view DoD for their tasks" on definition_of_done
  for select using (
    exists (select 1 from tasks where tasks.id = definition_of_done.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can insert DoD for their tasks" on definition_of_done
  for insert with check (
    exists (select 1 from tasks where tasks.id = definition_of_done.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can update DoD for their tasks" on definition_of_done
  for update using (
    exists (select 1 from tasks where tasks.id = definition_of_done.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can delete DoD for their tasks" on definition_of_done
  for delete using (
    exists (select 1 from tasks where tasks.id = definition_of_done.task_id and tasks.user_id = auth.uid())
  );

-- Index
create index if not exists definition_of_done_task_id_idx on definition_of_done(task_id);

-- =====================
-- TEST NOTES TABLE
-- =====================
create table if not exists test_notes (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  test_type text not null check (test_type in ('unit', 'integration', 'e2e', 'manual')),
  priority integer not null check (priority >= 1 and priority <= 3) default 2,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table test_notes enable row level security;

-- RLS Policies
create policy "Users can view test notes for their tasks" on test_notes
  for select using (
    exists (select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can insert test notes for their tasks" on test_notes
  for insert with check (
    exists (select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can update test notes for their tasks" on test_notes
  for update using (
    exists (select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can delete test notes for their tasks" on test_notes
  for delete using (
    exists (select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid())
  );

-- Index
create index if not exists test_notes_task_id_idx on test_notes(task_id);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  level text not null check (level in ('low', 'medium', 'high', 'critical')),
  mitigation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table risk_flags enable row level security;

-- RLS Policies
create policy "Users can view risk flags for their tasks" on risk_flags
  for select using (
    exists (select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can insert risk flags for their tasks" on risk_flags
  for insert with check (
    exists (select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can update risk flags for their tasks" on risk_flags
  for update using (
    exists (select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can delete risk flags for their tasks" on risk_flags
  for delete using (
    exists (select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid())
  );

-- Index
create index if not exists risk_flags_task_id_idx on risk_flags(task_id);
create index if not exists risk_flags_level_idx on risk_flags(level);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  depends_on uuid references tasks(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'relates-to', 'duplicates')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, depends_on)
);

-- Enable RLS
alter table task_dependencies enable row level security;

-- RLS Policies
create policy "Users can view dependencies for their tasks" on task_dependencies
  for select using (
    exists (select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can insert dependencies for their tasks" on task_dependencies
  for insert with check (
    exists (select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can update dependencies for their tasks" on task_dependencies
  for update using (
    exists (select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid())
  );

create policy "Users can delete dependencies for their tasks" on task_dependencies
  for delete using (
    exists (select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid())
  );

-- Indexes
create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on);

-- =====================
-- FUNCTION: Initialize agent performance when agent is created
-- =====================
create or replace function initialize_agent_stats()
returns trigger
language plpgsql
as $$
begin
  insert into agent_performance (agent_id)
  values (new.id);

  insert into agent_availability (agent_id)
  values (new.id);

  return new;
end;
$$;

-- Trigger to initialize stats
drop trigger if exists init_agent_stats on agents;
create trigger init_agent_stats
  after insert on agents
  for each row
  execute function initialize_agent_stats();

-- =====================
-- FUNCTION: Update task completed_at when status changes to done
-- =====================
create or replace function update_task_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and old.status != 'done' then
    new.completed_at = timezone('utc'::text, now());
  elsif new.status != 'done' then
    new.completed_at = null;
  end if;

  return new;
end;
$$;

-- Trigger for task completion
drop trigger if exists track_task_completion on tasks;
create trigger track_task_completion
  before update on tasks
  for each row
  execute function update_task_completion();

-- =====================
-- FUNCTION: Update agent performance metrics
-- =====================
create or replace function update_agent_performance_on_task_update()
returns trigger
language plpgsql
as $$
declare
  v_tasks_completed integer;
  v_tasks_in_progress integer;
begin
  -- Only update if assigned agent changed or status changed
  if (new.assigned_agent_id is not null) and
     (old.assigned_agent_id is null or old.assigned_agent_id != new.assigned_agent_id or old.status != new.status) then

    -- Count completed tasks
    select count(*) into v_tasks_completed
    from tasks
    where assigned_agent_id = new.assigned_agent_id and status = 'done';

    -- Count in-progress tasks
    select count(*) into v_tasks_in_progress
    from tasks
    where assigned_agent_id = new.assigned_agent_id and status in ('in-progress', 'review');

    -- Update performance
    update agent_performance
    set
      tasks_completed = v_tasks_completed,
      tasks_in_progress = v_tasks_in_progress,
      updated_at = timezone('utc'::text, now())
    where agent_id = new.assigned_agent_id;

    -- Update availability status and load
    update agent_availability
    set
      current_load = v_tasks_in_progress,
      status = case
        when v_tasks_in_progress >= max_load then 'busy'
        else 'available'
      end,
      updated_at = timezone('utc'::text, now())
    where agent_id = new.assigned_agent_id;
  end if;

  return new;
end;
$$;

-- Trigger for agent performance update
drop trigger if exists update_performance_on_task_change on tasks;
create trigger update_performance_on_task_change
  after insert or update on tasks
  for each row
  execute function update_agent_performance_on_task_update();
