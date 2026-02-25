# Automated Task Breakdown and Agent Orchestration - Feature Documentation

## Overview

This feature implements an AI-powered system that can take an issue, PRD, or screenshot description and automatically break it down into epics, stories, and subtasks with:
- Definition of Done (DoD)
- Test notes
- Risk flags
- Estimated hours
- Task dependencies
- Automatic agent assignment based on skills and performance

## Components

### 1. Task Breakdown Service (`src/services/taskBreakdownService.ts`)

The core service that analyzes input and generates structured tasks.

**Key Functions:**
- `analyzeAndBreakdown()` - Main entry point for breaking down tasks
- Pattern detection for common development scenarios (auth, API, UI, database, testing)
- Automatic generation of epics, stories, and subtasks
- Dependency graph creation
- Agent assignment based on skill matching

**Supported Input Types:**
- Issues/User Stories
- PRDs (Product Requirement Documents)
- Screenshot descriptions

**Pattern Recognition:**
The service detects patterns based on keywords:
- Authentication (login, signup, session, password)
- API Development (endpoint, REST, GraphQL, backend)
- UI/UX (interface, component, design, frontend)
- Database (schema, migration, data)
- Testing (test, QA, coverage)

### 2. Task Breakdown Component (`src/components/TaskBreakdown.tsx`)

Interactive UI component for creating task breakdowns.

**Features:**
- Input type selection (Issue/PRD/Screenshot)
- Rich text input with context
- Real-time analysis and preview
- Expandable sections for epics, stories, and subtasks
- Summary statistics
- Risk flag visualization
- Agent assignment preview with confidence scores

**Usage:**
```tsx
<TaskBreakdown
  agents={agentsWithSkills}
  existingTaskCount={tasks.length}
  onBreakdownComplete={handleBreakdownComplete}
  onClose={() => setShowTaskBreakdown(false)}
/>
```

### 3. Dependency Graph Component (`src/components/DependencyGraph.tsx`)

Visual representation of task dependencies.

**Features:**
- Hierarchical layout by dependency level
- Color-coded task types (epic, story, subtask)
- Risk flag indicators
- Status badges
- Click handlers for task navigation
- Automatic level calculation
- Legend for easy understanding

**Dependency Types:**
- `requires` - Task A requires Task B to be completed first
- `blocks` - Task A blocks Task B from starting
- `relates-to` - Task A is related to Task B

### 4. Agent Roster Component (`src/components/AgentRoster.tsx`)

Manage agent skills and view performance metrics.

**Features:**
- Agent list with avatars
- Skill management (add/update/remove)
- Skill level rating (1-5 stars)
- Performance metrics dashboard
  - Tasks completed
  - Average quality score
  - Average completion time
- Common skill suggestions
- Real-time skill level updates

**Skill Levels:**
1. Beginner
2. Intermediate
3. Proficient
4. Advanced
5. Expert

### 5. Custom Hooks

#### `useDependencies()` (`src/hooks/useDependencies.ts`)
- Fetch, add, and remove task dependencies
- Query dependencies for specific tasks
- Get blocked/blocking relationships

#### `useAgentSkills()` (`src/hooks/useAgentSkills.ts`)
- Manage agent skills and performance data
- Calculate performance metrics
- Combine agents with their skills and metrics

## Database Schema

### New Tables

#### `task_dependencies`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- task_id (uuid, foreign key to tasks)
- depends_on_task_id (uuid, foreign key to tasks)
- dependency_type (text: 'requires', 'blocks', 'relates-to')
- created_at (timestamp)
```

#### `agent_skills`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- agent_id (uuid, foreign key to agents)
- skill_name (text)
- skill_level (integer 1-5)
- created_at (timestamp)
```

#### `agent_performance`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- agent_id (uuid, foreign key to agents)
- task_id (uuid, foreign key to tasks)
- completion_time_hours (numeric)
- quality_score (integer 1-5)
- notes (text)
- created_at (timestamp)
```

### Updated `tasks` Table

New columns added:
- `task_type` - 'epic', 'story', or 'subtask'
- `epic_id` - Reference to parent epic
- `parent_task_id` - Reference to parent task
- `risk_flags` - Array of risk identifiers
- `estimated_hours` - Estimated completion time
- `definition_of_done` - Acceptance criteria
- `test_notes` - Testing guidelines

## Type Definitions

### Task Types
```typescript
export type TaskType = 'epic' | 'story' | 'subtask';

export interface Task {
  // ... existing fields
  taskType?: TaskType;
  epicId?: string;
  parentTaskId?: string;
  riskFlags?: string[];
  estimatedHours?: number;
  definitionOfDone?: string;
  testNotes?: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'requires' | 'blocks' | 'relates-to';
  createdAt: number;
}
```

### Agent Types
```typescript
export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillLevel: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completionTimeHours?: number;
  qualityScore?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: number;
}

