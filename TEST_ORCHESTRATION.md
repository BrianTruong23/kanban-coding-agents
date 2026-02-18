# Testing the Task Orchestration System

## Quick Start Testing Guide

### 1. Run the Demo Page

```bash
npm run dev
```

Navigate to: `http://localhost:3000/demo`

### 2. Test Task Breakdown

**Option A: Use Sample PRD**
1. Click "Sample PRD" card
2. Wizard opens with pre-filled authentication system PRD
3. Click "Generate Tasks"
4. View generated epics, tickets, and subtasks
5. Click "View Dependencies" to see the graph
6. Click "Apply to Board" to confirm

**Option B: Use Sample Issue**
1. Click "Sample Issue" card
2. Wizard opens with dark mode GitHub issue
3. Click "Generate Tasks"
4. Review the generated tasks
5. View dependencies
6. Apply to board

**Option C: Custom Input**
1. Click "Task Breakdown" card
2. Select input type (Issue, PRD, Screenshot, or Text)
3. Paste your content
4. Click "Generate Tasks"

### 3. Test Agent Roster

1. Click "Agent Roster" card
2. View team statistics (6 agents, utilization, hours, bottlenecks)
3. Click on an agent from the left panel
4. View agent details:
   - Performance metrics (success rate, quality score, on-time delivery)
   - Skills with proficiency levels
   - Current workload
   - Specializations
5. Check top performers at the bottom

### 4. Test Dependency Visualization

After generating tasks:
1. Scroll to "Dependency Graph" section
2. Observe color coding (purple=epic, blue=ticket, green=subtask)
3. See dependency arrows (red=blocks, purple=relates-to)
4. Note task IDs, priorities, and complexity badges
5. Click on tasks (logged to console)

## Expected Results

### Task Breakdown for Authentication PRD

**Epics Generated:**
- User Authentication & Authorization (P5, High complexity)
- API Development (P5, Medium complexity)
- Database Design & Implementation (P5, High complexity)
- Testing & Quality Assurance (P3, Medium complexity)

**Sample Tickets:**
- User Registration Flow
- Login System
- Password Reset Functionality
- API Route Setup
- Database Schema Design
- Unit Test Setup

**Sample Subtasks:**
- Design & Planning
- Implementation
- Code Review & Testing
- API Documentation (where applicable)

**Dependencies:**
- Database tasks block API tasks
- Backend tasks block Frontend tasks
- Subtasks depend on their parent tickets

**Risk Flags:**
- Security risks for auth features (High/Critical)
- Database migration risks (Critical)
- Complexity risks for high-complexity tasks (Medium)

### Agent Assignment

Agents assigned based on:
- **Alice Backend**: Backend and database tasks (high proficiency)
- **Bob Frontend**: UI and frontend tasks (React expert)
- **Charlie DevOps**: Infrastructure and deployment tasks
- **Diana QA**: Testing tasks (high testing proficiency)
- **Eve Security**: Security-critical auth tasks
- **Frank Fullstack**: Mixed tasks (currently overloaded, lower priority)

### Performance Metrics

**Team Statistics:**
- Total Agents: 6
- Active Agents: 6
- Utilization: ~40-60% (calculated from workload)
- Available Hours: Variable based on current load

**Top Performers:**
1. Eve Security (97% quality)
2. Charlie DevOps (96% quality)
3. Alice Backend (94% quality)

**Bottlenecks:**
- Frank Fullstack (4 tasks, 35h remaining, overloaded status)

## Manual Testing Checklist

### UI/UX Testing

- [ ] Task Breakdown Wizard opens and closes correctly
- [ ] All four input types are selectable
- [ ] Text area accepts and displays content
- [ ] "Generate Tasks" button shows loading state
- [ ] Progress indicator updates through steps
- [ ] Task preview shows all task types
- [ ] Risk summary displays when risks exist
- [ ] Dependency graph renders without errors
- [ ] Agent Roster Manager opens and closes
- [ ] Agent list is scrollable
- [ ] Agent selection updates detail view
- [ ] Performance metrics display correctly
- [ ] Skill bars animate to correct proficiency
- [ ] Dark mode works for all components
- [ ] Mobile responsive (test at 375px, 768px, 1024px)

