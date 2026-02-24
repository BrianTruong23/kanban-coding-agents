# Task Breakdown & Agent Orchestration System

## Overview

This document describes the automated task breakdown and agent orchestration system implemented for the Kanban Coding Agents board. The system enables AI-powered analysis of issues, PRDs, and requirements to automatically generate epics, tasks, subtasks, and dependencies with intelligent agent assignment.

## Features

### 1. AI-Powered Task Breakdown

The system can analyze requirements and break them down into structured work items:

- **Epic Creation**: High-level features are organized as epics
- **Task Generation**: Epics are broken into implementation tasks
- **Subtask Decomposition**: Complex tasks are split into manageable subtasks
- **Risk Assessment**: Each item is evaluated for risk level (low, medium, high, critical)
- **Definition of Done**: Automatically generated acceptance criteria
- **Test Notes**: Suggested testing approach for each task
- **Effort Estimation**: Hour estimates based on complexity analysis

#### How to Use

1. Click the **"AI Breakdown"** button in the toolbar
2. Select input type (GitHub Issue, PRD, or Free Text)
3. Provide a title and detailed requirements
4. Click **"Analyze & Break Down"**
5. Review the generated structure
6. Click **"Create Tasks"** to add them to your board

#### Input Format

For best results, structure your requirements like this:

```
Feature: User Authentication System

Requirements:
- JWT-based authentication
- User registration with email validation
- Password reset functionality
- Role-based access control (admin, user)

Technical Details:
- Use Supabase for auth
- Add middleware for protected routes
- Implement session management

Acceptance Criteria:
- Users can register with email/password
- Users can log in and receive JWT tokens
- Protected routes redirect unauthenticated users
- Admin users have access to admin panel
```

### 2. Dependency Visualization

The system tracks and visualizes dependencies between tasks:

- **Dependency Types**:
  - `blocked_by`: Task cannot start until another completes
  - `blocks`: Task blocks others from starting
  - `relates_to`: Informational relationship

- **Automatic Detection**: The breakdown service detects implicit dependencies:
  - Database changes before API implementation
  - API implementation before UI work
  - Authentication tasks prioritized early

#### Viewing Dependencies

1. Switch to **"Dependencies"** view mode
2. View the dependency graph showing task relationships
3. Click on tasks to see details
4. Visual indicators show blocking relationships

### 3. Agent Skills & Performance Tracking

Agents now have skills and performance metrics:

#### Agent Skills

- **Skill Management**: Add/remove skills for each agent
- **Proficiency Levels**: 1-5 scale (Beginner to Expert)
- **Common Skills**: React, TypeScript, Node.js, Database, API Design, Testing, DevOps, etc.

#### Performance Metrics

- **Tasks Completed**: Historical completion count
- **Tasks In Progress**: Current workload
- **Average Completion Time**: Time efficiency in hours
- **Success Rate**: Percentage of successfully completed tasks

#### Managing Agent Skills

1. Switch to **"Agents"** view mode
2. Click on an agent to open their profile
3. Click **"Add Skill"** to add new skills
4. Adjust proficiency by clicking the dots (1-5)
5. Remove skills with the trash icon

### 4. Auto-Assignment

The system intelligently assigns tasks to agents based on:

#### Scoring Factors

1. **Skill Matching (40-60%)**:
   - Matches required skills with agent skills
   - Considers proficiency levels
   - Higher weight when expertise is prioritized

2. **Workload (30%)**:
   - Prefers agents with lighter workload
   - Balances work distribution

3. **Performance (30%)**:
   - Considers success rate
   - Factors in average completion time
   - Rewards reliable agents

#### Using Auto-Assignment

Auto-assignment runs automatically when creating tasks via the AI Breakdown wizard. The system:

1. Analyzes required skills from task descriptions
2. Scores all available agents
3. Assigns tasks to best-matched agents
4. Balances workload across the team

You can also manually assign/reassign agents using the agent selector on each task card.

### 5. Task Hierarchy

Tasks now support three types:

- **📦 Epic**: Large feature or initiative
  - Contains multiple tasks
  - High-level goals and objectives

- **📋 Task**: Implementation work item
  - Can be part of an epic
  - Contains subtasks
  - Has definition of done and test notes

- **🔸 Subtask**: Granular work item
  - Part of a parent task
  - Smaller, focused units of work

## Database Schema

### New Tables

