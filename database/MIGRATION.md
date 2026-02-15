# Database Migration Instructions

## Issue #7 Fix: Tasks Not Appearing After Creation

### Problem
Tasks were not appearing on the Kanban board after creation because the `sprint` column was missing from the database schema. This was added in the code (Issue #5) but the database migration was not included.

### Solution
Add the missing `sprint` column to the `tasks` table.

### How to Apply

1. **Go to your Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project
   - Go to the SQL Editor

2. **Run the following migration**

```sql
-- Add sprint column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
  END IF;
END $$;
```

3. **Verify the migration**

Run this query to check if the column was added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

You should see `sprint` listed as a `text` column.

### Alternative: Full Schema Reset

If you want to start fresh or apply all migrations at once, you can run the complete schema from `database/schema.sql`:

1. Go to Supabase SQL Editor
2. Copy the entire contents of `database/schema.sql`
3. Paste and execute

**Warning:** This will recreate tables. If you have existing data, use the incremental migration above instead.

### Testing

After applying the migration:

1. Go to your Kanban board application
2. Click "New Task"
3. Fill in the task details (including the sprint field if desired)
4. Submit the form
5. The task should now appear in the appropriate column

### Troubleshooting

**Tasks still not appearing?**

1. Check browser console for errors (F12 > Console)
2. Verify you're logged in (check top-right corner)
3. Verify the migration was applied:
   ```sql
   \d tasks;
   ```
4. Check Row Level Security policies are enabled:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tasks';
   ```

**Permission errors?**

Make sure you're logged in with a valid account. The app uses Row Level Security (RLS) which requires authentication.

### Need Help?

If you continue to experience issues:
1. Check the browser console for specific error messages
2. Open a GitHub issue with the error details
3. Include your Supabase logs if possible
