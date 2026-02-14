-- Schema Extensions for Task Breakdown and Agent Orchestration
-- Run this SQL after the main schema.sql

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
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

-- Indexes
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_skill_name_idx on agent_skills(skill_name);

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  tasks_completed integer default 0,
  tasks_on_time integer default 0,
  tasks_late integer default 0,
  average_completion_time numeric(10, 2) default 0, -- in hours
  quality_score numeric(5, 2) default 100 check (quality_score >= 0 and quality_score <= 100),
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table agent_performance enable row level security;

-- Grants
grant all on table agent_performance to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view performance for their agents" on agent_performance;
create policy "Users can view performance for their agents" on agent_performance
  for select using (
    exists (
      select 1 from agents
      where agents.id = agent_performance.agent_id
      and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert performance for their agents" on agent_performance;
create policy "Users can insert performance for their agents" on agent_performance
  for insert with check (
    exists (
      select 1 from agents
      where agents.id = agent_performance.agent_id
      and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update performance for their agents" on agent_performance;
create policy "Users can update performance for their agents" on agent_performance
  for update using (
    exists (
      select 1 from agents
      where agents.id = agent_performance.agent_id
      and agents.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);

-- =====================
-- EXTEND AGENTS TABLE
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'is_available') then
    alter table agents add column is_available boolean default true;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'current_workload') then
    alter table agents add column current_workload integer default 0;
  end if;
end $$;

-- =====================
-- EXTEND TASKS TABLE
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'type') then
    alter table tasks add column type text default 'task' check (type in ('epic', 'task', 'subtask'));
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references tasks(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'parent_task_id') then
    alter table tasks add column parent_task_id uuid references tasks(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'estimated_hours') then
    alter table tasks add column estimated_hours numeric(10, 2);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'actual_hours') then
    alter table tasks add column actual_hours numeric(10, 2);
  end if;
end $$;

-- Additional indexes
create index if not exists tasks_epic_id_idx on tasks(epic_id);
create index if not exists tasks_parent_task_id_idx on tasks(parent_task_id);
create index if not exists tasks_type_idx on tasks(type);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  source_task_id uuid references tasks(id) on delete cascade not null,
  target_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'related', 'duplicate')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_task_id, target_task_id)
);

-- Enable Row Level Security
alter table task_dependencies enable row level security;

-- Grants
grant all on table task_dependencies to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view dependencies for their tasks" on task_dependencies;
create policy "Users can view dependencies for their tasks" on task_dependencies
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.source_task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert dependencies for their tasks" on task_dependencies;
create policy "Users can insert dependencies for their tasks" on task_dependencies
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.source_task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete dependencies for their tasks" on task_dependencies;
create policy "Users can delete dependencies for their tasks" on task_dependencies
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = task_dependencies.source_task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists task_dependencies_source_idx on task_dependencies(source_task_id);
create index if not exists task_dependencies_target_idx on task_dependencies(target_task_id);

-- =====================
-- DEFINITION OF DONE TABLE
-- =====================
create table if not exists definition_of_done (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  criteria text[] not null default '{}',
  test_notes text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table definition_of_done enable row level security;

-- Grants
grant all on table definition_of_done to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view DoD for their tasks" on definition_of_done;
create policy "Users can view DoD for their tasks" on definition_of_done
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert DoD for their tasks" on definition_of_done;
create policy "Users can insert DoD for their tasks" on definition_of_done
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update DoD for their tasks" on definition_of_done;
create policy "Users can update DoD for their tasks" on definition_of_done
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete DoD for their tasks" on definition_of_done;
create policy "Users can delete DoD for their tasks" on definition_of_done
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = definition_of_done.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Index
create index if not exists definition_of_done_task_id_idx on definition_of_done(task_id);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  category text not null check (category in ('technical', 'dependency', 'resource', 'timeline', 'scope')),
  description text not null,
  mitigation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table risk_flags enable row level security;

-- Grants
grant all on table risk_flags to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view risk flags for their tasks" on risk_flags;
create policy "Users can view risk flags for their tasks" on risk_flags
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert risk flags for their tasks" on risk_flags;
create policy "Users can insert risk flags for their tasks" on risk_flags
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update risk flags for their tasks" on risk_flags;
create policy "Users can update risk flags for their tasks" on risk_flags
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete risk flags for their tasks" on risk_flags;
create policy "Users can delete risk flags for their tasks" on risk_flags
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = risk_flags.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists risk_flags_task_id_idx on risk_flags(task_id);
create index if not exists risk_flags_severity_idx on risk_flags(severity);

-- =====================
-- FUNCTION: Update agent workload
-- =====================
create or replace function update_agent_workload()
returns trigger as $$
begin
  -- Update workload when task is assigned or unassigned
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    if new.assigned_agent_id is not null and new.status in ('backlog', 'in-progress') then
      update agents
      set current_workload = (
        select count(*)
        from tasks
        where assigned_agent_id = new.assigned_agent_id
        and status in ('backlog', 'in-progress')
      )
      where id = new.assigned_agent_id;
    end if;

    if old.assigned_agent_id is not null and old.assigned_agent_id != new.assigned_agent_id then
      update agents
      set current_workload = (
        select count(*)
        from tasks
        where assigned_agent_id = old.assigned_agent_id
        and status in ('backlog', 'in-progress')
      )
      where id = old.assigned_agent_id;
    end if;
  end if;

  if TG_OP = 'DELETE' then
    if old.assigned_agent_id is not null then
      update agents
      set current_workload = (
        select count(*)
        from tasks
        where assigned_agent_id = old.assigned_agent_id
        and status in ('backlog', 'in-progress')
      )
      where id = old.assigned_agent_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql;

-- Trigger for workload updates
drop trigger if exists update_agent_workload_trigger on tasks;
create trigger update_agent_workload_trigger
  after insert or update or delete on tasks
  for each row
  execute function update_agent_workload();
