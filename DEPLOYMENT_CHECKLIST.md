# Deployment Checklist - Issue #8 Implementation

## Pre-Deployment

### Database Migration
- [ ] Backup current database
- [ ] Review `database/schema.sql` changes
- [ ] Test migration in staging environment
- [ ] Run migration in production Supabase
- [ ] Verify all 6 new tables created:
  - [ ] `epics`
  - [ ] `tickets`
  - [ ] `subtasks`
  - [ ] `task_dependencies`
  - [ ] `agent_skills`
  - [ ] `agent_performance`
- [ ] Confirm RLS policies active
- [ ] Check indexes created
- [ ] Verify triggers installed

### Code Verification
- [ ] All new files present:
  - [ ] `src/components/TaskBreakdown.tsx`
  - [ ] `src/components/AgentRoster.tsx`
  - [ ] `src/components/AutoAssignment.tsx`
  - [ ] `src/hooks/useBreakdown.ts`
  - [ ] `src/services/aiBreakdown.ts`
  - [ ] `src/services/agentRoster.ts`
- [ ] Updated files reviewed:
  - [ ] `src/components/KanbanBoard.tsx`
  - [ ] `database/schema.sql`
- [ ] TypeScript compilation successful
- [ ] No ESLint errors
- [ ] Dependencies up to date

### Build & Test
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Test development mode: `npm run dev`
- [ ] Test production build
- [ ] Verify no console errors
- [ ] Check dark mode works
- [ ] Test mobile responsiveness

## Deployment Steps

### 1. Database Migration (CRITICAL - Do First!)

```bash
# Step 1: Backup
# In Supabase dashboard, create backup or export

# Step 2: Run migration
# Go to Supabase SQL Editor
# Paste contents of database/schema.sql
# Execute

# Step 3: Verify
# Run this query:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'epics', 'tickets', 'subtasks',
  'task_dependencies', 'agent_skills', 'agent_performance'
);
```

### 2. Environment Variables

- [ ] Verify Supabase URL configured
- [ ] Verify Supabase Anon Key configured
- [ ] (Optional) Add AI API keys:
  ```env
  NEXT_PUBLIC_OPENAI_API_KEY=sk-...
  NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
  ```

### 3. Deploy Application

- [ ] Commit all changes
- [ ] Push to repository
- [ ] Deploy to hosting platform (Vercel/Netlify)
- [ ] Wait for build completion
- [ ] Check deployment logs

### 4. Post-Deployment Verification

- [ ] Visit production URL
- [ ] Test user authentication
- [ ] Verify agents created on signup
- [ ] Test AI Breakdown feature:
  - [ ] PRD input works
  - [ ] GitHub input works (UI)
  - [ ] Screenshot upload works
- [ ] Test Agent Roster:
  - [ ] Can view agents
  - [ ] Can add skills
  - [ ] Can remove skills
  - [ ] Performance metrics display
- [ ] Test Dependencies:
  - [ ] Graph renders
  - [ ] Can zoom/pan
  - [ ] Shows correct data
- [ ] Test existing features:
  - [ ] Tasks CRUD works
  - [ ] Sprint filter works
  - [ ] Agent assignment works

## Testing Checklist

### Functional Tests

#### Task Breakdown
- [ ] Create breakdown from PRD text
- [ ] Verify epic created in database
- [ ] Verify tickets created
- [ ] Verify subtasks created
- [ ] Verify dependencies created
- [ ] Check DoD items present
- [ ] Check test notes present
- [ ] Check risk flags present
- [ ] Verify AI confidence score shown

#### Agent Roster
- [ ] View all agents
- [ ] Select an agent
- [ ] View performance metrics
- [ ] Add a skill
- [ ] Update skill proficiency
- [ ] Remove a skill
- [ ] Check workload updates

#### Auto-Assignment
- [ ] View agent matches for ticket
- [ ] See match scores
- [ ] See match reasons
- [ ] Auto-assign best match
- [ ] Manually select and assign
- [ ] Verify workload updates
- [ ] Check performance tracking

#### Dependencies
- [ ] Graph displays all tasks
- [ ] Dependencies shown correctly
- [ ] Can zoom in/out
- [ ] Can pan around
- [ ] Can reset view
- [ ] Legend is clear
- [ ] High priority tasks highlighted

### Integration Tests

