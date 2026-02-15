# Quick Start Guide - Task Orchestrator

Get started with automated task breakdown and agent orchestration in 5 minutes!

## Step 1: Database Setup (2 minutes)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database/orchestrator_migration.sql`
4. Click "Run"
5. Wait for success message

That's it! Your database is ready.

## Step 2: Access the Orchestrator (30 seconds)

1. Navigate to your app homepage
2. Click the **"Orchestrator"** button in the header (blue button with gear icon)
3. You'll see three tabs:
   - Task Breakdown
   - Agent Roster
   - Dependency Graph

## Step 3: Try Task Breakdown (2 minutes)

1. Click the **"Task Breakdown"** tab
2. Paste this sample issue:

```
Build a dark mode toggle feature

Requirements:
- Add toggle button to header
- Save preference to localStorage
- Support system preference detection
- Animate transition smoothly
- Update all components to support dark mode
```

3. Click **"Break Down Tasks"**
4. Watch as it creates:
   - Epic: "UI/UX Implementation"
   - Tickets with DoD items and test notes
   - Subtasks for each ticket
   - Risk flags and dependencies
   - Effort estimates

## Step 4: Explore Agent Roster (1 minute)

1. Click the **"Agent Roster"** tab
2. See your default agents with inferred skills
3. Click on an agent to view:
   - Skills and expertise levels
   - Performance metrics
   - Current workload
   - Preferences
4. Try updating an agent's availability or skills

## Step 5: View Dependencies (30 seconds)

1. Click the **"Dependency Graph"** tab
2. See visual representation of task relationships
3. Toggle "Show Subtasks" on/off
4. View:
   - Critical path (longest sequence)
   - Blocked tasks
   - Tasks ready to start
5. Click "Export to Mermaid" to get shareable diagram

## What You Can Do Now

### Create Structured Tasks Automatically
Instead of manually creating tasks, paste:
- GitHub issues
- Product requirements documents
- Feature descriptions
- Bug reports

The system will automatically:
- Break them into epics, tickets, and subtasks
- Add Definition of Done checklists
- Include test notes
- Flag potential risks
- Estimate effort
- Detect dependencies

### Manage Your Team
- Track agent skills and specializations
- Monitor performance metrics
- Balance workload across agents
- Auto-assign tasks based on best fit

### Visualize Your Workflow
- See how tasks depend on each other
- Identify bottlenecks early
- Find critical path for sprint planning
- Share dependency graphs with team

## Common Use Cases

### Use Case 1: Sprint Planning
```
1. Paste all features for the sprint into Task Breakdown
2. Review generated epics and tickets
3. Check effort estimates and adjust
4. View dependency graph to sequence work
5. Use auto-assignment to distribute to team
```

### Use Case 2: Bug Triage
```
1. Paste bug report into Task Breakdown (use "GitHub Issue" type)
2. System flags security/performance risks automatically
3. Suggests required skills (frontend, backend, database, etc.)
4. Recommends best agent based on past bug-fix performance
5. Creates subtasks: reproduce, fix, test, document
```

### Use Case 3: New Feature
```
1. Paste PRD into Task Breakdown (use "PRD" type)
2. System creates epics for frontend, backend, testing
3. Generates tickets with acceptance criteria
4. Identifies dependencies (backend before frontend)
5. Estimates total effort for scoping
6. Shows critical path for timeline planning
```

## Tips for Best Results

### For Task Breakdown:
- **Be specific** - More detail = better breakdown
- **Use keywords** - "frontend", "backend", "database", "API"
- **Mention risks** - "security", "performance", "migration"
- **State priority** - "critical", "urgent", "low priority"
- **List features** - Use bullets or numbered lists

### For Agent Management:
- **Update skills regularly** - As agents learn and grow
- **Track performance** - Record completion times and quality
- **Set preferences** - Agents work better on preferred tasks
- **Balance workload** - Don't overload top performers

### For Dependency Graphs:
- **Start simple** - Hide subtasks initially
- **Define early** - Add dependencies when creating tasks
- **Review often** - Check before sprint starts
- **Share visually** - Export Mermaid for team visibility

## Example: Complete Workflow

Let's build a "User Profile Feature" from scratch:

**1. Task Breakdown (Paste this):**
```
User Profile Feature

Users should be able to:
- View their profile information
- Edit name, email, avatar
- Change password
- See activity history
- Delete their account

Technical notes:
- Use Next.js API routes
- Store avatars in Supabase storage
- Add email validation
- Require current password for changes
- Soft delete accounts
```

**2. Review Output:**
- Epic: "User Profile System"
- Tickets:
  - "Backend: Profile API endpoints" (8h, high priority)
  - "Frontend: Profile view page" (6h, depends on backend)
  - "Frontend: Profile edit form" (8h, depends on backend)
  - "Backend: Avatar upload" (4h, medium priority)
  - "Frontend: Password change flow" (6h, high priority, security risk flagged)
  - "Testing: Profile E2E tests" (6h)
- Total: 38 hours (~1 week for one developer)

**3. Auto-Assign:**
- Backend tickets → Sarah Johnson (backend specialist)
- Frontend tickets → Alex Chen (React expert)
- Testing → Mike Rodriguez (full-stack, testing preference)

**4. Check Dependencies:**
- Critical path: Backend API → Frontend pages → Testing (20h)
- Can start in parallel: Avatar upload, Password change backend
- Blocked: All frontend pages until backend API done

**5. Sprint Plan:**
- Week 1: Backend work (Sarah)
- Week 1 (parallel): Avatar upload (Mike)
- Week 2: Frontend work (Alex)
- Week 2: Testing (Mike)

## Next Steps

- Read `ORCHESTRATOR_SETUP.md` for detailed feature documentation
- Review `TASK_ORCHESTRATOR.md` for technical details
- Check `IMPLEMENTATION_SUMMARY.md` for architecture overview

## Need Help?

Common issues and solutions in `ORCHESTRATOR_SETUP.md` under "Troubleshooting"

## Bonus: Budget Tracking

Want to track costs, tokens, and time?

1. Run `database/budget_migration.sql` in Supabase
2. Click **"PM Dashboard"** button in header (purple button)
3. Set budgets for tasks
4. Monitor spending and get alerts
5. Auto-pause tasks that exceed budget

Happy orchestrating! 🚀
