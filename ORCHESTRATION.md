# Task Orchestration & Agent Management

This document describes the automated task breakdown and agent orchestration system implemented for the Kanban Coding Agents application.

## Overview

The orchestration system provides intelligent task breakdown, agent skill management, auto-assignment, and dependency visualization. It can analyze issues, PRDs, or plain text to automatically generate structured work breakdown with epics, tickets, and subtasks.

## Features

### 1. Automated Task Breakdown

Break down complex requirements into structured work items:

- **Epics**: High-level features or initiatives
- **Tickets**: Individual work items with detailed specifications
- **Subtasks**: Granular implementation steps

#### Key Capabilities:

- **Input Types**: Supports GitHub issues, PRDs, screenshots, and plain text
- **Smart Parsing**: Automatically identifies features, requirements, and tasks
- **Priority Inference**: Detects priority from keywords (critical, urgent, high, low, etc.)
- **Definition of Done**: Auto-generates acceptance criteria based on task type
- **Test Notes**: Creates test scenarios and edge cases to consider
- **Risk Identification**: Flags security, performance, and complexity risks
- **Effort Estimation**: Provides hour estimates based on task complexity

#### Usage:

```typescript
import { TaskBreakdownEngine } from '@/lib/taskBreakdown';

const breakdown = TaskBreakdownEngine.breakdown({
  type: 'prd',
  content: `
    ## User Authentication
    Implement secure user authentication with email/password and social login.

    - Email/password authentication
    - Google and GitHub OAuth integration
    - Password reset functionality
  `,
});

// Result includes:
// - breakdown.epics: Epic-level features
// - breakdown.tickets: Detailed work items
// - breakdown.subtasks: Implementation tasks
// - breakdown.dependencies: Task relationships
```

### 2. Agent Roster Management

Comprehensive agent skill and performance tracking:

#### Agent Skills:
- **Skill Categories**: Frontend, Backend, Database, DevOps, Mobile, Testing, Design, AI/ML
- **Skill Levels**: Beginner, Intermediate, Advanced, Expert
- **Dynamic Updates**: Add/remove skills per agent

#### Performance Metrics:
- **Tasks Completed**: Total finished tasks
- **Tasks In Progress**: Current workload
- **On-Time Delivery Rate**: Percentage of tasks completed on time
- **Quality Score**: Overall work quality (0-100)
- **Average Completion Time**: Historical performance data

#### Availability Tracking:
- **Current Capacity**: Available bandwidth (percentage)
- **Max Concurrent Tasks**: Maximum simultaneous assignments
- **Current Tasks**: Active task assignments

#### Usage:

```typescript
import { AgentOrchestrator } from '@/lib/agentOrchestration';

// Create agent roster from existing agents
const roster = AgentOrchestrator.createAgentRoster(agent);

// Update performance after task completion
const updated = AgentOrchestrator.updateAgentPerformance(
  agent,
  true,  // task completed
  true,  // on time
  85     // quality rating
);

// Update availability
const withAvailability = AgentOrchestrator.updateAgentAvailability(
  agent,
  {
    currentTasks: ['task-1', 'task-2'],
    maxConcurrentTasks: 3,
  }
);
```

### 3. Auto-Assignment Engine

Intelligent task assignment based on multiple factors:

#### Scoring Algorithm:

The auto-assignment engine calculates scores (0-100) for each agent based on:

1. **Skill Match (50% weight)**: How well agent skills match task requirements
2. **Performance Score (25% weight)**: Historical quality and delivery metrics
3. **Availability (25% weight)**: Current capacity and workload

#### Configuration Options:

```typescript
interface AutoAssignmentConfig {
  preferSkillMatch: boolean;       // Prioritize skill matching
  considerPerformance: boolean;    // Factor in past performance
  balanceWorkload: boolean;        // Distribute work evenly
  respectCapacity: boolean;        // Honor max concurrent tasks
}
```

#### Usage:

```typescript
import { AgentOrchestrator } from '@/lib/agentOrchestration';

// Calculate assignment scores for all agents
const scores = AgentOrchestrator.calculateAssignmentScores(
  ticket,
  agents,
  {
    preferSkillMatch: true,
    considerPerformance: true,
    balanceWorkload: true,
    respectCapacity: true,
  }
);

// Auto-assign to best match
const assignedAgentId = AgentOrchestrator.autoAssign(ticket, agents);

// View workload distribution
const distribution = AgentOrchestrator.getWorkloadDistribution(agents);
```

### 4. Dependency Visualization

Interactive graph showing task relationships:

#### Dependency Types:
- **Blocks**: Task A blocks task B (B cannot start until A is done)
- **Requires**: Task A requires task B (A depends on B)
- **Related**: Tasks are related but not strictly dependent

#### Features:
- Visual node-based graph
- Color-coded by type (epic, ticket, subtask)
- Status indicators
- Circular dependency detection
- Interactive selection

### 5. Risk Management

Automatic risk identification and flagging:

#### Risk Levels:
- **Critical**: Security-sensitive, breaking changes
- **High**: Database migrations, backward compatibility
- **Medium**: Performance implications, third-party integrations
- **Low**: Standard development tasks

#### Risk Patterns Detected:
- Security and authentication concerns
- Database schema changes
- Performance and scalability issues
- External API dependencies
- Breaking changes

## Components

### TaskBreakdownPanel

Main interface for generating task breakdowns:

```tsx
<TaskBreakdownPanel
  agents={agentRoster}
  onImportBreakdown={(breakdown) => {
    // Handle import to kanban board
  }}
/>
```

Features:
- Input type selection (issue, PRD, screenshot, text)
- Real-time breakdown generation
- Expandable epic/ticket/subtask hierarchy
- Risk flag visualization
- Recommended agent assignments

### AgentRosterManager

Agent skill and performance management:

```tsx
<AgentRosterManager
  agents={agentRoster}
  onUpdateAgent={handleUpdate}
  onAddSkill={handleAddSkill}
  onRemoveSkill={handleRemoveSkill}
/>
```

Features:
- Workload distribution overview
- Performance metrics dashboard
- Skill management interface
- Availability tracking
- Utilization visualization

### DependencyGraph

Visual dependency relationships:

```tsx
<DependencyGraph
  epics={breakdown.epics}
  tickets={breakdown.tickets}
  subtasks={breakdown.subtasks}
  dependencies={breakdown.dependencies}
/>
```

Features:
- Canvas-based visualization
- Interactive node selection
- Dependency type indicators
- Circular dependency warnings

### OrchestrationDashboard

Unified interface combining all orchestration features:

```tsx
<OrchestrationDashboard agents={agents} />
```

Includes:
- Tabbed navigation (Breakdown, Roster, Dependencies)
- Integrated workflow
- State management across features

## Database Schema

The orchestration system extends the database with:

### Tables:

1. **epics**: High-level features
2. **tickets**: Detailed work items
3. **subtasks**: Implementation tasks
4. **risk_flags**: Risk identification
5. **dependencies**: Task relationships
6. **agent_skills**: Agent skill profiles
7. **agent_performance**: Performance metrics

### Key Fields:

```sql
-- Tickets table (example)
create table tickets (
  id uuid primary key,
  epic_id uuid references epics(id),
  title text not null,
  description text,
  priority integer check (priority >= 1 and priority <= 5),
  estimated_effort numeric,
  status text check (status in ('backlog', 'in-progress', 'review', 'done')),
  assigned_agent_id uuid references agents(id),
  definition_of_done text[],
  test_notes text[],
  tags text[],
  ...
);
```

## Access

Navigate to the orchestration dashboard:

1. Click the "Task Orchestration" button in the main kanban view
2. Or directly visit `/orchestration`

## Example Workflows

### Workflow 1: Breaking Down a Feature Request

1. Navigate to Task Orchestration dashboard
2. Select "Task Breakdown" tab
3. Choose input type (e.g., "PRD")
4. Paste requirement document
5. Click "Generate Breakdown"
6. Review epics, tickets, and subtasks
7. Check auto-generated DoD and test notes
8. Review risk flags
9. See recommended agent assignments
10. Import to kanban board

### Workflow 2: Managing Agent Skills

1. Navigate to "Agent Roster" tab
2. View workload distribution
3. Click on an agent to view details
4. Review performance metrics
5. Add/remove skills as needed
6. Monitor availability and capacity

### Workflow 3: Analyzing Dependencies

1. Generate a task breakdown
2. Navigate to "Dependencies" tab
3. View visual dependency graph
4. Identify blocking relationships
5. Check for circular dependencies
6. Plan execution order

## Integration Points

The orchestration system integrates with:

- **Task Management**: Convert breakdown to kanban tasks
- **Agent Assignment**: Auto-assign based on skills and availability
- **Performance Tracking**: Update metrics on task completion
- **Workload Balancing**: Distribute tasks evenly across agents

## Future Enhancements

Potential improvements:

1. **AI-Powered Breakdown**: Use LLM for more intelligent parsing
2. **Historical Learning**: Improve estimates based on past performance
3. **Collaboration Features**: Multi-user orchestration
4. **Export Capabilities**: Export to Jira, Linear, etc.
5. **Real-Time Updates**: WebSocket-based live updates
6. **Advanced Analytics**: Predictive analytics and insights
7. **Screenshot Analysis**: OCR and vision-based requirement parsing

## API Reference

See inline TypeScript documentation in:

- `/src/lib/taskBreakdown.ts`
- `/src/lib/agentOrchestration.ts`
- `/src/types/breakdown.ts`
- `/src/types/agentRoster.ts`

## Contributing

When adding new features:

1. Update type definitions
2. Extend parsing logic in TaskBreakdownEngine
3. Add new scoring factors to AgentOrchestrator
4. Update database schema if needed
5. Document changes in this file
