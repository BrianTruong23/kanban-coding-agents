# Automated Task Breakdown and Agent Orchestration Guide

This guide explains the new automated task breakdown and agent orchestration features added to the Kanban Coding Agents system.

## Overview

The system now includes:

1. **AI-Powered Task Breakdown** - Automatically break down issues, PRDs, or screenshots into epics, tickets, and subtasks
2. **Agent Skills & Performance Tracking** - Track agent capabilities and performance metrics
3. **Auto-Assignment** - Intelligently assign tasks to agents based on skills, workload, and performance
4. **Dependency Visualization** - Visualize task dependencies and detect circular dependencies

## Features

### 1. Automated Task Breakdown

Break down complex requirements into actionable tasks automatically.

**How to use:**
1. Click the "AI Breakdown" button in the toolbar
2. Select input type (GitHub Issue, PRD, or Screenshot)
3. Enter the content to analyze
4. Click "Analyze & Breakdown"
5. Review generated tasks with DoD, test notes, and risk flags
6. Click "Create Tasks" to add them to your board

**What gets generated:**
- **Epic** (for large scopes): High-level feature description with business value
- **Tasks**: Broken down by logical groupings (backend, frontend, integration, etc.)
- **Definition of Done**: Acceptance criteria for each task
- **Test Notes**: Testing guidelines specific to each task type
- **Risk Flags**: Identified risks with severity levels and mitigation strategies
- **Subtasks**: Granular work items within each task
- **Dependencies**: Automatic dependency detection between tasks

### 2. Agent Skills Management

Track and manage agent skills to enable intelligent task assignment.

**Data Model:**
```typescript
interface AgentSkill {
  skillName: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
}
```

**Skills are used for:**
- Matching agents to tasks based on required technologies
- Calculating agent suitability scores
- Identifying skill gaps in your team
- Suggesting training opportunities

### 3. Agent Performance Tracking

Monitor agent performance to optimize assignments.

**Metrics tracked:**
- Tasks completed
- On-time delivery rate
- Average completion time
- Quality score (0-100)
- Current workload

**Performance metrics are used to:**
- Prioritize high-performing agents for critical tasks
- Balance workload across the team
- Identify areas for improvement
- Generate performance reports

### 4. Auto-Assignment System

Automatically assign tasks to the most suitable agent.

**Assignment algorithm considers:**
- **Skill Match (40%)**: How well agent skills match task requirements
- **Performance Score (30%)**: Historical performance metrics
- **Workload (30%)**: Current task load and availability

**Assignment process:**
1. Filter available agents (check availability and max workload)
2. Calculate suitability score for each agent
3. Rank agents by score
4. Assign to highest-scoring agent
5. Provide alternatives for manual override

**Features:**
- Single task assignment
- Batch assignment for multiple tasks
- Dependency-aware assignment (assigns in dependency order)
- Workload balancing suggestions
- Assignment reasoning explanation

### 5. Dependency Visualization

Visualize and manage task dependencies.

**Features:**
- Visual dependency graph
- Circular dependency detection
- Blocking vs related dependencies
- Task navigation from dependency view
- Dependency statistics

**Dependency types:**
- **Blocks**: Source task must complete before target can start
- **Related**: Tasks are related but not blocking
- **Duplicate**: Tasks are duplicates

## Database Schema

### New Tables

#### agent_skills
```sql
- id: uuid (primary key)
- agent_id: uuid (foreign key to agents)
- skill_name: text
- level: text (beginner|intermediate|advanced|expert)
- years_experience: integer
- created_at: timestamp
```

#### agent_performance
```sql
- id: uuid (primary key)
- agent_id: uuid (foreign key to agents, unique)
- tasks_completed: integer
- tasks_on_time: integer
- tasks_late: integer
- average_completion_time: numeric
- quality_score: numeric (0-100)
- last_updated: timestamp
```

#### task_dependencies
```sql
- id: uuid (primary key)
- source_task_id: uuid (foreign key to tasks)
- target_task_id: uuid (foreign key to tasks)
- dependency_type: text (blocks|related|duplicate)
- created_at: timestamp
```

#### definition_of_done
```sql
- id: uuid (primary key)
- task_id: uuid (foreign key to tasks)
- criteria: text[]
- test_notes: text[]
- created_at: timestamp
```

#### risk_flags
```sql
- id: uuid (primary key)
- task_id: uuid (foreign key to tasks)
- severity: text (low|medium|high|critical)
- category: text (technical|dependency|resource|timeline|scope)
- description: text
- mitigation: text
- created_at: timestamp
```

### Extended Tables

#### agents
New columns:
- `is_available`: boolean
- `current_workload`: integer (auto-updated by trigger)

#### tasks
New columns:
- `type`: text (epic|task|subtask)
- `epic_id`: uuid (reference to parent epic)
- `parent_task_id`: uuid (reference to parent task)
- `estimated_hours`: numeric
- `actual_hours`: numeric

