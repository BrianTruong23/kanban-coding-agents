# Quick Start Guide: AI Task Breakdown Feature

## Getting Started in 5 Minutes

### Step 1: Database Migration (One-time setup)

1. Log into your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `database/schema.sql`
4. Paste and execute in the SQL Editor
5. Wait for "Success" confirmation

**Note**: The migration is idempotent - safe to run multiple times.

### Step 2: Add Agent Skills

Before using auto-assignment, give your agents some skills:

1. Log into the Kanban board
2. Click the **"Agent Skills"** button (green button in header)
3. Select an agent from the left panel
4. Click **"Add"** in the middle panel
5. Enter a skill name (e.g., "React", "Node.js", "Database")
6. Set proficiency level (1-5):
   - 1 = Beginner
   - 2 = Intermediate
   - 3 = Proficient
   - 4 = Advanced
   - 5 = Expert
7. Click **"Add"**
8. Repeat for other agents

**Suggested skills to add**:
- Frontend: React, Next.js, TypeScript, UI/UX, Tailwind CSS
- Backend: Node.js, API Development, Database, PostgreSQL
- DevOps: Docker, CI/CD, Infrastructure
- Testing: Unit Testing, Integration Testing, E2E Testing
- Mobile: React Native, iOS, Android

### Step 3: Try AI Breakdown

Now create tasks from an issue or PRD:

1. Click the **"AI Breakdown"** button (purple button in header)
2. Keep "Issue" mode selected
3. Copy this example or write your own:

```markdown
# User Profile Feature

Build a user profile page with edit capabilities.

## Tasks:
- Create profile view page
- Add profile edit form
- Implement avatar upload
- Add user settings section

## Tests:
- Unit test: Form validation
- E2E test: Profile update flow

## Risks:
- High: Image upload security
- Medium: Data validation

Priority: High
Tags: frontend, backend, database
```

4. Paste into the text area
5. Click **"Generate Tasks"**
6. Watch as tasks appear on your board with agents auto-assigned!

### Step 4: View Dependencies

See how tasks relate to each other:

1. Click the **"Dependencies"** button (blue button in header)
2. View the visual graph of task relationships
3. Understand the color coding:
   - 🔴 Red line = Blocking
   - 🟠 Amber line = Blocked by
   - ⚪ Gray dashed = Related
4. Click the fullscreen icon for a better view

### Step 5: Manage Performance

After completing tasks, track agent performance:

1. Open **"Agent Skills"** panel
2. Select an agent
3. View performance stats in the right column:
   - Total tasks completed
   - Average quality rating
   - Average completion time

Performance data is automatically recorded when tasks move to "Done" status.

---

## Example Workflows

### Workflow 1: Planning a Sprint

1. Click "AI Breakdown"
2. Select "PRD" mode
3. Paste your product requirements document
4. Generate tasks
5. Review the generated epics and tasks
6. Tasks are automatically assigned to best-matching agents
7. Set sprint field for each task
8. Use sprint filter in the board to view sprint tasks

### Workflow 2: Bug Triage

1. Copy bug report from GitHub/Jira
2. Click "AI Breakdown" → "Issue" mode
3. Paste bug details
4. System detects:
   - "bug" tag automatically
   - Priority from keywords (critical, urgent, etc.)
   - Risk flags from severity
5. Agent with highest debugging skill gets assigned
6. Add to current sprint

### Workflow 3: Team Capacity Planning

1. Open "Agent Skills" panel
2. Review each agent's skills and performance
3. Identify gaps (skills with low proficiency or no coverage)
4. Train agents or hire new ones
5. Update skill levels as agents improve
6. Use auto-assignment to distribute work fairly

---

## Tips and Tricks

### Writing Good Input for AI Breakdown

**Good Structure**:
```markdown
# Epic Title

Epic description goes here

## Task 1 Title
- Subtask 1
- Subtask 2

## Task 2 Title
- Subtask A
- Subtask B

## Tests:
- Unit test: Component rendering
- Integration test: API calls

## Risks:
- High: Security vulnerability
- Medium: Performance issue
```

