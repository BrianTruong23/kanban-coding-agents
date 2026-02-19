# Automated Task Breakdown and Agent Orchestration (Issue #8)

## Overview

This feature implements a comprehensive system for automated task breakdown and intelligent agent orchestration. It allows users to parse issues, PRDs, or user stories into structured epics, tasks, and subtasks with automatic agent assignment based on skills and performance metrics.

## Key Features

### 1. Automated Task Breakdown
- **Parse Issues/PRDs**: Automatically parse structured text into epics, tasks, and subtasks
- **Smart Detection**: Intelligently identifies:
  - Epics (marked with `## Epic:` or `## Feature:`)
  - Tasks (marked with `### Task:`, checkboxes `- [ ]`, or numbered lists)
  - Subtasks (indented items or `####` headers)
  - Definition of Done (DoD) criteria
  - Test notes and risk flags
  - Task dependencies
- **Estimation**: Automatic time estimation based on task complexity
- **Skill Extraction**: Identifies required skills from task descriptions

### 2. Agent Roster Management
- **Skill Tracking**: Each agent has multiple skills with proficiency levels (1-5 stars)
- **Performance Metrics**: Track agent performance including:
  - Total tasks completed
  - Average quality score (1-5)
  - On-time delivery percentage
  - Average completion time
- **Skill Management UI**: Add, update, or remove agent skills

### 3. Intelligent Auto-Assignment
- **Multi-Factor Scoring**: Assigns tasks based on:
  - Skill match (50% weight): How well agent skills match task requirements
  - Availability (30% weight): Current workload and capacity
  - Performance (20% weight): Historical quality and on-time metrics
- **Balanced Workload**: Automatically balances tasks across agents
- **Reassignment Suggestions**: Identifies overloaded agents and suggests rebalancing

### 4. Task Dependency Visualization
- **Dependency Graph**: Visual SVG graph showing task relationships
- **Critical Path Detection**: Highlights the longest dependency chain
- **Circular Dependency Detection**: Warns about dependency deadlocks
- **Multiple Views**: Switch between graph view and list view
- **Dependency Types**: Supports 'blocks', 'relates-to', and 'duplicates'

### 5. Task Hierarchy
- **Three-Level Structure**: Epic → Task → Subtask
- **Parent-Child Relationships**: Subtasks link to tasks, tasks link to epics
- **Rich Metadata**: Each task can have:
  - Definition of Done
  - Test notes
  - Risk flags
  - Estimated/actual hours
  - Required skills (as tags)

## Database Schema

### New Tables

#### `agent_skills`
Tracks agent skills and proficiency levels.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- agent_id (uuid, foreign key to agents)
- skill_name (text)
- proficiency_level (integer, 1-5)
- created_at (timestamp)
```

#### `agent_performance`
Records agent performance metrics per task.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- agent_id (uuid, foreign key to agents)
- task_id (uuid, foreign key to tasks)
- completion_time_hours (numeric)
- quality_score (integer, 1-5)
- on_time (boolean)
- notes (text)
- completed_at (timestamp)
```

#### `task_dependencies`
Defines relationships between tasks.
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- task_id (uuid, foreign key to tasks)
- depends_on_task_id (uuid, foreign key to tasks)
- dependency_type (text: 'blocks', 'relates-to', 'duplicates')
- created_at (timestamp)
```

### Extended Tables

#### `tasks` (new columns)
```sql
- task_type (text: 'epic', 'task', 'subtask')
- parent_task_id (uuid, foreign key to tasks)
- definition_of_done (text)
- test_notes (text)
- risk_flags (text array)
- estimated_hours (numeric)
- actual_hours (numeric)
- sprint (text) - from Issue #5
```

## File Structure

### New Files Created

```
src/
├── components/
│   ├── TaskBreakdownModal.tsx      # UI for parsing issues/PRDs
│   ├── AgentManagementModal.tsx    # Agent skills management
│   └── DependencyGraph.tsx         # Dependency visualization
├── hooks/
│   ├── useAgentSkills.ts           # Agent skills & performance hooks
│   └── useTaskDependencies.ts      # Task dependencies hooks
├── lib/
│   ├── taskBreakdown.ts            # Issue parsing logic
│   └── agentAssignment.ts          # Auto-assignment algorithms
└── types/
    ├── task.ts (extended)          # Task hierarchy types
    └── agent.ts (extended)         # Agent skill types
