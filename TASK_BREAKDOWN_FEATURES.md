# Task Breakdown and Agent Orchestration Features

This document describes the comprehensive task breakdown and agent orchestration system implemented for Issue #8.

## Overview

The system provides automated task breakdown, dependency visualization, and intelligent agent assignment capabilities to enhance project management and team coordination.

## Features

### 1. Automated Task Breakdown

**Location**: `src/components/TaskBreakdownWizard.tsx`

The Task Breakdown Wizard allows you to input requirements in various formats and automatically breaks them down into structured tasks:

#### Input Sources Supported:
- **Plain Text**: Free-form text with hierarchical structure
- **GitHub Issues**: Standard GitHub issue format
- **PRD (Product Requirements Document)**: Product requirement specifications
- **Screenshot**: Visual mockups with description

#### Breakdown Process:
1. Analyzes input content
2. Identifies hierarchical structure (Epics → Tickets → Subtasks)
3. Generates for each task:
   - **Definition of Done (DoD)**: Clear completion criteria
   - **Test Notes**: Testing requirements (unit, integration, e2e, manual, performance)
   - **Risk Flags**: Identified risks with mitigation strategies
   - **Estimated Hours**: Time estimates based on task level
4. Detects dependencies between tasks
5. Suggests agent assignments based on skills

#### Usage:
```
Click "Task Breakdown" button → Select input source → Enter content → Generate
```

#### Task Hierarchy:
- **Epic**: Large feature (~40 hours, 1 week)
- **Ticket**: Individual feature (~8 hours, 1 day)
- **Subtask**: Small implementation (~2 hours)

### 2. Agent Orchestration & Auto-Assignment

**Location**: `src/lib/agentOrchestration.ts`

Intelligent agent assignment based on multiple factors:

#### Scoring Algorithm (0-100):
- **Skill Matching (40%)**: Matches agent skills to task requirements
  - Extracts required skills from tags, title, and description
  - Maps keywords to skills (react, typescript, database, etc.)
  - Weights by proficiency level (1-5)

- **Performance Metrics (30%)**: Agent track record
  - Success rate
  - Tasks completed
  - Experience bonus

- **Availability (20%)**: Current availability percentage

- **Workload (10%)**: Current task load vs capacity

#### Features:
- **Auto-Assign**: Automatically assigns unassigned tasks to best-fit agents
- **Rebalance**: Redistributes workload across agents
- **Recommendations**: Shows top 3 agent recommendations per task
- **Performance Tracking**: Updates agent metrics on task completion

### 3. Agent Roster Management

**Location**: `src/components/AgentRosterManager.tsx`

Comprehensive agent management interface:

#### Agent Profile Includes:
- **Basic Info**: Name, description, avatar
- **Skills**: Multiple skills with proficiency levels (1-5)
  - Available skills: react, nextjs, typescript, nodejs, database, api, ui-ux, testing, devops, mobile, backend, frontend, fullstack
- **Performance Metrics**:
  - Success rate
  - Tasks completed
  - Tasks in progress
  - Average completion time
  - Total hours logged
- **Capacity Management**:
  - Availability percentage
  - Max concurrent tasks
  - Current workload visualization

#### Operations:
- Add new agents
- Edit existing agents
- Update skills and proficiency levels
- Adjust capacity and availability
- Delete agents
- View performance dashboard

### 4. Dependency Visualization

**Location**: `src/components/DependencyGraph.tsx`

Interactive dependency graph showing task relationships:

#### Features:
- **Visual Graph**: SVG-based dependency visualization
- **Topological Layout**: Automatic hierarchical positioning
- **Dependency Types**:
  - **Blocks**: Task blocks another from starting
  - **Requires**: Task requires another to complete first
  - **Relates-to**: General relationship
  - **Duplicates**: Duplicate tasks
- **Interactive**:
  - Click tasks to see details
  - Zoom in/out
  - Color-coded by status
  - Shows dependencies for selected task
- **Legend**: Clear visual indicators for dependency types

### 5. Enhanced Dashboard

**Location**: `src/components/EnhancedKanbanBoard.tsx`

Unified interface integrating all features:

#### Toolbar Features:
- **Task Breakdown**: Launch breakdown wizard
- **Dependencies**: View dependency graph
- **Manage Agents**: Open agent roster
- **Auto-Assign**: Trigger automatic assignment
- **Rebalance**: Redistribute workload

#### Quick Stats:
- Total tasks
- Unassigned tasks
- Tasks in progress
- Completed tasks
- Active agents

#### Workload Indicators:
- Overloaded agents warning
- Underutilized agents notice

## Database Schema

### New Tables:

#### `agent_skills`
Stores agent skill proficiency:
```sql
- agent_id: uuid (FK to agents)
- skill: text
- proficiency_level: integer (1-5)
```

#### `agent_performance`
Tracks agent performance metrics:
```sql
- agent_id: uuid (FK to agents, unique)
- tasks_completed: integer
- tasks_in_progress: integer
- average_completion_time: numeric
- success_rate: numeric (0-100)
- last_active: timestamp
- total_hours_logged: numeric
- availability: integer (0-100)
- max_concurrent_tasks: integer
```

#### `task_breakdown`
Stores task hierarchy and metadata:
```sql
- task_id: uuid (FK to tasks)
- epic_id: uuid (FK to tasks, nullable)
- ticket_id: uuid (FK to tasks, nullable)
- level: text (epic|ticket|subtask)
- estimated_hours: numeric
- actual_hours: numeric
```

