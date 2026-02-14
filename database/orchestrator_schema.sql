-- Extended Database Schema for Task Orchestration Features
-- This extends the base schema with support for epics, stories, dependencies, skills, and performance

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  acceptance_criteria text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
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

-- Trigger for updated_at
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- STORIES TABLE
-- =====================
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id uuid references epics(id) on delete cascade,
  title text not null,
  description text,
  acceptance_criteria text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table stories enable row level security;

-- RLS Policies for stories
drop policy if exists "Users can view their own stories" on stories;
create policy "Users can view their own stories" on stories
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own stories" on stories;
create policy "Users can insert their own stories" on stories
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own stories" on stories;
create policy "Users can update their own stories" on stories
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own stories" on stories;
create policy "Users can delete their own stories" on stories
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists stories_user_id_idx on stories(user_id);
create index if not exists stories_epic_id_idx on stories(epic_id);

-- Trigger for updated_at
drop trigger if exists update_stories_updated_at on stories;
create trigger update_stories_updated_at
  before update on stories
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
  dependency_type text not null check (dependency_type in ('blocks', 'relates-to', 'required-by')) default 'blocks',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table task_dependencies enable row level security;

-- RLS Policies for task_dependencies
drop policy if exists "Users can view their own task dependencies" on task_dependencies;
create policy "Users can view their own task dependencies" on task_dependencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own task dependencies" on task_dependencies;
create policy "Users can insert their own task dependencies" on task_dependencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own task dependencies" on task_dependencies;
create policy "Users can delete their own task dependencies" on task_dependencies
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists task_dependencies_user_id_idx on task_dependencies(user_id);
create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on_task_id);

-- =====================
-- EXTEND TASKS TABLE
-- =====================
do $$
begin
  -- story_id
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'story_id') then
    alter table tasks add column story_id uuid references stories(id) on delete set null;
  end if;

  -- epic_id
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references epics(id) on delete set null;
  end if;

  -- task_type
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'task_type') then
    alter table tasks add column task_type text check (task_type in ('epic', 'story', 'task', 'subtask')) default 'task';
  end if;

  -- estimated_hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric(10,2);
  end if;

  -- definition_of_done
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'definition_of_done') then
    alter table tasks add column definition_of_done jsonb default '{"criteria": [], "testNotes": []}'::jsonb;
  end if;

  -- risk_level
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_level') then
    alter table tasks add column risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')) default 'medium';
  end if;

  -- risk_description
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_description') then
    alter table tasks add column risk_description text;
  end if;

  -- required_skills
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'required_skills') then
    alter table tasks add column required_skills text[] default '{}';
  end if;
end $$;

-- =====================
-- EXTEND AGENTS TABLE
-- =====================
do $$
begin
  -- skills (JSONB for complex skill objects)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'skills') then
    alter table agents add column skills jsonb default '[]'::jsonb;
  end if;

  -- specializations
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'specializations') then
    alter table agents add column specializations text[] default '{}';
  end if;

  -- total_experience (in months)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'total_experience') then
    alter table agents add column total_experience integer default 0;
  end if;

  -- preferred_task_types
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'preferred_task_types') then
    alter table agents add column preferred_task_types text[] default '{}';
  end if;

  -- availability
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'availability') then
    alter table agents add column availability text check (availability in ('available', 'busy', 'offline')) default 'available';
  end if;

  -- workload
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'workload') then
    alter table agents add column workload integer default 0;
  end if;

  -- performance_metrics (JSONB for complex metrics object)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'performance_metrics') then
    alter table agents add column performance_metrics jsonb default '{
      "tasksCompleted": 0,
      "successRate": 100,
      "averageCompletionTime": 0,
      "qualityScore": 3,
      "velocity": 5
    }'::jsonb;
  end if;

  -- updated_at
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'updated_at') then
    alter table agents add column updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
  end if;
end $$;

-- Trigger for agents updated_at
drop trigger if exists update_agents_updated_at on agents;
create trigger update_agents_updated_at
  before update on agents
  for each row
  execute function update_updated_at_column();

-- =====================
-- AGENT PERFORMANCE TRACKING FUNCTION
-- =====================
-- Function to update agent performance metrics when tasks are completed
create or replace function update_agent_performance()
returns trigger as $$
begin
  -- Only update if task status changed to 'done'
  if NEW.status = 'done' and OLD.status != 'done' and NEW.assigned_agent_id is not null then
    update agents
    set performance_metrics = jsonb_set(
      performance_metrics,
      '{tasksCompleted}',
      to_jsonb((performance_metrics->>'tasksCompleted')::int + 1)
    )
    where id = NEW.assigned_agent_id;
  end if;

  -- Update workload when task is assigned
  if NEW.assigned_agent_id is not null and (OLD.assigned_agent_id is null or OLD.assigned_agent_id != NEW.assigned_agent_id) then
    -- Increment workload for new agent
    update agents set workload = workload + 1 where id = NEW.assigned_agent_id;

    -- Decrement workload for old agent if exists
    if OLD.assigned_agent_id is not null then
      update agents set workload = greatest(0, workload - 1) where id = OLD.assigned_agent_id;
    end if;
  end if;

  -- Update workload when task is unassigned
  if NEW.assigned_agent_id is null and OLD.assigned_agent_id is not null then
    update agents set workload = greatest(0, workload - 1) where id = OLD.assigned_agent_id;
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Trigger to update agent performance
drop trigger if exists task_completion_updates_agent_performance on tasks;
create trigger task_completion_updates_agent_performance
  after update on tasks
  for each row
  execute function update_agent_performance();

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================
create index if not exists tasks_story_id_idx on tasks(story_id);
create index if not exists tasks_epic_id_idx on tasks(epic_id);
create index if not exists tasks_risk_level_idx on tasks(risk_level);

-- =====================
-- VIEWS FOR REPORTING
-- =====================
-- View for task breakdown summary
create or replace view task_breakdown_summary as
select
  u.id as user_id,
  count(distinct e.id) as total_epics,
  count(distinct s.id) as total_stories,
  count(distinct t.id) as total_tasks,
  sum(case when t.risk_level in ('high', 'critical') then 1 else 0 end) as high_risk_tasks,
  sum(t.estimated_hours) as total_estimated_hours
from auth.users u
left join epics e on e.user_id = u.id
left join stories s on s.user_id = u.id
left join tasks t on t.user_id = u.id
group by u.id;

-- View for agent utilization
create or replace view agent_utilization as
select
  a.id,
  a.name,
  a.availability,
  a.workload,
  a.performance_metrics->>'tasksCompleted' as tasks_completed,
  a.performance_metrics->>'successRate' as success_rate,
  a.performance_metrics->>'velocity' as velocity,
  count(t.id) as active_tasks
from agents a
left join tasks t on t.assigned_agent_id = a.id and t.status != 'done'
group by a.id, a.name, a.availability, a.workload, a.performance_metrics;

-- Grants for views
grant select on task_breakdown_summary to postgres, service_role, authenticated;
grant select on agent_utilization to postgres, service_role, authenticated;
