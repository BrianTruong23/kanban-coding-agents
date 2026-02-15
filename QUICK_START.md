# Quick Start Guide - Orchestration Features

## New Features Overview

Three powerful new features have been added to your Kanban board:

### 1. 🤖 Auto Breakdown
**What it does**: Automatically breaks down issues, PRDs, or screenshots into structured tasks

**How to use**:
1. Click the **"✨ Auto Breakdown"** button (purple gradient)
2. Paste your issue/PRD content
3. Click "Generate Breakdown"
4. Review epics, tickets, and subtasks with DoD, test notes, and risk flags
5. Click "Apply Breakdown to Board"

**Example Input**:
```
## Epic: Add Payment Processing

### Ticket 1: Stripe Integration
- Set up Stripe account
- Implement payment API
- Add webhook handlers

### Ticket 2: Payment UI
- Create checkout form
- Add payment confirmation page
```

### 2. 👥 Agent Roster
**What it does**: Manage agent skills, performance, and availability for smart auto-assignment

**How to use**:
1. Click the **"👥 Agents"** button (blue)
2. Select an agent from the list
3. Add skills with levels (Beginner → Expert)
4. Track performance metrics (Quality, Delivery, Collaboration)
5. Set availability (timezone, hours, days off)

**Benefits**:
- Know who's best for each task
- Track team performance
- Balance workload effectively

### 3. 🔗 Dependency Graph
**What it does**: Visualize task relationships and dependencies

**How to use**:
1. Click the **"🔗 Dependencies"** button (purple)
2. Pan: Click and drag
3. Zoom: Use +/- buttons or mouse wheel
4. Hover: See task details
5. Close: Click X or outside

**Colors**:
- 🔵 Blue: "depends-on" 
- 🔴 Red: "blocks"
- ⚫ Gray: "related-to"

## Quick Demo Workflow

1. **Create tasks automatically**:
   - Click "Auto Breakdown"
   - Paste: "Add user authentication with login, signup, and password reset"
   - Generate and apply

2. **Assign agents intelligently**:
   - Click "Agents"
   - Add Bob's skills: "React (Expert), Authentication (Advanced)"
   - System will suggest Bob for auth tasks

3. **View dependencies**:
   - Click "Dependencies"
   - See that "login" blocks "dashboard"
   - Plan work accordingly

## Key Benefits

✅ **Save Time**: Auto-generate structured tasks instead of manual creation
✅ **Reduce Risk**: Automatic risk detection and flagging
✅ **Better Assignments**: Data-driven agent selection
✅ **Clear Planning**: Visual dependency tracking
✅ **Quality Standards**: Consistent DoD and acceptance criteria
✅ **Team Insights**: Performance metrics and workload balance

## Files Added

Core functionality exists in these files:
- `src/components/TaskBreakdownPanel.tsx` - Breakdown UI
- `src/components/AgentRosterPanel.tsx` - Agent management UI
- `src/components/DependencyGraph.tsx` - Visualization
- `src/lib/taskBreakdownService.ts` - Parsing logic
- `src/lib/agentOrchestrationService.ts` - Assignment logic
- `src/types/taskBreakdown.ts` - Type definitions
- `src/types/agentOrchestration.ts` - Type definitions

## Documentation

- `FEATURE_ORCHESTRATION.md` - Comprehensive feature guide
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `UI_CHANGES.md` - User interface documentation
- `QUICK_START.md` - This file

## Need Help?

Check out the detailed guides:
- For features: `FEATURE_ORCHESTRATION.md`
- For UI: `UI_CHANGES.md`
- For implementation: `IMPLEMENTATION_SUMMARY.md`

Happy tasking! 🚀
