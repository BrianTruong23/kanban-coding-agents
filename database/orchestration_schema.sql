-- Task Breakdown and Agent Orchestration Schema
-- Run this SQL in your Supabase SQL Editor

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id text not null,
  title text not null,
  description text,
  goals text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table epics enable row level security;

-- RLS Policies
create policy "Users can view their own epics" on epics
  for select using (auth.uid() = user_id);

create policy "Users can insert their own epics" on epics
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own epics" on epics
  for update using (auth.uid() = user_id);

create policy "Users can delete their own epics" on epics
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists epics_user_id_idx on epics(user_id);
create index if not exists epics_epic_id_idx on epics(epic_id);

-- =====================
-- SUBTASKS TABLE
-- =====================
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  parent_task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  assigned_agent_id uuid references agents(id) on delete set null,
  estimated_hours numeric(10, 2),
  actual_hours numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table subtasks enable row level security;

-- RLS Policies (based on parent task ownership)
create policy "Users can view subtasks of their tasks" on subtasks
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = subtasks.parent_task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert subtasks for their tasks" on subtasks
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = subtasks.parent_task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update subtasks of their tasks" on subtasks
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = subtasks.parent_task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete subtasks of their tasks" on subtasks
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = subtasks.parent_task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists subtasks_parent_task_id_idx on subtasks(parent_task_id);
create index if not exists subtasks_assigned_agent_idx on subtasks(assigned_agent_id);

-- =====================
-- DEFINITION OF DONE TABLE
-- =====================
create table if not exists definition_of_done (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  criteria text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table definition_of_done enable row level security;

-- RLS Policies
create policy "Users can view DoD of their tasks" on definition_of_done
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert DoD for their tasks" on definition_of_done
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update DoD of their tasks" on definition_of_done
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete DoD of their tasks" on definition_of_done
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists definition_of_done_task_id_idx on definition_of_done(task_id);

-- =====================
-- TEST NOTES TABLE
-- =====================
create table if not exists test_notes (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  test_scenarios text[] not null default '{}',
  test_data text,
  expected_results text,
  actual_results text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table test_notes enable row level security;

-- RLS Policies
create policy "Users can view test notes of their tasks" on test_notes
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = test_notes.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert test notes for their tasks" on test_notes
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = test_notes.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update test notes of their tasks" on test_notes
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = test_notes.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete test notes of their tasks" on test_notes
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = test_notes.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists test_notes_task_id_idx on test_notes(task_id);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  level text not null check (level in ('low', 'medium', 'high', 'critical')),
  category text not null,
  description text not null,
  mitigation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table risk_flags enable row level security;

-- RLS Policies
create policy "Users can view risk flags of their tasks" on risk_flags
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert risk flags for their tasks" on risk_flags
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update risk flags of their tasks" on risk_flags
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete risk flags of their tasks" on risk_flags
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists risk_flags_task_id_idx on risk_flags(task_id);
create index if not exists risk_flags_level_idx on risk_flags(level);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  depends_on_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'relates_to', 'duplicates', 'clones')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint no_self_dependency check (task_id != depends_on_task_id)
);

-- Enable RLS
alter table task_dependencies enable row level security;

