# Agent Orchestration System - User Guide

## Overview

The Agent Orchestration System is an intelligent task breakdown and assignment tool that helps you manage complex projects by:

1. **Automatically breaking down** issues, PRDs, and requirements into actionable work items
2. **Generating comprehensive task details** including Definition of Done, test notes, and risk flags
3. **Intelligently assigning tasks** to agents based on skills, performance, and availability
4. **Visualizing dependencies** between tasks to understand execution order

---

## Getting Started

### Accessing the Orchestration Dashboard

1. Log in to your Kanban Coding Agents account
2. Click the **"Orchestration"** button in the top navigation bar
3. You'll see the Agent Orchestration Dashboard

### Dashboard Overview

The dashboard displays:
- **Team Statistics**: Team size, average workload, remaining capacity, dependencies
- **Agent Performance Cards**: Individual agent metrics and skills
- **Auto-Assignment Controls**: Bulk assignment functionality
- **Dependency Graph**: Visual representation of task relationships

---

## Breaking Down Tasks

### Step 1: Open the Breakdown Modal

Click the **"Break Down Task"** button in the dashboard header.

### Step 2: Choose Input Type

Select one of the following input types:
- **Text/PRD**: Paste your Product Requirements Document or task description
- **GitHub Issue**: Link to a GitHub issue (or paste issue content directly)

### Step 3: Enter Task Description

Paste or type your task description. The system works best with structured input:

**Example - Simple Task:**
```
Add a dark mode toggle to the application settings
```

**Example - Medium Complexity:**
```
User Registration System

Implement the following:
1. Email/password registration
2. Email verification
3. User profile creation
4. Password strength validation

Technical requirements:
- Use bcrypt for password hashing
- Send verification emails via SendGrid
- Store user data in PostgreSQL
```

**Example - Epic-Level:**
```
# E-Commerce Platform

Build a complete e-commerce solution with:

1. Product Catalog
   - Search and filtering
   - Product details pages
   - Category management

2. Shopping Cart
   - Add/remove items
   - Session persistence
   - Quantity updates

3. Checkout Process
   - Payment integration (Stripe)
   - Order confirmation
   - Email receipts

4. User Management
   - Authentication
   - Profile management
   - Order history

Technical Stack:
- React + TypeScript frontend
- Node.js + Express backend
- PostgreSQL database
- Docker deployment
```

### Step 4: Review Breakdown Results

The system will analyze your input and generate:

#### **Epics** (for complex projects)
- High-level project phases
- Contains multiple tickets
- Tracks overall progress

#### **Tickets** (actionable work items)
- Clear titles and descriptions
- Priority levels (1-5)
- Tags for categorization
- Time estimates

#### **Subtasks** (detailed steps)
- Granular implementation tasks
- Assigned to parent tickets
- Individual time estimates

#### **Definition of Done**
Each ticket includes completion criteria:
- Code implemented and reviewed
- Tests written and passing
- Documentation updated
- No critical bugs

#### **Test Notes**
Testing requirements by type:
- **Unit Tests**: Individual function testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full workflow testing
- **Manual Tests**: User acceptance testing

#### **Risk Flags**
Potential issues identified with:
- **Severity**: Critical, High, Medium, Low
- **Category**: Technical, Timeline, Dependency, Resource, Quality
- **Mitigation**: Suggested risk reduction strategies

#### **Dependencies**
Task relationships:
- **Blocks**: Task must complete before dependent task can start
- **Relates-to**: Tasks are connected but not blocking
- **Duplicates**: Similar or duplicate work

### Step 5: Approve and Add to Board

If the breakdown looks good, click **"Approve & Add to Board"** to add the tasks to your orchestration dashboard.

---

## Agent Assignment

### Understanding Agent Recommendations

For each task, the system recommends agents based on a scoring algorithm:

#### **Scoring Factors (100 points max)**

1. **Skills Match (40 points)**
   - Expert level: 20 points
   - Advanced level: 15 points
   - Intermediate level: 10 points
   - Beginner level: 5 points

