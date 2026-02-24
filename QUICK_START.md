# Quick Start Guide: Task Breakdown & Agent Orchestration

## Setup

### 1. Apply Database Migrations

Run the SQL in your Supabase SQL Editor:

```bash
# Copy the contents of database/schema.sql and run in Supabase
```

This will create:
- `agent_skills` table
- `agent_performance` table
- `task_dependencies` table
- `definition_of_done` table
- `test_notes` table
- `risk_flags` table
- Extended `tasks` table with new fields

### 2. No Additional Dependencies Needed

All features use existing dependencies. Just run:

```bash
npm install  # Already done
npm run dev  # Start the app
```

## Using the Features

### Creating Tasks with AI Breakdown

1. **Open the Wizard**
   - Click the "AI Task Breakdown" button in the toolbar (purple gradient button with sparkle icon)

2. **Choose Input Type**
   - **Text**: General descriptions
   - **GitHub Issue**: Paste issue content
   - **PRD**: Paste PRD document
   - **Screenshot**: Describe what you see

3. **Provide Content**
   ```
   Example input:
   "Implement user authentication system with email/password and social login.
   Include signup, login, password reset, profile management, and session handling.
   Use secure practices and implement rate limiting."
   ```

4. **Review Breakdown**
   - Check generated epic, tasks, and subtasks
   - Review estimated hours
   - Check risk flags
   - Review Definition of Done items

5. **Create Tasks**
   - Click "Create Tasks" to add everything to your board
   - Tasks will be auto-assigned if agents have matching skills

### Viewing Dependencies

1. Click the "Dependencies" tab in the view switcher
2. See visual graph of task relationships
3. Click on tasks to see details
4. Review the detailed list below the graph

### Managing Agents

1. Click the "Agents" tab in the view switcher
2. Select an agent from the list
3. View their performance stats
4. Add skills:
   - Click "Add Skill"
   - Enter skill name (e.g., "React", "Python", "DevOps")
   - Select proficiency level (1-5)
   - Click "Add"

## Code Examples

### Using Task Breakdown Programmatically

```typescript
import { analyzeAndBreakdownTask } from '@/lib/taskBreakdown';

// Analyze and break down a task
const result = await analyzeAndBreakdownTask(
  {
    source: 'text',
    content: 'Build a REST API for user management'
  },
  existingTaskCount
);

// Result contains:
// - result.epic: The parent epic (if detected)
// - result.tasks: Array of tasks
// - result.subtasks: Array of subtasks
// - result.dependencies: Array of dependencies
// - result.suggestedAgentAssignments: Recommended assignments
```

### Auto-Assigning Tasks

```typescript
import { autoAssignTask, calculateAssignmentRecommendations } from '@/lib/agentManagement';

// Get recommendations for a task
const recommendations = calculateAssignmentRecommendations(task, agents);
// Returns array sorted by confidence

// Auto-assign with minimum confidence threshold
const agentId = autoAssignTask(task, agents, 0.5);
// Returns agentId if confidence >= 0.5, otherwise undefined

// Batch assign multiple tasks
const assignments = batchAssignTasks(tasks, agents, 0.5);
// Returns Map<taskId, agentId>
```

### Adding Skills to Agents

```typescript
import { addSkillToAgent } from '@/lib/agentManagement';

// Add a skill
const skill = addSkillToAgent(
  agentId,
  'React',
  5  // Expert level
);

// Proficiency levels:
// 1 = Novice
// 2 = Beginner
// 3 = Intermediate
// 4 = Advanced
// 5 = Expert
```

### Updating Agent Performance

```typescript
import { updateAgentPerformance } from '@/lib/agentManagement';

// Update after task completion
const newPerformance = updateAgentPerformance(
  agent,
  completedTask,
  true,  // Was on time
  95     // Quality score (0-100)
);
```

## Component Usage

### Task Breakdown Wizard

