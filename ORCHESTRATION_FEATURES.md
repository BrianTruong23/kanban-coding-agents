# Task Orchestration and Agent Management Features (Issue #8)

This document describes the automated task breakdown and agent orchestration system implemented for the Kanban Coding Agents application.

## Overview

The orchestration system provides AI-powered task breakdown, intelligent agent assignment, dependency tracking, and comprehensive project insights. It enables teams to efficiently manage complex projects by automating task decomposition and optimal agent assignment.

## Features

### 1. AI-Powered Task Breakdown

**Location**: `src/lib/taskBreakdown.ts`, `src/components/TaskBreakdownModal.tsx`

Parse issues, PRDs, or text descriptions and automatically break them down into:
- **Epics**: High-level feature groups
- **Stories**: Individual implementable tasks
- **Subtasks**: Granular work items

Each generated task includes:
- **Definition of Done (DoD)**: Checklist of completion criteria
- **Test Notes**: Testing guidance and scenarios
- **Risk Flags**: Risk level assessment (low, medium, high, critical)
- **Priority**: Auto-detected priority (1-5)
- **Tags**: Auto-extracted technology and type tags
- **Estimated Hours**: Time estimation based on complexity

**Usage**:
1. Click "AI Breakdown" button in the orchestration toolbar
2. Select input type (Text, GitHub Issue, or PRD)
3. Paste or type the content
4. Review the generated breakdown
5. Apply to create all tasks at once

**Supported Patterns**:
- Markdown headers for epics (`# Epic Name`)
- Bullet points for tasks (`- Task description`)
- Priority keywords (P1-P5, urgent, critical, high, low)
- Technology keywords for auto-tagging (React, API, database, etc.)

### 2. Agent Roster Management

**Location**: `src/components/AgentRoster.tsx`

Comprehensive view of all agents with:
- **Skills Matrix**: View and manage agent skills with proficiency levels (1-5)
- **Performance Metrics**: Track completed tasks, quality scores, on-time percentage
- **Workload Tracking**: Real-time workload and utilization percentage
- **Current Tasks**: Number of active assignments

**Agent Skills** (stored in `agent_skills` table):
- Skill name and proficiency level (1=Beginner, 5=Expert)
- Auto-populated for default agents
- Manually add/edit skills per agent

**Performance Tracking** (stored in `agent_performance` table):
- Completion time in hours
- Quality score (1-5)
- On-time delivery tracking
- Performance notes

### 3. Auto-Assignment Algorithm

**Location**: `src/lib/autoAssignment.ts`

Intelligent task assignment based on:

**Factors Considered**:
1. **Skill Match (40%)**: Match task requirements to agent skills
2. **Performance History (30%)**: Favor agents with better track records
3. **Priority Alignment (20%)**: Assign high-priority tasks to less busy agents
4. **Workload Balance (10%)**: Distribute work evenly

**How It Works**:
```typescript
// Extract skills from task
React, TypeScript → frontend specialist

// Calculate scores for each agent
Agent A: 0.85 (strong skill match, low workload)
Agent B: 0.72 (good performance, moderate skills)
Agent C: 0.60 (high workload, skill match)

// Assign to highest score
Task → Agent A
```

**Usage**:
- Click "Auto-Assign" button to assign all unassigned tasks
- System shows number of tasks assigned
- View recommendations per task in dependency graph

### 4. Dependency Visualization

**Location**: `src/components/DependencyGraph.tsx`

Visual graph of task dependencies showing:
- **Task Relationships**: Which tasks block or depend on others
- **Blocking Issues**: Highlighted tasks with incomplete dependencies
- **Status Indicators**: Color-coded by task status
- **Interactive**: Click tasks to see details and relationships

**Dependency Types**:
- `blocks`: This task blocks another
- `blocked-by`: This task is blocked by another
- `related-to`: Related tasks without blocking relationship

**Visual Indicators**:
- Green circle: Done
- Blue circle: In Progress
- Yellow circle: Review
- Gray circle: Backlog
- Red border: Task is blocked
- Red lines: Blocking dependencies

### 5. Task Risk Management

Tasks can be flagged with risk levels:
- **Low**: Standard implementation
- **Medium**: Some complexity or unknowns
- **High**: Complex, risky, or security-sensitive
- **Critical**: Payment systems, data security, system-wide impact

**Risk Indicators in UI**:
- Colored badges on task cards
- Risk notes in expanded view
- Risk distribution chart in insights

### 6. Definition of Done (DoD)

Each task can have a checklist of completion criteria:
- Auto-generated based on task type
- Customizable per task
- Examples:
  - Implementation complete
  - Unit tests written and passing
  - Code reviewed and approved
  - UI matches design specifications
  - Merged to main branch

### 7. Test Notes

Guidance for testing each task:
- Auto-generated based on task content
- Covers test scenarios and edge cases
- Examples:
  - "Test UI interactions, verify responsiveness"
  - "Test API endpoints with various inputs"
  - "Verify data integrity, test migrations"

### 8. Project Insights Dashboard

**Location**: `src/components/OrchestrationView.tsx` (Insights view)

Real-time project metrics:
- **Total Tasks**: Current task count
- **Completion Rate**: Percentage of done tasks
- **High Priority**: Urgent tasks needing attention
- **High Risk**: Tasks requiring careful handling
- **Agent Workload**: Visual workload distribution
- **Risk Distribution**: Breakdown by risk level

## Database Schema

### New Tables

