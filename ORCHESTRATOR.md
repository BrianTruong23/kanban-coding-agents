# Task Breakdown & Agent Orchestration System

## Overview

The Task Breakdown & Agent Orchestration system is an AI-powered feature that automatically analyzes issues, PRDs, or feature descriptions and breaks them down into structured epics, stories, tasks, and subtasks. It includes intelligent agent assignment based on skills, performance metrics, and workload, as well as dependency visualization.

## Features

### 1. Automated Task Breakdown

The system can analyze various inputs and automatically generate structured work items:

- **Input Types Supported:**
  - GitHub Issues
  - Product Requirements Documents (PRDs)
  - Screenshot descriptions
  - Free-form text descriptions

- **Output Structure:**
  - **Epics**: Large features or initiatives
  - **Stories**: User stories within epics
  - **Tasks**: Individual work items with detailed metadata
  - **Subtasks**: Smaller units of work within tasks

### 2. Intelligent Task Analysis

Each generated task includes:

- **Definition of Done (DoD)**: Clear acceptance criteria
- **Test Notes**: Testing guidelines and edge cases
- **Risk Flags**: Automatic risk assessment (low, medium, high, critical)
- **Estimated Hours**: Time estimates for each task
- **Required Skills**: Skills needed to complete the task
- **Priority**: 1-5 priority scale
- **Tags**: Categorization tags (frontend, backend, testing, etc.)

### 3. Dependency Management

- **Automatic Dependency Detection**: Identifies logical dependencies between tasks
- **Dependency Types**:
  - `blocks`: Task A must be completed before Task B
  - `relates-to`: Tasks are related but not blocking
  - `required-by`: Task A is required by Task B
- **Visual Dependency Graph**: Interactive canvas-based visualization
- **Circular Dependency Detection**: Warns about circular dependencies

### 4. Agent Roster Management

Comprehensive agent management system:

- **Agent Profiles**:
  - Name and description
  - Specializations (frontend, backend, database, devops, mobile, testing, design, security, AI/ML)
  - Skills with proficiency levels (1-5)
  - Availability status (available, busy, offline)
  - Current workload

- **Performance Metrics**:
  - Tasks completed
  - Success rate (%)
  - Average completion time
  - Quality score (1-5)
  - Velocity (tasks per week)

### 5. Auto-Assignment Algorithm

Smart task assignment based on multiple factors:

- **Skill Matching (40% weight)**:
  - Matches required skills with agent expertise
  - Considers skill proficiency levels
  - Falls back to specializations if no detailed skills

- **Performance Matching (25% weight)**:
  - Success rate history
  - Quality scores
  - Velocity trends

- **Availability Matching (15% weight)**:
  - Available agents get priority
  - Busy agents are still considered
  - Offline agents are excluded

- **Workload Matching (20% weight)**:
  - Balances workload across agents
  - Prevents overloading specific agents

- **Assignment Confidence**: Provides confidence score (0-100%) for each recommendation

### 6. Batch Assignment

- Automatically assigns all tasks in a breakdown
- Prioritizes high-priority tasks first
- Balances workload across the team
- Updates agent workloads in real-time

## How It Works

### 1. Access the Orchestrator

Click the "AI Orchestrator" button in the main kanban board header.

### 2. Provide Input

1. Select input type (Text, GitHub Issue, PRD, or Screenshot)
2. Enter or paste your content
3. Optionally add context (e.g., tech stack, constraints)
4. Click "Break Down Into Tasks"

### 3. Review Breakdown

The system will generate:
- Summary statistics (epics, stories, tasks, estimated hours)
- Hierarchical task tree (expandable epics and stories)
- Dependency graph visualization
- Auto-assignment recommendations

### 4. Create Tasks

Click "Create Tasks" to add all generated tasks to your kanban board with:
- Pre-assigned agents
- Proper dependencies
- Complete metadata
- Risk flags

## Architecture

### Core Components

1. **TaskBreakdownService** (`src/lib/taskBreakdown.ts`)
   - Analyzes input content
   - Detects complexity and scope
   - Generates structured breakdown
   - Identifies dependencies

2. **AgentAssignmentService** (`src/lib/agentAssignment.ts`)
   - Scores agents for tasks
   - Performs batch assignment
   - Calculates utilization stats
   - Provides recommendations with reasoning

3. **DependencyGraph** (`src/components/DependencyGraph.tsx`)
   - Canvas-based visualization
   - Interactive task selection
   - Circular dependency detection
   - Risk-based color coding

4. **AgentRoster** (`src/components/AgentRoster.tsx`)
   - Agent CRUD operations
   - Performance metrics display
   - Skill and specialization management

5. **TaskBreakdownOrchestrator** (`src/components/TaskBreakdownOrchestrator.tsx`)
   - Main orchestration UI
   - Input handling
   - Result display
   - Integration point

### Data Flow

```
Input (Issue/PRD/Text)
  ↓
TaskBreakdownService.analyzeAndBreakdown()
  ↓
Generate: Epics → Stories → Tasks
  ↓
Identify Dependencies
  ↓
AgentAssignmentService.batchAssign()
  ↓
Score each agent for each task
  ↓
Assign based on best match
  ↓
Display Results + Graph
  ↓
User confirms → Create tasks in DB
```