2. **Performance (30 points)**
   - Success rate: 0-10 points
   - Quality score: 0-10 points
   - Reliability: 0-10 points

3. **Availability (20 points)**
   - Status (available/busy/offline): 0-10 points
   - Current workload: 0-10 points

4. **Workload Balance (10 points)**
   - Agents with lower workload get higher scores
   - Ensures fair distribution

### Manual Assignment

To manually assign a task:
1. Click on a task in the orchestration dashboard
2. View the recommended agents
3. Click **"Assign to [Agent Name]"** on your preferred agent

### Auto-Assignment

To automatically assign all unassigned tasks:
1. Click the **"Auto-Assign Tasks"** button
2. The system will assign tasks to the best-matching agents
3. High-priority tasks are assigned first
4. Assignments are distributed to balance workload

---

## Dependency Visualization

### Understanding the Dependency Graph

The graph shows:
- **Nodes**: Tickets and subtasks
- **Edges**: Dependencies between tasks
- **Colors**:
  - Blue nodes: Tickets
  - Purple nodes: Subtasks
  - Red edges: Blocking dependencies
  - Dashed gray edges: Related tasks
  - Yellow edges: Duplicate tasks

### Status Indicators

- 🟢 Green: Completed
- 🔵 Blue: In Progress
- 🟡 Yellow: In Review
- 🔴 Red: Blocked
- ⚪ Gray: Backlog

### Interacting with the Graph

- **Click a node** to highlight its dependencies
- **Click again** to deselect
- **Scroll** to zoom in/out (if implemented)
- **Drag nodes** to rearrange layout (if implemented)

### Using Dependencies for Planning

1. Identify tasks with no dependencies (can start immediately)
2. Plan execution order based on blocking relationships
3. Monitor progress - blocked tasks turn red if dependencies aren't complete
4. Optimize team workflow by parallelizing independent tasks

---

## Team Capacity Management

### Reading Team Statistics

The dashboard header shows:

- **Team Size**: Total agents / Available agents
- **Avg Workload**: Average workload percentage across all agents
- **Capacity**: Remaining team capacity percentage
- **Dependencies**: Total number of task dependencies

### Understanding Agent Performance Cards

Each agent card displays:

- **Avatar**: Visual identifier
- **Status**: Available, Busy, or Offline
- **Tasks Done**: Completed tasks count
- **Success Rate**: Percentage of successfully completed tasks
- **Quality Score**: Code/work quality rating (0-100)
- **Workload Bar**: Visual representation of current workload
  - Green (0-50%): Low workload
  - Yellow (50-80%): Moderate workload
  - Red (80-100%): High workload
- **Top Skills**: Primary skills and proficiency levels

### Optimizing Team Capacity

**If capacity is low (<30%):**
- Consider deferring non-critical tasks
- Reassign tasks from overloaded agents
- Plan for additional resources

**If capacity is high (>70%):**
- Great time to tackle epic-level projects
- Can handle multiple concurrent initiatives
- Good opportunity for experimentation

---

## Best Practices

### Writing Effective Task Descriptions

✅ **DO:**
- Use clear, descriptive titles
- Break complex requirements into numbered/bulleted lists
- Include technical requirements separately
- Specify acceptance criteria
- Mention relevant technologies
- Note security or performance concerns

❌ **DON'T:**
- Be vague or ambiguous ("make it better")
- Mix unrelated features in one description
- Skip technical details
- Forget to mention constraints or limitations

### Managing Dependencies

✅ **DO:**
- Create blocking dependencies for true prerequisites
- Use "relates-to" for loose connections
- Review dependency graph before starting work
- Update dependencies as project evolves

❌ **DON'T:**
- Create circular dependencies
- Over-dependency (not everything needs to block)
- Ignore dependencies when planning sprints

### Optimizing Agent Assignment

✅ **DO:**
- Trust the auto-assignment algorithm for first pass
- Review high-priority task assignments manually
- Consider agent development goals (stretch assignments)
- Balance workload across the team
- Update agent skills as they learn

