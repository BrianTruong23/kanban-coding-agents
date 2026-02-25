# Task Breakdown and Agent Orchestration System

## Overview

This document describes the automated task breakdown and agent orchestration system implemented for the Kanban Coding Agents application. This system enables AI-powered analysis of issues, PRDs, and screenshots to automatically generate epics, tickets, and subtasks with comprehensive metadata including Definition of Done (DoD), test notes, risk flags, and dependency visualization.

## Features

### 1. Automated Task Breakdown

The system can analyze three types of input:
- **GitHub Issues**: Structured issue descriptions with acceptance criteria
- **Product Requirements Documents (PRDs)**: Detailed specifications and requirements
- **Screenshots**: Visual mockups with descriptive context

#### What Gets Generated

For each input, the system generates:

**Epic Level:**
- Title extracted from content
- Comprehensive description
- Priority assessment (1-5)
- Status tracking

**Ticket Level:**
- Individual tickets for each feature/requirement
- Unique ticket IDs (TICKET-1, TICKET-2, etc.)
- Detailed descriptions
- Priority assignments
- Estimated effort in hours
- Categorized tags

**Metadata:**
- **Definition of Done (DoD)**: Checklist of completion criteria
  - Implementation completed
  - Code reviewed
  - Tests written and passing
  - Documentation updated
  - Additional criteria based on content analysis

- **Test Notes**: Specific testing requirements
  - Authentication flow testing
  - API endpoint verification
  - Form validation checks
  - Performance benchmarks
  - Security audits

- **Risk Flags**: Identified potential issues
  - Type: technical, timeline, dependency, resource, security, performance
  - Severity: low, medium, high, critical
  - Description and mitigation plans

- **Dependencies**: Task relationships and blocking factors

### 2. Agent Roster Management

#### Enhanced Agent Profiles

Each agent now has:

**Skills System:**
- Skill name and category
- Proficiency levels (1-5)
- Categories: frontend, backend, devops, mobile, testing, database, security, ml, other

**Specializations:**
- Areas of expertise (e.g., "UI/UX", "API Development")
- Used for intelligent assignment matching

**Performance Metrics:**
- Tasks completed
- Tasks in progress
- Average completion time (hours)
- Success rate (0-1)
- Quality score (0-5)
- Current workload
- Last active timestamp

**Availability:**
- Available: Ready for new assignments
- Busy: Currently at capacity
- Offline: Not available

**Workload Management:**
- Max concurrent tasks setting
- Current workload tracking
- Automatic capacity calculation

### 3. Auto-Assignment System

The system scores agents for each ticket based on:

**Skill Matching (Weight: 2-3x):**
- Matches ticket requirements to agent skills
- Considers proficiency levels
- Checks specializations
- Keyword analysis from ticket content

**Workload Balancing (Weight: 1-2x):**
- Prefers agents with lower current workload
- Respects max concurrent task limits
- Distributes work evenly when enabled

**Performance History (Weight: 1.5x):**
- Success rate consideration
- Quality score weighting
- Average completion time
- High performers matched to high-priority tasks

**Availability Bonus:**
- Available agents get priority
- Busy agents still considered but scored lower

#### Auto-Assignment Configuration

Configurable settings:
- `considerSkills`: Enable skill-based matching
- `considerWorkload`: Enable workload balancing
- `considerPerformance`: Use performance metrics
- `preferSpecialists`: Weight specialists higher
- `balanceWorkload`: Prioritize even distribution

### 4. Dependency Visualization

**Dependency Graph:**
- Visual representation of ticket dependencies
- Identifies blocking relationships
- Calculates critical path
- Highlights bottlenecks

**Dependency Analysis:**
- Direct dependencies (A depends on B)
- Blocked by relationships (B blocks A)
- Critical path identification
- Depth calculation for scheduling

## Architecture

### Data Types

#### Epic
```typescript
interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
  updatedAt: number;
}
```

#### Ticket
```typescript
interface Ticket {
  id: string;
  epicId: string;
  taskId: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgentId?: string;
  definitionOfDone: string[];
  testNotes: string;
  riskFlags: RiskFlag[];
  dependencies: string[];
  estimatedHours?: number;
  tags: string[];
  sprint?: string;
}
```