## Database Schema

### New Tables

1. **epics**
   - id, user_id, title, description
   - acceptance_criteria (array)
   - created_at, updated_at

2. **stories**
   - id, user_id, epic_id
   - title, description
   - acceptance_criteria (array)
   - created_at, updated_at

3. **task_dependencies**
   - id, user_id
   - task_id, depends_on_task_id
   - dependency_type
   - created_at

### Extended Columns

**tasks table**:
- story_id, epic_id
- task_type (epic, story, task, subtask)
- estimated_hours
- definition_of_done (JSONB)
- risk_level, risk_description
- required_skills (array)

**agents table**:
- skills (JSONB)
- specializations (array)
- total_experience
- preferred_task_types (array)
- availability
- workload
- performance_metrics (JSONB)
- updated_at

### Views

1. **task_breakdown_summary**: Aggregated breakdown stats per user
2. **agent_utilization**: Current utilization and performance metrics

## Usage Examples

### Example 1: Breaking Down a Feature

**Input:**
```
Implement User Authentication

We need to add authentication to the app with:
- Login with email/password
- Signup form
- Password reset via email
- JWT token management
- Protected routes
```

**Output:**
- 1 Epic: "User Authentication System"
- 3 Stories:
  - Backend API Development
  - Frontend UI Development
  - Testing & Quality Assurance
- 9 Tasks covering API, database, UI, state management, testing
- 6 Dependencies identified
- Auto-assigned to 3 agents based on skills

### Example 2: Agent Assignment

**Task:** "Implement REST API endpoints"
**Required Skills:** Node.js, API Design, TypeScript

**Agent Matching:**
- Alex (Frontend specialist): 45% match
- Sarah (Backend specialist): 92% match ✓
- Mike (Full-stack): 78% match

**Result:** Assigned to Sarah with 95% confidence

## Best Practices

### For Better Breakdown Results

1. **Be Specific**: Provide detailed descriptions with clear requirements
2. **Add Context**: Mention tech stack, constraints, and dependencies
3. **Use Structure**: Well-formatted input (headings, lists) helps analysis
4. **Include Acceptance Criteria**: Helps generate better DoD

### For Agent Management

1. **Keep Skills Updated**: Regularly update agent skills and specializations
2. **Track Performance**: Review and update performance metrics periodically
3. **Balance Workload**: Don't over-assign to single agents
4. **Set Availability**: Mark agents as busy/offline when appropriate

### For Dependency Management

1. **Review Auto-Generated Dependencies**: Verify they make sense
2. **Watch for Circular Dependencies**: Fix immediately if detected
3. **Use Dependency Types Correctly**:
   - `blocks` for hard dependencies
   - `relates-to` for soft relationships

## Limitations & Future Enhancements

### Current Limitations

- Rule-based breakdown (not AI/ML powered yet)
- Limited to predefined patterns
- No learning from historical data
- No real-time collaboration

### Planned Enhancements

- Integration with OpenAI/Claude for true AI breakdown
- Screenshot analysis using vision models
- Learning from historical task patterns
- Real-time collaboration features
- Gantt chart view
- Resource allocation optimization
- Time tracking integration
- Sprint planning automation

## Technical Details

### Skill Matching Algorithm

```typescript
skillMatch = (matchCount / requiredSkills.length) * 80
           + (avgSkillLevel / 5) * 20

Final score: 0-100
```

### Assignment Score Calculation

```typescript
totalScore = (skillMatch * 0.4)
           + (performanceMatch * 0.25)
           + (availabilityMatch * 0.15)
           + (workloadMatch * 0.2)
```

### Dependency Detection Rules

1. Database tasks → block → API tasks
2. API tasks → block → Frontend tasks
3. Implementation → block → Testing tasks
4. All tasks → block → Integration tasks

## Troubleshooting

### Issue: No tasks generated

- **Cause**: Input too vague or short
- **Solution**: Provide more detailed description

### Issue: Poor agent assignments

- **Cause**: Agents missing skill/specialization data
- **Solution**: Update agent profiles with skills

### Issue: Too many dependencies

- **Cause**: Complex feature breakdown
- **Solution**: Review and manually adjust dependencies

### Issue: Circular dependency warning

- **Cause**: Invalid dependency chain
- **Solution**: Review task order and fix dependencies

## API Reference

### TaskBreakdownService

```typescript
analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult>
```

### AgentAssignmentService

```typescript
getRecommendation(task: TaskBreakdown, agents: CodingAgent[]): AssignmentRecommendation
batchAssign(tasks: TaskBreakdown[], agents: CodingAgent[]): Map<string, string>
getUtilizationStats(agents: CodingAgent[]): UtilizationStats[]
```

## Contributing

To extend the orchestrator:

1. Add new task patterns in `TaskBreakdownService`
2. Implement new assignment strategies in `AgentAssignmentService`
3. Enhance the dependency detection algorithm
4. Add new visualization components

## License

MIT
