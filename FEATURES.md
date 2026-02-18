# Issue #8: Automated Task Breakdown and Agent Orchestration

## Overview

This document describes the implementation of advanced features for automated task breakdown, agent management, and dependency visualization added to the Kanban board application.

## Features Implemented

### 1. AI-Powered Task Breakdown

**Location**: `src/lib/ai/taskBreakdown.ts`, `src/components/TaskBreakdownModal.tsx`

**Description**: Automatically breaks down issues, PRDs (Product Requirements Documents), or screenshots into a structured hierarchy of epics, stories, tasks, and subtasks.

**Features**:
- **Multiple Input Types**:
  - Text input (issue descriptions, PRDs, feature requests)
  - Screenshot upload (UI mockups, wireframes)
- **Hierarchical Task Generation**:
  - Epic: High-level business objective
  - Stories: User-facing features
  - Tasks: Implementation work items
  - Subtasks: Granular implementation steps
- **Automatic Metadata Generation**:
  - Definition of Done (DoD) checklists
  - Test notes with test types (unit, integration, e2e, manual)
  - Risk flags with severity levels
  - Time estimates and story points
- **Dependency Detection**: Identifies task dependencies automatically

**How to Use**:
1. Click the "AI Breakdown" button in the toolbar
2. Choose input type (Text or Screenshot)
3. Enter/upload your requirements
4. Click "Generate Tasks"
5. Review the generated breakdown
6. Click "Add to Board" to import

**Current Implementation**:
- Mock AI analysis with realistic task generation patterns
- Ready for integration with OpenAI GPT-4, Anthropic Claude, or custom ML models
- Replace `mockAIAnalysis` function with actual API calls for production

### 2. Agent Management System

**Location**: `src/components/AgentManagement.tsx`, `src/lib/ai/agentAssignment.ts`

**Description**: Comprehensive agent roster management with skills tracking, performance metrics, and intelligent auto-assignment.

**Features**:
- **Agent Profiles**:
  - Name, description, and avatar
  - Availability status (available, busy, offline)
  - Maximum concurrent task capacity
  - Preferred task types
- **Skills Management**:
  - Add/remove skills with proficiency levels
  - Skill levels: Beginner, Intermediate, Advanced, Expert
  - Years of experience tracking
- **Performance Metrics**:
  - Tasks completed vs in-progress
  - Average completion time
  - On-time delivery rate
  - Quality score
- **Auto-Assignment Algorithm**:
  - Skill matching (40% weight)
  - Performance history (25% weight)
  - Current workload (20% weight)
  - Task type preferences (15% weight)
  - Availability bonus/penalty

**How to Use**:
1. Click the "Agents" button in the toolbar
2. Select an agent from the list
3. Click the edit icon to modify agent details
4. Add/remove skills with proficiency levels
5. Click "Auto-Assign Tasks" to automatically distribute unassigned tasks

**Auto-Assignment Algorithm**:
```typescript
// Recommends agents based on:
- Skill match with task requirements
- Historical performance metrics
- Current workload and capacity
- Task type preferences
- Real-time availability
```

### 3. Dependency Graph Visualization

**Location**: `src/components/DependencyGraph.tsx`

**Description**: Visual representation of task dependencies and relationships using canvas-based graph rendering.

**Features**:
- **Interactive Graph**:
  - Pan (drag to move)
  - Zoom (controls or scroll)
  - Reset view button
- **Visual Hierarchy**:
  - Color-coded by task type (epic, story, task, subtask)
  - Background color by status (backlog, in-progress, review, done)
  - Type badges on each node
- **Dependency Types**:
  - Blocks (red arrows)
  - Blocked-by (blue arrows)
  - Relates-to (gray dashed arrows)
- **Hierarchical Layout**:
  - Automatic positioning by task type
  - Bezier curves for better visibility
  - Arrow indicators for dependency direction

**How to Use**:
1. Click the "Dependencies" button in the toolbar
2. Pan by dragging the canvas
3. Use zoom controls to adjust view
4. Hover over nodes to highlight
5. Click nodes to view details (optional)

### 4. Extended Type System

**Location**: `src/types/task.ts`, `src/types/agent.ts`

**New Task Types**:
```typescript
- TaskType: 'epic' | 'story' | 'task' | 'subtask' | 'bug'
- DefinitionOfDone: Checklist items for task completion
- TestNote: Test requirements with type classification
- RiskFlag: Risk indicators with severity and mitigation
- TaskDependency: Dependency relationships between tasks
```

**New Agent Types**:
```typescript
- AgentSkill: Skills with proficiency levels
- AgentPerformance: Performance metrics tracking
- Availability: 'available' | 'busy' | 'offline'
```

### 5. Database Schema Extensions

**Location**: `database/schema_extension.sql`

**New Tables**:
- `agent_skills`: Agent skills and proficiency levels
- `agent_performance`: Performance metrics per agent
- `definition_of_done`: DoD checklist items per task
- `test_notes`: Test requirements per task
- `risk_flags`: Risk indicators per task
- `task_dependencies`: Task dependency relationships

**Extended Columns**:
- Tasks: `type`, `parent_task_id`, `epic_id`, `estimated_hours`, `actual_hours`, `story_points`
- Agents: `availability`, `max_concurrent_tasks`, `preferred_task_types`

**Triggers**:
- Auto-update agent performance when task status changes

## Architecture