```tsx
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';

<TaskBreakdownWizard
  existingTaskCount={tasks.length}
  onBreakdownComplete={(result) => {
    // Handle the breakdown result
    // Create tasks, dependencies, etc.
  }}
  onCancel={() => setShowWizard(false)}
/>
```

### Task Dependency Graph

```tsx
import { TaskDependencyGraph } from '@/components/TaskDependencyGraph';

<TaskDependencyGraph
  tasks={enhancedTasks}
  dependencies={dependencies}
  onTaskClick={(task) => {
    // Handle task click
  }}
/>
```

### Agent Roster

```tsx
import { AgentRoster } from '@/components/AgentRoster';

<AgentRoster
  agents={enhancedAgents}
  onUpdateAgent={(agent) => {
    // Handle agent update
  }}
  onAddSkill={(agentId, skill) => {
    // Handle add skill
  }}
  onRemoveSkill={(agentId, skillId) => {
    // Handle remove skill
  }}
/>
```

## Tips for Best Results

### Task Breakdown
- Be specific and detailed in your input
- Mention technologies and frameworks
- Include acceptance criteria
- Note dependencies and constraints
- Mention security or performance requirements

### Agent Skills
- Use consistent skill names
- Keep skills updated
- Be realistic with proficiency levels
- Include both technical and domain skills

### Auto-Assignment
- Define skills for all agents
- Set appropriate proficiency levels
- Adjust confidence threshold as needed (default: 0.5)
- Review and adjust assignments

## Common Patterns

### Creating an Epic with Tasks

```typescript
// 1. Use the breakdown wizard
const result = await analyzeAndBreakdownTask({
  source: 'text',
  content: 'Build comprehensive user management system...'
}, tasks.length);

// 2. Create epic
await createTask(result.epic);

// 3. Create tasks
for (const task of result.tasks) {
  await createTask(task);
}

// 4. Create subtasks
for (const subtask of result.subtasks) {
  await createTask(subtask);
}

// 5. Save dependencies
for (const dep of result.dependencies) {
  await createDependency(dep);
}
```

### Skill-Based Assignment

```typescript
// 1. Define agent skills
addSkillToAgent(agentId, 'React', 5);
addSkillToAgent(agentId, 'TypeScript', 4);
addSkillToAgent(agentId, 'API Design', 3);

// 2. Create task with relevant tags
const task = {
  title: 'Build user profile component',
  tags: ['frontend', 'react', 'typescript'],
  // ...
};

// 3. Get recommendations
const recommendations = calculateAssignmentRecommendations(task, agents);

// 4. Review recommendations
recommendations.forEach(rec => {
  console.log(`${rec.agentName}: ${rec.confidence}`);
  console.log(`Reasons: ${rec.reasoning.join(', ')}`);
});
```

## Troubleshooting

### Issue: Tasks not auto-assigning
**Solution**:
- Verify agents have skills defined
- Check task tags match agent skills
- Lower confidence threshold
- Ensure agents are marked as available

### Issue: Breakdown not detecting epic
**Solution**:
- Use keywords like "feature", "system", "platform"
- Provide more detailed description
- Describe multiple phases or components

### Issue: Performance slow with many tasks
**Solution**:
- Limit tasks in dependency view to < 50
- Use pagination for large boards
- Consider breaking epics into smaller pieces

### Issue: Dependencies not showing
**Solution**:
- Verify dependencies were created
- Check both tasks exist
- Ensure tasks are in current view filter

## Next Steps

1. **Try the AI Breakdown**: Create your first automated breakdown
2. **Add Agent Skills**: Define skills for your agents
3. **Review Dependencies**: Check the dependency graph
4. **Monitor Performance**: Track agent performance over time
5. **Customize**: Adjust confidence thresholds and weights

## Resources

- **Full Documentation**: See `TASK_BREAKDOWN_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Type Definitions**: Check `src/types/breakdown.ts`
- **Code Comments**: Review inline documentation

## Support

- Check documentation first
- Review code examples
- Test with sample data
- Open GitHub issues for bugs
