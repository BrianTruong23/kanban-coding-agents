# AI Task Orchestration & Agent Management Features

This document describes the automated task breakdown and agent orchestration system implemented for Issue #8.

## Overview

The system provides AI-powered capabilities to automatically break down issues, PRDs, and screenshots into structured epics, tickets, and subtasks, with intelligent agent assignment based on skills and performance metrics.

## Features Implemented

### 1. AI-Powered Task Breakdown

**Location**: `/orchestration` page, accessed via "AI Orchestration" button on main Kanban board

**Capabilities**:
- Analyzes GitHub issues, PRDs, or screenshot descriptions
- Automatically breaks down into:
  - **Epic**: Top-level organizational container
  - **Tickets**: Individual work items derived from the input
  - **Subtasks**: Granular steps for each ticket
- Generates comprehensive metadata for each task:
  - Definition of Done (DoD)
  - Test notes
  - Risk assessment (low, medium, high, critical)
  - Risk notes for potential issues
  - Estimated hours
  - Tags based on content analysis
- Detects dependencies between tasks automatically

**How it works**:
1. Click "AI Breakdown" button
2. Choose input type (Issue, PRD, or Screenshot)
3. Enter title and content
4. Configure priority and sprint
5. Review the breakdown
6. Create all tasks with one click

**Analysis Capabilities**:
- Parses numbered lists, bullet points, and sections
- Detects technology stack (frontend, backend, database, etc.)
- Identifies risk factors (breaking changes, security, production impact)
- Assesses complexity and estimates time
- Creates logical subtasks (research, implementation, testing)

### 2. Agent Roster Management

**Location**: `/orchestration` page → "Agents" tab

**Features**:
- View all coding agents with their details
- Performance metrics dashboard:
  - Tasks completed
  - Tasks in progress
  - Success rate (%)
  - Average completion time
- Skills management:
  - Add skills with proficiency levels (1-5)
  - Visual proficiency indicators
  - Remove outdated skills
- Color-coded agent avatars for easy identification

**Skills System**:
- Each agent can have multiple skills
- Proficiency levels:
  - 1: Beginner
  - 2: Intermediate
  - 3: Advanced
  - 4: Expert
  - 5: Master
- Skills used for intelligent task assignment

### 3. Intelligent Auto-Assignment

**Location**: Auto-assign button on orchestration page

**Algorithm Factors**:
1. **Skill Matching** (highest weight):
   - Direct skill matches with task tags
   - Related skills (e.g., React for frontend tasks)
   - Agent description matching

2. **Performance Metrics**:
   - Success rate (prefers high performers for critical tasks)
   - Completion time (fast vs thorough)
   - Experience level (task count)

3. **Workload Balancing**:
   - Prefers agents with fewer tasks in progress
   - Suggests reassignments when agents are overloaded
   - Distributes work evenly across team

4. **Priority Matching**:
   - High-priority tasks assigned to top performers
   - Critical tasks need 90%+ success rate

**Features**:
- Single task auto-assignment
- Bulk assignment for multiple tasks
- Assignment with confidence score
- Detailed reasoning for each assignment
- Reassignment suggestions

### 4. Task Hierarchy View

**Location**: `/orchestration` page → "Hierarchy" tab

**Features**:
- Tree-view of epic → tickets → subtasks
- Expandable/collapsible nodes
- Visual indicators:
  - Status icons (checkmark, clock, etc.)
  - Task type badges (EPIC, TASK, SUBTASK)
  - Priority flags (P4, P5)
  - Risk indicators
- Shows metadata inline:
  - Assigned agent with avatar
  - Sprint assignment
  - Estimated hours
  - Tags
  - Child count
- Expandable details:
  - Definition of Done
  - Test notes
  - Risk notes

### 5. Dependency Visualization

**Location**: `/orchestration` page → "Dependencies" tab

