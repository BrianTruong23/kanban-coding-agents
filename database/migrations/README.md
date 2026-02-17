# Database Migrations

This directory contains SQL migration files for updating your Supabase database schema.

## How to Apply Migrations

If you have an existing database and need to add new features, you'll need to run the migration files in order.

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of each migration file
4. Run the SQL query

## Migration Files

- `001_add_sprint_column.sql` - Adds sprint/iteration tracking support to tasks table

## Notes

- Migrations are designed to be idempotent (safe to run multiple times)
- Each migration checks if changes are already applied before making modifications
- Always backup your database before running migrations in production