#### EnhancedAgent
```typescript
interface EnhancedAgent {
  id: string;
  name: string;
  skills: AgentSkill[];
  specializations: string[];
  availability: 'available' | 'busy' | 'offline';
  maxConcurrentTasks: number;
  performanceMetrics: AgentPerformanceMetrics;
}
```

### Services

#### TaskBreakdownService
Located: `src/services/taskBreakdownService.ts`

Key methods:
- `breakdownTask(input)`: Main analysis entry point
- `analyzeContent(input)`: Content parsing and feature extraction
- `detectPriority(content)`: Priority determination
- `extractFeatures(content)`: Feature identification
- `generateDoD(content)`: DoD generation
- `generateTestNotes(content)`: Test requirements
- `identifyRisks(content)`: Risk analysis
- `estimateEffort(content)`: Effort estimation
- `buildDependencyGraph(tickets)`: Dependency mapping
- `analyzeDependencies(tickets)`: Critical path analysis

#### AgentAssignmentService
Located: `src/services/agentAssignmentService.ts`

Key methods:
- `assignAgentsToTickets(tickets, agents, config)`: Bulk assignment
- `scoreAgentsForTicket(ticket, agents, workloads, config)`: Agent scoring
- `calculateAgentScore(ticket, agent, workload, config)`: Score calculation
- `calculateSkillMatch(ticket, agent)`: Skill matching algorithm
- `extractTicketRequirements(ticket)`: Requirement extraction
- `calculatePerformanceScore(agent)`: Performance evaluation
- `suggestAgentForTicket(ticket, agents)`: Single ticket recommendation
- `getTopAgentRecommendations(ticket, agents, topN)`: Multiple suggestions

### Components

#### TaskBreakdownModal
Located: `src/components/TaskBreakdownModal.tsx`

Features:
- Input type selection (Issue, PRD, Screenshot)
- Content editor with examples
- Context field for additional information
- Real-time validation
- Processing state management

#### BreakdownResultsModal
Located: `src/components/BreakdownResultsModal.tsx`

Features:
- Epic overview display
- Expandable ticket list
- DoD checklist visualization
- Test notes display
- Risk flag presentation with severity colors
- Dependency graph visualization
- Critical path highlighting
- Accept/reject workflow

#### AgentRosterModal
Located: `src/components/AgentRosterModal.tsx`

Features:
- Grid view of all agents
- Skill and specialization display
- Performance metrics dashboard
- Availability status
- Workload visualization
- Edit/delete capabilities
- Real-time metric updates

### Database Schema

New tables added in `database/schema_orchestration.sql`:

**epics**: Epic-level task groupings
**tickets**: Enhanced tasks with DoD, test notes, risks
**risk_flags**: Individual risk items
**agent_skills**: Agent skill definitions
**agents** (extended): Additional columns for performance metrics

Key additions to agents table:
- specializations (text[])
- availability (enum)
- max_concurrent_tasks (integer)
- tasks_completed (integer)
- tasks_in_progress (integer)
- average_completion_time (numeric)
- success_rate (numeric)
- quality_score (numeric)
- workload (numeric)
- last_active (timestamp)

### Hooks

#### useEnhancedAgents
Located: `src/hooks/useEnhancedAgents.ts`

Provides:
- Agent fetching with skills and metrics
- Real-time updates
- CRUD operations
- Performance metric tracking

## Usage Guide

### Running Task Breakdown

1. Click the "AI Breakdown" button in the top navigation
2. Select input type (Issue, PRD, or Screenshot)
3. Paste your content or description
4. Optionally add context
5. Click "Analyze & Break Down"
6. Review the generated results
7. Accept to create tasks

### Managing Agent Roster

1. Click the "Agents" button in navigation
2. View all agents with their metrics
3. Edit agent details, skills, or availability
4. Monitor performance metrics
5. Adjust workload capacity as needed

### Understanding Risk Flags

Risk flags are color-coded by severity:
- **Critical** (Red): Immediate attention required
- **High** (Orange): Important consideration
- **Medium** (Yellow): Should be addressed
- **Low** (Blue): Minor consideration

