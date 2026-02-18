-- Extended Schema for Task Breakdown and Agent Orchestration
-- This builds on top of the existing schema.sql
-- Run this AFTER running schema.sql

-- =====================
-- TASKS TABLE EXTENSIONS
-- =====================

-- Add new columns for task breakdown features
do $$
begin
  -- Task type (epic, story, task, subtask)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'type') then
    alter table tasks add column type text not null default 'task';
  end if;

  -- Parent task reference (for subtasks)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;

  -- Epic reference
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references tasks(id) on delete set null;
  end if;

  -- Story points
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'story_points') then
    alter table tasks add column story_points integer;
  end if;

  -- Definition of Done (JSONB for flexibility)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'definition_of_done') then
    alter table tasks add column definition_of_done jsonb;
  end if;

  -- Test notes (JSONB)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'test_notes') then
    alter table tasks add column test_notes jsonb;
  end if;

  -- Risk flags (JSONB array)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_flags') then
    alter table tasks add column risk_flags jsonb;
  end if;

  -- Dependencies (JSONB array)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'dependencies') then
    alter table tasks add column dependencies jsonb;
  end if;

  -- Estimated effort in hours
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_effort') then
    alter table tasks add column estimated_effort numeric(6,2);
  end if;

  -- AI-suggested agent IDs
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'suggested_agent_ids') then
    alter table tasks add column suggested_agent_ids uuid[];
  end if;

  -- Sprint field (if not already added)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

-- Update type constraint
alter table tasks drop constraint if exists tasks_type_check;
alter table tasks add constraint tasks_type_check check (type in ('epic', 'story', 'task', 'subtask'));

-- Add indexes for new fields
create index if not exists tasks_type_idx on tasks(type);
create index if not exists tasks_parent_task_idx on tasks(parent_task_id);
create index if not exists tasks_epic_idx on tasks(epic_id);
create index if not exists tasks_sprint_idx on tasks(sprint);

-- =====================
-- AGENTS TABLE EXTENSIONS
-- =====================

-- Add new columns for agent orchestration features
do $$
begin
  -- Skills (JSONB array)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'skills') then
    alter table agents add column skills jsonb default '[]'::jsonb;
  end if;

  -- Performance metrics (JSONB)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'performance_metrics') then
    alter table agents add column performance_metrics jsonb default '{
      "tasksCompleted": 0,
      "tasksInProgress": 0,
      "successRate": 100,
      "specializations": []
    }'::jsonb;
  end if;

  -- Availability (JSONB)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'availability') then
    alter table agents add column availability jsonb default '{
      "isAvailable": true,
      "currentLoad": 0,
      "maxCapacity": 5
    }'::jsonb;
  end if;

  -- Preferred task types
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'preferred_task_types') then
    alter table agents add column preferred_task_types text[];
  end if;

  -- Working hours (JSONB)
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'working_hours') then
    alter table agents add column working_hours jsonb;
  end if;
end $$;

