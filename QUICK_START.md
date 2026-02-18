# Quick Start Guide: Task Orchestration Features

Get up and running with the new task orchestration features in 5 minutes!

## Prerequisites

- Existing Kanban Coding Agents installation
- Supabase project set up
- Node.js 18+ and npm/yarn/pnpm

## 1. Database Setup (2 minutes)

```bash
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Copy contents of database/schema.sql
# 4. Paste and execute
```

Verify tables created:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should see: epics, agent_skills, agent_performance, task_dependencies
```

## 2. Try the Demo (1 minute)

Add to your page:

```typescript
// src/app/demo/page.tsx
import { OrchestrationDemo } from '@/components/OrchestrationDemo';

export default function DemoPage() {
  return <OrchestrationDemo />;
}
```

Visit `/demo` to see all features!

## 3. Use AI Task Breakdown (30 seconds)

```typescript
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';
import { useState } from 'react';

function MyComponent() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <button onClick={() => setShowWizard(true)}>
        🤖 AI Breakdown
      </button>

      {showWizard && (
        <TaskBreakdownWizard
          onBreakdownComplete={async (result) => {
            // Save to Supabase
            await saveEpic(result.epic);
            await saveTasks(result.tasks);
            await saveDependencies(result.dependencies);
            setShowWizard(false);
          }}
          onCancel={() => setShowWizard(false)}
          epicCounter={1}
          taskCounter={1}
        />
      )}
    </>
  );
}
```

## 4. Add Dependency Graph (30 seconds)

```typescript
import { DependencyGraph } from '@/components/DependencyGraph';

function MyBoard({ tasks, dependencies }) {
  return (
    <DependencyGraph
      tasks={tasks}
      dependencies={dependencies}
      onTaskClick={(taskId) => console.log('Clicked:', taskId)}
    />
  );
}
```

## 5. Show Agent Roster (30 seconds)

```typescript
import { AgentRoster } from '@/components/AgentRoster';

function AgentPage({ agents, tasks }) {
  return (
    <AgentRoster
      agents={agents}
      tasks={tasks}
      onAddSkill={async (agentId, skill) => {
        await supabase.from('agent_skills').insert({
          agent_id: agentId,
          skill_name: skill.skillName,
          skill_level: skill.skillLevel,
        });
      }}
      onRemoveSkill={async (agentId, skillId) => {
        await supabase.from('agent_skills').delete().eq('id', skillId);
      }}
      onUpdateSkill={async (agentId, skillId, level) => {
        await supabase.from('agent_skills')
          .update({ skill_level: level })
          .eq('id', skillId);
      }}
    />
  );
}
```

## 6. Use Auto-Assignment (30 seconds)

```typescript
import { autoAssignTasks } from '@/lib/agentAssignment';

async function assignTasksToAgents(tasks, agents) {
  // Get assignments
  const assignments = autoAssignTasks(tasks, agents, allTasks, 0.6);

  // Save to database
  for (const [taskId, agentId] of assignments.entries()) {
    await supabase
      .from('tasks')
      .update({ assigned_agent_id: agentId })
      .eq('id', taskId);
  }

  console.log(`Auto-assigned ${assignments.size} tasks`);
}
```

## Common Patterns

### Fetch Tasks with All Relations

```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    epic:epics(epic_id, title),
    agent:agents(name, avatar_color),
    dependencies:task_dependencies(
      depends_on_task_id,
      dependency_type
    )
  `)
  .eq('user_id', userId);
```

### Fetch Agents with Skills and Performance

```typescript
const { data: agents } = await supabase
  .from('agents')
  .select(`
    *,
    skills:agent_skills(*),
    performance:agent_performance(*)
  `)
  .eq('user_id', userId);

// Calculate performance metrics
const agentsWithMetrics = agents.map(agent => ({
  ...agent,
  performanceMetrics: {
    tasksCompleted: agent.performance.length,
    averageQualityScore: average(agent.performance.map(p => p.quality_score)),
    averageCompletionTime: average(agent.performance.map(p => p.completion_time_hours)),
  },
}));
```

### Create Epic with Tasks

```typescript
// 1. Create epic
const { data: epic } = await supabase
  .from('epics')
  .insert({
    epic_id: 'EPIC-1',
    title: 'User Authentication',
    description: 'Implement auth system',
    status: 'planning',
    priority: 5,
  })
  .select()
  .single();

// 2. Create tasks linked to epic
const { data: tasks } = await supabase
  .from('tasks')
  .insert([
    {
      task_id: 'TASK-1',
      title: 'Backend API',
      epic_id: epic.id,
      definition_of_done: ['API endpoints created', 'Tests passing'],
      risk_level: 'medium',
      estimated_hours: 8,
    },
    {
      task_id: 'TASK-2',
      title: 'Frontend UI',
      epic_id: epic.id,
      definition_of_done: ['Login form created', 'Error handling'],
      risk_level: 'low',
      estimated_hours: 5,
    },
  ])
  .select();

// 3. Create dependency (UI depends on API)
await supabase.from('task_dependencies').insert({
  task_id: tasks[1].id,
  depends_on_task_id: tasks[0].id,
  dependency_type: 'blocks',
});
```

### Get Agent Recommendations

```typescript
import { recommendAgent } from '@/lib/agentAssignment';

const task = {
  title: 'Build React Dashboard',
  tags: ['react', 'frontend', 'ui'],
  // ... other fields
};

const recommendations = recommendAgent(task, agentsWithSkills, allTasks);

// Show top 3
recommendations.slice(0, 3).forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.agentName}`);
  console.log(`   Score: ${(rec.score * 100).toFixed(0)}%`);
  console.log(`   Reasons: ${rec.reasons.join(', ')}`);
  console.log('');
});
```

## Testing the Features

### Test Task Breakdown

Paste this into the wizard:

```
# Add Real-time Notifications

Implement a real-time notification system for the kanban board.

## Requirements
- WebSocket connection
- React components for notification UI
- Database schema for notifications
- API endpoints for CRUD

## Acceptance Criteria
- [ ] Users receive real-time updates
- [ ] Notifications persist in database
- [ ] UI shows unread count
```

Expected output:
- 1 Epic
- 4 Tasks (Backend, Frontend, Testing, Documentation)
- 3 Dependencies
- DoD for each task
- Risk assessment

### Test Auto-Assignment

```typescript
// Create test task
const task = {
  id: '1',
  taskId: 'TASK-100',
  title: 'Implement React Component',
  description: 'Build a new UI component',
  tags: ['react', 'frontend'],
  status: 'backlog',
  priority: 3,
};

// Run assignment
const assignments = autoAssignTasks([task], agents, [], 0.5);
console.log('Assigned to:', assignments.get(task.id));
```

## Next Steps

1. Read [TASK_ORCHESTRATION.md](./TASK_ORCHESTRATION.md) for detailed docs
2. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) if upgrading
3. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture
4. Customize the breakdown logic in `src/lib/taskBreakdown.ts`
5. Adjust assignment weights in `src/lib/agentAssignment.ts`

## Troubleshooting

**Issue: "Table doesn't exist"**
```sql
-- Verify tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**Issue: "Permission denied"**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'epics';
```

**Issue: "No skills showing for agents"**
```sql
-- Manually trigger default skills creation
SELECT create_default_agent_skills();
```

## Support

- 📚 Full documentation: [TASK_ORCHESTRATION.md](./TASK_ORCHESTRATION.md)
- 🔄 Migration help: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 🏗️ Architecture: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- 🐛 Issues: GitHub Issues

Happy orchestrating! 🎯
