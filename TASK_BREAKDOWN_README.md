# AI Task Breakdown System

## Quick Start

### Using the AI Breakdown Feature

1. **Open the Kanban Board**
2. **Click "AI Breakdown"** button in the toolbar
3. **Select Input Type**:
   - GitHub Issue
   - PRD/Spec
   - Screenshot Description
4. **Enter Content**: Paste your issue, PRD, or description
5. **Click "Analyze & Breakdown"**
6. **Review Generated Tasks**:
   - Epics (for large scopes)
   - Tasks with DoD, test notes, and risk flags
   - Subtasks and dependencies
7. **Click "Create Tasks"** to add them to your board

### Example Input

**GitHub Issue Example:**
```markdown
Title: User Authentication System

Content:
- Implement user login with email/password
- Add OAuth integration (Google, GitHub)
- Create password reset flow
- Add email verification
- Implement session management
- Add two-factor authentication (2FA)
```

**What Gets Generated:**
- **Epic**: User Authentication System (if scope is large enough)
- **Tasks**:
  - Backend Development
    - DoD: API endpoints documented, database migrations tested
    - Risk: Database schema changes require careful migration
    - Estimated: 16 hours
  - Frontend Development
    - DoD: UI matches design, components are accessible
    - Estimated: 12 hours
  - Integration & Testing
    - DoD: End-to-end tests passing, edge cases handled
    - Estimated: 8 hours
- **Dependencies**: Frontend depends on Backend, Integration depends on both
- **Auto-Assignment**: Best-fit agents assigned based on skills

## How It Works

### Task Analysis Algorithm

1. **Content Parsing**
   - Extracts requirements from bullet points, numbered lists
   - Identifies action words (implement, create, add, build)
   - Detects technical terms (API, database, frontend, etc.)

2. **Requirement Categorization**
   - **Feature**: User-facing functionality
   - **Technical**: Backend/infrastructure work
   - **Integration**: Connecting components
   - **Constraint**: Performance, security requirements

3. **Priority Detection**
   - Critical/Urgent: Priority 5
   - Important/High: Priority 4
   - Default: Priority 3
   - Nice to have/Optional: Priority 2
   - Trivial: Priority 1

4. **Task Grouping**
   - Groups by technical layer (backend, frontend, integration)
   - Creates logical task boundaries
   - Generates appropriate dependencies

5. **Epic Creation**
   - Created when:
     - More than 10 lines of content
     - Content exceeds 1000 characters
     - Multiple technical layers detected

### Auto-Assignment Logic

When tasks are created, agents are automatically assigned using:

**Scoring Factors:**
- **Skill Match (40%)**: Agent skills vs task requirements
- **Performance History (30%)**: Past completion metrics
- **Current Workload (30%)**: Available capacity

**Assignment Process:**
1. Filter available agents
2. Calculate match scores
3. Rank by suitability
4. Assign best match
5. Update agent workload

### Generated Task Structure

Each generated task includes:

```typescript
{
  title: "Backend Development",
  description: "Implement server-side logic, APIs, and database operations",
  priority: 4,
  estimatedHours: 16,
  tags: ["backend", "api", "database"],

  definitionOfDone: [
    "Code is written and follows coding standards",
    "Unit tests are written and passing",
    "API endpoints are documented",
    "Database migrations are created and tested"
  ],

  testNotes: [
    "Test all API endpoints with valid and invalid inputs",
    "Verify database operations and data integrity",
    "Test error handling and edge cases"
  ],

  riskFlags: [
    {
      severity: "low",
      category: "technical",
      description: "Database schema changes may require careful migration",
      mitigation: "Test migrations on staging environment first"
    }
  ],

  subtasks: [
    {
      title: "Design database schema",
      description: "Define tables, relationships, and constraints",
      estimatedHours: 2
    },
    {
      title: "Implement API endpoints",
      description: "Create REST/GraphQL endpoints for CRUD operations",
      estimatedHours: 6
    }
  ]
}
```

## Dependency Visualization

### Viewing Dependencies

1. **Click "Dependencies"** button in toolbar
2. **Review Relationships**:
   - Blue indicators: Blocking relationships
   - Orange indicators: Related tasks
   - Red highlighting: Circular dependencies (requires attention)
3. **Click on Tasks** to navigate/focus

### Dependency Types

- **Blocks**: Task A must complete before Task B can start
- **Related**: Tasks are connected but not blocking
- **Duplicate**: Tasks cover the same work (conflict)

### Circular Dependency Detection

The system uses Depth-First Search (DFS) to detect cycles:
- Warns when circular dependencies are found
- Highlights affected tasks in red
- Provides cycle chains for resolution

**Resolving Cycles:**
1. Identify the cycle path
2. Determine which dependency can be removed
3. Reorder or split tasks to break the cycle

## Agent Management

### Setting Up Agents

To get the best auto-assignments, configure your agents with:

**Skills:**
```typescript
{
  skillName: "React",
  level: "expert",  // beginner | intermediate | advanced | expert
  yearsExperience: 5
}
```

**Common Skills to Add:**
- Frontend: React, Vue, Angular, CSS, TypeScript
- Backend: Node.js, Python, Java, Go, Database
- DevOps: Docker, Kubernetes, CI/CD, AWS
- Other: API Design, Testing, UI/UX

### Performance Tracking

The system automatically tracks:
- **Tasks Completed**: Total finished tasks
- **On-Time Rate**: Percentage completed by deadline
- **Average Completion Time**: Hours per task
- **Quality Score**: 0-100 based on reviews

