# Automated Task Breakdown and Agent Orchestration

This feature implements a comprehensive system for automatically breaking down high-level requirements into structured tasks and intelligently assigning them to agents based on skills and performance.

## Features Overview

### 1. **Automated Task Breakdown**
Break down complex requirements into hierarchical task structures:
- **Epics**: High-level features or themes (3-20 hours)
- **Tickets**: Specific features or user stories (1-8 hours)
- **Subtasks**: Granular implementation steps (0.5-3 hours)

### 2. **Multi-Source Input Support**
- **GitHub Issues**: Paste issue URL or content
- **PRD Documents**: Product Requirements Documents
- **Screenshots**: Visual mockups (via vision AI)
- **Plain Text**: Free-form descriptions

### 3. **Comprehensive Task Metadata**
Each generated task includes:
- **Definition of Done**: Clear acceptance criteria
- **Test Notes**: Testing instructions and considerations
- **Risk Flags**: Identified risks with severity levels
- **Dependencies**: Task relationships and blockers
- **Time Estimates**: Hour-based effort estimation
- **Smart Tagging**: Auto-generated relevant tags

### 4. **Agent Roster Management**
- Manage team of coding agents
- Define agent skills and expertise areas
- Track performance metrics:
  - Tasks completed
  - Tasks in progress
  - Performance score (0-5)
  - Availability status
- Monitor team capacity and utilization

### 5. **Intelligent Auto-Assignment**
Automatically assign tasks to agents based on:
- **Skill Matching**: Match task tags with agent skills
- **Workload Balancing**: Consider current task load
- **Performance History**: Prioritize high-performing agents
- **Availability**: Respect agent capacity limits

### 6. **Dependency Visualization**
- Visual graph of task dependencies
- Hierarchical layout showing relationships
- Interactive navigation
- Status-based color coding

## Database Schema

### Tasks Table Extensions
```sql
task_type              -- 'epic', 'ticket', 'subtask'
parent_task_id         -- Reference to parent task
definition_of_done     -- JSONB array of acceptance criteria
test_notes             -- Testing instructions
risk_flags             -- JSONB array of risk objects
dependencies           -- UUID array of dependent task IDs
estimated_hours        -- Numeric time estimate
auto_generated         -- Boolean flag for AI-generated tasks
```

### Agents Table Extensions
```sql
skills                 -- Text array of skill tags
performance_score      -- Numeric (0-5) performance rating
tasks_completed        -- Integer count
tasks_in_progress      -- Integer count
availability           -- 'available', 'busy', 'overloaded', 'offline'
```

### Task Breakdowns Table (New)
Stores history of AI-generated breakdowns:
```sql
source_type            -- 'issue', 'prd', 'screenshot', 'text'
source_content         -- Original input content
source_metadata        -- JSONB metadata (URLs, etc.)
breakdown_result       -- JSONB full breakdown structure
tasks_generated        -- Count of tasks created
```

## Component Architecture

### Core Components

#### `TaskBreakdownWizard`
**Location**: `src/components/TaskBreakdownWizard.tsx`

Multi-step wizard for generating task breakdowns:
1. **Input Step**: Select source type and provide content
2. **Processing Step**: AI analysis with loading indicator
3. **Review Step**: Preview and edit generated breakdown

**Usage**:
```tsx
<TaskBreakdownWizard
  onComplete={(breakdown) => {
    // Handle the generated breakdown
    createTasksFromBreakdown(breakdown);
  }}
  onCancel={() => setShowWizard(false)}
/>
```

#### `AgentRosterManager`
**Location**: `src/components/AgentRosterManager.tsx`

Comprehensive agent management interface:
- Team capacity dashboard
- Agent CRUD operations
- Skill management
- Performance tracking

**Usage**:
```tsx
<AgentRosterManager
  agents={agents}
  tasks={tasks}
  onAddAgent={addAgent}
  onUpdateAgent={updateAgent}
  onDeleteAgent={deleteAgent}
/>
```

#### `TaskDependencyGraph`
**Location**: `src/components/TaskDependencyGraph.tsx`

Interactive dependency visualization:
- Canvas-based graph rendering
- Hierarchical layout algorithm
- Hover interactions
- Click navigation

**Usage**:
```tsx
<TaskDependencyGraph
  tasks={tasks}
  onTaskClick={(taskId) => navigateToTask(taskId)}
  highlightedTaskId={selectedTaskId}
/>
```

### Core Libraries

#### Task Breakdown Service
**Location**: `src/lib/ai/taskBreakdown.ts`

AI-powered task breakdown generation:
```typescript
import { generateTaskBreakdown } from '@/lib/ai/taskBreakdown';

const result = await generateTaskBreakdown({
  type: 'issue',
  content: 'Add user authentication...',
  metadata: { issueNumber: '123' }
});

// Returns: { epics, summary, totalEstimatedHours }
```

**Note**: Currently implements mock AI responses. To integrate with real AI:
- Add OpenAI API (`openai` package) for GPT-4
- Add Anthropic API (`@anthropic-ai/sdk`) for Claude
- Set environment variables: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

#### Agent Assignment Algorithm
**Location**: `src/lib/ai/agentAssignment.ts`

Intelligent task assignment:
```typescript
import { autoAssignTask, batchAssignTasks } from '@/lib/ai/agentAssignment';

// Single task assignment
const assignment = autoAssignTask(task, agents);

// Batch assignment
const assignments = batchAssignTasks(tasks, agents);

// Team capacity analysis
const capacity = calculateTeamCapacity(agents, tasks);
```

**Scoring Algorithm**:
- Skill Matching: 0-40 points (10 per matching skill)
- Availability: 0-30 points
- Performance Score: 0-20 points
- Current Workload: 0-10 points

