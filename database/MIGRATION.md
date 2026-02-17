# Database Migration Guide

## Sprint Field Migration

This guide explains how to add the sprint field to your existing Supabase database.

### What's New

The sprint field has been added to the tasks table to support sprint-based task organization and filtering.

### Migration Steps

#### Option 1: Run the Full Schema (Recommended for New Installations)

If you're setting up a new database, simply run the entire `schema.sql` file in your Supabase SQL Editor:

```sql
-- Run the entire database/schema.sql file
```

The schema includes idempotent migrations that will safely add the sprint column if it doesn't exist.

#### Option 2: Manual Migration (For Existing Databases)

If you already have a database and just need to add the sprint field:

1. Open your Supabase project's SQL Editor
2. Run the following migration:

```sql
-- Add sprint column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
  END IF;
END $$;

-- Create index for sprint column (improves query performance)
CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks(sprint);
```

### Verification

After running the migration, verify that the sprint column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'sprint';
```

Expected result:
- column_name: `sprint`
- data_type: `text`
- is_nullable: `YES`

### Data Considerations

- **Backward Compatibility**: The sprint field is optional (nullable), so existing tasks will have `NULL` for the sprint field
- **Default Value**: New tasks without a sprint assignment will also have `NULL`
- **Data Type**: Sprint is stored as `text` to allow flexible naming (e.g., "Sprint 1", "Q1 2026", "Release 1.0")

### Rollback

If you need to remove the sprint field:

```sql
-- Remove sprint column (WARNING: This will delete all sprint data)
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;

-- Remove sprint index
DROP INDEX IF EXISTS tasks_sprint_idx;
```

**Note**: This will permanently delete all sprint assignments. Only use this if you're certain you want to remove the feature.

### Feature Usage

After migration, you can:
- Assign tasks to sprints when creating or editing them
- Filter the kanban board by sprint using the dropdown in the toolbar
- View sprint badges on task cards
- Group tasks by sprint for better organization

### Troubleshooting

**Issue**: Migration fails with "permission denied"
- **Solution**: Ensure you're running the SQL in the Supabase SQL Editor with proper admin privileges

**Issue**: Index creation fails
- **Solution**: The index creation is idempotent. If it fails, check if the index already exists with:
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'tasks' AND indexname = 'tasks_sprint_idx';
  ```

**Issue**: Tasks not showing sprint data
- **Solution**: Clear your browser cache and refresh. The frontend code will handle `NULL` sprint values gracefully.
