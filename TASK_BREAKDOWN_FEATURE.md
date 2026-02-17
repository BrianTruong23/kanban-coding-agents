# Automated Task Breakdown and Agent Orchestration

## Overview

This feature implements an AI-powered system for automatically breaking down issues, PRDs, or screenshots into structured tasks with comprehensive metadata including:

- **Epic/Task/Subtask Hierarchy**: Organize work into logical groupings
- **Definition of Done (DoD)**: Clear completion criteria for each task
- **Test Notes**: Testing requirements and validation steps
- **Risk Flags**: Identified risks with severity levels and mitigation strategies
- **Agent Skills Management**: Track agent capabilities and proficiency levels
- **Auto-Assignment**: Intelligent task assignment based on skills and performance
- **Dependency Visualization**: Visual graph showing task dependencies and blockers

## Architecture

### Database Schema

The feature adds several new tables to support the functionality:

#### Core Tables

1. **epics** - High-level work groupings
   - `id`, `epic_id`, `title`, `description`, `status`, `priority`, `sprint`

2. **subtasks** - Breakdown of individual tasks
   - `id`, `task_id` (FK), `title`, `description`, `status`, `assigned_agent_id`, `order_num`

3. **definition_of_done** - Completion criteria
   - `id`, `task_id` (FK), `criteria`, `is_completed`, `order_num`

4. **test_notes** - Testing requirements
   - `id`, `task_id` (FK), `type`, `description`, `is_passed`

5. **risk_flags** - Risk identification and tracking
   - `id`, `task_id` (FK), `severity`, `category`, `description`, `mitigation`, `status`

6. **task_dependencies** - Task relationship tracking
   - `id`, `dependent_task_id` (FK), `blocked_by_task_id` (FK), `type`

#### Agent Management Tables

7. **agent_skills** - Agent capability tracking
   - `id`, `agent_id` (FK), `category`, `name`, `proficiency`, `years_of_experience`

8. **agent_performance** - Historical performance metrics
   - `id`, `agent_id` (FK), `task_id` (FK), `completion_time`, `quality_score`, `on_time`, `requires_revision`

9. **task_requirements** - Required skills for tasks
   - `id`, `task_id` (FK), `skill_category`, `skill_name`, `required_proficiency`, `importance`

### Type Definitions

#### epic.ts
- `Epic` - Epic structure
- `Subtask` - Subtask details
- `DefinitionOfDone` - DoD criteria
- `TestNote` - Test requirements
- `RiskFlag` - Risk identification
- `TaskDependency` - Task relationships

#### agent-skills.ts
- `AgentSkill` - Skill proficiency tracking
- `AgentPerformance` - Performance history
- `AgentMetrics` - Aggregated metrics
- `TaskRequirement` - Required skills

#### task-breakdown.ts
- `TaskBreakdownInput` - Input structure for breakdown
- `TaskBreakdownResult` - Output from breakdown process
- `BreakdownAnalysis` - Complexity analysis

### Core Services

#### TaskBreakdownService (`src/lib/ai/task-breakdown.ts`)

Analyzes input (issue/PRD/screenshot) and generates structured breakdown:

**Key Methods:**
- `analyzeComplexity()` - Determines task complexity and recommended split
- `breakdownTask()` - Main breakdown orchestration
- `generateEpic()` - Creates epic if needed
- `generateTasks()` - Creates individual tasks
- `generateSubtasks()` - Creates subtasks
- `generateDoD()` - Creates completion criteria
- `generateTestNotes()` - Creates test requirements
- `generateRiskFlags()` - Identifies potential risks
- `generateTaskRequirements()` - Extracts skill requirements

**Complexity Levels:**
- Simple: 1 task, 0 subtasks
- Moderate: 3 tasks, 2 subtasks each
- Complex: 5 tasks, 3 subtasks each
- Very Complex: 8 tasks, 4 subtasks each, 1 epic

**Current Implementation:**
The service uses heuristic-based analysis. For production use, integrate with:
- OpenAI GPT-4/GPT-4 Turbo
- Anthropic Claude 3
- Local LLM (Llama, Mistral, etc.)

