# Demo Data for Task Breakdown System

## Example Inputs for Testing

### 1. Simple Task (Single Ticket)
```
Fix the login button styling on the homepage. The button should be purple with white text and have rounded corners.
```

**Expected Output:**
- 1 Ticket
- No subtasks
- Basic DoD criteria
- Simple test notes

---

### 2. Medium Complexity (Multi-Ticket)
```
# User Profile Enhancement

Implement the following improvements to the user profile page:

1. Add profile picture upload functionality
2. Allow users to edit their bio and social media links
3. Display user statistics (tasks completed, contributions)
4. Add a dark mode toggle for the profile view
5. Implement password change functionality

Technical: Use React for the frontend, ensure all forms have proper validation.
```

**Expected Output:**
- 5 Tickets (one per feature)
- Multiple subtasks per ticket
- Test notes for each feature
- Risk flags for security (password change)

---

### 3. Epic-Level Task (Complex Project)
```
# Task Management System with Real-time Collaboration

Build a comprehensive task management platform with the following capabilities:

## Core Features

1. **Task Management**
   - Create, edit, delete tasks
   - Assign tasks to team members
   - Set priorities and due dates
   - Add tags and categories
   - Attach files and images

2. **Real-time Collaboration**
   - Live updates when tasks change
   - Commenting system with mentions
   - Activity feed showing recent changes
   - Presence indicators (who's online)
   - WebSocket-based synchronization

3. **Team Management**
   - Invite team members via email
   - Role-based permissions (admin, member, viewer)
   - Team workspace settings
   - User profiles with avatars

4. **Kanban Board View**
   - Drag-and-drop task cards
   - Multiple board layouts
   - Customizable columns
   - Board filters and search
   - Export board data

5. **Reporting & Analytics**
   - Task completion metrics
   - Team velocity tracking
   - Burndown charts
   - Time tracking reports
   - Custom dashboard widgets

6. **Notifications**
   - Email notifications for assignments
   - In-app notifications
   - Notification preferences
   - Daily digest emails

## Technical Requirements

- **Frontend**: React with TypeScript, TailwindCSS
- **Backend**: Node.js with Express, PostgreSQL database
- **Real-time**: WebSocket with Socket.io
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 or similar
- **Email**: SendGrid integration
- **Testing**: Jest for unit tests, Cypress for E2E
- **Deployment**: Docker containers on AWS/Heroku

## Non-Functional Requirements

- Support 10,000+ concurrent users
- 99.9% uptime SLA
- GDPR compliant
- Mobile responsive
- Accessibility (WCAG 2.1 AA)
- Performance: < 2s page load time
```

**Expected Output:**
- 1 Epic: "Task Management System"
- 6+ Tickets (one per major feature area)
- 30+ Subtasks
- Comprehensive DoD for each ticket
- Multiple risk flags (performance, security, scalability)
- Extensive test notes
- Multiple dependencies between tickets

---

### 4. Bug Fix Task
```
Critical Bug: Users unable to log in with SSO

Users are reporting that they cannot log in using Google SSO. The error message shows "Authentication failed" but there are no details in the logs.

Steps to reproduce:
1. Go to login page
2. Click "Sign in with Google"
3. Complete Google authentication
4. Error appears on redirect

Expected: User should be logged in
Actual: Error message displayed

Priority: Critical
Affects: All SSO users (approximately 40% of user base)
```

**Expected Output:**
- 1 Ticket with high priority
- Subtasks for investigation, fix, testing
- Critical risk flags
- Security-related test notes
- DoD includes regression testing

---

### 5. Feature Request with Technical Details
```
# API Rate Limiting Implementation

Implement rate limiting for our REST API to prevent abuse and ensure fair usage.

Requirements:
- Limit requests per user/IP address
- Different limits for authenticated vs anonymous users
- Return proper HTTP 429 status codes
- Include rate limit headers in responses (X-RateLimit-Limit, X-RateLimit-Remaining)
- Store rate limit data in Redis for performance
- Admin dashboard to view rate limit violations
- Configurable limits per endpoint
- Whitelist for trusted IPs

Technical approach:
- Use Express middleware
- Redis for distributed rate limiting
- Implement sliding window algorithm
- Log violations to monitoring system
```

**Expected Output:**
- 1-2 Tickets
- Backend and admin UI subtasks
- Performance considerations in DoD
- Integration tests for rate limiting
- Technical risk flags
- Tags: backend, api, security, performance

---

## Example Agent Profiles for Testing

### Agent 1: Full-Stack Developer
```typescript
{
  name: "Alex Chen",
  skills: [
    { name: "React", level: "expert" },
    { name: "TypeScript", level: "advanced" },
    { name: "Node.js", level: "advanced" },
    { name: "PostgreSQL", level: "intermediate" }
  ],
  specializations: ["frontend", "backend", "api"],
  performance: {
    tasksCompleted: 45,
    successRate: 0.92,
    qualityScore: 88,
    reliability: 90
  },
  availability: {
    status: "available",
    currentWorkload: 30
  }
}
```

### Agent 2: Frontend Specialist
```typescript
{
  name: "Sarah Johnson",
  skills: [
    { name: "React", level: "expert" },
    { name: "CSS", level: "expert" },
    { name: "JavaScript", level: "advanced" },
    { name: "UI/UX", level: "advanced" }
  ],
  specializations: ["frontend", "ui", "responsive"],
  performance: {
    tasksCompleted: 60,
    successRate: 0.95,
    qualityScore: 92,
    reliability: 95
  },
  availability: {
    status: "available",
    currentWorkload: 20
  }
}
```