❌ **DON'T:**
- Always assign to the same "favorite" agent
- Ignore availability and workload
- Assign without considering skill match
- Over-commit agents beyond capacity

---

## Workflows and Use Cases

### Use Case 1: Sprint Planning

1. Break down all user stories and features
2. Review generated tickets and priorities
3. Check dependency graph for execution order
4. Auto-assign tasks to team
5. Review and adjust assignments
6. Export or sync to main kanban board

### Use Case 2: Epic Breakdown

1. Paste epic-level requirements (PRD or spec)
2. Review generated epic, tickets, and subtasks
3. Validate dependencies make sense
4. Identify high-risk items
5. Plan mitigation strategies
6. Assign tickets to specialized teams

### Use Case 3: Bug Triage

1. Create a task for critical bug
2. System identifies as high priority
3. Auto-assigns to best available agent with relevant skills
4. Review risk flags (data loss, security impact)
5. Fast-track through dependency-free execution

### Use Case 4: Capacity Planning

1. Break down multiple upcoming projects
2. Review team capacity metrics
3. Identify skill gaps for specific tasks
4. Plan hiring or training needs
5. Schedule work based on available capacity

---

## Keyboard Shortcuts

(To be implemented)

- `Ctrl/Cmd + K`: Open task breakdown modal
- `Ctrl/Cmd + A`: Auto-assign tasks
- `Ctrl/Cmd + D`: Toggle dependency graph
- `Escape`: Close modals
- `Tab`: Navigate between form fields

---

## Troubleshooting

### Issue: Tasks not appearing after approval

**Solution:** Refresh the page or check browser console for errors. Ensure you're logged in.

### Issue: Auto-assignment not working

**Solution:** Verify that:
1. You have agents in your team
2. Agents are not all offline
3. Tasks have tags that match agent skills

### Issue: Dependency graph not rendering

**Solution:**
1. Ensure tasks have dependencies defined
2. Try refreshing the page
3. Check browser console for JavaScript errors

### Issue: Agent skills not matching

**Solution:** Agent skills are currently initialized with defaults. Update the agent management system to customize skills.

### Issue: Confidence scores seem low

**Possible reasons:**
1. Task tags don't match agent skills
2. All agents have high workload
3. No agents with relevant specializations
4. Agent performance metrics are low

---

## Advanced Features

### Custom Risk Assessment

The system automatically flags risks based on keywords:
- **Security**: Authentication, encryption, passwords, tokens
- **Database**: Migration, schema changes, data loss
- **Performance**: Optimization, scaling, load testing
- **Integration**: Third-party APIs, external services

### Performance Metrics

Agent performance is tracked via:
- **Success Rate**: Completed tasks / Total assigned tasks
- **Quality Score**: Based on code review feedback
- **Reliability**: Meeting deadlines and estimates
- **Average Completion Time**: Historical task duration

### Specialization Matching

Agents can have specializations beyond specific skills:
- Frontend Development
- Backend Development
- Full-Stack Development
- DevOps
- Testing/QA
- UI/UX Design
- System Architecture

These specializations improve matching for tasks with those tags.

---

## API Integration (Future)

Coming soon:
- REST API for task breakdown
- Webhook notifications for assignments
- Integration with GitHub, Jira, Linear
- Export breakdowns to JSON/CSV
- Bulk import from project management tools

---

## Feedback and Support

For issues, feature requests, or questions:
1. Check this guide first
2. Review the TEST_ORCHESTRATION.md file for examples
3. Check the IMPLEMENTATION_ISSUE_8.md for technical details
4. Report bugs via GitHub issues

---

## Version History

### v1.0.0 (Current)
- Initial release
- Automated task breakdown
- Agent roster management
- Auto-assignment based on skills and performance
- Dependency graph visualization
- Team capacity tracking

### Planned for v1.1.0
- AI/LLM integration for smarter parsing
- Database persistence for agent data
- Real-time collaboration
- GitHub issue import
- Custom breakdown templates

---

## Credits

Developed for the Kanban Coding Agents platform to streamline project management and improve team efficiency through intelligent automation.