- [ ] Create breakdown → Auto-assign → View in graph
- [ ] Add agent skill → Better match score
- [ ] Complete task → Performance updates
- [ ] Multiple breakdowns → All appear
- [ ] Delete task → Dependencies removed

### UI/UX Tests

- [ ] All modals open/close smoothly
- [ ] No layout shifts
- [ ] Buttons have hover states
- [ ] Loading states display
- [ ] Error messages clear
- [ ] Success feedback shown
- [ ] Dark mode consistent
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works

### Performance Tests

- [ ] Page loads under 3 seconds
- [ ] AI breakdown completes under 5 seconds
- [ ] Graph renders under 2 seconds
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] No blocking operations

### Security Tests

- [ ] RLS prevents cross-user access
- [ ] API endpoints secured
- [ ] No sensitive data in console
- [ ] Auth required for all operations
- [ ] SQL injection protected
- [ ] XSS protected

## Rollback Plan

If issues are detected:

### Immediate Rollback
1. Revert to previous deployment
2. Keep database changes (they're backward compatible)
3. Investigate issues in staging

### Database Rollback (Only if Critical)
```sql
-- ONLY IF ABSOLUTELY NECESSARY
-- Remove new tables (WARNING: loses all breakdown data)
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS agent_skills CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS epics CASCADE;

-- Remove sprint column from tasks (if it didn't exist before)
ALTER TABLE tasks DROP COLUMN IF EXISTS sprint;
```

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Watch for user feedback
- [ ] Check database performance
- [ ] Monitor API usage
- [ ] Track breakdown creations

### First Week
- [ ] Review user adoption
- [ ] Collect feature feedback
- [ ] Monitor performance metrics
- [ ] Check agent skill distribution
- [ ] Analyze breakdown quality
- [ ] Review auto-assignment accuracy

### First Month
- [ ] Analyze usage patterns
- [ ] Optimize AI prompts
- [ ] Fine-tune matching algorithm
- [ ] Add requested features
- [ ] Improve documentation

## Monitoring Setup

### Metrics to Track
- [ ] Number of breakdowns created
- [ ] Average tasks per breakdown
- [ ] Auto-assignment usage
- [ ] Agent skill distribution
- [ ] Dependency graph usage
- [ ] Performance metric trends
- [ ] Error rates
- [ ] Page load times

### Alerts to Configure
- [ ] Database errors
- [ ] API failures
- [ ] High error rates
- [ ] Slow query performance
- [ ] Memory issues
- [ ] Failed deployments

## Documentation

- [ ] Update README.md with new features
- [ ] Link to QUICK_START.md
- [ ] Link to FEATURE_BREAKDOWN.md
- [ ] Add screenshots/GIFs
- [ ] Update changelog
- [ ] Document any environment variables
- [ ] Update API documentation (if applicable)

## Communication

### Internal Team
- [ ] Announce deployment
- [ ] Share documentation links
- [ ] Provide training session
- [ ] Answer questions
- [ ] Gather feedback

### Users (if applicable)
- [ ] Send release announcement
- [ ] Highlight key features
- [ ] Provide quick start guide
- [ ] Offer support channels
- [ ] Request feedback

## Success Criteria

### Must Have (Day 1)
- ✅ No critical errors
- ✅ All features accessible
- ✅ Database migration successful
- ✅ User authentication works
- ✅ Existing features unaffected

### Should Have (Week 1)
- ✅ Users creating breakdowns
- ✅ Agents have skills configured
- ✅ Auto-assignment being used
- ✅ Positive user feedback
- ✅ No performance issues

### Nice to Have (Month 1)
- ✅ High feature adoption
- ✅ Improved team velocity
- ✅ Accurate AI breakdowns
- ✅ Well-balanced workloads
- ✅ Feature requests for enhancements

## Deployment Sign-Off

- [ ] Database migration completed by: _____________
- [ ] Code deployment completed by: _____________
- [ ] Testing verified by: _____________
- [ ] Monitoring configured by: _____________
- [ ] Documentation updated by: _____________

**Deployment Date**: _______________

**Deployed By**: _______________

**Production URL**: _______________

**Status**: ⬜ Pending  ⬜ In Progress  ⬜ Complete  ⬜ Rolled Back

---

## Notes

_Add any deployment-specific notes, issues encountered, or special considerations here:_




---

**Prepared by**: AI Assistant
**Date**: 2026-02-19
**Issue**: #8 - Automated Task Breakdown and Agent Orchestration