**Features**:
- Interactive dependency graph
- Visual representation of task relationships
- Color-coded dependency types:
  - **Red (Blocks)**: Task blocks another from starting
  - **Blue (Follows)**: Task follows another sequentially
  - **Gray dashed (Related)**: Tasks are related but not blocking
- Node information:
  - Task ID and title
  - Task type badge
  - Status color coding
  - Priority indicator
- Automatic layout with topological sorting
- Legend for understanding relationships

### 6. Database Schema Extensions

**New Tables**:

1. **agent_skills**
   - Links agents to their skills
   - Tracks proficiency levels
   - Used for intelligent assignment

2. **agent_performance**
   - Tracks agent metrics over time
   - Success rate calculation
   - Average completion time
   - Current workload

3. **task_dependencies**
   - Links tasks with dependencies
   - Three types: blocks, follows, related
   - Prevents circular dependencies

**Extended Tasks Table**:
- `task_type`: 'task' | 'epic' | 'subtask'
- `parent_task_id`: Link to parent task
- `definition_of_done`: Acceptance criteria
- `test_notes`: Testing guidelines
- `risk_level`: 'low' | 'medium' | 'high' | 'critical'
- `risk_notes`: Risk descriptions
- `estimated_hours`: Time estimate
- `actual_hours`: Actual time spent
- `sprint`: Already existed, used for filtering

## Technical Architecture

### Core Services

1. **Task Breakdown Service** (`src/lib/taskBreakdown.ts`)
   - Rule-based analysis engine
   - Pattern matching for structured content
   - Tag detection based on keywords
   - Risk assessment algorithms
   - Estimation formulas

2. **Agent Assignment Service** (`src/lib/agentAssignment.ts`)
   - Multi-factor scoring algorithm
   - Skill matching with fuzzy logic
   - Workload balancing calculations
   - Performance weighting
   - Reassignment suggestions

### UI Components

1. **TaskBreakdownWizard** (`src/components/TaskBreakdownWizard.tsx`)
   - 3-step wizard interface
   - Input type selection
   - Configuration panel
   - Breakdown preview

2. **AgentRoster** (`src/components/AgentRoster.tsx`)
   - Agent list with details
   - Performance metrics dashboard
   - Skills management interface

3. **TaskHierarchy** (`src/components/TaskHierarchy.tsx`)
   - Tree view with expand/collapse
   - Inline metadata display
   - Detailed information panels

4. **DependencyGraph** (`src/components/DependencyGraph.tsx`)
   - Canvas-based graph rendering
   - Automatic layout algorithm
   - Interactive visualization

### Data Flow

```
User Input → Breakdown Service → Task Generation → Auto-Assignment → Database
                                                           ↓
                                                    Agent Roster ← Performance Tracking
```

## Usage Examples

### Example 1: Breaking Down a Feature Request

**Input (PRD)**:
```
Implement User Authentication System

1. Create login page with email/password
2. Add social login (Google, GitHub)
3. Implement JWT token management
4. Create password reset flow
5. Add session management
```

**Output**:
- 1 Epic: "Implement User Authentication System"
- 5 Tickets (one per numbered item)
- ~20 Subtasks (research, implementation, testing for each)
- Dependencies detected (JWT must be implemented before session management)
- Risk flags: "security" (high risk), "authentication" (medium risk)

### Example 2: Auto-Assigning Tasks

**Scenario**: 10 new tasks need assignment

**Agent Skills**:
- Alex Chen: React (5), TypeScript (4)
- Sarah Johnson: Node.js (5), PostgreSQL (4)
- Mike Rodriguez: Full-stack (3)

**Result**:
- Frontend tasks → Alex Chen (skill match: React)
- Backend API tasks → Sarah Johnson (skill match: Node.js)
- Database tasks → Sarah Johnson (skill match: PostgreSQL)
- General tasks → Mike Rodriguez (balanced workload)

### Example 3: Dependency Graph

