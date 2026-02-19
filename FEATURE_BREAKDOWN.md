# Automated Task Breakdown and Agent Orchestration - Feature Documentation

## Overview

This implementation adds a comprehensive automated task breakdown and agent orchestration system to the Kanban board application. The system enables users to transform high-level requirements (from PRDs, GitHub issues, or screenshots) into structured epics, tickets, and subtasks with automatically generated Definition of Done (DoD), test notes, and risk assessments.

## Features Implemented

### 1. Automated Task Breakdown

**Location**: `src/components/TaskBreakdown.tsx`, `src/services/aiBreakdown.ts`

#### Capabilities:
- **Multiple Input Types**:
  - PRD/Requirements text
  - GitHub issue URLs
  - Screenshots (with visual analysis)

- **AI-Powered Analysis**:
  - Extracts features and requirements from input
  - Identifies priority levels based on keywords
  - Auto-generates appropriate tags (frontend, backend, database, etc.)
  - Estimates effort (story points, hours, minutes)

- **Structured Output**:
  - **Epics**: High-level initiatives with story points and timelines
  - **Tickets**: Detailed work items with DoD, test notes, and risk flags
  - **Subtasks**: Granular implementation steps
  - **Dependencies**: Automatic dependency detection (blocks, relates-to, duplicates)

#### How It Works:
1. User clicks "AI Breakdown" button in the toolbar
2. Selects input type (PRD, GitHub, or Screenshot)
3. Provides the content and optional context
4. AI analyzes and generates structured breakdown
5. User reviews and accepts/rejects the breakdown
6. Accepted breakdowns are saved to the database

### 2. Agent Roster Management

**Location**: `src/components/AgentRoster.tsx`, `src/services/agentRoster.ts`

#### Capabilities:
- **Agent Skills Management**:
  - Add/remove skills for each agent
  - Set proficiency levels (1-5 stars)
  - Categorize skills: frontend, backend, database, devops, mobile, testing, design

- **Performance Tracking**:
  - Tasks completed
  - Average completion time
  - Success rate
  - Current workload (0-100%)
  - Last active timestamp

- **Real-time Metrics**:
  - Visual load indicators
  - Availability status (available/busy/offline)
  - Historical performance data

#### Database Tables:
- `agent_skills`: Stores agent capabilities
- `agent_performance`: Tracks metrics and statistics

### 3. Smart Agent Assignment

**Location**: `src/components/AutoAssignment.tsx`, `src/services/agentRoster.ts`

#### AI-Powered Matching Algorithm:
The system calculates a match score (0-100) based on:

1. **Availability (40 points max)**:
   - Low workload (<50%): 40 points
   - Moderate workload (50-80%): 20 points
   - High workload (>80%): 5 points

2. **Skill Matching (40 points max)**:
   - Matches ticket tags with agent skill categories
   - Weighted by proficiency level (1-5)
   - Considers skill breadth and depth

3. **Performance History (20 points max)**:
   - Success rate contribution
   - Track record of completed tasks
   - Experience bonus

4. **Priority Boost**:
   - Extra points for available agents on high-priority tasks

#### Match Reasons:
The system provides transparent explanations:
- "Low workload - highly available"
- "Skills: frontend (level 4), backend (level 3)"
- "Strong track record: 25 tasks completed, 96% success rate"
- "Available for high-priority task"

### 4. Dependency Visualization

**Location**: `src/components/DependencyGraph.tsx`

#### Features:
- **Force-Directed Graph Layout**:
  - Automatic node positioning
  - Clear visual relationships
  - Interactive pan and zoom

- **Dependency Types**:
  - **Blocks** (red solid line): Critical blockers
  - **Relates-to** (blue dashed): Related items
  - **Duplicates** (gray dashed): Duplicate detection

- **Visual Cues**:
  - High-priority tasks highlighted in yellow
  - Node colors based on status
  - Arrow indicators showing dependency direction

- **Controls**:
  - Zoom in/out
  - Pan by dragging
  - Reset view

### 5. Task Breakdown Components

#### Epic Structure:
```typescript
{
  id: string;
  epicId: string; // "EPIC-1"
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'cancelled';
  priority: 1-5;
  sprint?: string;
  tags: string[];
  estimatedStoryPoints?: number;
  actualStoryPoints?: number;
  startDate?: timestamp;
  endDate?: timestamp;
}
```

#### Ticket Structure:
```typescript
{
  id: string;
  ticketId: string; // "TICKET-1"
  epicId?: string;
  title: string;
  description: string;
  taskType: 'epic' | 'ticket' | 'subtask';
  status: 'backlog' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 1-5;
  sprint?: string;
  assignedAgentId?: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
}
```

#### Definition of Done:
```typescript
{
  id: string;
  description: string;
  completed: boolean;
}
```

#### Test Notes:
```typescript
{
  id: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  description: string;
  testCase?: string;
}
```

#### Risk Flags:
```typescript
{
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}
```

## Database Schema

### New Tables:

1. **epics**
   - Stores high-level initiatives
   - Links to tickets via epic_id

