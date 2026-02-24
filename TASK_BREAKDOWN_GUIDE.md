# Automated Task Breakdown and Agent Orchestration System

## Overview

This system provides AI-powered task breakdown capabilities that automatically analyze issues, PRDs, and screenshots to create structured work hierarchies with epics, tasks, and subtasks. It includes intelligent agent orchestration based on skills and performance tracking.

## Features

### 1. AI Task Breakdown

The system can analyze various input types and automatically break them down into structured tasks:

- **Input Sources**:
  - Plain text descriptions
  - GitHub issues
  - Product Requirement Documents (PRDs)
  - Screenshots (with descriptions)

- **Generated Structure**:
  - **Epics**: High-level features or initiatives
  - **Tasks**: Individual work items within epics
  - **Subtasks**: Granular steps to complete tasks

- **Automatic Analysis**:
  - Estimates effort in hours
  - Identifies priority levels
  - Extracts relevant tags (frontend, backend, security, etc.)
  - Detects complexity levels
  - Identifies potential risks
  - Generates Definition of Done criteria
  - Creates test notes and recommendations

### 2. Task Dependencies

Visualize and manage task relationships:

- **Dependency Types**:
  - **Blocks**: Task must be completed before another can start
  - **Prerequisite**: Recommended to complete before starting another
  - **Related**: Tasks are related but not blocking

- **Visualization**:
  - Interactive dependency graph
  - Topological layout showing task flow
  - Color-coded dependency types
  - Detailed dependency list view

### 3. Agent Roster Management

Manage your team of agents with skills and performance tracking:

- **Agent Profiles**:
  - Name and description
  - Avatar and color
  - Availability status (available, busy, offline)
  - Current workload

- **Skills Management**:
  - Add/remove skills for each agent
  - 5-level proficiency system:
    - 1: Novice
    - 2: Beginner
    - 3: Intermediate
    - 4: Advanced
    - 5: Expert

- **Performance Tracking**:
  - Tasks completed
  - On-time delivery rate
  - Quality score (0-100)
  - Average completion time

### 4. Auto-Assignment

Intelligent task assignment based on multiple factors:

- **Skill Matching**:
  - Analyzes task tags and description
  - Matches against agent skills
  - Considers proficiency levels

- **Availability Scoring**:
  - Prioritizes available agents
  - Considers current workload
  - Avoids overloading agents

- **Performance Scoring**:
  - Factors in historical performance
  - Considers quality scores
  - Weights on-time delivery

- **Confidence Scoring**:
  - Combines all factors with weights:
    - Skill match: 50%
    - Performance: 30%
    - Availability: 20%

### 5. Risk Flagging

Automatically identifies potential risks:

- **Risk Levels**:
  - **Critical**: Security-sensitive, breaking changes
  - **High**: Database migrations, major refactors
  - **Medium**: External dependencies, performance concerns
  - **Low**: Minor issues or warnings

- **Risk Mitigation**:
  - Suggests mitigation strategies
  - Tracks resolution status
  - Provides warnings in UI

## Database Schema

### New Tables

#### `agent_skills`
Stores skills for each agent with proficiency levels.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- agent_id: UUID (foreign key to agents)
- skill_name: TEXT
- proficiency_level: INTEGER (1-5)
- created_at: TIMESTAMP
```

#### `agent_performance`
Tracks performance metrics for each agent.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- agent_id: UUID (foreign key to agents, unique)
- tasks_completed: INTEGER
- tasks_on_time: INTEGER
- tasks_late: INTEGER
- average_completion_time: NUMERIC (hours)
- quality_score: NUMERIC (0-100)
- last_updated: TIMESTAMP
```

#### `task_dependencies`
Defines relationships between tasks.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- dependent_task_id: UUID (foreign key to tasks)
- depends_on_task_id: UUID (foreign key to tasks)
- dependency_type: TEXT (blocks, prerequisite, related)
- created_at: TIMESTAMP
```

#### `definition_of_done`
Stores acceptance criteria for tasks.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- task_id: UUID (foreign key to tasks)
- description: TEXT
- completed: BOOLEAN
- order_index: INTEGER
- created_at: TIMESTAMP
```

