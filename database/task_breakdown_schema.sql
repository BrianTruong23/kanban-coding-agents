-- Task Breakdown and Agent Orchestration Schema
-- Extends the existing schema with epics, subtasks, dependencies, agent skills, and performance tracking

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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint epics_status_check check (status in ('planning', 'in-progress', 'review', 'done', 'blocked'))
);

-- =====================
-- SUBTASKS TABLE
-- =====================
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_task_id uuid references tasks(id) on delete cascade not null,
  subtask_id text not null, -- Display ID like "SUBTASK-1"
  title text not null,
  description text,
  status text not null default 'todo',
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  assigned_agent_id uuid references agents(id) on delete set null,
  definition_of_done text, -- DoD for this subtask
  test_notes text, -- Testing instructions
  risk_level text default 'low', -- low, medium, high, critical
  risk_description text, -- What are the risks
  estimated_hours numeric(5,2), -- Estimated effort in hours
  actual_hours numeric(5,2), -- Actual time spent
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint subtasks_status_check check (status in ('todo', 'in-progress', 'review', 'done', 'blocked')),
  constraint subtasks_risk_check check (risk_level in ('low', 'medium', 'high', critical'))
);

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid not null, -- Can be task or subtask
  depends_on_task_id uuid not null, -- Can be task or subtask
  dependency_type text default 'finish-to-start', -- finish-to-start, start-to-start, finish-to-finish, start-to-finish
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint task_dependencies_type_check check (dependency_type in ('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish')),
  unique(task_id, depends_on_task_id)
);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  skill_category text, -- frontend, backend, devops, testing, mobile, etc.
  proficiency_level integer not null check (proficiency_level >= 1 and proficiency_level <= 5) default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(agent_id, skill_name)
);

-- =====================
-- AGENT PERFORMANCE TABLE
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade,
  subtask_id uuid references subtasks(id) on delete cascade,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  quality_score integer check (quality_score >= 1 and quality_score <= 5), -- 1-5 rating
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================
-- TASK BREAKDOWN HISTORY TABLE
-- =====================
create table if not exists task_breakdown_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  input_type text not null, -- 'issue', 'prd', 'screenshot'
  input_content text not null, -- The original input
  breakdown_result jsonb not null, -- The AI-generated breakdown
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint breakdown_input_type_check check (input_type in ('issue', 'prd', 'screenshot', 'text'))
);

-- =====================
-- ENABLE RLS FOR ALL NEW TABLES
-- =====================
alter table epics enable row level security;
alter table subtasks enable row level security;
alter table task_dependencies enable row level security;
alter table agent_skills enable row level security;
alter table agent_performance enable row level security;
alter table task_breakdown_history enable row level security;

-- =====================
-- GRANTS
-- =====================
grant all on table epics to postgres, service_role;
grant all on table subtasks to postgres, service_role;
grant all on table task_dependencies to postgres, service_role;
grant all on table agent_skills to postgres, service_role;
grant all on table agent_performance to postgres, service_role;
grant all on table task_breakdown_history to postgres, service_role;

-- =====================
-- RLS POLICIES - EPICS
-- =====================
create policy "Users can view their own epics" on epics
  for select using (auth.uid() = user_id);

create policy "Users can insert their own epics" on epics
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own epics" on epics
  for update using (auth.uid() = user_id);

create policy "Users can delete their own epics" on epics
  for delete using (auth.uid() = user_id);

-- =====================
-- RLS POLICIES - SUBTASKS
-- =====================
create policy "Users can view their own subtasks" on subtasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own subtasks" on subtasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own subtasks" on subtasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own subtasks" on subtasks
  for delete using (auth.uid() = user_id);

-- =====================
-- RLS POLICIES - TASK DEPENDENCIES
-- =====================
create policy "Users can view their own dependencies" on task_dependencies
  for select using (auth.uid() = user_id);

create policy "Users can insert their own dependencies" on task_dependencies
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own dependencies" on task_dependencies
  for update using (auth.uid() = user_id);

create policy "Users can delete their own dependencies" on task_dependencies
  for delete using (auth.uid() = user_id);

-- =====================
-- RLS POLICIES - AGENT SKILLS
-- =====================
create policy "Users can view their own agent skills" on agent_skills
  for select using (auth.uid() = user_id);

create policy "Users can insert their own agent skills" on agent_skills
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own agent skills" on agent_skills
  for update using (auth.uid() = user_id);

