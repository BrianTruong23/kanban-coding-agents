# Implementation Guide: Automated Task Breakdown and Agent Orchestration

This guide explains the implementation of GitHub Issue #8: Automated Task Breakdown and Agent Orchestration system.

## Overview

The system provides:
1. **Automated Task Breakdown**: Convert issues/PRDs/screenshots into structured epics, tickets, and subtasks
2. **Agent Roster Management**: Manage coding agents with skills, availability, and performance tracking
3. **Auto-Assignment**: Intelligently assign tasks to agents based on skills and performance
4. **Dependency Visualization**: Visual graph showing task dependencies

## Architecture

### Components

#### 1. Task Breakdown UI (`src/components/TaskBreakdownUI.tsx`)
- Input interface for issues, PRDs, screenshots, or free text
- Automated parsing and breakdown into hierarchical tasks
- Summary cards showing epics, tickets, subtasks counts
- Expandable tree view of task hierarchy
- Integration with dependency graph

#### 2. Agent Roster Manager (`src/components/AgentRosterManager.tsx`)
- Grid and table views of agents
- Skills, availability, and performance metrics display
- Agent add/edit/remove functionality
- Workload summary and capacity tracking

#### 3. Dependency Graph (`src/components/DependencyGraph.tsx`)
- SVG-based interactive graph visualization
- Force-directed layout algorithm for optimal positioning
- Click interactions to highlight connected tasks
- Color-coded nodes by task type (epic, ticket, subtask)
- Different edge styles for dependency types (blocks, relates_to, etc.)

#### 4. PM Dashboard (`src/components/PMDashboard.tsx`)
- High-level overview of project status
- Agent utilization metrics
- Task breakdown statistics
- Budget and timeline tracking

### Services

#### 1. Task Breakdown Service (`src/services/taskBreakdownService.ts`)
Handles automated task breakdown with:
- **Input parsing**: Extract themes, requirements, technical notes, and risks
- **Epic generation**: Create high-level epics from themes
- **Ticket creation**: Break epics into actionable tickets
- **Subtask generation**: Further decompose tickets into granular subtasks
- **DoD generation**: Auto-generate Definition of Done criteria
- **Test notes**: Create test plan templates
- **Risk detection**: Identify and flag potential risks
- **Dependency detection**: Auto-detect task dependencies based on keywords

Configuration options:
```typescript
{
  maxEpics: 5,
  maxTicketsPerEpic: 10,
  maxSubtasksPerTicket: 8,
  includeTestNotes: true,
  includeRiskFlags: true,
  includeDependencies: true,
  estimationUnit: 'story_points' | 'hours',
  defaultPriority: 1-5
}
```

#### 2. Agent Orchestration Service (`src/services/agentOrchestrationService.ts`)
Intelligent agent assignment with scoring algorithm:

**Scoring Factors (100 points total):**
- **Skills (40%)**: Required and preferred skill matching
- **Availability (20%)**: Status, capacity, concurrent task count
- **Performance (25%)**: Success rate, quality score, on-time delivery
- **Preferences (15%)**: Task type, complexity, effort fit

**Auto-assignment algorithm:**
1. Filter available agents (exclude offline/on-leave)
2. Calculate composite score for each agent
3. Rank by score
4. Return best match with confidence score and alternatives
5. Provide reasoning for selection

**Bulk assignment:**
- Process multiple tickets simultaneously
- Balance workload across agents
- Prioritize high-priority tickets
- Update agent capacity as assignments are made

### Types

#### Agent Types (`src/types/agent.ts`)
```typescript
interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  email?: string;
  role?: string;
  team?: string;
  skills: AgentSkill[];
  availability: AgentAvailability;
  performance: AgentPerformance;
  preferences?: AgentPreferences;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
}
```

**Skill Categories:**
- Frontend, Backend, Database, DevOps
- Testing, Design, Security, Performance
- Documentation, Architecture, Mobile, ML/AI

