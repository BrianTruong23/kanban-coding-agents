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
-- SPRINT COLUMN (Task Breakdown Feature)
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

create index if not exists tasks_sprint_idx on tasks(sprint);

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'active', 'completed', 'archived')),
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  sprint text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table epics enable row level security;
grant all on table epics to postgres, service_role;

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

create index if not exists epics_user_id_idx on epics(user_id);

drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- EPIC RELATIONSHIP
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
  parent_task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  assigned_agent_id uuid references agents(id) on delete set null,
  estimated_hours numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table subtasks enable row level security;
grant all on table subtasks to postgres, service_role;

drop policy if exists "Users can view subtasks of their tasks" on subtasks;
create policy "Users can view subtasks of their tasks" on subtasks
  for select using (
    exists (
      select 1 from tasks where tasks.id = subtasks.parent_task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert subtasks for their tasks" on subtasks;
create policy "Users can insert subtasks for their tasks" on subtasks
  for insert with check (
    exists (
      select 1 from tasks where tasks.id = subtasks.parent_task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update subtasks of their tasks" on subtasks;
create policy "Users can update subtasks of their tasks" on subtasks
  for update using (
    exists (
      select 1 from tasks where tasks.id = subtasks.parent_task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete subtasks of their tasks" on subtasks;
create policy "Users can delete subtasks of their tasks" on subtasks
  for delete using (
    exists (
      select 1 from tasks where tasks.id = subtasks.parent_task_id and tasks.user_id = auth.uid()
    )
  );

create index if not exists subtasks_parent_task_id_idx on subtasks(parent_task_id);

drop trigger if exists update_subtasks_updated_at on subtasks;
create trigger update_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  depends_on_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'blocked-by', 'relates-to')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_task_dependency unique (task_id, depends_on_task_id)
);

alter table task_dependencies enable row level security;
grant all on table task_dependencies to postgres, service_role;

drop policy if exists "Users can view dependencies of their tasks" on task_dependencies;
create policy "Users can view dependencies of their tasks" on task_dependencies
  for select using (
    exists (
      select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert dependencies for their tasks" on task_dependencies;
create policy "Users can insert dependencies for their tasks" on task_dependencies
  for insert with check (
    exists (
      select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete dependencies of their tasks" on task_dependencies;
create policy "Users can delete dependencies of their tasks" on task_dependencies
  for delete using (
    exists (
      select 1 from tasks where tasks.id = task_dependencies.task_id and tasks.user_id = auth.uid()
    )
  );

create index if not exists task_dependencies_task_id_idx on task_dependencies(task_id);
create index if not exists task_dependencies_depends_on_idx on task_dependencies(depends_on_task_id);

-- =====================
-- DEFINITIONS OF DONE TABLE
-- =====================
create table if not exists definitions_of_done (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table definitions_of_done enable row level security;
grant all on table definitions_of_done to postgres, service_role;

drop policy if exists "Users can view DoD of their tasks" on definitions_of_done;
create policy "Users can view DoD of their tasks" on definitions_of_done
  for select using (
    exists (
      select 1 from tasks where tasks.id = definitions_of_done.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert DoD for their tasks" on definitions_of_done;
create policy "Users can insert DoD for their tasks" on definitions_of_done
  for insert with check (
    exists (
      select 1 from tasks where tasks.id = definitions_of_done.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update DoD of their tasks" on definitions_of_done;
create policy "Users can update DoD of their tasks" on definitions_of_done
  for update using (
    exists (
      select 1 from tasks where tasks.id = definitions_of_done.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete DoD of their tasks" on definitions_of_done;
create policy "Users can delete DoD of their tasks" on definitions_of_done
  for delete using (
    exists (
      select 1 from tasks where tasks.id = definitions_of_done.task_id and tasks.user_id = auth.uid()
    )
  );

create index if not exists definitions_of_done_task_id_idx on definitions_of_done(task_id);

drop trigger if exists update_definitions_of_done_updated_at on definitions_of_done;
create trigger update_definitions_of_done_updated_at
  before update on definitions_of_done
  for each row
  execute function update_updated_at_column();

-- =====================
-- TEST NOTES TABLE
-- =====================
create table if not exists test_notes (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  test_type text not null check (test_type in ('unit', 'integration', 'e2e', 'manual')),
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table test_notes enable row level security;
grant all on table test_notes to postgres, service_role;

drop policy if exists "Users can view test notes of their tasks" on test_notes;
create policy "Users can view test notes of their tasks" on test_notes
  for select using (
    exists (
      select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert test notes for their tasks" on test_notes;
create policy "Users can insert test notes for their tasks" on test_notes
  for insert with check (
    exists (
      select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update test notes of their tasks" on test_notes;
create policy "Users can update test notes of their tasks" on test_notes
  for update using (
    exists (
      select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete test notes of their tasks" on test_notes;
create policy "Users can delete test notes of their tasks" on test_notes
  for delete using (
    exists (
      select 1 from tasks where tasks.id = test_notes.task_id and tasks.user_id = auth.uid()
    )
  );

create index if not exists test_notes_task_id_idx on test_notes(task_id);

drop trigger if exists update_test_notes_updated_at on test_notes;
create trigger update_test_notes_updated_at
  before update on test_notes
  for each row
  execute function update_updated_at_column();

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  description text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  mitigation_plan text,
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table risk_flags enable row level security;
grant all on table risk_flags to postgres, service_role;

drop policy if exists "Users can view risk flags of their tasks" on risk_flags;
create policy "Users can view risk flags of their tasks" on risk_flags
  for select using (
    exists (
      select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert risk flags for their tasks" on risk_flags;
create policy "Users can insert risk flags for their tasks" on risk_flags
  for insert with check (
    exists (
      select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update risk flags of their tasks" on risk_flags;
create policy "Users can update risk flags of their tasks" on risk_flags
  for update using (
    exists (
      select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete risk flags of their tasks" on risk_flags;
create policy "Users can delete risk flags of their tasks" on risk_flags
  for delete using (
    exists (
      select 1 from tasks where tasks.id = risk_flags.task_id and tasks.user_id = auth.uid()
    )
  );

create index if not exists risk_flags_task_id_idx on risk_flags(task_id);

drop trigger if exists update_risk_flags_updated_at on risk_flags;
create trigger update_risk_flags_updated_at
  before update on risk_flags
  for each row
  execute function update_updated_at_column();

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  category text not null check (category in ('frontend', 'backend', 'database', 'devops', 'testing', 'ui-ux', 'mobile', 'api-design')),
  proficiency_level integer not null check (proficiency_level >= 1 and proficiency_level <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_agent_skill unique (agent_id, skill_name)
);

alter table agent_skills enable row level security;
grant all on table agent_skills to postgres, service_role;

drop policy if exists "Users can view skills of their agents" on agent_skills;
create policy "Users can view skills of their agents" on agent_skills
  for select using (
    exists (
      select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert skills for their agents" on agent_skills;
create policy "Users can insert skills for their agents" on agent_skills
  for insert with check (
    exists (
      select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update skills of their agents" on agent_skills;
create policy "Users can update skills of their agents" on agent_skills
  for update using (
    exists (
      select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete skills of their agents" on agent_skills;
create policy "Users can delete skills of their agents" on agent_skills
  for delete using (
    exists (
      select 1 from agents where agents.id = agent_skills.agent_id and agents.user_id = auth.uid()
    )
  );

create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);

drop trigger if exists update_agent_skills_updated_at on agent_skills;
create trigger update_agent_skills_updated_at
  before update on agent_skills
  for each row
  execute function update_updated_at_column();

-- =====================
-- AGENT PERFORMANCE METRICS TABLE
-- =====================
create table if not exists agent_performance_metrics (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null unique,
  tasks_completed integer default 0,
  tasks_in_progress integer default 0,
  average_completion_time numeric default 0,
  success_rate numeric default 100 check (success_rate >= 0 and success_rate <= 100),
  last_activity_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table agent_performance_metrics enable row level security;
grant all on table agent_performance_metrics to postgres, service_role;

drop policy if exists "Users can view metrics of their agents" on agent_performance_metrics;
create policy "Users can view metrics of their agents" on agent_performance_metrics
  for select using (
    exists (
      select 1 from agents where agents.id = agent_performance_metrics.agent_id and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert metrics for their agents" on agent_performance_metrics;
create policy "Users can insert metrics for their agents" on agent_performance_metrics
  for insert with check (
    exists (
      select 1 from agents where agents.id = agent_performance_metrics.agent_id and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update metrics of their agents" on agent_performance_metrics;
create policy "Users can update metrics of their agents" on agent_performance_metrics
  for update using (
    exists (
      select 1 from agents where agents.id = agent_performance_metrics.agent_id and agents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete metrics of their agents" on agent_performance_metrics;
create policy "Users can delete metrics of their agents" on agent_performance_metrics
  for delete using (
    exists (
      select 1 from agents where agents.id = agent_performance_metrics.agent_id and agents.user_id = auth.uid()
    )
  );

create index if not exists agent_performance_metrics_agent_id_idx on agent_performance_metrics(agent_id);

drop trigger if exists update_agent_performance_metrics_updated_at on agent_performance_metrics;
create trigger update_agent_performance_metrics_updated_at
  before update on agent_performance_metrics
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTION: Create default skills for default agents
-- =====================
create or replace function create_default_agent_skills()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  alex_id uuid;
  sarah_id uuid;
  mike_id uuid;
  emma_id uuid;
  david_id uuid;
begin
  -- Get agent IDs for the new user
  select id into alex_id from agents where user_id = new.id and name = 'Alex Chen';
  select id into sarah_id from agents where user_id = new.id and name = 'Sarah Johnson';
  select id into mike_id from agents where user_id = new.id and name = 'Mike Rodriguez';
  select id into emma_id from agents where user_id = new.id and name = 'Emma Wilson';
  select id into david_id from agents where user_id = new.id and name = 'David Kim';

  -- Alex Chen - Frontend specialist
  if alex_id is not null then
    insert into agent_skills (agent_id, skill_name, category, proficiency_level) values
      (alex_id, 'React', 'frontend', 5),
      (alex_id, 'Next.js', 'frontend', 5),
      (alex_id, 'TypeScript', 'frontend', 4),
      (alex_id, 'UI/UX Design', 'ui-ux', 4);
    insert into agent_performance_metrics (agent_id) values (alex_id);
  end if;

  -- Sarah Johnson - Backend specialist
  if sarah_id is not null then
    insert into agent_skills (agent_id, skill_name, category, proficiency_level) values
      (sarah_id, 'Node.js', 'backend', 5),
      (sarah_id, 'PostgreSQL', 'database', 5),
      (sarah_id, 'API Design', 'api-design', 5),
      (sarah_id, 'Authentication', 'backend', 4);
    insert into agent_performance_metrics (agent_id) values (sarah_id);
  end if;

  -- Mike Rodriguez - Full-stack
  if mike_id is not null then
    insert into agent_skills (agent_id, skill_name, category, proficiency_level) values
      (mike_id, 'React', 'frontend', 4),
      (mike_id, 'Node.js', 'backend', 4),
      (mike_id, 'Database Design', 'database', 3),
      (mike_id, 'Testing', 'testing', 4);
    insert into agent_performance_metrics (agent_id) values (mike_id);
  end if;

  -- Emma Wilson - DevOps specialist
  if emma_id is not null then
    insert into agent_skills (agent_id, skill_name, category, proficiency_level) values
      (emma_id, 'Docker', 'devops', 5),
      (emma_id, 'CI/CD', 'devops', 5),
      (emma_id, 'AWS', 'devops', 4),
      (emma_id, 'Monitoring', 'devops', 4);
    insert into agent_performance_metrics (agent_id) values (emma_id);
  end if;

  -- David Kim - Mobile specialist
  if david_id is not null then
    insert into agent_skills (agent_id, skill_name, category, proficiency_level) values
      (david_id, 'React Native', 'mobile', 5),
      (david_id, 'iOS Development', 'mobile', 4),
      (david_id, 'Android Development', 'mobile', 4),
      (david_id, 'Mobile UI', 'ui-ux', 4);
    insert into agent_performance_metrics (agent_id) values (david_id);
  end if;

  return new;
exception
  when others then
    raise notice 'Error creating agent skills: %', SQLERRM;
    return new;
end;
$$;

drop trigger if exists on_agents_created on agents;
create trigger on_agents_created
  after insert on agents
  for each statement
  execute function create_default_agent_skills();
