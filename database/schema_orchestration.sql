-- Extended schema for Task Breakdown and Agent Orchestration features
-- Run this after running the main schema.sql

-- =====================
-- EPICS TABLE
-- =====================
create table if not exists epics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'planned' check (status in ('planned', 'in-progress', 'completed', 'cancelled')),
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
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
create index if not exists epics_status_idx on epics(status);

-- =====================
-- TICKETS TABLE (Enhanced Tasks)
-- =====================
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  epic_id uuid references epics(id) on delete cascade,
  ticket_id text not null, -- Display ID like "TICKET-1"
  title text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog', 'in-progress', 'review', 'done')),
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  assigned_agent_id uuid references agents(id) on delete set null,
  definition_of_done text[] default '{}',
  test_notes text,
  estimated_hours numeric,
  sprint text,
  tags text[] default '{}',
  dependencies text[] default '{}', -- Array of ticket IDs this depends on
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table tickets enable row level security;

-- Grants for tickets table
grant all on table tickets to postgres, service_role;

-- RLS Policies for tickets
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

-- Indexes for faster queries
create index if not exists tickets_user_id_idx on tickets(user_id);
create index if not exists tickets_epic_id_idx on tickets(epic_id);
create index if not exists tickets_status_idx on tickets(status);
create index if not exists tickets_assigned_agent_idx on tickets(assigned_agent_id);
create index if not exists tickets_sprint_idx on tickets(sprint);

-- =====================
-- RISK FLAGS TABLE
-- =====================
create table if not exists risk_flags (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  risk_type text not null check (risk_type in ('technical', 'timeline', 'dependency', 'resource', 'security', 'performance')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null,
  mitigation_plan text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table risk_flags enable row level security;

-- Grants for risk_flags table
grant all on table risk_flags to postgres, service_role;

-- RLS Policies for risk_flags (inherit from ticket)
drop policy if exists "Users can view risk flags for their tickets" on risk_flags;
create policy "Users can view risk flags for their tickets" on risk_flags
  for select using (
    exists (
      select 1 from tickets
      where tickets.id = risk_flags.ticket_id
      and tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert risk flags for their tickets" on risk_flags;
create policy "Users can insert risk flags for their tickets" on risk_flags
  for insert with check (
    exists (
      select 1 from tickets
      where tickets.id = risk_flags.ticket_id
      and tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update risk flags for their tickets" on risk_flags;
create policy "Users can update risk flags for their tickets" on risk_flags
  for update using (
    exists (
      select 1 from tickets
      where tickets.id = risk_flags.ticket_id
      and tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete risk flags for their tickets" on risk_flags;
create policy "Users can delete risk flags for their tickets" on risk_flags
  for delete using (
    exists (
      select 1 from tickets
      where tickets.id = risk_flags.ticket_id
      and tickets.user_id = auth.uid()
    )
  );

-- Index for faster queries
create index if not exists risk_flags_ticket_id_idx on risk_flags(ticket_id);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  category text not null check (category in ('frontend', 'backend', 'devops', 'mobile', 'testing', 'database', 'security', 'ml', 'other')),
  proficiency_level integer not null check (proficiency_level >= 1 and proficiency_level <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table agent_skills enable row level security;

-- Grants for agent_skills table
grant all on table agent_skills to postgres, service_role;

-- RLS Policies for agent_skills (inherit from agent)
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

-- Index for faster queries
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);

-- =====================
-- AGENT PERFORMANCE METRICS (Additional Columns)
-- =====================
do $$
begin
  -- specializations
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'specializations') then
    alter table agents add column specializations text[] default '{}';
  end if;

  -- availability
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'availability') then
    alter table agents add column availability text default 'available' check (availability in ('available', 'busy', 'offline'));
  end if;

  -- max_concurrent_tasks
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'max_concurrent_tasks') then
    alter table agents add column max_concurrent_tasks integer default 3;
  end if;

  -- tasks_completed
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'tasks_completed') then
    alter table agents add column tasks_completed integer default 0;
  end if;

  -- tasks_in_progress
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'tasks_in_progress') then
    alter table agents add column tasks_in_progress integer default 0;
  end if;

  -- average_completion_time
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'average_completion_time') then
    alter table agents add column average_completion_time numeric default 8.0;
  end if;

  -- success_rate
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'success_rate') then
    alter table agents add column success_rate numeric default 1.0 check (success_rate >= 0 and success_rate <= 1);
  end if;

  -- quality_score
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'quality_score') then
    alter table agents add column quality_score numeric default 4.0 check (quality_score >= 0 and quality_score <= 5);
  end if;

  -- workload
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'workload') then
    alter table agents add column workload numeric default 0;
  end if;

  -- last_active
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'last_active') then
    alter table agents add column last_active timestamp with time zone default timezone('utc'::text, now());
  end if;