#### `test_notes`
Stores testing requirements and notes.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- task_id: UUID (foreign key to tasks)
- description: TEXT
- test_type: TEXT (unit, integration, e2e, manual)
- completed: BOOLEAN
- created_at: TIMESTAMP
```

#### `risk_flags`
Tracks identified risks and their status.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- task_id: UUID (foreign key to tasks)
- risk_level: TEXT (low, medium, high, critical)
- description: TEXT
- mitigation: TEXT
- resolved: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Extended Task Fields

The `tasks` table now includes:
- `task_type`: 'epic' | 'task' | 'subtask'
- `parent_task_id`: Reference to parent task
- `epic_id`: Quick reference to epic
- `estimated_hours`: Estimated effort
- `actual_hours`: Actual time spent

## Usage Guide

### Using the AI Task Breakdown

1. Click the "AI Task Breakdown" button in the toolbar
2. Select input type (Text, GitHub Issue, PRD, or Screenshot)
3. Paste or describe the work to be done
4. Click "Analyze & Break Down"
5. Review the generated structure:
   - Check epic and tasks
   - Review subtasks
   - Verify dependencies
   - Review risk flags
6. Click "Create Tasks" to add them to your board

### Managing Agent Skills

1. Switch to the "Agents" view
2. Select an agent from the list
3. Click "Add Skill"
4. Enter skill name and proficiency level
5. Skills are used for auto-assignment matching

### Viewing Dependencies

1. Switch to the "Dependencies" view
2. See visual graph of task relationships
3. Click tasks to see details
4. Review detailed dependency list

### Auto-Assignment

Auto-assignment happens automatically when tasks are created through the breakdown wizard. It considers:
- Agent skills matching task requirements
- Current workload and availability
- Historical performance

## API Reference

### Task Breakdown Service

```typescript
import { analyzeAndBreakdownTask } from '@/lib/taskBreakdown';

const result = await analyzeAndBreakdownTask(
  {
    source: 'text',
    content: 'Implement user authentication...'
  },
  existingTaskCount
);
```

### Agent Management Service

```typescript
import {
  calculateAssignmentRecommendations,
  autoAssignTask,
  batchAssignTasks
} from '@/lib/agentManagement';

// Get recommendations for a task
const recommendations = calculateAssignmentRecommendations(task, agents);

// Auto-assign a single task
const assignedAgentId = autoAssignTask(task, agents, 0.5);

// Batch assign multiple tasks
const assignments = batchAssignTasks(tasks, agents, 0.5);
```

## Configuration

### Minimum Confidence Threshold

The auto-assignment uses a confidence threshold (default: 0.5). Adjust this in the code:

```typescript
const assignedAgentId = autoAssignTask(task, agents, 0.7); // Higher threshold
```

### Skill Weight Adjustment

Modify the weight of each factor in assignment scoring by editing `/src/lib/agentManagement.ts`:

```typescript
const confidence = (
  skillMatch * 0.5 +      // Adjust skill importance
  availabilityScore * 0.2 + // Adjust availability importance
  performanceScore * 0.3    // Adjust performance importance
);
```

## Best Practices

### Writing Effective Input

For best breakdown results:
- Be specific about requirements
- Mention technologies/frameworks
- Describe user flows
- Include acceptance criteria
- Note dependencies
- Mention security/performance needs

### Managing Agent Skills

- Keep skills updated
- Use consistent naming (e.g., "React" not "ReactJS")
- Set realistic proficiency levels
- Add both technical and domain skills

### Handling Dependencies

- Review generated dependencies
- Add manual dependencies as needed
- Consider critical path
- Update as work progresses

## Troubleshooting

### Tasks Not Auto-Assigning

- Check agent skills are defined
- Verify agents are available
- Lower confidence threshold
- Ensure task tags match agent skills

### Poor Breakdown Quality

- Provide more detailed input
- Include specific requirements
- Mention technical details
- Add context about the system

### Performance Issues

- Limit number of tasks in breakdown
- Use pagination for large task lists
- Consider breaking large epics into smaller ones

## Future Enhancements

Potential improvements:
- Real-time collaboration
- ML-based skill detection
- Integration with GitHub/Jira
- Advanced dependency conflict detection
- Time-based scheduling
- Resource capacity planning
- Burndown charts and analytics

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Open a GitHub issue
4. Contact the development team
