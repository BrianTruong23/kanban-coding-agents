# Quick Start Guide - Automated Task Breakdown

## Setup

### 1. Database Migration

Run the enhanced schema migration to enable all features:

```bash
# Option 1: Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy content from database/schema-enhanced.sql
4. Run the script

# Option 2: Using Supabase CLI
supabase db push
```

**Note**: See `DATABASE_MIGRATION.md` for detailed migration instructions.

### 2. Verify Installation

After migration, verify the new features are available:

1. Open your application
2. Look for two new buttons in the header:
   - **"Agents"** (purple button) - Opens Agent Roster Manager
   - **"Auto Breakdown"** (blue button) - Opens Task Breakdown Wizard

## Using Auto Breakdown (3 Steps)

### Step 1: Open the Wizard
Click the **"Auto Breakdown"** button in the header.

### Step 2: Input Your Content

Paste your issue, PRD, or requirements. Example:

```markdown
# User Dashboard

## Features
- Display user profile information
- Show recent activity feed
- Add quick action buttons

## Requirements
- Load within 2 seconds
- Responsive design for mobile
- Real-time updates for activity

## Technical Notes
- Use React Query for data fetching
- Implement virtual scrolling for activity feed
- Add loading skeletons

## Risks
- Performance issues with large datasets
- Real-time updates may cause excessive re-renders
```

### Step 3: Review and Create

1. Review the generated tasks (epics, tickets, subtasks)
2. Check the dependency graph
3. Deselect any unwanted tasks
4. Click "Create X Task(s)"

Tasks will appear in your kanban backlog!

## Using Agent Roster (2 Steps)

### Step 1: Open Agent Roster
Click the **"Agents"** button in the header.

### Step 2: Manage Agents

1. **Select an agent** from the sidebar
2. **View their details**:
   - Overview: Status, quality metrics, completed tasks
   - Skills: Expertise and proficiency levels
   - Performance: Detailed performance metrics

## Example Breakdown Input

### Simple Feature

```markdown
# Payment Integration

## Features
- Add Stripe payment form
- Handle payment confirmation
- Send email receipts

## Requirements
- PCI compliance required
- Support multiple currencies
- Retry failed payments

## Technical Notes
- Use Stripe Elements
- Implement webhook handlers
- Store payment records securely

## Risks
- Payment gateway downtime
- Webhook delivery failures
```

**Result**: Creates 1 epic, 3 tickets, ~9 subtasks with proper dependencies.

### Complex Project

```markdown
# E-commerce Platform

## Features
- Product catalog with search and filters
- Shopping cart functionality
- Checkout and payment processing
- Order management dashboard
- User account and authentication
- Email notifications

## Requirements
- Support 10,000+ products
- Sub-second search response
- Mobile-first design
- Multi-currency support
- Inventory tracking
- Order history

## Technical Notes
- Use Elasticsearch for search
- Implement Redis for cart storage
- Stripe for payments
- SendGrid for emails
- Next.js with SSR
- Tailwind CSS for styling

## Risks
- Search performance at scale
- Payment security compliance
- Email deliverability
- Inventory race conditions
```

**Result**: Creates multiple epics, 20+ tickets, 60+ subtasks organized hierarchically.

## Pro Tips

### Better Breakdown Results

1. **Use Clear Sections**: Always include Features, Requirements, Technical Notes, and Risks
2. **Be Specific**: "Add login page" is better than "Authentication"
3. **One Feature Per Line**: Break down complex features into multiple bullet points
4. **Include Context**: Mention technologies, constraints, or business rules

### Agent Assignment

Auto-assignment works best when:
- Agents have skills defined
- Task descriptions include technology keywords
- Agent performance data is up to date

### Dependency Management

- Setup tasks are automatically ordered before implementation
- Testing tasks depend on implementation
- You can manually add dependencies later

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open task breakdown wizard (coming soon) |
| `Esc` | Close any modal |
| `Enter` | Submit forms |

## Common Workflows

### Sprint Planning

1. Create epic for the sprint goal
2. Use Auto Breakdown to generate tickets
3. Review and adjust estimates
4. Assign to agents based on suggestions
5. Order by dependencies

### Bug Triage

1. Paste bug report into wizard
2. Set source type to "Issue"
3. Review risk flags
4. Adjust priority
5. Assign to agent with relevant skills

### Feature Development

1. Break down feature into tasks
2. Review Definition of Done
3. Check test notes
4. Assign based on skills
5. Track progress on kanban

## Troubleshooting

### "No tasks created"
- Check your input has clear sections with `##` headers
- Ensure you have at least one feature listed
- Try the example format above

### "Auto Breakdown button not visible"
- Verify database migration was successful
- Clear browser cache
- Check browser console for errors

### "Agents not showing"
- Ensure you have created agents first
- Check agent table has data
- Verify RLS policies are correct

## Next Steps

1. Read the full feature documentation: `FEATURE_AUTOMATED_TASK_BREAKDOWN.md`
2. Review database migration details: `DATABASE_MIGRATION.md`
3. Experiment with different input formats
4. Customize scoring weights for agent matching
5. Add skills to your agents for better auto-assignment

## Need Help?

- Check the detailed documentation files
- Review example breakdowns in this guide
- Test with the simple examples first
- Open an issue if you encounter bugs

## Feature Checklist

After setup, you should be able to:

- [ ] Open the Auto Breakdown wizard
- [ ] Paste content and see it parsed into sections
- [ ] Generate tasks with DoD, test notes, and risks
- [ ] View dependency graph
- [ ] Create tasks in backlog
- [ ] Open Agent Roster Manager
- [ ] View agent skills and performance
- [ ] See auto-assignment suggestions (when agents have skills)

If all checkboxes pass, you're ready to use the feature! 🎉
