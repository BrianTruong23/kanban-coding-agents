# 🚀 Quick Start: Agent Orchestration

Get started with the automated task breakdown and agent orchestration system in under 5 minutes!

---

## Step 1: Access the Dashboard (30 seconds)

1. Make sure you're logged in to Kanban Coding Agents
2. On the main kanban board, click the purple **"Orchestration"** button in the header
3. You'll see the Agent Orchestration Dashboard

---

## Step 2: Break Down Your First Task (2 minutes)

### Example 1: Simple Task

1. Click **"Break Down Task"** button
2. Paste this example:
   ```
   Add a dark mode toggle to the application settings
   ```
3. Click **"Break Down Task"**
4. Review the results:
   - 1 Ticket created
   - Definition of Done generated
   - Test notes added
   - Tags: frontend, ui, feature
5. Click **"Approve & Add to Board"**

### Example 2: Medium Complexity

1. Click **"Break Down Task"** button
2. Paste this example:
   ```
   User Authentication System

   Implement:
   1. User registration with email verification
   2. Login/logout functionality
   3. Password reset
   4. JWT session management

   Tech: bcrypt, JWT tokens, rate limiting
   ```
3. Click **"Break Down Task"**
4. Review the results:
   - 4 Tickets (one per feature)
   - Each with subtasks for Design, Implementation, Testing, Documentation
   - Risk flags for security
   - Priority set to 5 (critical)
5. Click **"Approve & Add to Board"**

### Example 3: Epic-Level

1. Click **"Break Down Task"** button
2. Paste this example:
   ```
   # E-Commerce Platform

   Build a complete e-commerce solution:

   1. Product catalog with search and filtering
   2. Shopping cart with session persistence
   3. Secure checkout with Stripe integration
   4. User authentication and profiles
   5. Order tracking
   6. Admin dashboard
   7. Email notifications

   Tech: React, Node.js, PostgreSQL, Stripe, Docker
   ```
3. Click **"Break Down Task"**
4. Review the results:
   - 1 Epic created
   - 3 Tickets (Frontend, Backend, Admin)
   - 15+ Subtasks
   - Dependencies showing sequential order
   - Multiple risk flags
5. Click **"Approve & Add to Board"**

---

## Step 3: View Team Capacity (1 minute)

Look at the dashboard header statistics:
- **Team Size**: How many agents you have
- **Avg Workload**: Current team utilization
- **Capacity**: How much bandwidth is available
- **Dependencies**: Total task relationships

Scroll down to see individual agent performance cards with:
- Tasks completed
- Success rate
- Quality score
- Current workload (green/yellow/red bar)
- Top skills

---

## Step 4: Auto-Assign Tasks (30 seconds)

If you have unassigned tasks:

1. Click **"Auto-Assign Tasks"** button
2. The system will:
   - Analyze each task's requirements
   - Score all agents (0-100%)
   - Match skills, performance, and availability
   - Assign tasks to best-fit agents
3. View the assignments in the dashboard

---

## Step 5: Explore the Dependency Graph (1 minute)

If you created tasks with dependencies:

1. Scroll to the **"Dependency Graph"** section
2. You'll see:
   - Blue boxes = Tickets
   - Purple boxes = Subtasks
   - Red lines = Blocking dependencies
   - Dashed gray lines = Related tasks
3. Click any node to highlight its dependencies
4. Use this to plan execution order

---

## 🎯 Quick Tips

### Writing Better Task Descriptions

**DO:**
- Use numbered or bulleted lists
- Include technical requirements
- Mention specific technologies
- Note security/performance concerns

**Example:**
```
Payment Processing System

Features:
1. Credit card processing via Stripe
2. Subscription management
3. Invoice generation
4. Refund handling

Technical Requirements:
- PCI compliance
- Webhook handling
- Idempotency for retries
- Audit logging

Security: Critical - handles payment data
```

### Understanding Match Scores

When viewing agent recommendations:
- **90-100%**: Excellent match - agent is expert with relevant skills
- **70-89%**: Good match - agent has solid skills and availability
- **50-69%**: Fair match - agent can do it but may not be ideal
- **Below 50%**: Poor match - consider training or hiring

### Using the Dashboard Efficiently

1. **Start with epics** for large projects
2. **Use auto-assign** for initial distribution
3. **Manually adjust** high-priority or specialized tasks
4. **Check dependencies** before starting work
5. **Monitor workload** to avoid overloading agents

---

## 📚 Common Use Cases

### Sprint Planning
1. Break down all sprint stories
2. Review and approve breakdowns
3. Auto-assign to team
4. Adjust based on capacity
5. Use dependency graph for planning

### Bug Triage
1. Create task for critical bug
2. System auto-prioritizes
3. Auto-assigns to available expert
4. Check risk flags
5. Fast-track through dependencies

### Capacity Planning
1. Break down multiple upcoming projects
2. Review total work vs. team capacity
3. Identify skill gaps
4. Plan hiring or training

---

## ⚡ Keyboard Shortcuts (Coming Soon)

- `Ctrl/Cmd + K`: Open breakdown modal
- `Ctrl/Cmd + A`: Auto-assign
- `Escape`: Close modal

---

## 🆘 Troubleshooting

**Problem**: Tasks not appearing after approval
- **Solution**: Refresh page or check browser console

**Problem**: Low confidence scores for all agents
- **Solution**: Add more relevant tags to tasks or update agent skills

**Problem**: Dependency graph not showing
- **Solution**: Ensure tasks have dependencies defined

---

## 📖 Learn More

For detailed documentation:
- **User Guide**: `ORCHESTRATION_GUIDE.md` (comprehensive)
- **Test Scenarios**: `TEST_ORCHESTRATION.md` (examples)
- **Technical Details**: `IMPLEMENTATION_ISSUE_8.md` (architecture)

---

## ✅ You're Ready!

You now know how to:
- ✅ Break down tasks automatically
- ✅ Review generated epics, tickets, and subtasks
- ✅ Understand Definition of Done and risk flags
- ✅ Auto-assign tasks to agents
- ✅ Visualize dependencies
- ✅ Monitor team capacity

**Start breaking down your tasks and let AI help you organize your work!** 🚀

---

**Questions?** Check the full `ORCHESTRATION_GUIDE.md` or `TEST_ORCHESTRATION.md` for examples.
