# Quick Start Guide: Task Orchestration Features

## Setup

### 1. Database Migration

Run the orchestration schema to add new tables and columns:

```sql
-- In your Supabase SQL Editor, run:
-- First, ensure the main schema is applied
\i database/schema.sql

-- Then apply the orchestration schema
\i database/schema_orchestration.sql

-- Optional: Initialize default skills for existing agents
SELECT initialize_default_skills();
```

### 2. Verify Installation

After migration, you should see:
- New "AI Breakdown" button (lightning icon) in the top navigation
- New "Agents" button in the top navigation

## Using AI Task Breakdown

### Example 1: Breaking Down a GitHub Issue

1. Click the **"AI Breakdown"** button
2. Select **"GitHub Issue"**
3. Paste this example:

```markdown
# User Authentication Feature

Implement a complete user authentication system with the following requirements:

1. Login page with email/password
2. Sign up page with validation
3. Password reset functionality
4. Session management
5. Protected routes
6. User profile page

The system should use JWT tokens and integrate with our existing API.
Security is critical - implement rate limiting and CSRF protection.
```

4. Click **"Analyze & Break Down"**
5. Review the generated:
   - Epic with priority
   - 6+ tickets (one per requirement)
   - DoD for each ticket
   - Test notes
   - Risk flags (especially security risks)
6. Click **"Accept & Create Tasks"**
7. Tasks appear in your kanban board!

### Example 2: Breaking Down a PRD

1. Click **"AI Breakdown"**
2. Select **"PRD / Spec"**
3. Paste this example:

```markdown
# Mobile Dashboard Redesign

## Overview
Redesign the mobile dashboard to improve user experience and performance.

## Key Features
- Modern UI with Material Design 3
- Dark mode support
- Improved navigation flow
- Offline mode capability
- Push notifications
- Performance optimization (< 2s load time)

## Timeline
Sprint 1-2 (4 weeks)

## Success Metrics
- 20% increase in user engagement
- 50% reduction in load time
- 90%+ user satisfaction score
```

4. Review generated tickets with:
   - Frontend tickets (UI, navigation)
   - Backend tickets (API, offline sync)
   - DevOps tickets (performance optimization)
   - Testing tickets (metrics validation)
5. Note the risk flags for timeline and performance
6. Accept to create all tickets

### Example 3: Screenshot-Based Breakdown

1. Click **"AI Breakdown"**
2. Select **"Screenshot"**
3. Describe what needs to be implemented:

```markdown
Redesign the user dashboard with the following changes:

1. Move navigation from side to top
2. Add 3 new chart widgets showing:
   - User activity over time (line chart)
   - Task distribution by status (pie chart)
   - Agent performance comparison (bar chart)
3. Implement drag-and-drop to rearrange widgets
4. Add filter controls at the top
5. Make it responsive for mobile/tablet
6. Use our existing design system colors

Performance requirement: All charts must load within 1 second.
```

4. System generates appropriate tickets
5. Review and accept

## Managing Agent Roster

### View Agent Information

1. Click the **"Agents"** button
2. See all agents with:
   - Skills and proficiency levels
   - Specializations
   - Current availability
   - Performance metrics
   - Workload status

### Understanding Performance Metrics

**Tasks Done**: Total completed tasks
**Success Rate**: Percentage of successfully completed tasks
**Quality Score**:
- Excellent (4.0-5.0)
- Good (3.0-3.9)
- Fair (2.0-2.9)
- Needs Improvement (< 2.0)

**Avg Time**: Average hours to complete a task
**Workload**: Current hours assigned / max capacity

### Adding Agent Skills

To manually add skills via SQL:

```sql
INSERT INTO agent_skills (agent_id, skill_name, category, proficiency_level)
VALUES
  ('agent-uuid-here', 'React', 'frontend', 5),
  ('agent-uuid-here', 'TypeScript', 'frontend', 4),
  ('agent-uuid-here', 'Node.js', 'backend', 4);
```

Or update specializations:

```sql
UPDATE agents
SET specializations = ARRAY['UI/UX', 'Frontend Architecture']
WHERE id = 'agent-uuid-here';
```

## Understanding Generated Tasks

### Definition of Done (DoD)

Every generated ticket includes a DoD checklist. Example:

```
✓ Implementation completed
✓ Code reviewed
✓ Unit tests written and passing
✓ Integration tests passing
✓ API documentation updated
✓ UI/UX approved
✓ Documentation updated
```

You can edit these after creation by updating the task description.

### Test Notes

Specific testing requirements. Example:

```
- Test authentication flows
- Test all API endpoints
- Verify error handling
- Test form validation
- Test edge cases for input fields
```

Use these as a testing checklist during QA.

### Risk Flags

Color-coded by severity:

🔴 **Critical**: Security vulnerabilities, data loss risks
🟠 **High**: Performance issues, breaking changes
🟡 **Medium**: Technical debt, timeline concerns
🔵 **Low**: Minor considerations, nice-to-haves

Each risk includes:
- **Description**: What the risk is
- **Mitigation Plan**: How to address it

## Auto-Assignment Examples

### Scenario 1: Frontend Task

**Ticket**: "Implement responsive navigation menu"
**Tags**: frontend, ui, component