#### AutoAssignmentService (`src/lib/ai/auto-assignment.ts`)

Intelligently assigns tasks to agents based on multiple factors:

**Scoring Algorithm:**
1. **Skill Match (40% weight)**
   - Compares agent skills with task requirements
   - Considers proficiency levels
   - Prioritizes required vs. preferred skills

2. **Performance Score (30% weight)**
   - Quality of past work (1-5 scale)
   - On-time delivery rate
   - Revision rate (lower is better)

3. **Availability Score (20% weight)**
   - Current workload
   - Capacity management (max 5 concurrent tasks)

4. **Workload Balance (10% weight)**
   - Prefers balanced distribution
   - Ideal: 2-3 tasks per agent

**Key Methods:**
- `calculateBestAgent()` - Scores all agents for a task
- `autoAssign()` - Assigns multiple tasks optimally
- `calculateConfidence()` - Confidence in recommendation

**Confidence Calculation:**
- High skill match: +30%
- Has performance metrics: +15%
- Has task requirements: +15%
- Base confidence: 50%

### UI Components

#### TaskBreakdownPanel (`src/components/TaskBreakdownPanel.tsx`)

Interactive panel for task breakdown:

**Features:**
- Input type selection (Text, Issue, PRD, Screenshot)
- Content input with context
- Real-time breakdown processing
- Expandable results sections
- Summary of generated items

**Usage:**
```tsx
<TaskBreakdownPanel
  userId={user.id}
  onBreakdownComplete={(result) => {
    // Handle generated tasks, epics, etc.
  }}
/>
```

#### TaskDependencyGraph (`src/components/TaskDependencyGraph.tsx`)

Visualizes task dependencies:

**Features:**
- Graph view with SVG rendering
- List view for easier reading
- Dependency path highlighting
- Blocked/blocking indicators
- Interactive node selection

**Graph Layout:**
- Horizontal layout (left to right)
- Tasks organized by dependency level
- Curved arrows showing relationships
- Color-coded by status

**Usage:**
```tsx
<TaskDependencyGraph
  tasks={tasks}
  dependencies={dependencies}
  onTaskClick={(taskId) => {
    // Handle task selection
  }}
/>
```

#### AgentSkillsManager (`src/components/AgentSkillsManager.tsx`)

Manage agent skills and proficiency:

**Features:**
- Add/remove skills
- Proficiency levels (1-5 stars)
- Years of experience tracking
- Quick-add common skills
- Category-based organization

**Skill Categories:**
- Frontend, Backend, Database
- DevOps, Testing, Design
- Mobile, AI/ML, Security

**Usage:**
```tsx
<AgentSkillsManager
  agent={agent}
  skills={agentSkills}
  onAddSkill={(skill) => { /* ... */ }}
  onRemoveSkill={(skillId) => { /* ... */ }}
  onUpdateSkill={(skill) => { /* ... */ }}
/>
```

## Integration Guide

### 1. Database Setup

Run the updated `database/schema.sql` in your Supabase SQL Editor:

```bash
# The schema includes all new tables with RLS policies
# It's idempotent - safe to run multiple times
```

### 2. Add to Your Page/Component

