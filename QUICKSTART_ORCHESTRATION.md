# Quick Start: Task Orchestration

Get started with the task orchestration features in 5 minutes.

## 1. Access the Dashboard

From the main kanban board, click the **"Task Orchestration"** button in the header (purple gradient button with sparkle icon).

## 2. Break Down Your First Task

### Try This Example:

1. Click the **Task Breakdown** tab
2. Select **"Text"** as input type
3. Paste this example:

```
## Payment Integration

Implement Stripe payment processing with the following features:

- Credit card payment processing
- Subscription management
- Invoice generation
- Refund handling
- Webhook integration for payment events

This is a high priority feature with security considerations.
```

4. Click **"Generate Breakdown"**

### What You'll See:

- **1 Epic**: "Payment Integration" (High priority, ~40h estimated)
- **5 Tickets**: One for each feature
  - Each with Definition of Done
  - Test notes
  - Risk flags (CRITICAL for security)
  - Estimated effort
  - Recommended agent assignments
- **10-15 Subtasks**: Implementation steps
- **Dependencies**: Identified relationships

## 3. Explore Agent Roster

1. Click the **Agent Roster** tab
2. See workload distribution across all agents
3. Click on any agent (e.g., "Sarah Johnson")
4. View:
   - Performance metrics (tasks completed, quality score)
   - Current workload and capacity
   - Skills and expertise levels
5. Try adding a skill:
   - Click "Add Skill"
   - Enter "Stripe Integration"
   - Select category: "Backend"
   - Select level: "Advanced"
   - Click "Add"

## 4. View Dependencies

1. Go back to **Task Breakdown** and generate a breakdown (if you haven't)
2. Click the **Dependencies** tab
3. See the visual graph showing:
   - Purple boxes: Epics
   - Blue boxes: Tickets
   - Green boxes: Subtasks
   - Arrows: Dependencies (red = blocks, blue = requires)
4. Click on nodes to select them
5. Look for circular dependency warnings (if any)

## 5. Understanding Auto-Assignment

When you generate a breakdown, notice the **"Recommended Agent"** section for each ticket:

- **Match Percentage**: How well the agent's skills match (0-100%)
- **Reasons**: Why this agent was recommended
  - "Strong skill match (95%)"
  - "Excellent performance history (90%)"
  - "Good availability (60% capacity)"

The system considers:
- Agent skills vs. task requirements (50% weight)
- Past performance and quality (25% weight)
- Current availability and workload (25% weight)

## Real-World Use Cases

### Use Case 1: Sprint Planning

**Input:** Your sprint PRD or issue list

**Output:**
- Structured work breakdown
- Effort estimates for sprint capacity
- Agent assignments to balance workload
- Dependencies to plan execution order

### Use Case 2: Feature Scoping

**Input:** New feature requirements

**Output:**
- Breakdown into manageable tickets
- Risk identification upfront
- Test scenarios to consider
- Effort estimation for planning

### Use Case 3: Team Capacity Planning

**Input:** Multiple features to implement

**Output:**
- Workload distribution across agents
- Identify over-allocated agents
- Balance assignments based on skills
- Track team capacity usage

## Tips for Best Results

### ✅ DO:

- Provide detailed requirements with technical context
- Use keywords: "security", "database", "API", "urgent", "critical"
- Structure with headers and bullet points
- Mention specific technologies (React, PostgreSQL, etc.)

### ❌ DON'T:

- Be too vague ("make it better")
- Skip technical details
- Use unclear priorities
- Forget to mention constraints

### Example Comparison:

**Bad Input:**
```
Add login functionality
```

**Good Input:**
```
## User Authentication System

Implement secure authentication with the following:
- Email/password login with validation
- JWT token-based session management
- Password reset flow via email
- Rate limiting on login attempts
- Security: CSRF protection required

Priority: High (needed for Q1 launch)
```

## Keyboard Shortcuts

- `Tab`: Navigate between input fields
- `Ctrl/Cmd + Enter`: Generate breakdown (when in textarea)
- `Esc`: Close modals and panels

## Common Questions

**Q: Can I edit the generated breakdown?**
A: Currently, the breakdown is view-only. You can import it to the kanban board where you can edit individual tasks.

**Q: How accurate are the effort estimates?**
A: Estimates are based on task complexity keywords. They improve with team-specific calibration over time.

**Q: Can I customize the auto-assignment algorithm?**
A: Yes, you can adjust weights for skill matching, performance, and workload balancing in the code.

**Q: What if an agent is over-capacity?**
A: The system automatically reduces their assignment priority and suggests agents with more capacity.

**Q: How do I handle circular dependencies?**
A: The dependency graph will warn you. Review and break the cycle by reordering or restructuring tasks.

## Next Steps

1. **Try with Real Data**: Use an actual issue or PRD from your project
2. **Customize Agent Skills**: Update agent profiles to match your team
3. **Track Performance**: As tasks complete, performance metrics will improve assignment accuracy
4. **Review Dependencies**: Check dependency graphs before starting sprints
5. **Iterate**: Refine your requirements based on generated breakdowns

## Need Help?

- Read [ORCHESTRATION.md](./ORCHESTRATION.md) for complete documentation
- Check [ORCHESTRATION_EXAMPLES.md](./ORCHESTRATION_EXAMPLES.md) for more examples
- See inline code comments for technical details

## Pro Tips

1. **Use the Same Agent for Related Tasks**: The system will recognize this and maintain consistency
2. **Update Skills Regularly**: As agents learn new technologies, add them to their profile
3. **Monitor Workload Distribution**: Prevent burnout by balancing assignments
4. **Review Risk Flags**: Pay special attention to CRITICAL and HIGH risk items
5. **Check Dependencies Early**: Identify blockers before starting work

---

Happy orchestrating! 🚀