**Keywords the Parser Understands**:
- **Priority**: critical, urgent, high, medium, low, p1, p2, p3, p4
- **Tags**: frontend, backend, database, testing, bug, feature, refactor
- **Test Types**: unit, integration, e2e, manual
- **Risk Levels**: critical, high, medium, low, blocker

### Improving Auto-Assignment Accuracy

1. **Be specific in task descriptions**: Mention technologies explicitly
   - ✅ "Create React component with TypeScript"
   - ❌ "Create component"

2. **Tag your tasks**: Help the system understand requirements
   - Add tags like: frontend, api, database, mobile

3. **Update agent skills regularly**: Keep proficiency levels current

4. **Record performance**: The more data, the better assignments

### Dependency Best Practices

1. **Use "blocks" for critical paths**: Red lines show what must be done first
2. **Use "related-to" for informational links**: Gray dashed lines for context
3. **Avoid circular dependencies**: System prevents task depending on itself
4. **Review graph regularly**: Ensure no blocking chains are too long

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search (coming soon)
- `Ctrl/Cmd + B`: Open AI Breakdown modal
- `Ctrl/Cmd + D`: Toggle Dependencies graph
- `Ctrl/Cmd + A`: Toggle Agent Skills panel

---

## Troubleshooting

### Issue: Tasks aren't being auto-assigned

**Solution**:
1. Check that agents have skills added
2. Ensure task description mentions technologies
3. Verify at least one agent has matching skills
4. Try adding more specific tags to the task

### Issue: Dependency graph is empty

**Solution**:
1. Dependencies must be created explicitly (not auto-detected yet)
2. Use the breakdown feature - it creates some dependencies
3. Manually add dependencies via task edit (feature coming soon)

### Issue: Parser doesn't detect my structure

**Solution**:
1. Use markdown headers (`#`, `##`)
2. Use bullet points (`-` or `*`)
3. Keep one blank line between sections
4. Check the example format in the modal

### Issue: Performance metrics not showing

**Solution**:
1. Performance is recorded when tasks complete
2. Move tasks to "Done" status first
3. Metrics appear after 24 hours (give system time to calculate)

---

## Advanced Features

### Custom Skill Categories

Create your own skill categories by adding custom names:
- `Python` (for backend Python work)
- `AWS` (for cloud infrastructure)
- `GraphQL` (for GraphQL APIs)
- `Figma` (for design work)

The system is flexible - any skill name works!

### Proficiency Levels Explained

- **Level 1 (Beginner)**: Can do simple tasks with guidance
- **Level 2 (Intermediate)**: Can work independently on routine tasks
- **Level 3 (Proficient)**: Solid understanding, can tackle complex tasks
- **Level 4 (Advanced)**: Expert-level, can handle critical/complex work
- **Level 5 (Expert)**: Master level, can mentor others

### Performance Tracking

The system tracks:
- **Completion time**: Hours from "In Progress" to "Done"
- **Quality rating**: Subjective rating of work quality (1-5 stars)
- **Notes**: Free-form notes about the work

Use this data to:
- Identify top performers
- Find areas for improvement
- Balance workload fairly
- Estimate future work

---

## Video Tutorials (Coming Soon)

1. Complete Feature Overview (5 min)
2. Creating Tasks from Issues (2 min)
3. Managing Agent Skills (3 min)
4. Understanding Dependencies (2 min)

---

## Support

**Questions?** Check:
1. Main README.md
2. TASK_BREAKDOWN_FEATURE.md (detailed docs)
3. GitHub Issues

**Bug Reports**:
Create an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser console errors

**Feature Requests**:
We'd love to hear your ideas! Open a GitHub issue with the "enhancement" label.

---

## What's Next?

After you're comfortable with the basics:

1. **Experiment with PRD mode**: Try breaking down a full product spec
2. **Build a skill library**: Document all skills your team needs
3. **Track trends**: Watch performance metrics over time
4. **Optimize workflows**: Refine your task breakdown process

Enjoy the feature! 🚀
