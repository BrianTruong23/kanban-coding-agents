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