#### Task Breakdown Types (`src/types/taskBreakdown.ts`)
```typescript
interface Epic {
  id: string;
  epicId: string; // "EPIC-1"
  title: string;
  description: string;
  goals: string[];
  status: 'planning' | 'in-progress' | 'review' | 'done' | 'cancelled';
  priority: 1-5;
  sprint?: string;
  estimatedEffort?: number;
  actualEffort?: number;
  tags: string[];
  definitionsOfDone: DefinitionOfDone[];
  riskFlags: RiskFlag[];
  // ... timestamps
}

interface Ticket {
  // Similar to Epic plus:
  epicId?: string;
  type: 'feature' | 'bug' | 'improvement' | 'task' | 'research';
  assignedAgentId?: string;
  testNotes: TestNote[];
  acceptanceCriteria: string[];
  technicalNotes?: string;
}

interface Subtask {
  // Simpler structure:
  ticketId: string;
  assignedAgentId?: string;
  status: 'todo' | 'in-progress' | 'done';
  testNotes: TestNote[];
}
```

### Database Schema

#### Agents Table (Extended)
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  avatar_color TEXT,
  email TEXT,
  role TEXT,
  team TEXT,
  skills JSONB DEFAULT '[]',
  availability JSONB DEFAULT '{"status":"available","currentCapacity":100,...}',
  performance JSONB DEFAULT '{"tasksCompleted":0,"successRate":0,...}',
  preferences JSONB DEFAULT '{"preferredTaskTypes":[],...}',
  tags TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Task Breakdown Tables
```sql
-- Epics: High-level initiatives
CREATE TABLE epics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  epic_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goals TEXT[],
  status TEXT CHECK (status IN ('planning','in-progress','review','done','cancelled')),
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  sprint TEXT,
  estimated_effort INTEGER,
  actual_effort INTEGER,
  tags TEXT[],
  definitions_of_done JSONB,
  risk_flags JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  start_date TIMESTAMP,
  target_date TIMESTAMP,
  completed_at TIMESTAMP
);

-- Tickets: Actionable work items
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ticket_id TEXT NOT NULL,
  epic_id UUID REFERENCES epics(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('feature','bug','improvement','task','research')),
  status TEXT CHECK (status IN ('backlog','in-progress','review','done','blocked')),
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  sprint TEXT,
  assigned_agent_id UUID REFERENCES agents(id),
  estimated_effort INTEGER,
  actual_effort INTEGER,
  tags TEXT[],
  definitions_of_done JSONB,
  test_notes JSONB,
  risk_flags JSONB,
  acceptance_criteria TEXT[],
  technical_notes TEXT,
  -- timestamps...
);

-- Subtasks: Granular task breakdown
CREATE TABLE subtasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subtask_id TEXT NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo','in-progress','done')),
  assigned_agent_id UUID REFERENCES agents(id),
  estimated_effort INTEGER,
  actual_effort INTEGER,
  test_notes JSONB,
  -- timestamps...
);

-- Task Dependencies
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  source_task_id UUID NOT NULL,
  target_task_id UUID NOT NULL,
  dependency_type TEXT CHECK (dependency_type IN ('blocks','blocked_by','relates_to','duplicates')),
  created_at TIMESTAMP,
  UNIQUE(source_task_id, target_task_id, dependency_type)
);
```

## Usage

### 1. Automated Task Breakdown

Navigate to `/breakdown` page:

1. Select input type: Issue, PRD, Screenshot, or Text
2. Paste content (issue description, PRD document, etc.)
3. Click "Generate Task Breakdown"
4. Review generated epics, tickets, and subtasks
5. View dependency graph (optional)
6. Save to Kanban board

**Example Input:**
```
Feature: User Authentication System

Implement a complete authentication system with login, signup,
password reset, and OAuth integration.

Requirements:
- Email/password authentication
- Social login (Google, GitHub)
- Password reset via email
- JWT token management
- Protected routes
- User profile management

Technical Notes:
- Use Supabase Auth
- Implement middleware for route protection
- Store sessions securely

Risks:
- OAuth integration may have rate limits
- Security vulnerabilities if not implemented correctly
```

**Generated Output:**
- Epic: "User Authentication System Implementation"
  - Ticket 1: "Email/password authentication" (Feature)
    - Subtask 1: Setup and preparation
    - Subtask 2: Core implementation
    - Subtask 3: Error handling
    - Subtask 4: Unit tests
  - Ticket 2: "Social login integration" (Feature)
  - Ticket 3: "Password reset flow" (Feature)
  - Ticket 4: "JWT token management" (Task)

