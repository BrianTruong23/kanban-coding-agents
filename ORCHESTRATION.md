# Task Orchestration & Automated Breakdown

A comprehensive system for automatically breaking down issues, PRDs, and screenshots into structured tasks with intelligent agent assignment.

## Features

### 🎯 Automated Task Breakdown
- **Multiple Input Sources**: Process GitHub issues, PRDs, screenshots, or plain text
- **Hierarchical Structure**: Automatically organize work into Epics → Tickets → Subtasks
- **Smart Analysis**: Identifies complexity, effort estimates, and required skills
- **Risk Assessment**: Flags high-risk items with mitigation suggestions

### 👥 Agent Orchestration
- **Skill-Based Matching**: Agents have defined skill categories and proficiency levels
- **Performance Tracking**: Monitor quality score, on-time delivery, and completion metrics
- **Auto-Assignment**: AI-powered agent selection based on skills and performance
- **Workload Balancing**: Consider agent availability and current assignments

### 📊 Dependency Visualization
- **Task Relationships**: Define "blocks", "blocked-by", and "relates-to" dependencies
- **Visual Hierarchy**: Tree view showing Epic → Ticket → Subtask relationships
- **Risk Highlighting**: Visual indicators for high-risk items

## Database Schema

### New Tables

#### `epics`
Large bodies of work containing multiple tickets.
- `id`, `user_id`, `title`, `description`
- `objectives[]`, `acceptance_criteria[]`
- `risk_level` (low/medium/high/critical)
- `estimated_effort` (hours)
- `status` (planning/in-progress/review/done)

#### `tickets`
Medium-sized work items that can be assigned to agents.
- `id`, `epic_id`, `user_id`, `ticket_id`
- `title`, `description`
- `definition_of_done[]`, `test_notes[]`
- `risk_level`, `risk_flags[]`
- `assigned_agent_id`, `estimated_effort`, `actual_effort`
- `priority`, `required_skills[]`
- `status` (backlog/in-progress/review/done)

#### `subtasks`
Small units of work within a ticket.
- `id`, `ticket_id`, `user_id`, `title`
- `assigned_agent_id`
- `estimated_effort`, `actual_effort`
- `completed` (boolean)

#### `task_dependencies`
Relationships between tasks.
- `id`, `user_id`
- `source_id`, `source_type` (epic/ticket/subtask)
- `target_id`, `target_type`
- `dependency_type` (blocks/blocked-by/relates-to)

#### `agent_skills`
Skills and proficiency levels for each agent.
- `id`, `agent_id`, `user_id`
- `skill_category` (frontend/backend/database/devops/mobile/testing/design/ai-ml)
- `proficiency_level` (1-5, where 5 is expert)

#### `agent_performance`
Performance metrics for agents.
- `id`, `agent_id`, `user_id`
- `tasks_completed`
- `average_completion_time` (hours)
- `quality_score` (0-100)
- `on_time_delivery` (percentage)

## Usage Guide

### 1. Access the Orchestration System

Navigate to `/orchestration` to access the task orchestration dashboard.

### 2. Create a Task Breakdown

1. Click **"New Breakdown"** button
2. Select input source:
   - **Text/PRD**: Paste product requirements
   - **GitHub Issue**: Paste issue content
   - **Screenshot**: Describe UI mockup
   - **Product Doc**: Paste documentation

3. Enter your content with details:
   ```
   Example:
   # User Authentication System

   ## Requirements
   - Email/password login
   - Google OAuth integration
   - JWT token management
   - Password reset flow
   - Remember me functionality

   ## Technical Notes
   - Use bcrypt for password hashing
   - Implement refresh token rotation
   - Add rate limiting on login attempts
   ```

4. Click **"Analyze & Break Down"**
5. Review the generated structure:
   - Epics (if multiple phases identified)
   - Tickets with DoD, test notes, risk levels
   - Subtasks for each ticket
   - Effort estimates
   - Required skills
   - Risk mitigation suggestions

6. Click **"Confirm & Create Tasks"** to save

### 3. Manage Agent Skills

1. Go to **"Agent Roster"** tab
2. Click edit icon on any agent
3. Set skill proficiency levels (1-5):
   - **1**: Beginner
   - **2**: Intermediate
   - **3**: Proficient
   - **4**: Advanced
   - **5**: Expert

4. Skills automatically match to task requirements

### 4. Auto-Assign Tasks

1. Go to **"Auto-Assignment"** tab
2. Click **"Analyze & Suggest"**
3. Review AI-generated assignments showing:
   - Agent match score (0-100%)
   - Reasoning (skills, performance, availability)
   - Confidence level

4. Select which assignments to apply
5. Click **"Apply Selected"**

### 5. View Task Breakdown

