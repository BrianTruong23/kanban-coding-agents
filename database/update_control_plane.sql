-- Supabase migration for the control-plane changes
-- Safe to run against an existing project that already has `agents` and `tasks`.

-- =====================
-- AGENTS TABLE UPDATES
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'slug') then
    alter table agents add column slug text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'agent_type') then
    alter table agents add column agent_type text not null default 'manual';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'transport') then
    alter table agents add column transport text not null default 'web';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'runtime_location') then
    alter table agents add column runtime_location text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'telegram_bot') then
    alter table agents add column telegram_bot text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'status') then
    alter table agents add column status text not null default 'offline';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'api_key_hash') then
    alter table agents add column api_key_hash text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'api_key_preview') then
    alter table agents add column api_key_preview text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'agents' and column_name = 'last_seen_at') then
    alter table agents add column last_seen_at timestamp with time zone;
  end if;

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

create unique index if not exists agents_user_slug_idx on agents(user_id, slug) where slug is not null;
create unique index if not exists agents_api_key_hash_idx on agents(api_key_hash) where api_key_hash is not null;

grant all on table agents to postgres, service_role;

-- =====================
-- TASKS TABLE UPDATES
-- =====================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'assigned_agent_id') then
    alter table tasks add column assigned_agent_id uuid references agents(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
    alter table tasks add column sprint text;
  end if;
end $$;

alter table tasks drop constraint if exists tasks_status_check;
alter table tasks add constraint tasks_status_check check (status in ('backlog', 'in-progress', 'review', 'done'));

create index if not exists tasks_assigned_agent_idx on tasks(assigned_agent_id);
grant all on table tasks to postgres, service_role;

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
-- TASK UPDATED_AT TRIGGER
-- =====================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_tasks_updated_at on tasks;
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();
