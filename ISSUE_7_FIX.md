# Fix for Issue #7: Tasks Not Appearing on Kanban Board

## Problem

Newly added tasks were not appearing on the Kanban board after creation. The issue was caused by a missing database column that was added in the code but never added to the database schema.

## Root Cause

When the sprint feature was added in commit `d014940`, the code was updated to include a `sprint` field on tasks, but the database schema was not updated accordingly. This caused the following issues:

1. The `tasks` table in Supabase was missing the `sprint` column
2. When users tried to create tasks with a sprint value, the database insert would fail
3. The error was being caught and displayed, but users without sprints would still encounter issues
4. The `assigned_agent_id` column was also missing from the initial table definition

## Solution

### 1. Updated Database Schema (`database/schema.sql`)

Added the missing columns to the `tasks` table definition:
- `sprint text` - For sprint organization
- `assigned_agent_id uuid references agents(id) on delete set null` - For agent assignment

Added migration code to add the `sprint` column if it doesn't exist:
```sql
-- sprint
if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
  alter table tasks add column sprint text;
end if;
```

### 2. Created Migration File (`database/migrations/003_add_sprint_column.sql`)

Created a standalone migration file that users can run on existing databases to add the sprint column without having to re-run the entire schema.

### 3. Added Database Documentation (`database/README.md`)

Created comprehensive documentation for:
- Initial database setup instructions
- Migration process
- Troubleshooting common issues
- How to verify the sprint column exists

### 4. Updated Main README

Updated the main `README.md` to include:
- Database setup instructions
- Environment variable configuration
- Sprint feature documentation
- Comprehensive troubleshooting section for the "tasks not appearing" issue
- Updated features list to reflect Supabase integration

## Files Changed

1. `database/schema.sql` - Added `sprint` and `assigned_agent_id` columns
2. `database/migrations/003_add_sprint_column.sql` - New migration file
3. `database/README.md` - New documentation file
4. `README.md` - Updated with database setup and troubleshooting

## How Users Should Fix This

### For New Installations
Run the updated `database/schema.sql` in the Supabase SQL Editor. It now includes the sprint column and will create it automatically.

### For Existing Installations
Run the migration file `database/migrations/003_add_sprint_column.sql` in the Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/migrations/003_add_sprint_column.sql
-- into your Supabase SQL Editor and run it
```

### Verification
After applying the fix, verify the column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'sprint';
```

You should see one row returned with:
- `column_name`: sprint
- `data_type`: text

## Testing

After applying this fix:
1. Tasks should now be created successfully
2. Tasks with sprint values should appear on the board
3. The sprint filter should work correctly
4. No errors should appear in the browser console when creating tasks

## Prevention

To prevent this issue in the future:
1. Always update `database/schema.sql` when adding new columns to the code
2. Create migration files in `database/migrations/` for existing databases
3. Update documentation to reflect schema changes
4. Test with a fresh database to ensure schema is complete