#### `definition_of_done`
Completion criteria for tasks:
```sql
- breakdown_id: uuid (FK to task_breakdown)
- criteria: text
- completed: boolean
```

#### `test_notes`
Testing requirements:
```sql
- breakdown_id: uuid (FK to task_breakdown)
- description: text
- test_type: text (unit|integration|e2e|manual|performance)
- priority: integer (1-5)
```

#### `risk_flags`
Risk tracking:
```sql
- breakdown_id: uuid (FK to task_breakdown)
- description: text
- level: text (low|medium|high|critical)
- mitigation: text
- acknowledged: boolean
```

#### `task_dependencies`
Task relationships:
```sql
- from_task_id: uuid (FK to tasks)
- to_task_id: uuid (FK to tasks)
- dependency_type: text (blocks|relates-to|duplicates|requires)
```

## API/Service Layer

### TaskBreakdownService
**File**: `src/lib/taskBreakdown.ts`

Main service for parsing and breaking down requirements:
- `breakdownTask()`: Main entry point
- `parseInput()`: Parse different input formats
- `parseTextInput()`: Parse plain text
- `parseIssueInput()`: Parse GitHub issues
- `parsePRDInput()`: Parse PRD documents
- `analyzeDependencies()`: Detect task dependencies

### AgentOrchestrationService
**File**: `src/lib/agentOrchestration.ts`

Handles agent assignment and workload management:
- `assignTasksToAgents()`: Auto-assign tasks
- `findBestAgent()`: Find optimal agent for a task
- `scoreAgent()`: Calculate agent score for task
- `calculateSkillScore()`: Skill matching algorithm
- `calculatePerformanceScore()`: Performance evaluation
- `rebalanceWorkload()`: Redistribute tasks
- `getAgentRecommendations()`: Get top agent matches
- `updateAgentPerformance()`: Update metrics after task completion

## Types

### New TypeScript Types:

```typescript
// Task breakdown types
type TaskLevel = 'epic' | 'ticket' | 'subtask';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'blocks' | 'relates-to' | 'duplicates' | 'requires';
}

// Agent types
type AgentSkill = 'react' | 'nextjs' | 'typescript' | 'nodejs' | ...;

interface AgentPerformanceMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number;
  successRate: number;
  lastActive: number;
  totalHoursLogged: number;
}

interface CodingAgent {
  // ... existing fields ...
  skills: AgentSkill[];
  skillLevels: Record<AgentSkill, number>;
  performance: AgentPerformanceMetrics;
  availability: number;
  maxConcurrentTasks: number;
}
```

## Usage Examples

### Example 1: Breaking Down a Feature

1. Click "Task Breakdown"
2. Select "Plain Text"
3. Enter:
```
# Epic: User Authentication
- Implement login page
- Add password reset
  * Create reset form
  * Send reset email
  * Update password endpoint
- Create registration flow
```
4. Click "Generate Breakdown"
5. System creates:
   - 1 Epic (User Authentication)
   - 3 Tickets (login, password reset, registration)
   - 3 Subtasks (under password reset)
   - DoD, test notes, and risk flags for each

### Example 2: Auto-Assigning Tasks

1. Click "Auto-Assign" button
2. System analyzes:
   - Task requirements (tags, description)
   - Agent skills and proficiency
   - Agent availability and workload
3. Assigns tasks to optimal agents
4. Shows confirmation with assignment count

### Example 3: Managing Agent Skills

1. Click "Manage Agents"
2. Click "Edit" on an agent
3. Toggle skills (react, typescript, etc.)
4. Adjust proficiency levels (1-5)
5. Set max concurrent tasks
6. Save changes

### Example 4: Viewing Dependencies

1. Create tasks with dependencies
2. Click "Dependencies" button
3. View interactive graph:
   - Tasks as nodes
   - Dependencies as arrows
   - Color-coded by status
4. Click task to see details
5. Zoom and navigate

## Future Enhancements

### Potential Improvements:
1. **AI Integration**: Use OpenAI/Anthropic for smarter parsing
2. **Screenshot OCR**: Automatic UI extraction from images
3. **GitHub Integration**: Direct issue import
4. **Slack Integration**: Notifications and updates
5. **Analytics Dashboard**: Team performance metrics
6. **Custom Workflows**: Configurable task templates
7. **Time Tracking**: Actual vs estimated hours
8. **Burndown Charts**: Sprint progress visualization
9. **Agent Learning**: Improve assignments based on outcomes
10. **Custom Skills**: User-defined skill categories

## Technical Notes

### Performance Considerations:
- Task breakdown uses rule-based parsing (fast)
- Dependency detection is O(n²) - consider optimization for 100+ tasks
- Graph rendering uses SVG - may need canvas for 200+ nodes
- Agent scoring is O(n*m) where n=agents, m=skills

### Security:
- All data scoped to user via RLS policies
- No external API calls in current implementation
- Input sanitization in place

### Scalability:
- Current design handles ~500 tasks efficiently
- For larger scale, consider:
  - Virtual scrolling for task lists
  - Canvas rendering for dependency graph
  - Backend processing for breakdown
  - Caching for agent recommendations

## Support

For issues or questions about these features, please refer to:
- GitHub Issues: [Repository Issues](https://github.com/BrianTruong23/kanban-coding-agents/issues)
- Documentation: This file
- Code Comments: Inline documentation in source files