### 2. Agent Roster Management

Navigate to `/agents` page:

**View Modes:**
- **Grid View**: Card-based layout with agent avatars and key metrics
- **Table View**: Detailed tabular view with all agent information

**Agent Information:**
- Skills with proficiency levels (1-5)
- Availability status and capacity
- Performance metrics (success rate, quality score, on-time delivery)
- Current workload and task counts

**Actions:**
- Add new agents with skills and preferences
- Edit agent details, skills, availability
- Remove agents from roster
- View performance history

### 3. Auto-Assignment

Agents are automatically assigned based on:

1. **Required Skills**: Must have all required skills at minimum proficiency
2. **Availability**: Currently available and has capacity
3. **Performance**: Track record of success and quality
4. **Preferences**: Matches task type and complexity preferences

**Assignment Result:**
```typescript
{
  agentId: "agent-123",
  confidence: 0.85,
  reasons: [
    "Matches all required skills",
    "Currently available",
    "High skill proficiency",
    "Excellent success rate (95%+)"
  ],
  alternatives: [
    { agentId: "agent-456", confidence: 0.72 },
    { agentId: "agent-789", confidence: 0.68 }
  ]
}
```

### 4. Dependency Visualization

The dependency graph provides:
- **Visual representation** of task relationships
- **Interactive exploration** (click to highlight connections)
- **Color coding** by task type
- **Edge styles** indicating dependency types
- **Force-directed layout** for optimal positioning

**Legend:**
- Purple nodes: Epics
- Blue nodes: Tickets
- Green nodes: Subtasks
- Red arrows: Blocks
- Dashed lines: Related to

## Database Migrations

Run these SQL migrations in order:

1. `database/migrations/002_add_agent_extended_fields.sql`
   - Adds JSONB columns for skills, availability, performance, preferences
   - Adds email, role, team, tags fields
   - Creates indexes for JSONB fields

2. `database/migrations/003_create_task_breakdown_tables.sql`
   - Creates epics, tickets, subtasks tables
   - Creates task_dependencies table
   - Sets up RLS policies for all tables

## Future Enhancements

1. **AI Integration**: Use actual LLM (OpenAI, Anthropic) for smarter task breakdown
2. **Real-time Collaboration**: Multiple PMs working on same breakdown
3. **Historical Analysis**: Learn from past assignments to improve scoring
4. **Skills Marketplace**: Agents can propose skill development based on task needs
5. **Automated Testing**: Generate test cases from acceptance criteria
6. **Burndown Charts**: Track epic/ticket progress over time
7. **Agent Performance Dashboard**: Detailed analytics per agent
8. **Custom Workflows**: Configurable task statuses and transitions

## Testing

### Unit Tests (TODO)
- `taskBreakdownService.test.ts`: Test parsing, epic/ticket/subtask generation
- `agentOrchestrationService.test.ts`: Test scoring algorithm, assignment logic

### Integration Tests (TODO)
- Test full breakdown flow from input to saved tasks
- Test agent assignment with various criteria
- Test dependency detection accuracy

### E2E Tests (TODO)
- Navigate through task breakdown flow
- Create and manage agents
- Visualize dependency graph

## Performance Considerations

1. **Lazy Loading**: Load dependency graph only when requested
2. **Caching**: Cache agent skills and availability in memory
3. **Batch Operations**: Use bulk assignment for multiple tickets
4. **Indexed Queries**: JSONB fields are indexed with GIN indexes
5. **Memoization**: Agent scoring results cached during bulk operations

## Security

1. **Row Level Security**: All tables use RLS to ensure users only access their data
2. **Input Sanitization**: All user inputs sanitized before processing
3. **JSONB Validation**: Schema validation for JSONB fields
4. **API Rate Limiting**: Prevent abuse of breakdown service (when AI integrated)

## Deployment

1. Run database migrations in Supabase SQL editor
2. Deploy Next.js app to Vercel/similar
3. Configure environment variables (Supabase URL, keys)
4. Test task breakdown with sample inputs
5. Verify agent roster management
6. Test auto-assignment with different scenarios

## Support

For issues or questions:
- Check this implementation guide
- Review component documentation in code
- Check GitHub Issues for known problems
- Create new issue if needed
