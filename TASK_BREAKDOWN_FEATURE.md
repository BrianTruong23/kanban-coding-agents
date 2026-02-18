# Automated Task Breakdown and Agent Orchestration

## Overview

This feature provides AI-powered task breakdown, agent skill management, auto-assignment, and dependency visualization for the Kanban board. It helps teams efficiently break down complex requirements into actionable tasks and automatically assign them to the most suitable agents.

## Features

### 1. AI-Powered Task Breakdown

Break down issues, PRDs, or screenshots into structured project plans with:
- **Epics**: Large features or themes grouping related tasks
- **Tasks**: Specific, actionable work items
- **Subtasks**: Granular breakdown of complex tasks
- **Definition of Done (DoD)**: Clear acceptance criteria for each task
- **Test Notes**: Testing strategies and key test cases
- **Risk Assessment**: Risk level (low/medium/high/critical) and mitigation strategies
- **Effort Estimation**: Hour estimates for planning
- **Dependencies**: Task dependency tracking
- **Required Skills**: Technical skills needed for each task

#### Using the Task Breakdown Feature

1. Click the "AI Breakdown" button in the Kanban toolbar
2. Select input type (Text/Issue, PRD, or Screenshot)
3. Paste your content
4. Choose to use AI-powered or basic breakdown
5. Review the generated breakdown
6. Import tasks to your board

The feature uses Claude 3.5 Sonnet for intelligent breakdown. If the API is unavailable, it falls back to rule-based breakdown.

### 2. Agent Skill Management

Track and manage agent capabilities:

- **Skills Database**: Store agent skills with proficiency levels (1-5)
- **Skill Categories**: Frontend, Backend, DevOps, Testing, Mobile, Database, AI, Design
- **Proficiency Tracking**: Rate expertise from Beginner (1) to Expert (5)
- **Performance History**: Track completed tasks, quality scores, and time estimates

### 3. Auto-Assignment Algorithm

Intelligently assign tasks to agents based on:

- **Skill Matching (40%)**: Match required skills to agent expertise
- **Workload Balance (30%)**: Consider current task load
- **Performance History (30%)**: Factor in quality scores and track record

The algorithm produces scored recommendations with explanations for each suggestion.

### 4. Dependency Visualization

Visualize task relationships:

- **Interactive Graph**: Canvas-based dependency visualization
- **Hierarchical Layout**: Tasks organized by dependency levels
- **Color-Coded Status**: Visual status indicators
- **Zoom Controls**: Zoom in/out for better viewing
- **Type Badges**: Distinguish between tasks and subtasks

## Database Schema

### New Tables

#### `epics`
Stores high-level features or project themes.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- epic_id: TEXT (display ID like "EPIC-1")
- title: TEXT
- description: TEXT
- status: TEXT (planning, in-progress, review, done, blocked)
- priority: INTEGER (1-5)
- tags: TEXT[]
- sprint: TEXT
- created_at, updated_at: TIMESTAMP
```

#### `subtasks`
Stores granular task breakdowns.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- parent_task_id: UUID (references tasks)
- subtask_id: TEXT (display ID like "SUBTASK-1")
- title, description: TEXT
- status: TEXT (todo, in-progress, review, done, blocked)
- priority: INTEGER (1-5)
- assigned_agent_id: UUID (references agents)
- definition_of_done: TEXT
- test_notes: TEXT
- risk_level: TEXT (low, medium, high, critical)
- risk_description: TEXT
- estimated_hours, actual_hours: NUMERIC
- created_at, updated_at: TIMESTAMP
```

#### `task_dependencies`
Tracks task relationships.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- task_id: UUID
- depends_on_task_id: UUID
- dependency_type: TEXT (finish-to-start, start-to-start, etc.)
- created_at: TIMESTAMP
```

#### `agent_skills`
Stores agent capabilities.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- agent_id: UUID (references agents)
- skill_name: TEXT
- skill_category: TEXT
- proficiency_level: INTEGER (1-5)
- created_at, updated_at: TIMESTAMP
```

#### `agent_performance`
Tracks agent task completion metrics.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- agent_id: UUID (references agents)
- task_id, subtask_id: UUID (optional)
- completed_at: TIMESTAMP
- estimated_hours, actual_hours: NUMERIC
- quality_score: INTEGER (1-5)
- notes: TEXT
- created_at: TIMESTAMP
```

#### `task_breakdown_history`
Stores AI breakdown requests and results.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- input_type: TEXT (issue, prd, screenshot, text)
- input_content: TEXT
- breakdown_result: JSONB
- created_at: TIMESTAMP
```

