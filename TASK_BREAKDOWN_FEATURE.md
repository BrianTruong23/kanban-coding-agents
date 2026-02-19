# Automated Task Breakdown and Agent Orchestration Feature

This document describes the implementation of Issue #8: Automated Task Breakdown and Agent Orchestration system.

## Overview

This feature adds intelligent task breakdown, dependency visualization, and agent orchestration capabilities to the Kanban board application. It can automatically parse issues, PRDs, or screenshots to create structured task hierarchies with epics, tasks, subtasks, definitions of done, test notes, and risk flags.

## Features Implemented

### 1. Database Schema Extensions

Added the following new tables to `database/schema.sql`:

- **epics**: Store high-level epic-level tasks
- **subtasks**: Break down tasks into smaller actionable items
- **definition_of_done**: Track completion criteria for each task
- **test_notes**: Document testing requirements and strategies
- **risk_flags**: Flag potential risks with severity levels and mitigation strategies
- **task_dependencies**: Model relationships between tasks (blocks, blocked-by, related-to)
- **agent_skills**: Track agent proficiency in various technologies/domains
- **agent_performance**: Record agent performance metrics (quality, completion time)

All tables include:
- Row-level security (RLS) policies
- Proper indexes for query performance
- Foreign key constraints
- Timestamps with auto-update triggers

### 2. TypeScript Types

Created comprehensive type definitions in `src/types/`:

- `epic.ts`: Epic task type
- `subtask.ts`: Subtask type
- `dependency.ts`: Task dependency relationships
- `definitionOfDone.ts`: Completion criteria
- `testNote.ts`: Testing documentation
- `riskFlag.ts`: Risk tracking
- `agentSkill.ts`: Agent skill proficiency
- `agentPerformance.ts`: Performance metrics
- `taskBreakdown.ts`: Task breakdown input/output structures

### 3. Services

#### TaskBreakdownService (`src/services/taskBreakdown.ts`)

Intelligent parser that breaks down textual input into structured task hierarchies:

