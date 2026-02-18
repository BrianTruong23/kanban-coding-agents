# Task Breakdown and Agent Orchestration System

This document describes the automated task breakdown and agent orchestration system implemented in issue #8.

## Overview

The system provides AI-powered task breakdown capabilities that can analyze issues, PRDs, or screenshots and automatically break them down into structured tasks (epics, tickets, and subtasks) with:

- **Definition of Done (DoD)** criteria
- **Test notes** for each task
- **Risk flags** with severity levels and mitigation strategies
- **Automatic dependency detection**
- **Intelligent agent assignment** based on skills and performance

## Features

### 1. Task Hierarchy

Tasks are organized in a three-level hierarchy:

- **Epics**: Large features or initiatives (40+ hours)
- **Tickets**: Individual features or stories (8 hours)
- **Subtasks**: Small, actionable work items (2 hours)

Each task includes:
- Title and description
- Priority (1-5)
- Complexity (low/medium/high)
- Skills required
- Estimated hours
- Definition of Done items
- Test notes
- Risk flags
- Dependencies

### 2. AI-Powered Task Breakdown

The `TaskBreakdownService` analyzes input text and automatically:

1. **Identifies Features**: Extracts main features from issue/PRD text
2. **Detects Technologies**: Recognizes tech stack mentions
3. **Categorizes Work**: Groups features into logical epics
4. **Generates Tasks**: Creates tickets and subtasks for each epic
5. **Analyzes Dependencies**: Determines task relationships (blocks, relates-to, required-for)
6. **Estimates Effort**: Calculates hours based on complexity and scope
7. **Flags Risks**: Identifies security, performance, and technical risks

#### Supported Input Types

- **GitHub Issues**: Parse issue descriptions
- **PRD Documents**: Extract requirements from product docs
- **Screenshots**: Describe UI mockups (with URL)
- **Free Text**: Any project requirements

### 3. Agent Skills and Performance Tracking

Agents have extended profiles including:

#### Skills
- **Categories**: frontend, backend, database, devops, testing, ui-ux, architecture, security, mobile, api-design
- **Proficiency levels**: 1-5 (beginner to expert)
- **Experience years**: Optional tracking

#### Performance Metrics
- Tasks completed
- Success rate (0-100%)
- Quality score (0-100%)
- On-time delivery rate (0-100%)
- Average completion time
- Total hours worked
- Specializations

#### Workload Tracking
- Current tasks count
- Estimated hours remaining
- Availability status: available, busy, overloaded, offline

### 4. Intelligent Auto-Assignment

The `AgentAssignmentService` assigns tasks using a weighted scoring algorithm:

**Score Components** (0-100 for each):
- **Skill Match (40%)**: How well agent skills match task requirements
- **Availability (20%)**: Current workload and capacity
- **Performance (25%)**: Historical success rate and quality
- **Workload Balance (15%)**: Even distribution across team

**Assignment Process**:
1. Calculate scores for all active agents
2. Sort tasks by priority and complexity
3. Assign high-priority tasks first
4. Respect max concurrent task limits
5. Rebalance workload if agents are overloaded

### 5. Task Dependency Visualization

The `TaskDependencyGraph` component provides:

- **Visual graph** showing task relationships
- **Color coding** by task type (epic/ticket/subtask)
- **Dependency lines** showing blocks and relates-to relationships
- **Status indicators** (done, blocked, in-progress)
- **Priority badges** for quick scanning
- **Topological layout** for easy understanding

### 6. Agent Roster Management

The `AgentRosterManager` component displays:

- **Team statistics**: Active agents, utilization rate, available hours
- **Agent profiles**: Skills, performance metrics, workload
- **Top performers**: Leaderboard by quality score
- **Bottlenecks**: Overloaded agents needing help
- **Skill coverage**: Team capabilities across all categories

## Usage

### Using the Task Breakdown Wizard

```typescript
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';
import { ExtendedAgent } from '@/types/agentSkills';

// In your component
const [showWizard, setShowWizard] = useState(false);

<TaskBreakdownWizard
  agents={extendedAgents}
  onClose={() => setShowWizard(false)}
  onApply={(result) => {
    // result.epics, result.tickets, result.subtasks
    // result.dependencies
    // result.suggestedAgentAssignments
    applyTasksToBoard(result);
  }}
/>
```

### Using the Services Directly

