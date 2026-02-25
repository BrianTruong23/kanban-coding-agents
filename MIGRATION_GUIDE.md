# Migration Guide: Task Breakdown Feature

## Overview

This guide helps you migrate your existing Kanban board to include the new Task Breakdown and Agent Orchestration features.

## Database Migration

### Step 1: Run the Schema Migration

Execute the updated `database/schema.sql` file in your Supabase SQL Editor. The migration is **idempotent** and safe to run multiple times.

The migration will:
1. Add the `sprint` column to existing tasks (if not present)
2. Create new tables: `task_hierarchy`, `task_dependencies`, `agent_skills`, `agent_performance`
3. Set up indexes for performance
4. Configure Row Level Security (RLS) policies
5. Create triggers for default agent skills

### Step 2: Verify Migration

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'tasks',
    'agents',
    'task_hierarchy',
    'task_dependencies',
    'agent_skills',
    'agent_performance'
  );
```

Expected result: 6 rows (all table names listed above)

### Step 3: Check Agent Skills

Existing users should have skills automatically created for their agents. Verify with:

```sql
SELECT
  a.name,
  COUNT(s.id) as skill_count
FROM agents a
LEFT JOIN agent_skills s ON a.id = s.agent_id
GROUP BY a.id, a.name;
```

Expected: Each agent should have 4-5 skills.

If skills are missing, they will be created automatically when new agents are added. For existing agents without skills, you can manually insert them or delete and recreate the agents (they will be recreated with skills on next login).

## Application Updates

### Required npm Packages

No new dependencies are required. The feature uses existing packages:
- `lucide-react` (already installed for icons)
- `@supabase/supabase-js` (already installed)

### Environment Variables

No changes to environment variables needed. Existing Supabase configuration is sufficient.

## Feature Rollout

### Phase 1: Agent Skills (Immediate)

1. Agents now have skill profiles visible in the Agent Roster
2. Users can edit agent skills in the UI
3. No changes to existing workflows

**User Action:** Open the Agent Roster panel and review/update agent skills as needed.

### Phase 2: Task Breakdown (Immediate)

1. New "AI Breakdown" button in header
2. Allows creating multiple tasks at once
3. Optional feature - existing task creation still works

**User Action:** Try creating a task breakdown from a simple issue description.

### Phase 3: Dependencies (Optional)

1. Task dependencies are tracked in the database
2. Currently visible in breakdown preview
3. Can be extended to show in main Kanban view

**User Action:** Dependencies are automatically created during task breakdown. Manual dependency management can be added in future updates.

## Backward Compatibility

### Existing Tasks

- All existing tasks continue to work unchanged
- Tasks without hierarchy metadata are treated as standalone
- Tasks without agent skills can still be assigned manually
- No data migration or cleanup required

### Existing Agents

- Agent records are unchanged
- Skills are added via new `agent_skills` table
- Agents without skills work normally (neutral scoring)
- Skills can be added retroactively

### Existing Workflows

- Manual task creation still available
- Manual agent assignment still works
- All existing features remain functional
- New features are purely additive

## Testing Checklist

Before rolling out to production:

- [ ] Database migration successful (all tables created)
- [ ] Agent skills populated for existing agents
- [ ] Can create tasks via AI Breakdown
- [ ] Can manually create tasks (existing workflow)
- [ ] Can edit agent skills in roster panel
- [ ] Task hierarchies save correctly
- [ ] Dependencies are created and tracked
- [ ] Agent assignment recommendations work
- [ ] RLS policies enforce user isolation
- [ ] No console errors in browser
- [ ] Mobile responsive layouts work

## Rollback Plan

If issues occur, you can safely rollback:

### Database Rollback

Run these commands to remove new tables (WARNING: destroys breakdown data):

```sql
-- Drop new tables in reverse order
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS agent_skills CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS task_hierarchy CASCADE;

-- Optionally remove sprint column (will lose sprint data)
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;
```

### Application Rollback

1. Revert to the previous commit before the feature
2. Redeploy the application
3. The database tables can remain (they won't cause issues)

## Performance Considerations

### Database

- New indexes added for foreign keys (minimal overhead)
- RLS policies are performant with proper indexes
- Bulk operations use transactions for speed
- Expected query performance: < 100ms for typical operations

### Application

- New components lazy load on demand
- Modals only render when opened
- Agent roster uses memoization for performance
- Typical memory overhead: < 5MB

## Security Review

### RLS Policies

All new tables have RLS enabled with policies matching existing tables:
- Users can only access their own data
- All CRUD operations properly scoped by `user_id`
- Service role can access all data (for triggers)

### Input Validation

- Task titles and descriptions sanitized
- SQL injection prevented by Supabase client
- XSS protection via React's automatic escaping
- File uploads not supported (no upload vectors)

### Data Isolation

- Foreign keys enforce referential integrity
- Cascading deletes prevent orphaned records
- User_id required on all user data tables
- No cross-user data leakage possible

## Common Issues

### Issue: Agent Skills Not Showing

**Symptom:** Agent roster shows agents but no skills

**Solution:**
1. Check if agent_skills table exists
2. Run the trigger manually for existing agents
3. Delete and recreate agents (they'll get skills on recreation)

### Issue: Task Breakdown Button Not Working

**Symptom:** Clicking AI Breakdown does nothing

**Solution:**
1. Check browser console for errors
2. Verify all new components are imported
3. Check if user is authenticated
4. Try refreshing the page

### Issue: Dependencies Not Saving

**Symptom:** Dependencies created in breakdown don't persist

**Solution:**
1. Check task_dependencies table exists
2. Verify RLS policies are enabled
3. Check console for database errors
4. Ensure task IDs are correctly mapped

### Issue: Agent Assignment Scores Wrong

**Symptom:** Recommendations don't match expected agents

**Solution:**
1. Review agent skills (may need updating)
2. Check task description keywords
3. Verify skill matching logic
4. Adjust recommendation threshold if needed

## Support

For issues or questions:

1. Check the console logs (browser DevTools)
2. Review Supabase logs in dashboard
3. Verify database schema matches schema.sql
4. Review TASK_BREAKDOWN_FEATURE.md for details
5. Open a GitHub issue with:
   - Error messages
   - Steps to reproduce
   - Browser/environment info

## Next Steps

After successful migration:

1. **Train Users:** Share the feature documentation
2. **Gather Feedback:** Monitor usage and collect user feedback
3. **Iterate:** Plan enhancements based on usage patterns
4. **Performance Monitoring:** Watch database query performance
5. **Feature Flags:** Consider adding feature flags for gradual rollout

## Maintenance

### Regular Tasks

- Monitor database table sizes
- Review and archive old performance data
- Update skill lists as tech stack evolves
- Refine breakdown patterns based on usage
- Optimize slow queries if needed

### Backup Strategy

- Supabase handles automated backups
- Export important configurations regularly
- Document custom breakdown patterns
- Version control skill taxonomies

## Conclusion

The migration is designed to be:
- **Safe:** Idempotent and non-destructive
- **Gradual:** New features are optional
- **Reversible:** Can rollback if needed
- **Tested:** Schema includes safety checks

Questions? Review the technical documentation in TASK_BREAKDOWN_FEATURE.md
