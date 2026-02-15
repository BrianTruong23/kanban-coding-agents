# Task Orchestration Examples

This document provides practical examples of using the task orchestration system.

## Example 1: Breaking Down a User Authentication Feature

### Input (PRD Format):

```markdown
## User Authentication System

Implement a complete user authentication system with the following requirements:

### Core Features
- Email/password authentication with validation
- Social login integration (Google, GitHub)
- Password reset flow with email verification
- Session management and security
- Two-factor authentication (2FA)

### Technical Requirements
- Use JWT tokens for session management
- Implement rate limiting on login endpoints
- Store passwords securely with bcrypt
- Email verification required for new accounts
- Remember me functionality

### Security Considerations
- Implement CSRF protection
- Add brute-force attack prevention
- Secure session storage
- Password complexity requirements
```

### Generated Breakdown:

**Epic: User Authentication System**
- Priority: 4 (High)
- Estimated Effort: 48 hours

**Tickets:**

1. **Email/Password Authentication**
   - Priority: 5
   - Effort: 12h
   - DoD:
     - Email validation working
     - Password hashing with bcrypt
     - Login endpoint secure
     - Rate limiting implemented
   - Test Notes:
     - Test with valid/invalid credentials
     - Test password strength validation
     - Test rate limiting behavior
   - Risk Flags:
     - CRITICAL: Security-sensitive implementation requires careful review
   - Recommended Agent: Sarah Johnson (Backend specialist, 92% match)

2. **Social Login Integration**
   - Priority: 4
   - Effort: 16h
   - DoD:
     - Google OAuth working
     - GitHub OAuth working
     - Account linking implemented
   - Subtasks:
     - Configure OAuth providers
     - Implement OAuth callback handlers
     - Create account linking logic
     - Test integration
   - Recommended Agent: Mike Rodriguez (Full-stack, 85% match)

3. **Password Reset Flow**
   - Priority: 4
   - Effort: 10h
   - DoD:
     - Reset email sending
     - Token generation secure
     - Password update working
   - Risk Flags:
     - MEDIUM: Email integration may introduce reliability concerns
   - Recommended Agent: Sarah Johnson (88% match)

4. **Two-Factor Authentication**
   - Priority: 3
   - Effort: 10h
   - DoD:
     - TOTP implementation
     - QR code generation
     - Backup codes provided
   - Recommended Agent: Sarah Johnson (90% match)

## Example 2: Dashboard Analytics Feature

### Input (GitHub Issue Format):

```markdown
# Dashboard Analytics

We need to create an analytics dashboard with the following features:

- Real-time data aggregation from multiple sources
- Interactive charts (line, bar, pie)
- Date range filtering
- Export to PDF and CSV
- Customizable widget layout
- Performance optimization for large datasets

This is a high priority feature for Q1.
```

### Generated Breakdown:

**Epic: Dashboard Analytics**
- Priority: 4
- Estimated Effort: 56 hours

**Tickets:**

1. **Data Aggregation Backend**
   - Priority: 5
   - Effort: 14h
   - DoD:
     - API endpoints for metrics
     - Data aggregation queries optimized
     - Caching implemented
     - Real-time updates working
   - Risk Flags:
     - MEDIUM: Performance implications should be tested under load
   - Subtasks:
     - Design database schema
     - Create aggregation APIs
     - Implement caching layer
     - Add real-time updates
     - Test performance
   - Recommended Agent: Sarah Johnson (Backend, 94% match)

2. **Interactive Charts Component**
   - Priority: 4
   - Effort: 12h
   - DoD:
     - Chart library integrated
     - Line, bar, pie charts working
     - Responsive design
     - Interactions functional
   - Subtasks:
     - Research chart library
     - Implement chart components
     - Add interactivity
     - Test responsive design
   - Recommended Agent: Alex Chen (Frontend/UI, 96% match)

3. **Export Functionality**
   - Priority: 3
   - Effort: 10h
   - Recommended Agent: Mike Rodriguez (85% match)