```tsx
import { TaskBreakdownPanel } from '@/components/TaskBreakdownPanel';
import { TaskDependencyGraph } from '@/components/TaskDependencyGraph';
import { AgentSkillsManager } from '@/components/AgentSkillsManager';
import { taskBreakdownService } from '@/lib/ai/task-breakdown';
import { autoAssignmentService } from '@/lib/ai/auto-assignment';

function MyKanbanPage() {
  const handleBreakdownComplete = async (result: TaskBreakdownResult) => {
    // 1. Save epic if generated
    if (result.epic) {
      await saveEpic(result.epic);
    }

    // 2. Save all tasks
    for (const task of result.tasks) {
      await saveTask(task);
    }

    // 3. Save subtasks
    for (const subtask of result.subtasks) {
      await saveSubtask(subtask);
    }

    // 4. Save DoD criteria
    for (const dod of result.definitionsOfDone) {
      await saveDoD(dod);
    }

    // 5. Save test notes
    for (const note of result.testNotes) {
      await saveTestNote(note);
    }

    // 6. Save risk flags
    for (const risk of result.riskFlags) {
      await saveRiskFlag(risk);
    }

    // 7. Save task requirements
    for (const req of result.requirements) {
      await saveTaskRequirement(req);
    }

    // 8. Auto-assign if desired
    const assignments = await autoAssignmentService.autoAssign(
      result.tasks,
      agents,
      agentSkills,
      result.requirements,
      agentMetrics
    );

    for (const [taskId, agentId] of assignments) {
      await updateTaskAssignment(taskId, agentId);
    }
  };

  return (
    <>
      <TaskBreakdownPanel
        userId={user.id}
        onBreakdownComplete={handleBreakdownComplete}
      />

      <TaskDependencyGraph
        tasks={tasks}
        dependencies={dependencies}
      />

      <AgentSkillsManager
        agent={selectedAgent}
        skills={agentSkills}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
        onUpdateSkill={handleUpdateSkill}
      />
    </>
  );
}
```

### 3. LLM Integration (Optional but Recommended)

For production-quality breakdown, integrate with an LLM:

#### OpenAI Integration

```typescript
// src/lib/ai/openai-breakdown.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeWithGPT4(content: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a technical project manager. Break down requirements into tasks, identify risks, and suggest testing strategies.',
      },
      {
        role: 'user',
        content: `Analyze this requirement and break it down:\n\n${content}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### Anthropic Claude Integration

```typescript
// src/lib/ai/claude-breakdown.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithClaude(content: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Break down this requirement into tasks with DoD, test notes, and risk flags:\n\n${content}`,
      },
    ],
  });

  return response.content;
}
```

## Usage Examples

### Example 1: Breaking Down a GitHub Issue

```typescript
const input: TaskBreakdownInput = {
  type: 'issue',
  content: `
    # Add User Authentication

    Implement user authentication with email/password and OAuth.

    ## Requirements
    - Email/password registration and login
    - Google OAuth integration
    - JWT token management
    - Password reset functionality
    - Profile management

    ## Technical Stack
    - Next.js with React
    - Supabase for auth
    - TypeScript
  `,
  context: 'Existing Next.js app with Supabase integration',
};

const result = await taskBreakdownService.breakdownTask(input, userId);
// Result will include:
// - 1 Epic: "User Authentication System"
// - 5 Tasks: Registration, Login, OAuth, Password Reset, Profile
// - 15+ Subtasks
// - DoD criteria for each task
// - Test notes (unit, integration, e2e)
// - Risk flags (security, timeline, complexity)
```

### Example 2: Auto-Assigning Based on Skills

```typescript
// Define agent skills
const agentSkills = [
  {
    agentId: 'agent-1',
    category: 'frontend',
    name: 'React',
    proficiency: 5,
    yearsOfExperience: 7,
  },
  {
    agentId: 'agent-2',
    category: 'backend',
    name: 'Node.js',
    proficiency: 4,
    yearsOfExperience: 5,
  },
];

// Define task requirements
const taskRequirements = [
  {
    taskId: 'task-1',
    skillCategory: 'frontend',
    skillName: 'React',
    requiredProficiency: 4,
    importance: 'required',
  },
];

// Auto-assign
const scores = await autoAssignmentService.calculateBestAgent(
  task,
  agents,
  agentSkills,
  taskRequirements,
  agentMetrics,
  currentWorkload
);

console.log(scores[0]);
// {
//   agentId: 'agent-1',
//   score: 0.85,
//   confidence: 0.75,
//   reasoning: 'Agent has excellent skill match (90%). Strong performance history. High availability.',
//   breakdown: { skillMatch: 0.9, performanceScore: 0.8, ... }
// }
```

### Example 3: Visualizing Dependencies

```tsx
const dependencies: TaskDependency[] = [
  {
    id: '1',
    dependentTaskId: 'task-2', // Login depends on
    blockedByTaskId: 'task-1', // Registration being done first
    type: 'blocks',
    createdAt: Date.now(),
  },
  {
    id: '2',
    dependentTaskId: 'task-3', // OAuth depends on
    blockedByTaskId: 'task-1', // Registration being done first
    type: 'blocks',
    createdAt: Date.now(),
  },
];

