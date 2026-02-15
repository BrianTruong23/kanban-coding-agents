# Issue #8: Automated Task Breakdown and Agent Orchestration - Implementation Guide

## Overview

This implementation adds a comprehensive Project Management Hub to the Kanban Coding Agents application, featuring:

1. **Automated Task Breakdown** - Break down issues/PRDs/screenshots into epics, tickets, and subtasks
2. **Agent Roster Management** - Manage coding agents with skills, performance tracking, and availability
3. **Intelligent Agent Assignment** - Auto-assign tasks based on skills, performance, and workload
4. **Dependency Visualization** - Interactive dependency graph showing task relationships
5. **PM Dashboard** - Resource utilization and budget tracking across all tasks

## New Features

### 1. Task Breakdown System

**Location:** `src/components/TaskBreakdownPanel.tsx`

Automatically analyzes requirements and creates structured work items:

- **Input Types Supported:**
  - Plain text descriptions
  - GitHub issues
  - Product Requirements Documents (PRDs)
  - Screenshots with text descriptions

- **Output:**
  - Epics (high-level features)
  - Tickets (implementation tasks)
  - Subtasks (granular work items)
  - Dependencies between items
  - Risk assessments
  - Test notes
  - Definition of Done criteria
  - Estimated effort in hours

**Key Files:**
- `src/lib/taskBreakdownUtils.ts` - Core breakdown logic
- `src/types/taskBreakdown.ts` - Type definitions

### 2. Agent Roster Management

**Location:** `src/components/AgentRosterManager.tsx`

Manage your team of coding agents with:

- **Agent Attributes:**
  - Name and description
  - Skills with proficiency levels (1-5)
  - Capacity (concurrent task limit)
  - Hours per week availability
  - Performance metrics (tasks completed, on-time rate, quality score)
  - Current workload tracking

- **Skill Categories:**
  - Frontend
  - Backend
  - Database
  - DevOps
  - Mobile
  - Testing
  - Design
  - Architecture

**Key Files:**
- `src/lib/agentAssignmentUtils.ts` - Auto-assignment algorithms
- `src/types/agent.ts` - Extended agent types

### 3. Intelligent Auto-Assignment

**Location:** `src/lib/agentAssignmentUtils.ts`

Smart task assignment considers:

- **Skill Match (40%):** Agent proficiency in required skills
- **Performance (30%):** Historical on-time delivery and quality
- **Availability (30%):** Current workload vs capacity

Additional features:
- Priority-based weighting for critical tasks
- Batch assignment with dependency awareness
- Reassignment suggestions for overloaded agents
- Team capacity analysis

### 4. Dependency Graph

**Location:** `src/components/DependencyGraph.tsx`

Interactive visualization showing:

- Task hierarchy (epics → tickets → subtasks)
- Dependency types:
  - **Blocks** (red) - Must complete before
  - **Requires** (orange) - Needed for completion
  - **Relates-to** (gray) - Related work
- Status indicators
- Priority levels
- Clickable nodes for details

### 5. PM Dashboard

**Location:** `src/components/PMDashboard.tsx`

Resource tracking and monitoring:

- **Summary Cards:**
  - Total tasks
  - Budget spent
  - Over-budget tasks
  - Paused tasks

- **Resource Utilization:**
  - Cost budget (USD)
  - Token budget
  - Time budget (minutes)
  - Visual progress bars with color-coded warnings

- **Task Status Distribution:**
  - Backlog
  - In Progress
  - In Review
  - Done

### 6. Budget Management

**Location:** `src/components/BudgetManager.tsx`, `src/lib/budgetUtils.ts`

Track resource usage per task:

- **Budget Types:**
  - Cost (USD)
  - Tokens
  - Time (minutes)
  - Retry count

- **Features:**
  - Set budget limits
  - Track current usage
  - Auto-pause on budget exceeded
  - Manual pause/resume
  - Usage warnings at 80% and 100%
  - Reset usage counters