### Functional Testing

- [ ] Empty content shows validation error
- [ ] Generated tasks have unique IDs
- [ ] Task IDs increment correctly (TASK-1, TASK-2, etc.)
- [ ] Dependencies are logical (DB before API, etc.)
- [ ] Agent assignments match skill requirements
- [ ] Workload prevents overloading agents
- [ ] Risk flags have severity and mitigation
- [ ] Definition of Done items are relevant
- [ ] Test notes match task types
- [ ] Estimated hours are reasonable
- [ ] Task hierarchy is maintained (epic → ticket → subtask)

### Service Testing

**TaskBreakdownService:**
```typescript
import { taskBreakdownService } from '@/services/taskBreakdown';

const result = await taskBreakdownService.breakdown({
  source: 'text',
  content: 'Add user authentication with email and password',
});

// Should return:
// - At least 1 epic
// - Multiple tickets
// - Multiple subtasks
// - Dependencies array
// - Estimated total hours > 0
// - Risk summary with counts
```

**AgentAssignmentService:**
```typescript
import { agentAssignmentService } from '@/services/agentAssignment';
import { mockExtendedAgents } from '@/lib/mockData';

const scores = agentAssignmentService.calculateAssignmentScores(task, mockExtendedAgents);

// Should return:
// - Array of scores for all active agents
// - Scores between 0-100
// - Reasons for each score
// - Sorted by score descending
```

### Edge Cases to Test

1. **Empty or very short input**
   - Input: "Add login"
   - Should still generate basic task structure

2. **Very long input**
   - Input: Multi-page PRD (5000+ words)
   - Should handle without performance issues

3. **No matching agent skills**
   - Task requires "blockchain" skill
   - Should still assign best available agent

4. **All agents overloaded**
   - Set all agents to "overloaded" status
   - Should still make assignments

5. **Single task type**
   - Input: "Fix typo in README"
   - Should generate minimal structure

## Performance Benchmarks

Expected performance on modern hardware:

- **Task Breakdown**: < 1 second for typical PRD (500-2000 words)
- **Agent Assignment**: < 100ms for 20 tasks, 10 agents
- **Dependency Graph Render**: < 500ms for 50 tasks
- **Roster Report Generation**: < 50ms for 10 agents

## Console Testing

Open browser DevTools console and test:

```javascript
// Test breakdown service
const result = await taskBreakdownService.breakdown({
  source: 'text',
  content: 'Implement dark mode with toggle button and localStorage persistence'
});
console.log('Breakdown result:', result);

// Test assignment service
const assignments = agentAssignmentService.autoAssignTasks(
  [...result.epics, ...result.tickets, ...result.subtasks],
  mockExtendedAgents
);
console.log('Assignments:', assignments);

// Test roster report
const report = agentAssignmentService.generateRosterReport(mockExtendedAgents);
console.log('Roster report:', report);
```

## Accessibility Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter/Space to activate buttons
   - Esc to close modals

2. **Screen Reader**
   - All buttons have descriptive labels
   - Form inputs have labels
   - Icons have text alternatives

3. **Color Contrast**
   - Text meets WCAG AA standards
   - Dark mode has sufficient contrast
   - Color is not the only indicator

## Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Known Limitations (Expected Behavior)

1. **Mock Data Only**: Uses sample agents, not real database
2. **Client-Side Only**: No persistence, refresh loses data
3. **English Only**: Content parsing optimized for English
4. **Simple Parsing**: Uses regex, not true NLP
5. **Static Estimates**: Doesn't learn from historical data

## Reporting Issues

If you find issues, please include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and version
4. Console errors (if any)
5. Screenshots

## Next Steps After Testing

Once testing is complete:
1. Integrate with existing kanban board
2. Add database persistence
3. Connect to real agent management system
4. Implement GitHub API integration
5. Add analytics and reporting
