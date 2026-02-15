# Task Orchestrator Setup Guide

This guide will help you set up and use the automated task breakdown and agent orchestration features.

## Overview

The Task Orchestrator system provides:

1. **Automated Task Breakdown** - Takes issues, PRDs, or text and creates structured epics, tickets, and subtasks
2. **Agent Roster Management** - Track agent skills, performance metrics, and availability
3. **Auto-Assignment** - Intelligently assign tasks based on skills, workload, and performance
4. **Dependency Visualization** - Visual graph showing task dependencies and critical paths

## Database Setup

### Step 1: Run the Orchestrator Migration

Execute the orchestrator migration SQL in your Supabase SQL Editor:

```bash
# Location: database/orchestrator_migration.sql
```

This will create the following tables:
- `epics` - High-level feature groupings
- `definition_of_done` - Checklist items for task completion
- `test_notes` - Test cases and expected outcomes
- `risk_flags` - Risk identification and mitigation
- `task_dependencies` - Task relationship tracking
- `agent_extended_data` - Extended agent information (skills, metrics, etc.)

And add these columns to the `tasks` table:
- `epic_id` - Link to parent epic
- `required_skills` - Array of skill requirements
- `estimated_hours` - Effort estimation
- `hierarchy` - ticket or subtask
- `parent_task_id` - For subtasks

### Step 2: (Optional) Run Budget Migration

If you want budget tracking features:

```bash
# Location: database/budget_migration.sql
```

## Features

### 1. Task Breakdown Engine

Navigate to `/orchestrator` and select the "Task Breakdown" tab.

**How to use:**
1. Select input type (Text, GitHub Issue, or PRD)
2. Paste your content
3. Click "Break Down Tasks"
4. Review the generated epics, tickets, and subtasks

**Example Input:**
```
Build a user authentication system

Features:
- User registration with email validation
- Login with JWT tokens
- Password reset functionality
- Social login (Google, GitHub)
- Two-factor authentication
- User profile management
```

**Output:**
- Epics grouped by category (Backend, Frontend, Testing)
- Tickets with DoD, test notes, and risk flags
- Subtasks with implementation steps
- Dependency relationships
- Effort estimates and priority levels

### 2. Agent Roster Management

Navigate to `/orchestrator` and select the "Agent Roster" tab.

**Features:**
- View all agents with their skills and availability
- Update agent skills and performance metrics
- Track workload and capacity
- Set preferences for task types and technologies

**Agent Profile Includes:**
- **Skills**: Category, level (beginner→expert), years of experience
- **Performance Metrics**:
  - Tasks completed/in progress
  - Average completion time
  - On-time delivery rate
  - Quality score (0-100)
  - Collaboration score (0-100)
- **Availability**:
  - Status: available, busy, offline
  - Current workload vs max capacity
  - Hours per week
- **Preferences**:
  - Preferred task types
  - Avoided task types
  - Preferred technologies

### 3. Auto-Assignment System

The system can automatically assign tasks based on:

**Scoring Algorithm (Weighted):**
1. **Skill Match (40%)** - Required skills vs agent skills and levels
2. **Availability Match (30%)** - Current workload vs capacity
3. **Performance Match (20%)** - Quality score, on-time delivery rate
4. **Preference Match (10%)** - Task type preferences

**Auto-Assignment:**
- Automatically assigns if confidence > 75%
- Provides top 3-5 recommendations per task
- Detailed scoring breakdown
- Workload balancing

### 4. Dependency Visualization

Navigate to `/orchestrator` and select the "Dependency Graph" tab.

**Graph Features:**
- Visual representation of task relationships
- Status-based coloring (Backlog→Gray, In Progress→Blue, Review→Yellow, Done→Green)
- Identify critical paths and bottlenecks
- Find blocked tasks and tasks ready to start

**Analysis:**
- **Critical Path** - Longest path through the graph
- **Bottlenecks** - Tasks on critical path not yet started
- **Blocked Tasks** - Tasks waiting on dependencies
- **Next Available** - Tasks ready to start now

**Export Formats:**
- **Mermaid** - For GitHub, GitLab, Notion
- **GraphViz DOT** - For Graphviz rendering

### 5. PM Dashboard

Navigate to `/pm-dashboard` for project management oversight:

**Features:**
- Budget tracking (cost, tokens, time)
- Budget alerts and warnings
- Task pause/resume based on budget
- Project analytics and trends
- Agent workload distribution

## Usage Examples

### Example 1: Breaking Down a Feature Request

**Input (as GitHub Issue):**
```
Title: Implement Real-time Notifications

Description:
We need to add real-time notifications to the app. Users should receive
instant updates when:
- They are assigned a task
- A task they're watching changes status
- Someone comments on their task
- An agent completes work on their task

Technical requirements:
- Use WebSockets for real-time updates
- Persist notifications in database
- Show unread count in header
- Mark as read/unread functionality
- Desktop push notifications (optional)
```

