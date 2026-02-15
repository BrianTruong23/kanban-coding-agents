# Task Orchestrator - Automated Task Breakdown and Agent Management

## Overview

The Task Orchestrator is a comprehensive system for automated task breakdown and agent orchestration. It can take an issue, PRD, or screenshot and automatically break it down into epics, tickets, and subtasks with Definition of Done, test notes, risk flags, and dependency visualization.

## Features

### 1. Automated Task Breakdown

The Task Breakdown Engine analyzes input sources and creates structured task hierarchies:

#### Input Sources
- **GitHub Issues**: Parse issue descriptions and comments
- **PRD Documents**: Extract features and requirements from Product Requirement Documents
- **Screenshots**: OCR and UI element detection (placeholder for future AI integration)
- **Plain Text**: Simple text-based descriptions

#### Output Structure
- **Epics**: High-level features grouped logically
  - Title and description
  - Business value statement
  - Acceptance criteria
  - Estimated hours

- **Tickets**: Individual features or requirements
  - Linked to parent epic
  - Definition of Done (DoD) items
  - Test notes (unit, integration, e2e)
  - Risk flags (low, medium, high, critical)
  - Required skills
  - Dependencies
  - Priority (1-5)
  - Estimated hours

- **Subtasks**: Granular implementation steps
  - Linked to parent ticket
  - DoD items
  - Test notes
  - Risk flags
  - Dependencies

#### Intelligent Features
- **Auto-prioritization**: Keywords like "critical", "urgent", "security" increase priority
- **Risk identification**: Automatically flags database changes, security features, performance work
- **Skill extraction**: Infers required skills from task descriptions
- **Effort estimation**: Provides hour estimates based on complexity
- **Dependency detection**: Identifies blockers (e.g., backend must precede frontend)

### 2. Agent Roster Management

The Agent Roster Manager extends basic agent tracking with:

#### Agent Profile
- **Skills**: Category, level (beginner→expert), years of experience
- **Specializations**: Frontend, Backend, Database, DevOps, Testing, etc.
- **Performance Metrics**:
  - Tasks completed
  - Tasks in progress
  - Average completion time
  - On-time delivery rate
  - Quality score (0-100)
  - Collaboration score (0-100)

#### Availability Tracking
- **Status**: available, busy, offline
- **Workload**: Current tasks vs max capacity
- **Hours per week**: Capacity planning
- **Timezone**: For distributed teams

#### Preferences
- **Preferred task types**: bug-fix, feature, refactor, etc.
- **Avoided task types**: Tasks to minimize
- **Preferred technologies**: React, Node.js, Python, etc.
- **Working hours**: Start/end time preferences

#### Assignment History
- Track all past assignments
- Duration and quality ratings
- Notes and feedback

### 3. Auto-Assignment System

The Agent Orchestrator intelligently assigns tasks to agents based on:

#### Scoring Algorithm (Weighted)
1. **Skill Match (40%)**: Required skills vs agent skills and levels
2. **Availability Match (30%)**: Current workload vs capacity
3. **Performance Match (20%)**: Quality score, on-time delivery rate
4. **Preference Match (10%)**: Task type preferences

#### Auto-Assignment
- Automatically assigns if confidence > 75%
- Batch assignment for multiple tasks
- Priority-based assignment (higher priority tasks first)
- Workload balancing and rebalancing

#### Recommendations
- Top 3-5 agent recommendations per task
- Detailed scoring breakdown
- Reasons for recommendations
- Alternative options if top choice unavailable

### 4. Dependency Visualization

The Dependency Graph Builder creates visual representations of task relationships:

#### Graph Features
- **Nodes**: Tasks (epics, tickets, subtasks)
- **Edges**: Dependencies (blocks, blocked-by, relates-to, parent-child)
- **Layout**: Force-directed layout grouped by status
- **Status coloring**:
  - Backlog: Gray
  - In Progress: Blue
  - Review: Yellow
  - Done: Green

#### Analysis
- **Critical Path**: Longest path through the graph
- **Bottlenecks**: Tasks on critical path not yet started
- **Blocked Tasks**: Tasks waiting on dependencies
- **Next Available**: Tasks ready to start (no blockers)

#### Export Formats
- **Mermaid**: For GitHub, GitLab, Notion
- **GraphViz DOT**: For Graphviz rendering

