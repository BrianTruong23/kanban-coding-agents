# Task Breakdown & Agent Orchestration Demo Examples

This document contains example inputs and expected outputs for the automated task breakdown and agent orchestration system.

## Example 1: E-Commerce Checkout Feature

### Input (GitHub Issue Format)

```markdown
# Feature: Implement Shopping Cart and Checkout Flow

## Description
We need to implement a complete shopping cart and checkout system for our e-commerce platform.

## Requirements
- Shopping cart with add/remove/update quantity
- Persistent cart across sessions
- Guest checkout support
- Multiple payment methods (Credit Card, PayPal)
- Order confirmation email
- Inventory validation before checkout
- Tax and shipping calculation
- Promo code support
- Mobile responsive design

## Technical Notes
- Use Redux for cart state management
- Integrate with Stripe API for payments
- Use SendGrid for email notifications
- PostgreSQL for order storage

## Acceptance Criteria
- Users can add items to cart from product pages
- Cart persists after browser refresh
- Checkout works for both guest and registered users
- Payment processing is secure and PCI compliant
- Users receive order confirmation within 1 minute

## Risks
- Payment integration complexity
- High traffic during checkout could cause performance issues
- Tax calculation varies by region
```

### Expected Output

**Summary:**
Generated 1 epic(s), 9 ticket(s), and 54 subtask(s). Total estimated effort: 234 story_points.

**Epic: EPIC-1 - Shopping Cart and Checkout Flow**
- Status: planning
- Priority: 3
- Goals:
  - Complete all tickets related to shopping cart and checkout
  - Meet acceptance criteria
  - Pass all tests

**Tickets:**
1. **EPIC-1-T1**: Shopping cart with add/remove/update quantity
   - Type: feature
   - Priority: 4
   - Estimated Effort: 8 points
   - Risk Flags: None
   - Test Notes: Unit, Integration, E2E tests

2. **EPIC-1-T2**: Persistent cart across sessions
   - Type: task
   - Priority: 3
   - Estimated Effort: 5 points
   - Risk Flags: None
   - Test Notes: Unit, Integration tests

3. **EPIC-1-T3**: Guest checkout support
   - Type: feature
   - Priority: 4
   - Estimated Effort: 7 points
   - Risk Flags: None
   - Test Notes: Unit, Integration, E2E tests

4. **EPIC-1-T4**: Multiple payment methods integration
   - Type: feature
   - Priority: 5
   - Estimated Effort: 13 points
   - Risk Flags:
     - Level: MEDIUM - External dependencies may cause delays
     - Impact: Integration issues could block progress
   - Test Notes: Unit, Integration, E2E tests

5. **EPIC-1-T5**: Order confirmation email
   - Type: task
   - Priority: 3
   - Estimated Effort: 5 points
   - Risk Flags: None
   - Test Notes: Unit, Integration tests

6. **EPIC-1-T6**: Inventory validation before checkout
   - Type: improvement
   - Priority: 4
   - Estimated Effort: 6 points
   - Risk Flags: None
   - Test Notes: Unit, Integration tests

7. **EPIC-1-T7**: Tax and shipping calculation
   - Type: feature
   - Priority: 3
   - Estimated Effort: 8 points
   - Risk Flags:
     - Level: MEDIUM - Task complexity may require additional time
   - Test Notes: Unit, Integration tests

8. **EPIC-1-T8**: Promo code support
   - Type: feature
   - Priority: 2
   - Estimated Effort: 5 points
   - Risk Flags: None
   - Test Notes: Unit, Integration tests

9. **EPIC-1-T9**: Mobile responsive design
   - Type: improvement
   - Priority: 4
   - Estimated Effort: 6 points
   - Risk Flags: None
   - Test Notes: Unit, Integration, E2E tests

**Dependencies:**
- None detected (all tickets can be worked in parallel or have implicit ordering)

---

## Example 2: Agent Assignment for Frontend Task

### Scenario

Assigning a complex React component development task to the best available agent.