#### `epics`
```sql
- id (uuid)
- epic_id (text) - Display ID like "EPIC-1"
- title, description
- status (planning/in-progress/review/done/cancelled)
- sprint, priority, tags
- definition_of_done (text[])
- risk_level, risk_notes
- timestamps
```

#### `task_dependencies`
```sql
- id (uuid)
- task_id (uuid) - Reference to task
- depends_on_task_id (uuid) - Reference to blocking task
- dependency_type (blocks/blocked-by/related-to)
- created_at
```

#### `agent_skills`
```sql
- id (uuid)
- agent_id (uuid)
- skill_name (text)
- skill_level (1-5)
- timestamps
```

#### `agent_performance`
```sql
- id (uuid)
- agent_id (uuid)
- task_id (uuid)
- completion_time_hours (numeric)
- quality_score (1-5)
- on_time (boolean)
- notes (text)
- created_at
```

### Extended Task Fields
```sql
- definition_of_done (text[])
- test_notes (text)
- risk_level (low/medium/high/critical)
- risk_notes (text)
- parent_epic_id (uuid)
- parent_task_id (uuid) - For subtasks
- task_type (epic/story/subtask)
- estimated_hours (numeric)
- actual_hours (numeric)
```

## API Integration Points

The system is designed to integrate with AI services for enhanced breakdown:

```typescript
// Future: Replace parseInputToBreakdown with AI API call
async function breakdownTask(input: ParsedInput): Promise<BreakdownResult> {
  // Current: Rule-based parsing
  // Future: Call OpenAI/Anthropic API for intelligent parsing
  const response = await fetch('/api/ai/breakdown', {
    method: 'POST',
    body: JSON.stringify({ content: input.content })
  });
  return response.json();
}
```

## Usage Examples

### Example 1: Breaking Down a Feature

**Input**:
```
# Epic: User Authentication

## Feature: Login System
- Implement login form with email/password
- Add password reset functionality
- Integrate OAuth providers (Google, GitHub)
- Set up session management

## Feature: User Profile
- Create profile page
- Add avatar upload
- Implement profile editing
```

**Output**:
- 2 Epics: "User Authentication", "User Profile"
- 6 Stories with DoD, test notes, and risk levels
- Estimated hours for each task
- Auto-tagged (frontend, backend, api, security)
- Auto-prioritized based on keywords

### Example 2: Auto-Assignment

**Scenario**: 5 unassigned tasks
- Frontend UI task (React)
- Backend API (Node.js)
- Database migration (PostgreSQL)
- Mobile app feature (React Native)
- DevOps deployment (Docker)

**Result**:
- Alex Chen (Frontend specialist) → React UI task
- Sarah Johnson (Backend specialist) → Node.js API
- Sarah Johnson → PostgreSQL migration (best skill match)
- David Kim (Mobile specialist) → React Native feature
- Emma Wilson (DevOps) → Docker deployment

Algorithm considers:
- Alex has React skill level 5, low workload
- Sarah has both Node.js and PostgreSQL skills
- David is mobile expert
- Emma handles infrastructure

## Best Practices

1. **Use AI Breakdown for Complex Features**: Save time on task creation
2. **Keep Agent Skills Updated**: Better auto-assignment accuracy
3. **Define Dependencies Early**: Prevent blocking issues
4. **Review Risk Flags**: Allocate appropriate resources
5. **Track Performance**: Use metrics to improve estimates
6. **Monitor Workload**: Balance team capacity
7. **Update DoD**: Keep completion criteria relevant

## Future Enhancements

- [ ] Real AI integration (OpenAI/Anthropic) for breakdown
- [ ] Screenshot parsing for UI mockups
- [ ] Gantt chart visualization
- [ ] Time tracking integration
- [ ] Sprint planning automation
- [ ] Velocity tracking and burndown charts
- [ ] Agent availability scheduling
- [ ] Multi-team support
- [ ] Export to JIRA/Linear/GitHub Issues

## Technical Notes

### Performance Considerations
- Dependency graph limited to 100 nodes for performance
- Auto-assignment runs on client-side (consider server-side for large teams)
- Skills and performance cached in agent objects

### State Management
- Tasks, agents, dependencies stored in Supabase
- Real-time updates via Supabase subscriptions (future)
- Local state in React components

### Extensibility
- Add new skill categories in `extractRequiredSkills()`
- Customize DoD templates in `generateDoD()`
- Adjust scoring weights in `recommendAgentForTask()`

## Testing

Since no automated tests exist, manual testing checklist:

- [ ] Create tasks via AI breakdown
- [ ] Verify DoD, test notes, risk flags appear
- [ ] Add skills to agents
- [ ] Test auto-assignment with various task types
- [ ] View dependency graph with dependencies
- [ ] Check insights dashboard calculations
- [ ] Test risk level indicators
- [ ] Verify workload tracking accuracy
- [ ] Test with multiple agents and tasks
- [ ] Check dark mode compatibility

## Database Migration

Run the updated schema in Supabase SQL Editor:

```bash
# The schema is idempotent and safe to run multiple times
# Located in: database/schema.sql
```

The migration includes:
- New tables (epics, task_dependencies, agent_skills, agent_performance)
- Extended task fields
- Indexes for performance
- Default agent skills population
- RLS policies for all tables

## Support

For issues or questions:
1. Check the inline code comments
2. Review type definitions in `src/types/`
3. Examine example data in default agents
4. Test with simple scenarios first

---

**Implemented for Issue #8**: Automated Task Breakdown and Agent Orchestration
**Version**: 1.0
**Date**: 2026-02-25
