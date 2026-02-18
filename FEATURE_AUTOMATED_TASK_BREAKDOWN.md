# Automated Task Breakdown and Agent Orchestration

## Overview

This feature provides an intelligent system for automatically breaking down issues, PRDs, and requirements into structured tasks with proper hierarchy, dependencies, and automatic agent assignment based on skills and performance.

## Features

### 1. Automated Task Breakdown
- **Input Sources**: Support for issues, PRDs, screenshots, and plain text
- **Smart Parsing**: Automatically identifies features, requirements, technical notes, and risks
- **Hierarchical Structure**: Creates epics, tickets, and subtasks with proper relationships
- **Definition of Done**: Auto-generates completion criteria for each task
- **Test Notes**: Identifies testing requirements based on task content
- **Risk Assessment**: Flags potential risks with suggested mitigations

### 2. Agent Orchestration
- **Skill-Based Matching**: Assigns tasks to agents based on required skills and proficiency
- **Performance Metrics**: Tracks completion time, quality scores, and on-time delivery
- **Workload Balancing**: Considers current agent load and availability
- **Auto-Assignment**: Suggests optimal agent assignments with confidence scores

### 3. Dependency Management
- **Visual Graph**: Interactive dependency visualization
- **Relationship Types**: Support for "blocks", "relates-to", and "duplicates"
- **Automatic Detection**: Identifies sequential dependencies between tasks

### 4. Agent Roster Management
- **Skills Tracking**: Categorize and rate agent skills by proficiency
- **Performance Dashboard**: Monitor tasks completed, quality scores, and bug rates
- **Availability Status**: Track agent workload and availability

## User Guide

### Using the Task Breakdown Wizard

1. **Access the Wizard**
   - Click the "Auto Breakdown" button in the header
   - The wizard modal will open

2. **Select Source Type**
   - Choose between: Text, Issue, or PRD
   - Each type expects different formatting

3. **Input Your Content**
   - Paste your content in the text area
   - Use markdown formatting for better parsing

4. **Supported Format**
   ```markdown
   # Title: Project Name

   ## Features
   - Feature 1: Description
   - Feature 2: Description

   ## Requirements
   - Requirement 1
   - Requirement 2

   ## Technical Notes
   - Tech consideration 1
   - Tech consideration 2

   ## Risks
   - Risk 1
   - Risk 2
   ```

5. **Review Breakdown**
   - The wizard will show all generated tasks
   - Each task includes:
     - Task ID
     - Type (epic, ticket, subtask)
     - Priority level
     - Definition of done
     - Risk flags (if any)
     - Estimated hours
   - Select/deselect tasks as needed

6. **View Dependencies**
   - If tasks have dependencies, a graph visualization will appear
   - Shows blocking relationships between tasks

7. **Create Tasks**
   - Click "Create X Task(s)" to add selected tasks to your board
   - Tasks will appear in the backlog

### Managing Agents

1. **Open Agent Roster**
   - Click the "Agents" button in the header
   - The roster manager will open

2. **View Agent Details**
   - Click on any agent in the sidebar
   - View three tabs:
     - **Overview**: Status, quality score, and task metrics
     - **Skills**: List of skills with proficiency levels
     - **Performance**: Detailed performance metrics

3. **Agent Metrics**
   - **Status**: Available, Busy, or Offline
   - **Current Load**: Number of tasks assigned vs. max capacity
   - **Code Quality Score**: 0-100 rating
   - **Tasks Completed**: Total completed tasks
   - **On-Time Delivery**: Percentage of tasks delivered on time
   - **Bug Rate**: Bugs per 100 tasks
   - **Average Completion Time**: In hours

### Viewing Dependencies

Dependencies are automatically visualized when using the breakdown wizard. The graph shows:
- **Nodes**: Represent individual tasks
- **Edges**: Show relationships between tasks
- **Colors**: Indicate task status (backlog, in-progress, review, done)
- **Risk Indicators**: Tasks with risk flags are marked

