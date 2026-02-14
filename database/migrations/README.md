# Database Migrations

This directory contains database migration scripts for the Kanban board application.

## How to Apply Migrations

If you already have the database set up and are experiencing issues with tasks not appearing, you may need to apply these migrations.

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the migration file (e.g., `add_sprint_column.sql`)
4. Copy and paste the SQL into the editor
5. Click "Run" to execute the migration

### Option 2: Re-run the main schema

If you prefer, you can simply re-run the main `schema.sql` file, which includes all necessary migrations in the `do $$` blocks. This is safe to run multiple times as all migrations are idempotent (they check if changes already exist before applying them).

## Migration Files

- `add_sprint_column.sql` - Adds the sprint column to the tasks table (required for sprint filtering feature)

## Troubleshooting

If you're experiencing issues with tasks not appearing after creation:

1. Check the browser console for errors
2. Verify that the `sprint` column exists in your `tasks` table
3. Run the `add_sprint_column.sql` migration if needed
4. Clear your browser cache and reload the application
