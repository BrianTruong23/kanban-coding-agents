# Database Migration Guide

This guide explains how to apply database schema updates to your Supabase instance.

## Sprint Feature Migration

The sprint category feature adds the ability to organize tasks by sprint. This requires adding a new `sprint` column to the `tasks` table.

### What's New

- **Sprint Field**: Tasks can now be assigned to sprints (e.g., "Sprint 12", "Q1 2024")
- **Sprint Filtering**: Filter the kanban board to show tasks from specific sprints
- **Sprint Labels**: Visual sprint badges on task cards
- **Sprint Index**: Database index for improved query performance

### Migration Steps

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor section

2. **Run the Migration**
   - Copy the contents of `database/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute the schema update

   The schema file includes idempotent migrations that:
   - Add the `sprint` column if it doesn't exist
   - Create an index on the `sprint` column for faster queries
   - Preserve all existing data

3. **Verify the Migration**
   - Go to the Table Editor
   - Select the `tasks` table
   - Verify that the `sprint` column appears in the schema

### What Happens During Migration

The migration script checks if the `sprint` column already exists before adding it. This means:
- ✅ Safe to run multiple times
- ✅ Won't affect existing data
- ✅ Backward compatible with tasks that don't have a sprint assigned

### Rollback (if needed)

If you need to remove the sprint column:

```sql
-- Remove sprint index
DROP INDEX IF EXISTS tasks_sprint_idx;

-- Remove sprint column
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;
```

**Note**: This will permanently delete all sprint data from your tasks.

## Complete Schema Update

If you're setting up a new database or want to ensure all tables are up to date, simply run the entire `database/schema.sql` file. It includes:

- Tables: `agents`, `tasks`
- Row Level Security policies
- Indexes for performance
- Triggers for automatic timestamp updates
- Default agent creation for new users

## Troubleshooting

### "Column already exists" error
This is expected if you run the migration multiple times. The script includes checks to prevent duplicate columns.

### Permission errors
Make sure you're running the SQL as a Supabase admin user with full database permissions.

### Tasks not showing sprints
- Clear your browser cache
- Verify the migration completed successfully
- Check that your application code is up to date with the latest changes

## Support

If you encounter issues with the migration, please:
1. Check the Supabase logs for detailed error messages
2. Verify your Supabase project has sufficient permissions
3. Create an issue in the GitHub repository with error details