### Input Criteria

```typescript
const criteria: AssignmentCriteria = {
  requiredSkills: [
    { category: 'frontend', name: 'React', proficiency: 4 },
    { category: 'frontend', name: 'TypeScript', proficiency: 3 },
  ],
  preferredSkills: [
    { category: 'testing', name: 'Jest', proficiency: 3 },
    { category: 'design', name: 'CSS', proficiency: 3 },
  ],
  taskType: 'feature',
  taskComplexity: 4,
  estimatedEffort: 13,
  priority: 5,
  deadline: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
};
```

### Available Agents

**Agent 1: Sarah Chen**
- Skills: Frontend (5), Backend (3), Testing (4), Design (4)
- Availability: Available, 80% capacity
- Performance: 95% success rate, 0.92 quality score
- Current Tasks: 2/5

**Agent 2: Mike Rodriguez**
- Skills: Frontend (4), Database (5), DevOps (4)
- Availability: Busy, 60% capacity
- Performance: 88% success rate, 0.85 quality score
- Current Tasks: 3/5

**Agent 3: Emma Wilson**
- Skills: Frontend (3), Backend (4), Testing (3)
- Availability: Available, 90% capacity
- Performance: 82% success rate, 0.78 quality score
- Current Tasks: 1/5

### Expected Assignment Result

```typescript
{
  agentId: "sarah-chen-id",
  confidence: 0.87,
  reasons: [
    "Matches all required skills",
    "Matches 100% of preferred skills",
    "High skill proficiency",
    "Currently available",
    "High availability (80%+ capacity)",
    "Can handle more tasks (2/5)",
    "Available for urgent deadline",
    "Excellent success rate (90%+)",
    "High quality work (80%+)",
    "Reliable on-time delivery (85%+)",
    "Recently active",
    "Prefers feature tasks",
    "Task complexity matches preference"
  ],
  alternatives: [
    { agentId: "mike-rodriguez-id", confidence: 0.68 },
    { agentId: "emma-wilson-id", confidence: 0.54 }
  ]
}
```

**Why Sarah Chen was selected:**
1. **Perfect skill match** (40/40 points): Has React proficiency of 5 (required 4), TypeScript 4 (required 3), plus preferred skills in testing and design
2. **High availability** (19/20 points): Currently available status, 80% capacity, can take more tasks
3. **Excellent performance** (24/25 points): 95% success rate, 92% quality score, strong on-time delivery
4. **Good fit** (13/15 points): Prefers feature tasks, comfortable with complexity level 4

**Total Score: 87/100 = 0.87 confidence**

---

## Example 3: Bulk Agent Assignment

### Scenario

Auto-assigning 5 tickets from the e-commerce checkout epic to available agents.

### Input

```typescript
const tickets = [
  {
    id: '1',
    title: 'Shopping cart with add/remove/update',
    type: 'feature',
    priority: 4,
    estimatedEffort: 8,
    tags: ['frontend', 'react', 'redux'],
  },
  {
    id: '2',
    title: 'Payment methods integration',
    type: 'feature',
    priority: 5,
    estimatedEffort: 13,
    tags: ['backend', 'api', 'security'],
  },
  {
    id: '3',
    title: 'Order confirmation email',
    type: 'task',
    priority: 3,
    estimatedEffort: 5,
    tags: ['backend', 'email'],
  },
  {
    id: '4',
    title: 'Mobile responsive design',
    type: 'improvement',
    priority: 4,
    estimatedEffort: 6,
    tags: ['frontend', 'design', 'css'],
  },
  {
    id: '5',
    title: 'Database schema for orders',
    type: 'task',
    priority: 5,
    estimatedEffort: 5,
    tags: ['database', 'backend'],
  },
];

const agents = [
  // Sarah: Frontend specialist
  // Mike: Backend/Database specialist
  // Emma: Full-stack generalist
  // Alex: Security/DevOps specialist
  // Lisa: Design/Frontend specialist
];
```

### Expected Assignment Results

