# Database Schema and Migrations

This directory contains the database schema and migrations for the Kanban Coding Agents application.

## Initial Setup

If you're setting up the database for the first time:

1. Go to your Supabase project's SQL Editor
2. Copy the contents of `schema.sql`
3. Run it in the SQL Editor

This will create all necessary tables, policies, and triggers.

## Migrations

If you already have the database set up but need to apply updates, run the migration files in the `migrations/` directory.

### Available Migrations

#### `add_sprint_column.sql`

**When to run**: If you're experiencing issues with newly added tasks not appearing on the Kanban board.

**What it does**: Adds the `sprint` column to the `tasks` table. This column was added in a feature update but may be missing from existing databases.

**How to run**:
1. Go to your Supabase project's SQL Editor
2. Copy the contents of `migrations/add_sprint_column.sql`
3. Run it in the SQL Editor
4. The migration is idempotent - it's safe to run multiple times

**Symptoms that indicate you need this migration**:
- Tasks are created successfully but don't appear on the board
- Console errors related to the `sprint` field
- Tasks appear after refreshing the page but not immediately after creation

## Troubleshooting

### Tasks not appearing after creation

This is usually caused by a missing database column that the application code expects. Common solutions:

1. **Check for missing columns**: Run the latest `schema.sql` or the specific migration for the missing column
2. **Verify RLS policies**: Ensure Row Level Security policies allow the user to SELECT the tasks they insert
3. **Check browser console**: Look for Supabase errors that might indicate permission or schema issues

### Permission issues

If you see permission errors:

1. Verify your Supabase project URL and anon key are correct in `.env.local`
2. Check that RLS policies are properly configured (they should allow users to access their own data)
3. Ensure the user is authenticated before performing database operations

## Database Structure

### Tables

- **agents**: Stores coding agent profiles
- **tasks**: Stores task items with status, priority, tags, sprint, etc.

### Key Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic timestamps**: `created_at` and `updated_at` are managed automatically
- **Default agents**: New users automatically get 5 default coding agents via a trigger
- **Referential integrity**: Tasks can reference agents; deleting an agent sets the task's `assigned_agent_id` to NULL
