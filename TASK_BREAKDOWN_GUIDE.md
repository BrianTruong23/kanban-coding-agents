# Automated Task Breakdown and Agent Orchestration Guide

This guide explains how to use the automated task breakdown and agent orchestration features in the Kanban Coding Agents application.

## Overview

The system can automatically break down issues, PRDs, or screenshots into structured tasks with:
- **Epics**: High-level work items that group related tasks
- **Tasks**: Individual work items with detailed metadata
- **Subtasks**: Granular steps within a task
- **Dependencies**: Relationships between tasks
- **Definition of Done (DoD)**: Clear acceptance criteria for each task
- **Test Notes**: Testing requirements and strategies
- **Risk Flags**: Identified risks and mitigation strategies
- **Agent Orchestration**: Automatic assignment based on skills and workload

## Features

### 1. Task Breakdown Service

The task breakdown service analyzes input and automatically creates a structured breakdown:

```typescript
import { taskBreakdownService } from '@/services/taskBreakdownService';

const breakdown = await taskBreakdownService.breakdownInput({
  type: 'issue', // or 'prd' or 'screenshot'
  content: 'Your issue/PRD text here...',
  context: 'Optional additional context',
}, userId);
```

**Supported Input Types:**
- **GitHub Issue**: Paste issue content for automatic parsing
- **PRD**: Product Requirements Document for epic/task creation
- **Screenshot**: Upload UI mockups for implementation tasks

**What Gets Generated:**
- Tasks with appropriate priority levels
- Subtasks based on content analysis
- Dependencies between related tasks
- Definition of Done criteria
- Test notes (unit, integration, e2e, manual)
- Risk flags with severity levels and mitigation

### 2. Agent Orchestration

The agent orchestration service provides intelligent task assignment:

```typescript
import { agentOrchestrationService } from '@/services/agentOrchestrationService';

// Auto-assign a single task
const bestAgent = await agentOrchestrationService.autoAssignTask(task, agents);

// Auto-assign multiple tasks (optimizes across team)
const assignments = await agentOrchestrationService.autoAssignTasks(tasks, agents);

// Get recommendations with explanations
const recommendations = await agentOrchestrationService.recommendAgents(task, agents, 3);
```

**Assignment Factors:**
- **Skills Match**: Agent skills vs task tags
- **Availability**: Current workload vs max capacity
- **Performance**: Success rate and completion time
- **Priority**: High-priority tasks go to top performers
- **Workload Balance**: Distributes work evenly across team

### 3. Agent Performance Tracking

Agents have performance metrics that influence assignment:

```typescript
interface AgentPerformanceMetrics {
  tasksCompleted: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-100
  currentWorkload: number; // number of active tasks
  skillRatings: Map<AgentSkill, number>; // skill -> rating (0-5)
}
```

**Available Skills:**
- `frontend` - React, UI components, client-side
- `backend` - Server logic, APIs, databases
- `fullstack` - Both frontend and backend
- `devops` - CI/CD, infrastructure, deployment
- `mobile` - iOS, Android, mobile frameworks
- `database` - SQL, schema design, optimization
- `testing` - QA, test automation, quality
- `ui-ux` - Design, user experience, accessibility
- `api` - REST, GraphQL, API design
- `security` - Auth, encryption, security practices

### 4. Dependency Management

Tasks can have three types of dependencies:

```typescript
type DependencyType = 'blocks' | 'blocked-by' | 'relates-to';
```

- **blocks**: This task blocks another task
- **blocked-by**: This task is blocked by another task
- **relates-to**: This task is related to another task

Dependencies are visualized in the Dependency Graph component.

### 5. Risk Assessment

Risks are automatically identified and flagged:

```typescript
interface RiskFlag {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}
```

**Common Risk Patterns:**
- **Complexity**: High complexity indicators in content
- **External Dependencies**: Third-party integrations
- **Security**: Auth, payments, sensitive data
- **Database Changes**: Schema migrations, data integrity

## Using the UI Components

### Task Breakdown Wizard

```tsx
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';

<TaskBreakdownWizard
  userId={user.id}
  onComplete={(breakdown) => {
    // Handle the breakdown result
    // Create tasks, subtasks, dependencies, etc.
  }}
  onCancel={() => setShowWizard(false)}
/>
```

**Workflow:**
1. Select input type (Issue, PRD, or Screenshot)
2. Provide content/upload file
3. System processes and analyzes
4. Review generated breakdown
5. Confirm to create tasks

### Agent Roster

```tsx
import { AgentRoster } from '@/components/AgentRoster';

<AgentRoster
  agents={agents}
  tasks={tasks}
  onAgentUpdate={(agent) => updateAgent(agent)}
  onAutoAssign={(assignments) => {
    // assignments is Map<taskId, agentId>
    // Apply assignments to tasks
  }}
/>
```

**Features:**
- View all agents with skills and performance
- Analyze workload balance
- Auto-assign tasks with one click
- See utilization percentages

### Dependency Graph

```tsx
import { DependencyGraph } from '@/components/DependencyGraph';

<DependencyGraph
  tasks={tasks}
  dependencies={dependencies}
  onTaskClick={(taskId) => {
    // Navigate to or highlight task
  }}
/>
```

**Visualization:**
- Color-coded dependency types
- Grouped by task
- Click to navigate
- Shows blocking relationships

### Task Details

