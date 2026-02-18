# Quick Start Guide - Agent Orchestration

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migrations

Open your Supabase SQL Editor and run:

```sql
-- Copy and paste the contents of database/orchestration_schema.sql
```

This creates all necessary tables, policies, and indexes.

### Step 2: Start the Development Server

```bash
npm run dev
```

### Step 3: Navigate to the Orchestration Page

Open your browser to:
```
http://localhost:3000/orchestration
```

### Step 4: Create Your First Breakdown

1. Click **"New Breakdown"** button
2. Select **"Text"** as input type
3. Paste this example requirement:

```
Implement user authentication system
- Support email/password login
- Add OAuth2 with Google and GitHub
- Implement secure session management
- Add password reset functionality
- Create user profile page
```

4. Click **"Generate Breakdown"**
5. Review the generated hierarchy
6. Click **"Accept & Create Tasks"**

That's it! You now have:
- ✅ 1 Epic created
- ✅ 4 Tickets with DoD and risk assessment
- ✅ 12+ Subtasks with time estimates
- ✅ Dependencies mapped automatically

## 📊 Viewing Your Tasks

### Hierarchy View
Shows expandable tree structure:
```
📦 EPIC-1: User Authentication System
  ├─ 📋 TICKET-1: Database schema
  │   ├─ ☐ SUB-1: Design schema (120m)
  │   ├─ ☐ SUB-2: Write migrations (90m)
  │   └─ ☐ SUB-3: Test migrations (60m)
  ├─ 📋 TICKET-2: Backend API
  │   ├─ ☐ SUB-4: API interface (90m)
  │   ├─ ☐ SUB-5: OAuth integration (240m)
  │   └─ ...
  └─ ...
```

### Dependencies View
Shows visual graph with:
- 🔴 Red arrows = Blocks
- 🔵 Blue arrows = Requires
- ⚪ Gray dashed = Related

## 🤖 Auto-Assignment

The system automatically recommends agents based on:

**Skill Match (50%)**
- Does the agent have required skills?
- What's their proficiency level?

**Workload (30%)**
- How many tasks are they currently assigned?
- How many hours of work?

**Performance (20%)**
- What's their success rate?
- How fast do they complete tasks?

Example recommendation:
```
Agent: Sarah Johnson
Score: 87/100
Reasons:
  ✓ Matches 3/3 required skills
  ✓ Low workload - good availability
  ✓ Excellent track record (95% success)
Skills: API Development (5/5), Database Design (5/5), Node.js (5/5)
```

## 📝 Example Inputs

### Feature Request
```
Add real-time notifications
- Push notifications for mobile
- Email notifications
- In-app notification center
- User notification preferences
```

### Bug Fix
```
Fix: Login button not responding on mobile Safari
- Happens on iOS 16+
- Only affects Safari, works on Chrome
- Console shows "undefined is not a function" error
```

### Refactoring
```
Refactor authentication middleware
- Extract JWT validation logic
- Add unit tests
- Improve error handling
- Update documentation
```

### From Screenshot
```
Input Type: Screenshot
Description: Dashboard with 3 charts (users, revenue, conversion),
sidebar with navigation, header with search and user menu
```

## 🎯 Breakdown Output Structure

Each breakdown includes:

### Epic
- High-level feature or initiative
- Priority (1-5)
- Status tracking
- Progress across all tickets

### Ticket
- Specific user story or task
- **Definition of Done** (checkable criteria)
- **Test Notes** (what to test)
- **Risk Level** (low, medium, high, critical)
- **Effort Estimate** (story points, hours)
- **Suggested Skills** (for auto-assignment)

### Subtask
- Granular implementation step
- Order within ticket
- Time estimate (minutes)
- Can be assigned independently

### Dependencies
- **Blocks**: Task must complete before dependent starts
- **Requires**: Task output needed for dependent
- **Related**: Tasks are related but not blocking

## ⚙️ Configuration

### Auto-Assignment Weights

Edit `src/lib/autoAssignment.ts`:

```tsx
export const DEFAULT_AUTO_ASSIGNMENT_CONFIG = {
  skillMatchWeight: 0.5,     // 50% - Prioritize skill match
  workloadWeight: 0.3,       // 30% - Balance workload
  performanceWeight: 0.2,    // 20% - Consider performance
  maxTasksPerAgent: 10,      // Max concurrent tasks
  maxHoursPerAgent: 40,      // Max hours per agent
};
```

### Agent Skills

Edit `src/lib/agentSkills.ts`:

```tsx
export const DEFAULT_AGENT_SKILLS = {
  'Alex Chen': [
    { skillName: 'React', category: 'frontend', proficiency: 5 },
    { skillName: 'TypeScript', category: 'frontend', proficiency: 5 },
    // Add more skills...
  ],
  // Add more agents...
};
```

## 🔍 Troubleshooting

### "No tasks generated"
- Check that input has enough detail
- Try adding more specific requirements
- Include technical details (API, database, UI)

### "Invalid breakdown"
- Breakdown validation failed
- Check console for specific errors
- May indicate circular dependencies

### "Agent not appearing in recommendations"
- Check agent has relevant skills
- Verify agent isn't overloaded (max tasks/hours)
- Check agent performance record exists

### Database errors
- Ensure migrations ran successfully
- Verify RLS policies are active
- Check user is authenticated

## 📚 Next Steps

1. **Integrate with Kanban Board**: Connect generated tasks to existing board
2. **Add LLM Integration**: Replace templates with GPT-4/Claude
3. **Customize Breakdown Logic**: Edit `src/lib/taskBreakdown.ts`
4. **Add More Agent Skills**: Update skill definitions
5. **Configure Assignment Weights**: Tune for your team
6. **Export to Jira/Linear**: Add export functionality

## 🎓 Learning Resources

- **Full Documentation**: See `ORCHESTRATION_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Type Definitions**: See `src/types/orchestration.ts`
- **Example Code**: See `src/app/orchestration/page.tsx`

## 💡 Pro Tips

1. **Be Specific**: More detailed input = better breakdown
2. **Use Categories**: Mention "frontend", "backend", "database" explicitly
3. **Include Constraints**: Specify technologies, frameworks, or limitations
4. **Review Before Accept**: Check generated tasks match expectations
5. **Iterate**: You can generate multiple breakdowns and compare

## 🤝 Support

For issues or questions:
1. Check the documentation in `ORCHESTRATION_GUIDE.md`
2. Review type definitions for API usage
3. Check console logs for errors
4. Verify database migrations completed

---

Happy orchestrating! 🎉
