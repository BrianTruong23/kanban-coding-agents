-- Orchestration and Task Breakdown Database Schema
-- Run this SQL in your Supabase SQL Editor

-- =====================
-- TASK BREAKDOWN TABLE
-- =====================
create table if not exists task_breakdown (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  type text not null check (type in ('epic', 'ticket', 'subtask')),
  parent_id uuid references task_breakdown(id) on delete cascade,
  definition_of_done jsonb default '[]'::jsonb,
  test_notes jsonb default '[]'::jsonb,
  risk_flags jsonb default '[]'::jsonb,
  estimated_hours numeric,
  actual_hours numeric,
  acceptance_criteria text[] default '{}',
  technical_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table task_breakdown enable row level security;

-- Grants
grant all on table task_breakdown to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own task breakdowns" on task_breakdown;
create policy "Users can view their own task breakdowns" on task_breakdown
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own task breakdowns" on task_breakdown;
create policy "Users can insert their own task breakdowns" on task_breakdown
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own task breakdowns" on task_breakdown;
create policy "Users can update their own task breakdowns" on task_breakdown
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own task breakdowns" on task_breakdown;
create policy "Users can delete their own task breakdowns" on task_breakdown
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists task_breakdown_user_id_idx on task_breakdown(user_id);
create index if not exists task_breakdown_task_id_idx on task_breakdown(task_id);
create index if not exists task_breakdown_parent_id_idx on task_breakdown(parent_id);
create index if not exists task_breakdown_type_idx on task_breakdown(type);

-- Trigger for auto-update updated_at
drop trigger if exists update_task_breakdown_updated_at on task_breakdown;
create trigger update_task_breakdown_updated_at
  before update on task_breakdown
  for each row
  execute function update_updated_at_column();

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_task_id uuid references tasks(id) on delete cascade not null,
  target_task_id uuid references tasks(id) on delete cascade not null,
  dependency_type text not null check (dependency_type in ('blocks', 'depends-on', 'related-to')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_task_id, target_task_id, dependency_type)
);

-- Enable Row Level Security (RLS)
alter table task_dependencies enable row level security;

-- Grants
grant all on table task_dependencies to postgres, service_role;

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
create index if not exists task_dependencies_user_id_idx on task_dependencies(user_id);
create index if not exists task_dependencies_source_idx on task_dependencies(source_task_id);
create index if not exists task_dependencies_target_idx on task_dependencies(target_task_id);