-- =====================
-- UPDATE DEFAULT AGENTS FUNCTION
-- =====================
create or replace function create_default_agents()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into agents (
    user_id,
    name,
    description,
    avatar_color,
    skills,
    performance_metrics,
    availability,
    preferred_task_types
  ) values
    (
      new.id,
      'Alex Chen',
      'Specializes in React, Next.js, and UI development',
      'bg-blue-500',
      '[
        {"name": "React", "level": "expert", "category": "frontend"},
        {"name": "Next.js", "level": "expert", "category": "frontend"},
        {"name": "TypeScript", "level": "advanced", "category": "frontend"},
        {"name": "UI/UX", "level": "advanced", "category": "design"},
        {"name": "CSS", "level": "expert", "category": "frontend"}
      ]'::jsonb,
      '{
        "tasksCompleted": 45,
        "tasksInProgress": 0,
        "successRate": 92,
        "specializations": ["frontend", "ui", "react"]
      }'::jsonb,
      '{
        "isAvailable": true,
        "currentLoad": 0,
        "maxCapacity": 5
      }'::jsonb,
      ARRAY['task', 'story']
    ),
    (
      new.id,
      'Sarah Johnson',
      'Handles API, database, and server-side logic',
      'bg-green-500',
      '[
        {"name": "Node.js", "level": "expert", "category": "backend"},
        {"name": "PostgreSQL", "level": "advanced", "category": "backend"},
        {"name": "API Design", "level": "expert", "category": "backend"},
        {"name": "GraphQL", "level": "intermediate", "category": "backend"},
        {"name": "Database Design", "level": "advanced", "category": "backend"}
      ]'::jsonb,
      '{
        "tasksCompleted": 38,
        "tasksInProgress": 0,
        "successRate": 95,
        "specializations": ["backend", "api", "database"]
      }'::jsonb,
      '{
        "isAvailable": true,
        "currentLoad": 0,
        "maxCapacity": 4
      }'::jsonb,
      ARRAY['task', 'story']
    ),
    (
      new.id,
      'Mike Rodriguez',
      'Works on both frontend and backend tasks',
      'bg-purple-500',
      '[
        {"name": "Full Stack", "level": "advanced", "category": "frontend"},
        {"name": "React", "level": "advanced", "category": "frontend"},
        {"name": "Node.js", "level": "advanced", "category": "backend"},
        {"name": "MongoDB", "level": "intermediate", "category": "backend"},
        {"name": "Testing", "level": "advanced", "category": "testing"}
      ]'::jsonb,
      '{
        "tasksCompleted": 52,
        "tasksInProgress": 0,
        "successRate": 88,
        "specializations": ["frontend", "backend", "testing"]
      }'::jsonb,
      '{
        "isAvailable": true,
        "currentLoad": 0,
        "maxCapacity": 5
      }'::jsonb,
      ARRAY['task', 'subtask']
    ),
    (
      new.id,
      'Emma Wilson',
      'DevOps and infrastructure specialist',
      'bg-orange-500',
      '[
        {"name": "Docker", "level": "expert", "category": "devops"},
        {"name": "Kubernetes", "level": "advanced", "category": "devops"},
        {"name": "CI/CD", "level": "expert", "category": "devops"},
        {"name": "AWS", "level": "advanced", "category": "devops"},
        {"name": "Monitoring", "level": "advanced", "category": "devops"}
      ]'::jsonb,
      '{
        "tasksCompleted": 31,
        "tasksInProgress": 0,
        "successRate": 97,
        "specializations": ["devops", "infrastructure"]
      }'::jsonb,
      '{
        "isAvailable": true,
        "currentLoad": 0,
        "maxCapacity": 3
      }'::jsonb,
      ARRAY['task', 'epic']
    ),
    (
      new.id,
      'David Kim',
      'Mobile app development expert',
      'bg-pink-500',
      '[
        {"name": "React Native", "level": "expert", "category": "mobile"},
        {"name": "iOS", "level": "advanced", "category": "mobile"},
        {"name": "Android", "level": "advanced", "category": "mobile"},
        {"name": "Mobile UI", "level": "expert", "category": "design"},
        {"name": "Performance", "level": "advanced", "category": "mobile"}
      ]'::jsonb,
      '{
        "tasksCompleted": 29,
        "tasksInProgress": 0,
        "successRate": 90,
        "specializations": ["mobile", "react-native"]
      }'::jsonb,
      '{
        "isAvailable": true,
        "currentLoad": 0,
        "maxCapacity": 4
      }'::jsonb,
      ARRAY['story', 'task']
    );
  return new;
exception
  when others then
    raise notice 'Error creating agents: %', SQLERRM;
    return new;
end;
$$;

-- Recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_default_agents();

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Function to update agent performance metrics when task status changes
create or replace function update_agent_metrics()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  agent_record record;
  new_metrics jsonb;
begin
  -- Only update if task is marked as done
  if new.status = 'done' and new.assigned_agent_id is not null then
    -- Get current agent metrics
    select performance_metrics into agent_record
    from agents
    where id = new.assigned_agent_id;

    if found then
      -- Increment tasks completed
      new_metrics := jsonb_set(
        agent_record.performance_metrics,
        '{tasksCompleted}',
        to_jsonb((agent_record.performance_metrics->>'tasksCompleted')::int + 1)
      );

      -- Update the agent
      update agents
      set performance_metrics = new_metrics
      where id = new.assigned_agent_id;
    end if;
  end if;

  return new;
end;
$$;

-- Trigger to update agent metrics
drop trigger if exists update_agent_metrics_on_task_done on tasks;
create trigger update_agent_metrics_on_task_done
  after update on tasks
  for each row
  when (old.status is distinct from new.status and new.status = 'done')
  execute function update_agent_metrics();

-- =====================
-- VIEWS FOR ANALYTICS
-- =====================

-- View to see task hierarchy (epics -> stories -> tasks -> subtasks)
create or replace view task_hierarchy as
with recursive task_tree as (
  -- Base case: top-level tasks (epics and tasks without parents)
  select
    id,
    task_id,
    title,
    type,
    parent_task_id,
    epic_id,
    status,
    priority,
    0 as depth,
    array[id] as path
  from tasks
  where parent_task_id is null

  union all

  -- Recursive case: child tasks
  select
    t.id,
    t.task_id,
    t.title,
    t.type,
    t.parent_task_id,
    t.epic_id,
    t.status,
    t.priority,
    tt.depth + 1,
    tt.path || t.id
  from tasks t
  inner join task_tree tt on t.parent_task_id = tt.id
)
select * from task_tree
order by path;

-- View for agent workload
create or replace view agent_workload as
select
  a.id,
  a.name,
  a.avatar_color,
  (a.performance_metrics->>'tasksCompleted')::int as tasks_completed,
  (a.availability->>'currentLoad')::int as current_load,
  (a.availability->>'maxCapacity')::int as max_capacity,
  (a.availability->>'isAvailable')::boolean as is_available,
  count(t.id) as active_tasks
from agents a
left join tasks t on t.assigned_agent_id = a.id and t.status in ('backlog', 'in-progress', 'review')
group by a.id, a.name, a.avatar_color, a.performance_metrics, a.availability;

-- Grant access to views
grant select on task_hierarchy to postgres, service_role, authenticated;
grant select on agent_workload to postgres, service_role, authenticated;