## Example 3: Auto-Assignment in Action

### Scenario: Assigning a Complex Backend Task

```typescript
import { AgentOrchestrator } from '@/lib/agentOrchestration';

const ticket = {
  id: 'ticket-123',
  title: 'Implement GraphQL API with Subscriptions',
  description: 'Create a GraphQL API with real-time subscriptions for live updates',
  // ... other fields
};

const agents = [
  {
    id: 'agent-1',
    name: 'Sarah Johnson',
    skills: [
      { name: 'Backend Development', category: 'backend', level: 'expert' },
      { name: 'GraphQL', category: 'backend', level: 'advanced' },
      { name: 'Node.js', category: 'backend', level: 'expert' },
    ],
    performance: {
      tasksCompleted: 45,
      onTimeDeliveryRate: 92,
      qualityScore: 88,
    },
    availability: {
      currentCapacity: 60,
      currentTasks: ['task-1'],
    },
  },
  {
    id: 'agent-2',
    name: 'Alex Chen',
    skills: [
      { name: 'React', category: 'frontend', level: 'expert' },
      { name: 'GraphQL Client', category: 'frontend', level: 'intermediate' },
    ],
    performance: {
      tasksCompleted: 38,
      onTimeDeliveryRate: 95,
      qualityScore: 90,
    },
    availability: {
      currentCapacity: 80,
    },
  },
];

// Calculate scores
const scores = AgentOrchestrator.calculateAssignmentScores(ticket, agents);

// Result:
// [
//   {
//     agentId: 'agent-1',
//     score: 89,
//     skillMatch: 95,
//     availabilityScore: 60,
//     performanceScore: 90,
//     reasons: [
//       'Strong skill match (95%)',
//       'Excellent performance history (90%)',
//       'Good availability (60% capacity)'
//     ]
//   },
//   {
//     agentId: 'agent-2',
//     score: 51,
//     skillMatch: 40,
//     availabilityScore: 80,
//     performanceScore: 92,
//     reasons: [
//       'Moderate skill match (40%)',
//       'Excellent performance history (92%)'
//     ]
//   }
// ]

// Auto-assign
const assignedTo = AgentOrchestrator.autoAssign(ticket, agents);
// Returns: 'agent-1' (Sarah Johnson - best match)
```

## Example 4: Workload Balancing

### Scenario: Distributing Multiple Tickets

```typescript
const tickets = [
  { title: 'Frontend Component', /* requires frontend skills */ },
  { title: 'API Endpoint', /* requires backend skills */ },
  { title: 'Database Migration', /* requires database skills */ },
  { title: 'UI Polish', /* requires frontend skills */ },
];

const agents = [...]; // Agent roster

// Before assignment - check workload
const distribution = AgentOrchestrator.getWorkloadDistribution(agents);
// {
//   'agent-1': { currentTasks: 3, capacity: 25, utilizationRate: 75 },
//   'agent-2': { currentTasks: 1, capacity: 66, utilizationRate: 33 },
//   'agent-3': { currentTasks: 2, capacity: 50, utilizationRate: 50 },
// }

// Assign with workload balancing
const assignments = tickets.map(ticket =>
  AgentOrchestrator.autoAssign(ticket, agents, {
    preferSkillMatch: true,
    considerPerformance: true,
    balanceWorkload: true,  // ← Important!
    respectCapacity: true,
  })
);

// Results in balanced distribution:
// Agent 2 gets more tasks (had lower utilization)
// Agent 1 gets fewer tasks (was already heavily utilized)
```

## Example 5: Performance Tracking

### Scenario: Updating Metrics After Task Completion