**Auto-Assignment Logic**:
1. Looks for agents with frontend skills
2. Prefers those with high proficiency in React/CSS
3. Checks current workload
4. Considers performance history
5. Suggests: Alex Chen (Frontend Specialist, 90% match)

### Scenario 2: Backend Task

**Ticket**: "Create REST API endpoints for user management"
**Tags**: backend, api, database

**Auto-Assignment Logic**:
1. Looks for agents with backend skills
2. Prefers those with API design experience
3. Checks database knowledge
4. Considers availability
5. Suggests: Sarah Johnson (Backend Specialist, 95% match)

### Scenario 3: Full-Stack Task

**Ticket**: "Integrate payment gateway (frontend + backend)"
**Tags**: frontend, backend, integration

**Auto-Assignment Logic**:
1. Looks for agents with both frontend and backend skills
2. Checks for integration experience
3. Balances workload across team
4. Suggests: Mike Rodriguez (Full-Stack, 85% match)

## Dependency Visualization

### Reading the Dependency Graph

**Direct Dependencies** ("Depends on"):
```
TICKET-3 depends on TICKET-1, TICKET-2
→ Must complete TICKET-1 and TICKET-2 before starting TICKET-3
```

**Blocked By** ("Blocks"):
```
TICKET-1 blocks TICKET-3, TICKET-4
→ TICKET-3 and TICKET-4 are waiting for TICKET-1
```

**Critical Path** (highlighted in red):
```
Tasks that directly impact project timeline
→ Prioritize these to avoid delays
```

### Example Dependency Chain

```
TICKET-1: Database schema design
  ↓ blocks
TICKET-2: API endpoints implementation
  ↓ blocks
TICKET-3: Frontend integration
  ↓ blocks
TICKET-4: End-to-end testing
```

This shows you must complete tasks in order: 1 → 2 → 3 → 4

## Tips & Best Practices

### For Better Task Breakdown

✅ **DO**:
- Provide detailed, structured content
- Include specific requirements
- Mention technical constraints
- Add acceptance criteria
- Specify priorities explicitly

❌ **DON'T**:
- Use vague descriptions
- Omit technical details
- Mix multiple unrelated features
- Forget to mention dependencies

### For Agent Management

✅ **DO**:
- Keep skills updated
- Set realistic max concurrent tasks
- Update availability regularly
- Review performance metrics
- Adjust workload as needed

❌ **DON'T**:
- Overload agents beyond capacity
- Ignore performance trends
- Forget to update availability
- Set unrealistic skill levels

### For Risk Management

✅ **DO**:
- Review all generated risks
- Prioritize critical/high risks
- Create mitigation tasks
- Update risk status regularly
- Communicate risks to team

❌ **DON'T**:
- Ignore risk flags
- Defer security risks
- Underestimate timeline risks
- Skip mitigation planning

## Troubleshooting

### Problem: No tickets generated

**Cause**: Content too short or unstructured

**Solution**:
- Provide at least 5-10 lines of content
- Use numbered or bulleted lists
- Include clear feature descriptions
- Add section headers

### Problem: Poor agent matching

**Cause**: Agent skills not defined

**Solution**:
- Add skills to agents via SQL or UI
- Set appropriate proficiency levels
- Add specializations
- Update agent descriptions

### Problem: Incorrect priorities

**Cause**: Missing priority keywords

**Solution**: Include keywords like:
- Critical: "critical", "urgent", "blocker"
- High: "important", "high priority"
- Low: "nice to have", "low priority"

### Problem: Missing dependencies

**Cause**: Dependencies not explicitly stated

**Solution**:
- Mention task order explicitly
- Use phrases like "depends on", "requires", "after"
- List prerequisites clearly

## Advanced Usage

### Custom Risk Detection

Modify `src/services/taskBreakdownService.ts`:

```typescript
// Add custom risk keywords
if (lower.includes('your-keyword')) {
  risks.push({
    type: 'technical',
    severity: 'high',
    description: 'Your custom risk description',
    mitigationPlan: 'Your mitigation strategy',
  });
}
```

### Adjust Assignment Weights

Modify `src/services/agentAssignmentService.ts`:

```typescript
// Prefer specialists more strongly
const skillWeight = 4; // default: 3

// Balance workload more aggressively
const workloadWeight = 3; // default: 2
```

### Custom Skill Categories

Add to `src/types/agentRoster.ts`:

```typescript
type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'devops'
  | 'mobile'
  | 'your-custom-category'; // Add here
```

## Next Steps

1. ✅ Complete database migration
2. ✅ Try the examples above
3. ✅ Review generated tasks
4. ✅ Customize for your workflow
5. ✅ Add/update agent skills
6. ✅ Monitor performance metrics
7. ✅ Adjust configuration as needed

## Support

For issues or questions:
- Check `TASK_ORCHESTRATION.md` for detailed documentation
- Review `FEATURE_SUMMARY.md` for feature overview
- Examine code comments for implementation details

## What's Next?

Upcoming enhancements:
- Machine learning for better extraction
- Screenshot OCR analysis
- GitHub API integration
- Real-time collaboration
- Automated dependency detection
- Historical learning from past projects
