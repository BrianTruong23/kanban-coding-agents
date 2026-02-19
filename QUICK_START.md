# Quick Start Guide - Automated Task Breakdown & Agent Orchestration

## Prerequisites

Before you begin, ensure you have:
- ✅ Supabase project set up
- ✅ Database connection configured
- ✅ User authentication working

## Setup Steps

### Step 1: Run Database Migrations

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `database/schema.sql`
4. Execute the SQL script

This will create:
- 6 new tables (epics, tickets, subtasks, task_dependencies, agent_skills, agent_performance)
- All necessary indexes
- Row-level security policies
- Triggers for auto-updating timestamps

### Step 2: Verify Installation

After running migrations, verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'epics',
  'tickets',
  'subtasks',
  'task_dependencies',
  'agent_skills',
  'agent_performance'
);
```

You should see all 6 tables listed.

### Step 3: Sign In and Initialize Agents

1. Sign in to your application
2. Default agents are automatically created on first login
3. Navigate to the Kanban board

### Step 4: Configure Agent Skills

1. Click the **"Agents"** button in the toolbar
2. Select an agent from the list
3. Click **"Add Skill"**
4. Enter skill details:
   - Name: e.g., "React", "Node.js", "PostgreSQL"
   - Category: frontend, backend, database, etc.
   - Proficiency: 1 (Beginner) to 5 (Expert)
5. Repeat for all agents

**Recommended Skills Setup:**

**Alex Chen** (Frontend Specialist):
- React (Frontend, 5)
- TypeScript (Frontend, 5)
- Tailwind CSS (Design, 4)
- Next.js (Frontend, 4)

**Sarah Johnson** (Backend Specialist):
- Node.js (Backend, 5)
- PostgreSQL (Database, 5)
- REST APIs (Backend, 5)
- Express (Backend, 4)

**Mike Rodriguez** (Full Stack):
- React (Frontend, 4)
- Node.js (Backend, 4)
- MongoDB (Database, 3)
- Docker (DevOps, 3)

**Emma Wilson** (DevOps):
- Docker (DevOps, 5)
- Kubernetes (DevOps, 5)
- CI/CD (DevOps, 5)
- AWS (DevOps, 4)

**David Kim** (Mobile):
- React Native (Mobile, 5)
- Swift (Mobile, 4)
- Kotlin (Mobile, 4)
- Firebase (Backend, 3)

## Using the Features

### 1. Create Your First Task Breakdown

#### From PRD Text:
1. Click **"AI Breakdown"** button (purple)
2. Select **"PRD Text"** tab
3. Paste your requirements:
   ```
   Implement user authentication system:
   - Email/password login
   - OAuth integration with Google
   - Password reset functionality
   - Session management
   - Role-based access control
   ```
4. Add optional context: "Using Supabase Auth, Next.js 14"
5. Click **"Generate Breakdown"**
6. Review the generated structure:
   - Epic with story points
   - Tickets with DoD
   - Subtasks
   - Dependencies
   - Test notes
   - Risk assessments
7. Click **"Accept & Create Tasks"**

#### From GitHub Issue:
1. Click **"AI Breakdown"** button
2. Select **"GitHub Issue"** tab
3. Enter URL: `https://github.com/user/repo/issues/123`
4. Add context if needed
5. Generate and accept

#### From Screenshot:
1. Click **"AI Breakdown"** button
2. Select **"Screenshot"** tab
3. Upload wireframe or mockup
4. Add context: "Design for mobile app dashboard"
5. Generate and accept

### 2. Smart Agent Assignment

#### Automatic Assignment:
1. Find a ticket that needs assignment
2. Click **"Auto-Assign"** (if implemented in ticket view)
3. System shows ranked agent matches with:
   - Match score (0-100%)
   - Reasoning (skills, availability, performance)
   - Current workload
   - Success rate
4. Review suggestions
5. Click **"Auto-Assign Best Match"**

#### Manual Assignment:
1. Review all agent matches
2. Select preferred agent
3. Click **"Assign Selected"**

### 3. View Task Dependencies

1. Click **"Dependencies"** button in toolbar
2. Explore the graph:
   - **Drag** to pan around
   - **Zoom** in/out with buttons
   - **Reset** view to center
3. Understand relationships:
   - **Red solid lines**: Critical blockers
   - **Blue dashed lines**: Related tasks
   - **Gray dashed lines**: Duplicates
   - **Yellow nodes**: High priority tasks

### 4. Monitor Agent Performance