```typescript
// Task completed successfully and on time
const updatedAgent = AgentOrchestrator.updateAgentPerformance(
  agent,
  true,  // task completed
  true,  // on time
  92     // quality score (0-100)
);

// Result:
// {
//   ...agent,
//   performance: {
//     tasksCompleted: 46,  // incremented
//     onTimeDeliveryRate: 92.4,  // rolling average
//     qualityScore: 88.2,  // rolling average
//     lastUpdated: 1234567890
//   }
// }

// Task completed late with issues
const updatedAgent2 = AgentOrchestrator.updateAgentPerformance(
  agent,
  true,   // task completed
  false,  // NOT on time
  65      // lower quality score
);

// This will lower the agent's metrics and affect future assignments
```

## Example 6: Dependency Analysis

### Scenario: Database Migration Before API Development

```typescript
const breakdown = TaskBreakdownEngine.breakdown({
  type: 'text',
  content: `
    Implement new analytics features:
    - Update database schema to support metrics
    - Create analytics API endpoints
    - Build frontend dashboard
  `
});

// Generated dependencies:
// [
//   {
//     from: 'ticket-api',
//     to: 'ticket-database',
//     type: 'requires'  // API requires database changes first
//   },
//   {
//     from: 'ticket-frontend',
//     to: 'ticket-api',
//     type: 'requires'  // Frontend requires API first
//   }
// ]

// Execution order determined by dependencies:
// 1. Database schema update
// 2. API endpoints
// 3. Frontend dashboard
```

## Example 7: Risk Flag Handling

### Scenario: Identifying Security Risks

```typescript
const breakdown = TaskBreakdownEngine.breakdown({
  type: 'text',
  content: `
    Implement payment processing with Stripe integration.
    Store customer credit card tokens securely.
    Add PCI compliance validation.
  `
});

// Generated risk flags:
// ticket.riskFlags = [
//   {
//     level: 'critical',
//     description: 'Security-sensitive implementation requires careful review',
//     mitigation: 'Conduct security audit, use established payment libraries'
//   },
//   {
//     level: 'high',
//     description: 'External dependency may introduce reliability concerns',
//     mitigation: 'Implement retry logic, error handling, and fallback options'
//   }
// ]
```

## Example 8: Complex Multi-Epic Breakdown

### Input: Large Feature Set

```markdown
## E-commerce Platform Rebuild

### Phase 1: User Management
- User registration and authentication
- Profile management
- Address book
- Order history

### Phase 2: Product Catalog
- Product listing and search
- Category management
- Inventory tracking
- Product recommendations

### Phase 3: Shopping Experience
- Shopping cart
- Checkout flow
- Payment integration
- Order confirmation

### Phase 4: Admin Panel
- Product management
- Order management
- Analytics dashboard
- User management
```

### Result:

- **4 Epics** (one per phase)
- **16 Tickets** (4 per epic)
- **48 Subtasks** (~3 per ticket)
- **Total Effort**: ~320 hours
- **15 Dependencies** identified
- **8 Risk Flags** raised
- **Auto-assigned** to 5 agents based on skills

## Best Practices

1. **Provide Context**: Include technical details in requirements
2. **Use Keywords**: Words like "security", "database", "API" help with categorization
3. **Structure Content**: Use headers and bullets for better parsing
4. **Review Suggestions**: Always review auto-generated breakdowns
5. **Adjust Estimates**: Refine effort estimates based on team velocity
6. **Monitor Performance**: Track agent metrics to improve future assignments
7. **Update Skills**: Keep agent skill profiles current
8. **Check Dependencies**: Verify dependency graph before starting work

## Tips for Better Breakdowns

- ✅ **Do**: "Implement JWT authentication with refresh tokens and secure storage"
- ❌ **Don't**: "Add login"

- ✅ **Do**: "Create responsive dashboard with charts, filters, and export"
- ❌ **Don't**: "Make a dashboard"

- ✅ **Do**: Use priority keywords (critical, urgent, high priority)
- ❌ **Don't**: Leave priority ambiguous

- ✅ **Do**: Mention technologies (React, PostgreSQL, Docker)
- ❌ **Don't**: Use vague terms ("modern stack")
