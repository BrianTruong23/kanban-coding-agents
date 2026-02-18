# Database Migration Guide

This guide explains how to apply the enhanced database schema for automated task breakdown and agent orchestration features.

## Overview

The enhanced schema adds:
- **Agent Skills**: Track agent expertise and proficiency levels
- **Agent Performance**: Monitor task completion metrics and quality scores
- **Agent Availability**: Manage workload and agent status
- **Task Hierarchy**: Support for epics, tickets, and subtasks
- **Definition of Done**: Checklist items for task completion
- **Test Notes**: Testing requirements and strategies
- **Risk Flags**: Identify and mitigate project risks
- **Task Dependencies**: Model blocking relationships between tasks

## Prerequisites

1. Access to Supabase Dashboard or SQL Editor
2. Admin access to your Supabase project
3. Backup of existing data (recommended)

## Migration Steps

### Option 1: Using Supabase Dashboard

1. **Navigate to SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Migration Script**
   - Open the file `database/schema-enhanced.sql`
   - Copy the entire content
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Migration**
   - Go to "Table Editor" in the left sidebar
   - Verify the following new tables exist:
     - `agent_skills`
     - `agent_performance`
     - `agent_availability`
     - `definition_of_done`
     - `test_notes`
     - `risk_flags`
     - `task_dependencies`

4. **Check New Columns**
   - Select the `tasks` table
   - Verify these new columns exist:
     - `type` (epic, ticket, subtask)
     - `parent_id` (for hierarchical tasks)
     - `estimated_hours`
     - `actual_hours`
     - `completed_at`

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push

# Or apply the specific migration file
psql -h YOUR_DB_HOST -U postgres -d postgres -f database/schema-enhanced.sql
```

## Post-Migration Steps

### 1. Initialize Agent Performance Data

After creating agents, their performance and availability records are automatically created via database triggers. However, for existing agents, run:

```sql
-- Initialize performance for existing agents
INSERT INTO agent_performance (agent_id)
SELECT id FROM agents
WHERE id NOT IN (SELECT agent_id FROM agent_performance)
ON CONFLICT (agent_id) DO NOTHING;

-- Initialize availability for existing agents
INSERT INTO agent_availability (agent_id)
SELECT id FROM agents
WHERE id NOT IN (SELECT agent_id FROM agent_availability)
ON CONFLICT (agent_id) DO NOTHING;
```

### 2. Verify Row Level Security (RLS)

All new tables have RLS policies enabled. Verify by checking:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'agent_skills',
  'agent_performance',
  'agent_availability',
  'definition_of_done',
  'test_notes',
  'risk_flags',
  'task_dependencies'
);
```

All tables should have `rowsecurity = true`.

### 3. Test the Schema

Create a test task with enhanced features:

```sql
-- Create a test epic
INSERT INTO tasks (
  user_id,
  task_id,
  title,
  description,
  type,
  status,
  priority
) VALUES (
  auth.uid(),
  'TASK-TEST-1',
  'Test Epic',
  'This is a test epic',
  'epic',
  'backlog',
  3
) RETURNING id;

-- Add definition of done (use the returned id from above)
INSERT INTO definition_of_done (task_id, description, completed)
VALUES
  ('TASK_ID_HERE', 'All subtasks completed', false),
  ('TASK_ID_HERE', 'Code reviewed', false),
  ('TASK_ID_HERE', 'Tests passing', false);

-- Add risk flags
INSERT INTO risk_flags (task_id, description, level, mitigation)
VALUES
  ('TASK_ID_HERE', 'Complex integration', 'medium', 'Break into smaller tasks');

-- Add test notes
INSERT INTO test_notes (task_id, description, test_type, priority)
VALUES
  ('TASK_ID_HERE', 'Test all edge cases', 'unit', 1);
```

## Schema Changes Summary

### New Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `agent_skills` | Agent expertise and proficiency | `agent_id`, `name`, `category`, `proficiency_level` |
| `agent_performance` | Performance metrics | `agent_id`, `tasks_completed`, `code_quality_score` |
| `agent_availability` | Workload and status | `agent_id`, `status`, `current_load`, `max_load` |
| `definition_of_done` | Task completion criteria | `task_id`, `description`, `completed` |
| `test_notes` | Testing requirements | `task_id`, `description`, `test_type` |
| `risk_flags` | Risk identification | `task_id`, `description`, `level`, `mitigation` |
| `task_dependencies` | Task relationships | `task_id`, `depends_on`, `dependency_type` |