```

### Modified Files

```
database/schema.sql                 # Added new tables and columns
src/hooks/useTasks.ts               # Support new task fields
src/app/page.tsx                    # Integrated new features
```

## Usage Guide

### 1. Automated Task Breakdown

Click the **"Task Breakdown"** button in the header to open the modal.

**Input Format Example:**
```markdown
# Feature: User Authentication

## Epic: Login System
Implement complete login functionality

### Task: Create login form
Build React component with email/password fields
DoD:
- Form validates input
- Error messages display correctly
- Supports password visibility toggle
Test: Verify form submission with valid/invalid credentials
Risk: Password validation may need special characters support

#### Subtask: Design form layout
#### Subtask: Implement validation logic
#### Subtask: Add password toggle

### Task: Implement authentication API
Create backend endpoints for login
DoD:
- POST /api/login endpoint
- JWT token generation
- Session management

## Epic: Registration System
...

Dependencies:
- Task "Create login form" blocks Task "Add OAuth integration"
- Task "Implement authentication API" depends on Task "Setup database"
```

**Auto-Assignment:**
- Check "Auto-assign tasks to agents based on skills" to automatically assign tasks
- The system analyzes task requirements and assigns to the best-matched agent
- Considers skill proficiency, current workload, and past performance

### 2. Agent Roster Management

Click the **"Agents"** button to manage agent skills.

**Features:**
- View all agents and their skills
- Add new skills with proficiency ratings (1-5 stars)
- Update proficiency levels by clicking stars
- Remove skills
- View performance metrics (if available)

**Default Skills:**
- Alex Chen: React (5★), Next.js (5★), TypeScript (4★), UI/UX (5★), CSS (5★)
- Sarah Johnson: Node.js (5★), API Design (5★), Database (5★), PostgreSQL (5★), SQL (5★)
- Mike Rodriguez: React (4★), Node.js (4★), TypeScript (4★), API Design (4★), Database (3★)
- Emma Wilson: Docker (5★), CI/CD (5★), AWS (4★), Kubernetes (4★), Monitoring (5★)
- David Kim: React Native (5★), Mobile UI (5★), iOS (4★), Android (4★), TypeScript (4★)

### 3. Dependency Visualization

Click the **"Dependencies"** button to view task relationships.

**Graph View:**
- Visual SVG diagram showing task connections
- Red lines/boxes indicate critical path
- Arrows show dependency direction
- Click nodes to see task details

**List View:**
- Hierarchical list of all tasks
- Shows "Depends on" and "Blocks" relationships
- Highlights critical path tasks
- Displays dependency levels

**Warnings:**
- Circular dependencies are detected and highlighted in red
- Shows which tasks form the circular chain

### 4. Auto-Assignment Algorithm

The system scores each agent for a task based on:

**Skill Match (50% weight):**
- Compares task's required skills (from tags) with agent skills
- Higher proficiency = higher score
- Missing skills reduce the score

**Availability (30% weight):**
- Calculates current workload (estimated hours of active tasks)
- Assumes 40-hour capacity per agent
- Less workload = higher score

**Performance (20% weight):**
- Average quality score from past tasks
- On-time delivery percentage
- Experience (number of completed tasks)
- New agents get a neutral score of 70

**Score Calculation:**
```
Total Score = (Skill Match × 0.5) + (Availability × 0.3) + (Performance × 0.2)
```

## API Integration Points

### Creating Tasks with Breakdown
```typescript
const { tasks, dependencies } = convertParsedIssueToTasks(
  parsedIssue,
  nextTaskNumber,
  userId
);

// Auto-assign if needed
const assignments = autoAssignTasks(tasks, agentsWithSkills, allTasks);

// Create tasks with assignments
await onCreateTasks(tasks, dependencies, assignments);
```

### Managing Agent Skills
```typescript
// Add skill
await addSkill(agentId, 'React', 5);