1. Click **"Agents"** button
2. Select an agent
3. View metrics:
   - **Tasks Completed**: Total finished
   - **Avg. Completion Time**: Hours per task
   - **Success Rate**: Percentage
   - **Current Load**: 0-100% capacity
4. Track over time to identify:
   - Top performers
   - Overloaded agents
   - Skill gaps

## Example Workflows

### Workflow 1: Sprint Planning with AI

**Goal**: Plan a 2-week sprint from a PRD

1. **Prepare PRD**:
   ```
   Sprint 12 Goals:
   - Implement real-time chat feature
   - Add file upload to messages
   - Create admin dashboard
   - Optimize database queries
   - Fix critical bugs from Sprint 11
   ```

2. **Generate Breakdown**:
   - Use AI Breakdown with PRD text
   - Review generated epic and tickets
   - Accept breakdown

3. **Assign Tasks**:
   - Use Auto-Assignment for each ticket
   - System distributes based on skills and load
   - Review assignments

4. **Check Dependencies**:
   - View dependency graph
   - Identify critical path
   - Reorder if needed

5. **Start Sprint**:
   - Move tasks to "In Progress"
   - Monitor agent workloads
   - Track progress daily

### Workflow 2: Feature Development

**Goal**: Build a new feature from GitHub issue

1. **Import Issue**:
   - GitHub issue: "Add dark mode support #456"
   - Use AI Breakdown with GitHub URL
   - Generate structure

2. **Review Tickets**:
   - Check DoD items
   - Review test notes
   - Assess risk flags

3. **Assign Work**:
   - Frontend tickets → Alex (React expert)
   - Backend tickets → Sarah (API expert)
   - Testing tickets → Mike (Full stack)

4. **Track Progress**:
   - Monitor dependency completion
   - Watch agent workloads
   - Update metrics as tasks complete

### Workflow 3: Bug Triage

**Goal**: Break down complex bug into subtasks

1. **Document Bug**:
   ```
   Critical: Payment processing fails for international cards
   - Error occurs at checkout
   - Affects ~30% of transactions
   - Started after last deployment
   - Need urgent fix
   ```

2. **Generate Breakdown**:
   - AI creates investigation tickets
   - Generates fix subtasks
   - Identifies testing needs
   - Flags high risk

3. **Urgent Assignment**:
   - Auto-assign to available expert
   - System prioritizes low workload + high skills
   - Ensure fast turnaround

## Tips & Best Practices

### For Best AI Results:
- ✅ Be specific in PRDs
- ✅ Use bullet points
- ✅ Include technical context
- ✅ Mention frameworks/tools
- ✅ Specify constraints

### For Agent Management:
- ✅ Keep skills updated
- ✅ Review performance regularly
- ✅ Balance workloads
- ✅ Assign based on strengths
- ✅ Track completion times

### For Dependencies:
- ✅ Review graph before sprints
- ✅ Identify blockers early
- ✅ Reorder critical path
- ✅ Monitor for circular deps
- ✅ Update as work progresses

### For Performance:
- ✅ Start with small breakdowns
- ✅ Test AI quality
- ✅ Adjust agent skills
- ✅ Monitor load distribution
- ✅ Collect feedback

## Troubleshooting

### Issue: Tasks not appearing after breakdown
**Solution**:
- Check browser console for errors
- Verify database connection
- Ensure user is authenticated
- Check RLS policies

### Issue: Agent skills not saving
**Solution**:
- Verify `agent_skills` table exists
- Check user owns the agent
- Review RLS policies
- Clear browser cache

### Issue: Dependency graph blank
**Solution**:
- Ensure dependencies exist in database
- Check `task_dependencies` table
- Verify tasks have valid IDs
- Refresh page

### Issue: Auto-assignment shows no matches
**Solution**:
- Add skills to agents first
- Ensure ticket has tags
- Check agent availability
- Verify agent performance data exists

## Next Steps

1. **Customize AI Prompts**: Edit `src/services/aiBreakdown.ts` to tune parsing logic
2. **Integrate Real AI**: Add OpenAI or Claude API keys for production
3. **Add Analytics**: Build dashboards for team metrics
4. **Extend Automation**: Add auto-transitions and notifications
5. **Scale Up**: Test with larger teams and projects

## Support

For detailed documentation, see:
- `FEATURE_BREAKDOWN.md` - Complete feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `database/schema.sql` - Database schema reference

For issues or questions:
- Check browser console
- Review Supabase logs
- Verify database schema
- Test with simple examples first

Happy task managing! 🚀
