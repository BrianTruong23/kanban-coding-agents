# Quick Start Guide: Task Breakdown & Agent Orchestration

## 🚀 Setup (2 minutes)

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
-- File: database/schema_updates.sql
```

### 2. Verify Installation
```typescript
// Check that these imports work:
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';
import { AgentRoster } from '@/components/AgentRoster';
import { DependencyGraph } from '@/components/DependencyGraph';
```

## 📝 Basic Usage

### Break Down a Task

```typescript
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';

// In your component:
const [showWizard, setShowWizard] = useState(false);

// Add button:
<button onClick={() => setShowWizard(true)}>
  Breakdown Task
</button>

// Add wizard:
{showWizard && (
  <TaskBreakdownWizard
    userId={user.id}
    onComplete={async (breakdown) => {
      // Create tasks
      for (const task of breakdown.tasks) {
        await addTask(task);
      }
      // Create subtasks, dependencies, metadata...
      setShowWizard(false);
    }}
    onCancel={() => setShowWizard(false)}
  />
)}
```

### Auto-Assign Tasks

```typescript
import { AgentRoster } from '@/components/AgentRoster';

<AgentRoster
  agents={agents}
  tasks={tasks}
  onAutoAssign={async (assignments) => {
    for (const [taskId, agentId] of assignments) {
      const task = tasks.find(t => t.id === taskId);
      await updateTask({ ...task, assignedAgentId: agentId });
    }
  }}
/>
```

### Show Dependencies

```typescript
import { DependencyGraph } from '@/components/DependencyGraph';

<DependencyGraph
  tasks={tasks}
  dependencies={dependencies}
  onTaskClick={(taskId) => {
    // Navigate to task
    setSelectedTaskId(taskId);
  }}
/>
```

## 🎯 Common Patterns

### Full Breakdown Flow

```typescript
// 1. User clicks "Breakdown"
// 2. Paste GitHub issue
// 3. System generates:
//    - 5 tasks
//    - 12 subtasks
//    - 3 dependencies
//    - DoD for each task
//    - Test notes
//    - Risk flags
// 4. Auto-assign to agents
// 5. Tasks appear on board
```

### Agent Skills Setup

```typescript
// Default agents get these skills:
const alexChen = {
  skills: ['frontend', 'ui-ux', 'fullstack'],
  maxConcurrentTasks: 5,
};

const sarahJohnson = {
  skills: ['backend', 'api', 'database'],
  maxConcurrentTasks: 5,
};
```

### Custom Risk Assessment

```typescript
import { taskBreakdownService } from '@/services/taskBreakdownService';

const breakdown = await taskBreakdownService.breakdownInput({
  type: 'issue',
  content: issueText,
}, userId);

// Access risks:
const risks = breakdown.riskFlags.get(taskId);
// risks = [{ level: 'high', description: '...', mitigation: '...' }]
```

## 📊 Data Structure

### Task Breakdown Result

```typescript
{
  tasks: Task[],              // 1-5 tasks typically
  subtasks: Subtask[],        // 3-15 subtasks
  dependencies: Dependency[], // 0-10 dependencies
  definitionsOfDone: Map<taskId, DoD>,
  testNotes: Map<taskId, TestNote[]>,
  riskFlags: Map<taskId, RiskFlag[]>,
}
```

### Agent Performance

```typescript
{
  tasksCompleted: 42,
  averageCompletionTime: 8.5,  // hours
  successRate: 95,             // percent
  currentWorkload: 3,          // active tasks
  skillRatings: {
    'frontend': 4.5,
    'testing': 3.2,
  }
}
```

## 🔧 Hooks

```typescript
// Subtasks
const { subtasks, addSubtask, updateSubtask } = useSubtasks(taskId);

// Dependencies
const { dependencies, addDependency } = useDependencies();

// Metadata (DoD, tests, risks)
const { metadata, updateMetadata } = useTaskMetadata(taskId);
```

## 💡 Tips

### Best Practices

1. **Input Quality**: More detailed issues = better breakdown
2. **Skills**: Keep agent skills updated
3. **Capacity**: Set realistic maxConcurrentTasks
4. **Dependencies**: Define early, check for bottlenecks
5. **Risks**: Review and update mitigation strategies

### Performance

```typescript
// ✅ Good: Load on demand
const { subtasks } = useSubtasks(selectedTaskId);

// ❌ Bad: Load all subtasks upfront
const allSubtasks = tasks.flatMap(t => loadSubtasks(t.id));
```

### Error Handling

```typescript
try {
  const breakdown = await taskBreakdownService.breakdownInput(...);
  // Success
} catch (error) {
  console.error('Breakdown failed:', error);
  // Show user-friendly message
  alert('Failed to break down task. Please try again.');
}
```

## 🎨 Customization

### Custom Skills

```typescript
// Add to src/types/agent.ts:
export type AgentSkill =
  | 'frontend' | 'backend' | ...
  | 'your-custom-skill';
```

### Custom Risk Levels

```typescript
// Modify src/services/taskBreakdownService.ts:
private assessRisks(content: string): RiskFlag[] {
  // Add your custom risk detection logic
  if (content.includes('blockchain')) {
    return [{
      level: 'high',
      description: 'Blockchain integration complexity',
      mitigation: 'Consult blockchain expert',
    }];
  }
}
```

## 📚 Learn More

- **Full Guide**: `TASK_BREAKDOWN_GUIDE.md`
- **Integration**: `INTEGRATION_EXAMPLE.tsx`
- **Technical**: `IMPLEMENTATION_SUMMARY.md`
- **Issue Details**: `ISSUE_8_SOLUTION.md`

## 🆘 Troubleshooting

### Tasks not auto-assigning?
- Check agents have `isActive: true`
- Verify agents have relevant skills
- Ensure capacity: `currentWorkload < maxConcurrentTasks`

### Dependencies not showing?
- Verify both tasks exist
- Check database for dependency records
- Ensure no self-dependencies

### Breakdown seems wrong?
- Provide more context in input
- Use structured markdown (headers, lists)
- Add keywords like "priority", "urgent"

## ⚡ Quick Commands

```bash
# View schema
cat database/schema_updates.sql

# Check components
ls src/components/Task*.tsx

# Check services
ls src/services/*.ts

# Run development server
npm run dev
```

---

**Need Help?** Check the full documentation or open an issue on GitHub.
