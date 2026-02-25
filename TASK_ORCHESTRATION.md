# Automated Task Breakdown and Agent Orchestration

This document describes the automated task breakdown and agent orchestration system implemented for Issue #8.

## Overview

The system provides intelligent task management capabilities including:

1. **AI-Powered Task Breakdown** - Automatically break down issues, PRDs, or screenshots into epics, tickets, and subtasks
2. **Agent Skills & Performance Tracking** - Track agent expertise and performance metrics
3. **Auto-Assignment** - Intelligently assign tasks to the best-suited agents
4. **Dependency Visualization** - Visual graph of task dependencies
5. **Risk Management** - Identify and track risks for each task

## Architecture

### Core Components

#### 1. Type Definitions

**`src/types/breakdown.ts`**
- `TaskBreakdown` - Extended task metadata with epics, tickets, subtasks
- `Risk` - Risk tracking with severity levels
- `Dependency` - Task dependencies (blocks, depends-on, related-to)
- `DefinitionOfDone` - Acceptance criteria checklist
- `TestNote` - Testing requirements

**`src/types/agent-extended.ts`**
- `AgentSkill` - Skills with proficiency levels (1-5)
- `AgentPerformanceMetrics` - Track completion rate, success rate, avg time
- `AgentAvailability` - Current workload and capacity
- `AutoAssignmentScore` - Algorithm scoring for agent assignment

#### 2. Database Schema

**New Tables:**
- `task_breakdowns` - Hierarchical task structure (epic -> ticket -> subtask)
- `risks` - Risk tracking per task
- `dependencies` - Task dependency relationships
- `definition_of_done` - Acceptance criteria items
- `test_notes` - Testing requirements per task
- `agent_skills` - Agent expertise areas
- `agent_performance` - Performance metrics per agent
- `agent_availability` - Current workload tracking

All tables include:
- Row Level Security (RLS) policies
- User-based data isolation
- Proper indexes for performance
- Auto-updated timestamps

#### 3. Task Breakdown Service

**`src/lib/taskBreakdown.ts`**

The breakdown service analyzes input text and automatically generates:

**Input Types:**
- GitHub Issues
- Product Requirements Documents (PRDs)
- Screenshots (with OCR parsing)

**Analysis Capabilities:**
- Keyword extraction
- Complexity assessment
- Feature detection (auth, API, UI, database, testing)
- Epic generation based on detected features

**Output Structure:**
```typescript
{
  epics: [
    {
      title: "Epic Name",
      description: "Epic description",
      tickets: [
        {
          title: "Ticket title",
          description: "Detailed description",
          priority: 1-5,
          estimatedHours: number,
          tags: string[],
          subtasks: [...],
          definitionOfDone: [...],
          testNotes: [...],
          risks: [...]
        }
      ]
    }
  ],
  dependencies: [...]
}
```

**Pre-built Epic Templates:**
- Authentication System (login, session management, security)
- API Development (schema design, CRUD endpoints, authentication)
- UI Development (design system, components, pages)
- Database Setup (schema design, migrations, data access layer)
- Testing & QA (test setup, unit tests, E2E tests)

#### 4. Agent Auto-Assignment

**`src/lib/agentAssignment.ts`**

Intelligent agent assignment based on multiple factors:

**Scoring Algorithm:**
```typescript
totalScore =
  skillMatch * 0.4 +           // 40% weight
  availabilityScore * 0.3 +     // 30% weight
  performanceScore * 0.2 +      // 20% weight
  workloadScore * 0.1           // 10% weight
```

**Skill Matching:**
- Extracts skill requirements from task title, description, and tags
- Matches against agent skill categories and proficiency levels
- Supports 8 skill categories: frontend, backend, database, devops, testing, mobile, ui-ux, api-design

**Availability Scoring:**
- Checks if agent is available
- Calculates capacity ratio (current tasks / max concurrent tasks)
- Returns 0 if at max capacity

**Performance Scoring:**
- Success rate (70% weight)
- Time efficiency - estimated vs actual hours (30% weight)

