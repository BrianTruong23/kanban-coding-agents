# Database Migration Guide

This guide helps you set up the budget and resource management tables in your Supabase database.

## Prerequisites

- A Supabase project with the main schema already set up (from `schema.sql`)
- Access to the Supabase SQL Editor
- Basic understanding of SQL

## Migration Steps

### Step 1: Apply Main Schema (if not already done)

If you haven't already set up the main database schema, run this first:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the contents of `database/schema.sql`
5. Paste into the SQL editor
6. Click "Run" or press Ctrl/Cmd + Enter
7. Verify no errors in the results panel

### Step 2: Apply Budget Schema

Now apply the budget management schema:

1. In the Supabase SQL Editor, create a new query
2. Copy the contents of `database/budget_schema.sql`
3. Paste into the SQL editor
4. Click "Run" or press Ctrl/Cmd + Enter
5. Verify the following tables were created:
   - `budgets`
   - `budget_usage_entries`
   - `budget_alerts`

### Step 3: Verify Tables and Policies

Check that tables were created with proper Row Level Security:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- - agents
-- - budget_alerts
-- - budget_usage_entries
-- - budgets
-- - tasks
```

Check RLS policies:

```sql
-- List RLS policies for budget tables
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('budgets', 'budget_usage_entries', 'budget_alerts')
ORDER BY tablename, policyname;

-- Each table should have policies for: SELECT, INSERT, UPDATE, DELETE
```

### Step 4: Test Database Functions

Test that triggers and functions are working:

```sql
-- Test 1: Create a test budget (replace with your user_id and task_id)
INSERT INTO budgets (user_id, task_id, max_cost, max_tokens, max_time, max_retries)
VALUES (
  auth.uid(),  -- Your user ID
  (SELECT id FROM tasks LIMIT 1),  -- A task ID
  10.00,       -- $10 max cost
  100000,      -- 100K tokens
  60,          -- 60 minutes
  3            -- 3 retries
)
RETURNING *;

-- Test 2: Add a usage entry (replace budget_id and task_id)
INSERT INTO budget_usage_entries (
  budget_id,
  task_id,
  cost_incurred,
  tokens_used,
  time_spent,
  operation,
  success
)
VALUES (
  'your-budget-id',  -- Budget ID from Test 1
  'your-task-id',    -- Task ID
  0.50,              -- $0.50 spent
  5000,              -- 5000 tokens used
  5,                 -- 5 minutes
  'Test operation',
  true
)
RETURNING *;

-- Test 3: Verify budget was updated automatically
SELECT * FROM budgets WHERE id = 'your-budget-id';
-- current_cost should be 0.50
-- current_tokens should be 5000
-- current_time should be 5

-- Test 4: Check if alerts were generated
SELECT * FROM budget_alerts WHERE budget_id = 'your-budget-id';

-- Clean up test data
DELETE FROM budget_usage_entries WHERE budget_id = 'your-budget-id';
DELETE FROM budgets WHERE id = 'your-budget-id';
```

### Step 5: Verify Indexes

Check that indexes were created for performance:

```sql
-- List indexes for budget tables
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('budgets', 'budget_usage_entries', 'budget_alerts')
ORDER BY tablename, indexname;

-- Expected indexes:
-- budgets: user_id_idx, task_id_idx, status_idx
-- budget_usage_entries: budget_id_idx, task_id_idx, agent_id_idx, created_at_idx
-- budget_alerts: budget_id_idx, task_id_idx, alert_type_idx, acknowledged_idx
```

## Common Issues and Solutions

### Issue 1: "permission denied for table budgets"

**Cause**: RLS policies not correctly set up or user not authenticated.

**Solution**:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('budgets', 'budget_usage_entries', 'budget_alerts');

-- Re-apply RLS policies from budget_schema.sql
```

### Issue 2: "function update_budget_usage() does not exist"

**Cause**: Trigger function not created properly.

**Solution**:
```sql
-- Verify function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'update_budget_usage';

-- If missing, re-run the CREATE FUNCTION section from budget_schema.sql
```

### Issue 3: Budget not updating after usage entry

**Cause**: Trigger not firing or function has an error.

**Solution**:
```sql
-- Check if trigger exists
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname = 'on_budget_usage_entry_created';

-- Check for errors in Supabase logs
-- Re-apply the trigger from budget_schema.sql if needed
```

### Issue 4: Alerts not being generated

**Cause**: Alert generation logic in trigger function may have failed silently.

**Solution**:
```sql
-- Manually test alert creation
INSERT INTO budget_alerts (
  budget_id,
  task_id,
  alert_type,
  budget_type,
  message,
  threshold,
  current_usage,
  limit_value
)
VALUES (
  'your-budget-id',
  'your-task-id',
  'warning',
  'cost',
  'Test alert',
  80.00,
  8.00,
  10.00
);

-- If this works, the trigger function may need debugging
-- Check Supabase logs for function errors
```

## Rollback (If Needed)

If you need to remove the budget tables:

```sql
-- WARNING: This will delete all budget data!

-- Drop tables (cascade removes dependencies)
DROP TABLE IF EXISTS budget_alerts CASCADE;
DROP TABLE IF EXISTS budget_usage_entries CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_budget_usage() CASCADE;
```

## Next Steps

After successful migration:

1. ✅ Budget tables created
2. ✅ RLS policies active
3. ✅ Triggers working
4. ✅ Indexes created

You can now:
- Use the Budget Manager in the application
- Create budgets for tasks
- Track resource usage
- Receive budget alerts

See [BUDGET_MANAGEMENT.md](../BUDGET_MANAGEMENT.md) for usage instructions.

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify your user is authenticated (auth.uid() returns a valid UUID)
3. Ensure the main schema was applied first
4. Check that you have the required permissions in Supabase
5. Open an issue on GitHub with error details
