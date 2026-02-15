# Database Setup

This directory contains the database schema and migrations for the Kanban Coding Agents application.

## Initial Setup

If you're setting up the database for the first time, run the main schema file in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
-- File: database/schema.sql
```

The `schema.sql` file includes:
- Table definitions (agents, tasks)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-updating timestamps
- Default agent creation for new users

## Migrations

If you already have an existing database, run the migration files in order:

1. **001_add_budgets.sql** - Adds budget tracking tables
2. **002_add_task_breakdown.sql** - Adds task breakdown functionality
3. **003_add_sprint_column.sql** - Adds sprint field to tasks table

To apply a migration, run the SQL file in your Supabase SQL Editor:

```sql
-- Run each migration file in order
-- Example: database/migrations/003_add_sprint_column.sql
```

## Common Issues

### Tasks not appearing after creation

If newly created tasks are not appearing on the Kanban board, it's likely due to missing database columns. Make sure you've run all migrations, especially:

- **003_add_sprint_column.sql** - Required for sprint functionality

To verify the sprint column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'sprint';
```

If the column doesn't exist, run migration 003_add_sprint_column.sql.

### Row Level Security (RLS)

All tables use Row Level Security to ensure users can only access their own data. If you're experiencing permission issues:

1. Verify RLS is enabled on the tables
2. Check that the RLS policies exist
3. Ensure you're authenticated when making queries

## Updating the Schema

When making schema changes:

1. Update `schema.sql` with the new column/table definition
2. Add the column to the migration section in `schema.sql`
3. Create a new migration file in `migrations/` directory
4. Update this README with migration instructions
