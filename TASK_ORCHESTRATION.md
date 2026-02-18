# Automated Task Breakdown and Agent Orchestration System

This document describes the automated task breakdown and agent orchestration features implemented in the Kanban Coding Agents system.

## Overview

The system provides AI-powered task breakdown capabilities that can automatically:
- Parse issues, PRDs, or screenshot descriptions
- Break them down into epics, tasks, and subtasks
- Generate Definition of Done (DoD) criteria
- Create test notes and testing strategies
- Assess risks and flag potential issues
- Visualize task dependencies
- Auto-assign tasks to agents based on skills and performance

## Features

### 1. AI-Powered Task Breakdown

**Location:** `src/lib/taskBreakdown.ts`

The task breakdown service analyzes input text and automatically generates:

- **Epics**: High-level feature groupings
- **Tasks**: Individual work items broken down by:
  - Database/Backend tasks
  - Frontend/UI tasks
  - Testing tasks
  - Documentation tasks
- **Definition of Done**: Checklist items for completion criteria
- **Test Notes**: Structured testing plans
- **Risk Assessment**: Automatic risk level detection and flags
- **Time Estimates**: Estimated hours for each task
- **Dependencies**: Task ordering and blocking relationships

#### Usage Example

```typescript
import { parseInput, breakdownTask } from '@/lib/taskBreakdown';

const input = parseInput(issueText, 'issue');
const result = breakdownTask(input, epicCounter, taskCounter);

// Result contains:
// - result.epic: The generated epic
// - result.tasks: Array of tasks with DoD, test notes, risk flags
// - result.dependencies: Task dependency relationships
```

#### Risk Detection

The system automatically detects high-risk scenarios:
- Database migrations
- Security-sensitive features
- Payment processing
- Breaking changes
- Production deployments
- Performance-critical features

### 2. Agent Skill Management

**Location:** `src/lib/agentAssignment.ts`

The skill management system provides:

- **Skill Matching**: Calculates how well agent skills match task requirements
- **Availability Scoring**: Considers current workload
- **Performance Scoring**: Uses historical quality and speed metrics
- **Auto-Assignment**: Automatically assigns tasks to best-fit agents
- **Skill Gap Detection**: Identifies missing skills in the roster

#### Skill Matching Algorithm

The recommendation algorithm uses a weighted scoring system:
- **Skills Match**: 50% weight - How well skills align with requirements
- **Availability**: 30% weight - Current workload (fewer active tasks = higher score)
- **Performance**: 20% weight - Historical quality (70%) and speed (30%)

#### Usage Example

```typescript
import { recommendAgent, autoAssignTasks } from '@/lib/agentAssignment';

// Get recommendations for a specific task
const recommendations = recommendAgent(task, agentsWithSkills, allTasks);

// recommendations[0] contains the best match with:
// - score: Overall fit (0-1)
// - reasons: Explanations for the score
// - skillMatch: Skill alignment score
// - availabilityScore: Workload score
// - performanceScore: Historical performance score

// Auto-assign multiple tasks
const assignments = autoAssignTasks(tasks, agents, allTasks, 0.6);
// Returns Map<taskId, agentId> for tasks with >60% confidence
```

### 3. Dependency Visualization

**Component:** `src/components/DependencyGraph.tsx`

A visual graph component that shows:
- Task nodes with status indicators
- Dependency arrows showing blocking relationships
- Priority highlighting
- Risk flags
- Interactive selection and details

Features:
- Canvas-based rendering for performance
- Automatic layout using topological sort
- Color-coded status indicators
- Click to select and view details
- Hover highlighting

### 4. Task Breakdown Wizard UI

**Component:** `src/components/TaskBreakdownWizard.tsx`

A step-by-step wizard interface for:
1. **Input**: Paste issue/PRD/screenshot description
2. **AI Generation**: Automatically breaks down into tasks
3. **Review & Edit**: Modify generated tasks, DoD, risks
4. **Confirmation**: Create all tasks with dependencies

Features:
- Support for GitHub issues, PRD documents, and screenshot descriptions
- Real-time editing of generated tasks
- Visual risk indicators
- Definition of Done checklist display
- Dependency relationship preview

### 5. Agent Roster Management

**Component:** `src/components/AgentRoster.tsx`

A comprehensive agent management interface showing:

- **Agent Cards** with:
  - Avatar and description
  - Active/Completed/Total task counts
  - Performance metrics (quality score, avg completion time)
  - Skill list with proficiency levels

- **Skill Management**:
  - Add new skills with proficiency levels (1-5)
  - Remove skills
  - Update skill levels

- **Performance Tracking**:
  - Average quality score (1-5 stars)
  - Average completion time
  - Total tasks completed

- **Skill Gap Detection**:
  - Identifies skills in high demand but low supply
  - Shows demand vs. supply metrics
  - Helps identify hiring/training needs

## Database Schema

### New Tables