-- =====================
-- AGENT SKILLS TABLE
-- =====================
create table if not exists agent_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade not null,
  skill_name text not null,
  skill_category text not null check (skill_category in ('frontend', 'backend', 'devops', 'mobile', 'testing', 'design', 'database', 'ai-ml', 'other')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience numeric,
  certifications text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table agent_skills enable row level security;

-- Grants
grant all on table agent_skills to postgres, service_role;

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
create index if not exists agent_skills_user_id_idx on agent_skills(user_id);
create index if not exists agent_skills_agent_id_idx on agent_skills(agent_id);
create index if not exists agent_skills_category_idx on agent_skills(skill_category);

-- Trigger for auto-update updated_at
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
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade unique not null,
  total_tasks_completed integer default 0,
  total_tasks_in_progress integer default 0,
  average_completion_time numeric default 0,
  on_time_delivery_rate numeric default 100 check (on_time_delivery_rate >= 0 and on_time_delivery_rate <= 100),
  quality_score numeric default 100 check (quality_score >= 0 and quality_score <= 100),
  collaboration_score numeric default 100 check (collaboration_score >= 0 and collaboration_score <= 100),
  current_workload integer default 0,
  capacity integer default 5,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table agent_performance_metrics enable row level security;

-- Grants
grant all on table agent_performance_metrics to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own agent performance metrics" on agent_performance_metrics;
create policy "Users can view their own agent performance metrics" on agent_performance_metrics
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent performance metrics" on agent_performance_metrics;
create policy "Users can insert their own agent performance metrics" on agent_performance_metrics
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent performance metrics" on agent_performance_metrics;
create policy "Users can update their own agent performance metrics" on agent_performance_metrics
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent performance metrics" on agent_performance_metrics;
create policy "Users can delete their own agent performance metrics" on agent_performance_metrics
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_performance_metrics_user_id_idx on agent_performance_metrics(user_id);
create index if not exists agent_performance_metrics_agent_id_idx on agent_performance_metrics(agent_id);

-- =====================
-- AGENT AVAILABILITY TABLE
-- =====================
create table if not exists agent_availability (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete cascade unique not null,
  is_available boolean default true,
  available_from timestamp with time zone,
  available_until timestamp with time zone,
  timezone text default 'UTC',
  working_hours jsonb default '{"start": "09:00", "end": "17:00"}'::jsonb,
  days_off text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table agent_availability enable row level security;

-- Grants
grant all on table agent_availability to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own agent availability" on agent_availability;
create policy "Users can view their own agent availability" on agent_availability
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent availability" on agent_availability;
create policy "Users can insert their own agent availability" on agent_availability
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent availability" on agent_availability;
create policy "Users can update their own agent availability" on agent_availability
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent availability" on agent_availability;
create policy "Users can delete their own agent availability" on agent_availability
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists agent_availability_user_id_idx on agent_availability(user_id);
create index if not exists agent_availability_agent_id_idx on agent_availability(agent_id);

-- Trigger for auto-update updated_at
drop trigger if exists update_agent_availability_updated_at on agent_availability;
create trigger update_agent_availability_updated_at
  before update on agent_availability
  for each row
  execute function update_updated_at_column();

-- =====================
-- ASSIGNMENT RULES TABLE
-- =====================
create table if not exists assignment_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  priority integer default 0,
  conditions jsonb default '{}'::jsonb,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table assignment_rules enable row level security;

-- Grants
grant all on table assignment_rules to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own assignment rules" on assignment_rules;
create policy "Users can view their own assignment rules" on assignment_rules
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own assignment rules" on assignment_rules;
create policy "Users can insert their own assignment rules" on assignment_rules
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own assignment rules" on assignment_rules;
create policy "Users can update their own assignment rules" on assignment_rules
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own assignment rules" on assignment_rules;
create policy "Users can delete their own assignment rules" on assignment_rules
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists assignment_rules_user_id_idx on assignment_rules(user_id);
create index if not exists assignment_rules_priority_idx on assignment_rules(priority desc);

-- Trigger for auto-update updated_at
drop trigger if exists update_assignment_rules_updated_at on assignment_rules;
create trigger update_assignment_rules_updated_at
  before update on assignment_rules
  for each row
  execute function update_updated_at_column();

-- =====================
-- ORCHESTRATION CONFIG TABLE
-- =====================
create table if not exists orchestration_config (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  auto_assign_enabled boolean default false,
  consider_workload boolean default true,
  consider_skill_level boolean default true,
  consider_performance boolean default true,
  consider_availability boolean default true,
  min_confidence_threshold numeric default 70 check (min_confidence_threshold >= 0 and min_confidence_threshold <= 100),
  balance_workload boolean default true,
  prioritize_specialization boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table orchestration_config enable row level security;

-- Grants
grant all on table orchestration_config to postgres, service_role;

-- RLS Policies
drop policy if exists "Users can view their own orchestration config" on orchestration_config;
create policy "Users can view their own orchestration config" on orchestration_config
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own orchestration config" on orchestration_config;
create policy "Users can insert their own orchestration config" on orchestration_config
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own orchestration config" on orchestration_config;
create policy "Users can update their own orchestration config" on orchestration_config
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own orchestration config" on orchestration_config;
create policy "Users can delete their own orchestration config" on orchestration_config
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists orchestration_config_user_id_idx on orchestration_config(user_id);

-- Trigger for auto-update updated_at
drop trigger if exists update_orchestration_config_updated_at on orchestration_config;
create trigger update_orchestration_config_updated_at
  before update on orchestration_config
  for each row
  execute function update_updated_at_column();

-- =====================
-- FUNCTION: Initialize agent data for new agents
-- =====================
create or replace function initialize_agent_data()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Create default performance metrics
  insert into agent_performance_metrics (user_id, agent_id)
  values (new.user_id, new.id)
  on conflict (agent_id) do nothing;

  -- Create default availability
  insert into agent_availability (user_id, agent_id)
  values (new.user_id, new.id)
  on conflict (agent_id) do nothing;

  return new;
exception
  when others then
    raise notice 'Error initializing agent data: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to initialize agent data when a new agent is created
drop trigger if exists on_agent_created on agents;
create trigger on_agent_created
  after insert on agents
  for each row
  execute function initialize_agent_data();

-- =====================
-- FUNCTION: Initialize orchestration config for new users
-- =====================
create or replace function initialize_orchestration_config()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Create default orchestration config
  insert into orchestration_config (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    raise notice 'Error initializing orchestration config: %', SQLERRM;
    return new;
end;
$$;

-- Trigger to initialize orchestration config when a new user signs up
drop trigger if exists on_user_created_orchestration on auth.users;
create trigger on_user_created_orchestration
  after insert on auth.users
  for each row
  execute function initialize_orchestration_config();