### Custom Hooks

#### `useTaskBreakdown`
**Location**: `src/hooks/useTaskBreakdown.ts`

Manage task breakdown operations:
```typescript
const {
  isProcessing,
  createTasksFromBreakdown,
  saveBreakdown
} = useTaskBreakdown();

// Create tasks from breakdown
const result = await createTasksFromBreakdown(
  breakdownItems,
  addTask
);

console.log(`Created ${result.created} tasks`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

## Risk Flags System

Risk flags help identify potential issues early:

### Risk Types
- **Technical**: Implementation complexity, tech debt
- **Timeline**: Schedule concerns, deadline risks
- **Dependency**: External dependencies, blockers
- **Resource**: Team capacity, skill gaps
- **Unknown**: Unclear requirements, unknowns

### Risk Severity
- **Critical**: Showstopper, immediate attention required
- **High**: Significant impact, high priority
- **Medium**: Moderate impact, plan mitigation
- **Low**: Minor concern, monitor

## Integration Examples

### 1. Adding Task Breakdown to Kanban Board

```tsx
import TaskBreakdownWizard from '@/components/TaskBreakdownWizard';
import { useTaskBreakdown } from '@/hooks/useTaskBreakdown';

function KanbanBoard() {
  const [showWizard, setShowWizard] = useState(false);
  const { createTasksFromBreakdown } = useTaskBreakdown();
  const { addTask } = useTasks();

  const handleBreakdownComplete = async (breakdown) => {
    const result = await createTasksFromBreakdown(breakdown, addTask);
    alert(`Created ${result.created} tasks!`);
    setShowWizard(false);
  };

  return (
    <>
      <button onClick={() => setShowWizard(true)}>
        AI Task Breakdown
      </button>

      {showWizard && (
        <TaskBreakdownWizard
          onComplete={handleBreakdownComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
```

### 2. Auto-Assigning Tasks

```tsx
import { autoAssignTask } from '@/lib/ai/agentAssignment';

function TaskCard({ task }) {
  const { agents } = useAgents();
  const { updateTask } = useTasks();

  const handleAutoAssign = () => {
    const assignment = autoAssignTask(task, agents);

    if (assignment) {
      updateTask({
        ...task,
        assignedAgentId: assignment.agentId
      });

      console.log(`Assigned to agent: ${assignment.reason}`);
    } else {
      alert('No suitable agent found');
    }
  };

  return (
    <div>
      <button onClick={handleAutoAssign}>
        Auto-Assign
      </button>
    </div>
  );
}
```

### 3. Displaying Dependencies

```tsx
import TaskDependencyGraph from '@/components/TaskDependencyGraph';

function DependencyView() {
  const { tasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <TaskDependencyGraph
        tasks={tasks}
        onTaskClick={setSelectedTask}
        highlightedTaskId={selectedTask?.id}
      />

      {selectedTask && (
        <TaskDetails task={selectedTask} />
      )}
    </div>
  );
}
```

## Production Deployment

### Environment Variables

Add to `.env.local`:
```bash
# Optional: For real AI integration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Database Migration

Run the updated schema:
```bash
# Connect to Supabase SQL Editor
# Paste and execute: database/schema.sql
```

The schema is idempotent - safe to run multiple times.

### Performance Considerations

1. **Task Breakdown**: Mock implementation is instant. Real AI calls take 3-10 seconds.
2. **Dependency Graph**: Renders well up to ~100 tasks. For larger datasets, consider:
   - Pagination
   - Filtering by epic/ticket
   - Server-side rendering

3. **Auto-Assignment**: Runs in O(n*m) where n=tasks, m=agents. Optimized for typical team sizes (5-20 agents).

## Future Enhancements

### Phase 1 (Implemented ✅)
- ✅ Database schema for hierarchical tasks
- ✅ Task breakdown AI service structure
- ✅ Agent skills and performance tracking
- ✅ Auto-assignment algorithm
- ✅ Dependency visualization
- ✅ UI components

### Phase 2 (Future)
- [ ] Real AI integration (OpenAI/Anthropic)
- [ ] GitHub issue fetching via API
- [ ] Screenshot OCR and analysis
- [ ] Machine learning for assignment optimization
- [ ] Historical performance analytics
- [ ] Smart reassignment suggestions
- [ ] Gantt chart view for timeline visualization
- [ ] Critical path analysis
- [ ] Workload balancing automation
- [ ] Agent skill recommendations based on task patterns

### Phase 3 (Future)
- [ ] Multi-project support
- [ ] Cross-project resource allocation
- [ ] Predictive analytics for deadline estimation
- [ ] Integration with CI/CD for automated testing
- [ ] Real-time collaboration on breakdown editing
- [ ] Template library for common breakdown patterns
- [ ] Export to project management tools (Jira, Linear, etc.)

## Troubleshooting

### Tasks Not Creating
**Problem**: Breakdown generates but tasks don't appear

**Solution**: Check:
1. User is logged in (auth context)
2. Database permissions (RLS policies)
3. Console for errors
4. Network tab for failed requests

### Agent Assignment Not Working
**Problem**: Auto-assign returns null

**Solution**:
1. Verify agents have skills defined
2. Check agent availability status
3. Ensure task has tags that match agent skills
4. Review assignment score threshold (minimum 10)

### Dependency Graph Not Rendering
**Problem**: Canvas appears blank

**Solution**:
1. Ensure tasks have dependency arrays populated
2. Check canvas container has defined height
3. Verify task IDs in dependencies array exist
4. Review browser console for errors

## Support and Contributing

For issues or questions:
1. Check existing GitHub issues
2. Review component documentation
3. Examine example implementations above
4. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors
   - Network request details

## License

Same as main project license.