#### Practical Uses
- Identify what's blocking progress
- Find tasks that can be started immediately
- Optimize team workflow
- Estimate total project duration

### 5. Team Composition Analysis

Understand your team's capabilities:

- **Availability Overview**: Available, busy, offline agents
- **Skill Coverage**: Agents per skill category
- **Workload Distribution**: Capacity utilization per agent
- **Average Skill Levels**: Team strength in each area

## Usage

### Accessing the Orchestrator

Navigate to `/orchestrator` to access the Task Orchestrator dashboard.

### Task Breakdown Workflow

1. **Select Input Type**: Text, GitHub Issue, or PRD
2. **Paste Content**: Your issue description or PRD
3. **Click "Break Down Tasks"**: Engine processes the input
4. **Review Output**: Epics, tickets, subtasks with DoD, tests, risks
5. **Export or Import**: Use in your kanban board

### Agent Management Workflow

1. **View Team Overview**: See availability and skill distribution
2. **Select Agent**: Click to see detailed profile
3. **Review Metrics**: Performance, workload, skills
4. **Update Agent**: Modify skills, preferences, availability

### Dependency Graph Workflow

1. **Toggle Subtasks**: Include/exclude from visualization
2. **View Graph**: See task relationships and dependencies
3. **Analyze Critical Path**: Identify bottlenecks
4. **Find Ready Tasks**: Tasks that can start now
5. **Export Graph**: Download as Mermaid or DOT format

## Database Schema

### New Tables

#### `epics`
- High-level feature groupings
- Business value and acceptance criteria
- Links to tickets

#### `definition_of_done`
- Checklist items for task completion
- Verification methods
- Completion tracking

#### `test_notes`
- Test types: unit, integration, e2e, manual, performance
- Test cases and expected outcomes

#### `risk_flags`
- Risk levels: low, medium, high, critical
- Mitigation strategies and impact assessment

#### `task_dependencies`
- Dependency types: blocks, blocked-by, relates-to
- Task relationship tracking

#### `agent_extended_data`
- JSON storage for skills, metrics, preferences
- Assignment history

### Extended Columns on `tasks`
- `epic_id`: Link to parent epic
- `required_skills`: Array of skill requirements
- `estimated_hours`: Effort estimation
- `hierarchy`: ticket or subtask
- `parent_task_id`: For subtasks

## API/Library Usage

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

// result contains: epics, tickets, subtasks, summary
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

// Update performance after task completion
const updatedAgent = AgentOrchestrator.updatePerformance(
  agent,
  completedOnTime,
  qualityRating
);
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

// Get next available tasks
const nextTasks = DependencyGraphBuilder.getNextAvailableTasks(
  graph.nodes,
  graph.edges
);

// Export to Mermaid
const mermaid = DependencyGraphBuilder.exportToMermaid(graph);

// Export to DOT
const dot = DependencyGraphBuilder.exportToDot(graph);
```

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

## Future Enhancements

### Planned Features
- **AI Integration**: Use LLMs for smarter task breakdown
- **OCR Support**: Real screenshot analysis
- **GitHub Integration**: Sync with actual GitHub issues
- **Jira Integration**: Import/export to Jira
- **Performance Predictions**: ML-based completion time estimates
- **Team Chat Integration**: Slack/Discord notifications
- **Advanced Scheduling**: Gantt charts and timeline views
- **Resource Leveling**: Automatic workload balancing
- **Historical Analytics**: Trends and insights over time

## Troubleshooting

### Common Issues

**Tasks not breaking down correctly**
- Ensure input text has clear structure (bullet points, sections)
- Include keywords that indicate task types
- Try different input types (text vs PRD)

**Agent assignments seem wrong**
- Check agent skill levels match task requirements
- Verify agent availability and workload
- Update agent preferences if needed

**Dependency graph is confusing**
- Start with subtasks hidden
- Export to Mermaid and view in a dedicated tool
- Focus on critical path and blocked tasks first

## Contributing

To extend the orchestrator:

1. Add new input parsers in `TaskBreakdownEngine`
2. Enhance scoring algorithm in `AgentOrchestrator`
3. Add new graph layouts in `DependencyGraphBuilder`
4. Create new UI components for visualization

## License

MIT
