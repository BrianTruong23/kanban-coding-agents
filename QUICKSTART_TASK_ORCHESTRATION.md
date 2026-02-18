# Quick Start: Task Breakdown & Agent Orchestration

Get up and running with automated task breakdown and agent orchestration in 5 minutes.

## Prerequisites

- Existing Kanban board setup with Supabase
- Node.js 18+ installed
- Anthropic API key (optional, for AI features)

## Step 1: Database Setup (2 minutes)

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the schema:

```sql
-- Copy contents from: database/task_breakdown_schema.sql
-- Paste into Supabase SQL Editor and execute
```

✅ This creates all necessary tables: epics, subtasks, dependencies, agent_skills, agent_performance, task_breakdown_history

## Step 2: Environment Configuration (1 minute)

Create or update `.env.local`:

```bash
# Required for existing features
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: Enable AI-powered breakdown
ANTHROPIC_API_KEY=your_anthropic_key
# OR
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
```

Get your Anthropic API key: https://console.anthropic.com/

**Note:** AI features work without the key using fallback mode.

## Step 3: Add to Your App (2 minutes)

### Option A: Full Integration

Update `src/app/page.tsx`:

```typescript
import { TaskOrchestrator } from '@/components/TaskOrchestrator';
import { useAgentSkills } from '@/hooks/useAgentSkills';

export default function Home() {
  const { tasks, agents, addTask, updateTask } = useTasks();
  const { skills } = useAgentSkills(userId);

  return (
    <div>
      {/* Add to toolbar */}
      <TaskOrchestrator
        tasks={tasks}
        agents={agents}
        agentSkills={skills}
        onAddTask={addTask}
        onUpdateTask={updateTask}
      />

      {/* Existing KanbanBoard */}
      <KanbanBoard {...props} />
    </div>
  );
}
```

### Option B: Individual Components

Use components separately:

```typescript
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { AgentSkillManager } from '@/components/AgentSkillManager';
import { DependencyGraph } from '@/components/DependencyGraph';

// Use as needed in your app
```

## Step 4: Initialize Agent Skills (Optional)

Add some skills to enable auto-assignment:

```typescript
// Add skills for your agents
const { addSkill } = useAgentSkills(userId);

await addSkill({
  agentId: 'agent-id',
  skillName: 'React',
  skillCategory: 'frontend',
  proficiencyLevel: 4,
});
```

Or use the UI: Click the skills manager button and add skills through the interface.

## Usage Examples

### Example 1: Break Down a Feature

1. Click "AI Breakdown" button
2. Paste this example:

```
Build a user dashboard that shows:
- Recent activity feed
- Performance metrics charts
- Quick action buttons
- User profile settings

Technical requirements:
- Use React and TypeScript
- Fetch data from REST API
- Real-time updates via WebSocket
- Responsive design for mobile
```

3. Review the generated breakdown
4. Click "Import All to Board"

### Example 2: Manage Agent Skills

1. Open Agent Skill Manager
2. Select an agent
3. Choose category (e.g., "Frontend")
4. Add skills: React, TypeScript, CSS
5. Set proficiency levels

### Example 3: View Dependencies

1. Click "Dependencies" button
2. See visual graph of task relationships
3. Zoom in/out as needed

## Key Features at a Glance

### 🤖 AI Breakdown
- Input: Issue, PRD, or screenshot
- Output: Epics → Tasks → Subtasks
- Includes: DoD, test notes, risk assessment

### 👥 Auto-Assignment
- Analyzes agent skills
- Balances workload
- Considers performance history
- Shows match score & reason

### 📊 Dependency Graph
- Visual task relationships
- Hierarchical layout
- Status indicators
- Interactive zoom

### ⚡ Agent Skills
- Skill categories
- Proficiency levels (1-5 stars)
- Performance tracking
- Workload monitoring

## Troubleshooting

### AI Breakdown Not Working?

1. Check API key is set correctly
2. Verify you have API credits
3. Try basic breakdown mode (uncheck "Use AI")

### Database Errors?

1. Ensure SQL script ran successfully
2. Check RLS policies are enabled
3. Verify user is authenticated

### No Auto-Assignment?

1. Add agent skills first
2. Ensure agents exist in database
3. Check task has relevant tags/description

## What's Next?

### Customize the Breakdown Prompt

Edit `src/lib/taskBreakdown.ts`:

```typescript
function createBreakdownPrompt(input: BreakdownInput): string {
  // Customize the prompt for your specific needs
  const basePrompt = `...`;
  return basePrompt;
}
```

### Add More Skill Categories

Edit `src/components/AgentSkillManager.tsx`:

```typescript
const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  // Add your custom categories
  { value: 'security', label: 'Security' },
];
```

### Customize Auto-Assignment Weights

Edit `src/lib/autoAssignment.ts`:

```typescript
// Change the scoring weights
score += skillScore * 0.4;     // Skill matching
score += workloadScore * 0.3;  // Workload balance
score += performanceScore * 0.3; // Performance
```

## Advanced Usage

### Batch Import Tasks

```typescript
import { breakdownTask } from '@/lib/taskBreakdown';

const result = await breakdownTask({
  type: 'prd',
  content: prdDocument,
});

// Process result.epics and result.standaloneTasks
for (const epic of result.epics) {
  for (const task of epic.tasks) {
    await addTask(task);
  }
}
```

### Custom Dependency Layout

Modify `DependencyGraph.tsx` → `calculateLayout()` for custom positioning.

### Export Breakdown Results

```typescript
// Save breakdown for later
const json = JSON.stringify(breakdownResult);
localStorage.setItem('lastBreakdown', json);

// Load later
const saved = JSON.parse(localStorage.getItem('lastBreakdown'));
```

## Performance Tips

- Use basic breakdown for simple tasks (faster)
- AI breakdown for complex requirements
- Add skills incrementally as needed
- Limit dependency graph to <50 nodes

## Getting Help

- 📖 Full docs: `TASK_BREAKDOWN_FEATURE.md`
- 📋 Implementation details: `IMPLEMENTATION_SUMMARY.md`
- 💬 Issues: GitHub repository issues
- 🔍 Database schema: `database/task_breakdown_schema.sql`

## Feature Checklist

After setup, you should be able to:

- [ ] Open task breakdown modal
- [ ] Submit text for breakdown (basic mode)
- [ ] View breakdown results
- [ ] Import tasks to board
- [ ] Open agent skill manager
- [ ] Add skills to agents
- [ ] View dependency graph
- [ ] See auto-assignment recommendations

If any item doesn't work, check the troubleshooting section above.

## Next Steps

1. ✅ Complete database setup
2. ✅ Add API key (optional)
3. ✅ Integrate components
4. 🎯 Add agent skills
5. 🎯 Try your first breakdown
6. 🎯 Review auto-assignments
7. 🎯 Visualize dependencies

---

**Total Setup Time: ~5 minutes**
**Skill Level Required: Intermediate**
**Dependencies: Existing Kanban + Supabase**

Ready to automate your task planning! 🚀