### Agent 3: Backend Developer
```typescript
{
  name: "Michael Rodriguez",
  skills: [
    { name: "Node.js", level: "expert" },
    { name: "Python", level: "advanced" },
    { name: "PostgreSQL", level: "expert" },
    { name: "Redis", level: "advanced" },
    { name: "API Design", level: "expert" }
  ],
  specializations: ["backend", "database", "api", "performance"],
  performance: {
    tasksCompleted: 38,
    successRate: 0.89,
    qualityScore: 85,
    reliability: 88
  },
  availability: {
    status: "busy",
    currentWorkload: 70
  }
}
```

### Agent 4: DevOps Engineer
```typescript
{
  name: "Emily Zhang",
  skills: [
    { name: "Docker", level: "expert" },
    { name: "Kubernetes", level: "advanced" },
    { name: "AWS", level: "advanced" },
    { name: "CI/CD", level: "expert" },
    { name: "Node.js", level: "intermediate" }
  ],
  specializations: ["devops", "deployment", "infrastructure"],
  performance: {
    tasksCompleted: 25,
    successRate: 0.88,
    qualityScore: 82,
    reliability: 85
  },
  availability: {
    status: "available",
    currentWorkload: 40
  }
}
```

### Agent 5: QA Engineer
```typescript
{
  name: "David Kim",
  skills: [
    { name: "Testing", level: "expert" },
    { name: "Jest", level: "advanced" },
    { name: "Cypress", level: "expert" },
    { name: "JavaScript", level: "intermediate" },
    { name: "API Testing", level: "advanced" }
  ],
  specializations: ["testing", "qa", "automation"],
  performance: {
    tasksCompleted: 52,
    successRate: 0.94,
    qualityScore: 90,
    reliability: 93
  },
  availability: {
    status: "available",
    currentWorkload: 15
  }
}
```

---

## Testing Scenarios

### Scenario 1: Basic Breakdown
1. Input: Simple Task example
2. Expected: 1 ticket created
3. Verify: DoD has standard criteria
4. Check: No risk flags or minimal risks

### Scenario 2: Multi-Feature Breakdown
1. Input: User Profile Enhancement example
2. Expected: 5 tickets, one per feature
3. Verify: Each ticket has appropriate subtasks
4. Check: Security risk flagged for password change
5. Test: Tags include "frontend", "backend"

### Scenario 3: Epic Creation
1. Input: Task Management System example
2. Expected: 1 epic with 6+ tickets
3. Verify: Dependencies between tickets
4. Check: Multiple risk flags (performance, security)
5. Test: Comprehensive test notes for each ticket

### Scenario 4: Agent Assignment
1. Use: API Rate Limiting task
2. Expected: Backend specialists ranked highest
3. Verify: Michael Rodriguez (backend) gets high score
4. Check: Performance and Redis skills matched
5. Test: Confidence score > 70%

### Scenario 5: Skill Matching
1. Use: Frontend task from User Profile
2. Expected: Sarah Johnson ranked #1
3. Verify: React and UI/UX skills matched
4. Check: High quality score considered
5. Test: Alex Chen also recommended (full-stack)

### Scenario 6: Workload Balancing
1. Create: Multiple tickets
2. Auto-assign: All tickets
3. Verify: Tasks distributed fairly
4. Check: Michael (70% workload) gets fewer tasks
5. Test: Sarah (20% workload) gets more tasks

---

## Expected Breakdown Results

### Simple Task → Single Ticket
```json
{
  "epics": [],
  "tickets": [
    {
      "taskId": "TICKET-1",
      "title": "Fix login button styling",
      "priority": 3,
      "tags": ["frontend", "ui"],
      "subtasks": [],
      "definitionOfDone": {
        "criteria": [
          "Code implemented and reviewed",
          "Styling matches requirements",
          "No critical bugs"
        ]
      }
    }
  ],
  "subtasks": [],
  "dependencies": []
}
```

### Epic Task → Full Breakdown
```json
{
  "epics": [
    {
      "id": "epic-1",
      "title": "Task Management System",
      "tickets": ["ticket-1", "ticket-2", "..."]
    }
  ],
  "tickets": [
    {
      "taskId": "TICKET-1",
      "title": "Frontend Implementation",
      "subtasks": ["subtask-1", "subtask-2", "..."],
      "riskFlags": [
        {
          "severity": "high",
          "category": "technical",
          "description": "Complex state management required"
        }
      ]
    }
  ],
  "subtasks": [
    {
      "ticketId": "ticket-1",
      "title": "Implement drag-and-drop",
      "estimatedHours": 8
    }
  ],
  "dependencies": [
    {
      "sourceId": "ticket-2",
      "targetId": "ticket-1",
      "type": "blocks"
    }
  ]
}
```

---

## Tips for Testing

1. **Start Simple**: Test with the simple task first to understand the flow
2. **Increase Complexity**: Move to medium and epic tasks
3. **Verify All Fields**: Check that DoD, test notes, and risks are generated
4. **Test Agent Matching**: Create agents with specific skills to test matching
5. **Check Dependencies**: Use epic-level tasks to test dependency visualization
6. **Workload Testing**: Create multiple agents with different workloads
7. **Edge Cases**: Try very short inputs, very long inputs, inputs without clear features
8. **Review UI**: Check that all generated data displays correctly in the UI

---

## Common Issues and Solutions

### Issue: No risk flags generated
**Solution**: Include keywords like "security", "database", "performance" in the input

### Issue: Low agent confidence scores
**Solution**: Ensure agent skills match task tags/description keywords

### Issue: Dependencies not showing
**Solution**: Use epic-level tasks which automatically create dependencies

### Issue: All agents have same score
**Solution**: Give agents diverse skill sets and different workload levels
