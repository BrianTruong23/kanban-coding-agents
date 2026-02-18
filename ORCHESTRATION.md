# Agent Orchestration & Task Breakdown System

## Overview

This document describes the automated task breakdown and agent orchestration features implemented in the Kanban Coding Agents application.

## Features

### 1. Automated Task Breakdown

The system can automatically break down issues, PRDs, and requirements into structured work items:

- **Epics**: High-level initiatives containing multiple stories
- **Stories**: User-facing features or capabilities
- **Tasks**: Concrete implementation work items
- **Subtasks**: Granular steps within tasks

#### Key Capabilities

- **Natural Language Parsing**: Extracts structured tasks from free-text requirements
- **Definition of Done (DoD)**: Automatically identifies acceptance criteria
- **Test Notes**: Extracts test cases, expected behavior, and edge cases
- **Risk Flags**: Identifies potential risks (security, performance, complexity)
- **Tag Extraction**: Automatically tags tasks based on content (frontend, backend, urgent, etc.)
- **Effort Estimation**: Estimates work effort in hours
- **Priority Assignment**: Sets priority based on keywords and context

#### Usage

1. Navigate to `/orchestration` page
2. Click "AI Breakdown" button
3. Enter your issue/PRD content in the modal
4. Review the generated breakdown
5. Click "Import All Tasks" to add them to your board

#### Input Format Tips

For best results, structure your input using:

```markdown
# Feature Title

## Overview
Brief description of the feature

## Requirements
- Requirement 1
- Requirement 2

## Acceptance Criteria
- Criterion 1
- Criterion 2

## Testing
- Test case 1
- Test case 2

## Edge Cases
- Edge case 1
```

### 2. Agent Orchestration

#### Agent Skills & Capabilities

Each agent has:
- **Skills**: Proficiency levels (beginner, intermediate, advanced, expert) in various technologies
- **Performance Metrics**: Success rate, tasks completed, average completion time
- **Availability**: Current load, max capacity, availability status
- **Specializations**: Areas where they excel
- **Task Type Preferences**: Preferred types of work (epic, story, task, subtask)

#### Auto-Assignment Algorithm

The system scores agents for tasks based on:

1. **Skill Match (40 points max)**
   - Matches task tags with agent skills
   - Higher skill levels receive more points
   - Task type preference bonus

2. **Availability (30 points max)**
   - Prioritizes agents with lower workload
   - Unavailable agents score 0

3. **Performance (30 points max)**
   - Success rate contribution
   - Recent activity bonus
   - Completion history bonus

#### Agent Match Score Breakdown

```typescript
Total Score = Skill Score + Availability Score + Performance Score

Skill Score (0-40):
- Expert skill match: 10 points
- Advanced skill match: 6 points
- Intermediate skill match: 4 points
- Beginner skill match: 2 points
- Task type preference: +5 points

Availability Score (0-30):
- Based on inverse of current load
- 0% load = 30 points
- 100% load = 0 points

Performance Score (0-30):
- Success rate: 0-15 points (based on percentage)
- Recent activity (<24h): +10 points
- High completion count (>10 tasks): +5 points
```

### 3. Dependency Visualization

The dependency graph shows relationships between tasks:

- **Blocks**: Task A blocks Task B from starting
- **Blocked By**: Task A is blocked by Task B
- **Relates To**: General relationship between tasks

Tasks are positioned using topological sorting to show dependency flow.

#### Graph Features

- Color-coded by status (backlog, in-progress, review, done)
- Shows task ID, title, type, and priority
- Arrow colors indicate dependency type
- Interactive - click tasks to navigate

### 4. Agent Roster Management

The agent roster provides visibility into:

- Current workload and availability
- Performance metrics
- Top skills and specializations
- Average completion time
- Active task count

Available in two views:
- **Compact**: Sidebar with quick status overview
- **Full**: Detailed cards with all metrics

## Database Schema

### Extended Task Fields

```sql
-- Task type hierarchy
type text CHECK (type IN ('epic', 'story', 'task', 'subtask'))

-- Relationships
parent_task_id uuid REFERENCES tasks(id)
epic_id uuid REFERENCES tasks(id)

-- Planning
story_points integer
estimated_effort numeric(6,2)

-- Quality assurance
definition_of_done jsonb  -- {criteria: string[], completedCriteria: string[]}
test_notes jsonb          -- {testCases: string[], expectedBehavior: string, ...}
risk_flags jsonb          -- [{level: string, description: string, ...}]

-- Dependencies
dependencies jsonb        -- [{taskId: string, type: string}]

-- AI suggestions
suggested_agent_ids uuid[]
```

### Extended Agent Fields