**Tasks**:
- TASK-1: Create database schema (blocks TASK-2, TASK-3)
- TASK-2: Implement API endpoints (follows TASK-1, blocks TASK-4)
- TASK-3: Add authentication middleware (follows TASK-1, blocks TASK-4)
- TASK-4: Create frontend UI (follows TASK-2, TASK-3)

**Graph Shows**:
- TASK-1 at the root
- TASK-2 and TASK-3 depend on TASK-1
- TASK-4 depends on both TASK-2 and TASK-3

## Future Enhancements

### Potential Improvements

1. **LLM Integration**:
   - Replace rule-based breakdown with GPT-4/Claude API
   - More accurate analysis and suggestions
   - Natural language understanding

2. **Performance Tracking**:
   - Automatic performance metric updates
   - Track actual vs estimated time
   - Success rate calculation based on task completion

3. **Advanced Dependencies**:
   - Visual dependency editor
   - Circular dependency detection
   - Critical path analysis

4. **Agent Learning**:
   - Learn from past assignments
   - Improve scoring algorithm over time
   - Skill proficiency auto-update based on performance

5. **Screenshot Analysis**:
   - Actual image upload and processing
   - CV/ML-based UI component detection
   - Automatic task generation from mockups

6. **Collaboration Features**:
   - Agent chat/comments
   - Task delegation
   - Progress notifications

7. **Analytics Dashboard**:
   - Team velocity tracking
   - Bottleneck identification
   - Resource utilization charts

## Database Migration

To use these features, run the updated database schema:

```sql
-- Run the contents of database/schema.sql in your Supabase SQL Editor
-- The schema includes idempotent migrations, so it's safe to run multiple times
```

Key migrations:
- Add agent_skills table
- Add agent_performance table
- Add task_dependencies table
- Extend tasks table with new columns
- Create appropriate indexes and RLS policies

## API Integration (Future)

Currently, the orchestration features work with the existing Supabase setup. To fully integrate:

1. Create API endpoints for:
   - Task breakdown service
   - Agent assignment service
   - Dependency management
   - Performance metrics updates

2. Add hooks:
   - `useTaskDependencies()` - Manage dependencies
   - `useAgentSkills()` - Manage skills
   - `useAgentPerformance()` - Track metrics

3. Real-time updates:
   - Subscribe to assignment changes
   - Live dependency graph updates
   - Performance metric streaming

## Testing Recommendations

1. **Task Breakdown**:
   - Test with various input formats (numbered, bullets, paragraphs)
   - Verify tag detection accuracy
   - Check risk assessment logic
   - Validate DoD and test notes generation

2. **Auto-Assignment**:
   - Test with different agent skill sets
   - Verify workload balancing
   - Check priority handling
   - Test reassignment suggestions

3. **Hierarchy View**:
   - Test with deep nesting (epic → task → subtask)
   - Verify expand/collapse functionality
   - Check metadata display
   - Test with large datasets

4. **Dependency Graph**:
   - Test with various dependency patterns
   - Check layout algorithm
   - Verify edge rendering
   - Test with circular dependencies (should handle gracefully)

## Known Limitations

1. **No Persistence for Dependencies**: Currently stored in component state. Needs database integration.

2. **No Real-time Performance Updates**: Performance metrics are static. Need automatic updates based on task completion.

3. **Rule-based Breakdown**: Uses pattern matching instead of true AI. Can be enhanced with LLM.

4. **No Skill Management Database**: Skills are created but not persisted. Database hooks needed.

5. **Limited Dependency Types**: Only 3 types supported. Could add more granular relationships.

6. **No Conflict Resolution**: Doesn't handle scheduling conflicts or resource constraints.

## Conclusion

This implementation provides a solid foundation for AI-powered task orchestration and agent management. The system successfully:

✅ Breaks down complex work into manageable pieces
✅ Automatically assigns work based on skills and performance
✅ Visualizes task hierarchies and dependencies
✅ Manages agent roster with skills and metrics
✅ Provides intelligent recommendations

The architecture is extensible and ready for future enhancements like LLM integration, real-time collaboration, and advanced analytics.
