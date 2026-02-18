# Task Orchestration System

This document describes the automated task breakdown and agent orchestration features implemented in the Kanban board.

## Overview

The orchestration system provides intelligent automation for:
- **Task Breakdown**: Automatically analyze issues, PRDs, or screenshots to generate structured tasks
- **Agent Management**: Manage agent roster with skills, availability, and performance tracking
- **Smart Assignment**: AI-powered task assignment based on agent skills and performance
- **Dependency Tracking**: Visualize and manage task dependencies

## Features

### 1. Automated Task Breakdown

Break down complex requirements into structured work items:

- **Input Types**:
  - GitHub Issues
  - Product Requirements Documents (PRDs)
  - Screenshots/Mockups

- **Generated Artifacts**:
  - **Epics**: High-level features or initiatives
  - **Tasks**: Individual work items with detailed breakdown
  - **Subtasks**: Granular steps within tasks
  - **Dependencies**: Automatically identified task relationships

- **Task Enrichment**:
  - Definition of Done (DoD) criteria
  - Test notes and scenarios
  - Risk levels and descriptions
  - Required skills
  - Time estimates
  - Priority assignments

### 2. Agent Roster Management

Comprehensive agent management with:

- **Agent Profiles**:
  - Name and avatar
  - Skills and proficiency levels
  - Availability percentage
  - Maximum concurrent tasks

- **Performance Tracking**:
  - Total tasks completed
  - Average completion time
  - Quality score (1-5 rating)
  - On-time delivery percentage
  - Current workload

- **Skills Management**:
  - Define agent skill sets
  - Track proficiency levels (1-5)
  - Identify skill gaps in team

### 3. Smart Task Assignment

Intelligent task assignment algorithm considers:

- **Skill Matching** (up to 30 points):
  - Required vs. available skills
  - Skill proficiency levels
  - Specialization bonuses

- **Performance History** (up to 20 points):
  - Quality score
  - On-time delivery rate
  - Historical success with similar tasks

- **Availability** (up to 15 points):
  - Current availability percentage
  - Workload capacity

- **Workload Balancing** (penalty up to -20 points):
  - Current task count
  - Maximum concurrent tasks
  - Fair distribution

- **Priority Adjustment**:
  - High performers for critical tasks
  - Task urgency consideration

### 4. Dependency Visualization

Interactive dependency graph showing:

- Task relationships
- Blocking dependencies
- Critical path identification
- Visual task hierarchy

## Usage

### Accessing the Orchestration Dashboard

Click the "Orchestration" button in the bottom-right corner of the screen.

### Tab 1: Task Breakdown

1. Click "Start Task Breakdown"
2. Select input type (Issue, PRD, or Screenshot)
3. Enter title and content
4. Click "Analyze & Generate Tasks"
5. Review generated tasks, epics, and dependencies
6. Click "Create Tasks" to add them to your board

**Example Input**:
```
Title: User Authentication Feature

Content:
Implement a complete user authentication system with:
- Email/password login
- Social OAuth (Google, GitHub)
- JWT token management
- Password reset flow
- Session management
- Account verification emails

Requirements:
- Must support 2FA
- Mobile-responsive UI
- Rate limiting on login attempts
- Secure password storage with bcrypt
```

**Generated Output**:
- 1 Epic: "User Authentication System"
- 6-8 Tasks with DoD, test notes, and risk flags
- Dependencies automatically identified
- Skills required: Backend, Frontend, Security, Email Integration

### Tab 2: Agent Roster

**Adding an Agent**:
1. Click "Add Agent"
2. Enter agent name
3. Add skills (comma-separated): "React, TypeScript, API Design"
4. Set availability (0-100%)
5. Set max concurrent tasks
6. Click "Add"

**Editing an Agent**:
1. Click the edit icon on an agent card
2. Modify fields as needed
3. Click "Update"

**Viewing Agent Performance**:
- Quality score (1-5 stars)
- On-time delivery percentage
- Current workload visualization
- Skill tags with proficiency

### Tab 3: Dependencies

View the dependency graph to:
- See task relationships
- Identify blockers
- Understand critical path
- Click tasks to navigate

**Legend**:
- Red lines: Blocking dependencies
- Gray lines: Related tasks
- Node colors: Task status (backlog, in-progress, review, done)

## Assignment Recommendations

When assigning tasks, the system provides:

1. **Recommended Agents** ranked by suitability score (0-100)
2. **Reasons for Recommendation**:
   - Skill match quality
   - Performance history
   - Availability and workload
   - Specialization bonuses

3. **Auto-Assignment Badge**: Tasks with score ≥80 and clear best match

**Score Interpretation**:
- 80-100: Excellent match (auto-assign ready)
- 60-79: Good match
- 40-59: Acceptable match
- 0-39: Poor match

## Architecture

### Core Services

1. **`taskBreakdown.ts`**: AI-powered analysis and task generation
   - `analyzeAndBreakdown()`: Main breakdown function
   - `extractKeyInformation()`: Pattern matching for metadata

2. **`agentOrchestration.ts`**: Assignment logic
   - `calculateAgentScore()`: Scoring algorithm
   - `getAssignmentRecommendations()`: Ranked recommendations
   - `batchAssignTasks()`: Bulk assignment optimization
   - `calculateAgentStats()`: Performance metrics

### Components

