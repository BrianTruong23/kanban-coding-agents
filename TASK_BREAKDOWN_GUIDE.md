# Automated Task Breakdown and Agent Orchestration System

## Overview

This system provides comprehensive automated task breakdown and intelligent agent orchestration capabilities for the Kanban Coding Agents application. It can analyze issues, PRDs, or screenshots to automatically generate structured epics, tickets, and subtasks with Definition of Done (DoD), test notes, risk flags, and dependency tracking.

## Features

### 1. Automated Task Breakdown

The task breakdown system can process various input types and generate a complete task hierarchy:

- **Input Types Supported:**
  - GitHub Issues
  - Product Requirements Documents (PRDs)
  - Screenshots (with descriptions)
  - Free-form text

- **Generated Artifacts:**
  - **Epics**: High-level features or themes with goals and DoD
  - **Tickets**: Individual work items with acceptance criteria and test notes
  - **Subtasks**: Granular implementation steps
  - **Dependencies**: Relationships between tasks (blocks, blocked_by, relates_to)
  - **Risk Flags**: Identified risks with severity levels and mitigation strategies
  - **Test Notes**: Testing requirements categorized by type (unit, integration, e2e, manual)

### 2. Agent Roster Management

Comprehensive agent management with skills tracking and performance metrics:

- **Agent Skills:**
  - Skill categories (frontend, backend, database, devops, testing, design, etc.)
  - Proficiency levels (1-5)
  - Years of experience tracking
  - Last usage timestamps

- **Performance Metrics:**
  - Tasks completed/in-progress/failed
  - Success rate
  - Quality score
  - On-time delivery rate
  - Average completion time
  - Total hours worked

- **Availability Management:**
  - Status tracking (available, busy, offline, on-leave)
  - Current capacity percentage
  - Maximum concurrent tasks
  - Current task count

### 3. Intelligent Agent Auto-Assignment

Smart assignment algorithm that considers multiple factors:

- **Skill Matching (40 points):**
  - Required skills matching
  - Preferred skills matching
  - Proficiency level evaluation
  - Bonus for high average proficiency

- **Availability Assessment (20 points):**
  - Current status (available/busy)
  - Capacity percentage
  - Concurrent task limits
  - Deadline urgency consideration

- **Performance Evaluation (25 points):**
  - Success rate history
  - Quality score
  - On-time delivery track record
  - Recent activity

- **Preference Matching (15 points):**
  - Task type preferences
  - Complexity fit
  - Estimated effort alignment

The algorithm returns:
- Best agent match with confidence score (0-1)
- Detailed reasons for selection
- Alternative agent suggestions

### 4. Dependency Visualization

Interactive graph visualization showing:
- Task hierarchy (Epic → Ticket → Subtask)
- Dependency relationships with color coding:
  - Red arrows: Blocking dependencies
  - Orange arrows: Blocked by
  - Gray dashed: Related tasks
  - Yellow arrows: Duplicates
- Node colors by type:
  - Purple: Epics
  - Blue: Tickets
  - Green: Subtasks
- Force-directed layout for optimal positioning
- Interactive node selection and highlighting
- Fullscreen mode for detailed exploration

## Architecture

### Type Definitions

#### Task Breakdown Types (`src/types/taskBreakdown.ts`)
- `Epic`, `Ticket`, `Subtask` - Task hierarchy
- `DefinitionOfDone` - DoD items with completion tracking
- `TestNote` - Test requirements with type and status
- `RiskFlag` - Risk identification with severity and mitigation
- `TaskDependency` - Dependency relationships
- `TaskBreakdownResult` - Complete breakdown output
- `BreakdownConfig` - Configuration options

#### Agent Types (`src/types/agent.ts`)
- `CodingAgent` - Enhanced agent definition
- `AgentSkill` - Skill with category, proficiency, experience
- `AgentPerformanceMetrics` - Comprehensive performance tracking
- `AgentAvailability` - Availability status and capacity
- `AgentPreferences` - Work preferences
- `AgentAssignmentResult` - Assignment output with confidence
- `AssignmentCriteria` - Assignment input parameters

### Services

#### TaskBreakdownService (`src/services/taskBreakdownService.ts`)