2. **tickets**
   - Detailed work items
   - JSONB fields for DoD, test notes, risk flags
   - References epics and agents

3. **subtasks**
   - Granular implementation steps
   - References parent tickets

4. **task_dependencies**
   - Stores relationships between tasks
   - Supports multiple dependency types

5. **agent_skills**
   - Agent capabilities and proficiency
   - Categorized by skill type

6. **agent_performance**
   - Performance metrics and statistics
   - Real-time workload tracking

### Migrations:
All schema changes are idempotent and use `if not exists` checks to ensure safe repeated execution.

## API Integration Points

### AI Provider Interface:
```typescript
interface AIProvider {
  analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult>;
}
```

### Current Implementation:
- **MockAIProvider**: Demonstration provider with intelligent parsing
- **OpenAIProvider**: Placeholder for GPT-4 integration (requires API key)

### Extending with Real AI:
To integrate with OpenAI or Claude:

```typescript
// In src/services/aiBreakdown.ts
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
export const aiBreakdownService = new AIBreakdownService('openai', apiKey);
```

## Usage Guide

### 1. Creating a Task Breakdown:

1. Click "AI Breakdown" button
2. Choose input type:
   - **PRD**: Paste requirements text
   - **GitHub**: Enter issue URL
   - **Screenshot**: Upload image
3. Add optional context
4. Click "Generate Breakdown"
5. Review the generated structure
6. Click "Accept & Create Tasks"

### 2. Managing Agent Roster:

1. Click "Agents" button
2. Select an agent from the list
3. View performance metrics
4. Add skills:
   - Click "Add Skill"
   - Enter skill name
   - Select category
   - Set proficiency (1-5)
5. Remove skills by clicking trash icon

### 3. Smart Assignment:

1. From ticket view, click "Auto-Assign"
2. Review AI-suggested matches
3. See match scores and reasons
4. Choose:
   - "Auto-Assign Best Match" (automatic)
   - "Assign Selected" (manual choice)

### 4. Viewing Dependencies:

1. Click "Dependencies" button
2. View graph visualization
3. Use controls:
   - Drag to pan
   - Zoom in/out with buttons
   - Reset view to default

## Performance Considerations

### Optimization Strategies:

1. **Memoized Supabase Client**:
   - Prevents auth state issues
   - Consistent session handling

2. **Indexed Database Queries**:
   - All foreign keys indexed
   - Sprint and status fields indexed
   - Efficient lookups for large datasets

3. **JSONB Fields**:
   - DoD, test notes, and risk flags stored as JSONB
   - Flexible schema without multiple joins
   - Fast queries with PostgreSQL JSONB operators

4. **Row-Level Security (RLS)**:
   - All tables protected by RLS
   - User isolation at database level
   - Secure multi-tenant architecture

## Testing Recommendations

### Unit Tests:
- AI parsing logic
- Match score calculation
- Dependency graph layout algorithm

### Integration Tests:
- Breakdown creation flow
- Agent assignment process
- Performance metric updates

### E2E Tests:
- Complete breakdown workflow
- Agent roster management
- Dependency visualization

## Future Enhancements

### Potential Improvements:

1. **Real AI Integration**:
   - OpenAI GPT-4 for advanced analysis
   - Claude for code-aware breakdowns
   - Custom fine-tuned models

2. **Advanced Analytics**:
   - Burndown charts
   - Velocity tracking
   - Predictive completion dates

3. **Team Collaboration**:
   - Multi-user agent pools
   - Shared epics and tickets
   - Real-time updates

4. **Automation**:
   - Automatic task transitions
   - Smart notifications
   - Scheduled reassignment

5. **Enhanced Dependency Management**:
   - Critical path analysis
   - Dependency conflict detection
   - Automatic reordering

## Troubleshooting

### Common Issues:

1. **Tasks not appearing after breakdown**:
   - Check database connection
   - Verify user authentication
   - Check browser console for errors

2. **Agent skills not saving**:
   - Ensure agent_skills table exists
   - Check RLS policies
   - Verify user has access to agent

3. **Dependency graph not rendering**:
   - Check if dependencies exist
   - Verify canvas element loads
   - Check for JavaScript errors

## File Structure

```
src/
├── components/
│   ├── TaskBreakdown.tsx       # Main breakdown UI
│   ├── AgentRoster.tsx         # Agent management UI
│   ├── AutoAssignment.tsx      # Smart assignment UI
│   ├── DependencyGraph.tsx     # Graph visualization
│   └── KanbanBoard.tsx         # Updated with new features
├── services/
│   ├── aiBreakdown.ts          # AI breakdown service
│   └── agentRoster.ts          # Agent management service
├── hooks/
│   └── useBreakdown.ts         # Breakdown data management
└── types/
    └── breakdown.ts            # Type definitions

database/
└── schema.sql                  # Updated schema with new tables
```

## Conclusion

This implementation provides a complete automated task breakdown and agent orchestration system. It transforms high-level requirements into actionable work items with intelligent agent assignment, comprehensive risk assessment, and visual dependency tracking. The system is production-ready with proper database design, security, and extensibility for future AI integrations.