### Extended `tasks` Table

New columns added:
- `epic_id`: UUID (link to epic)
- `definition_of_done`: TEXT
- `test_notes`: TEXT
- `risk_level`: TEXT
- `risk_description`: TEXT

## Setup Instructions

### 1. Database Setup

Run the SQL scripts to create the necessary tables:

```bash
# Run in Supabase SQL Editor
# 1. First, ensure the base schema is set up (database/schema.sql)
# 2. Then run the task breakdown schema
cat database/task_breakdown_schema.sql | pbcopy
# Paste into Supabase SQL Editor and execute
```

### 2. Environment Variables

For AI-powered breakdowns, set your Anthropic API key:

```bash
# .env.local
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
# OR
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com/

### 3. Install Dependencies

All dependencies are already included in package.json. If adding this to a new project:

```bash
npm install
# or
yarn install
```

## Usage Examples

### Example 1: Breaking Down a Feature Request

Input:
```
Build a user authentication system with email/password login,
social OAuth (Google, GitHub), password reset, and email verification.
```

The AI will generate:
- Epic: "User Authentication System"
- Tasks:
  - Email/Password Authentication
  - OAuth Integration
  - Password Reset Flow
  - Email Verification
- Each with DoD, test notes, risk assessment, and subtasks

### Example 2: Auto-Assigning Tasks

```typescript
import { autoAssignTask } from '@/lib/autoAssignment';

const scores = autoAssignTask(
  task,
  agents,
  agentSkills,
  agentWorkloads,
  ['React', 'TypeScript', 'API']
);

// Returns scored recommendations:
// [
//   { agentId: '...', agentName: 'Alex Chen', score: 0.85, reason: 'Strong skill match (95%), Low workload' },
//   { agentId: '...', agentName: 'Sarah Johnson', score: 0.72, reason: 'Moderate skill match (70%), Good track record' }
// ]
```

### Example 3: Managing Agent Skills

```typescript
import { useAgentSkills } from '@/hooks/useAgentSkills';

function AgentSkillsManager() {
  const { skills, addSkill, updateSkill } = useAgentSkills(userId);

  const addNewSkill = async () => {
    await addSkill({
      agentId: 'agent-123',
      skillName: 'React',
      skillCategory: 'frontend',
      proficiencyLevel: 4,
    });
  };
}
```

## Architecture

### Components

- **TaskBreakdownModal**: Input interface for task breakdown
- **BreakdownResultsModal**: Display and import breakdown results
- **DependencyGraph**: Canvas-based dependency visualization

### Services

- **taskBreakdown.ts**: AI-powered breakdown using Claude API
- **autoAssignment.ts**: Intelligent task assignment algorithm

### Hooks

- **useAgentSkills.ts**: Manage agent skills and performance data

### Types

- **epic.ts**: Epic type definitions
- **subtask.ts**: Subtask type definitions
- **dependency.ts**: Dependency type definitions
- **agentSkill.ts**: Agent skill and performance types
- **breakdown.ts**: Task breakdown input/output types

## API Integration

The feature uses the Anthropic Claude API for intelligent task breakdown:

```typescript
// lib/taskBreakdown.ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: prompt }],
  }),
});
```

## Performance Considerations

- **Caching**: Consider caching breakdown results in the database
- **Rate Limiting**: Implement rate limiting for API calls
- **Fallback**: Always provide a non-AI fallback option
- **Optimization**: Use canvas rendering for dependency graphs instead of DOM

## Future Enhancements

- [ ] Gantt chart view for timeline visualization
- [ ] Critical path analysis
- [ ] Resource leveling and optimization
- [ ] Integration with external project management tools
- [ ] Machine learning for improved auto-assignment
- [ ] Real-time collaboration on breakdowns
- [ ] Template library for common project types
- [ ] Export to JIRA/Linear/GitHub Issues

## Troubleshooting

### AI Breakdown Not Working

1. Check that `ANTHROPIC_API_KEY` is set correctly
2. Verify API key has sufficient credits
3. Check browser console for error messages
4. Try the basic breakdown mode as fallback

### Database Errors

1. Ensure all SQL scripts have been run
2. Check RLS policies are enabled
3. Verify user authentication is working
4. Check Supabase logs for detailed errors

### Performance Issues

1. Limit number of nodes in dependency graph
2. Implement pagination for large task lists
3. Use database indexes for faster queries
4. Consider implementing virtual scrolling

## Contributing

When adding features:

1. Follow the existing type structure
2. Maintain backward compatibility
3. Add comprehensive error handling
4. Update this documentation
5. Add tests for new functionality

## License

MIT