## Technical Architecture

### Components

```
src/
├── components/
│   ├── TaskBreakdownWizard.tsx    # Main breakdown UI
│   ├── DependencyGraph.tsx         # Dependency visualization
│   └── AgentRosterManager.tsx      # Agent management UI
├── lib/
│   ├── taskBreakdown.ts            # Breakdown logic
│   └── agentMatching.ts            # Agent assignment logic
└── types/
    ├── taskHierarchy.ts            # Task hierarchy types
    └── agentSkills.ts              # Agent skill types
```

### Task Breakdown Service

The `TaskBreakdownService` class handles:

1. **Content Parsing**
   - Extracts sections (features, requirements, risks)
   - Identifies bullet points and numbered lists
   - Detects markdown headers

2. **Hierarchy Generation**
   - Creates parent-child relationships
   - Determines task types (epic, ticket, subtask)
   - Sets appropriate priorities

3. **Metadata Generation**
   - Definition of Done items
   - Test requirements based on keywords
   - Risk assessment and mitigation
   - Estimated hours based on complexity

4. **Dependency Detection**
   - Sequential relationships (setup → implementation → testing)
   - Keyword-based detection
   - Parent-child dependencies

### Agent Matching Service

The `AgentMatchingService` class provides:

1. **Scoring Algorithm**
   - 40% Skill matching
   - 30% Availability
   - 20% Performance metrics
   - 10% Workload balance

2. **Skill Extraction**
   - Analyzes task title, description, and tags
   - Matches against agent skill categories
   - Considers proficiency levels

3. **Auto-Assignment**
   - Finds best match for each task
   - Minimum score threshold of 50
   - Prioritizes high-priority tasks

## Database Schema

### Core Tables

**agent_skills**
- Tracks agent expertise
- Categories: frontend, backend, database, devops, testing, mobile, design, architecture
- Proficiency levels: 1-5

**agent_performance**
- Metrics: tasks completed/in-progress, completion time, quality score
- Rates: on-time delivery, bug rate, collaboration score

**agent_availability**
- Status: available, busy, offline
- Load tracking: current vs. max tasks

**definition_of_done**
- Completion checklist items per task
- Tracking completed state

**test_notes**
- Test type: unit, integration, e2e, manual
- Priority levels: 1-3

**risk_flags**
- Risk levels: low, medium, high, critical
- Mitigation strategies

**task_dependencies**
- Dependency types: blocks, relates-to, duplicates
- Bidirectional relationships

### Enhanced Task Fields

- `type`: epic, ticket, or subtask
- `parent_id`: For hierarchical relationships
- `estimated_hours`: Time estimate
- `actual_hours`: Time tracked
- `completed_at`: Completion timestamp

## API Usage Examples

### Breakdown a Task

```typescript
import { TaskBreakdownService } from '@/lib/taskBreakdown';

const result = await TaskBreakdownService.breakdownTask({
  source: 'prd',
  content: `
    # User Authentication

    ## Features
    - Login page with email/password
    - OAuth integration (Google, GitHub)
    - Password reset flow

    ## Requirements
    - Email verification required
    - Session management with JWT
    - Rate limiting on login attempts

    ## Technical Notes
    - Use Supabase Auth
    - Implement refresh token rotation
    - Add CSRF protection

    ## Risks
    - Security vulnerabilities in auth flow
    - Email deliverability issues
  `,
  context: {
    projectType: 'web-app',
    techStack: ['React', 'Next.js', 'Supabase']
  }
});

console.log(result.epics);       // Array of epic tasks
console.log(result.tickets);     // Array of ticket tasks
console.log(result.subtasks);    // Array of subtask tasks
console.log(result.dependencies); // Dependency relationships
```

### Find Best Agent for Task

