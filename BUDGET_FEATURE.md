# Budget and Resource Management Feature

This document describes the budgeting and resource management system for agent tasks in the Kanban Coding Agents application.

## Overview

The budget management system allows you to:
- Set cost, token, and time budgets for individual tasks
- Track resource usage in real-time
- Automatically pause tasks when budgets are exceeded
- Monitor spending and progress through a PM Dashboard
- Configure retry limits for failed tasks
- Receive alerts when budgets reach warning thresholds

## Features

### 1. Task Budgets

Each task can have the following budget limits:

- **Maximum Cost** (USD): Cap on dollar amount spent
- **Maximum Tokens**: Limit on API tokens consumed
- **Maximum Time** (seconds): Time limit for task execution
- **Maximum Retries**: Number of retry attempts allowed on failure

### 2. Budget Status

Tasks can have the following budget statuses:

- **Active**: Task is running and within budget limits
- **Paused**: Task has been manually paused by user
- **Exceeded**: One or more budget limits have been exceeded
- **Completed**: Task has finished successfully

### 3. PM Dashboard

The Project Manager Dashboard provides:

#### Overview Tab
- Total spend across all tasks
- Total tokens consumed
- Total time spent
- Average metrics per task
- Task status breakdown (active, paused, exceeded, completed)

#### Task Budgets Tab
- List of all tasks with budgets
- Progress bars for cost, tokens, and time
- Retry count tracking
- Quick pause/resume controls
- Visual indicators for budget health

#### Alerts Tab
- Warning alerts at 75% budget usage
- Critical alerts at 90% budget usage
- Exceeded alerts at 100% budget usage
- Dismissible alert notifications

### 4. Budget Enforcement

The system automatically:

- **Prevents execution** when budgets are exceeded
- **Pauses tasks** that reach 100% of any limit
- **Generates alerts** at warning thresholds
- **Tracks retry attempts** and enforces retry limits
- **Logs all usage** for audit and analysis

### 5. Usage Logging

Every operation is logged with:
- Timestamp
- Cost incurred
- Tokens consumed
- Time spent
- Operation type (api_call, retry, completion, pause)
- Optional notes

## Database Schema

### Tables

1. **task_budgets** - Stores budget limits and current usage for each task
2. **budget_usage_logs** - Logs every resource usage event
3. **project_budgets** - Overall project-level budgets (optional)
4. **budget_alerts** - Stores triggered alerts

### Key Fields

**task_budgets:**
- `max_cost`, `max_tokens`, `max_time` - Budget limits
- `current_cost`, `current_tokens`, `current_time` - Current usage
- `retry_count`, `max_retries` - Retry tracking
- `status` - Current budget status

**budget_usage_logs:**
- `cost`, `tokens`, `time_spent` - Resource usage per operation
- `operation` - Type of operation
- `notes` - Additional context

## Setup Instructions

### 1. Database Migration

Run the budget schema SQL in your Supabase SQL Editor:

```bash
# File: database/budget_schema.sql
```

This creates all necessary tables, indexes, policies, and triggers.

### 2. Enable Row Level Security

The schema automatically enables RLS policies so users can only access their own budgets and logs.

### 3. Install Dependencies

No additional dependencies required - uses existing project stack.

## Usage Guide

### Setting a Budget for a Task

1. **Via Kanban Board:**
   - Hover over any task card
   - Click the dollar sign ($) icon that appears
   - Enter budget limits in the modal
   - Click "Create Budget" or "Update Budget"

2. **Programmatically:**
   ```typescript
   import { useBudgets } from '@/hooks/useBudgets';

   const { createBudget } = useBudgets();

   await createBudget(taskId, {
     maxCost: 10.00,        // $10 limit
     maxTokens: 100000,     // 100k tokens
     maxTime: 1800,         // 30 minutes (in seconds)
     maxRetries: 3          // 3 retry attempts
   });
   ```

### Tracking Task Execution

Use the `TaskExecutionTracker` component:

```typescript
import { TaskExecutionTracker } from '@/components/TaskExecutionTracker';

<TaskExecutionTracker
  task={task}
  onStatusChange={(status) => console.log('Status:', status)}
/>
```

Features:
- Start/Pause/Resume controls
- Real-time execution timer
- Budget status indicator
- Automatic enforcement of limits
- Complete/Fail tracking with retry management

### Logging Resource Usage

```typescript
import { useBudgets } from '@/hooks/useBudgets';

const { logUsage } = useBudgets();

await logUsage({
  taskId: task.id,
  cost: 0.25,           // $0.25
  tokens: 1500,         // 1500 tokens
  timeSpent: 30,        // 30 seconds
  operation: 'api_call',
  notes: 'OpenAI API call for code generation'
});
```

This automatically:
- Updates the task budget's current usage
- Checks if limits are exceeded
- Triggers alerts if thresholds are reached
- Creates a log entry for audit

### Viewing PM Dashboard

1. Navigate to the main application
2. Click the "PM" button in the header to switch views
3. Use the tabs to navigate:
   - **Overview**: High-level metrics
   - **Task Budgets**: Detailed budget tracking per task
   - **Alerts**: Active budget warnings

