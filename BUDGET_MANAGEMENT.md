# Budget and Resource Management for Agent Tasks

This document describes the budget and resource management system implemented for tracking and controlling costs, tokens, time, and retries for agent tasks.

## Overview

The budget management system allows project managers to:
- Set cost, token, time, and retry budgets for individual tasks
- Track resource usage in real-time
- Receive alerts when budgets approach limits (75%, 90%, 100%)
- Automatically pause tasks when budgets are exceeded
- View comprehensive dashboards showing spend vs. progress
- Manually pause and resume tasks

## Features

### 1. Budget Types

Each task can have budgets set for:
- **Cost Budget**: Maximum cost in USD for task completion
- **Token Budget**: Maximum number of tokens the agent can use
- **Time Budget**: Maximum time in minutes for task execution
- **Retry Budget**: Maximum number of retries allowed for the task

### 2. Automatic Monitoring

The system automatically:
- Tracks usage as it occurs
- Calculates remaining budgets
- Generates alerts at 75%, 90%, and 100% thresholds
- Pauses tasks when any budget is exceeded
- Updates task status in real-time

### 3. PM Dashboard

A dedicated PM view provides:
- **Summary Cards**: Overview of total tasks, cost usage, token usage, and time usage
- **Active Alerts**: Real-time notifications of budget warnings and exceeds
- **Budget List**: Detailed view of all task budgets with progress bars
- **Budget Creation**: Easy interface to create budgets for tasks
- **Task Control**: Pause and resume tasks as needed

### 4. Budget Enforcement

Budget enforcement utilities provide:
- Pre-execution checks to verify if tasks can run
- Remaining budget calculations
- Usage percentage tracking
- Budget health status monitoring
- Affordability checks for proposed usage

## Database Schema

### Tables

