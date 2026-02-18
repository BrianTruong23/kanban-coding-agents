-- Agent Orchestration and Task Breakdown Schema
-- This schema extends the existing kanban system with:
-- 1. Epic/Ticket/Subtask hierarchy
-- 2. Task dependencies and risk flags
-- 3. Agent skills and performance tracking
-- 4. Auto-assignment capabilities

-- =====================
-- TASK HIERARCHY: EPICS
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id text not null, -- Display ID like "EPIC-1"
  title text not null,
  description text,
  status text not null default 'backlog',
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table epics enable row level security;

-- RLS Policies
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

-- =====================
-- TASK HIERARCHY: TICKETS (linked to epics)
-- =====================
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id uuid references epics(id) on delete cascade,
  ticket_id text not null, -- Display ID like "TICKET-1"
  title text not null,
  description text,
  status text not null default 'backlog',
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  assigned_agent_id uuid references agents(id) on delete set null,
  tags text[] default '{}',

  -- Definition of Done (DoD)
  definition_of_done jsonb default '[]'::jsonb, -- Array of DoD criteria

  -- Test notes and risk flags
  test_notes text,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_description text,

  -- Effort estimation
  story_points integer,
  estimated_hours decimal(5,2),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table tickets enable row level security;

-- RLS Policies
drop policy if exists "Users can view their own tickets" on tickets;
create policy "Users can view their own tickets" on tickets
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tickets" on tickets;
create policy "Users can insert their own tickets" on tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tickets" on tickets;
create policy "Users can update their own tickets" on tickets
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tickets" on tickets;
create policy "Users can delete their own tickets" on tickets
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists tickets_user_id_idx on tickets(user_id);
create index if not exists tickets_epic_id_idx on tickets(epic_id);
create index if not exists tickets_status_idx on tickets(status);
create index if not exists tickets_assigned_agent_idx on tickets(assigned_agent_id);

-- =====================
-- TASK HIERARCHY: SUBTASKS (linked to tickets)
-- =====================
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticket_id uuid references tickets(id) on delete cascade not null,
  subtask_id text not null, -- Display ID like "SUB-1"
  title text not null,
  description text,
  status text not null default 'backlog',
  assigned_agent_id uuid references agents(id) on delete set null,
  order_index integer default 0, -- For ordering subtasks within a ticket
  estimated_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table subtasks enable row level security;

-- RLS Policies
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
create index if not exists subtasks_ticket_id_idx on subtasks(ticket_id);
create index if not exists subtasks_assigned_agent_idx on subtasks(assigned_agent_id);

-- =====================
-- TASK DEPENDENCIES
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Source task (depends on target task)
  source_type text not null check (source_type in ('epic', 'ticket', 'subtask', 'task')),
  source_id uuid not null,

  -- Target task (must be completed before source)
  target_type text not null check (target_type in ('epic', 'ticket', 'subtask', 'task')),
  target_id uuid not null,

  -- Dependency type
  dependency_type text default 'blocks' check (dependency_type in ('blocks', 'related', 'requires')),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure no duplicate dependencies
  unique(source_type, source_id, target_type, target_id)
);

-- Enable RLS
alter table task_dependencies enable row level security;

-- RLS Policies
drop policy if exists "Users can view their own dependencies" on task_dependencies;
create policy "Users can view their own dependencies" on task_dependencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dependencies" on task_dependencies;
create policy "Users can insert their own dependencies" on task_dependencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dependencies" on task_dependencies;
create policy "Users can update their own dependencies" on task_dependencies
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own dependencies" on task_dependencies;
create policy "Users can delete their own dependencies" on task_dependencies
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists dependencies_user_id_idx on task_dependencies(user_id);
create index if not exists dependencies_source_idx on task_dependencies(source_type, source_id);
create index if not exists dependencies_target_idx on task_dependencies(target_type, target_id);

-- =====================
-- AGENT SKILLS
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,

  -- Skill information
  skill_name text not null, -- e.g., "React", "Python", "Database Design"
  skill_category text, -- e.g., "frontend", "backend", "devops"
  proficiency_level integer check (proficiency_level >= 1 and proficiency_level <= 5) default 3,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure unique skill per agent
  unique(agent_id, skill_name)
);

-- Enable RLS
alter table agent_skills enable row level security;

-- RLS Policies
drop policy if exists "Users can view their agent skills" on agent_skills;
create policy "Users can view their agent skills" on agent_skills
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their agent skills" on agent_skills;
create policy "Users can insert their agent skills" on agent_skills
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their agent skills" on agent_skills;
create policy "Users can update their agent skills" on agent_skills
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their agent skills" on agent_skills;
create policy "Users can delete their agent skills" on agent_skills
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_skills_user_id_idx on agent_skills(user_id);
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_skill_name_idx on agent_skills(skill_name);

