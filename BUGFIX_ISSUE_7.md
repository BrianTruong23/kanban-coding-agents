# Bug Fix: Issue #7 - Newly added tasks do not appear on the Kanban board

## Problem

When users attempted to add new tasks through the form, the tasks were not appearing on the Kanban board. The task creation was failing silently due to a database schema mismatch.

## Root Cause

The `sprint` field was added to the application code in commit `d014940` (feature/sprint-category-issue-5), but the database schema was never updated to include the `sprint` column in the `tasks` table.

When users created a new task with a sprint value, the database insert operation would fail because:
1. The TypeScript code included `sprint: task.sprint || null` in the insert statement
2. The database table didn't have a `sprint` column to receive this value
3. This caused a PostgreSQL error that prevented the task from being created

## Solution

### Files Modified

1. **database/schema.sql**
   - Added `sprint text` column to the `tasks` table definition (line 74)
   - Added migration code to add the `sprint` column to existing databases (lines 118-121)

2. **database/migrations/add_sprint_column.sql** (new file)
   - Standalone migration script for users who need to update existing databases
   - Safe to run multiple times (idempotent)

3. **database/migrations/README.md** (new file)
   - Instructions for applying database migrations
   - Troubleshooting guide

4. **README.md**
   - Updated to reflect Supabase usage instead of LocalStorage
   - Added database setup instructions
   - Added troubleshooting section for common issues

## How to Apply the Fix

### For New Installations

Simply run the updated `database/schema.sql` file in your Supabase SQL Editor. It now includes the `sprint` column and the migration code to handle any missing columns.

### For Existing Installations

You have two options:

**Option 1: Run the migration script**
```sql
-- Copy and paste from database/migrations/add_sprint_column.sql
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'tasks'
    and column_name = 'sprint'
  ) then
    alter table tasks add column sprint text;
  end if;
end $$;
```

**Option 2: Re-run the full schema**

Re-run `database/schema.sql` in its entirety. All migrations are idempotent and safe to run multiple times.

## Testing

After applying the fix:
1. Create a new task with a sprint value (e.g., "Sprint 1")
2. Verify the task appears in the Kanban board
3. Verify the sprint filter works correctly
4. Try creating tasks without a sprint value - should also work

## Prevention

In the future, when adding new optional fields to the TypeScript types:
1. Update the database schema in `database/schema.sql`
2. Add migration code in the `do $$` block
3. Test both with and without the new field populated
4. Update documentation accordingly
