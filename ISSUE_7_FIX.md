# Fix for Issue #7: Newly Added Tasks Not Appearing

## Problem

When users added new tasks through the form, the tasks were not appearing on the Kanban board. This was caused by a missing database column.

## Root Cause

The `sprint` field was added to the application code in commit `d014940` (feature/sprint-category-issue-5), but the corresponding database column was never added to the Supabase schema.

When the application tried to insert a new task with the `sprint` field, one of two things happened:
1. The insert failed silently due to the unknown column
2. The insert succeeded but Supabase ignored the `sprint` field, potentially causing issues with the data returned

## Solution

The fix involves updating the database schema to include the `sprint` column in the `tasks` table.

### Files Changed

1. **database/schema.sql**
   - Added `sprint text` to the initial table creation
   - Added migration logic to add the `sprint` column if it doesn't exist

2. **database/migrations/add_sprint_column.sql** (new file)
   - Standalone migration file that can be run to add the sprint column
   - Idempotent - safe to run multiple times

3. **database/README.md** (new file)
   - Documentation on how to set up the database and apply migrations
   - Troubleshooting guide for common issues

### How to Apply the Fix

For users experiencing this issue:

1. Go to your Supabase project's SQL Editor
2. Run the migration script at `database/migrations/add_sprint_column.sql`
3. Refresh your application

Alternatively, run the entire updated schema from `database/schema.sql` (it's idempotent).

### Verification

After applying the migration:
1. Create a new task with or without a sprint value
2. The task should immediately appear in the appropriate column
3. If a sprint was specified, it should be visible on the task card

## Prevention

To prevent similar issues in the future:
- Always update database schema files when adding new fields to the codebase
- Consider using a proper migration system for Supabase
- Add database schema validation tests

## Related Issues

- This is similar to the fix in commit `94ddef4` which addressed Supabase client memoization
- The sprint feature was originally added in commit `d014940` but without the database migration
