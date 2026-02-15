# Database Migrations

This folder contains SQL migration files that need to be run on your Supabase database to fix issues or add new features.

## How to Apply Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you need to run
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

## Available Migrations

### add_sprint_column.sql
**Purpose:** Adds the missing `sprint` column to the tasks table.

**When to run:** If you're experiencing issues where newly added tasks are not appearing on the Kanban board, this migration will fix the problem.

**What it does:**
- Adds a `sprint` text column to the tasks table
- Creates an index on the sprint column for better query performance

**Safe to run multiple times:** Yes, the migration checks if the column already exists before adding it.