#### `budgets`
Stores budget limits and current usage for each task.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- task_id: UUID (foreign key to tasks, unique)
- max_cost: NUMERIC (nullable, in USD)
- max_tokens: BIGINT (nullable)
- max_time: INTEGER (nullable, in minutes)
- max_retries: INTEGER (default 3)
- current_cost: NUMERIC (default 0)
- current_tokens: BIGINT (default 0)
- current_time: INTEGER (default 0)
- current_retries: INTEGER (default 0)
- status: TEXT ('active', 'paused', 'exceeded', 'completed')
- paused_reason: TEXT (nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `budget_usage`
Records individual usage events for audit and tracking.

```sql
- id: UUID (primary key)
- budget_id: UUID (foreign key to budgets)
- task_id: UUID (foreign key to tasks)
- user_id: UUID (foreign key to auth.users)
- cost: NUMERIC (default 0)
- tokens: BIGINT (default 0)
- time: INTEGER (default 0, in minutes)
- operation: TEXT (description of operation)
- agent_id: UUID (foreign key to agents, nullable)
- metadata: JSONB (additional context)
- timestamp: TIMESTAMP
```

#### `budget_alerts`
Stores alerts generated when budgets approach or exceed limits.

```sql
- id: UUID (primary key)
- budget_id: UUID (foreign key to budgets)
- task_id: UUID (foreign key to tasks)
- user_id: UUID (foreign key to auth.users)
- type: TEXT ('warning', 'critical', 'exceeded')
- category: TEXT ('cost', 'tokens', 'time', 'retries')
- message: TEXT
- threshold: INTEGER (percentage)
- current_value: NUMERIC
- max_value: NUMERIC
- acknowledged: BOOLEAN (default false)
- created_at: TIMESTAMP
```

### Triggers

#### `update_budget_on_usage_insert`
Automatically updates budget current values and generates alerts when new usage is recorded.

## Setup Instructions

### 1. Database Setup

Run the budget schema migration in your Supabase SQL Editor:

```bash
# Navigate to Supabase SQL Editor and execute:
database/budget_schema.sql
```

This will create:
- All budget-related tables
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic budget updates

### 2. Usage Examples

#### Creating a Budget for a Task

```typescript
import { useBudgets } from '@/hooks/useBudgets';

const { createBudget } = useBudgets();

// Create a budget with cost and token limits
await createBudget({
  taskId: 'task-uuid',
  maxCost: 50.00,           // $50 maximum
  maxTokens: 100000,        // 100k tokens maximum
  maxTime: 120,             // 120 minutes maximum
  maxRetries: 3,            // 3 retries maximum
  currentCost: 0,
  currentTokens: 0,
  currentTime: 0,
  currentRetries: 0,
  status: 'active',
});
```

#### Recording Usage

```typescript
import { useBudgets } from '@/hooks/useBudgets';

const { addUsage } = useBudgets();

// Record usage after an agent operation
await addUsage({
  budgetId: 'budget-uuid',
  taskId: 'task-uuid',
  cost: 2.50,               // $2.50 spent
  tokens: 5000,             // 5k tokens used
  time: 10,                 // 10 minutes elapsed
  operation: 'Code generation for authentication module',
  agentId: 'agent-uuid',    // Optional: which agent performed this
  metadata: {               // Optional: additional context
    model: 'gpt-4',
    prompts: 3,
  },
});
```

#### Checking Budget Before Execution

```typescript
import { canExecuteTask, canAffordUsage } from '@/lib/budgetEnforcement';

// Check if task can execute
const { allowed, reason } = canExecuteTask(budget);
if (!allowed) {
  console.error(`Cannot execute task: ${reason}`);
  return;
}

// Check if proposed usage fits within budget
const affordability = canAffordUsage(budget, {
  cost: 5.00,
  tokens: 10000,
  time: 15,
});

if (!affordability.canAfford) {
  console.error(`Cannot afford this operation: ${affordability.reason}`);
  return;
}
```

#### Pausing and Resuming Tasks

```typescript
import { useBudgets } from '@/hooks/useBudgets';

const { pauseTask, resumeTask } = useBudgets();

// Pause a task
await pauseTask('budget-uuid', 'Waiting for approval');

// Resume a task
await resumeTask('budget-uuid');
```

#### Getting Budget Summary

```typescript
import { useBudgets } from '@/hooks/useBudgets';

const { getBudgetSummary } = useBudgets();

const summary = getBudgetSummary();
console.log(summary);
/*
{
  totalTasks: 10,
  activeBudgets: 7,
  pausedBudgets: 2,
  exceededBudgets: 1,
  totalCostBudget: 500.00,
  totalCostUsed: 234.50,
  totalTokensBudget: 1000000,
  totalTokensUsed: 456789,
  totalTimeBudget: 600,
  totalTimeUsed: 234,
  alerts: [...],
}
*/
```

## User Interface

### Accessing the PM Dashboard

1. Navigate to the main application
2. Click the "PM View" toggle in the header (next to "Kanban")
3. The PM Dashboard will display with:
   - Summary statistics cards
   - Active budget alerts
   - List of all task budgets with progress bars
   - Controls to pause/resume tasks

### Creating a Budget

1. In the PM Dashboard, click "Create Budget"
2. Select a task from the dropdown
3. Set budget limits (all optional):
   - Max Cost (USD)
   - Max Tokens
   - Max Time (minutes)
   - Max Retries
4. Click "Create Budget"

### Managing Budgets

- **View Progress**: Progress bars show usage for each budget dimension
- **Pause Task**: Click the pause icon to manually pause a task
- **Resume Task**: Click the play icon to resume a paused task
- **Acknowledge Alerts**: Click the X on alerts to acknowledge them

## Alert Thresholds

The system generates alerts at these thresholds:

- **75% (Warning)**: Yellow alert when any budget dimension reaches 75%
- **90% (Critical)**: Orange alert when any budget dimension reaches 90%
- **100% (Exceeded)**: Red alert when any budget dimension is exceeded, task automatically paused

## Best Practices

1. **Set Realistic Budgets**: Base budgets on historical data and task complexity
2. **Monitor Regularly**: Check the PM Dashboard frequently to catch issues early
3. **Acknowledge Alerts**: Keep alert list clean by acknowledging resolved items
4. **Use Metadata**: Add context to usage records for better tracking
5. **Review Exceeded Tasks**: Investigate why budgets were exceeded before increasing limits
6. **Adjust as Needed**: Update budgets based on actual usage patterns

## API Reference

### Hooks

#### `useBudgets()`
Main hook for budget management.

**Returns:**
```typescript
{
  budgets: Budget[],
  alerts: BudgetAlert[],
  createBudget: (budget) => Promise<Budget>,
  updateBudget: (budget) => Promise<void>,
  deleteBudget: (id) => Promise<void>,
  addUsage: (usage) => Promise<BudgetUsage>,
  acknowledgeAlert: (id) => Promise<void>,
  pauseTask: (budgetId, reason) => Promise<void>,
  resumeTask: (budgetId) => Promise<void>,
  getBudgetSummary: () => BudgetSummary,
  isLoaded: boolean,
}
```

### Utility Functions

See `/src/lib/budgetEnforcement.ts` for:
- `canExecuteTask(budget)`: Check if task can execute
- `getRemainingBudget(budget)`: Calculate remaining budget
- `getBudgetUsagePercentage(budget)`: Get usage percentages
- `isBudgetApproachingLimit(budget, threshold)`: Check if near limit
- `getBudgetHealth(budget)`: Get health status
- `canAffordUsage(budget, proposedUsage)`: Check affordability

## Troubleshooting

### Budget not updating after usage
- Check that the database trigger is properly installed
- Verify RLS policies allow the user to update budgets
- Check browser console for errors

### Alerts not appearing
- Ensure budget limits are set (alerts only trigger when limits exist)
- Check that usage is being recorded correctly
- Verify alerts table has proper RLS policies

### Task not pausing when budget exceeded
- Confirm the trigger function is executing
- Check budget status in the database
- Verify the PM Dashboard is refreshing properly

## Future Enhancements

Potential improvements to the budget system:

- Budget templates for common task types
- Predictive analytics for budget forecasting
- Email/Slack notifications for alerts
- Budget approval workflows
- Historical trend analysis
- Cost optimization recommendations
- Multi-currency support
- Budget rollover/reset capabilities

## Support

For issues or questions about the budget management system, please:
1. Check this documentation
2. Review the database schema and constraints
3. Examine the browser console for errors
4. Check Supabase logs for backend issues
5. Open an issue on the project repository