**Workload Scoring:**
- Inverse of current workload
- Prefers agents with lower current task count

**Priority Boosting:**
- High-priority tasks (P4-P5) with good skill match get 10% score boost

**API:**
```typescript
// Get all agents ranked by suitability
autoAssignAgent(task, agents): AutoAssignmentScore[]

// Get the single best agent
getBestAgent(task, agents): { agent, score }

// Get top N recommendations
getRecommendedAgents(task, agents, limit): Array<{ agent, score }>

// Check if agent can take more tasks
canAssignTask(agent): boolean
```

#### 5. UI Components

**Task Breakdown Modal (`src/components/TaskBreakdownModal.tsx`)**
- Input type selector (Issue / PRD / Screenshot)
- Title and content input
- AI processing with loading state
- Epic/ticket selection with checkboxes
- Risk highlighting with color coding
- Bulk task creation

**Dependency Graph (`src/components/DependencyGraph.tsx`)**
- Canvas-based graph visualization
- Hierarchical layout using topological sort
- Interactive node selection
- Multiple dependency types:
  - **Blocks** (red, solid) - Critical path
  - **Depends-on** (gray, solid) - Standard dependency
  - **Related-to** (gray, dashed) - Loose relationship
- List view alternative
- Legend and status indicators

**Agent Roster Panel (`src/components/AgentRosterPanel.tsx`)**
- Grid view of all agents
- Agent cards with quick stats
- Detailed agent view with:
  - Performance metrics dashboard
  - Skills with proficiency bars
  - Current workload visualization
  - Availability status
- Mock data generation for demo purposes

#### 6. Main Page Integration

**Tab Navigation:**
- Kanban Board (existing)
- Dependencies (new)
- Agent Roster (new)

**Quick Actions:**
- "AI Breakdown" button in header for easy access

## Usage

### 1. Breaking Down a Task

1. Click "AI Breakdown" button in the header
2. Select input type (Issue/PRD/Screenshot)
3. Enter title and description
4. Click "Break Down Tasks"
5. Review generated epics and tickets
6. Select which tickets to create (checkbox selection)
7. Click "Create N Task(s)"

**Example Input:**
```
Title: User Authentication System
Description: Implement a complete authentication system with
login, signup, password reset, and session management. Should
support OAuth providers and include security best practices.
```

**Generated Output:**
- Epic: Authentication System
  - Ticket: Setup Authentication Provider
  - Ticket: Build Login Page
  - Ticket: Implement Session Management
  - Ticket: Add OAuth Integration
- Each ticket includes:
  - 2-4 subtasks
  - Definition of done checklist
  - Test notes
  - Risk assessment

### 2. Viewing Dependencies

1. Click "Dependencies" tab
2. View graph visualization of task relationships
3. Click nodes to highlight dependencies
4. Switch to list view for detailed breakdown
5. Use legend to understand relationship types

### 3. Managing Agent Roster

1. Click "Agent Roster" tab
2. View all agents with quick stats
3. Click an agent card for detailed view
4. Review:
   - Performance metrics (tasks completed, success rate, avg time)
   - Skills and proficiency levels
   - Current workload
   - Availability status

### 4. Auto-Assigning Tasks

Currently implemented as a service that can be integrated:

```typescript
import { autoAssignAgent, getBestAgent } from '@/lib/agentAssignment';

// Get best agent for a task
const result = getBestAgent(task, agentsWithMetrics);
if (result) {
  console.log(`Best agent: ${result.agent.name}`);
  console.log(`Score: ${result.score.score}`);
  console.log(`Reasons: ${result.score.reasons.join(', ')}`);
}

// Get top 3 recommendations
const recommendations = getRecommendedAgents(task, agentsWithMetrics, 3);
```

## Database Migration

Run the updated schema to add all new tables:

```bash
# Execute the SQL in your Supabase SQL Editor
psql -U postgres -d your_database -f database/schema.sql
```

Or in Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `database/schema.sql`
3. Run the script

The migrations are idempotent and safe to run multiple times.

## Configuration

### Skill Categories