```tsx
import { TaskDetails } from '@/components/TaskDetails';

<TaskDetails
  task={selectedTask}
  subtasks={subtasks}
  definitionOfDone={dod}
  testNotes={testNotes}
  riskFlags={riskFlags}
  onClose={() => setSelectedTask(null)}
  onSubtaskToggle={(id, completed) => updateSubtask(id, { completed })}
/>
```

**Shows:**
- Subtasks with progress tracking
- Definition of Done checklist
- Test notes by type
- Risk flags with mitigation
- Task metadata

## Database Schema

### New Tables

1. **epics** - High-level work groupings
2. **task_epics** - Many-to-many relationship
3. **subtasks** - Granular task breakdown
4. **task_dependencies** - Task relationships
5. **task_metadata** - DoD, tests, risks

### Updated Tables

1. **agents** - Added skills, performance, capacity
2. **tasks** - Added sprint field (already existed)

### Triggers

- **update_epic_progress**: Auto-updates epic progress when tasks complete
- **update_agent_workload**: Auto-updates agent workload on task assignment

## Setup Instructions

### 1. Run Database Migrations

Execute both schema files in your Supabase SQL Editor:

```sql
-- First run the base schema (if not already done)
-- Then run the updates:
```

Run `/database/schema_updates.sql` in your Supabase SQL Editor.

### 2. Update Agent Skills

If you have existing agents, they'll be automatically updated with default skills based on their names. You can customize these in the agent roster UI or directly in the database.

### 3. Start Using the Features

1. **Create a Breakdown**: Click "Breakdown Task" and paste an issue or PRD
2. **Review Generated Tasks**: Check tasks, subtasks, DoD, and risks
3. **Auto-Assign**: Use the Agent Roster to auto-assign tasks
4. **Track Dependencies**: View the Dependency Graph
5. **Monitor Progress**: Check agent performance and workload balance

## Best Practices

### For Task Breakdown

1. **Provide Context**: More detailed input = better breakdown
2. **Use Checklists**: Include checklists in issues for better subtask generation
3. **Mention Technologies**: Reference specific tech for accurate tagging
4. **Specify Priority**: Use keywords like "urgent", "critical", "low priority"

### For Agent Management

1. **Keep Skills Updated**: Regularly update agent skills as they grow
2. **Monitor Workload**: Use workload analysis to prevent burnout
3. **Balance Assignments**: Let auto-assignment distribute work evenly
4. **Track Performance**: Review success rates and completion times

### For Dependencies

1. **Link Early**: Define dependencies during task creation
2. **Use Correct Types**: Choose the right dependency type
3. **Avoid Cycles**: Don't create circular dependencies
4. **Review Regularly**: Check the dependency graph for bottlenecks

## API Examples

### Creating a Complete Breakdown

```typescript
// 1. Break down input
const breakdown = await taskBreakdownService.breakdownInput({
  type: 'issue',
  content: issueText,
}, userId);

// 2. Create tasks in database
for (const task of breakdown.tasks) {
  await addTask(task);

  // 3. Add metadata
  const dod = breakdown.definitionsOfDone.get(task.id);
  const tests = breakdown.testNotes.get(task.id);
  const risks = breakdown.riskFlags.get(task.id);

  if (dod || tests || risks) {
    await updateMetadata(task.id, {
      definitionOfDone: dod,
      testNotes: tests,
      riskFlags: risks,
    });
  }
}

// 4. Create subtasks
for (const subtask of breakdown.subtasks) {
  await addSubtask(subtask);
}

// 5. Create dependencies
for (const dep of breakdown.dependencies) {
  await addDependency(dep);
}

// 6. Auto-assign tasks
const assignments = await agentOrchestrationService.autoAssignTasks(
  breakdown.tasks,
  agents
);

// 7. Apply assignments
for (const [taskId, agentId] of assignments) {
  const task = breakdown.tasks.find(t => t.id === taskId);
  if (task) {
    await updateTask({ ...task, assignedAgentId: agentId });
  }
}
```

### Workload Analysis

```typescript
const analysis = await agentOrchestrationService.balanceWorkload(tasks, agents);

console.log('Balanced:', analysis.balanced);
console.log('Recommendations:', analysis.recommendations);

for (const [agentId, utilization] of analysis.agentUtilization) {
  const agent = agents.find(a => a.id === agentId);
  console.log(`${agent?.name}: ${utilization.toFixed(0)}% utilized`);
}
```

## Troubleshooting

### Tasks Not Auto-Assigning

- Check that agents have skills defined
- Verify agents are marked as `isActive: true`
- Ensure agents have capacity (`currentWorkload < maxConcurrentTasks`)
- Check that task tags match agent skills

### Dependencies Not Showing

- Verify dependencies are created in the database
- Check that both source and target tasks exist
- Ensure RLS policies allow reading dependencies

### Performance Metrics Not Updating

- Check that the trigger `task_assignment_update_workload` is active
- Verify task status changes are being saved
- Ensure performance_metrics JSONB field exists on agents table

## Future Enhancements

Potential improvements for the system:

1. **AI Integration**: Connect to OpenAI/Claude for better breakdown
2. **Sprint Planning**: Automatic sprint creation and capacity planning
3. **Burndown Charts**: Visualize sprint progress
4. **Agent Learning**: ML-based skill rating improvements
5. **Gantt View**: Timeline visualization of dependencies
6. **Custom DoD Templates**: Reusable DoD templates per project
7. **Risk Heatmaps**: Visual risk assessment across projects
8. **Performance Trends**: Historical performance analytics

## Support

For issues or questions, please open an issue on GitHub or refer to the main README.