-- =====================
-- AGENT PERFORMANCE METRICS
-- =====================
create table if not exists agent_performance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,

  -- Performance metrics
  tasks_completed integer default 0,
  tasks_on_time integer default 0,
  tasks_delayed integer default 0,
  average_completion_time_hours decimal(8,2),
  success_rate decimal(5,2), -- Percentage

  -- Workload tracking
  current_assigned_tasks integer default 0,
  current_workload_hours decimal(6,2) default 0,

  -- Time period for these metrics
  period_start timestamp with time zone,
  period_end timestamp with time zone,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- One performance record per agent per period
  unique(agent_id, period_start, period_end)
);

-- Enable RLS
alter table agent_performance enable row level security;

-- RLS Policies
drop policy if exists "Users can view their agent performance" on agent_performance;
create policy "Users can view their agent performance" on agent_performance
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their agent performance" on agent_performance;
create policy "Users can insert their agent performance" on agent_performance
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their agent performance" on agent_performance;
create policy "Users can update their agent performance" on agent_performance
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their agent performance" on agent_performance;
create policy "Users can delete their agent performance" on agent_performance
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_performance_user_id_idx on agent_performance(user_id);
create index if not exists agent_performance_agent_id_idx on agent_performance(agent_id);

-- =====================
-- AI BREAKDOWN HISTORY
-- =====================
-- Track AI-generated breakdowns for auditing and improvement
create table if not exists breakdown_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Input information
  input_type text not null check (input_type in ('issue', 'prd', 'screenshot', 'text')),
  input_content text not null,

  -- Generated breakdown
  generated_epics jsonb,
  generated_tickets jsonb,
  generated_subtasks jsonb,
  generated_dependencies jsonb,

  -- Metadata
  model_used text,
  processing_time_ms integer,
  user_accepted boolean default false,
  user_feedback text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table breakdown_history enable row level security;

-- RLS Policies
drop policy if exists "Users can view their breakdown history" on breakdown_history;
create policy "Users can view their breakdown history" on breakdown_history
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their breakdown history" on breakdown_history;
create policy "Users can insert their breakdown history" on breakdown_history
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their breakdown history" on breakdown_history;
create policy "Users can update their breakdown history" on breakdown_history
  for update using (auth.uid() = user_id);

-- Index
create index if not exists breakdown_history_user_id_idx on breakdown_history(user_id);

-- =====================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================

-- Trigger for epics
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- Trigger for tickets
drop trigger if exists update_tickets_updated_at on tickets;
create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();

-- Trigger for subtasks
drop trigger if exists update_subtasks_updated_at on subtasks;
create trigger update_subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- Trigger for agent_skills
drop trigger if exists update_agent_skills_updated_at on agent_skills;
create trigger update_agent_skills_updated_at
  before update on agent_skills
  for each row
  execute function update_updated_at_column();

-- Trigger for agent_performance
drop trigger if exists update_agent_performance_updated_at on agent_performance;
create trigger update_agent_performance_updated_at
  before update on agent_performance
  for each row
  execute function update_updated_at_column();

-- =====================
-- HELPER VIEWS
-- =====================

-- View to get task hierarchy with all levels
create or replace view task_hierarchy as
select
  'epic' as level,
  e.id,
  e.epic_id as display_id,
  e.title,
  e.status,
  e.priority,
  null::uuid as parent_id,
  e.user_id
from epics e
union all
select
  'ticket' as level,
  t.id,
  t.ticket_id as display_id,
  t.title,
  t.status,
  t.priority,
  t.epic_id as parent_id,
  t.user_id
from tickets t
union all
select
  'subtask' as level,
  s.id,
  s.subtask_id as display_id,
  s.title,
  s.status,
  null::integer as priority,
  s.ticket_id as parent_id,
  s.user_id
from subtasks s;

-- View to get agent workload summary
create or replace view agent_workload_summary as
select
  a.id as agent_id,
  a.name as agent_name,
  a.user_id,
  count(distinct t.id) as active_tickets,
  count(distinct s.id) as active_subtasks,
  coalesce(sum(t.estimated_hours), 0) + coalesce(sum(s.estimated_minutes), 0) / 60.0 as total_estimated_hours,
  ap.success_rate,
  ap.average_completion_time_hours
from agents a
left join tickets t on t.assigned_agent_id = a.id and t.status not in ('done')
left join subtasks s on s.assigned_agent_id = a.id and s.status not in ('done')
left join agent_performance ap on ap.agent_id = a.id
group by a.id, a.name, a.user_id, ap.success_rate, ap.average_completion_time_hours;
