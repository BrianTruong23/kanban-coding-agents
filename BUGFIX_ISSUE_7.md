# Bug Fix: Issue #7 - Newly Added Tasks Not Appearing

## Problem

When users added a new task through the form, the task was not appearing in any of the Kanban columns on the website. This was caused by a missing database column.

## Root Cause

The `sprint` column was missing from the `tasks` table in the database schema. When the sprint feature was added in commit d014940, the application code was updated to support sprints, but the database schema was never updated to include the `sprint` column.

When users tried to add a new task (with or without a sprint value), the database insert operation would fail because it attempted to insert data into a non-existent column. This caused the task creation to fail silently or with an error, preventing the task from appearing on the board.

## Solution

The fix includes:

1. **Updated Database Schema** (`database/schema.sql`)
   - Added `sprint text` column to the `tasks` table definition
   - Added migration code to add the `sprint` column to existing databases

2. **Migration File** (`database/migrations/001_add_sprint_column.sql`)
   - Standalone migration file for users with existing databases
   - Safe to run multiple times (idempotent)

3. **Migration Documentation** (`database/migrations/README.md`)
   - Instructions for applying migrations
   - Guidance for database administrators

## How to Apply the Fix

### For New Installations

No action needed. The updated `schema.sql` includes the `sprint` column by default.

### For Existing Databases

You need to add the `sprint` column to your existing database:

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `database/migrations/001_add_sprint_column.sql`
4. Click **Run** to execute the migration

Alternatively, you can run the migration section from the main `schema.sql` file, which will add all missing columns.

## Verification

After applying the fix:

1. Navigate to the Kanban board
2. Click "New Task" or the "Add Task" button
3. Fill out the form with any values
4. Submit the form
5. The new task should now appear in the "TO DO" column

## Files Modified

- `database/schema.sql` - Added `sprint` column to table definition and migration
- `database/migrations/001_add_sprint_column.sql` - New migration file
- `database/migrations/README.md` - New documentation for migrations
