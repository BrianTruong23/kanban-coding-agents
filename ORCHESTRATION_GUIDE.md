# Automated Task Breakdown and Agent Orchestration

## Overview

This feature provides an intelligent system for breaking down requirements (issues, PRDs, screenshots) into structured tasks and automatically assigning them to agents based on skills and performance.

## Key Features

### 1. **Automated Task Breakdown**
- Takes unstructured input (GitHub issues, PRDs, text descriptions, screenshots)
- Generates hierarchical task structure: **Epics → Tickets → Subtasks**
- Creates Definition of Done (DoD) criteria for each ticket
- Identifies test notes and risk flags
- Estimates effort (story points and hours)

### 2. **Agent Skill Management**
- Track agent skills and proficiency levels (1-5)
- Categorize skills (frontend, backend, mobile, devops, etc.)
- Default skill sets for each agent type
- Performance metrics tracking

### 3. **Intelligent Auto-Assignment**
- Matches tasks to agents based on:
  - **Skill match** (50% weight) - proficiency in required skills
  - **Workload** (30% weight) - current task load and availability
  - **Performance** (20% weight) - success rate and completion speed
- Configurable weights and thresholds
- Workload balancing suggestions

### 4. **Dependency Visualization**
- Visual dependency graph showing task relationships
- Supports dependency types:
  - **Blocks**: Task B cannot start until Task A is done
  - **Requires**: Task B needs output from Task A
  - **Related**: Tasks are related but not blocking
- Hierarchical layout with topological sort
- Interactive graph navigation

### 5. **Task Hierarchy View**
- Expandable tree structure
- Progress tracking at each level
- Status indicators and priority badges
- Risk flags and agent assignments

## Database Schema

### New Tables

#### `epics`
High-level features or initiatives
- `epic_id`: Display ID (e.g., "EPIC-1")
- `title`, `description`
- `status`, `priority`, `tags`

#### `tickets`
User stories with acceptance criteria
- `ticket_id`: Display ID (e.g., "TICKET-1")
- `epic_id`: Parent epic reference
- `definition_of_done`: JSON array of DoD criteria
- `test_notes`: Testing guidelines
- `risk_level`, `risk_description`: Risk assessment
- `story_points`, `estimated_hours`: Effort estimation
- `assigned_agent_id`: Assigned agent

#### `subtasks`
Granular implementation tasks
- `subtask_id`: Display ID (e.g., "SUB-1")
- `ticket_id`: Parent ticket reference
- `order_index`: Order within ticket
- `estimated_minutes`: Time estimate
- `assigned_agent_id`: Assigned agent

#### `task_dependencies`
Relationships between tasks
- `source_type`, `source_id`: Task that depends
- `target_type`, `target_id`: Task that is depended upon
- `dependency_type`: blocks | requires | related

#### `agent_skills`
Skills and proficiency for each agent
- `agent_id`: Agent reference
- `skill_name`: Skill identifier
- `skill_category`: frontend | backend | mobile | devops | etc.
- `proficiency_level`: 1-5 rating

#### `agent_performance`
Performance metrics and workload
- `agent_id`: Agent reference
- `tasks_completed`, `tasks_on_time`, `tasks_delayed`
- `average_completion_time_hours`
- `success_rate`: Percentage
- `current_assigned_tasks`, `current_workload_hours`

#### `breakdown_history`
Audit trail of AI-generated breakdowns
- `input_type`, `input_content`
- `generated_epics`, `generated_tickets`, `generated_subtasks`, `generated_dependencies`
- `model_used`, `processing_time_ms`
- `user_accepted`, `user_feedback`

## Usage

### Running the Database Migrations

```bash
# In your Supabase SQL Editor, run:
database/orchestration_schema.sql
```

This will create all necessary tables, indexes, RLS policies, and helper views.

### Using the Automated Breakdown Component

