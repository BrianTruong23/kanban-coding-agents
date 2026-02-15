# Database Migration Guide

## Sprint Feature Migration

This guide explains how to add the sprint column to your existing Supabase database.

### Migration Steps

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Migration**
   - Execute the updated `schema.sql` file, or run just the sprint-related migration below:

```sql
-- Add sprint column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
  END IF;
END $$;

-- Add index for sprint filtering performance
CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks(sprint);
```

3. **Verify the Migration**
   - Check that the `sprint` column exists:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'tasks' AND column_name = 'sprint';
   ```

### Backward Compatibility

- Existing tasks without a sprint assignment will have `NULL` in the sprint column
- The application handles both `NULL` and empty sprint values gracefully
- No data loss will occur during migration

### What This Migration Adds

1. **New Column**: `sprint` (text, nullable)
2. **Index**: `tasks_sprint_idx` for optimized filtering
3. **UI Support**: Sprint dropdown filter and sprint badges on task cards

### Rollback (If Needed)

If you need to remove the sprint feature:

```sql
-- Remove the sprint column
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;

-- Remove the index
DROP INDEX IF EXISTS tasks_sprint_idx;
```

**Note**: Rolling back will permanently delete all sprint assignments from your tasks.
