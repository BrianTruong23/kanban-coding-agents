# Quick Start Guide - Issue #8 Features

Get started with the Automated Task Breakdown and Agent Orchestration system in 5 minutes!

## Step 1: Database Setup (2 minutes)

### Run the Migration

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database/schema_extensions.sql`
4. Click "Run"
5. Verify success (should see "Success. No rows returned")

### Verify Tables Created

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('epics', 'subtasks', 'risk_flags', 'task_dependencies', 'agent_skills');
```

You should see all 5 tables listed.

## Step 2: Initialize Agent Skills (1 minute)

Add skills to your existing agents:

```sql
-- Example: Add skills to the first agent (replace with actual agent IDs)
INSERT INTO agent_skills (user_id, agent_id, skill_name, skill_level, category)
SELECT
  user_id,
  id as agent_id,
  'React' as skill_name,
  5 as skill_level,
  'frontend' as category
FROM agents
WHERE name = 'Alex Chen';

-- Add more skills as needed
INSERT INTO agent_skills (user_id, agent_id, skill_name, skill_level, category)
SELECT user_id, id, 'Node.js', 4, 'backend' FROM agents WHERE name = 'Sarah Johnson';

INSERT INTO agent_skills (user_id, agent_id, skill_name, skill_level, category)
SELECT user_id, id, 'PostgreSQL', 5, 'database' FROM agents WHERE name = 'Sarah Johnson';
```

## Step 3: Try Task Breakdown (1 minute)

### Option A: Use the Service Directly

Create a test file or use the browser console:

```typescript
import { taskBreakdownService } from '@/lib/taskBreakdown';

const testBreakdown = async () => {
  const result = await taskBreakdownService.breakdownTask({
    type: 'issue',
    content: `
      # Add User Profile Page

      - Display user information (name, email, avatar)
      - Allow editing of profile details
      - Add profile picture upload
      - Show user activity history
      - Implement settings panel
    `
  });

  console.log('Breakdown result:', result);
  console.log('Number of tasks:', result.tasks.length);
  console.log('First task:', result.tasks[0]);
};

testBreakdown();
```

### Option B: Use the UI Component

Add the modal to any page:

```typescript
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { useState } from 'react';

function MyPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Break Down Task
      </button>

      <TaskBreakdownModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onApply={async (result) => {
          console.log('Task breakdown:', result);
          // Handle task creation here
        }}
      />
    </>
  );
}
```

## Step 4: Test Auto-Assignment (1 minute)

```typescript
import { agentOrchestrationService } from '@/lib/agentOrchestration';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';

function AutoAssignExample() {
  const { tasks, updateTask } = useTasks();
  const { agents } = useAgents();

  const handleAutoAssign = () => {
    // Get assignment recommendations
    const assignments = agentOrchestrationService.autoAssignTasks(tasks, agents);

    // Apply assignments
    assignments.forEach((agentId, taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        updateTask({ ...task, assignedAgentId: agentId });
      }
    });

    console.log(`Assigned ${assignments.size} tasks!`);
  };

  return (
    <button onClick={handleAutoAssign}>
      Auto-Assign Tasks
    </button>
  );
}
```

## Step 5: View Dependencies (30 seconds)

Add the dependency graph to your board:

```typescript
import { DependencyGraph } from '@/components/DependencyGraph';
import { useTasks } from '@/hooks/useTasks';
import { useDependencies } from '@/hooks/useDependencies';

function MyBoard() {
  const { tasks } = useTasks();
  const { dependencies } = useDependencies();

  return (
    <DependencyGraph
      tasks={tasks}
      dependencies={dependencies}
      onTaskClick={(taskId) => {
        console.log('Clicked task:', taskId);
      }}
    />
  );
}
```

## Common Use Cases

### Use Case 1: Break Down a GitHub Issue

```typescript
const breakdown = await taskBreakdownService.breakdownTask({
  type: 'issue',
  content: `
    # Issue #42: Add Dark Mode Support

    The application should support dark mode across all pages.

    Requirements:
    - Add theme toggle in navbar
    - Implement dark color scheme
    - Save user preference in localStorage
    - Ensure all components support dark mode

    Tech stack: React, Tailwind CSS
  `
});

// Result will include:
// - 1 epic (if large enough)
// - 4-5 tasks (one for each requirement)
// - Multiple subtasks per task
// - DoD criteria for each subtask
// - Test notes
// - Risk flags
```

### Use Case 2: View Agent Performance

```typescript
import { AgentRoster } from '@/components/AgentRoster';

<AgentRoster
  agents={agents}
  tasks={tasks}
  onUpdateAgent={updateAgent}
  onAutoAssign={() => {
    // Auto-assign logic
  }}
/>
```

### Use Case 3: Create Dependencies

```typescript
import { useDependencies } from '@/hooks/useDependencies';

const { addDependency } = useDependencies();

// Task A blocks Task B
await addDependency({
  sourceTaskId: taskB.id,
  targetTaskId: taskA.id,
  dependencyType: 'blocks',
  description: 'Backend API must be ready before frontend can use it'
});
```

## Example: Full Integration

See `INTEGRATION_EXAMPLE.tsx` for a complete integration example showing:

- Task breakdown modal integration
- Agent roster integration
- Dependency graph integration
- Auto-assignment implementation
- Performance tracking
- Dependency validation

## Troubleshooting

### Issue: Tables not created
**Solution**: Check Supabase logs for errors. Ensure you have proper permissions.

### Issue: Agent skills not showing
**Solution**: Verify data inserted correctly:
```sql
SELECT * FROM agent_skills LIMIT 5;
```

### Issue: Auto-assignment not working
**Solution**:
1. Check that agents have skills defined
2. Verify tasks have tags that match skill categories
3. Check agent availability status

### Issue: Components not rendering
**Solution**:
1. Verify all imports are correct
2. Check browser console for errors
3. Ensure hooks are loading data properly

## Next Steps

1. **Customize Agent Skills**: Add skills matching your tech stack
2. **Integrate into KanbanBoard**: Add task breakdown button to your board
3. **Set Up Performance Tracking**: Update metrics when tasks complete
4. **Create Dependencies**: Link related tasks
5. **Use Auto-Assignment**: Let the system assign tasks automatically

## Resources

- **Full Documentation**: See `TASK_BREAKDOWN.md`
- **Implementation Details**: See `ISSUE_8_IMPLEMENTATION.md`
- **Integration Examples**: See `INTEGRATION_EXAMPLE.tsx`
- **API Reference**: Check individual service files for JSDoc comments

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full documentation
3. Check the integration examples
4. Inspect browser console for errors
5. Verify database schema is correct

## Tips for Best Results

### Task Breakdown
- Provide detailed descriptions
- Use bullet points for features
- Mention technologies explicitly
- Include acceptance criteria
- Note any risks or concerns

### Agent Assignment
- Define agent skills accurately
- Update performance metrics regularly
- Set realistic max concurrent tasks
- Keep availability status current

### Dependencies
- Create dependencies during breakdown
- Validate before moving tasks
- Use appropriate dependency types
- Document dependency reasons

---

**You're all set!** 🎉

Start using the automated task breakdown and agent orchestration features to streamline your workflow.