end $$;

-- =====================
-- MIGRATION: Add sprint column to tasks (if needed for backward compatibility)
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

-- Index for sprint
create index if not exists tasks_sprint_idx on tasks(sprint);

-- =====================
-- TRIGGERS
-- =====================

-- Trigger for tickets updated_at
drop trigger if exists update_tickets_updated_at on tickets;
create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();

-- Trigger for epics updated_at
drop trigger if exists update_epics_updated_at on epics;
create trigger update_epics_updated_at
  before update on epics
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTION: Initialize default skills for existing agents
-- =====================
create or replace function initialize_default_skills()
returns void
language plpgsql
as $$
declare
  agent_record record;
begin
  -- Add default skills based on agent descriptions
  for agent_record in select id, name, description from agents loop
    -- Alex Chen - Frontend specialist
    if agent_record.name = 'Alex Chen' then
      insert into agent_skills (agent_id, skill_name, category, proficiency_level)
      values
        (agent_record.id, 'React', 'frontend', 5),
        (agent_record.id, 'Next.js', 'frontend', 5),
        (agent_record.id, 'TypeScript', 'frontend', 4),
        (agent_record.id, 'CSS', 'frontend', 4)
      on conflict do nothing;

      update agents set specializations = array['UI/UX', 'Frontend Architecture']
      where id = agent_record.id;

    -- Sarah Johnson - Backend specialist
    elsif agent_record.name = 'Sarah Johnson' then
      insert into agent_skills (agent_id, skill_name, category, proficiency_level)
      values
        (agent_record.id, 'Node.js', 'backend', 5),
        (agent_record.id, 'API Design', 'backend', 5),
        (agent_record.id, 'PostgreSQL', 'database', 4),
        (agent_record.id, 'Database', 'database', 4)
      on conflict do nothing;

      update agents set specializations = array['API Development', 'Database Design']
      where id = agent_record.id;

    -- Mike Rodriguez - Full stack
    elsif agent_record.name = 'Mike Rodriguez' then
      insert into agent_skills (agent_id, skill_name, category, proficiency_level)
      values
        (agent_record.id, 'React', 'frontend', 4),
        (agent_record.id, 'Node.js', 'backend', 4),
        (agent_record.id, 'TypeScript', 'frontend', 4),
        (agent_record.id, 'API', 'backend', 3)
      on conflict do nothing;

      update agents set specializations = array['Full Stack', 'System Integration']
      where id = agent_record.id;

    -- Emma Wilson - DevOps
    elsif agent_record.name = 'Emma Wilson' then
      insert into agent_skills (agent_id, skill_name, category, proficiency_level)
      values
        (agent_record.id, 'Docker', 'devops', 5),
        (agent_record.id, 'CI/CD', 'devops', 5),
        (agent_record.id, 'Infrastructure', 'devops', 4),
        (agent_record.id, 'Security', 'security', 3)
      on conflict do nothing;

      update agents set specializations = array['DevOps', 'Cloud Infrastructure']
      where id = agent_record.id;

    -- David Kim - Mobile
    elsif agent_record.name = 'David Kim' then
      insert into agent_skills (agent_id, skill_name, category, proficiency_level)
      values
        (agent_record.id, 'React Native', 'mobile', 5),
        (agent_record.id, 'iOS', 'mobile', 4),
        (agent_record.id, 'Android', 'mobile', 4),
        (agent_record.id, 'Mobile', 'mobile', 5)
      on conflict do nothing;

      update agents set specializations = array['Mobile Development', 'Cross-platform']
      where id = agent_record.id;
    end if;
  end loop;
end;
$$;

-- Run the initialization (can be called manually or in migration)
-- select initialize_default_skills();
