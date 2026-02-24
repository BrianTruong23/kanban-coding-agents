# Automated Task Breakdown and Agent Orchestration

This document describes the automated task breakdown and agent orchestration system implemented for Issue #8.

## Overview

The system provides automated task breakdown from issues/PRDs/screenshots into hierarchical structures (epics → stories → tasks), intelligent agent assignment based on skills and performance, and visual dependency tracking.

## Features

### 1. Task Breakdown System

**Location**: `src/lib/taskBreakdown.ts`

Automatically breaks down complex requirements into:
- **Epics**: High-level features or initiatives
- **Stories**: User-facing functionality within epics
- **Tasks**: Specific implementation work within stories
- **Subtasks**: Granular work items (via parent-child relationships)

#### Key Capabilities:
- **Automatic DoD Generation**: Creates Definition of Done criteria based on content
- **Risk Detection**: Analyzes content for security, complexity, and technical risks
- **Effort Estimation**: Estimates hours based on content complexity
- **Test Notes Extraction**: Pulls out testing requirements from descriptions
- **Skill Extraction**: Identifies required technical skills from task descriptions

#### Usage Example:
```typescript
import { breakdownTask } from '@/lib/taskBreakdown';

const input = {
  title: 'Implement User Authentication',
  description: 'Add secure login system',
  type: 'prd',
  content: `
    As a user, I want to log in securely
    - Email/password authentication
    - OAuth integration
    - Two-factor authentication
    Risk: Security vulnerabilities
    Testing: Test login flows
  `
};

const result = breakdownTask(input, currentMaxTaskNumber);
// Returns: { epic, stories, tasks, dependencies }
```

### 2. Agent Auto-Assignment

**Location**: `src/lib/autoAssignment.ts`

Intelligently assigns tasks to agents based on:
- **Skill Matching (40% weight)**: Matches required skills with agent proficiency
- **Performance Metrics (30% weight)**: Quality scores and on-time delivery
- **Availability (20% weight)**: Current workload distribution
- **Priority Matching (10% weight)**: High performers for critical tasks

#### Key Functions:

**Single Task Assignment**:
```typescript
import { autoAssignTask } from '@/lib/autoAssignment';

const assignedAgentId = autoAssignTask(task, agents);
```

**Batch Assignment**:
```typescript
import { batchAutoAssign } from '@/lib/autoAssignment';

const assignments = batchAutoAssign(tasks, agents);
// Returns Map<taskId, agentId>
```

**Assignment Scoring**:
```typescript
import { scoreAgentsForTask } from '@/lib/autoAssignment';

const scores = scoreAgentsForTask(task, agents);
// Returns array of { agentId, score, reasons }
```

**Skill Development Recommendations**:
```typescript
import { recommendSkillDevelopment } from '@/lib/autoAssignment';

const recommendations = recommendSkillDevelopment(tasks, agents);
// Suggests skills each agent should learn/improve
```

### 3. Task Dependency Visualization

**Location**: `src/components/DependencyGraph.tsx`

Visual canvas-based graph showing:
- Task relationships and dependencies
- Status-based color coding
- Task type hierarchy (epic/story/task/subtask)
- Interactive node selection

#### Features:
- Force-directed layout algorithm
- Dependency type visualization (blocks, relates_to)
- Hierarchical grouping by task type
- Click to select and view task details

### 4. Task Breakdown Wizard

**Location**: `src/components/TaskBreakdownWizard.tsx`

Interactive UI for creating task breakdowns:

#### Step 1: Input
- Choose input type (Issue/PRD/Screenshot)
- Enter title and description
- Paste requirements/content

#### Step 2: Preview
- Review generated epic, stories, and tasks
- See risk levels and estimates
- View Definition of Done criteria

#### Step 3: Assignment
- Review auto-assigned agents
- See match scores for each agent
- Manually adjust assignments if needed

## Database Schema Extensions

### Tasks Table Additions
```sql
-- Task hierarchy
task_type text DEFAULT 'task'  -- epic, story, task, subtask
parent_task_id uuid REFERENCES tasks(id)

-- Definition of Done
definition_of_done jsonb DEFAULT '[]'::jsonb

-- Testing
test_notes text

-- Risk management
risk_level text DEFAULT 'low'  -- low, medium, high, critical
risk_notes text

-- Effort tracking
estimated_hours numeric(5,2)
actual_hours numeric(5,2)
```

### New Tables

#### task_dependencies
```sql
CREATE TABLE task_dependencies (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks(id),
  depends_on_task_id uuid REFERENCES tasks(id),
  dependency_type text DEFAULT 'blocks',
  created_at timestamp
);
```

#### agent_skills
```sql
CREATE TABLE agent_skills (
  id uuid PRIMARY KEY,
  agent_id uuid REFERENCES agents(id),
  skill_name text NOT NULL,
  proficiency_level integer CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at timestamp
);
```

#### agent_performance
```sql
CREATE TABLE agent_performance (
  id uuid PRIMARY KEY,
  agent_id uuid REFERENCES agents(id),
  task_id uuid REFERENCES tasks(id),
  completion_time_hours numeric(5,2),
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  on_time boolean DEFAULT true,
  notes text,
  created_at timestamp
);
```

## TypeScript Types

### Enhanced Task Types
```typescript
type TaskType = 'epic' | 'story' | 'task' | 'subtask';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type DependencyType = 'blocks' | 'relates_to' | 'duplicates';

interface DoDItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  createdAt: number;
}

interface Task {
  // ... existing fields
  taskType?: TaskType;
  parentTaskId?: string;
  definitionOfDone?: DoDItem[];
  testNotes?: string;
  riskLevel?: RiskLevel;
  riskNotes?: string;
  estimatedHours?: number;
  actualHours?: number;
}
```