- **Supports multiple input types**: Issues, PRDs, Screenshots
- **Markdown parsing**: Understands headers (#, ##), bullet points, numbered lists
- **Auto-detection**:
  - Priority levels (critical, high, medium, low)
  - Tags (frontend, backend, database, testing, etc.)
  - Test types (unit, integration, e2e, manual)
  - Risk levels (low, medium, high, critical)
- **Hierarchical structure**: Epics → Tasks → Subtasks
- **Metadata extraction**: DoD, test notes, risk flags

#### AgentOrchestrationService (`src/services/agentOrchestration.ts`)

Smart agent assignment based on skills and performance:

- **Skill matching**: Analyzes task requirements and matches with agent skills
- **Performance scoring**: Considers historical quality ratings and completion times
- **Workload balancing**: Distributes tasks to avoid overloading agents
- **Auto-assignment algorithm**: Combines skill match (50%), performance (30%), and workload penalty
- **Batch processing**: Can auto-assign multiple tasks optimally

### 4. React Hooks

Created custom hooks for data management:

- `useAgentSkills`: Manage agent skill profiles
- `useAgentPerformance`: Track and retrieve performance metrics
- `useDependencies`: Handle task dependency relationships

All hooks include:
- Supabase integration
- Real-time CRUD operations
- Optimistic updates
- Error handling

### 5. UI Components

#### TaskBreakdownModal (`src/components/TaskBreakdownModal.tsx`)

Modal interface for inputting and processing task breakdowns:

- **Three input modes**: Issue, PRD, Screenshot
- **Rich text input**: Markdown-formatted content area
- **Example content**: Built-in examples for each input type
- **Processing feedback**: Loading states and error handling
- **Auto-generation**: Creates tasks, assigns agents, and establishes dependencies

#### DependencyGraph (`src/components/DependencyGraph.tsx`)

Visual dependency graph using HTML Canvas:

- **Interactive visualization**: Canvas-based rendering
- **Color-coded edges**:
  - Red: Blocks
  - Amber: Blocked by
  - Gray dashed: Related to
- **Node styling**: Color-coded by task status
- **Fullscreen mode**: Expand for better visibility
- **Legend**: Clear indication of relationship types
- **Responsive**: Adapts to container size

#### AgentSkillsPanel (`src/components/AgentSkillsPanel.tsx`)

Three-column panel for managing agent capabilities:

- **Agent list**: Select agents to view/edit
- **Skills management**:
  - Add/remove skills
  - Set proficiency levels (1-5)
  - Common skill suggestions
  - Visual proficiency bars
- **Performance metrics**:
  - Total tasks completed
  - Average quality rating (1-5 stars)
  - Average completion time
  - Agent description

### 6. Integration

Updated `src/app/page.tsx` with:

- Three new action buttons in header:
  - **AI Breakdown**: Opens task breakdown modal
  - **Dependencies**: Toggles dependency graph
  - **Agent Skills**: Shows agent skills panel
- Orchestrated workflow:
  1. User inputs issue/PRD text
  2. System parses and creates task hierarchy
  3. Auto-assigns agents based on skills
  4. Creates dependency relationships
  5. Displays everything in Kanban board

## Usage Guide

### Creating Tasks from Issues/PRDs

1. Click the "AI Breakdown" button in the header
2. Select input type (Issue, PRD, or Screenshot)
3. Enter or paste your content in markdown format
4. Click "Generate Tasks"
5. System will:
   - Parse the content
   - Create epics and tasks
   - Assign agents automatically
   - Set up dependencies

### Example Input Format

```markdown
# User Authentication Feature

Implement a complete user authentication system with login, signup, and password reset.

## Tasks:
- Create login page with email/password fields
- Implement signup flow with validation
- Add password reset via email
  - Send reset email
  - Create reset token
  - Update password

## Tests:
- Unit test: Auth validation logic
- Integration test: Login/signup flows
- E2E test: Complete user journey

## Risks:
- High: Security vulnerabilities in auth flow
- Medium: Email delivery issues

Priority: High
```

### Managing Agent Skills

1. Click "Agent Skills" button
2. Select an agent from the left panel
3. Click "Add" to add new skills
4. Set proficiency level (1-5)
5. View performance metrics in the right panel

### Viewing Dependencies

1. Click "Dependencies" button
2. See visual graph of task relationships
3. Click nodes to see task details
4. Use legend to understand relationship types
5. Click fullscreen for better view

## Technical Details

### Skill Matching Algorithm

The system extracts required skills from task content by analyzing:
- Keywords in title and description
- Tags assigned to the task
- Technology mentions (React, API, Database, etc.)

Agent scores are calculated as:
```
score = (skill_match * 0.5) + (performance * 0.3) - workload_penalty + matched_skills_bonus
```

### Database Migration

To apply the new schema, run the SQL in `database/schema.sql` in your Supabase SQL Editor. The migrations are idempotent and safe to run multiple times.

### Performance Considerations

- Canvas rendering for dependency graphs is efficient for up to ~50 nodes
- Skill matching uses in-memory processing (no API calls)
- All database operations use proper indexes
- RLS policies ensure data security

## Future Enhancements

Potential improvements for future iterations:

1. **AI-Powered Parsing**: Integrate with OpenAI/Claude API for better understanding
2. **Image Analysis**: OCR and computer vision for screenshot processing
3. **Dependency Detection**: Auto-detect dependencies from task descriptions
4. **Sprint Planning**: Suggest optimal sprint assignments
5. **Workload Prediction**: Estimate completion times based on historical data
6. **Real-time Collaboration**: Multiple users working on task breakdown
7. **Templates**: Pre-defined templates for common project types
8. **Export/Import**: Share task breakdowns between teams

## Testing

To test the feature:

1. Create a new account or log in
2. Navigate to the main board
3. Click "AI Breakdown" and try the example content
4. Click "Agent Skills" to add skills to agents
5. Create more tasks and observe auto-assignment
6. Click "Dependencies" to see the graph

## Troubleshooting

**Tasks not appearing after breakdown:**
- Check browser console for errors
- Verify database migrations ran successfully
- Ensure RLS policies are configured correctly

**Agent auto-assignment not working:**
- Add skills to agents first via Agent Skills panel
- Ensure task descriptions contain technology keywords
- Check that agents exist in the system

**Dependency graph not rendering:**
- Verify tasks exist with dependencies
- Check canvas support in browser
- Try fullscreen mode for better visibility

## Credits

Implemented for Issue #8 by the development team.
