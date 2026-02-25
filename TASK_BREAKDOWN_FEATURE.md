# Task Breakdown and Agent Orchestration System

## Overview

This feature implements an automated task breakdown and agent orchestration system that can analyze requirements (GitHub issues, PRDs, or UI mockups) and automatically break them down into structured epics, tickets, and subtasks with proper metadata, dependencies, and agent assignments.

## Features

### 1. Intelligent Task Breakdown

The system can parse different types of input and generate structured task hierarchies:

- **Input Types:**
  - GitHub Issues / User Stories
  - Product Requirements Documents (PRDs)
  - UI Screenshots / Mockups (with descriptions)

- **Output Structure:**
  - **Epics:** High-level feature groupings
  - **Tickets:** Actionable work items with clear scope
  - **Subtasks:** Granular implementation steps

### 2. Rich Task Metadata

Each task in the hierarchy includes:

- **Definition of Done (DoD):** Clear completion criteria
- **Test Notes:** Testing considerations and requirements
- **Risk Flags:** Automated identification of risks:
  - `high-complexity`: Complex technical implementation
  - `external-dependency`: Depends on external systems/APIs
  - `security`: Security-sensitive changes
  - `performance`: Performance-critical code
  - `data-migration`: Database migrations required
  - `breaking-change`: Breaking API/interface changes
  - `technical-debt`: Technical debt considerations

- **Effort Estimation:** Story points for planning
- **Position/Order:** Proper sequencing within hierarchy

### 3. Dependency Management

- **Dependency Types:**
  - `blocks`: Task A must complete before Task B
  - `related`: Tasks are related but not blocking
  - `duplicate`: Tasks are duplicates

- **Dependency Visualization:**
  - Visual graph showing task relationships
  - Automatic blocking detection
  - Warning indicators for blocked tasks

### 4. Agent Skills Management

Each agent has a skill profile:

- **Skill Categories:**
  - Frontend: React, Next.js, UI/UX, CSS, TypeScript
  - Backend: Node.js, API Design, Database, PostgreSQL
  - DevOps: Docker, CI/CD, AWS, Infrastructure, Monitoring
  - Mobile: React Native, iOS, Android, Mobile UI
  - Other: Security, Performance, etc.

- **Skill Levels:** 1-5 scale (Beginner → Master)

- **Editable Skills:** Users can add/remove/update agent skills

### 5. Intelligent Agent Assignment

The system recommends optimal agent assignments based on:

1. **Skill Matching (50% weight):**
   - Analyzes task requirements by keywords
   - Matches against agent skill profiles
   - Considers skill levels (higher = better)

2. **Availability (30% weight):**
   - Tracks current workload per agent
   - Prefers agents with lower task counts
   - Balances work distribution

3. **Performance History (20% weight):**
   - Average quality scores
   - Average completion time
   - On-time delivery percentage

**Recommendation Features:**
- Score (0-100) indicating assignment confidence
- Matched skills list
- Reasoning for recommendation
- Manual override capability

### 6. Batch Operations

- Create multiple tasks simultaneously
- Bulk agent assignments with load balancing
- Maintains referential integrity across hierarchy

## Database Schema

### New Tables

#### 1. `task_hierarchy`
Stores hierarchical relationships and metadata for tasks.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- task_id: UUID (foreign key to tasks)
- parent_id: UUID (foreign key to task_hierarchy, nullable)
- hierarchy_type: TEXT ('epic' | 'ticket' | 'subtask')
- position: INTEGER (ordering within level)
- definition_of_done: TEXT (completion criteria)
- test_notes: TEXT (testing requirements)
- risk_flags: TEXT[] (array of risk categories)
- estimated_effort: INTEGER (story points/hours)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `task_dependencies`
Tracks dependencies between tasks.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- task_id: UUID (foreign key to tasks)
- depends_on_task_id: UUID (foreign key to tasks)
- dependency_type: TEXT ('blocks' | 'related' | 'duplicate')
- created_at: TIMESTAMP
```

#### 3. `agent_skills`
Stores agent skill profiles.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- agent_id: UUID (foreign key to agents)
- skill_name: TEXT
- skill_level: INTEGER (1-5)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(agent_id, skill_name)
```