export interface AgentWithSkills extends CodingAgent {
  skills: AgentSkill[];
  performanceMetrics?: AgentPerformanceMetrics;
}
```

## Usage Guide

### 1. Breaking Down a Task

1. Click the "Breakdown" button in the header
2. Select input type (Issue/PRD/Screenshot)
3. Paste or describe your requirement
4. Add optional additional context
5. Click "Analyze & Breakdown"
6. Review the generated epics, stories, and subtasks
7. Check suggested agent assignments
8. Click "Apply Breakdown" to add all tasks to your board

### 2. Viewing Dependencies

1. Click the "Dependencies" button in the header
2. View the hierarchical graph of task relationships
3. Tasks are organized by dependency level
4. Click on tasks to view details
5. Risk flags are highlighted in orange

### 3. Managing Agent Skills

1. Click the "Agents" button in the header
2. Select an agent from the list
3. View their current skills and performance metrics
4. Click "Add Skill" to add a new skill
5. Use the dropdown to update skill levels
6. Click the X button to remove skills

### 4. Auto-Assignment

The system automatically suggests agent assignments based on:
- Skill matching with task requirements
- Skill proficiency levels
- Historical performance metrics
- Task complexity

## Example Workflows

### Creating an Authentication Feature

**Input:**
```
Add user authentication with login, signup, password reset,
and session management. Include email verification.
```

**Generated Structure:**
- **Epic:** User Authentication System
  - **Story:** User Registration
    - Subtask: Create registration form UI
    - Subtask: Add form validation
    - Subtask: Implement API endpoint
    - Subtask: Add email verification
    - Subtask: Write unit tests
  - **Story:** User Login
    - Subtask: Create login form UI
    - Subtask: Implement authentication logic
    - Subtask: Add JWT token management
    - Subtask: Handle error states
    - Subtask: Write integration tests
  - **Story:** Password Reset
  - **Story:** Session Management
  - **Story:** User Profile

**Automatic Risk Flags:**
- security
- data-breach
- compliance

**Dependencies:**
- All stories depend on the epic
- All subtasks depend on their parent story
- Design/Schema tasks block implementation tasks

## Best Practices

1. **Be Specific in Descriptions**: The more detailed your input, the better the breakdown
2. **Review Before Applying**: Always review generated tasks before applying
3. **Adjust Assignments**: Auto-assignments are suggestions - adjust based on current workload
4. **Track Performance**: Update performance metrics to improve future assignments
5. **Manage Dependencies**: Keep the dependency graph clean and logical
6. **Update Skills**: Regularly update agent skills as they learn and grow

## Limitations

1. Pattern recognition is based on keywords - highly unique domains may need manual adjustment
2. Estimated hours are approximations based on task complexity
3. Agent assignment confidence depends on having sufficient skill and performance data
4. Screenshot OCR is a placeholder - real implementation would need vision API integration

## Future Enhancements

- Integration with actual AI/LLM services for better analysis
- Screenshot OCR and vision analysis
- Learning from historical breakdowns
- Custom pattern definitions
- Workload balancing for agent assignments
- Critical path analysis in dependency graphs
- Time tracking integration
- Performance analytics dashboard

## API Reference

### TaskBreakdownService

```typescript
analyzeAndBreakdown(
  input: TaskBreakdownInput,
  agents: AgentWithSkills[],
  existingTaskCount: number
): Promise<TaskBreakdownResult>
```

**Parameters:**
- `input` - The task description and type
- `agents` - Available agents with their skills
- `existingTaskCount` - For generating sequential task IDs

**Returns:**
- `epics` - Array of epic tasks
- `stories` - Array of story tasks
- `subtasks` - Array of subtask tasks
- `dependencies` - Array of task dependencies
- `suggestedAssignments` - Array of agent assignments with confidence scores

## Testing

Manual testing recommended:
1. Create various types of task descriptions
2. Verify proper epic/story/subtask hierarchy
3. Check dependency logic
4. Test agent assignment with different skill sets
5. Verify performance metric calculations
6. Test skill management CRUD operations

## Troubleshooting

**Tasks not appearing after breakdown:**
- Check browser console for errors
- Verify database migrations have been applied
- Ensure user has proper permissions

**Agent assignments seem incorrect:**
- Update agent skills to match task requirements
- Add performance data for more accurate matching
- Review skill keywords in taskBreakdownService.ts

**Dependencies not showing:**
- Verify tasks have proper task_type set
- Check that epicId and parentTaskId are set correctly
- Ensure dependency records are created in the database

## Migration Guide

To apply this feature to an existing project:

1. Run the database migrations:
   ```sql
   -- Apply schema.sql changes
   ```

2. Update your existing tasks if needed:
   ```sql
   UPDATE tasks SET task_type = 'story' WHERE task_type IS NULL;
   ```

3. Import the new components in your main page
4. Add the UI buttons to trigger the modals
5. Test thoroughly with sample data

## Support

For issues or questions:
- Check the console for error messages
- Review the database schema for missing columns
- Verify all type definitions are up to date
- Ensure hooks are properly initialized
