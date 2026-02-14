# Database Migrations

This directory contains database migrations for the Kanban Coding Agents application.

## How to Apply Migrations

### Using Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to the "SQL Editor" from the left sidebar
4. Open the migration file you want to run (e.g., `add_sprint_field.sql`)
5. Copy the entire contents of the migration file
6. Paste it into the SQL Editor
7. Click "Run" to execute the migration

### Migration Files

#### `add_sprint_field.sql`

**Purpose**: Adds the sprint field to the tasks table to support sprint-based task organization.

**What it does**:
- Adds a `sprint` column to the `tasks` table (text type, nullable)
- Creates an index on the `sprint` column for better query performance
- Uses idempotent logic (safe to run multiple times)

**When to run**:
- If you have an existing database without the sprint field
- When upgrading from a version before sprint support was added

**Safe to run**: Yes, this migration checks if the column exists before adding it.

## Verification

After running a migration, you can verify it was successful by:

1. Checking the "Notices" output in the SQL Editor
2. Viewing the table structure in the Supabase Table Editor
3. Running this verification query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name = 'sprint';
```

Expected result:
```
column_name | data_type | is_nullable
------------|-----------|-------------
sprint      | text      | YES
```

## Rollback

If you need to remove the sprint field (not recommended):

```sql
-- Remove the sprint column
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;

-- Remove the index
DROP INDEX IF EXISTS tasks_sprint_idx;
```

⚠️ **Warning**: Removing the sprint column will delete all sprint data and may break the application.