-- RLS Policies
create policy "Users can view dependencies of their tasks" on task_dependencies
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert dependencies for their tasks" on task_dependencies
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete dependencies of their tasks" on task_dependencies
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

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  skill_category text not null check (skill_category in ('frontend', 'backend', 'database', 'devops', 'mobile', 'testing', 'ui-ux', 'security')),
  proficiency_level text not null check (proficiency_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience numeric(4, 1),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_skills enable row level security;

-- RLS Policies
create policy "Users can view skills of their agents" on agent_skills
  for select using (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can insert skills for their agents" on agent_skills
  for insert with check (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can update skills of their agents" on agent_skills
  for update using (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can delete skills of their agents" on agent_skills
  for delete using (
    exists (
      select 1 from agents
      where agents.id = agent_skills.agent_id
      and agents.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_category_idx on agent_skills(skill_category);

-- =====================
-- AGENT PERFORMANCE METRICS TABLE
-- =====================
create table if not exists agent_performance_metrics (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  total_tasks_completed integer default 0,
  total_tasks_assigned integer default 0,
  average_completion_time numeric(10, 2) default 0,
  success_rate numeric(5, 2) default 100,
  on_time_delivery_rate numeric(5, 2) default 100,
  code_quality_score numeric(5, 2),
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_performance_metrics enable row level security;

-- RLS Policies
create policy "Users can view metrics of their agents" on agent_performance_metrics
  for select using (
    exists (
      select 1 from agents
      where agents.id = agent_performance_metrics.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can insert metrics for their agents" on agent_performance_metrics
  for insert with check (
    exists (
      select 1 from agents
      where agents.id = agent_performance_metrics.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can update metrics of their agents" on agent_performance_metrics
  for update using (
    exists (
      select 1 from agents
      where agents.id = agent_performance_metrics.agent_id
      and agents.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists agent_performance_metrics_agent_id_idx on agent_performance_metrics(agent_id);

-- =====================
-- AGENT AVAILABILITY TABLE
-- =====================
create table if not exists agent_availability (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  current_workload integer default 0,
  max_capacity integer default 5,
  is_available boolean default true,
  available_from timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agent_availability enable row level security;

-- RLS Policies
create policy "Users can view availability of their agents" on agent_availability
  for select using (
    exists (
      select 1 from agents
      where agents.id = agent_availability.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can insert availability for their agents" on agent_availability
  for insert with check (
    exists (
      select 1 from agents
      where agents.id = agent_availability.agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Users can update availability of their agents" on agent_availability
  for update using (
    exists (
      select 1 from agents
      where agents.id = agent_availability.agent_id
      and agents.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists agent_availability_agent_id_idx on agent_availability(agent_id);
create index if not exists agent_availability_is_available_idx on agent_availability(is_available);

-- =====================
-- UPDATE TRIGGERS
-- =====================
-- Trigger for subtasks
drop trigger if exists update_subtasks_updated_at on subtasks;
create trigger update_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- Trigger for epics
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- Trigger for definition_of_done
drop trigger if exists update_definition_of_done_updated_at on definition_of_done;
create trigger update_definition_of_done_updated_at
  before update on definition_of_done
  for each row
  execute function update_updated_at_column();

-- Trigger for test_notes
drop trigger if exists update_test_notes_updated_at on test_notes;
create trigger update_test_notes_updated_at
  before update on test_notes
  for each row
  execute function update_updated_at_column();

-- Trigger for risk_flags
drop trigger if exists update_risk_flags_updated_at on risk_flags;
create trigger update_risk_flags_updated_at
  before update on risk_flags
  for each row
  execute function update_updated_at_column();

-- Trigger for agent_skills
drop trigger if exists update_agent_skills_updated_at on agent_skills;
create trigger update_agent_skills_updated_at
  before update on agent_skills
  for each row
  execute function update_updated_at_column();

-- Trigger for agent_availability
drop trigger if exists update_agent_availability_updated_at on agent_availability;
create trigger update_agent_availability_updated_at
  before update on agent_availability
  for each row
  execute function update_updated_at_column();

-- =====================
-- ADD EPIC ID TO TASKS
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references epics(id) on delete set null;
    create index if not exists tasks_epic_id_idx on tasks(epic_id);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'task_type') then
    alter table tasks add column task_type text default 'task' check (task_type in ('epic', 'story', 'task', 'subtask', 'bug'));
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric(10, 2);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_hours') then
    alter table tasks add column actual_hours numeric(10, 2);
  end if;
end $$;

-- =====================
-- FUNCTION: Initialize agent metrics and availability
-- =====================
create or replace function initialize_agent_metrics()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Create default performance metrics
  insert into agent_performance_metrics (agent_id)
  values (new.id)
  on conflict (agent_id) do nothing;

  -- Create default availability
  insert into agent_availability (agent_id)
  values (new.id)
  on conflict (agent_id) do nothing;

  return new;
end;
$$;

-- Trigger to initialize metrics when agent is created
drop trigger if exists on_agent_created on agents;
create trigger on_agent_created
  after insert on agents
  for each row
  execute function initialize_agent_metrics();

-- =====================
-- FUNCTION: Update agent workload
-- =====================
create or replace function update_agent_workload()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  old_agent_id uuid;
  new_agent_id uuid;
begin
  -- Handle task assignment changes
  if TG_OP = 'INSERT' then
    new_agent_id := new.assigned_agent_id;
    if new_agent_id is not null and new.status in ('backlog', 'in-progress') then
      update agent_availability
      set current_workload = current_workload + 1,
          is_available = (current_workload + 1 < max_capacity),
          updated_at = timezone('utc'::text, now())
      where agent_id = new_agent_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    old_agent_id := old.assigned_agent_id;
    new_agent_id := new.assigned_agent_id;

    -- If agent changed
    if old_agent_id is distinct from new_agent_id then
      -- Decrease old agent's workload
      if old_agent_id is not null and old.status in ('backlog', 'in-progress') then
        update agent_availability
        set current_workload = greatest(0, current_workload - 1),
            is_available = (greatest(0, current_workload - 1) < max_capacity),
            updated_at = timezone('utc'::text, now())
        where agent_id = old_agent_id;
      end if;

      -- Increase new agent's workload
      if new_agent_id is not null and new.status in ('backlog', 'in-progress') then
        update agent_availability
        set current_workload = current_workload + 1,
            is_available = (current_workload + 1 < max_capacity),
            updated_at = timezone('utc'::text, now())
        where agent_id = new_agent_id;
      end if;
    -- If status changed to done/review
    elsif new_agent_id is not null and old.status in ('backlog', 'in-progress') and new.status in ('review', 'done') then
      update agent_availability
      set current_workload = greatest(0, current_workload - 1),
          is_available = (greatest(0, current_workload - 1) < max_capacity),
          updated_at = timezone('utc'::text, now())
      where agent_id = new_agent_id;
    -- If status changed from done/review back to in-progress
    elsif new_agent_id is not null and old.status in ('review', 'done') and new.status in ('backlog', 'in-progress') then
      update agent_availability
      set current_workload = current_workload + 1,
          is_available = (current_workload + 1 < max_capacity),
          updated_at = timezone('utc'::text, now())
      where agent_id = new_agent_id;
    end if;
  elsif TG_OP = 'DELETE' then
    old_agent_id := old.assigned_agent_id;
    if old_agent_id is not null and old.status in ('backlog', 'in-progress') then
      update agent_availability
      set current_workload = greatest(0, current_workload - 1),
          is_available = (greatest(0, current_workload - 1) < max_capacity),
          updated_at = timezone('utc'::text, now())
      where agent_id = old_agent_id;
    end if;
  end if;

  return new;
end;
$$;

-- Trigger to update workload when tasks change
drop trigger if exists update_task_agent_workload on tasks;
create trigger update_task_agent_workload
  after insert or update or delete on tasks
  for each row
  execute function update_agent_workload();