```sql
-- Capabilities
skills jsonb              -- [{name: string, level: string, category: string}]

-- Performance tracking
performance_metrics jsonb -- {tasksCompleted, successRate, avgCompletionTime, ...}

-- Availability
availability jsonb        -- {isAvailable, currentLoad, maxCapacity}

-- Preferences
preferred_task_types text[]
working_hours jsonb
```

## API Usage

### TaskBreakdownService

```typescript
import { TaskBreakdownService } from '@/lib/taskBreakdown';

const service = new TaskBreakdownService(startingTaskNumber);
const result = service.breakdownIssue({
  title: 'Feature Title',
  description: 'Description',
  type: 'text',
  content: 'Your issue/PRD content here...'
});

// result contains: epic, stories, tasks, subtasks, dependencies
```

### AgentOrchestrationService

```typescript
import { agentOrchestrator } from '@/lib/agentOrchestration';

// Find best agents for a task
const matches = agentOrchestrator.findBestAgentsForTask(task, agents, 3);

// Auto-assign all unassigned tasks
const assignments = agentOrchestrator.autoAssignTasks(tasks, agents);

// Get reassignment suggestions
const suggestions = agentOrchestrator.suggestReassignments(tasks, agents);

// Update metrics after task completion
const updatedAgent = agentOrchestrator.updateAgentMetrics(
  agent,
  task,
  success,
  completionTimeHours
);
```

## Setup Instructions

### 1. Database Migration

Run the extended schema migration:

```sql
-- First run the base schema
\i database/schema.sql

-- Then run the extensions
\i database/schema-extended.sql
```

### 2. Access the Features

Visit the orchestration dashboard:
```
http://localhost:3000/orchestration
```

### 3. Using the AI Breakdown

1. Click "AI Breakdown" button
2. Paste your issue/PRD/requirements
3. Review generated tasks
4. Import to your board

### 4. Managing Agents

- View agent roster in the sidebar or Agents tab
- Agents are auto-created on user signup with default skills
- Agent performance metrics update automatically as tasks complete

## Architecture

### Components

```
src/
├── components/
│   ├── TaskBreakdownModal.tsx    # AI breakdown UI
│   ├── DependencyGraph.tsx        # Dependency visualization
│   ├── AgentRoster.tsx            # Agent management UI
│   └── ...
├── lib/
│   ├── taskBreakdown.ts           # Task parsing service
│   └── agentOrchestration.ts      # Agent matching logic
├── types/
│   ├── task.ts                     # Extended task types
│   └── agent.ts                    # Extended agent types
└── app/
    └── orchestration/
        └── page.tsx                # Main dashboard
```

### Data Flow

```
User Input (Issue/PRD)
    ↓
TaskBreakdownService
    ↓
Parsed Tasks (Epic, Stories, Tasks, Subtasks)
    ↓
AgentOrchestrationService
    ↓
Auto-suggested Agents
    ↓
Database (Supabase)
    ↓
UI (Kanban/Dependencies/Roster)
```

## Best Practices

### 1. Task Breakdown

- Use markdown headers to structure content
- Include explicit acceptance criteria
- Mention test cases and edge cases
- Use keywords like "urgent", "critical" for priority
- Reference technologies explicitly for better tagging

### 2. Agent Assignment

- Review auto-suggestions before assigning
- Balance workload across agents
- Consider agent specializations
- Monitor availability and load

### 3. Dependencies

- Define dependencies explicitly in task descriptions
- Use dependency graph to identify bottlenecks
- Prioritize unblocking tasks first

### 4. Performance Tracking

- Mark tasks as done when truly complete
- Track actual vs estimated effort
- Review agent metrics regularly
- Reassign if suggested for better matches

## Future Enhancements

Potential improvements:

1. **Machine Learning Integration**: Train models on historical data for better estimates
2. **GitHub Integration**: Auto-import issues and PRs
3. **Slack Notifications**: Alert agents on task assignments
4. **Gantt Chart View**: Timeline visualization with dependencies
5. **Capacity Planning**: Forecast sprint capacity based on agent availability
6. **Custom Workflows**: Define organization-specific task breakdown rules
7. **Agent Collaboration**: Multi-agent task assignment
8. **Real-time Updates**: WebSocket-based live collaboration

## Troubleshooting

### Tasks not breaking down correctly

- Ensure content has clear structure
- Use markdown headers
- Include explicit lists and criteria

### Agent matching scores seem off

- Check agent skill definitions in database
- Verify performance metrics are updating
- Review availability settings

### Dependencies not showing

- Ensure tasks have dependencies field populated
- Check that referenced task IDs exist
- Verify dependency graph component is rendering

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in implementation files
3. Check GitHub issues
4. Submit new issue with detailed description

## License

MIT License - See LICENSE file for details
