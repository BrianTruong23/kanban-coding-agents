-- Kanban Board Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- =====================
-- AGENTS TABLE
-- =====================
create table if not exists agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text,
  description text,
  avatar text,
  avatar_color text,
  agent_type text not null default 'manual',
  transport text not null default 'web',
  runtime_location text,
  telegram_bot text,
  status text not null default 'offline',
  api_key_hash text,
  api_key_preview text,
  last_seen_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
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

  -- slug
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'slug') then
    alter table agents add column slug text;
  end if;

  -- avatar
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'avatar') then
    alter table agents add column avatar text;
  end if;

  -- avatar_color
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'avatar_color') then
    alter table agents add column avatar_color text;
  end if;

  -- agent_type
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'agent_type') then
    alter table agents add column agent_type text not null default 'manual';
  end if;

  -- transport
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'transport') then
    alter table agents add column transport text not null default 'web';
  end if;

  -- runtime_location
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'runtime_location') then
    alter table agents add column runtime_location text;
  end if;

  -- telegram_bot
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'telegram_bot') then
    alter table agents add column telegram_bot text;
  end if;

  -- status
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'status') then
    alter table agents add column status text not null default 'offline';
  end if;

  -- api_key_hash
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'api_key_hash') then
    alter table agents add column api_key_hash text;
  end if;

  -- api_key_preview
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'api_key_preview') then
    alter table agents add column api_key_preview text;
  end if;

  -- last_seen_at
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'last_seen_at') then
    alter table agents add column last_seen_at timestamp with time zone;
  end if;

  -- metadata
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'metadata') then
    alter table agents add column metadata jsonb not null default '{}'::jsonb;
  end if;
end $$;

alter table agents drop constraint if exists agents_agent_type_check;
alter table agents add constraint agents_agent_type_check check (agent_type in ('manual', 'external'));

alter table agents drop constraint if exists agents_transport_check;
alter table agents add constraint agents_transport_check check (transport in ('web', 'telegram', 'http'));

alter table agents drop constraint if exists agents_status_check;
alter table agents add constraint agents_status_check check (status in ('offline', 'online', 'idle', 'busy'));

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
create unique index if not exists agents_user_slug_idx on agents(user_id, slug) where slug is not null;
create unique index if not exists agents_api_key_hash_idx on agents(api_key_hash) where api_key_hash is not null;

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
  sprint text,
  assigned_agent_id uuid references agents(id) on delete set null,
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

  -- sprint
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
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
-- AGENT MESSAGES TABLE
-- =====================
create table if not exists agent_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  from_agent_id uuid references agents(id) on delete set null,
  to_agent_id uuid references agents(id) on delete set null,
  task_id uuid references tasks(id) on delete cascade,
  body text not null,
  channel text not null default 'global',
  created_by text not null default 'user',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table agent_messages drop constraint if exists agent_messages_channel_check;
alter table agent_messages add constraint agent_messages_channel_check check (channel in ('global', 'direct', 'task'));

alter table agent_messages drop constraint if exists agent_messages_created_by_check;
alter table agent_messages add constraint agent_messages_created_by_check check (created_by in ('user', 'agent', 'system'));

alter table agent_messages enable row level security;

grant all on table agent_messages to postgres, service_role;

drop policy if exists "Users can view their own messages" on agent_messages;
create policy "Users can view their own messages" on agent_messages
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own messages" on agent_messages;
create policy "Users can insert their own messages" on agent_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own messages" on agent_messages;
create policy "Users can update their own messages" on agent_messages
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own messages" on agent_messages;
create policy "Users can delete their own messages" on agent_messages
  for delete using (auth.uid() = user_id);

create index if not exists agent_messages_user_id_idx on agent_messages(user_id);
create index if not exists agent_messages_to_agent_id_idx on agent_messages(to_agent_id);
create index if not exists agent_messages_task_id_idx on agent_messages(task_id);
create index if not exists agent_messages_created_at_idx on agent_messages(created_at desc);

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
