# Quick Reference - Task Breakdown & Orchestration

## 🚀 TL;DR

New AI-powered system for breaking down issues into tasks with smart agent assignment.

**Try it now:** Navigate to `/orchestration` after running `npm run dev`

---

## Key Features in 30 Seconds

```
📝 Task Breakdown    → Paste issue/PRD → Get epics/tasks/subtasks + DoD + tests + risks
🎯 Auto-Assignment   → Match tasks to agents based on skills + performance + workload
📊 Dependency Graph  → Visual task dependencies with blocking indicators
💪 Agent Skills      → Track proficiencies (1-5 stars) across 9 categories
📈 Performance       → Monitor quality, on-time delivery, revision rates
```

---

## Quick Start Checklist

- [ ] Run database schema: Copy `database/schema.sql` → Supabase SQL Editor → Execute
- [ ] Start dev server: `npm run dev`
- [ ] Visit: `http://localhost:3000/orchestration`
- [ ] Test breakdown: Paste sample issue → Click "Break Down Tasks"
- [ ] Add skills: Select agent → Add skills with proficiency levels
- [ ] View graph: Check "Dependencies" tab

---

## Component Usage

### TaskBreakdownPanel
```tsx
import { TaskBreakdownPanel } from '@/components/TaskBreakdownPanel';

<TaskBreakdownPanel
  userId={user.id}
  onBreakdownComplete={(result) => {
    // result.tasks - Generated tasks
    // result.subtasks - Generated subtasks
    // result.definitionsOfDone - DoD criteria
    // result.testNotes - Test requirements
    // result.riskFlags - Identified risks
  }}
/>
```

### TaskDependencyGraph
```tsx
import { TaskDependencyGraph } from '@/components/TaskDependencyGraph';

<TaskDependencyGraph
  tasks={tasks}
  dependencies={dependencies}
  onTaskClick={(taskId) => console.log(taskId)}
/>
```

### AgentSkillsManager
```tsx
import { AgentSkillsManager } from '@/components/AgentSkillsManager';

<AgentSkillsManager
  agent={selectedAgent}
  skills={agentSkills}
  onAddSkill={(skill) => saveSkill(skill)}
  onRemoveSkill={(id) => deleteSkill(id)}
  onUpdateSkill={(skill) => updateSkill(skill)}
/>
```

---

## Core Services

### Task Breakdown
```typescript
import { taskBreakdownService } from '@/lib/ai/task-breakdown';

const result = await taskBreakdownService.breakdownTask({
  type: 'issue',
  content: 'Your issue description...',
  context: 'Optional context...',
}, userId);

// result.tasks, result.epic, result.subtasks, etc.
```

### Auto-Assignment
```typescript
import { autoAssignmentService } from '@/lib/ai/auto-assignment';

const scores = await autoAssignmentService.calculateBestAgent(
  task,
  agents,
  agentSkills,
  taskRequirements,
  agentMetrics,
  currentWorkload
);

// scores[0] = { agentId, score, confidence, reasoning }
```

---

## Database Tables

```sql
epics                -- Epic-level groupings
subtasks             -- Task breakdowns
definition_of_done   -- Completion criteria
test_notes           -- Test requirements
risk_flags           -- Risk tracking
task_dependencies    -- Task relationships
agent_skills         -- Agent capabilities
agent_performance    -- Performance metrics
task_requirements    -- Required skills
```

All tables have RLS policies - users can only access their own data.

---

## Skill Categories

- `frontend` - React, Vue, Angular, TypeScript, CSS
- `backend` - Node.js, Python, Java, Go, Ruby
- `database` - PostgreSQL, MySQL, MongoDB, SQL
- `devops` - Docker, Kubernetes, CI/CD, AWS
- `testing` - Jest, Cypress, Unit/Integration/E2E
- `design` - UI/UX, Figma, Prototyping
- `mobile` - React Native, Flutter, iOS, Android
- `ai-ml` - Machine Learning, TensorFlow, LLMs
- `security` - Auth, OWASP, Penetration Testing

---

## Assignment Scoring

Algorithm weights:
- **40%** Skill Match - Do they have the required skills?
- **30%** Performance - Past quality and on-time delivery
- **20%** Availability - Current workload capacity
- **10%** Workload Balance - Even distribution

Confidence factors:
- High skill match: +30%
- Has performance history: +15%
- Has task requirements: +15%
- Base: 50%

---

## Risk Severity Levels

- `critical` - Blocks entire project
- `high` - Significant impact on timeline/quality
- `medium` - Moderate impact, manageable
- `low` - Minor issues

Risk categories: `technical`, `dependency`, `resource`, `timeline`, `quality`

---

## Example Breakdown

Input:
```
Implement dark mode with toggle switch and localStorage persistence.
Tech: React, Tailwind CSS, TypeScript
```

Output:
- 3 tasks (Setup, Implementation, Testing)
- 6 subtasks (2 per task)
- 15 DoD criteria (5 per task)
- 6 test notes
- 2 risk flags (if complex)
- 4 skill requirements

---

## Common Patterns

### Save Breakdown Results
```typescript
const saveBreakdown = async (result: TaskBreakdownResult) => {
  // 1. Save epic
  if (result.epic) await saveEpic(result.epic);

  // 2. Save tasks
  for (const task of result.tasks) {
    await addTask(task);
  }

  // 3. Save subtasks, DoD, tests, risks
  await Promise.all([
    saveSubtasks(result.subtasks),
    saveDoD(result.definitionsOfDone),
    saveTestNotes(result.testNotes),
    saveRisks(result.riskFlags),
  ]);
};
```

### Load Agent Skills
```typescript
const { data: skills } = await supabase
  .from('agent_skills')
  .select('*')
  .eq('agent_id', agentId);
```

### Record Performance
```typescript
await supabase.from('agent_performance').insert({
  agent_id: agentId,
  task_id: taskId,
  completion_time: elapsedMs,
  quality_score: 5,
  on_time: true,
  requires_revision: false,
});
```

---

## File Locations

```
Types:           src/types/epic.ts, agent-skills.ts, task-breakdown.ts
Services:        src/lib/ai/task-breakdown.ts, auto-assignment.ts
Components:      src/components/TaskBreakdownPanel.tsx, etc.
Demo Page:       src/app/orchestration/page.tsx
Database:        database/schema.sql
Docs:            TASK_BREAKDOWN_FEATURE.md, IMPLEMENTATION_GUIDE.md
```

---

## LLM Integration (Optional)

For production-quality breakdown, add to `.env.local`:
```bash
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

Then enhance `task-breakdown.ts` with LLM calls. See docs for examples.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Table doesn't exist | Run database/schema.sql in Supabase |
| RLS prevents access | Check user is authenticated |
| Tasks not saving | Implement database hooks (see examples) |
| Graph not rendering | Verify dependencies data structure |
| Skills not loading | Check agentId matches |

---

## Performance Tips

- Use batch inserts for multiple tasks
- Memoize expensive calculations
- Lazy load components
- Add virtual scrolling for 1000+ items
- Cache breakdown results

---

## Next Steps

1. ✅ Review this guide
2. ✅ Try `/orchestration` demo
3. 🔧 Apply database schema
4. 🔧 Integrate into your pages
5. 🔧 Optional: Add LLM integration

---

## Full Documentation

- **Complete Guide:** [TASK_BREAKDOWN_FEATURE.md](TASK_BREAKDOWN_FEATURE.md)
- **Integration:** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **Summary:** [ISSUE_8_SUMMARY.md](ISSUE_8_SUMMARY.md)

---

**That's it!** You're ready to use automated task breakdown and agent orchestration.