**Performance improves auto-assignment accuracy over time.**

### Workload Management

- System prevents overloading (default max: 5 concurrent tasks)
- Automatically updates when tasks are:
  - Assigned
  - Completed
  - Moved to 'done' status
- View workload distribution for team balancing

## Advanced Features

### Skill Gap Detection

```typescript
import { detectSkillGaps } from '@/lib/agentRoster';

const gaps = detectSkillGaps(agents, tasks);
// Returns: [{ skill: "Docker", gap: 3 }]
// Indicates 3 tasks need Docker skills but no agents have it
```

### Workload Rebalancing

```typescript
import { suggestReassignments } from '@/lib/autoAssignment';

const suggestions = suggestReassignments(tasks, agents);
// Returns tasks that should be moved to balance workload
```

### Custom Breakdown Templates

While not yet implemented, you can extend the breakdown logic:

```typescript
// In src/lib/taskBreakdown.ts
function generateCustomTemplate(input: TaskBreakdownInput) {
  // Your custom breakdown logic
}
```

## Best Practices

### Writing Better Input

**Do:**
- ✅ Use structured lists (bullets or numbers)
- ✅ Include technical details (API, database, UI)
- ✅ Specify priority keywords (critical, optional)
- ✅ Mention integrations and dependencies
- ✅ Add context about business value

**Don't:**
- ❌ Write long paragraphs without structure
- ❌ Be too vague ("make it better")
- ❌ Skip technical requirements
- ❌ Forget to mention constraints

### Example: Good vs Bad Input

**Bad Input:**
```
We need to improve the user experience
```

**Good Input:**
```
User Experience Improvements:
- Implement responsive navigation menu
- Add loading states for API calls
- Create error boundary components
- Optimize image loading with lazy loading
- Add accessibility features (ARIA labels, keyboard navigation)
```

### Managing Generated Tasks

1. **Review Before Creating**: Check tasks make sense
2. **Adjust Priorities**: Modify if auto-detected priority isn't right
3. **Edit Descriptions**: Add project-specific context
4. **Verify Dependencies**: Ensure logical flow
5. **Reassign if Needed**: Override auto-assignment when appropriate

## Integration with Existing Features

### Budget Management

The breakdown system integrates with budget tracking:
- Estimated hours feed into budget calculations
- Track actual vs estimated time
- Monitor budget burn rate per epic/task

### Sprint Planning

Generated tasks include sprint compatibility:
- Can be assigned to specific sprints
- Filter by sprint in kanban view
- Track sprint velocity with estimates

### Agent Performance

Auto-assignment improves with usage:
- Tracks completion times
- Adjusts scores based on quality
- Learns agent strengths over time

## Troubleshooting

### Tasks Seem Generic

**Issue**: Generated tasks lack project-specific detail

**Solution**:
- Add more context in input description
- Include technical stack details
- Mention existing architecture
- Edit generated tasks to add specifics

### Wrong Agents Assigned

**Issue**: Auto-assignment picks unexpected agents

**Solution**:
- Update agent skills to reflect expertise
- Check agent availability status
- Review current workload distribution
- Manually reassign and system will learn

### No Dependencies Created

**Issue**: Tasks are independent when they shouldn't be

**Solution**:
- Make dependencies explicit in input
- Use keywords like "after", "requires", "depends on"
- Manually add dependencies after creation

### Performance is Slow

**Issue**: Breakdown takes too long

**Solution**:
- Simplify input (break into multiple smaller breakdowns)
- Reduce number of existing tasks
- Archive completed tasks
- Consider pagination

## API Reference

### Main Functions

```typescript
// Task Breakdown
analyzeAndBreakdown(input: TaskBreakdownInput): Promise<BreakdownResult>

// Agent Scoring
calculateAgentScore(agent: CodingAgent, task: Task): number
rankAgentsForTask(agents: CodingAgent[], task: Task): RankedAgent[]

// Auto-Assignment
autoAssignTask(task: Task, agents: CodingAgent[], options?): AssignmentResult
autoAssignMultipleTasks(tasks: Task[], agents: CodingAgent[], dependencies): Map<string, string>

// Utility
detectCircularDependencies(tasks: Task[], dependencies: TaskDependency[]): string[][]
detectSkillGaps(agents: CodingAgent[], tasks: Task[]): SkillGap[]
suggestReassignments(tasks: Task[], agents: CodingAgent[]): Reassignment[]
```

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Open AI Breakdown panel (coming soon)
- `Ctrl/Cmd + D`: Toggle Dependency Graph (coming soon)
- `Ctrl/Cmd + N`: New Task (existing)

## Support

For issues or questions:
1. Check the [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
2. Review [troubleshooting](#troubleshooting) section
3. Open a GitHub issue with:
   - Input that caused the problem
   - Expected vs actual behavior
   - Screenshots if relevant

## Roadmap

### Planned Enhancements

**Q1 2024:**
- [ ] GPT-4 integration for smarter breakdown
- [ ] Visual dependency graph editor
- [ ] Custom breakdown templates
- [ ] Bulk edit generated tasks

**Q2 2024:**
- [ ] Real-time collaboration
- [ ] Agent scheduling integration
- [ ] Historical analytics dashboard
- [ ] Smart notifications

**Future:**
- [ ] Natural language task queries
- [ ] Automated testing recommendations
- [ ] Cost estimation integration
- [ ] Multi-language support