1. Go to **"Task Breakdown"** tab
2. Expand/collapse epics to view tickets
3. Expand tickets to see:
   - Definition of Done
   - Test Notes
   - Subtasks
   - Dependencies
   - Assigned agent
   - Risk level

## Auto-Assignment Algorithm

The system calculates a match score (0-100) for each agent-task pair:

### Scoring Components

1. **Skills Match (0-50 points)**
   - Matches required skills with agent proficiency
   - Higher proficiency = more points
   - Multiple matching skills = bonus

2. **Performance Metrics (0-30 points)**
   - Quality Score (0-15 points): Based on historical quality
   - On-Time Delivery (0-15 points): Based on delivery record

3. **Availability (0-20 points)**
   - Current workload consideration
   - Active task count

### Confidence Levels
- **80-100%**: High confidence (auto-selected by default)
- **60-79%**: Medium confidence (review recommended)
- **Below 60%**: Low confidence (manual review needed)

## Task Breakdown Logic

The system uses pattern matching and heuristics to structure content:

### Epic Detection
- Headers (## or ###)
- Keywords: "epic", "phase", "milestone", "initiative"
- Large scope indicators

### Ticket Creation
- Bullet points or numbered lists
- Feature descriptions
- User stories
- Functional requirements

### Subtask Extraction
- Indented bullet points
- "Subtask:" prefix
- Checklist items
- Implementation steps

### Risk Assessment
Risk levels determined by keywords:
- **Critical**: "security", "data loss", "critical", "urgent"
- **High**: "breaking change", "migration", "refactor"
- **Medium**: "complex", "integration"
- **Low**: Default

### Skill Identification
Skills extracted from content:
- **Frontend**: React, Vue, Angular, UI, CSS
- **Backend**: API, server, Node, Python, Java
- **Database**: SQL, PostgreSQL, MongoDB
- **DevOps**: Docker, Kubernetes, CI/CD
- **Mobile**: iOS, Android, React Native
- **Testing**: Test, QA, Quality
- **Design**: Figma, Sketch, Wireframe
- **AI/ML**: AI, ML, NLP, LLM

## API Integration Points

While the current implementation uses rule-based analysis, these functions are designed to integrate with LLM APIs:

### `breakdownTask(request: BreakdownRequest)`
**Future Enhancement**: Replace with LLM call
```typescript
// Current: Rule-based parsing
// Future: Call OpenAI/Claude API with prompt:
const result = await llm.analyze({
  prompt: "Break down this task into epics, tickets, and subtasks...",
  content: request.content
});
```

### `identifyRequiredSkills(text: string)`
**Future Enhancement**: Use LLM for more accurate skill extraction
```typescript
// Future: LLM can identify nuanced skill requirements
const skills = await llm.extractSkills(text);
```

### `generateRiskMitigation(tickets: Ticket[])`
**Future Enhancement**: Generate contextual mitigation strategies
```typescript
// Future: LLM can provide specific, actionable mitigation
const mitigations = await llm.suggestMitigations(tickets);
```

## Database Migration

Run the migration to set up new tables:

```sql
-- Run in Supabase SQL Editor
\i database/migrations/002_add_task_breakdown.sql
```

This creates:
- All new tables with RLS policies
- Indexes for performance
- Triggers for default agent skills
- Foreign key relationships

## Performance Considerations

1. **Lazy Loading**: Components fetch data only when needed
2. **Memoization**: Supabase client and computed values are memoized
3. **Batch Operations**: Multiple inserts use transactions
4. **Indexed Queries**: All foreign keys have indexes

## Future Enhancements

1. **LLM Integration**
   - Replace rule-based parsing with GPT-4/Claude
   - Generate better DoD and test notes
   - More accurate effort estimation

2. **Screenshot Analysis**
   - Vision API integration (GPT-4V, Claude 3)
   - Extract UI components and requirements
   - Generate tickets from mockups

3. **Advanced Dependencies**
   - Gantt chart visualization
   - Critical path analysis
   - Automatic scheduling

4. **Real-Time Collaboration**
   - Live updates via Supabase Realtime
   - Multi-user editing
   - Activity feed

5. **Analytics Dashboard**
   - Agent utilization charts
   - Velocity tracking
   - Burn-down charts

## Troubleshooting

### Tasks not appearing after breakdown
- Check browser console for errors
- Verify user is authenticated
- Ensure database migration ran successfully

### Auto-assignment not working
- Verify agents have skills configured
- Check that tickets have required_skills defined
- Ensure agent_performance records exist

### Skills not saving
- Check RLS policies are enabled
- Verify user_id matches authenticated user
- Look for unique constraint violations

## Contributing

When adding new features:

1. Update type definitions in `src/types/breakdown.ts`
2. Add database migrations in `database/migrations/`
3. Update hooks in `src/hooks/useBreakdown.ts`
4. Add UI components in `src/components/`
5. Update this documentation

## License

MIT