```typescript
const assignments = new Map([
  ['1', { agentId: 'sarah', confidence: 0.91 }],    // Frontend task → Sarah
  ['2', { agentId: 'alex', confidence: 0.85 }],     // Security task → Alex
  ['3', { agentId: 'mike', confidence: 0.82 }],     // Backend task → Mike
  ['4', { agentId: 'lisa', confidence: 0.88 }],     // Design task → Lisa
  ['5', { agentId: 'mike', confidence: 0.94 }],     // Database task → Mike
]);
```

**Assignment Strategy:**
- High-priority tasks (5) assigned first
- Skills matched to agent expertise
- Workload balanced (Mike gets 2 tasks as he's the only backend specialist)
- Design and frontend tasks separated between specialists

---

## Example 4: Performance Update After Task Completion

### Scenario

Updating an agent's performance metrics after successfully completing a task.

### Input

```typescript
const agent = {
  id: 'sarah-chen',
  name: 'Sarah Chen',
  performance: {
    tasksCompleted: 45,
    tasksInProgress: 2,
    tasksFailed: 3,
    successRate: 0.9375, // 45/(45+3)
    averageCompletionTime: 6.2,
    onTimeDeliveryRate: 0.88,
    qualityScore: 0.89,
    totalHoursWorked: 279,
  },
  // ... other fields
};

// Task was completed successfully
const taskCompleted = true;
const actualEffort = 7; // hours
const estimatedEffort = 8; // hours
const onTime = true;
const qualityRating = 0.95; // Peer review score
```

### Expected Updated Performance

```typescript
const updatedAgent = {
  // ... same other fields
  performance: {
    tasksCompleted: 46,           // +1
    tasksInProgress: 1,           // -1
    tasksFailed: 3,               // unchanged
    successRate: 0.9388,          // 46/(46+3) = 0.9388
    averageCompletionTime: 6.18,  // (6.2*48 + 7)/49
    onTimeDeliveryRate: 0.8816,   // (0.88*48 + 1)/49
    qualityScore: 0.8914,         // (0.89*48 + 0.95)/49
    totalHoursWorked: 286,        // 279 + 7
    lastActiveAt: 1234567890,     // Current timestamp
  },
  updatedAt: 1234567890,
};
```

**Interpretation:**
- Success rate slightly decreased (rounding)
- Average completion time improved (task done faster than average)
- On-time delivery rate improved
- Quality score improved (0.95 > 0.89 average)
- Agent is learning and improving over time

---

## Example 5: Dependency Detection

### Input Tasks

```typescript
const tickets = [
  {
    id: 't1',
    title: 'Design database schema',
    epicId: 'epic-1',
  },
  {
    id: 't2',
    title: 'Implement user authentication',
    epicId: 'epic-1',
  },
  {
    id: 't3',
    title: 'Create user profile page',
    epicId: 'epic-1',
  },
  {
    id: 't4',
    title: 'Test user registration flow',
    epicId: 'epic-1',
  },
];
```

### Detected Dependencies

```typescript
const dependencies = [
  {
    id: 'd1',
    sourceTaskId: 't1', // Design database
    targetTaskId: 't2', // Authentication
    type: 'blocks',
    reason: 'Database schema must exist before authentication can be implemented',
  },
  {
    id: 'd2',
    sourceTaskId: 't2', // Authentication
    targetTaskId: 't3', // Profile page
    type: 'blocks',
    reason: 'User must be authenticated to access profile',
  },
  {
    id: 'd3',
    sourceTaskId: 't3', // Profile page
    targetTaskId: 't4', // Testing
    type: 'blocks',
    reason: 'Implementation must be complete before testing',
  },
];
```

**Dependency Chain:**
```
t1 (Design) → t2 (Auth) → t3 (Profile) → t4 (Test)
```

**Visualization:**
- t1 blocks t2, t3, and t4
- t2 blocks t3 and t4
- t3 blocks t4
- Proper sequence: t1 → t2 → t3 → t4

---

## Example 6: Risk Flag Generation

### Input Content

```markdown
# Complex Data Migration Task

We need to migrate 10TB of customer data from MongoDB to PostgreSQL. This is a
critical operation that must be done with zero downtime. The migration is complex
due to schema differences and will require careful planning.

Third-party APIs are involved for data validation during migration.
```

### Generated Risk Flags

```typescript
const riskFlags = [
  {
    id: 'r1',
    level: 'high',
    description: 'Complex data migration with zero downtime requirement',
    impact: 'System unavailability could affect all users',
    probability: 'medium',
    mitigation: 'Implement blue-green deployment strategy, extensive testing in staging',
  },
  {
    id: 'r2',
    level: 'medium',
    description: 'Task complexity may require additional time',
    impact: 'May affect timeline and project deadlines',
    probability: 'medium',
    mitigation: 'Allocate buffer time, senior engineer oversight',
  },
  {
    id: 'r3',
    level: 'medium',
    description: 'External dependencies may cause delays',
    impact: 'Third-party API issues could block progress',
    probability: 'medium',
    mitigation: 'Have fallback validation strategy, monitor API status',
  },
];
```

---

## Example 7: Workload Summary

### Input Agents

5 agents with varying workloads

### Output

```typescript
const workloadSummary = [
  {
    agentId: 'sarah',
    name: 'Sarah Chen',
    currentTasks: 4,
    capacity: 80,
    utilizationRate: 80, // 4/5 = 80%
  },
  {
    agentId: 'mike',
    name: 'Mike Rodriguez',
    currentTasks: 5,
    capacity: 60,
    utilizationRate: 100, // 5/5 = 100% (at capacity)
  },
  {
    agentId: 'emma',
    name: 'Emma Wilson',
    currentTasks: 1,
    capacity: 90,
    utilizationRate: 20, // 1/5 = 20%
  },
  {
    agentId: 'alex',
    name: 'Alex Kumar',
    currentTasks: 3,
    capacity: 70,
    utilizationRate: 60, // 3/5 = 60%
  },
  {
    agentId: 'lisa',
    name: 'Lisa Park',
    currentTasks: 2,
    capacity: 85,
    utilizationRate: 40, // 2/5 = 40%
  },
];
```

**Analysis:**
- **Overloaded**: Mike (100% utilization) - should not receive new tasks
- **Well-balanced**: Sarah (80%), Alex (60%)
- **Underutilized**: Emma (20%), Lisa (40%) - can take more work
- **Recommendation**: Assign new high-priority tasks to Emma or Lisa

---

## Testing the System

### Quick Test Script

```typescript
// 1. Test task breakdown
const service = new TaskBreakdownService();
const result = await service.breakdownTasks({
  type: 'issue',
  content: 'Implement user authentication with OAuth2 and JWT tokens',
});
console.log('Generated:', result.epics.length, 'epics,', result.tickets.length, 'tickets');

// 2. Test agent assignment
const assignment = AgentOrchestrationService.assignBestAgent(agents, {
  requiredSkills: [{ category: 'backend', proficiency: 3 }],
  priority: 5,
});
console.log('Best agent:', assignment.agentId, 'with confidence:', assignment.confidence);

// 3. Test performance update
const updated = AgentOrchestrationService.updateAgentPerformance(
  agent,
  true,
  5,
  6,
  true,
  0.95
);
console.log('Updated success rate:', updated.performance.successRate);
```

---

## Conclusion

These examples demonstrate the power and flexibility of the automated task breakdown and agent orchestration system. The system can:

1. ✅ Parse complex requirements and generate structured task hierarchies
2. ✅ Identify risks and generate mitigation strategies
3. ✅ Create comprehensive test plans
4. ✅ Detect task dependencies automatically
5. ✅ Intelligently assign agents based on multiple factors
6. ✅ Track and update performance metrics
7. ✅ Balance workload across team members
8. ✅ Provide actionable insights and recommendations

Use these examples as templates for your own projects!