create policy "Users can delete their own agent skills" on agent_skills
  for delete using (auth.uid() = user_id);

-- =====================
-- RLS POLICIES - AGENT PERFORMANCE
-- =====================
create policy "Users can view their own agent performance" on agent_performance
  for select using (auth.uid() = user_id);

create policy "Users can insert their own agent performance" on agent_performance
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own agent performance" on agent_performance
  for update using (auth.uid() = user_id);

create policy "Users can delete their own agent performance" on agent_performance
  for delete using (auth.uid() = user_id);

-- =====================
-- RLS POLICIES - TASK BREAKDOWN HISTORY
-- =====================
create policy "Users can view their own breakdown history" on task_breakdown_history
  for select using (auth.uid() = user_id);

create policy "Users can insert their own breakdown history" on task_breakdown_history
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own breakdown history" on task_breakdown_history
  for delete using (auth.uid() = user_id);

-- =====================
-- INDEXES
-- =====================
create index if not exists epics_user_id_idx on epics(user_id);
create index if not exists epics_status_idx on epics(status);

create index if not exists subtasks_user_id_idx on subtasks(user_id);
create index if not exists subtasks_parent_task_idx on subtasks(parent_task_id);
create index if not exists subtasks_assigned_agent_idx on subtasks(assigned_agent_id);
create index if not exists subtasks_status_idx on subtasks(status);

create index if not exists task_dependencies_user_id_idx on task_dependencies(user_id);
create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on_task_id);

create index if not exists agent_skills_user_id_idx on agent_skills(user_id);
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_category_idx on agent_skills(skill_category);

create index if not exists agent_performance_user_id_idx on agent_performance(user_id);
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);
create index if not exists agent_performance_task_id_idx on agent_performance(task_id);

create index if not exists breakdown_history_user_id_idx on task_breakdown_history(user_id);

-- =====================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

create trigger update_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

create trigger update_agent_skills_updated_at
  before update on agent_skills
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTION: Get Agent Workload
-- =====================
create or replace function get_agent_workload(agent_uuid uuid)
returns table (
  total_tasks bigint,
  in_progress_tasks bigint,
  avg_quality_score numeric
) as $$
begin
  return query
  select
    count(distinct t.id) + count(distinct st.id) as total_tasks,
    count(distinct t.id) filter (where t.status = 'in-progress') +
      count(distinct st.id) filter (where st.status = 'in-progress') as in_progress_tasks,
    avg(ap.quality_score) as avg_quality_score
  from agents a
  left join tasks t on t.assigned_agent_id = a.id
  left join subtasks st on st.assigned_agent_id = a.id
  left join agent_performance ap on ap.agent_id = a.id
  where a.id = agent_uuid
  group by a.id;
end;
$$ language plpgsql;

-- =====================
-- FUNCTION: Get Task with Dependencies
-- =====================
create or replace function get_task_dependencies(task_uuid uuid)
returns table (
  dependency_id uuid,
  dependency_task_id uuid,
  dependency_title text,
  dependency_status text,
  dependency_type text
) as $$
begin
  return query
  select
    td.id as dependency_id,
    td.depends_on_task_id as dependency_task_id,
    coalesce(t.title, st.title) as dependency_title,
    coalesce(t.status, st.status) as dependency_status,
    td.dependency_type
  from task_dependencies td
  left join tasks t on t.id = td.depends_on_task_id
  left join subtasks st on st.id = td.depends_on_task_id
  where td.task_id = task_uuid;
end;
$$ language plpgsql;

-- =====================
-- MIGRATION: Add missing columns to existing tasks table
-- =====================
do $$
begin
  -- Add sprint column if not exists
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;

  -- Add epic_id column if not exists (link tasks to epics)
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'epic_id') then
    alter table tasks add column epic_id uuid references epics(id) on delete set null;
  end if;

  -- Add definition_of_done column if not exists
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'definition_of_done') then
    alter table tasks add column definition_of_done text;
  end if;

  -- Add test_notes column if not exists
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'test_notes') then
    alter table tasks add column test_notes text;
  end if;

  -- Add risk_level column if not exists
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_level') then
    alter table tasks add column risk_level text default 'low';
  end if;

  -- Add risk_description column if not exists
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'risk_description') then
    alter table tasks add column risk_description text;
  end if;
end $$;

-- Add index for epic_id
create index if not exists tasks_epic_id_idx on tasks(epic_id);
