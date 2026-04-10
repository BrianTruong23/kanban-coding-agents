# Supabase Update Guide

This project now expects the database to support a control-plane model:

- richer `agents` records
- `tasks.assigned_agent_id` and `tasks.sprint`
- a new `agent_messages` table

If your Supabase currently only has basic `agents` and `tasks`, run the migration below first.

## SQL To Run

Use [`database/update_control_plane.sql`](/Users/tht0021/Documents/kanban-coding-agents/database/update_control_plane.sql).

If you want the exact SQL inline, paste this into the Supabase SQL editor:

```sql
-- Supabase migration for the control-plane changes
-- Safe to run against an existing project that already has `agents` and `tasks`.

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
```

## Verify The Update

Run these checks in Supabase SQL editor:

```sql
select column_name
from information_schema.columns
where table_name = 'agents'
order by ordinal_position;
```

You should see these newer `agents` columns:

- `slug`
- `agent_type`
- `transport`
- `runtime_location`
- `telegram_bot`
- `status`
- `api_key_hash`
- `api_key_preview`
- `last_seen_at`
- `metadata`

Check `tasks`:

```sql
select column_name
from information_schema.columns
where table_name = 'tasks'
order by ordinal_position;
```

You should see:

- `sprint`
- `assigned_agent_id`

Check the new table:

```sql
select table_name
from information_schema.tables
where table_name = 'agent_messages';
```

## One-Time Agent Key

The one-time key is not created in SQL.

It is created in the web app when you:

1. log into the app
2. click `Add Agent`
3. submit the new external agent form

What happens:

- the browser generates a random raw key
- the app hashes it in the browser
- only the hash is stored in `agents.api_key_hash`
- a short preview goes to `agents.api_key_preview`
- the full raw key is shown once in the UI

So:

- SQL prepares the database
- the UI generates the actual one-time key

## Local Env Required

Your app still needs:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The service role key is required for the server-side external-agent API.
