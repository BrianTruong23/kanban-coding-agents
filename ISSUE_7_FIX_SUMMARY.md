# Issue #7 Fix Summary: Newly Added Tasks Not Appearing

## Problem
When users added a new task through the form, the task was not appearing in any of the Kanban columns. The task creation process would fail because the database schema was missing required columns.

## Root Cause
The `tasks` table definition in `database/schema.sql` was incomplete and missing two critical columns:
1. `sprint` - Added in a previous feature (commit d014940) but never added to the base table definition
2. `assigned_agent_id` - Referenced in the app code but missing from the CREATE TABLE statement

When users tried to add a task, the `useTasks.ts` hook would attempt to insert data into these columns, causing the database insert to fail. While there was migration code to add these columns to existing databases, the base CREATE TABLE statement was incomplete, which would cause issues for:
- New database installations
- Database recreations
- Testing environments
- Documentation clarity

## Solution
Updated `database/schema.sql` to include both missing columns in the base `tasks` table definition:

```sql
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id text not null,
  title text not null,
  description text,
  status text not null default 'backlog',
  sprint text,                                                    -- ADDED
  assigned_agent_id uuid references agents(id) on delete set null, -- ADDED
  priority integer not null check (priority >= 1 and priority <= 5) default 3,
  tags text[] default '{}',
  comments_count integer default 0,
  attachments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

Also added the `sprint` column to the migration block to ensure existing databases get updated:

```sql
-- sprint
if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
  alter table tasks add column sprint text;
end if;
```

## Files Modified
- `database/schema.sql` - Added `sprint` and `assigned_agent_id` columns to the base table definition and migration block

## How Users Should Apply This Fix

### For New Installations
No action needed. Simply run the updated `database/schema.sql` file in your Supabase SQL Editor.

### For Existing Databases
You have two options:

**Option 1: Run the full schema (recommended)**
The schema.sql file contains migration code that checks for missing columns and adds them automatically. Simply run the entire schema.sql file - it will safely add any missing columns without affecting existing data.

**Option 2: Run specific migration**
Run the existing migration file at `database/migrations/001_add_sprint_column.sql` if you only need the sprint column. The schema.sql migrations will handle the rest.

## Verification Steps
After applying the fix:

1. Navigate to the Kanban board
2. Click "New Task" button
3. Fill out the form with:
   - Title: "Test Task"
   - Description: "Testing the fix"
   - Priority: Any value
   - Tags: "test"
   - Sprint: "Sprint 1" (optional)
4. Submit the form
5. **Expected Result**: The new task should immediately appear in the "TO DO" column
6. Try adding another task with different values to confirm consistency

## Technical Details

### Why the Bug Occurred
1. Feature was added in commit d014940 to support sprint filtering
2. Application code (`useTasks.ts`, `KanbanBoard.tsx`) was updated to use the sprint field
3. Migration file was created (`001_add_sprint_column.sql`)
4. **BUT** the base table definition in `schema.sql` was never updated
5. The `assigned_agent_id` column had the same issue from an earlier feature addition

### Code Flow
1. User fills form in `KanbanBoard.tsx` (lines 46-90)
2. Form calls `onAddTask(newTask)`
3. This triggers `useTasks.ts` `addTask` function (lines 80-113)
4. `addTask` attempts to insert into Supabase with all fields including `sprint` and `assigned_agent_id`
5. If columns don't exist in database, insert fails
6. Error is caught and displayed to user (line 103-105)
7. Task list is not updated, so task doesn't appear on board

### Why It Works Now
- The base CREATE TABLE statement now includes all columns the application expects
- Migration code ensures existing databases get updated
- New installations have the correct schema from the start
- All deployment scenarios are covered
