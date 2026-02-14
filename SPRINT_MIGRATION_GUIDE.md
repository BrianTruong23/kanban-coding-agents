# Sprint Feature Migration Guide

## Overview
This document explains how to apply the sprint feature database migration to your Supabase instance.

## Database Migration

### Step 1: Access Supabase SQL Editor
1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor

### Step 2: Run the Migration
Execute the following SQL commands in your Supabase SQL Editor:

```sql
-- Add sprint column to tasks table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
  END IF;
END $$;

-- Add index for sprint column (if it doesn't exist)
CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks(sprint);
```

### Step 3: Verify Migration
Run this query to verify the sprint column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'sprint';
```

Expected result:
- column_name: `sprint`
- data_type: `text`
- is_nullable: `YES`

## Features Enabled

After running this migration, the following sprint features will be available:

1. **Sprint Assignment**: Users can assign tasks to sprints during creation
2. **Sprint Filtering**: Filter the kanban board by specific sprints
3. **Sprint Badges**: Visual indicators showing which sprint a task belongs to
4. **Backward Compatibility**: Existing tasks will continue to work (sprint will be null)

## Rollback (Optional)

If you need to rollback this migration:

```sql
-- Remove the sprint index
DROP INDEX IF EXISTS tasks_sprint_idx;

-- Remove the sprint column
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;
```

**Warning**: Rollback will delete all sprint assignments!

## Alternative: Run Complete Schema

Instead of running the migration separately, you can run the complete schema file located at `database/schema.sql`. This file includes all migrations and is idempotent (safe to run multiple times).

## Testing

After migration:
1. Create a new task and assign it to "Sprint 1"
2. Create another task without a sprint
3. Use the sprint filter dropdown to filter by "Sprint 1"
4. Verify only tasks assigned to "Sprint 1" are shown
5. Select "No Sprint" to see tasks without sprint assignment
6. Select "All Sprints" to see all tasks

## Support

If you encounter any issues with the migration, please check:
- Your Supabase PostgreSQL version is up to date
- You have necessary permissions to alter tables
- The tasks table exists before running the migration