```typescript
import { taskBreakdownService } from '@/services/taskBreakdown';
import { agentAssignmentService } from '@/services/agentAssignment';

// Break down a PRD
const result = await taskBreakdownService.breakdown({
  source: 'prd',
  content: prdText,
});

// Auto-assign tasks
const allTasks = [...result.epics, ...result.tickets, ...result.subtasks];
const assignments = agentAssignmentService.autoAssignTasks(allTasks, agents);

// Get best agent for a specific task
const bestAgent = agentAssignmentService.getBestAgent(task, agents);

// Generate roster report
const report = agentAssignmentService.generateRosterReport(agents);
```

## File Structure

```
src/
├── types/
│   ├── taskHierarchy.ts      # Extended task types, DoD, test notes, risks
│   └── agentSkills.ts        # Agent skills, performance, workload types
├── services/
│   ├── taskBreakdown.ts      # AI task breakdown service
│   └── agentAssignment.ts    # Auto-assignment and roster management
└── components/
    ├── TaskBreakdownWizard.tsx    # Main UI for task breakdown
    ├── TaskDependencyGraph.tsx    # Dependency visualization
    └── AgentRosterManager.tsx     # Agent roster management UI
```

## Database Schema Extensions (Future)

To persist extended task and agent data, extend the database schema:

### Extended Tasks Table
```sql
ALTER TABLE tasks ADD COLUMN task_type TEXT; -- 'epic' | 'ticket' | 'subtask'
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN complexity TEXT; -- 'low' | 'medium' | 'high'
ALTER TABLE tasks ADD COLUMN estimated_hours INTEGER;
ALTER TABLE tasks ADD COLUMN actual_hours INTEGER;
ALTER TABLE tasks ADD COLUMN skills_required JSONB;
```

### Task DoD Table
```sql
CREATE TABLE task_definition_of_done (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Task Test Notes Table
```sql
CREATE TABLE task_test_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  test_type TEXT, -- 'unit' | 'integration' | 'e2e' | 'manual'
  priority TEXT, -- 'low' | 'medium' | 'high'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Task Risk Flags Table
```sql
CREATE TABLE task_risk_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT, -- 'low' | 'medium' | 'high' | 'critical'
  mitigation TEXT,
  status TEXT DEFAULT 'open', -- 'open' | 'mitigated' | 'accepted'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Task Dependencies Table
```sql
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  dependent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT, -- 'blocks' | 'relates-to' | 'required-for'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(depends_on_task_id, dependent_task_id)
);
```

### Agent Skills Table
```sql
CREATE TABLE agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
  experience_years INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Agent Performance Table
```sql
CREATE TABLE agent_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  average_completion_time DECIMAL,
  success_rate DECIMAL CHECK (success_rate >= 0 AND success_rate <= 100),
  on_time_delivery_rate DECIMAL CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
  quality_score DECIMAL CHECK (quality_score >= 0 AND quality_score <= 100),
  total_hours_worked DECIMAL DEFAULT 0,
  specializations JSONB,
  last_active TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Agent Workload Table
```sql
CREATE TABLE agent_workload (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  current_tasks INTEGER DEFAULT 0,
  estimated_hours_remaining DECIMAL DEFAULT 0,
  availability TEXT DEFAULT 'available', -- 'available' | 'busy' | 'overloaded' | 'offline'
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Example Workflow

1. **Create a new issue breakdown**:
   - Click "AI Task Breakdown" button
   - Paste GitHub issue or PRD content
   - Click "Generate Tasks"

2. **Review generated tasks**:
   - View epics, tickets, and subtasks
   - Check risk summary
   - Review estimated hours

3. **View dependencies**:
   - Click "View Dependencies"
   - See visual graph of task relationships
   - Identify critical path

4. **Apply to board**:
   - Click "Apply to Board"
   - Tasks are automatically assigned to agents
   - Tasks appear on kanban board

5. **Manage agent roster**:
   - Open "Agent Roster Management"
   - View team utilization
   - Check agent skills and workload
   - Identify bottlenecks

## Future Enhancements

- [ ] Real-time collaboration on task breakdown
- [ ] Machine learning for better effort estimation
- [ ] Integration with GitHub API for automatic issue import
- [ ] Gantt chart view for timeline planning
- [ ] Slack/email notifications for task assignments
- [ ] Advanced analytics and reporting
- [ ] Custom DoD templates by task type
- [ ] Agent availability calendar integration
- [ ] Skill gap analysis and training recommendations
- [ ] Historical data analysis for improving estimates

## Contributing

When adding new features to the task orchestration system:

1. Update types in `src/types/` first
2. Implement service logic in `src/services/`
3. Create UI components in `src/components/`
4. Update database schema if needed
5. Add tests for new functionality
6. Update this documentation

## License

This feature is part of the kanban-coding-agents project.
