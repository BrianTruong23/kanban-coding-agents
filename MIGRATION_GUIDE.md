# Migration Guide: Task Orchestration Features

This guide helps you upgrade your existing Kanban Coding Agents application to include the new task orchestration features.

## Overview

The new features add:
- 4 new database tables
- Several new columns to the existing `tasks` table
- Enhanced agent and task management capabilities
- AI-powered task breakdown
- Dependency tracking
- Performance metrics

## Step-by-Step Migration

### Step 1: Backup Your Data

Before making any changes, backup your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to Database → Backups
3. Create a manual backup or export your data

### Step 2: Run Database Migrations

1. Open your Supabase SQL Editor
2. Copy the contents of `database/schema.sql`
3. Paste and execute the SQL script

The script is **idempotent** (safe to run multiple times) and includes:
- `CREATE TABLE IF NOT EXISTS` statements
- `DO $$ BEGIN ... IF NOT EXISTS ...` blocks for new columns
- Proper error handling

### Step 3: Verify New Tables

After running the migration, verify these new tables exist:

```sql
-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('epics', 'agent_skills', 'agent_performance', 'task_dependencies');
```

You should see all 4 tables listed.

### Step 4: Verify New Columns in Tasks Table

Check that new columns were added to the tasks table:

```sql
-- Check new columns in tasks table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN (
  'epic_id',
  'parent_task_id',
  'definition_of_done',
  'test_notes',
  'risk_level',
  'risk_flags',
  'estimated_hours'
);
```

You should see all 7 new columns.

### Step 5: Verify RLS Policies

Check that Row Level Security policies are active:

```sql
-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('epics', 'agent_skills', 'agent_performance', 'task_dependencies');
```

Each table should have policies for SELECT, INSERT, UPDATE, and DELETE operations.

### Step 6: Test Default Agent Skills

The migration automatically creates default skills for existing agents. To verify:

```sql
-- Check agent skills
SELECT a.name, s.skill_name, s.skill_level
FROM agents a
LEFT JOIN agent_skills s ON a.id = s.agent_id
ORDER BY a.name, s.skill_name;
```

Each of your 5 default agents should have 5 skills assigned.

### Step 7: Update Your Application Code

If you have existing code that queries tasks, you may need to update your queries to include the new fields:

**Before:**
```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId);
```

**After (to include epic information):**
```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    epic:epics(epic_id, title),
    dependencies:task_dependencies(depends_on_task_id),
    parent_task:tasks!parent_task_id(task_id, title)
  `)
  .eq('user_id', userId);
```

### Step 8: Optional - Populate Historical Performance Data

If you have existing completed tasks, you can create performance records:

```sql
-- Create performance records for completed tasks
INSERT INTO agent_performance (user_id, agent_id, task_id, quality_score, completed_at)
SELECT
  t.user_id,
  t.assigned_agent_id,
  t.id,
  4, -- Default quality score
  t.updated_at
FROM tasks t
WHERE t.status = 'done'
AND t.assigned_agent_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM agent_performance p WHERE p.task_id = t.id
);
```

## Breaking Changes

### None!

This migration is **backward compatible**:
- All new columns are nullable or have default values
- Existing queries will continue to work
- New tables don't affect existing functionality
- RLS policies maintain data isolation

## Rollback Procedure

If you need to rollback (not recommended after data is added):

```sql
-- WARNING: This will delete all new data!

-- Drop new tables
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS agent_skills CASCADE;
DROP TABLE IF EXISTS epics CASCADE;

-- Remove new columns from tasks table
ALTER TABLE tasks
  DROP COLUMN IF EXISTS epic_id,
  DROP COLUMN IF EXISTS parent_task_id,
  DROP COLUMN IF EXISTS definition_of_done,
  DROP COLUMN IF EXISTS test_notes,
  DROP COLUMN IF EXISTS risk_level,
  DROP COLUMN IF EXISTS risk_flags,
  DROP COLUMN IF EXISTS estimated_hours;
```

## Post-Migration Testing

### Test 1: Create an Epic

```typescript
const { data, error } = await supabase
  .from('epics')
  .insert({
    epic_id: 'EPIC-1',
    title: 'Test Epic',
    description: 'Testing epic creation',
    status: 'planning',
    priority: 3,
    user_id: userId,
  })
  .select()
  .single();
```

### Test 2: Add Agent Skill

```typescript
const { data, error } = await supabase
  .from('agent_skills')
  .insert({
    agent_id: agentId,
    skill_name: 'TypeScript',
    skill_level: 5,
    user_id: userId,
  });
```

### Test 3: Create Task with New Fields

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    task_id: 'TASK-100',
    title: 'Test Task',
    description: 'Testing new fields',
    status: 'backlog',
    priority: 3,
    definition_of_done: ['Write code', 'Add tests', 'Code review'],
    test_notes: 'Test the feature thoroughly',
    risk_level: 'medium',
    risk_flags: ['Database Migration'],
    estimated_hours: 8,
    user_id: userId,
  });
```

### Test 4: Create Dependency

```typescript
const { data, error } = await supabase
  .from('task_dependencies')
  .insert({
    task_id: task1Id,
    depends_on_task_id: task2Id,
    dependency_type: 'blocks',
    user_id: userId,
  });
```

## Troubleshooting

### Issue: "column does not exist"

**Solution:** Re-run the migration script. The column creation may have failed.

```sql
-- Manually add missing column (example for epic_id)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS epic_id UUID REFERENCES epics(id) ON DELETE SET NULL;
```

### Issue: "relation does not exist"

**Solution:** The table creation failed. Check for errors in the SQL output and re-run.

### Issue: RLS policies blocking queries

**Solution:** Ensure you're passing the correct `user_id` and that you're authenticated:

```typescript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
```

### Issue: Trigger not firing for default agent skills

**Solution:** Verify the trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_skills';
```

If missing, re-run the trigger creation section of the schema.

## Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify your Supabase project has the latest version
3. Review the [TASK_ORCHESTRATION.md](./TASK_ORCHESTRATION.md) documentation
4. Open an issue on GitHub with:
   - Error messages
   - Database version
   - Steps to reproduce

## Next Steps

After successful migration:
1. Read [TASK_ORCHESTRATION.md](./TASK_ORCHESTRATION.md) for feature documentation
2. Try the `OrchestrationDemo` component to see all features
3. Integrate the new components into your application
4. Train your team on the new AI breakdown features
5. Start tracking agent performance metrics

Happy coding! 🚀