Defined in `src/types/agent-extended.ts`:
- frontend
- backend
- database
- devops
- testing
- mobile
- ui-ux
- api-design

Add new categories by:
1. Updating the type definition
2. Adding to the skill extraction logic in `agentAssignment.ts`
3. Updating the database constraint

### Priority Levels

Task priorities range from 1-5:
- 1: Low
- 2: Medium-Low
- 3: Medium (default)
- 4: High
- 5: Critical

### Risk Levels

- low (green)
- medium (yellow)
- high (orange)
- critical (red)

## Future Enhancements

### Phase 1 (Completed ✅)
- [x] Task breakdown service
- [x] Agent skills tracking
- [x] Auto-assignment algorithm
- [x] Dependency visualization
- [x] UI components

### Phase 2 (Recommended)
- [ ] Actual LLM integration (OpenAI, Anthropic, etc.)
- [ ] Real-time dependency updates
- [ ] Agent performance tracking from actual task completion
- [ ] Bulk operations (assign multiple tasks, create dependencies)
- [ ] Export breakdown as markdown/JSON
- [ ] Import from external tools (Jira, Linear, GitHub Projects)

### Phase 3 (Advanced)
- [ ] Machine learning for better agent assignment
- [ ] Predictive analytics (completion time, bottlenecks)
- [ ] Team capacity planning
- [ ] Sprint planning automation
- [ ] Integration with CI/CD for automated testing
- [ ] Slack/Discord notifications for assignments

## API Integration Points

### Adding LLM Support

Replace the mock implementation in `taskBreakdown.ts`:

```typescript
export async function breakdownTask(request: BreakdownRequest): Promise<BreakdownResponse> {
  // Replace with actual LLM API call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert project manager...'
        },
        {
          role: 'user',
          content: `Break down this ${request.type}: ${request.content}`
        }
      ]
    })
  });

  // Parse and structure the response
  const data = await response.json();
  return parseAIResponse(data);
}
```

### Adding Screenshot OCR

```typescript
export async function parseScreenshot(imageUrl: string): Promise<string> {
  // Use Google Cloud Vision, AWS Rekognition, or similar
  const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
    },
    body: JSON.stringify({
      requests: [{
        image: { source: { imageUri: imageUrl } },
        features: [{ type: 'TEXT_DETECTION' }]
      }]
    })
  });

  const data = await response.json();
  return data.responses[0].textAnnotations[0].description;
}
```

## Testing

Currently no automated tests exist. Manual testing checklist:

### Task Breakdown
- [ ] Create breakdown from issue text
- [ ] Create breakdown from PRD
- [ ] Verify epic/ticket structure
- [ ] Check risk highlighting
- [ ] Test bulk task creation
- [ ] Verify created tasks appear in kanban

### Dependencies
- [ ] View graph with multiple tasks
- [ ] Click nodes to select
- [ ] Switch between graph and list view
- [ ] Verify relationship types display correctly

### Agent Roster
- [ ] View all agents
- [ ] Click agent for details
- [ ] Verify performance metrics display
- [ ] Check skill proficiency bars
- [ ] Review workload visualization

### Auto-Assignment
- [ ] Call API with various task types
- [ ] Verify scoring makes sense
- [ ] Check skill matching works
- [ ] Ensure availability is respected
- [ ] Test with high-priority tasks

## Troubleshooting

### Task Breakdown Not Working
- Check console for errors
- Verify input is not empty
- Ensure complexity detection is working

### Dependencies Not Showing
- Verify tasks exist in database
- Check dependency table has data
- Ensure foreign key relationships are valid

### Agent Metrics Not Loading
- Check if agents exist
- Verify mock data generation
- Ensure agent IDs match tasks

### Performance Issues
- Add database indexes if querying large datasets
- Paginate agent roster if many agents
- Optimize dependency graph for large task counts

## Contributing

When adding new features:

1. Update type definitions first
2. Add database migrations (idempotent)
3. Implement service layer logic
4. Create UI components
5. Update this documentation
6. Add manual test checklist

## License

Same as main project.