Main service for automated task breakdown:

```typescript
const service = new TaskBreakdownService({
  maxEpics: 5,
  maxTicketsPerEpic: 10,
  maxSubtasksPerTicket: 8,
  includeTestNotes: true,
  includeRiskFlags: true,
  includeDependencies: true,
  estimationUnit: 'story_points',
  defaultPriority: 3,
});

const result = await service.breakdownTasks({
  type: 'issue',
  content: 'Your GitHub issue or PRD content...',
});
```

**Key Methods:**
- `breakdownTasks(input)` - Main breakdown function
- `parseInput(input)` - Intelligent content parsing
- `createEpic(theme, index)` - Epic generation
- `createTicketsForEpic(epic, theme, analysis)` - Ticket generation
- `createSubtasksForTicket(ticket)` - Subtask generation
- `detectDependencies(tickets, subtasks)` - Dependency detection
- `generateDoD(level)` - DoD generation
- `generateTestNotes()` - Test note generation
- `generateRiskFlags(content)` - Risk identification

#### AgentOrchestrationService (`src/services/agentOrchestrationService.ts`)

Service for agent assignment and roster management:

```typescript
// Auto-assign single agent
const assignment = AgentOrchestrationService.assignBestAgent(agents, {
  requiredSkills: [{ category: 'frontend', proficiency: 3 }],
  taskType: 'feature',
  taskComplexity: 4,
  priority: 5,
  deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
});

// Bulk assign agents to multiple tickets
const assignments = AgentOrchestrationService.bulkAssignAgents(agents, tickets);

// Update performance after task completion
const updatedAgent = AgentOrchestrationService.updateAgentPerformance(
  agent,
  true, // completed
  8, // actual effort hours
  5, // estimated effort
  true, // on time
  0.9 // quality rating
);

// Get workload summary
const workload = AgentOrchestrationService.getAgentWorkloadSummary(agents);
```

**Key Methods:**
- `assignBestAgent(agents, criteria)` - Find best agent match
- `bulkAssignAgents(agents, tickets)` - Assign multiple tickets
- `calculateAgentScore(agent, criteria)` - Comprehensive scoring
- `updateAgentPerformance(agent, ...)` - Performance metrics update
- `getAgentWorkloadSummary(agents)` - Workload analysis

### Components

#### TaskBreakdownUI (`src/components/TaskBreakdownUI.tsx`)

Main UI for task breakdown:
- Input type selection (Issue/PRD/Screenshot/Text)
- Text input area with screenshot URL support
- Real-time breakdown processing
- Summary statistics display
- Expandable task hierarchy viewer
- Integration with dependency graph
- DoD, test notes, and risk flag display

#### DependencyGraph (`src/components/DependencyGraph.tsx`)

Interactive dependency visualization:
- SVG-based graph rendering
- Force-directed layout algorithm
- Node selection and highlighting
- Fullscreen mode
- Legend for task types and dependency types
- Responsive design

#### AgentRosterManager (`src/components/AgentRosterManager.tsx`)

Agent management interface:
- Grid and table view modes
- Agent statistics overview
- Skill display with proficiency
- Performance metrics visualization
- Workload tracking
- Add/Edit/Remove agent functionality

## Usage

### 1. Accessing Task Breakdown

From the main Kanban board:
1. Click the "Task Breakdown" button in the header
2. Select input type (Issue/PRD/Screenshot/Text)
3. Paste your content
4. Click "Generate Task Breakdown"
5. Review generated epics, tickets, and subtasks
6. Toggle "Show Dependency Graph" for visualization
7. Click "Save to Kanban" to add tasks to your board

### 2. Managing Agents

From the main Kanban board:
1. Click the "Agents" button in the header
2. View agent roster in grid or table mode
3. See statistics: total agents, available, busy, avg success rate
4. Click "Add Agent" to create new agent
5. Edit agent skills, performance, and availability
6. Remove agents as needed

### 3. Auto-Assigning Agents

The system can automatically assign agents based on:
- Task requirements (skills needed)
- Agent availability and capacity
- Performance history
- Task preferences

Assignments include:
- Confidence score (0-100%)
- Detailed reasons for selection
- Alternative agent suggestions

