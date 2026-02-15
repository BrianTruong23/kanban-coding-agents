# Fix for Issue #7: Newly Added Tasks Not Appearing on Kanban Board

## Problem Description
When users added a new task through the form, the task was not appearing in any of the Kanban columns on the website. This prevented users from seeing their newly created tasks.

## Root Cause
The database schema was missing the `sprint` column in the `tasks` table. When the application attempted to create a new task with a sprint value, the database insertion would fail because the column didn't exist, causing the task to not be saved and therefore not appear on the board.

The code in `src/hooks/useTasks.ts` was trying to insert the `sprint` field (line 93):
```typescript
sprint: task.sprint || null,
```

However, the database schema in `database/schema.sql` did not include this column.

## Solution
Added the `sprint` column to the database schema in two places:

### 1. Initial Table Creation
Updated the `CREATE TABLE` statement to include the sprint column:
```sql
create table if not exists tasks (
  ...
  sprint text,
  ...
);
```

### 2. Migration Script
Added a migration block to safely add the column to existing databases:
```sql
-- sprint
if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
  alter table tasks add column sprint text;
end if;
```

## Files Modified
- `database/schema.sql` - Added sprint column to both table creation and migration sections

## Files Created
- `database/add_sprint_column.sql` - Standalone migration file for existing deployments

## How to Apply the Fix

### For New Installations
Simply run the updated `database/schema.sql` in your Supabase SQL Editor.

### For Existing Installations
If you already have a database set up, run the migration file:
```bash
# In Supabase SQL Editor, run:
database/add_sprint_column.sql
```

Or run the entire schema file again (it's idempotent):
```bash
# In Supabase SQL Editor, run:
database/schema.sql
```

## Testing the Fix
After applying the database migration:

1. Navigate to the Kanban board
2. Click "New Task" button
3. Fill out the form with:
   - Task Title: "Test Task"
   - Description: "Testing the fix"
   - Priority: Any value
   - Tags: Any tags (optional)
   - Sprint: "Sprint 1" (optional)
4. Submit the form
5. **Expected Result**: The task should immediately appear in the "TO DO" column

## Additional Notes
- The sprint field is optional - tasks can be created with or without a sprint value
- The application includes sprint filtering functionality that depends on this column
- All other required fields (user_id, task_id, title, description, status, assigned_agent_id, priority, tags, comments_count, attachments_count) were already present in the schema