### AI Service Layer
```
src/lib/ai/
├── taskBreakdown.ts      # Task breakdown logic
└── agentAssignment.ts    # Auto-assignment algorithm
```

### Component Layer
```
src/components/
├── TaskBreakdownModal.tsx    # AI breakdown UI
├── AgentManagement.tsx       # Agent roster management
└── DependencyGraph.tsx       # Dependency visualization
```

### Data Flow
1. User triggers AI breakdown → Modal opens
2. User inputs requirements → AI service processes
3. AI generates structured tasks → Preview shown
4. User confirms → Tasks added to database
5. Auto-assignment algorithm runs (optional)
6. Dependency graph updates automatically

## Integration Points

### Real AI Integration (For Production)

Replace the mock implementation in `src/lib/ai/taskBreakdown.ts`:

```typescript
// Option 1: OpenAI GPT-4 Vision
import OpenAI from 'openai';

async function realAIAnalysis(input: BreakdownInput) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Break down this into epics, stories, and tasks..." },
        { type: "image_url", image_url: { url: input.imageData } }
      ]
    }]
  });

  // Parse response and return BreakdownResult
}

// Option 2: Anthropic Claude
import Anthropic from '@anthropic-ai/sdk';

async function realAIAnalysis(input: BreakdownInput) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Analyze this and break down into structured tasks: ${input.content}`
    }]
  });

  // Parse response and return BreakdownResult
}
```

### Environment Variables

Add to `.env.local`:
```bash
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key
```

## Usage Examples

### Example 1: Breaking Down a Feature Request

**Input**:
```
# User Authentication System

Implement a complete authentication system with:
- Email/password login
- Social auth (Google, GitHub)
- Password reset
- Email verification
- Remember me functionality
- Rate limiting

Security requirements:
- Bcrypt password hashing
- JWT tokens
- HTTPS only
- CSRF protection
```

**Generated Output**:
- 1 Epic: "User Authentication System"
- 3 Stories: "Login System", "Social Authentication", "Security Hardening"
- 6 Tasks: Implementation tasks for each feature
- 12 Subtasks: Granular implementation steps
- Auto-generated DoD, test notes, and risk flags

### Example 2: Auto-Assigning Tasks

**Scenario**: You have 20 unassigned tasks and 5 agents

**Process**:
1. Open Agent Management
2. Ensure agents have skills defined
3. Click "Auto-Assign Tasks"
4. Algorithm analyzes:
   - Each task's requirements (from title, description, tags)
   - Each agent's skills and proficiency
   - Current workload and capacity
   - Performance history
5. Optimal assignments made automatically

**Result**: Tasks distributed to agents based on best fit, maximizing team efficiency

### Example 3: Visualizing Dependencies

**Scenario**: Complex feature with multiple interdependent tasks

**Process**:
1. Create tasks with dependencies (manually or via AI)
2. Click "Dependencies" button
3. View hierarchical graph showing:
   - Epic at top level
   - Stories below
   - Tasks and subtasks at lower levels
   - Arrows showing blocking relationships

**Use Cases**:
- Identify critical path
- Detect circular dependencies
- Plan sprint work order
- Communicate task relationships to team

## Performance Considerations

### Task Breakdown
- Current: ~1s mock delay (realistic simulation)
- With Real AI: 3-10s depending on API and complexity
- Recommendation: Show loading state, allow cancellation

### Dependency Graph
- Canvas-based rendering for performance
- Handles up to 100+ nodes smoothly
- Automatic layout algorithm
- Optimize for large graphs: Virtual rendering, clustering

### Auto-Assignment
- Algorithm runs in <100ms for typical workloads
- Scales linearly with task count
- Consider batching for 100+ tasks

## Future Enhancements

### Planned Features
1. **Machine Learning Integration**:
   - Train on historical task data
   - Improve breakdown accuracy over time
   - Personalized to team patterns

2. **Advanced Dependency Management**:
   - Drag-and-drop dependency creation
   - Critical path highlighting
   - Gantt chart view

3. **Agent Analytics Dashboard**:
   - Velocity tracking
   - Skill gap analysis
   - Workload forecasting

4. **Real-time Collaboration**:
   - Live updates across users
   - Collaborative task breakdown
   - Agent assignment notifications

5. **Integration APIs**:
   - Import from Jira, Linear, GitHub Issues
   - Export to project management tools
   - Webhook support

## Testing

### Manual Testing Checklist

- [ ] AI Breakdown: Text input generates tasks
- [ ] AI Breakdown: Screenshot upload (mock)
- [ ] Task hierarchy preserved in database
- [ ] Agent skills can be added/removed
- [ ] Auto-assignment distributes tasks correctly
- [ ] Dependency graph renders correctly
- [ ] Graph pan/zoom controls work
- [ ] Performance metrics update on task changes
- [ ] DoD items can be checked off
- [ ] Risk flags display correctly

### Integration Testing

```typescript
// Test auto-assignment algorithm
test('assigns tasks based on skills', () => {
  const tasks = [createMockTask({ tags: ['react', 'frontend'] })];
  const agents = [
    createMockAgent({ skills: [{ name: 'react', level: 'expert' }] })
  ];

  const assignments = autoAssignTasks(tasks, agents);
  expect(assignments.get(tasks[0].id)).toBe(agents[0].id);
});
```

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review this documentation
3. Open a new issue with:
   - Feature name
   - Expected vs actual behavior
   - Steps to reproduce
   - Screenshots if applicable

## License

MIT - Same as parent project