**Key Files:**
- `src/types/budget.ts` - Budget type definitions
- `src/hooks/useBudget.ts` - Budget management hook

## Architecture

### Type System

```typescript
// Task Breakdown
TaskBreakdownInput → breakdownTask() → TaskBreakdownResult
  ├─ Epic[]
  ├─ Ticket[]
  ├─ Subtask[]
  └─ Dependency[]

// Agent Assignment
CodingAgent + TaskBreakdownItem + dependencies → autoAssignTask() → CodingAgent

// Budget Tracking
Task + TaskBudget → updateBudget() → TaskBudget (with warnings)
```

### Component Hierarchy

```
ProjectManagementHub
├─ PMDashboard (Budget & Resource Tracking)
├─ TaskBreakdownPanel
│  ├─ Input Form
│  └─ Results View
│     ├─ DependencyGraph
│     └─ Item Details
└─ AgentRosterManager
   ├─ Agent List
   └─ Agent Form (Add/Edit)
```

## Usage Guide

### Accessing the PM Hub

1. Click the "PM Hub" button in the top navigation
2. Choose from three tabs:
   - **PM Dashboard** - View budget and resource utilization
   - **Task Breakdown** - Break down new requirements
   - **Agent Roster** - Manage your agent team

### Breaking Down Tasks

1. Go to "Task Breakdown" tab
2. Select input type (Text, Issue, PRD, or Screenshot)
3. Enter or paste your requirements
4. Add optional context (tech stack, constraints, etc.)
5. Click "Break Down Tasks"
6. Review generated epics, tickets, and subtasks
7. Explore dependencies in the graph
8. Click items for detailed information

### Managing Agents

1. Go to "Agent Roster" tab
2. Click "Add Agent" to create a new agent
3. Fill in:
   - Name and description
   - Capacity (concurrent tasks)
   - Hours per week
   - Skills with proficiency levels (1-5)
4. View agent performance metrics
5. Edit or delete agents as needed

### Setting Task Budgets

1. In the Kanban board, find a task
2. Click the task to open details
3. Access the Budget Manager
4. Set budget limits:
   - Max cost (USD)
   - Max tokens
   - Max time (minutes)
   - Max retries
5. Track usage over time
6. Tasks auto-pause when over budget

### Auto-Assigning Tasks

The system can automatically assign tasks based on:

```typescript
// Single task assignment
const agent = autoAssignTask(task, agents);

// Batch assignment with dependencies
const assignments = batchAutoAssign(tasks, agents, dependencies);

// Get reassignment suggestions
const suggestions = suggestReassignment(overloadedAgentId, tasks, agents);

// Analyze team capacity
const analysis = analyzeTeamCapacity(tasks, agents);
```

## Algorithm Details

### Task Breakdown Algorithm

The breakdown process:

1. **Input Analysis**
   - Extract features (keywords: "implement", "add", "feature")
   - Identify user stories (keywords: "as a", "user", "want")
   - Find technical requirements (keywords: "database", "api", "integration")
   - Detect risks (keywords: "security", "challenge", "difficult")

2. **Epic Generation**
   - Create epics from unique features
   - Assign priority based on order
   - Add business value and acceptance criteria
   - Generate Definition of Done items

3. **Ticket Creation**
   - For each epic, generate 3-4 tickets
   - Template-based based on feature type (auth, dashboard, notifications)
   - Estimate effort based on complexity keywords
   - Add test notes and risk flags

4. **Subtask Breakdown**
   - Only for complex tickets (>6 hours)
   - 4 subtasks per ticket (design, implement, error handling, tests)
   - Divide effort evenly

5. **Dependency Mapping**
   - Subtasks block their parent ticket
   - Tickets block their parent epic
   - All use "blocks" relationship type

### Auto-Assignment Algorithm

Scoring formula:

```
baseScore = (skillMatch * 0.4) + (performance * 0.3) + (availability * 0.3)
finalScore = baseScore * priorityMultiplier

where:
- skillMatch: Average proficiency in required skills (0-1)
- performance: (onTimeRate * 0.6) + (qualityScore/100 * 0.4)
- availability: 1 - (currentWorkload / capacity)
- priorityMultiplier: 1.2 for high-priority tasks, 1.0 otherwise
```

Assignment threshold: minimum score of 0.2 required.

### Budget Tracking Algorithm

Warning thresholds:

- **Info** (< 80%): Normal usage
- **Warning** (80-99%): Approaching limit
- **Critical** (≥ 100%): Over budget

Auto-pause triggers when ANY budget metric exceeds 100%.

## File Structure

```
src/
├── components/
│   ├── ProjectManagementHub.tsx      # Main hub with tabs
│   ├── TaskBreakdownPanel.tsx        # Task breakdown UI
│   ├── DependencyGraph.tsx           # Dependency visualization
│   ├── PMDashboard.tsx               # Budget dashboard
│   ├── AgentRosterManager.tsx        # Agent management
│   └── BudgetManager.tsx             # Task budget UI
├── lib/
│   ├── taskBreakdownUtils.ts         # Breakdown algorithms
│   ├── agentAssignmentUtils.ts       # Assignment algorithms
│   └── budgetUtils.ts                # Budget calculations
├── types/
│   ├── taskBreakdown.ts              # Task breakdown types
│   ├── agent.ts                      # Agent types (extended)
│   ├── budget.ts                     # Budget types
│   └── task.ts                       # Task types (with budget)
└── hooks/
    └── useBudget.ts                  # Budget management hook
```

## Future Enhancements

Potential improvements:

1. **AI Integration**
   - Use LLM for smarter task breakdown
   - Natural language parsing for requirements
   - Screenshot OCR and analysis

2. **Advanced Analytics**
   - Agent performance trends
   - Sprint velocity tracking
   - Burndown charts
   - Cost forecasting

3. **Workflow Automation**
   - Auto-create tasks from breakdown
   - Auto-assign on task creation
   - Slack/email notifications
   - Integration with GitHub/Jira

4. **Enhanced Visualization**
   - Gantt charts
   - Resource allocation timeline
   - Critical path analysis
   - Risk heat maps

5. **Collaboration Features**
   - Agent comments and updates
   - Real-time collaboration
   - Task handoff workflows
   - Progress tracking

## Testing

To test the implementation:

1. **Task Breakdown:**
   ```
   Input: "Implement user authentication with OAuth, password reset, and session management"
   Expected: 1 epic, 3-4 tickets, multiple subtasks, dependencies
   ```

2. **Agent Assignment:**
   ```
   Create agents with different skills
   Assign tasks with matching tags
   Verify highest-scoring agent is selected
   ```

3. **Budget Tracking:**
   ```
   Set budget limits on a task
   Add usage incrementally
   Verify warnings at 80%
   Verify auto-pause at 100%
   ```

4. **Dependency Graph:**
   ```
   Break down a task
   Verify all items appear in graph
   Verify dependency lines are drawn
   Click nodes to see details
   ```

## API Integration Points

For future backend integration:

```typescript
// Task breakdown could call AI service
async function breakdownTaskWithAI(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
  const response = await fetch('/api/breakdown', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return response.json();
}

// Agent assignment could use ML model
async function assignTaskWithML(task: TaskBreakdownItem, agents: CodingAgent[]): Promise<string> {
  const response = await fetch('/api/assign', {
    method: 'POST',
    body: JSON.stringify({ task, agents })
  });
  return response.json();
}
```

## Performance Considerations

- Task breakdown is synchronous (runs in browser)
- Graph layout calculation is O(n²) for dependencies
- Large projects (>100 items) may need virtualization
- Consider pagination for agent lists with >50 agents
- Budget calculations are cached in component state

## Accessibility

All components include:

- Keyboard navigation
- ARIA labels
- Focus management
- Color-blind safe color schemes
- Screen reader announcements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported with responsive design
