# Database Migrations

This directory contains database migration scripts for the Kanban board application.

## How to Apply Migrations

1. Log into your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the contents of the migration file you need to run
5. Paste it into the SQL Editor
6. Click "Run" to execute the migration

## Available Migrations

### 001_add_sprint_column.sql
Adds the `sprint` column to the `tasks` table to support sprint-based task filtering.

**Required if:** You created your database before the sprint feature was added (before PR #6).

**When to run:** If you're experiencing issues with tasks not appearing after creation, or if sprint filtering is not working properly.

## Migration Order

Migrations should be run in numerical order (001, 002, etc.). Each migration is idempotent, meaning it's safe to run multiple times - it will only make changes if they haven't been applied yet.

## Notes

- All migrations include checks to avoid errors if the changes have already been applied
- The main `schema.sql` file includes all migrations, so new installations don't need to run these separately
- Existing installations should run migrations as they become available