#### 4. `agent_performance`
Tracks agent performance metrics.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- agent_id: UUID (foreign key to agents)
- task_id: UUID (foreign key to tasks)
- completion_time_hours: NUMERIC(10, 2)
- quality_score: INTEGER (1-5)
- on_time: BOOLEAN
- notes: TEXT
- created_at: TIMESTAMP
```

### Migrations

The schema includes idempotent migrations that:
- Add new columns safely (IF NOT EXISTS checks)
- Create indexes for performance
- Set up RLS policies for security
- Initialize default agent skills via triggers

## Components

### UI Components

1. **TaskBreakdownInputModal**
   - Multi-type input form (Issue/PRD/Screenshot)
   - Rich text input with examples
   - User-friendly interface

2. **TaskBreakdownModal**
   - Hierarchical task preview
   - Risk flag visualization
   - Definition of Done display
   - Agent assignment interface
   - Approve/Cancel workflow

3. **AgentRosterPanel**
   - Agent skills management
   - Performance metrics display
   - Real-time workload indicators
   - Skill editing interface

4. **DependencyGraph**
   - Visual dependency relationships
   - Blocked task indicators
   - Task status tracking

### Services

1. **task-breakdown.ts**
   - Pattern recognition for common features
   - Generic breakdown generation
   - Risk flag identification
   - Effort estimation

2. **agent-assignment.ts**
   - Skill extraction from task content
   - Multi-factor scoring algorithm
   - Batch assignment optimization
   - Recommendation generation

### Hooks

1. **useTaskBreakdown**
   - Fetch/manage hierarchies
   - Fetch/manage dependencies
   - Bulk task creation with metadata

2. **useAgentSkills**
   - Fetch/manage agent skills
   - Fetch/manage performance data
   - Compute performance metrics
   - Update skill profiles

## Usage

### Creating a Task Breakdown

1. Click the "AI Breakdown" button in the header
2. Select input type (Issue/PRD/Screenshot)
3. Enter title and content
4. Click "Generate Breakdown"
5. Review generated tasks and hierarchy
6. Assign agents (auto-recommendations provided)
7. Click "Approve & Create Tasks"

### Managing Agent Skills

1. Click the "Agents" button to open the roster panel
2. Click the edit icon on an agent card
3. Add/remove skills or adjust skill levels
4. Click save to update

### Viewing Dependencies

Dependencies are shown in task cards and the breakdown preview. Blocked tasks are highlighted with warning indicators.

## Breakdown Patterns

The system includes built-in patterns for common features:

1. **Authentication Systems**
   - Database design
   - Backend API implementation
   - Frontend UI
   - Security testing

2. **Analytics Dashboards**
   - Layout design
   - Backend metrics API
   - Chart components
   - Real-time updates

3. **API Development**
   - Architecture documentation
   - Core endpoints
   - Testing & monitoring

4. **Generic Features**
   - Adaptive breakdown based on content
   - Separates frontend/backend concerns
   - Includes testing phase

## Auto-Assignment Algorithm

```
Total Score = (Skill Match × 0.5) + (Availability × 0.3) + (Performance × 0.2)

Skill Match Score:
- Extracts required skills from task title/description
- Matches against agent skill profiles
- Weights by skill level (1-5 → 20-100 points)
- Averages match percentage and skill levels

Availability Score:
- 0 tasks: 100 points
- 1 task: 80 points
- 2 tasks: 60 points
- 3+ tasks: decreasing

Performance Score:
- Quality score (1-5 scale)
- Completion time vs baseline
- On-time delivery percentage
```

Assignments are only made automatically if confidence score ≥ 70%.

## Future Enhancements

Potential improvements for future iterations:

1. **Enhanced AI Integration**
   - Integration with OpenAI/Claude for smarter breakdown
   - Screenshot OCR and analysis
   - Natural language requirement parsing

2. **Advanced Visualizations**
   - Interactive dependency graph with D3.js
   - Gantt chart for timeline planning
   - Burndown charts for sprints

3. **Collaboration Features**
   - Real-time updates via WebSockets
   - Task comments and mentions
   - Activity feed

4. **Performance Tracking**
   - Automatic time tracking
   - Quality scoring workflows
   - Team velocity metrics

5. **Template System**
   - Save custom breakdown patterns
   - Organization-level templates
   - Import/export capabilities

## Technical Notes

- All database operations use Supabase RLS for security
- Task creation is atomic (all-or-nothing)
- ID mapping handles temporary IDs during bulk creation
- Agent skills are initialized via database triggers
- All timestamps use UTC timezone
- Frontend uses React hooks for state management
- Components use Tailwind CSS for styling

## Testing

Currently, the system does not have automated tests. For manual testing:

1. Test task breakdown with various input types
2. Verify hierarchy relationships are correct
3. Check dependency creation and blocking logic
4. Test agent assignment recommendations
5. Verify skill management operations
6. Test bulk task creation workflow
7. Ensure RLS policies work correctly

## Performance Considerations

- Indexes created on foreign keys for fast lookups
- Batch inserts for bulk operations
- Memoized Supabase client instances
- Lazy loading of related data
- Optimized queries with proper joins

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Foreign key constraints prevent orphaned records
- Input validation on all fields
- Safe SQL with parameterized queries