## Setup Instructions

### 1. Run Database Migrations

Execute the schema extensions in your Supabase SQL Editor:

```bash
# First, ensure the base schema is applied
# Then run:
database/schema_extensions.sql
```

### 2. Initialize Agent Skills (Optional)

For existing agents, you can manually add skills via SQL:

```sql
INSERT INTO agent_skills (agent_id, skill_name, level, years_experience)
VALUES
  ('agent-uuid-here', 'React', 'expert', 5),
  ('agent-uuid-here', 'TypeScript', 'advanced', 4),
  ('agent-uuid-here', 'Node.js', 'intermediate', 3);
```

### 3. Initialize Agent Performance (Optional)

Performance records are created automatically, but you can initialize:

```sql
INSERT INTO agent_performance (agent_id, quality_score)
VALUES ('agent-uuid-here', 100);
```

## API Usage Examples

### Task Breakdown

```typescript
import { analyzeAndBreakdown } from '@/lib/taskBreakdown';

const result = await analyzeAndBreakdown({
  type: 'issue',
  content: 'Implement user authentication...',
  title: 'User Auth Feature'
});

// result.tasks contains generated tasks
// result.epic contains epic (if generated)
// result.dependencies contains task dependencies
```

### Auto-Assignment

```typescript
import { autoAssignTask, findBestAgent } from '@/lib/autoAssignment';

// Single task assignment
const assignment = autoAssignTask(task, agents, {
  considerWorkload: true,
  considerPerformance: true,
  maxWorkload: 5
});

if (assignment.success) {
  console.log(`Assigned to: ${assignment.assignedAgent.name}`);
  console.log(`Reason: ${assignment.reason}`);
}

// Find best agent
const bestAgent = findBestAgent(agents, task);
```

### Agent Skills

```typescript
import {
  calculateSkillMatch,
  suggestSkills,
  detectSkillGaps
} from '@/lib/agentRoster';

// Calculate skill match
const score = calculateSkillMatch(agent, task);

// Suggest skills based on tasks
const suggestions = suggestSkills(tasks);

// Detect skill gaps
const gaps = detectSkillGaps(agents, tasks);
```

## Best Practices

### 1. Task Breakdown
- Provide detailed input for better breakdown accuracy
- Review generated tasks before creating
- Adjust priorities and estimates as needed
- Add custom DoD criteria for domain-specific requirements

### 2. Agent Skills
- Keep skills updated as agents learn new technologies
- Use consistent skill naming (e.g., "React" not "ReactJS")
- Update skill levels based on demonstrated proficiency
- Track years of experience for better matching

### 3. Performance Tracking
- Regularly update task completion times
- Mark tasks as on-time or late for accurate metrics
- Use quality scores to differentiate agent capabilities
- Review performance trends over time

### 4. Auto-Assignment
- Allow auto-assignment for routine tasks
- Review assignments for critical tasks
- Monitor workload distribution
- Use assignment alternatives when needed

### 5. Dependencies
- Define dependencies early in planning
- Check for circular dependencies before creating
- Use "blocks" for true blockers, "related" for reference
- Review dependency graph regularly

## Troubleshooting

### Tasks not auto-assigning
- Check agent availability (`is_available = true`)
- Verify agents have skills defined
- Check workload limits (default max is 5)
- Review skill matching (tags should match skill names)

### Circular dependencies detected
- Review dependency graph
- Identify the cycle
- Remove or reorganize dependencies
- Consider breaking tasks into smaller pieces

### Poor assignment quality
- Add more agent skills
- Update skill levels to reflect reality
- Review and update performance metrics
- Adjust assignment weights if needed

### Performance metrics not updating
- Check database triggers are installed
- Verify RLS policies allow updates
- Review workload calculation trigger
- Check for SQL errors in logs

## Future Enhancements

Potential improvements for the system:

1. **AI Integration**: Use GPT-4 or Claude for more intelligent breakdown
2. **Learning System**: ML model to improve assignment over time
3. **Capacity Planning**: Forecast resource needs based on upcoming work
4. **Sprint Planning**: Auto-generate sprint plans based on priorities
5. **Risk Analysis**: Advanced risk assessment using historical data
6. **Agent Training**: Track skill development over time
7. **Team Analytics**: Dashboard for team performance insights
8. **Integration**: GitHub/Jira sync for real issues/PRDs

## Contributing

When contributing to these features:

1. Follow existing patterns in `/lib` for business logic
2. Keep UI components in `/components` clean and focused
3. Update types in `/types` for new data structures
4. Test with various input scenarios
5. Document new features in this guide
6. Update database schema with migrations

## Support

For issues or questions:
- Check this guide first
- Review the code examples
- Check database schema and RLS policies
- Open an issue on GitHub with detailed reproduction steps