#### `task_dependencies`
Tracks relationships between tasks:
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- task_id: UUID (references tasks)
- depends_on_task_id: UUID (references tasks)
- dependency_type: TEXT (blocks, blocked_by, relates_to)
- created_at: TIMESTAMP
```

#### `agent_skills`
Stores agent skill information:
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- agent_id: UUID (references agents)
- skill_name: TEXT
- proficiency_level: INTEGER (1-5)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `agent_performance`
Tracks agent performance metrics:
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- agent_id: UUID (references agents)
- tasks_completed: INTEGER
- tasks_in_progress: INTEGER
- average_completion_time: NUMERIC (hours)
- success_rate: NUMERIC (0-100)
- last_task_completed_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Extended `tasks` Table

New fields added to existing tasks:
```sql
- task_type: TEXT (epic, task, subtask) - default 'task'
- parent_task_id: UUID (references tasks) - for hierarchy
- definition_of_done: TEXT - acceptance criteria
- test_notes: TEXT - testing approach
- risk_level: TEXT (low, medium, high, critical) - risk assessment
- estimated_hours: NUMERIC - effort estimate
```

## API / Hooks

### `useDependencies()`
```typescript
const {
  dependencies,           // All task dependencies
  isLoading,             // Loading state
  addDependency,         // Add new dependency
  removeDependency,      // Remove dependency
  getDependenciesForTask,// Get deps for specific task
  getBlockingTasks,      // Get tasks blocking a task
  getBlockedTasks        // Get tasks blocked by a task
} = useDependencies();
```

### `useAgentSkills(agentId?)`
```typescript
const {
  skills,                // All skills (or filtered by agent)
  isLoading,            // Loading state
  addSkill,             // Add skill to agent
  updateSkill,          // Update proficiency level
  removeSkill,          // Remove skill from agent
  getSkillsByAgent      // Get skills for specific agent
} = useAgentSkills(agentId);
```

### Task Breakdown Service
```typescript
import { breakdownTask } from '@/services/taskBreakdown';

const result = await breakdownTask({
  title: 'Feature name',
  description: 'Requirements...',
  type: 'issue' | 'prd' | 'text'
});

// Result contains:
// - epic: { title, description, estimatedHours, riskLevel }
// - tasks: Array of task definitions with DoD, test notes, etc.
// - dependencies: Array of task relationships
```

### Auto-Assignment Service
```typescript
import {
  findBestAgentForTask,
  autoAssignAgentsToTasks,
  getAssignmentRecommendations
} from '@/services/autoAssignment';

// Find single best agent
const agentId = findBestAgentForTask(task, agents, requiredSkills);

// Batch assign multiple tasks
const assignments = autoAssignAgentsToTasks(tasks, agents, skillsMap);

// Get recommendations with scores
const recommendations = getAssignmentRecommendations(task, agents, skills);
```

## Architecture

### Service Layer

- **`taskBreakdown.ts`**: AI-powered requirement analysis
  - Parses requirements using pattern matching
  - Extracts features, technical details, constraints
  - Generates hierarchical task structure
  - Assesses risk levels
  - Estimates effort
  - Ready for AI model integration (OpenAI, Anthropic, etc.)

- **`autoAssignment.ts`**: Intelligent agent matching
  - Multi-factor scoring algorithm
  - Skill matching with proficiency weights
  - Workload balancing
  - Performance-based recommendations

### Components

- **`TaskBreakdownWizard`**: Modal wizard for requirement input
- **`DependencyGraph`**: Visual dependency tree/graph
- **`AgentRosterManager`**: Agent skills and performance management
- **`EnhancedKanbanBoard`**: Main board with view mode switching

### Hooks

- **`useDependencies`**: Manage task dependencies
- **`useAgentSkills`**: Manage agent skills and proficiency
- **`useTasks`**: Extended to support new task fields

## Future Enhancements

### AI Integration

The current implementation uses rule-based analysis. To integrate actual AI:

1. **OpenAI Integration**:
```typescript
// In taskBreakdown.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are a project manager..." },
    { role: "user", content: input.description }
  ]
});
```

2. **Anthropic Claude**:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  messages: [{ role: "user", content: input.description }]
});
```

3. **Screenshot Analysis**:
```typescript
// Use GPT-4 Vision or Claude with vision
const analysis = await analyzeImage(imageUrl, "Extract UI requirements");
```

### Enhanced Features

- **Real-time Collaboration**: Multiple users editing simultaneously
- **Task Comments**: Discussion threads on tasks
- **File Attachments**: Upload designs, specs, etc.
- **Time Tracking**: Log actual hours spent
- **Sprint Planning**: Drag-drop tasks into sprints
- **Burndown Charts**: Visualize sprint progress
- **Agent Availability**: Calendar integration
- **Notification System**: Alerts for assignments, blockers
- **Export/Import**: JSON/CSV for external tools

## Troubleshooting

### Tasks Not Appearing After Breakdown

- Ensure all database migrations have run
- Check browser console for errors
- Verify Supabase connection and RLS policies

### Auto-Assignment Not Working

- Verify agents have skills configured
- Check that tasks have suggested skills (tags)
- Ensure agent performance records exist

### Dependencies Not Showing

- Verify dependency records in database
- Check that dependency types are valid
- Ensure tasks exist before creating dependencies

## Best Practices

1. **Add Agent Skills First**: Configure agent skills before using auto-assignment
2. **Detailed Requirements**: Provide comprehensive descriptions for better breakdown
3. **Review Before Creating**: Always review AI-generated tasks before adding to board
4. **Update Performance Metrics**: Keep agent performance data current
5. **Use Task Hierarchy**: Organize work as epic → task → subtask
6. **Track Dependencies**: Add blocking relationships to manage work order
7. **Regular Skill Updates**: Keep agent proficiency levels current

## Support

For issues or questions about the task breakdown system:

1. Check this documentation
2. Review the inline code comments
3. Examine the service implementations in `/src/services/`
4. Test with simple examples first
5. Open an issue on the GitHub repository