// Update proficiency
await updateSkill(skillId, 4);

// Delete skill
await deleteSkill(skillId);
```

### Managing Dependencies
```typescript
// Add single dependency
await addDependency(taskId, dependsOnTaskId, 'blocks');

// Bulk add
await addDependencies([
  { taskId: 'task-1', dependsOnTaskId: 'task-2', dependencyType: 'blocks' },
  { taskId: 'task-3', dependsOnTaskId: 'task-1', dependencyType: 'relates-to' },
]);
```

## Performance Considerations

1. **Memoization**: All Supabase clients are memoized to prevent auth state issues
2. **Batch Operations**: Task creation and dependency addition use batch inserts
3. **Efficient Queries**: Database indexes on:
   - `tasks.task_type`
   - `tasks.parent_task_id`
   - `tasks.sprint`
   - `agent_skills.agent_id`
   - `agent_skills.skill_name`
   - `task_dependencies.task_id`
   - `task_dependencies.depends_on_task_id`

## Testing

### Test Scenario 1: Simple Task Breakdown
Input:
```markdown
# Quick Feature
## Epic: Main
### Task: Build UI
### Task: Build API
```

Expected: 1 epic + 2 tasks created

### Test Scenario 2: With Dependencies
Input:
```markdown
# Feature
### Task: Setup DB
### Task: Create API
Dependencies:
- Task "Setup DB" blocks Task "Create API"
```

Expected: 2 tasks + 1 dependency created

### Test Scenario 3: Auto-Assignment
- Create tasks requiring "React" skill
- Verify Alex Chen (React 5★) gets higher assignment score than others
- Verify tasks are assigned to agents with matching skills

### Test Scenario 4: Circular Dependency Detection
- Create Task A depends on Task B
- Create Task B depends on Task C
- Create Task C depends on Task A
- Open dependency graph
- Verify warning about circular dependency

## Future Enhancements

1. **Screenshot/Image Parsing**: Use OCR to parse mockups/screenshots
2. **AI Integration**: Use GPT/Claude API for more intelligent parsing
3. **Template Library**: Pre-built templates for common project types
4. **Workload Forecasting**: Predict agent capacity over time
5. **Real-time Collaboration**: Multiple users working on the same board
6. **Export/Import**: Export breakdown as Jira/Linear format
7. **Performance Analytics**: Detailed agent performance dashboards
8. **Custom Dependency Types**: User-defined relationship types

## Troubleshooting

**Issue: Tasks not showing after breakdown**
- Solution: Check if sprint filter is active. The breakdown resets it to "all" but manual additions may need filter adjustment.

**Issue: Auto-assignment not working**
- Solution: Ensure agents have skills added. Default agents have skills auto-created on signup.

**Issue: Dependency graph not rendering**
- Solution: Clear browser cache. SVG rendering may cache old data.

**Issue: Circular dependency created accidentally**
- Solution: Open dependency graph, identify the cycle, delete one dependency link.

## Architecture Decisions

### Why Pattern Matching Instead of AI?
- No API keys required for basic functionality
- Faster parsing for structured input
- Predictable results
- Easy to extend with custom rules
- AI integration can be added later as enhancement

### Why Star Rating for Skills?
- Intuitive for users (familiar pattern)
- Granular enough (5 levels) for meaningful differentiation
- Visual feedback (filled/empty stars)
- Easy to update (click to change)

### Why Weighted Scoring for Assignment?
- Balances multiple factors (skills, availability, performance)
- Configurable weights allow tuning
- More sophisticated than simple skill matching
- Prevents overloading high-performing agents

### Why Three-Level Hierarchy?
- Matches common project management patterns (Epic → Story → Task)
- Deep enough for detailed planning
- Shallow enough to avoid confusion
- Extensible if more levels needed

## Contributing

When extending this feature:
1. Update database schema in `database/schema.sql`
2. Add corresponding TypeScript types
3. Create hooks for database operations
4. Build UI components
5. Integrate into main page
6. Update this documentation
7. Add test scenarios

## License

MIT