#### `epics`
- `id`: UUID primary key
- `epic_id`: Display ID (e.g., "EPIC-1")
- `title`: Epic title
- `description`: Epic description
- `status`: Epic status (planning, in-progress, completed, cancelled)
- `priority`: Priority level (1-5)

#### `agent_skills`
- `id`: UUID primary key
- `agent_id`: Foreign key to agents
- `skill_name`: Skill name (e.g., "React", "Node.js")
- `skill_level`: Proficiency (1=beginner, 5=expert)

#### `agent_performance`
- `id`: UUID primary key
- `agent_id`: Foreign key to agents
- `task_id`: Foreign key to tasks
- `completion_time_hours`: Time taken to complete
- `quality_score`: Quality rating (1-5)
- `completed_at`: Completion timestamp

#### `task_dependencies`
- `id`: UUID primary key
- `task_id`: The dependent task
- `depends_on_task_id`: The blocking task
- `dependency_type`: Type (blocks, relates_to, duplicates)

### Enhanced `tasks` Table

New columns added:
- `epic_id`: Link to parent epic
- `parent_task_id`: For subtasks
- `definition_of_done`: Array of DoD items
- `test_notes`: Testing instructions
- `risk_level`: Risk assessment (low, medium, high, critical)
- `risk_flags`: Array of risk flags
- `estimated_hours`: Time estimate

## Integration Guide

### 1. Setting Up the Database

Run the updated schema SQL file in your Supabase SQL Editor:

```bash
# File: database/schema.sql
```

This will:
- Create new tables (epics, agent_skills, agent_performance, task_dependencies)
- Add new columns to existing tasks table
- Set up RLS policies
- Create default agent skills for new users

### 2. Using Task Breakdown

```typescript
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';

function MyComponent() {
  const [showWizard, setShowWizard] = useState(false);

  const handleBreakdownComplete = (result) => {
    // result contains epic, tasks, and dependencies
    // Save to database via Supabase
    await saveEpic(result.epic);
    await saveTasks(result.tasks);
    await saveDependencies(result.dependencies);
  };

  return (
    <>
      <button onClick={() => setShowWizard(true)}>
        AI Task Breakdown
      </button>

      {showWizard && (
        <TaskBreakdownWizard
          onBreakdownComplete={handleBreakdownComplete}
          onCancel={() => setShowWizard(false)}
          epicCounter={currentEpicCount}
          taskCounter={currentTaskCount}
        />
      )}
    </>
  );
}
```

### 3. Using Agent Recommendations

```typescript
import { recommendAgent } from '@/lib/agentAssignment';

// Get agent recommendations for a task
const recommendations = recommendAgent(task, agentsWithSkills, allTasks);

// Display top 3 recommendations
recommendations.slice(0, 3).forEach(rec => {
  console.log(`${rec.agentName}: ${(rec.score * 100).toFixed(0)}%`);
  console.log(`Reasons: ${rec.reasons.join(', ')}`);
});
```

### 4. Displaying Dependencies

```typescript
import { DependencyGraph } from '@/components/DependencyGraph';

function MyBoard() {
  return (
    <DependencyGraph
      tasks={tasks}
      dependencies={dependencies}
      onTaskClick={(taskId) => {
        // Handle task selection
      }}
    />
  );
}
```

### 5. Managing Agent Roster

```typescript
import { AgentRoster } from '@/components/AgentRoster';

function AgentManagement() {
  const handleAddSkill = async (agentId, skill) => {
    await supabase
      .from('agent_skills')
      .insert({
        agent_id: agentId,
        skill_name: skill.skillName,
        skill_level: skill.skillLevel,
        user_id: userId,
      });
  };

  return (
    <AgentRoster
      agents={agentsWithSkills}
      tasks={tasks}
      onAddSkill={handleAddSkill}
      onRemoveSkill={handleRemoveSkill}
      onUpdateSkill={handleUpdateSkill}
    />
  );
}
```

## TypeScript Types

All types are defined in:
- `src/types/epic.ts` - Epic types
- `src/types/task.ts` - Task and dependency types (enhanced)
- `src/types/agent.ts` - Agent, skill, and performance types (enhanced)

## Performance Considerations

1. **Dependency Graph**: Uses canvas rendering for efficient visualization of large graphs
2. **Auto-Assignment**: Runs in O(n*m) where n=tasks, m=agents - acceptable for typical roster sizes
3. **Skill Matching**: Cached skill maps for O(1) lookup during scoring
4. **Database Queries**: Indexed on foreign keys and frequently queried columns

## Future Enhancements

Potential improvements:
- Machine learning for better task time estimates
- Natural language processing for more accurate requirement extraction
- Real-time collaboration on task breakdown
- Historical data analysis for performance trends
- Integration with GitHub/Jira for automatic issue import
- Gantt chart view for timeline visualization
- Load balancing recommendations
- Team capacity planning tools

## Support

For issues or questions about the task orchestration system:
1. Check the GitHub repository issues
2. Review this documentation
3. Check the inline code comments in the implementation files