**Expected Output:**
- Epic: "Real-time Notification System"
- Tickets:
  - "Backend: WebSocket server setup" (backend, high priority)
  - "Backend: Notification persistence layer" (backend, database)
  - "Frontend: Real-time notification component" (frontend)
  - "Frontend: Push notification integration" (frontend, low priority)
  - "Testing: End-to-end notification flow" (testing)
- Subtasks for each ticket with DoD items
- Risk flags: "Performance impact with many concurrent users"
- Dependencies: Backend must be completed before frontend

### Example 2: Auto-Assigning Tasks

Given these agents:
- **Alex Chen**: Frontend expert (React, Next.js)
- **Sarah Johnson**: Backend specialist (API, Database)
- **Mike Rodriguez**: Full-stack developer

For task "Build user profile page":
- Required skills: frontend, react, api
- Auto-assignment recommendation:
  1. Alex Chen (95% match) - Expert frontend, available
  2. Mike Rodriguez (80% match) - Full-stack, slightly busy
  3. Sarah Johnson (60% match) - Can do frontend but prefers backend

System auto-assigns to Alex Chen with 95% confidence.

### Example 3: Dependency Visualization

For a feature with 10 tickets:
- Graph shows "Setup API endpoints" blocks 3 frontend tickets
- Critical path identified: Setup → API → Frontend → Testing (24 hours)
- Bottleneck: "Database migration" not started but blocks 5 other tasks
- Next available: "Write documentation" (no dependencies)

Recommendation: Prioritize database migration to unblock other work.

## Best Practices

### Task Breakdown
1. **Be Specific**: Detailed descriptions lead to better breakdowns
2. **Use Keywords**: Include "frontend", "backend", "database" for better classification
3. **Mention Risks**: Include "security", "performance", "migration" for risk flagging
4. **State Priority**: Use "critical", "urgent", "low priority" explicitly

### Agent Management
1. **Keep Skills Updated**: Regularly update agent skills as they grow
2. **Track Performance**: Record task completion quality and timing
3. **Balance Workload**: Use the rebalancing feature when agents are overloaded
4. **Respect Preferences**: Consider agent preferences for higher quality work

### Dependency Management
1. **Define Dependencies Early**: Add dependencies when creating tickets
2. **Review Critical Path**: Focus on critical path tasks to reduce total time
3. **Unblock Tasks**: Prioritize tasks that are blocking others
4. **Visualize Often**: Use the graph to communicate with the team

## API Usage

### TaskBreakdownEngine

```typescript
import { TaskBreakdownEngine } from '@/lib/taskBreakdown';

const result = await TaskBreakdownEngine.breakdown(
  {
    type: 'issue',
    content: 'Your issue description...',
  },
  {
    autoAssignAgents: true,
    generateTestNotes: true,
    identifyRisks: true,
    estimateEffort: true,
  }
);

console.log(result.epics);
console.log(result.tickets);
console.log(result.subtasks);
```

### AgentOrchestrator

```typescript
import { AgentOrchestrator } from '@/lib/agentOrchestrator';

// Get recommendation for a task
const recommendation = AgentOrchestrator.recommendAgent(task, agents);

// Batch assign multiple tasks
const assignments = AgentOrchestrator.batchAssign(tasks, agents);

// Get team composition
const composition = AgentOrchestrator.getTeamComposition(agents);
```

### DependencyGraphBuilder

```typescript
import { DependencyGraphBuilder } from '@/lib/dependencyGraph';

// Build graph
const graph = DependencyGraphBuilder.buildGraph(tickets, subtasks, true);

// Analyze critical path
const analysis = DependencyGraphBuilder.analyzeCriticalPath(
  graph.criticalPath,
  graph.nodes
);

// Export to Mermaid
const mermaid = DependencyGraphBuilder.exportToMermaid(graph);
```

## Troubleshooting

### Issue: Tasks not breaking down correctly
**Solution:**
- Ensure input text has clear structure (bullet points, sections)
- Include keywords that indicate task types
- Try different input types (text vs PRD)

### Issue: Agent assignments seem wrong
**Solution:**
- Check agent skill levels match task requirements
- Verify agent availability and workload
- Update agent preferences if needed

### Issue: Dependency graph is confusing
**Solution:**
- Start with subtasks hidden
- Export to Mermaid and view in a dedicated tool
- Focus on critical path and blocked tasks first

### Issue: Migration fails
**Solution:**
- Ensure you're running the latest schema.sql first
- Check for existing tables with the same names
- Run migrations in order: schema.sql → budget_migration.sql → orchestrator_migration.sql

## Future Enhancements

Planned features:
- **AI Integration**: Use LLMs for smarter task breakdown
- **OCR Support**: Real screenshot analysis
- **GitHub Integration**: Sync with actual GitHub issues
- **Jira Integration**: Import/export to Jira
- **Performance Predictions**: ML-based completion time estimates
- **Team Chat Integration**: Slack/Discord notifications
- **Advanced Scheduling**: Gantt charts and timeline views

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation in `TASK_ORCHESTRATOR.md`
3. Check existing GitHub issues
4. Open a new issue with detailed description

## License

MIT
