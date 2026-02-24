# Automated Task Breakdown and Agent Orchestration

This document describes the automated task breakdown and agent orchestration system implemented for Issue #8.

## Overview

The system provides comprehensive features for:
- **Automated Task Breakdown**: Break down issues/PRDs/screenshots into epics, tasks, and subtasks
- **Agent Roster Management**: Track agent skills, performance, and availability
- **Auto-Assignment**: Automatically assign tasks to agents based on skills and workload
- **Dependency Visualization**: Visualize task dependencies in a graph format

## Features

### 1. Automated Task Breakdown

The `TaskBreakdownService` analyzes input content and automatically generates:

- **Epics**: High-level project initiatives (for large projects)
- **Tasks**: Individual work items with:
  - Title and description
  - Priority (1-5)
  - Tags (auto-detected from content)
  - Estimated hours
  - Subtasks
  - Dependencies

- **Subtasks**: Detailed implementation steps with:
  - Title and description
  - Definition of Done (DoD) criteria
  - Test notes
  - Risk flags
  - Estimated hours

#### Input Types Supported

1. **GitHub Issues**: Paste issue content for breakdown
2. **PRDs**: Product requirement documents
3. **Screenshots**: Describe UI mockups for implementation planning

#### How It Works

The service uses rule-based analysis to:
- Detect features, requirements, and technical details
- Identify technologies mentioned
- Extract tasks from bullet points or paragraphs
- Generate appropriate subtasks based on task type (frontend, backend, database, etc.)
- Add logical dependencies (e.g., database → backend → frontend)
- Flag potential risks

### 2. Agent Roster Management

Enhanced agent management with:

#### Agent Skills
- **Skill Name**: Technology or capability
- **Skill Level**: 1-5 (Beginner to Expert)
- **Category**: frontend, backend, database, devops, mobile, testing, design, other

#### Performance Metrics
- **Tasks Completed**: Total number of completed tasks
- **Tasks In Progress**: Current active tasks
- **Average Completion Time**: Time taken to complete tasks (in hours)
- **Success Rate**: Percentage of successfully completed tasks (0-1)
- **Last Active Date**: When the agent last worked on a task
- **Specializations**: Tags/technologies the agent excels at

#### Availability Status
- `available`: Ready for new assignments
- `busy`: At capacity
- `offline`: Not available

### 3. Auto-Assignment Algorithm

The `AgentOrchestrationService` automatically assigns tasks based on:

#### Scoring Algorithm (0-1 scale)

1. **Skill Matching (40%)**:
   - Matches task tags to agent skills
   - Considers skill level (1-5)
   - Higher scores for better matches

2. **Performance Metrics (30%)**:
   - Success rate
   - Completion time (faster is better)
   - Experience (more completed tasks)

3. **Specialization Match (20%)**:
   - Matches task tags to agent specializations
   - Rewards proven expertise

4. **Workload Balance (10%)**:
   - Prioritizes agents with lower current workload
   - Respects max concurrent tasks limit

#### Assignment Process

1. Filter unassigned tasks
2. Sort by priority (high to low)
3. Calculate scores for all agents per task
4. Assign to highest-scoring available agent
5. Update workload tracking

### 4. Dependency Visualization

The `DependencyGraph` component displays:

- **Task Nodes**: Visual representation of tasks
  - Color-coded by status (backlog, in-progress, review, done)
  - Shows task ID and title
  - Displays priority and dependency count

- **Dependency Arrows**: Connections between tasks
  - **Red**: "blocks" dependencies
  - **Blue**: "requires" dependencies
  - **Gray**: "related" dependencies

- **Graph Layout**: Topological sort positioning
  - Tasks are arranged by dependency level
  - Dependencies flow from right to left

## Database Schema

### New Tables

#### `epics`
- Epic-level project tracking
- Links to multiple tasks
- Includes status, priority, tags, sprint, target date

#### `subtasks`
- Belongs to a parent task
- Contains DoD criteria, test notes
- Can be assigned to agents
- Tracks estimated vs actual hours

#### `risk_flags`
- Associated with subtasks
- Severity: low, medium, high, critical
- Categories: technical, dependency, resource, timeline, security
- Includes mitigation strategies

#### `task_dependencies`
- Links source and target tasks
- Types: blocks, requires, related
- Prevents circular dependencies

#### `agent_skills`
- Links agents to skills
- Skill level and category
- Used for auto-assignment scoring

### Enhanced Tables

#### `agents` (new columns)
- `availability`: Current status
- `max_concurrent_tasks`: Workload limit
- `tasks_completed`: Performance tracking
- `tasks_in_progress`: Current workload
- `avg_completion_time`: Efficiency metric
- `success_rate`: Quality metric
- `last_active_date`: Activity tracking
- `specializations`: Array of expertise areas

#### `tasks` (new column)
- `epic_id`: Links to parent epic

## Components

### `TaskBreakdownModal`
Interactive modal for:
- Inputting issue/PRD/screenshot content
- Analyzing and generating breakdown
- Previewing tasks and subtasks
- Creating all tasks with one click