1. **`TaskBreakdownModal`**: Task analysis interface
2. **`AgentRosterPanel`**: Agent CRUD operations
3. **`DependencyGraph`**: Canvas-based dependency visualization
4. **`AssignmentRecommendations`**: Smart assignment UI
5. **`OrchestrationDashboard`**: Main orchestration interface

### Data Models

**Extended Task Type**:
```typescript
interface Task {
  // ... existing fields
  type?: 'epic' | 'task' | 'subtask';
  epicId?: string;
  parentTaskId?: string;
  definitionOfDone?: string;
  testNotes?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskDescription?: string;
  estimatedHours?: number;
  actualHours?: number;
  requiredSkills?: string[];
}
```

**Agent Extensions**:
```typescript
interface CodingAgent {
  // ... existing fields
  skills?: string[];
  skillLevels?: Record<string, number>;
  availability?: number;
  maxConcurrentTasks?: number;
  currentTaskCount?: number;
}
```

**New Types**:
- `Epic`: Top-level feature container
- `Subtask`: Task decomposition
- `TaskDependency`: Relationship tracking
- `AgentSkill`: Skill proficiency data
- `AgentPerformance`: Historical metrics
- `AgentStats`: Aggregated statistics

## Integration with AI Services

The current implementation uses mock AI analysis. To integrate with real AI:

### Option 1: OpenAI GPT-4

```typescript
import OpenAI from 'openai';

async function analyzeWithOpenAI(input: BreakdownInput) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "You are a project manager that breaks down requirements into tasks..."
    }, {
      role: "user",
      content: input.content
    }],
    functions: [{
      name: "generate_tasks",
      parameters: {
        // Define task breakdown schema
      }
    }]
  });

  return parseAIResponse(response);
}
```

### Option 2: Anthropic Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';

async function analyzeWithClaude(input: BreakdownInput) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Analyze this ${input.type} and break it down into tasks:\n\n${input.content}`
    }],
    tools: [{
      name: "generate_task_breakdown",
      description: "Generate structured task breakdown",
      input_schema: {
        // Define task breakdown schema
      }
    }]
  });

  return parseClaudeResponse(message);
}
```

### Schema for AI Function Calling

```json
{
  "type": "object",
  "properties": {
    "epics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "priority": { "type": "integer", "minimum": 1, "maximum": 5 }
        }
      }
    },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "priority": { "type": "integer" },
          "definitionOfDone": {
            "type": "array",
            "items": { "type": "string" }
          },
          "testNotes": { "type": "string" },
          "riskLevel": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"]
          },
          "estimatedHours": { "type": "number" },
          "requiredSkills": {
            "type": "array",
            "items": { "type": "string" }
          },
          "dependsOn": {
            "type": "array",
            "items": { "type": "integer" }
          }
        }
      }
    }
  }
}
```

## Database Schema

To persist orchestration data, create these tables:

```sql
-- Extend tasks table
ALTER TABLE tasks ADD COLUMN type VARCHAR(20);
ALTER TABLE tasks ADD COLUMN epic_id UUID;
ALTER TABLE tasks ADD COLUMN parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN definition_of_done TEXT;
ALTER TABLE tasks ADD COLUMN test_notes TEXT;
ALTER TABLE tasks ADD COLUMN risk_level VARCHAR(20);
ALTER TABLE tasks ADD COLUMN risk_description TEXT;
ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL;
ALTER TABLE tasks ADD COLUMN actual_hours DECIMAL;
ALTER TABLE tasks ADD COLUMN required_skills TEXT[];

-- Extend agents table
ALTER TABLE agents ADD COLUMN skills TEXT[];
ALTER TABLE agents ADD COLUMN availability INTEGER DEFAULT 100;
ALTER TABLE agents ADD COLUMN max_concurrent_tasks INTEGER DEFAULT 5;
ALTER TABLE agents ADD COLUMN current_task_count INTEGER DEFAULT 0;

-- Task dependencies
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Agent skills
CREATE TABLE agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, skill_name)
);

-- Agent performance
CREATE TABLE agent_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completion_time DECIMAL,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  on_time BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_agent_skills_agent ON agent_skills(agent_id);
CREATE INDEX idx_agent_performance_agent ON agent_performance(agent_id);
```

## Best Practices

1. **Task Breakdown**:
   - Provide detailed context in input
   - Review generated tasks before creating
   - Adjust priorities and estimates as needed

2. **Agent Management**:
   - Keep skills up to date
   - Regularly update availability
   - Track performance metrics

3. **Assignment**:
   - Review recommendations before accepting
   - Consider workload distribution
   - Balance skill development vs. expertise

4. **Dependencies**:
   - Identify blockers early
   - Resolve dependencies before starting work
   - Update status to unblock dependent tasks

## Future Enhancements

- [ ] Machine learning-based time estimation
- [ ] Automatic skill extraction from completed tasks
- [ ] Team velocity tracking
- [ ] Sprint planning automation
- [ ] Resource allocation optimization
- [ ] Integration with GitHub Issues API
- [ ] Slack/Discord notifications
- [ ] Gantt chart view
- [ ] Burndown charts
- [ ] Custom workflow automation rules

## Troubleshooting

**Tasks not appearing after breakdown**:
- Check browser console for errors
- Verify user is authenticated
- Ensure database connection is active

**Assignment scores seem incorrect**:
- Update agent skills and availability
- Check agent performance data
- Review task required skills

**Dependency graph not rendering**:
- Ensure tasks have valid IDs
- Check for circular dependencies
- Verify browser supports Canvas API

## Support

For issues or feature requests, please create a GitHub issue or contact the development team.