```tsx
import { AutomatedBreakdown } from '@/components/AutomatedBreakdown';

function MyPage() {
  const handleAccept = async (result: BreakdownResult) => {
    // Create actual tasks in database
    // This would call your Supabase API
    console.log('Creating tasks:', result);
  };

  return (
    <AutomatedBreakdown
      agents={agents}
      onAccept={handleAccept}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

### Using the Task Hierarchy Component

```tsx
import { TaskHierarchy } from '@/components/TaskHierarchy';

function MyPage() {
  return (
    <TaskHierarchy
      epics={epics}
      tickets={tickets}
      subtasks={subtasks}
      agents={agents}
      onEpicClick={(epic) => console.log('Epic clicked:', epic)}
      onTicketClick={(ticket) => console.log('Ticket clicked:', ticket)}
      onSubtaskClick={(subtask) => console.log('Subtask clicked:', subtask)}
    />
  );
}
```

### Using the Dependency Graph

```tsx
import { DependencyGraph } from '@/components/DependencyGraph';

function MyPage() {
  const graph = {
    nodes: [
      {
        id: '1',
        type: 'epic',
        displayId: 'EPIC-1',
        title: 'User Authentication',
        status: 'in-progress',
        priority: 5,
      },
      // ... more nodes
    ],
    edges: [
      {
        id: 'e1',
        source: '2',
        target: '1',
        type: 'blocks',
      },
      // ... more edges
    ],
  };

  return (
    <DependencyGraph
      graph={graph}
      onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
      highlightedNodeId="1"
    />
  );
}
```

### Using the Auto-Assignment Algorithm

```tsx
import {
  calculateAssignmentRecommendations,
  autoAssignTicket,
  batchAutoAssign,
} from '@/lib/autoAssignment';

// Get recommendations for a ticket
const recommendations = calculateAssignmentRecommendations(
  ticket,
  agents,
  agentSkills,
  agentPerformance,
  config
);

console.log('Top recommendation:', recommendations[0]);
// { agentId, agentName, score: 85, reasons: [...], matchedSkills: [...] }

// Auto-assign a single ticket
const assignment = autoAssignTicket(
  ticket,
  agents,
  agentSkills,
  agentPerformance
);

// Batch assign multiple tickets (considers workload changes)
const assignments = batchAutoAssign(
  tickets,
  agents,
  agentSkills,
  agentPerformance
);
```

### Using the Task Breakdown Service

```tsx
import { breakdownRequirement, validateBreakdown } from '@/lib/taskBreakdown';

const input = {
  type: 'text',
  content: 'Implement user authentication with OAuth2 support for Google and GitHub',
};

const result = await breakdownRequirement(input);

