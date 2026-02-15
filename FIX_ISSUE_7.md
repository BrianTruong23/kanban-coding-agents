# Fix for Issue #7: Newly Added Tasks Not Appearing on Kanban Board

## Root Cause

The issue was caused by a missing `sprint` column in the database schema. The sprint feature was added to the application code (UI, types, and hooks) in commit `d014940`, but the database schema was not updated to include the `sprint` column.

When users tried to add a new task with a sprint value, the database insert operation would fail or ignore the sprint field because the column didn't exist in the database, which could cause the entire task creation to fail or behave unexpectedly.

## What Was Fixed

### 1. Updated Database Schema (`database/schema.sql`)

**Changes made:**
- Added `sprint text` column to the tasks table creation statement (line 74)
- Added sprint column migration check in the MIGRATION section (lines 118-121)
- Added index for sprint column for better query performance (line 155)

### 2. Created Migration File (`database/migrations/add_sprint_column.sql`)

A standalone migration file that can be run on existing databases to add the missing sprint column.

### 3. Created Migration README (`database/migrations/README.md`)

Documentation explaining how to apply migrations and what each migration does.

## How to Apply the Fix

### For New Installations
Simply run the updated `database/schema.sql` file in your Supabase SQL Editor. The sprint column will be created automatically.

### For Existing Installations
Run the migration file to add the sprint column to your existing database:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `database/migrations/add_sprint_column.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

The migration is safe to run multiple times - it checks if the column exists before adding it.

## Verification

After applying the fix, you should be able to:
1. Navigate to the Kanban board
2. Fill out the form to add a new task (with or without a sprint value)
3. Submit the form
4. The new task should immediately appear in the appropriate column on the board

## Technical Details

The application code in the following files already had support for the sprint field:
- `src/types/task.ts` - Task interface includes optional sprint field
- `src/hooks/useTasks.ts` - CRUD operations handle sprint field
- `src/components/KanbanBoard.tsx` - UI for sprint filtering and task creation

The only missing piece was the database schema, which has now been corrected.