### Agent Enhancement Types
```typescript
interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completionTimeHours?: number;
  qualityScore?: 1 | 2 | 3 | 4 | 5;
  onTime: boolean;
  notes?: string;
  createdAt: number;
}

interface CodingAgent {
  // ... existing fields
  skills?: AgentSkill[];
  performanceMetrics?: {
    averageQuality?: number;
    averageCompletionTime?: number;
    onTimePercentage?: number;
    totalTasksCompleted?: number;
  };
}
```

## How to Use

### 1. Using Auto Breakdown

1. Click the **"Auto Breakdown"** button in the toolbar
2. Select input type (Issue/PRD/Screenshot)
3. Enter title and paste your requirements
4. Click **"Generate Breakdown"**
5. Review the generated tasks and assignments
6. Adjust assignments if needed
7. Click **"Create All Tasks"**

### 2. Viewing Dependencies

1. Click the **"Dependencies"** button in the toolbar
2. View the visual graph of task relationships
3. Click nodes to see task details
4. Use color coding to understand status
5. Red arrows = blocking dependencies
6. Gray arrows = related tasks

### 3. Manual Task Creation

Still available via the **"New Task"** button for simple tasks that don't need breakdown.

## Skill Extraction Rules

The system automatically detects required skills from task content:

- **Frontend**: React, CSS, UI/UX (keywords: react, ui, frontend, component, css, tailwind)
- **Backend**: Node.js, PostgreSQL, API Design (keywords: api, backend, server, database, postgresql, sql)
- **TypeScript**: TypeScript (keywords: typescript, type, interface)
- **DevOps**: Docker, CI/CD (keywords: deploy, ci/cd, docker, kubernetes, aws)
- **Mobile**: React Native, Mobile UI (keywords: mobile, ios, android, react native)

## Risk Detection Rules

Risk levels are automatically assigned based on keywords:

- **Critical**: security, authentication, payment, data migration, breaking change
- **High**: database, api, integration, third-party, complex
- **Medium**: refactor, optimization, performance
- **Low**: (default)

## Default Agent Skills

The system creates default agents with predefined skills:

1. **Alex Chen** (Frontend): React (5), Next.js (5), TypeScript (4), CSS (5), UI/UX (4)
2. **Sarah Johnson** (Backend): Node.js (5), PostgreSQL (5), API Design (5), Database Design (4), TypeScript (4)
3. **Mike Rodriguez** (Full-stack): React (4), Node.js (4), TypeScript (5), API Design (3), PostgreSQL (3)
4. **Emma Wilson** (DevOps): Docker (5), CI/CD (5), AWS (4), Kubernetes (4), Linux (5)
5. **David Kim** (Mobile): React Native (5), iOS (4), Android (4), TypeScript (4), Mobile UI (5)

## Future Enhancements

Potential improvements:
1. **AI Integration**: Use LLM API for more intelligent task breakdown
2. **Learning System**: Update agent proficiency based on completed tasks
3. **Workload Balancing**: Real-time workload tracking and visualization
4. **Custom Skills**: Allow users to add custom skills
5. **Dependency Management**: Full CRUD operations for dependencies
6. **Performance Dashboard**: Analytics on agent performance over time
7. **Template Library**: Predefined breakdown templates for common scenarios
8. **Screenshot Analysis**: OCR and image recognition for UI mockups

## Migration Notes

To apply the database changes:

1. Run the updated `database/schema.sql` in your Supabase SQL Editor
2. The migrations are idempotent and safe to run multiple times
3. Existing tasks will have default values for new columns
4. Default agents will be created with skills for new users
5. Existing agents won't have skills initially (can be added manually)

## API Integration Points

For future backend integration:

- `POST /api/tasks/breakdown` - Submit breakdown request
- `GET /api/tasks/:id/dependencies` - Get task dependencies
- `POST /api/tasks/:id/dependencies` - Create dependency
- `DELETE /api/dependencies/:id` - Remove dependency
- `GET /api/agents/:id/skills` - Get agent skills
- `POST /api/agents/:id/skills` - Add skill
- `PUT /api/agents/:id/skills/:skillId` - Update skill proficiency
- `GET /api/agents/:id/performance` - Get performance metrics
- `POST /api/tasks/:id/performance` - Record task completion metrics

## Testing Recommendations

Manual testing checklist:

- [ ] Create a breakdown from an issue description
- [ ] Verify epic, stories, and tasks are created correctly
- [ ] Check that DoD items are generated
- [ ] Verify risk levels are assigned appropriately
- [ ] Confirm agents are auto-assigned based on skills
- [ ] Test manual agent reassignment
- [ ] View dependency graph with multiple tasks
- [ ] Click nodes in dependency graph
- [ ] Create tasks with parent-child relationships
- [ ] Verify sprint filter still works with new task types
- [ ] Test with empty database (new user)
- [ ] Verify default agents have skills assigned

## Troubleshooting

**Issue**: Tasks not appearing after breakdown
- **Solution**: Check browser console for errors, verify database connection

**Issue**: Auto-assignment not working
- **Solution**: Ensure agents have skills defined in database

**Issue**: Dependency graph not rendering
- **Solution**: Check canvas size, verify tasks and dependencies are loaded

**Issue**: Database migration errors
- **Solution**: Run migrations one at a time, check for existing column conflicts

## Contributing

When extending this system:

1. Maintain idempotent migrations
2. Add comprehensive JSDoc comments
3. Update this documentation
4. Test with existing data
5. Consider backward compatibility
6. Follow existing naming conventions