## Configuration

### Breakdown Configuration

```typescript
interface BreakdownConfig {
  maxEpics?: number; // Default: 5
  maxTicketsPerEpic?: number; // Default: 10
  maxSubtasksPerTicket?: number; // Default: 8
  includeTestNotes?: boolean; // Default: true
  includeRiskFlags?: boolean; // Default: true
  includeDependencies?: boolean; // Default: true
  estimationUnit?: 'hours' | 'story_points'; // Default: 'story_points'
  defaultPriority?: 1 | 2 | 3 | 4 | 5; // Default: 3
}
```

### Assignment Criteria

```typescript
interface AssignmentCriteria {
  requiredSkills?: AgentSkill[];
  preferredSkills?: AgentSkill[];
  taskComplexity?: 1 | 2 | 3 | 4 | 5;
  taskType?: string;
  estimatedEffort?: number;
  priority?: 1 | 2 | 3 | 4 | 5;
  deadline?: number;
  excludeAgents?: string[];
}
```

## Best Practices

### Task Breakdown

1. **Provide Detailed Input**: More detailed issues/PRDs lead to better breakdowns
2. **Review Generated Tasks**: Always review and adjust generated tasks
3. **Check Dependencies**: Verify detected dependencies are correct
4. **Assess Risk Flags**: Review identified risks and add mitigations
5. **Update DoD**: Customize Definition of Done items for your context

### Agent Management

1. **Keep Skills Updated**: Regularly update agent skills and proficiencies
2. **Track Performance**: Use performance metrics to improve assignments
3. **Manage Capacity**: Set realistic capacity and concurrent task limits
4. **Set Preferences**: Configure agent preferences for better matching
5. **Monitor Workload**: Balance workload across agents

### Auto-Assignment

1. **Define Clear Requirements**: Specify required vs preferred skills
2. **Set Appropriate Complexity**: Match task complexity to agent capabilities
3. **Consider Deadlines**: Use deadline parameter for urgent tasks
4. **Review Suggestions**: Check alternative agent suggestions
5. **Update After Completion**: Track actual effort and quality for learning

## Future Enhancements

Potential improvements to consider:

1. **LLM Integration**: Connect to actual LLM API for smarter breakdowns
2. **Screenshot Analysis**: Implement computer vision for screenshot parsing
3. **Learning Algorithm**: ML-based agent assignment optimization
4. **Collaboration Features**: Multi-agent task collaboration
5. **Advanced Dependency Detection**: More sophisticated dependency analysis
6. **Performance Predictions**: Predict task completion times
7. **Skill Gap Analysis**: Identify missing skills in roster
8. **Automated Testing**: Generate test cases from requirements
9. **Cost Estimation**: Track and predict project costs
10. **Real-time Updates**: WebSocket-based live collaboration

## API Reference

### TaskBreakdownService

```typescript
class TaskBreakdownService {
  constructor(config?: BreakdownConfig);
  breakdownTasks(input: InputSource): Promise<TaskBreakdownResult>;
}
```

### AgentOrchestrationService

```typescript
class AgentOrchestrationService {
  static assignBestAgent(
    agents: CodingAgent[],
    criteria: AssignmentCriteria
  ): AgentAssignmentResult | null;

  static bulkAssignAgents(
    agents: CodingAgent[],
    tickets: Ticket[]
  ): Map<string, AgentAssignmentResult>;

  static updateAgentPerformance(
    agent: CodingAgent,
    taskCompleted: boolean,
    actualEffort?: number,
    estimatedEffort?: number,
    onTime?: boolean,
    qualityRating?: number
  ): CodingAgent;

  static getAgentWorkloadSummary(agents: CodingAgent[]): WorkloadSummary[];
}
```

## Troubleshooting

### Common Issues

1. **No agents assigned**: Check agent availability and skill matching
2. **Poor breakdown quality**: Provide more detailed input descriptions
3. **Missing dependencies**: Enable `includeDependencies` in config
4. **Performance issues**: Reduce `maxEpics`, `maxTicketsPerEpic`, or `maxSubtasksPerTicket`

## Support

For issues or feature requests, please create an issue in the GitHub repository.