```typescript
import { AgentMatchingService } from '@/lib/agentMatching';

const bestMatch = AgentMatchingService.findBestAgent(task, agents);

if (bestMatch) {
  console.log(`Best agent: ${bestMatch.agentId}`);
  console.log(`Score: ${bestMatch.score}/100`);
  console.log('Reasons:');
  bestMatch.reasons.forEach(reason => {
    console.log(`- ${reason.factor}: ${reason.description} (${reason.impact > 0 ? '+' : ''}${reason.impact})`);
  });
}
```

### Auto-Assign Multiple Tasks

```typescript
const assignments = AgentMatchingService.autoAssignTasks(tasks, agents);

assignments.forEach((agentId, taskId) => {
  console.log(`Task ${taskId} → Agent ${agentId}`);
});
```

## Customization

### Custom Breakdown Rules

You can extend the `TaskBreakdownService` to add custom parsing logic:

```typescript
// In taskBreakdown.ts
private static extractTags(feature: string): string[] {
  const tags: string[] = [];

  // Add your custom tag detection
  if (feature.match(/mobile|ios|android/i)) tags.push('mobile');
  if (feature.match(/ai|ml|machine learning/i)) tags.push('ai');

  return tags;
}
```

### Custom Scoring Weights

Adjust agent matching weights in `AgentMatchingService`:

```typescript
// In agentMatching.ts
private static scoreAgent(task, agent): AgentMatchScore {
  // Adjust these weights (must sum to 1.0)
  totalScore += skillScore * 0.5;      // 50% skills (default: 40%)
  totalScore += availabilityScore * 0.2; // 20% availability (default: 30%)
  totalScore += performanceScore * 0.2;  // 20% performance (default: 20%)
  totalScore += workloadScore * 0.1;    // 10% workload (default: 10%)

  return { agentId: agent.id, score: totalScore, reasons };
}
```

## Best Practices

1. **Task Breakdown**
   - Use clear, descriptive feature names
   - Include specific requirements
   - Document technical considerations
   - Identify risks early

2. **Agent Management**
   - Keep skills updated
   - Review performance metrics regularly
   - Balance workload across team
   - Update availability status

3. **Dependencies**
   - Minimize blocking dependencies
   - Use "relates-to" for loose coupling
   - Review dependency graph before starting work

4. **Quality**
   - Review auto-generated DoD items
   - Add test notes for complex features
   - Update risk mitigations as needed

## Troubleshooting

### Tasks Not Breaking Down Correctly

- **Issue**: Parser doesn't recognize sections
- **Solution**: Use markdown headers (`##`) for sections
- **Example**: `## Features` instead of `Features:`

### No Agent Suggestions

- **Issue**: No agents match the task requirements
- **Solution**:
  - Add more agents with relevant skills
  - Lower the scoring threshold
  - Manually assign agents

### Dependencies Not Showing

- **Issue**: Dependency graph is empty
- **Solution**: Ensure tasks have proper keywords like "setup", "test", or explicit dependency creation

### Performance Issues with Large Breakdowns

- **Issue**: UI slow with 50+ tasks
- **Solution**:
  - Break down into smaller chunks
  - Use selective task creation
  - Increase pagination limits

## Roadmap

Future enhancements:
- [ ] AI-powered breakdown using LLMs (GPT-4, Claude)
- [ ] Screenshot analysis for UI tasks
- [ ] Team collaboration on breakdowns
- [ ] Historical breakdown templates
- [ ] Advanced dependency types (finish-to-start, start-to-start)
- [ ] Agent recommendations based on past performance
- [ ] Automated sprint planning
- [ ] Integration with GitHub issues
- [ ] Slack notifications for assignments

## Contributing

To contribute to this feature:

1. Review the existing code in `src/lib/taskBreakdown.ts` and `src/lib/agentMatching.ts`
2. Add tests for new parsing rules or scoring logic
3. Update type definitions in `src/types/`
4. Document changes in this file

## License

This feature is part of the Kanban Coding Agents project. See main LICENSE file.
