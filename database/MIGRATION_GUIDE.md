# Database Migration Guide

## Sprint Feature Migration

This guide helps you add the sprint field to your existing Supabase database.

### Overview

The sprint feature adds the ability to organize tasks by sprint, allowing you to:
- Assign tasks to specific sprints
- Filter the kanban board by sprint
- Track sprint progress and completion

### Migration Steps

#### Option 1: Run the Full Schema (Recommended)

If you haven't made custom modifications to your database, simply run the entire `database/schema.sql` file in your Supabase SQL Editor. The schema includes idempotent migration blocks that will safely add missing columns without affecting existing data.

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Click "Run" to execute the migration

#### Option 2: Manual Migration (Add Sprint Column Only)

If you prefer to add just the sprint column, run this SQL in your Supabase SQL Editor:

```sql
-- Add sprint column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
    AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks(sprint);
```

### Verification

After running the migration, verify that the sprint column was added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name = 'sprint';
```

Expected output:
```
column_name | data_type
------------+----------
sprint      | text
```

### Backward Compatibility

The sprint field is optional (`sprint?: string` in TypeScript), so:
- ✅ Existing tasks without sprint values will display normally
- ✅ New tasks can be created with or without sprint assignments
- ✅ Tasks can be filtered by "No Sprint" to see tasks without sprint values
- ✅ The feature is fully backward compatible with existing data

### Rollback

If you need to remove the sprint feature:

```sql
-- Remove sprint column (this will delete all sprint data!)
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;

-- Remove sprint index
DROP INDEX IF EXISTS tasks_sprint_idx;
```

**Warning**: Rolling back will permanently delete all sprint assignments from your tasks.

### Support

If you encounter issues during migration:
1. Check your Supabase logs for error messages
2. Ensure you have the necessary permissions to alter tables
3. Verify that the `tasks` table exists in your database
4. Open an issue on the GitHub repository with details about the error