### Managing Budget Alerts

Alerts are automatically created when:
- 75% of any limit is reached (Warning)
- 90% of any limit is reached (Critical)
- 100% of any limit is reached (Exceeded)

To dismiss an alert:
- Go to PM Dashboard → Alerts tab
- Click "Dismiss" on the alert

### Pausing and Resuming Tasks

**Manually:**
- PM Dashboard → Task Budgets → Click pause/resume button

**Programmatically:**
```typescript
const { pauseTask, resumeTask } = useBudgets();

await pauseTask(budgetId);  // Pause
await resumeTask(budgetId); // Resume
```

**Automatically:**
- Tasks are automatically paused when any budget limit is exceeded
- They must be manually resumed after increasing limits or resolving issues

## Budget Enforcement Logic

The `BudgetEnforcer` class provides:

### canExecute()
Checks if a task can run based on current budget status.

```typescript
import { BudgetEnforcer } from '@/lib/budgetEnforcement';

const result = BudgetEnforcer.canExecute(budget);
if (!result.allowed) {
  console.log('Cannot execute:', result.reason);
  console.log('Exceeded limits:', result.exceededLimits);
}
```

### getBudgetStatus()
Returns current budget health status and color.

```typescript
const { status, color } = BudgetEnforcer.getBudgetStatus(budget);
// status: 'healthy' | 'warning' | 'critical' | 'exceeded'
// color: 'green' | 'yellow' | 'orange' | 'red'
```

### hasEnoughBudget()
Estimates if there's enough budget for a planned operation.

```typescript
const canAfford = BudgetEnforcer.hasEnoughBudget(
  budget,
  estimatedCost,
  estimatedTokens,
  estimatedTime
);
```

## API Reference

### useBudgets Hook

```typescript
const {
  budgets,              // Array of all task budgets
  alerts,               // Array of unacknowledged alerts
  isLoaded,             // Loading state
  createBudget,         // Create new budget
  updateBudget,         // Update existing budget
  logUsage,             // Log resource usage
  pauseTask,            // Pause a task
  resumeTask,           // Resume a task
  incrementRetry,       // Increment retry counter
  acknowledgeAlert,     // Dismiss an alert
  getBudgetMetrics,     // Get aggregate metrics
  getBudgetForTask,     // Get budget for specific task
} = useBudgets();
```

### Components

- **PMDashboard** - Full PM dashboard with metrics and task management
- **BudgetModal** - Modal for creating/editing task budgets
- **TaskExecutionTracker** - Real-time task execution with budget enforcement

## Best Practices

1. **Set Realistic Limits**
   - Start with generous limits and adjust based on actual usage
   - Monitor the PM Dashboard to understand typical consumption

2. **Use All Limit Types**
   - Cost limits prevent overspending
   - Token limits prevent API abuse
   - Time limits prevent runaway tasks
   - Retry limits prevent infinite loops

3. **Monitor Alerts**
   - Check the Alerts tab regularly
   - Address warnings before they become critical
   - Investigate why budgets are being exceeded

4. **Log Usage Accurately**
   - Log all significant operations
   - Include detailed notes for audit trails
   - Use consistent operation types

5. **Review Metrics**
   - Use average metrics to set future budgets
   - Identify tasks that consistently exceed limits
   - Optimize high-cost operations

## Troubleshooting

### Task Won't Start

**Problem:** "Cannot start task: Budget limits exceeded"

**Solution:**
1. Check PM Dashboard → Task Budgets
2. Identify which limit is exceeded
3. Either:
   - Increase the limit via budget modal
   - Reset current usage if this is a new attempt
   - Wait for resources to free up

### Alerts Not Appearing

**Problem:** No alerts shown despite high usage

**Solution:**
1. Check that budget limits are set
2. Verify usage is being logged correctly
3. Ensure alerts table has proper permissions
4. Check browser console for errors

### Budget Not Updating

**Problem:** Current usage not increasing

**Solution:**
1. Verify `logUsage()` is being called
2. Check that task ID matches budget task ID
3. Review browser console for API errors
4. Confirm RLS policies allow updates

## Future Enhancements

Potential additions to the budget system:

- [ ] Project-level budget aggregation and limits
- [ ] Budget templates for common task types
- [ ] Historical usage charts and trends
- [ ] Export budget reports to CSV/PDF
- [ ] Email/webhook notifications for alerts
- [ ] Multi-currency support
- [ ] Budget forecasting based on historical data
- [ ] Integration with actual cloud billing APIs

## Related Files

- `/src/types/budget.ts` - TypeScript type definitions
- `/src/hooks/useBudgets.ts` - Budget management hook
- `/src/lib/budgetEnforcement.ts` - Budget enforcement logic
- `/src/components/PMDashboard.tsx` - PM Dashboard component
- `/src/components/BudgetModal.tsx` - Budget creation/edit modal
- `/src/components/TaskExecutionTracker.tsx` - Task execution component
- `/database/budget_schema.sql` - Database schema migration

## Support

For issues or questions:
1. Check this documentation
2. Review the code examples
3. Open a GitHub issue with details