Each risk includes:
- Type classification
- Description of the risk
- Mitigation plan recommendation

### Dependency Management

Dependencies are automatically detected and visualized:
- **Direct Dependencies**: Tasks that must complete first
- **Blocked By**: Other tasks waiting on this one
- **Critical Path**: Tasks that directly impact timeline

## Configuration

### Auto-Assignment Weights

Default weights can be adjusted in `AgentAssignmentService`:
```typescript
const skillWeight = config.preferSpecialists ? 3 : 2;
const workloadWeight = config.balanceWorkload ? 2 : 1;
const performanceWeight = 1.5;
```

### Risk Detection Keywords

Risk detection can be customized by modifying the keyword lists in `TaskBreakdownService.identifyRisks()`:
- Technical: 'migration', 'refactor'
- Dependency: 'third-party', 'library', 'integration'
- Timeline: 'complex', 'large', 'extensive'
- Security: 'authentication', 'security', 'password', 'token'
- Performance: 'performance', 'optimization', 'scale'

### Skill Categories

Available skill categories defined in `agentRoster.ts`:
- frontend
- backend
- devops
- mobile
- testing
- database
- security
- ml
- other

## Best Practices

### Writing Effective Input Content

**For Issues:**
- Start with a clear title
- List specific requirements
- Include acceptance criteria
- Mention technical constraints
- Add any relevant context

**For PRDs:**
- Provide comprehensive overview
- Break down into clear sections
- Include success metrics
- Specify timeline if relevant
- List dependencies and constraints

**For Screenshots:**
- Describe what's shown clearly
- Mention specific changes needed
- Include design requirements
- Note any interactions or behaviors

### Managing Agent Skills

1. Keep skill lists current and accurate
2. Use proficiency levels honestly (1=beginner, 5=expert)
3. Add specializations for unique expertise
4. Update performance metrics regularly
5. Adjust availability based on actual capacity

### Risk Mitigation

1. Review all generated risk flags
2. Prioritize critical and high severity risks
3. Create mitigation tasks if needed
4. Monitor risks throughout development
5. Update risk status as work progresses

## Troubleshooting

### No Tickets Generated

**Cause**: Content too short or unstructured
**Solution**: Provide more detailed, structured content with clear features/requirements

### Poor Skill Matching

**Cause**: Agent skills not properly defined
**Solution**: Ensure agents have skills added with appropriate proficiency levels

### Incorrect Priority Detection

**Cause**: Missing priority keywords
**Solution**: Include words like "critical", "urgent", "important", "low priority" in content

### Dependencies Not Detected

**Cause**: Dependencies must be manually specified in current version
**Solution**: Future enhancement will improve automatic dependency detection

## Future Enhancements

Potential improvements:
1. Machine learning for better requirement extraction
2. Screenshot OCR and visual analysis
3. Integration with GitHub API for direct issue import
4. Real-time collaboration on task breakdown
5. Advanced dependency inference algorithms
6. Historical data for effort estimation
7. Team velocity tracking
8. Sprint planning automation
9. Automated task assignment on creation
10. Performance metric automation based on task completion

## API Reference

### TaskBreakdownService.breakdownTask()

```typescript
static async breakdownTask(input: TaskBreakdownInput): Promise<TaskBreakdownResult>
```

Parameters:
- `input.type`: 'issue' | 'prd' | 'screenshot'
- `input.content`: string (main content to analyze)
- `input.context`: string? (optional context)
- `input.attachments`: string[]? (URLs or file paths)

Returns:
- `epic`: Epic data without IDs
- `tickets`: Array of ticket data
- `suggestedAssignments`: Map of ticketId to agentId
- `dependencyGraph`: Array of dependency nodes

### AgentAssignmentService.assignAgentsToTickets()

```typescript
static assignAgentsToTickets(
  tickets: Ticket[],
  agents: EnhancedAgent[],
  config?: AutoAssignmentConfig
): Map<string, string>
```

Parameters:
- `tickets`: Array of tickets to assign
- `agents`: Available enhanced agents
- `config`: Assignment configuration options

Returns:
- Map of ticketId to assigned agentId

## License

This feature is part of the Kanban Coding Agents project and follows the same MIT license.