Features:
- Input type selection (issue/PRD/screenshot)
- Content textarea with context field
- Real-time analysis with loading state
- Expandable task preview
- DoD, test notes, and risk flag display

### `AgentRoster`
Agent management dashboard:
- Grid view of all agents
- Performance metrics display
- Active task count
- Skill visualization
- Auto-assign button

### `AgentDetailsModal`
Detailed agent view:
- Full performance metrics
- Skills with proficiency levels
- Suggested skills (based on completed tasks)
- Specializations
- Active tasks list

### `DependencyGraph`
Visual dependency graph:
- SVG-based rendering
- Topological layout
- Color-coded dependency types
- Interactive task nodes
- Responsive sizing

## Services

### `TaskBreakdownService`
Core breakdown logic:
- Content analysis and categorization
- Feature/requirement extraction
- Technology detection
- Task generation
- Subtask creation with DoD/tests/risks
- Dependency inference

### `AgentOrchestrationService`
Agent assignment logic:
- Score calculation
- Auto-assignment algorithm
- Availability checking
- Performance metric updates
- Skill suggestion

## Hooks

### `useEpics`
- Fetch, create, update, delete epics
- Real-time sync with Supabase
- Loading state management

### `useDependencies`
- Fetch, create, delete dependencies
- Relationship management
- Validation

## Usage Example

```typescript
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { AgentRoster } from '@/components/AgentRoster';
import { DependencyGraph } from '@/components/DependencyGraph';
import { taskBreakdownService } from '@/lib/taskBreakdown';
import { agentOrchestrationService } from '@/lib/agentOrchestration';

// Break down a task
const breakdown = await taskBreakdownService.breakdownTask({
  type: 'issue',
  content: 'Implement user authentication with JWT tokens...',
});

// Auto-assign tasks
const assignments = agentOrchestrationService.autoAssignTasks(tasks, agents);

// Calculate agent scores
const scores = agentOrchestrationService.calculateAgentScores(task, agents, allTasks);

// Update performance after task completion
const updatedMetrics = agentOrchestrationService.updateAgentPerformance(
  agent,
  task,
  completionTimeHours,
  success
);
```

## Integration Steps

1. **Run Database Migrations**:
   ```sql
   -- Run database/schema_extensions.sql in Supabase SQL Editor
   ```

2. **Add UI Components**:
   - Import `TaskBreakdownModal` into your main board
   - Add trigger button (e.g., "Break Down Task")
   - Import `AgentRoster` for agent management view
   - Import `DependencyGraph` for visualization

3. **Handle Task Creation**:
   ```typescript
   const handleApplyBreakdown = async (result: TaskBreakdownResult) => {
     // Create epic if exists
     if (result.epic) {
       const epicId = await addEpic(result.epic);

       // Create tasks linked to epic
       for (const task of result.tasks) {
         const taskId = await addTask({ ...task, epicId });

         // Create subtasks
         for (const subtask of task.subtasks) {
           await addSubtask({ ...subtask, parentTaskId: taskId });
         }

         // Create dependencies
         if (task.dependencies) {
           for (const dep of task.dependencies) {
             await addDependency(dep);
           }
         }
       }
     }
   };
   ```

4. **Enable Auto-Assignment**:
   ```typescript
   const handleAutoAssign = () => {
     const assignments = agentOrchestrationService.autoAssignTasks(tasks, agents);

     // Apply assignments
     assignments.forEach((agentId, taskId) => {
       updateTask({ ...task, assignedAgentId: agentId });
     });
   };
   ```

## Future Enhancements

- **AI Integration**: Use LLM APIs for more intelligent task breakdown
- **Screenshot Analysis**: OCR and image analysis for UI mockups
- **Workflow Automation**: Auto-move tasks through pipeline
- **Performance Analytics**: Detailed agent performance dashboards
- **Skill Recommendations**: ML-based skill gap analysis
- **Dependency Validation**: Prevent circular dependencies in UI
- **Time Tracking**: Built-in time logging for subtasks
- **Risk Monitoring**: Alert system for high-risk subtasks

## Testing

Manual testing recommended for:
- Task breakdown with various input types
- Agent skill matching accuracy
- Auto-assignment fairness
- Dependency graph rendering
- Performance metric calculations
- Database constraint validation

## Troubleshooting

### Tasks not appearing after breakdown
- Check database permissions (RLS policies)
- Verify user authentication
- Check browser console for errors

### Auto-assignment not working
- Verify agents have skills defined
- Check agent availability status
- Ensure tasks have appropriate tags

### Dependency graph not rendering
- Verify dependencies are created in database
- Check for circular dependencies
- Ensure tasks exist before creating dependencies

### Performance metrics not updating
- Verify tasks are properly marked as completed
- Check agent performance calculation logic
- Ensure timestamps are being recorded

## Conclusion

This system provides a comprehensive solution for automated task breakdown and intelligent agent orchestration. It reduces manual work in task planning and ensures optimal resource allocation based on agent capabilities and workload.
