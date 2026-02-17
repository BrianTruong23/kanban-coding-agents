# Fix for Issue #7: Newly Added Tasks Not Appearing on Kanban Board

## Problem Summary

Tasks were not appearing on the Kanban board after creation due to a **missing database column** (`sprint`). The application code was trying to insert tasks with a `sprint` field, but the database schema did not include this column, causing database insertions to fail silently or the data to be rejected.

## Root Cause

The sprint feature was added to the application code in PR #6 (commit d014940) but the database schema was never updated to include the `sprint` column. This meant:

1. When users created tasks with a sprint assigned, the database insert would fail or ignore the sprint field
2. The `addTask` function in `useTasks.ts` was trying to insert `sprint` data into a non-existent column
3. This caused tasks to either not be created at all, or created without the sprint data, leading to inconsistent state

## Changes Made

### 1. Updated Database Schema (`database/schema.sql`)

**Added `sprint` column to the tasks table definition:**
```sql
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id text not null,
  title text not null,
  description text,
  status text not null default 'backlog',
  sprint text,  -- ← ADDED THIS LINE
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  tags text[] default '{}',
  comments_count integer default 0,
  attachments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Added sprint column to the migration block:**
```sql
-- sprint
if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
  alter table tasks add column sprint text;
end if;
```

### 2. Created Migration Script (`database/migrations/001_add_sprint_column.sql`)

Created a standalone migration script that users with existing databases can run to add the sprint column without having to recreate their database.

### 3. Added Migration Documentation (`database/migrations/README.md`)

Created documentation explaining:
- How to apply migrations
- When migrations are needed
- Migration order and safety

## How to Apply the Fix

### For New Installations

Simply run the updated `database/schema.sql` file in your Supabase SQL Editor. The schema now includes the sprint column.

### For Existing Installations

Run the migration script:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `database/migrations/001_add_sprint_column.sql`
3. Paste and execute in the SQL Editor
4. Verify the migration completed successfully

The migration is idempotent (safe to run multiple times).

## Verification

After applying the fix:

1. ✅ New tasks can be created with or without a sprint
2. ✅ Tasks appear immediately on the Kanban board after creation
3. ✅ Sprint filtering works correctly
4. ✅ No console errors when creating tasks
5. ✅ Code passes linting (`npm run lint`)

## Related Code

The fix aligns the database schema with the application code in:
- `src/hooks/useTasks.ts` (lines 31, 93) - sprint field mapping and insertion
- `src/components/KanbanBoard.tsx` (lines 32, 69) - sprint input and task creation
- `src/types/task.ts` (line 9) - sprint type definition

## Prevention

To prevent similar issues in the future:

1. Always update database schema files when adding new fields to the data model
2. Create migration scripts for schema changes
3. Test with a fresh database to ensure schema matches code
4. Document all schema changes in migration files