// Render graph
<TaskDependencyGraph
  tasks={tasks}
  dependencies={dependencies}
  onTaskClick={(taskId) => {
    console.log('Selected task:', taskId);
  }}
/>
```

## Risk Flags

The system automatically identifies potential risks:

### Risk Severities
- **Critical**: Blocks entire project
- **High**: Significant impact on timeline/quality
- **Medium**: Moderate impact, manageable
- **Low**: Minor issues

### Risk Categories
- **Technical**: Complexity, unknown tech, performance
- **Dependency**: External dependencies, blocked tasks
- **Resource**: Skill gaps, capacity issues
- **Timeline**: Tight deadlines, estimation uncertainty
- **Quality**: Testing coverage, technical debt

## Performance Tracking

Track agent performance to improve future assignments:

```typescript
// Record performance after task completion
const performance: AgentPerformance = {
  agentId: 'agent-1',
  taskId: 'task-1',
  completionTime: 3 * 24 * 60 * 60 * 1000, // 3 days
  qualityScore: 5, // Excellent
  onTime: true,
  requiresRevision: false,
  notes: 'Clean code, excellent tests, shipped early',
};

await savePerformance(performance);
```

## Best Practices

### 1. Input Quality
- Provide detailed descriptions
- Include technical context
- Specify constraints and requirements
- Add acceptance criteria

### 2. Skill Management
- Keep agent skills updated
- Be realistic with proficiency levels
- Track years of experience
- Review and adjust regularly

### 3. Task Breakdown
- Review AI-generated breakdown
- Adjust complexity estimates
- Add project-specific DoD
- Verify technical requirements

### 4. Assignment Strategy
- Use auto-assignment as suggestions
- Consider team dynamics
- Balance learning opportunities
- Monitor workload distribution

### 5. Dependency Management
- Keep dependency graph updated
- Avoid circular dependencies
- Plan critical path carefully
- Communicate blockers early

## Future Enhancements

### Planned Features
1. **LLM Integration** - OpenAI/Anthropic for better breakdown
2. **Screenshot Analysis** - Vision models for UI mockups
3. **Effort Estimation** - Story points and time estimates
4. **Burndown Charts** - Sprint progress visualization
5. **Agent Availability Calendar** - Time-based assignment
6. **Custom DoD Templates** - Reusable criteria sets
7. **Risk Heat Maps** - Visual risk dashboards
8. **Performance Analytics** - Detailed agent insights
9. **Export/Import** - Share breakdown templates
10. **Slack/Email Notifications** - Assignment alerts

### Integration Opportunities
- GitHub Issues (automated sync)
- Jira (bidirectional sync)
- Linear (task import/export)
- Figma (screenshot extraction)
- Slack (notifications and commands)

## Troubleshooting

### Common Issues

**Q: Tasks not being created after breakdown**
- Check database permissions (RLS policies)
- Verify user authentication
- Check browser console for errors

**Q: Auto-assignment not working**
- Ensure agents have skills defined
- Verify task requirements are set
- Check minimum confidence threshold

**Q: Dependency graph not rendering**
- Verify dependencies are saved to database
- Check task IDs are correct
- Ensure tasks exist before dependencies

**Q: Performance metrics not calculating**
- Save performance records after task completion
- Ensure agent_id and task_id are correct
- Check database for saved records

## Contributing

To extend this feature:

1. Add new skill categories in `agent-skills.ts`
2. Enhance breakdown logic in `task-breakdown.ts`
3. Adjust scoring weights in `auto-assignment.ts`
4. Add new risk categories as needed
5. Extend UI components with new features

## License

MIT - Same as parent project