### Updated Tables

**tasks table** - New columns:
- `type`: Task type (epic, ticket, subtask)
- `parent_id`: Reference to parent task (for hierarchy)
- `estimated_hours`: Estimated completion time
- `actual_hours`: Actual time spent
- `completed_at`: Timestamp when task was completed

### Database Triggers

1. **initialize_agent_stats()**: Automatically creates performance and availability records when a new agent is created
2. **update_task_completion()**: Sets `completed_at` timestamp when task status changes to 'done'
3. **update_agent_performance_on_task_update()**: Updates agent performance metrics when tasks are assigned or status changes

## Rollback Procedure

If you need to rollback the migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS risk_flags CASCADE;
DROP TABLE IF EXISTS test_notes CASCADE;
DROP TABLE IF EXISTS definition_of_done CASCADE;
DROP TABLE IF EXISTS agent_availability CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS agent_skills CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_performance_on_task_change ON tasks;
DROP TRIGGER IF EXISTS track_task_completion ON tasks;
DROP TRIGGER IF EXISTS init_agent_stats ON agents;

-- Drop functions
DROP FUNCTION IF EXISTS update_agent_performance_on_task_update();
DROP FUNCTION IF EXISTS update_task_completion();
DROP FUNCTION IF EXISTS initialize_agent_stats();

-- Remove new columns from tasks (if needed)
ALTER TABLE tasks DROP COLUMN IF EXISTS type;
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS completed_at;
```

## Troubleshooting

### Issue: Migration fails with permission error

**Solution**: Ensure you're running the migration as the database owner or have sufficient privileges.

```sql
-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Issue: RLS policies block access

**Solution**: Verify you're authenticated and the `auth.uid()` function returns your user ID.

```sql
-- Check current user
SELECT auth.uid();

-- Temporarily disable RLS for testing (not recommended for production)
ALTER TABLE agent_skills DISABLE ROW LEVEL SECURITY;
```

### Issue: Existing tasks don't have the new columns

**Solution**: The migration uses safe column additions with defaults:

```sql
-- Verify column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('type', 'parent_id', 'estimated_hours', 'actual_hours', 'completed_at');
```

## Performance Considerations

### Indexes

The migration creates indexes on frequently queried columns:

```sql
-- Agent-related indexes
CREATE INDEX agent_skills_agent_id_idx ON agent_skills(agent_id);
CREATE INDEX agent_skills_category_idx ON agent_skills(category);
CREATE INDEX agent_availability_status_idx ON agent_availability(status);

-- Task-related indexes
CREATE INDEX tasks_parent_id_idx ON tasks(parent_id);
CREATE INDEX tasks_type_idx ON tasks(type);
CREATE INDEX task_dependencies_task_id_idx ON task_dependencies(task_id);
CREATE INDEX task_dependencies_depends_on_idx ON task_dependencies(depends_on);
CREATE INDEX risk_flags_level_idx ON risk_flags(level);
```

### Query Optimization

For large datasets, consider:

1. **Pagination**: Use `LIMIT` and `OFFSET` for large result sets
2. **Selective Columns**: Only select needed columns
3. **Materialized Views**: For complex aggregations on agent performance

Example optimized query:

```sql
-- Get agents with their skills and availability
SELECT
  a.id,
  a.name,
  av.status,
  av.current_load,
  av.max_load,
  json_agg(
    json_build_object(
      'name', s.name,
      'category', s.category,
      'proficiency', s.proficiency_level
    )
  ) as skills
FROM agents a
LEFT JOIN agent_availability av ON a.id = av.agent_id
LEFT JOIN agent_skills s ON a.id = s.agent_id
WHERE a.user_id = auth.uid()
GROUP BY a.id, a.name, av.status, av.current_load, av.max_load;
```

## Support

For issues or questions:
1. Check the Supabase logs in the dashboard
2. Review the SQL migration file for details
3. Consult the Supabase documentation: https://supabase.com/docs
4. Open an issue in the project repository