// Validate the breakdown
const validation = validateBreakdown(result);
if (validation.valid) {
  console.log('Breakdown is valid!');
  console.log('Epics:', result.epics);
  console.log('Tickets:', result.tickets);
  console.log('Subtasks:', result.subtasks);
  console.log('Dependencies:', result.dependencies);
} else {
  console.error('Validation errors:', validation.errors);
}
```

## Configuration

### Auto-Assignment Configuration

```tsx
const config: AutoAssignmentConfig = {
  prioritizeSkillMatch: true, // Favor skill match over workload balance
  skillMatchWeight: 0.5, // 50% weight on skill match
  workloadWeight: 0.3, // 30% weight on workload balance
  performanceWeight: 0.2, // 20% weight on performance history
  maxTasksPerAgent: 10, // Maximum concurrent tasks per agent
  maxHoursPerAgent: 40, // Maximum hours of work per agent
};
```

### Default Agent Skills

Located in `src/lib/agentSkills.ts`:

```tsx
export const DEFAULT_AGENT_SKILLS = {
  'Alex Chen': [
    { skillName: 'React', category: 'frontend', proficiency: 5 },
    { skillName: 'Next.js', category: 'frontend', proficiency: 5 },
    { skillName: 'TypeScript', category: 'frontend', proficiency: 5 },
    // ...
  ],
  'Sarah Johnson': [
    { skillName: 'API Development', category: 'backend', proficiency: 5 },
    { skillName: 'Database Design', category: 'backend', proficiency: 5 },
    // ...
  ],
  // ...
};
```

## Breakdown Algorithm

The task breakdown service uses a rule-based approach with templates. Here's how it works:

1. **Analyze Input**: Detect feature type (new feature, bug fix, refactor)
2. **Generate Epics**: For large features, create an epic
3. **Generate Tickets**: Break down into implementation tickets
   - Database schema changes
   - Backend API endpoints
   - Frontend UI components
   - Integration and testing
4. **Generate Subtasks**: Break tickets into granular tasks
   - Planning and research
   - Implementation
   - Testing
5. **Generate Dependencies**: Create logical dependencies
   - Database → Backend → Frontend → Integration

### Example Breakdown

**Input:**
```
Implement user authentication with OAuth2
- Support Google and GitHub providers
- Store user sessions securely
- Add logout functionality
```

**Output:**
```
EPIC-1: User Authentication
  ├─ TICKET-1: Design and implement database schema
  │   ├─ SUB-1: Design database schema
  │   ├─ SUB-2: Write migration scripts
  │   └─ SUB-3: Test migrations
  ├─ TICKET-2: Implement backend API endpoints
  │   ├─ SUB-4: Define API interface
  │   ├─ SUB-5: Implement OAuth2 integration
  │   ├─ SUB-6: Add session management
  │   └─ SUB-7: Write unit tests
  ├─ TICKET-3: Build frontend user interface
  │   ├─ SUB-8: Create login components
  │   ├─ SUB-9: Implement OAuth flow
  │   └─ SUB-10: Add logout functionality
  └─ TICKET-4: Integration testing and deployment
      ├─ SUB-11: E2E tests
      └─ SUB-12: Deploy to staging

Dependencies:
  TICKET-2 blocks on TICKET-1 (needs database first)
  TICKET-3 blocks on TICKET-2 (needs API first)
  TICKET-4 blocks on TICKET-3 (needs all components)
```

## Future Enhancements

### Integration with LLM APIs
The current implementation uses rule-based templates. For production use, integrate with:
- **OpenAI GPT-4**: For natural language understanding
- **Anthropic Claude**: For detailed requirement analysis
- **Custom fine-tuned models**: Domain-specific breakdown

Example integration:
```tsx
async function analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert software architect. Break down requirements into epics, tickets, and subtasks...',
      },
      {
        role: 'user',
        content: input.content,
      },
    ],
  });

  // Parse response into BreakdownResult
  return parseBreakdownResponse(response);
}
```

### Screenshot Analysis
For `inputType: 'screenshot'`, integrate with vision models:
- **GPT-4 Vision**: Analyze UI mockups
- **Claude 3**: Extract UI components and features

### Advanced Features
- **Learning from feedback**: Improve breakdown based on user corrections
- **Team velocity tracking**: Adjust estimates based on historical data
- **Skill gap analysis**: Identify missing skills in the team
- **Workload forecasting**: Predict future capacity needs
- **Automated testing strategy**: Generate test plans automatically

## Troubleshooting

### Tasks not appearing after breakdown
Check that:
1. Database migrations were run successfully
2. RLS policies are correctly set up
3. User is authenticated

### Auto-assignment not working
Verify:
1. Agent skills are populated
2. Agent performance records exist (or are initialized)
3. Configuration thresholds are reasonable

### Dependency graph not rendering
Ensure:
1. Dependencies reference valid task IDs
2. No circular dependencies exist
3. SVG dimensions are calculated correctly

## API Reference

See the TypeScript type definitions in:
- `src/types/orchestration.ts`: Core types
- `src/lib/taskBreakdown.ts`: Breakdown service
- `src/lib/agentSkills.ts`: Skill management
- `src/lib/autoAssignment.ts`: Assignment algorithm

## Contributing

When extending this feature:
1. Add new skill categories to `AgentSkill` types
2. Update breakdown templates in `taskBreakdown.ts`
3. Adjust auto-assignment weights based on team needs
4. Add custom dependency types if needed
5. Extend the database schema with migrations

## License

MIT
